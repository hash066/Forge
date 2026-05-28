"""
Provider-agnostic AI abstraction.

Every model backend (OpenAI, Bedrock, offline) implements the same
``AIProvider`` surface and returns a uniform :class:`AIResult`. Routers and
services depend on this seam — never on a concrete SDK — so swapping or adding
a provider is a configuration change, not a code change.

This is what makes DevForge OS multi-model: OpenAI GPT is the default brain,
but Bedrock/Claude (or a local offline stub) can be dropped in via one env var.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable

import structlog

logger = structlog.get_logger(__name__)


class AIProviderError(Exception):
    """Raised when an AI provider fails after its internal retries."""


@dataclass(frozen=True, slots=True)
class AIResult:
    """Uniform result returned by every provider."""

    text: str
    json_payload: dict[str, Any] | None
    input_tokens: int
    output_tokens: int
    model_id: str
    provider: str


@runtime_checkable
class AIProvider(Protocol):
    """Structural type every concrete provider satisfies."""

    name: str

    async def generate(
        self,
        prompt: str,
        *,
        system: str | None = None,
        max_tokens: int = 2048,
        temperature: float = 0.3,
        json: bool = False,
        model_id: str | None = None,
    ) -> AIResult: ...

    async def invoke(
        self,
        prompt: str,
        *,
        system: str | None = None,
        max_tokens: int = 2048,
        temperature: float = 0.3,
        model_id: str | None = None,
    ) -> AIResult: ...


class BaseAIProvider:
    """Shared base: gives every provider an ``invoke`` alias for free."""

    name: str = "base"

    async def generate(
        self,
        prompt: str,
        *,
        system: str | None = None,
        max_tokens: int = 2048,
        temperature: float = 0.3,
        json: bool = False,
        model_id: str | None = None,
    ) -> AIResult:  # pragma: no cover - abstract
        raise NotImplementedError

    async def invoke(
        self,
        prompt: str,
        *,
        system: str | None = None,
        max_tokens: int = 2048,
        temperature: float = 0.3,
        model_id: str | None = None,
    ) -> AIResult:
        """Back-compat alias used by older call sites (plain text, no JSON mode)."""
        return await self.generate(
            prompt,
            system=system,
            max_tokens=max_tokens,
            temperature=temperature,
            json=False,
            model_id=model_id,
        )


_JSON_FENCE = re.compile(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", re.DOTALL)


def extract_json(text: str) -> dict[str, Any] | None:
    """
    Pull a JSON object out of model output. Handles three shapes:
      1. a ```json fenced block,
      2. a bare brace-balanced object embedded in prose,
      3. a top-level array (wrapped as ``{"items": [...]}`` so callers can
         keep using ``.get``).
    Failure is non-fatal — the raw text is always still available on the result.
    """
    if not text:
        return None
    fenced = _JSON_FENCE.search(text)
    if fenced:
        candidate = fenced.group(1)
    else:
        start = text.find("{")
        if start == -1:
            # maybe a top-level array
            lstart = text.find("[")
            if lstart == -1:
                return None
            lend = text.rfind("]")
            if lend < lstart:
                return None
            candidate = text[lstart : lend + 1]
        else:
            end = text.rfind("}")
            if end < start:
                return None
            candidate = text[start : end + 1]
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        logger.warning("ai.json_extract_failed", preview=text[:200])
        return None
    if isinstance(parsed, list):
        return {"items": parsed}
    if isinstance(parsed, dict):
        return parsed
    return None
