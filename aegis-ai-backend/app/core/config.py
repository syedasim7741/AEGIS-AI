from functools import lru_cache
from typing import Literal

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)
from sqlalchemy import URL


class Settings(BaseSettings):
    app_name: str = "AEGIS AI API"

    app_description: str = (
        "Enterprise Industrial AI Operations Platform backend API."
    )

    app_version: str = "1.0.0"
    environment: str = "development"

    api_v1_prefix: str = "/api/v1"

    frontend_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "aegis_ai_db"
    database_user: str = "aegis_app"
    database_password: str
    database_echo: bool = False

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    jwt_issuer: str = "aegis-ai-api"
    jwt_audience: str = "aegis-ai-frontend"

    refresh_token_expire_days: int = 30

    refresh_cookie_name: str = (
        "aegis_refresh_token"
    )

    refresh_cookie_secure: bool = False
    refresh_cookie_httponly: bool = True

    refresh_cookie_samesite: Literal[
        "lax",
        "strict",
        "none",
    ] = "lax"

    refresh_cookie_path: str = (
        "/api/v1/auth"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.frontend_origins.split(
                ","
            )
            if origin.strip()
        ]

    @property
    def database_url(self) -> URL:
        return URL.create(
            drivername="postgresql+psycopg",
            username=self.database_user,
            password=self.database_password,
            host=self.database_host,
            port=self.database_port,
            database=self.database_name,
        )

    @property
    def refresh_cookie_max_age_seconds(
        self,
    ) -> int:
        return (
            self.refresh_token_expire_days
            * 24
            * 60
            * 60
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()