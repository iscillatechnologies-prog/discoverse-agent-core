"""Application configuration via environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    port: int = 8000

    # Auth
    supabase_url: str = ""
    supabase_anon_key: str = ""
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"

    # AI
    openai_api_key: str = ""
    gemini_api_key: str = ""
    anthropic_api_key: str = ""

    # Storage
    database_url: str = "postgresql+asyncpg://discoverse:discoverse@localhost:5432/discoverse"
    redis_url: str = "redis://localhost:6379/0"

    # Vector memory (optional)
    weaviate_url: str = ""
    weaviate_api_key: str = ""

    # CORS
    cors_origins: list[str] = ["*"]

    # Default model preferences
    default_research_model: str = "gemini-2.0-flash-exp"
    default_builder_model: str = "gpt-5"
    default_analyst_model: str = "gemini-2.0-pro-exp"
    default_assistant_model: str = "gemini-2.0-flash-exp"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
