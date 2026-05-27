"""
Bedrock client — async wrapper around the AWS SDK.

This refactors the original `backend/services/bedrock_service.py` to:
  - run inside FastAPI's event loop without blocking (anyio thread pool)
  - support multiple models (Claude Sonnet 4 default; pluggable for failover)
  - extract JSON robustly from model output (handles ```json fences)
  - retry on transient errors (Bedrock occasionally throttles)
  - feed structured logs + per-tenant cost accounting

Prompts are loaded from `app/services/prompts.py` rather than baked in here —
that keeps this module about transport, prompts about content.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

import anyio
import boto3
import structlog
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import get_settings

logger = structlog.get_logger(__name__)


class BedrockError(Exception):
    """Raised when Bedrock fails after retries."""


@dataclass(frozen=True, slots=True)
class BedrockResult:
    """Structured result — text + parsed JSON (if extractable) + token usage."""

    text: str
    json_payload: dict[str, Any] | None
    input_tokens: int
    output_tokens: int
    model_id: str


class BedrockClient:
    """
    Thin async-friendly wrapper. Boto3 is sync, so we marshal calls through
    anyio's thread pool — preserves the async surface area for callers.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._client = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        self._default_model_id = settings.aws_bedrock_model_id

    @retry(
        retry=retry_if_exception_type(BedrockError),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def invoke(
        self,
        prompt: str,
        *,
        system: str | None = None,
        max_tokens: int = 2048,
        temperature: float = 0.3,
        model_id: str | None = None,
    ) -> BedrockResult:
        """
        Invoke a model with the Anthropic message format.

        Set `temperature` low (0.1–0.3) for deterministic analysis; raise it
        for mentor chat where creativity matters.
        """
        used_model = model_id or self._default_model_id
        body = {
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
                    modelId=used_model,
                    body=json.dumps(body),
                    contentType="application/json",
                    accept="application/json",
                ),
            )
        except Exception as exc:  # boto3 raises a host of client errors
            logger.exception("bedrock.invoke_failed", model=used_model, error=str(exc))
            raise BedrockError(str(exc)) from exc

        payload = json.loads(raw["body"].read())
        text = self._extract_text(payload)
        usage = payload.get("usage", {})
        return BedrockResult(
            text=text,
            json_payload=self._try_extract_json(text),
            input_tokens=int(usage.get("input_tokens", 0)),
            output_tokens=int(usage.get("output_tokens", 0)),
            model_id=used_model,
        )

    # ── Helpers ────────────────────────────────────────────────────────────

    @staticmethod
    def _extract_text(payload: dict[str, Any]) -> str:
        """Pull the first text block from the Anthropic response shape."""
        content = payload.get("content") or []
        for block in content:
            if block.get("type") == "text" and "text" in block:
                return str(block["text"])
        return ""

    _JSON_FENCE = re.compile(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", re.DOTALL)

    @classmethod
    def _try_extract_json(cls, text: str) -> dict[str, Any] | None:
        """
        Models love wrapping JSON in ``` fences or surrounding it with prose.
        We accept either pattern; failure is non-fatal (text is still returned).
        """
        if not text:
            return None
        # 1) Fenced block
        fenced = cls._JSON_FENCE.search(text)
        if fenced:
            candidate = fenced.group(1)
        else:
            # 2) First brace-balanced substring
            start = text.find("{")
            if start == -1:
                return None
            end = text.rfind("}")
            if end < start:
                return None
            candidate = text[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            logger.warning("bedrock.json_extract_failed", preview=text[:200])
            return None


# Module-level singleton — instantiated lazily so import doesn't touch AWS.
_client: BedrockClient | None = None


def get_bedrock_client() -> BedrockClient:
    global _client
    if _client is None:
        _client = BedrockClient()
    return _client
