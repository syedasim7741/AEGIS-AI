from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class CustomizationSettings(BaseSettings):
    """Configuration for model customization."""

    ollama_base_url: str = Field(
        default="http://127.0.0.1:11434"
    )

    customization_base_model: str = Field(
        default="qwen3:1.7b"
    )

    customization_model_name: str = Field(
        default="aegis-industrial-assistant"
    )

    customization_raw_dataset_directory: str = Field(
        default="customization/datasets/raw"
    )

    customization_validated_dataset_directory: str = Field(
        default="customization/datasets/validated"
    )

    customization_modelfile_directory: str = Field(
        default="customization/modelfiles"
    )

    customization_evaluation_directory: str = Field(
        default="customization/evaluations"
    )

    customization_report_directory: str = Field(
        default="customization/reports"
    )

    customization_max_dataset_size_mb: int = Field(
        default=20,
        ge=1,
        le=100,
    )

    customization_min_examples: int = Field(
        default=10,
        ge=1,
        le=100_000,
    )

    customization_max_examples: int = Field(
        default=10_000,
        ge=10,
        le=1_000_000,
    )

    customization_evaluation_pass_score: float = Field(
        default=0.75,
        ge=0,
        le=1,
    )

    customization_request_timeout_seconds: int = Field(
        default=300,
        ge=30,
        le=900,
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
    ) -> "CustomizationSettings":
        if (
            self.customization_min_examples
            > self.customization_max_examples
        ):
            raise ValueError(
                "CUSTOMIZATION_MIN_EXAMPLES cannot "
                "exceed CUSTOMIZATION_MAX_EXAMPLES."
            )

        required_values = {
            "OLLAMA_BASE_URL": self.ollama_base_url,
            "CUSTOMIZATION_BASE_MODEL": (
                self.customization_base_model
            ),
            "CUSTOMIZATION_MODEL_NAME": (
                self.customization_model_name
            ),
        }

        for name, value in required_values.items():
            if not value.strip():
                raise ValueError(
                    f"{name} cannot be empty."
                )

        return self


@lru_cache
def get_customization_settings(
) -> CustomizationSettings:
    return CustomizationSettings()
