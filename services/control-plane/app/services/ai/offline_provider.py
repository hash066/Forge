"""
Offline provider — deterministic, zero-dependency fallback.

Used when no real model is configured (e.g. no ``OPENAI_API_KEY`` in a local
demo, or the SDK is missing). It never raises, so the control plane always
boots and every endpoint always responds. K8s-specific endpoints layer their
own rich rule-based diagnosis on top of this (see ``k8s_rca.py``); this stub
just guarantees a well-formed result.
"""

from __future__ import annotations

from app.config import Settings
from app.services.ai.base import AIResult, BaseAIProvider


class OfflineProvider(BaseAIProvider):
    name = "offline"

    def __init__(self, settings: Settings | None = None) -> None:
        self._model = "offline-deterministic-v1"

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
        if json:
            text = (
                '{"summary": "Offline mode — set OPENAI_API_KEY to enable live AI '
                'analysis.", "offline": true}'
            )
            payload = {
                "summary": "Offline mode — set OPENAI_API_KEY to enable live AI analysis.",
                "offline": True,
            }
        else:
            text = (
                "DevForge is running in offline mode. Set OPENAI_API_KEY (and optionally "
                "OPENAI_MODEL) to enable live GPT-powered analysis. Deterministic rule-based "
                "diagnosis is still active for Kubernetes incidents."
            )
            payload = None
        return AIResult(
            text=text,
            json_payload=payload,
            input_tokens=0,
            output_tokens=0,
            model_id=model_id or self._model,
            provider=self.name,
        )
