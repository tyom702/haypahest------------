import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "HayPahest API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "haypahest-super-secret-jwt-key-change-in-production-amen"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/haypahest_db"
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgres@localhost:5432/haypahest_db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "https://ais-dev-2vefnwh6sbhupf73zemvex-488688915515.europe-west3.run.app",
        "https://ais-pre-2vefnwh6sbhupf73zemvex-488688915515.europe-west3.run.app",
    ]

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60


settings = Settings()
