from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # AWS & Bedrock
    aws_region: str = "us-east-1"
    anthropic_model_id: str = "anthropic.claude-sonnet-4-20250514-v1:0"

    # API Security
    api_key_secret: str = "dev-local-key"
    allowed_origins: str = "http://localhost:5173"

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
