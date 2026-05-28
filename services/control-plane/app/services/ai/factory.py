"""
Provider factory — resolves ``settings.ai_provider`` to a concrete backend.

Degrades gracefully: if the configured provider can't be constructed (missing
key, missing SDK, no AWS creds), we fall back to the offline provider with a
warning rather than crashing. The control plane must always boot — a demo can't
afford a hard failure because an env var is absent.
"""

from __future__ import annotations

from functools import lru_cache

import structlog

from app.config import get_settings
from app.services.ai.base import AIProvider
from app.services.ai.offline_provider import OfflineProvider

logger = structlog.get_logger(__name__)


@lru_cache(maxsize=1)
def get_ai_provider() -> AIProvider:
    settings = get_settings()
    choice = (settings.ai_provider or "openai").lower()

    if choice == "openai":
        try:
            from app.services.ai.openai_provider import OpenAIProvider

            provider = OpenAIProvider(settings)
            logger.info("ai.provider_selected", provider="openai", model=settings.openai_model)
            return provider
        except Exception as exc:
            logger.warning("ai.openai_unavailable", error=str(exc), fallback="offline")
            return OfflineProvider(settings)

    if choice == "bedrock":
        try:
            from app.services.ai.bedrock_provider import BedrockProvider

            provider = BedrockProvider(settings)
            logger.info(
                "ai.provider_selected", provider="bedrock", model=settings.aws_bedrock_model_id
            )
            return provider
        except Exception as exc:
            logger.warning("ai.bedrock_unavailable", error=str(exc), fallback="offline")
            return OfflineProvider(settings)

    logger.info("ai.provider_selected", provider="offline")
    return OfflineProvider(settings)


def reset_ai_provider_cache() -> None:
    """Clear the cached provider (used by tests that swap settings/env)."""
    get_ai_provider.cache_clear()
