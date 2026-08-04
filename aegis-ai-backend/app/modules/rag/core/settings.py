from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class RAGSettings(BaseSettings):
    """Configuration for the AEGIS AI RAG module."""

    ai_provider: Literal["ollama", "openai"] = Field(
        default="ollama"
    )

    ollama_base_url: str = Field(
        default="http://127.0.0.1:11434"
    )
    ollama_chat_model: str = Field(
        default="qwen3:1.7b"
    )
    ollama_embedding_model: str = Field(
        default="qwen3-embedding:0.6b"
    )
    ollama_embedding_dimensions: int = Field(
        default=1024,
        ge=1,
    )

    openai_api_key: SecretStr | None = Field(
        default=None
    )
    openai_chat_model: str = Field(
        default="gpt-5-mini"
    )
    openai_embedding_model: str = Field(
        default="text-embedding-3-small"
    )
    openai_embedding_dimensions: int = Field(
        default=1536,
        ge=1,
    )

    rag_chunk_size: int = Field(
        default=800,
        ge=100,
        le=8000,
    )
    rag_chunk_overlap: int = Field(
        default=120,
        ge=0,
        le=2000,
    )
    rag_top_k: int = Field(
        default=5,
        ge=1,
        le=20,
    )
    rag_min_similarity: float = Field(
        default=0.40,
        ge=-1.0,
        le=1.0,
    )
    rag_storage_directory: str = Field(
        default="storage/rag_documents"
    )
    rag_max_file_size_mb: int = Field(
        default=20,
        ge=1,
        le=100,
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_configuration(self) -> "RAGSettings":
        if self.rag_chunk_overlap >= self.rag_chunk_size:
            raise ValueError(
                "RAG_CHUNK_OVERLAP must be smaller "
                "than RAG_CHUNK_SIZE."
            )

        return self

    @property
    def is_openai_configured(self) -> bool:
        if self.openai_api_key is None:
            return False

        return bool(
            self.openai_api_key.get_secret_value().strip()
        )

    @property
    def is_ollama_configured(self) -> bool:
        return bool(
            self.ollama_base_url.strip()
            and self.ollama_embedding_model.strip()
        )

    @property
    def active_embedding_dimensions(self) -> int:
        if self.ai_provider == "ollama":
            return self.ollama_embedding_dimensions

        return self.openai_embedding_dimensions


@lru_cache
def get_rag_settings() -> RAGSettings:
    return RAGSettings()
