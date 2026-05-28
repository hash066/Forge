"""
OpenAI provider — the default brain for DevForge OS.

Uses the async OpenAI SDK against the Chat Completions API. Written
defensively: model families differ in which parameters they accept
(reasoning models use ``max_completion_tokens`` and reject custom
``temperature``; some reject ``response_format``). Rather than hard-code a
single shape, we try a sequence of progressively-degraded request variants and
keep the first that succeeds. JSON is recovered from the text regardless, so
structured endpoints stay robust.
"""

from __future__ import annotations

from typing import Any

import structlog

from app.config import Settings
from app.services.ai.base import AIProviderError, AIResult, BaseAIProvider, extract_json

logger = structlog.get_logger(__name__)

try:  # SDK is optional at import time so the app boots without it
    from openai import (
        APIConnectionError,
        APIError,
        AsyncOpenAI,
        BadRequestError,
        RateLimitError,
    )

    _OPENAI_IMPORT_ERROR: Exception | None = None
except Exception as exc:  # pragma: no cover - exercised only when SDK missing
    AsyncOpenAI = None  # type: ignore[assignment,misc]
    APIError = APIConnectionError = RateLimitError = BadRequestError = Exception  # type: ignore[misc,assignment]
    _OPENAI_IMPORT_ERROR = exc


class OpenAIProvider(BaseAIProvider):
    name = "openai"

    def __init__(self, settings: Settings) -> None:
        if AsyncOpenAI is None:
            raise AIProviderError(f"openai SDK unavailable: {_OPENAI_IMPORT_ERROR}")
        if not settings.openai_api_key:
            raise AIProviderError("OPENAI_API_KEY is not set")
        client_kwargs: dict[str, Any] = {"api_key": settings.openai_api_key}
        if settings.openai_base_url:
            client_kwargs["base_url"] = settings.openai_base_url
        self._client = AsyncOpenAI(**client_kwargs)
        self._model = settings.openai_model

    async def generate(
        self,
        prompt: str,
        *,
        system: str | None = None,
        max_tokens: int = 2048,
        temperature: float = 0.3,
        json: bool = False,
        model_id: str | None = None,
    ) -> AIResult:
        used = model_id or self._model
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        base: dict[str, Any] = {"model": used, "messages": messages}
        json_base = dict(base)
        if json:
            json_base["response_format"] = {"type": "json_object"}

        # Ordered from "most modern / most constrained" to "lowest common
        # denominator". The first variant that the chosen model accepts wins.
        variants: list[dict[str, Any]] = [
            {**json_base, "max_completion_tokens": max_tokens, "temperature": temperature},
            {**json_base, "max_completion_tokens": max_tokens},
            {**json_base, "max_tokens": max_tokens, "temperature": temperature},
            {**json_base, "max_tokens": max_tokens},
            dict(json_base),
        ]
        if json:
            # Final fallbacks without response_format (model may not support it);
            # extract_json still recovers the object from raw text.
            variants.extend(
                [
                    {**base, "max_completion_tokens": max_tokens},
                    {**base, "max_tokens": max_tokens},
                    dict(base),
                ]
            )

        last_err: Exception | None = None
        resp = None
        for kw in variants:
            try:
                resp = await self._client.chat.completions.create(**kw)
                break
            except (BadRequestError, TypeError) as exc:  # unsupported param → degrade
                last_err = exc
                continue
            except (APIConnectionError, RateLimitError, APIError) as exc:  # transport
                logger.warning("openai.transport_error", error=str(exc))
                raise AIProviderError(str(exc)) from exc

        if resp is None:
            raise AIProviderError(
                f"OpenAI rejected all request variants for model {used!r}: {last_err}"
            )

        choice = resp.choices[0]
        text = (choice.message.content or "") if choice.message else ""
        usage = getattr(resp, "usage", None)
        return AIResult(
            text=text,
            json_payload=extract_json(text),
            input_tokens=int(getattr(usage, "prompt_tokens", 0) or 0),
            output_tokens=int(getattr(usage, "completion_tokens", 0) or 0),
            model_id=used,
            provider=self.name,
        )
