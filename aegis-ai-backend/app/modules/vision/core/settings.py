from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class VisionSettings(BaseSettings):
    """Configuration for the AEGIS AI vision module."""

    vision_provider: Literal["ollama"] = Field(
        default="ollama"
    )

    ollama_base_url: str = Field(
        default="http://127.0.0.1:11434"
    )

    ollama_vision_model: str = Field(
        default="qwen3-vl:2b-instruct"
    )

    vision_storage_directory: str = Field(
        default="storage/vision_inspections"
    )

    vision_max_file_size_mb: int = Field(
        default=10,
        ge=1,
        le=50,
    )

    vision_max_image_width: int = Field(
        default=4096,
        ge=64,
        le=8192,
    )

    vision_max_image_height: int = Field(
        default=4096,
        ge=64,
        le=8192,
    )

    vision_max_image_pixels: int = Field(
        default=16_777_216,
        ge=4096,
        le=67_108_864,
    )

    vision_request_timeout_seconds: int = Field(
        default=300,
        ge=30,
        le=900,
    )


    vision_context_window: int = Field(
        default=8192,
        ge=4096,
        le=32768,
    )

    vision_temperature: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )

    vision_max_output_tokens: int = Field(
        default=800,
        ge=100,
        le=4000,
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_configuration(
        self,
    ) -> "VisionSettings":
        if not self.ollama_base_url.strip():
            raise ValueError(
                "OLLAMA_BASE_URL cannot be empty."
            )

        if not self.ollama_vision_model.strip():
            raise ValueError(
                "OLLAMA_VISION_MODEL cannot be empty."
            )

        return self

    @property
    def is_ollama_configured(self) -> bool:
        return bool(
            self.ollama_base_url.strip()
            and self.ollama_vision_model.strip()
        )


@lru_cache
def get_vision_settings() -> VisionSettings:
    return VisionSettings()
