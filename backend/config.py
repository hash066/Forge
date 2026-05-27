from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # AWS & Bedrock
    aws_region: str = "eu-north-1"
    anthropic_model_id: str = "anthropic.claude-sonnet-4-20250514-v1:0"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_account_id: Optional[str] = None

    # Upstream AWS API Gateways (eu-north-1)
    devforge_api_base_url: str = "https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev"
    infra_ai_api_base_url: str = "https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev"
    realtime_wss_url: str = "wss://6fhd8botk8.execute-api.eu-north-1.amazonaws.com/dev/"
    realtime_management_url: str = "https://6fhd8botk8.execute-api.eu-north-1.amazonaws.com/dev/@connections"

    # API Security
    api_key_secret: str = "dev-local-key"
    allowed_origins: str = "http://localhost:5173"

    # Cache (ElastiCache Redis OSS)
    redis_host: Optional[str] = None
    redis_port: int = 6379
    redis_url: Optional[str] = None

    # Database
    database_url: Optional[str] = None

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
