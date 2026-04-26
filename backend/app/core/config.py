from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = os.getenv("APP_ENV_FILE", ".env")


class Settings(BaseSettings):
    APP_NAME: str = "Flota API"
    APP_ENV: str = "dev"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    API_V1_PREFIX: str = "/api/v1"

    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    ACCESS_TOKEN_SECRET: str
    ACCESS_TOKEN_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    DOCUMENTS_UPLOAD_DIR: str = "uploads/documents"
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024

    FRONTEND_URL: str = "http://localhost:3000"

    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_FROM_NAME: str = "Flota API"
    SMTP_USE_TLS: bool = True

    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator(
        "APP_NAME",
        "APP_ENV",
        "LOG_LEVEL",
        "API_V1_PREFIX",
        "DB_HOST",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
        "ACCESS_TOKEN_SECRET",
        "ACCESS_TOKEN_ALGORITHM",
        "DOCUMENTS_UPLOAD_DIR",
        "FRONTEND_URL",
        "SMTP_FROM_NAME",
        mode="before",
    )
    @classmethod
    def validate_non_empty_string(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("Value must be a string.")

        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Value must not be empty.")

        return cleaned

    @field_validator("SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM_EMAIL", mode="before")
    @classmethod
    def normalize_optional_string(cls, value: object) -> str | None:
        if value is None:
            return None

        if not isinstance(value, str):
            raise ValueError("Value must be a string.")

        cleaned = value.strip()
        return cleaned or None

    @field_validator("APP_ENV", mode="before")
    @classmethod
    def validate_app_env(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("APP_ENV must be a string.")

        cleaned = value.strip().lower()
        allowed = {"dev", "test", "prod"}

        if cleaned not in allowed:
            raise ValueError("APP_ENV must be one of: dev, test, prod.")

        return cleaned

    @field_validator("LOG_LEVEL", mode="before")
    @classmethod
    def validate_log_level(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("LOG_LEVEL must be a string.")

        cleaned = value.strip().upper()
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}

        if cleaned not in allowed:
            raise ValueError(
                "LOG_LEVEL must be one of: DEBUG, INFO, WARNING, ERROR, CRITICAL."
            )

        return cleaned

    @field_validator("API_V1_PREFIX", mode="before")
    @classmethod
    def validate_api_v1_prefix(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("API_V1_PREFIX must be a string.")

        cleaned = value.strip()

        if not cleaned.startswith("/"):
            raise ValueError("API_V1_PREFIX must start with '/'.")

        if len(cleaned) > 1 and cleaned.endswith("/"):
            cleaned = cleaned.rstrip("/")

        return cleaned

    @field_validator("FRONTEND_URL", mode="before")
    @classmethod
    def validate_frontend_url(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("FRONTEND_URL must be a string.")

        cleaned = value.strip().rstrip("/")
        if not cleaned.startswith("http://") and not cleaned.startswith("https://"):
            raise ValueError("FRONTEND_URL must start with http:// or https://")

        return cleaned

    @field_validator("DB_PORT", "SMTP_PORT")
    @classmethod
    def validate_port(cls, value: int) -> int:
        if value <= 0 or value > 65535:
            raise ValueError("Port must be between 1 and 65535.")
        return value

    @field_validator("ACCESS_TOKEN_EXPIRE_MINUTES")
    @classmethod
    def validate_access_token_expire_minutes(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be greater than 0.")
        if value > 24 * 60:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES is unreasonably high.")
        return value

    @field_validator("EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS")
    @classmethod
    def validate_email_verification_token_expire_hours(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS must be greater than 0.")
        if value > 24 * 30:
            raise ValueError("EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS is unreasonably high.")
        return value

    @field_validator("ACCESS_TOKEN_SECRET")
    @classmethod
    def validate_access_token_secret(cls, value: str) -> str:
        cleaned = value.strip()

        if len(cleaned) < 32:
            raise ValueError("ACCESS_TOKEN_SECRET must be at least 32 characters long.")

        forbidden_values = {
            "secret",
            "changeme",
            "devsecret",
            "jwtsecret",
            "admin",
            "password",
            "testsecret",
        }

        if cleaned.lower() in forbidden_values:
            raise ValueError("ACCESS_TOKEN_SECRET is too weak.")

        return cleaned

    @field_validator("ACCESS_TOKEN_ALGORITHM")
    @classmethod
    def validate_access_token_algorithm(cls, value: str) -> str:
        cleaned = value.strip().upper()
        allowed = {"HS256", "HS384", "HS512"}

        if cleaned not in allowed:
            raise ValueError("ACCESS_TOKEN_ALGORITHM must be HS256, HS384, or HS512.")

        return cleaned

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, value: object) -> list[str]:
        if value is None:
            return []

        if isinstance(value, str):
            raw_items = [item.strip() for item in value.split(",")]
            origins = [item for item in raw_items if item]
        elif isinstance(value, list):
            origins = []
            for item in value:
                if not isinstance(item, str):
                    raise ValueError("Each CORS origin must be a string.")
                cleaned = item.strip()
                if cleaned:
                    origins.append(cleaned)
        else:
            raise ValueError(
                "CORS_ORIGINS must be a list of strings or a comma-separated string."
            )

        if any(origin == "*" for origin in origins):
            raise ValueError("CORS_ORIGINS must not contain '*'.")

        return origins

    @field_validator("MAX_UPLOAD_SIZE_BYTES")
    @classmethod
    def validate_max_upload_size_bytes(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("MAX_UPLOAD_SIZE_BYTES must be greater than 0.")
        if value > 50 * 1024 * 1024:
            raise ValueError("MAX_UPLOAD_SIZE_BYTES is unreasonably high.")
        return value

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "prod"

    @property
    def documents_upload_path(self) -> Path:
        return Path(self.DOCUMENTS_UPLOAD_DIR).resolve()

    @property
    def email_enabled(self) -> bool:
        return bool(
            self.SMTP_HOST
            and self.SMTP_USERNAME
            and self.SMTP_PASSWORD
            and self.SMTP_FROM_EMAIL
        )

    def model_post_init(self, __context: object) -> None:
        if self.is_production and self.DEBUG:
            raise ValueError("DEBUG must be False in production.")

        if self.is_production and not self.CORS_ORIGINS:
            raise ValueError("CORS_ORIGINS must not be empty in production.")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()