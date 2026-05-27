"""Centralised settings loaded from env / Secrets Manager."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All configuration is environment-driven. Pydantic enforces types and
    validates at boot — fail fast on missing required values.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ────────────────────────────────────────────────────────────────
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # ── CORS ───────────────────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:3000"

    # ── Auth ───────────────────────────────────────────────────────────────
    clerk_publishable_key: str = ""
    clerk_secret_key: str = ""
    clerk_jwt_issuer: str = ""
    internal_api_key: str = Field(default="dev-local-key", min_length=8)

    # ── Database ───────────────────────────────────────────────────────────
    database_url: str | None = None

    # ── Cache ──────────────────────────────────────────────────────────────
    redis_url: str | None = None

    # ── AWS ────────────────────────────────────────────────────────────────
    aws_region: str = "eu-north-1"
    aws_bedrock_model_id: str = "anthropic.claude-sonnet-4-20250514-v1:0"
    s3_blueprint_bucket: str = "devforge-blueprints-dev"

    # ── Rate limits ────────────────────────────────────────────────────────
    rate_limit_default: int = 60
    rate_limit_analysis: int = 20

    @computed_field  # type: ignore[prop-decorator]
    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton so we don't re-read env on every request."""
    return Settings()
