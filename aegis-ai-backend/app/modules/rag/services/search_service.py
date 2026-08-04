from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.rag_document_chunk import (
    RAGDocumentChunk,
)
from app.modules.rag.providers.embedding_provider import (
    EmbeddingProvider,
    EmbeddingProviderError,
    get_embedding_provider,
)
from app.modules.rag.repositories.document_repository import (
    search_document_chunks,
)


class RAGSearchError(RuntimeError):
    pass


def search_rag_chunks(
    database_session: Session,
    query: str,
    *,
    limit: int = 5,
    document_id: UUID | None = None,
    embedding_provider: (
        EmbeddingProvider | None
    ) = None,
) -> list[
    tuple[
        RAGDocumentChunk,
        float,
        float,
    ]
]:
    normalized_query = query.strip()

    if not normalized_query:
        raise ValueError(
            "Search query cannot be empty."
        )

    provider = (
        embedding_provider
        or get_embedding_provider()
    )

    try:
        query_embedding = provider.embed_text(
            normalized_query
        )

        repository_results = (
            search_document_chunks(
                database_session,
                query_embedding,
                limit=limit,
                document_id=document_id,
            )
        )

        results: list[
            tuple[
                RAGDocumentChunk,
                float,
                float,
            ]
        ] = []

        for chunk, cosine_distance in (
            repository_results
        ):
            safe_distance = min(
                max(
                    float(cosine_distance),
                    0.0,
                ),
                2.0,
            )

            similarity = 1.0 - safe_distance

            results.append(
                (
                    chunk,
                    similarity,
                    safe_distance,
                )
            )

        return results

    except (
        EmbeddingProviderError,
        SQLAlchemyError,
        ValueError,
    ) as error:
        raise RAGSearchError(
            "The semantic search could not "
            "be completed."
        ) from error
