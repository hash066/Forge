"""
Bedrock provider — Claude (Sonnet) via the AWS SDK, kept as a swappable backend.

Boto3 is synchronous, so calls are marshalled through anyio's thread pool to
preserve the async surface. This is the refactor of the original standalone
``bedrock.py`` module, now conforming to the shared ``AIProvider`` protocol.
"""

from __future__ import annotations

import json as jsonlib  # aliased: the protocol's ``json`` bool param shadows the module
from typing import Any

import anyio
import structlog
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import Settings
from app.services.ai.base import AIProviderError, AIResult, BaseAIProvider, extract_json

logger = structlog.get_logger(__name__)

try:
    import boto3

    _BOTO_IMPORT_ERROR: Exception | None = None
except Exception as exc:  # pragma: no cover
    boto3 = None  # type: ignore[assignment]
    _BOTO_IMPORT_ERROR = exc


class BedrockProvider(BaseAIProvider):
    name = "bedrock"

    def __init__(self, settings: Settings) -> None:
        if boto3 is None:
            raise AIProviderError(f"boto3 unavailable: {_BOTO_IMPORT_ERROR}")
        self._client = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        self._default_model_id = settings.aws_bedrock_model_id

    @retry(
        retry=retry_if_exception_type(AIProviderError),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        stop=stop_after_attempt(3),
        reraise=True,
    )
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
        used = model_id or self._default_model_id
        body: dict[str, Any] = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            body["system"] = system

        try:
            raw = await anyio.to_thread.run_sync(
                lambda: self._client.invoke_model(
                    modelId=used,
                    body=jsonlib.dumps(body),
                    contentType="application/json",
                    accept="application/json",
                ),
            )
        except Exception as exc:
            logger.exception("bedrock.invoke_failed", model=used, error=str(exc))
            raise AIProviderError(str(exc)) from exc

        payload = jsonlib.loads(raw["body"].read())
        text = self._extract_text(payload)
        usage = payload.get("usage", {})
        return AIResult(
            text=text,
            json_payload=extract_json(text),
            input_tokens=int(usage.get("input_tokens", 0)),
            output_tokens=int(usage.get("output_tokens", 0)),
            model_id=used,
            provider=self.name,
        )

    @staticmethod
    def _extract_text(payload: dict[str, Any]) -> str:
        for block in payload.get("content") or []:
            if block.get("type") == "text" and "text" in block:
                return str(block["text"])
        return ""
