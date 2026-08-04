import json
from collections.abc import Sequence
from typing import Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from openai import OpenAI, OpenAIError

from app.modules.rag.core.settings import (
    RAGSettings,
    get_rag_settings,
)


class EmbeddingProviderError(RuntimeError):
    pass


class EmbeddingProviderNotConfiguredError(
    EmbeddingProviderError
):
    pass


class InvalidEmbeddingInputError(
    EmbeddingProviderError
):
    pass


class InvalidEmbeddingResponseError(
    EmbeddingProviderError
):
    pass


class EmbeddingProvider(Protocol):
    def embed_texts(
        self,
        texts: Sequence[str],
    ) -> list[list[float]]:
        ...

    def embed_text(
        self,
        text: str,
    ) -> list[float]:
        ...


def normalize_texts(
    texts: Sequence[str],
) -> list[str]:
    normalized_texts = [
        text.strip()
        for text in texts
    ]

    if not normalized_texts:
        raise InvalidEmbeddingInputError(
            "At least one text value is required."
        )

    if any(
        not text
        for text in normalized_texts
    ):
        raise InvalidEmbeddingInputError(
            "Embedding inputs cannot be empty."
        )

    return normalized_texts


def validate_embeddings(
    embeddings: object,
    expected_count: int,
    expected_dimensions: int,
) -> list[list[float]]:
    if not isinstance(embeddings, list):
        raise InvalidEmbeddingResponseError(
            "The response did not contain embeddings."
        )

    if len(embeddings) != expected_count:
        raise InvalidEmbeddingResponseError(
            "The embedding response count "
            "did not match the input count."
        )

    validated_embeddings: list[list[float]] = []

    for embedding in embeddings:
        if not isinstance(embedding, list):
            raise InvalidEmbeddingResponseError(
                "An embedding was not a valid vector."
            )

        if len(embedding) != expected_dimensions:
            raise InvalidEmbeddingResponseError(
                "An embedding contained an "
                "unexpected vector size."
            )

        try:
            validated_embeddings.append(
                [
                    float(value)
                    for value in embedding
                ]
            )
        except (TypeError, ValueError) as error:
            raise InvalidEmbeddingResponseError(
                "An embedding contained invalid values."
            ) from error

    return validated_embeddings


class OllamaEmbeddingProvider:
    def __init__(
        self,
        settings: RAGSettings | None = None,
    ) -> None:
        self.settings = (
            settings
            or get_rag_settings()
        )

    def embed_texts(
        self,
        texts: Sequence[str],
    ) -> list[list[float]]:
        normalized_texts = normalize_texts(texts)

        if not self.settings.is_ollama_configured:
            raise EmbeddingProviderNotConfiguredError(
                "Ollama is not configured."
            )

        base_url = (
            self.settings
            .ollama_base_url
            .rstrip("/")
        )

        request_body = json.dumps(
            {
                "model": (
                    self.settings
                    .ollama_embedding_model
                ),
                "input": normalized_texts,
                "dimensions": (
                    self.settings
                    .ollama_embedding_dimensions
                ),
                "truncate": True,
            }
        ).encode("utf-8")

        request = Request(
            url=f"{base_url}/api/embed",
            data=request_body,
            method="POST",
            headers={
                "Content-Type": "application/json",
            },
        )

        try:
            with urlopen(
                request,
                timeout=300,
            ) as response:
                response_data = json.loads(
                    response.read().decode("utf-8")
                )

        except HTTPError as error:
            error_message = (
                error.read()
                .decode("utf-8", errors="replace")
            )

            raise EmbeddingProviderError(
                "Ollama rejected the embedding "
                f"request: {error_message}"
            ) from error

        except URLError as error:
            raise EmbeddingProviderError(
                "Could not connect to Ollama at "
                f"{base_url}."
            ) from error

        except TimeoutError as error:
            raise EmbeddingProviderError(
                "The Ollama embedding request timed out."
            ) from error

        except json.JSONDecodeError as error:
            raise InvalidEmbeddingResponseError(
                "Ollama returned invalid JSON."
            ) from error

        return validate_embeddings(
            embeddings=response_data.get(
                "embeddings"
            ),
            expected_count=len(normalized_texts),
            expected_dimensions=(
                self.settings
                .ollama_embedding_dimensions
            ),
        )

    def embed_text(
        self,
        text: str,
    ) -> list[float]:
        return self.embed_texts([text])[0]


class OpenAIEmbeddingProvider:
    def __init__(
        self,
        settings: RAGSettings | None = None,
    ) -> None:
        self.settings = (
            settings
            or get_rag_settings()
        )

    def _create_client(self) -> OpenAI:
        if not self.settings.is_openai_configured:
            raise EmbeddingProviderNotConfiguredError(
                "OPENAI_API_KEY is not configured."
            )

        if self.settings.openai_api_key is None:
            raise EmbeddingProviderNotConfiguredError(
                "OPENAI_API_KEY is not configured."
            )

        api_key = (
            self.settings
            .openai_api_key
            .get_secret_value()
            .strip()
        )

        return OpenAI(
            api_key=api_key,
            timeout=60.0,
            max_retries=2,
        )

    def embed_texts(
        self,
        texts: Sequence[str],
    ) -> list[list[float]]:
        normalized_texts = normalize_texts(texts)
        client = self._create_client()

        try:
            response = client.embeddings.create(
                model=(
                    self.settings
                    .openai_embedding_model
                ),
                input=normalized_texts,
                dimensions=(
                    self.settings
                    .openai_embedding_dimensions
                ),
                encoding_format="float",
            )

        except OpenAIError as error:
            raise EmbeddingProviderError(
                "The OpenAI embedding request failed."
            ) from error

        ordered_embeddings = sorted(
            response.data,
            key=lambda item: item.index,
        )

        embeddings = [
            list(item.embedding)
            for item in ordered_embeddings
        ]

        return validate_embeddings(
            embeddings=embeddings,
            expected_count=len(normalized_texts),
            expected_dimensions=(
                self.settings
                .openai_embedding_dimensions
            ),
        )

    def embed_text(
        self,
        text: str,
    ) -> list[float]:
        return self.embed_texts([text])[0]


def get_embedding_provider(
    settings: RAGSettings | None = None,
) -> EmbeddingProvider:
    active_settings = (
        settings
        or get_rag_settings()
    )

    if active_settings.ai_provider == "ollama":
        return OllamaEmbeddingProvider(
            active_settings
        )

    if active_settings.ai_provider == "openai":
        return OpenAIEmbeddingProvider(
            active_settings
        )

    raise EmbeddingProviderNotConfiguredError(
        "No supported AI provider is configured."
    )
