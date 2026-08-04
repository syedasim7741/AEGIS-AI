from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.rag_document_chunk import (
    RAGDocumentChunk,
)
from app.modules.agent.core.serialization import (
    to_json_safe,
)
from app.modules.rag.services.answer_service import (
    answer_rag_question,
)
from app.modules.rag.services.search_service import (
    search_rag_chunks,
)


def serialize_rag_source(
    chunk: RAGDocumentChunk,
    similarity: float,
    distance: float,
) -> dict[str, Any]:
    """
    Convert a RAG search result into safe agent data.

    The embedding vector is intentionally excluded
    because the agent does not need the raw vector.
    """

    return {
        "chunk_id": str(chunk.id),
        "document_id": str(chunk.document_id),
        "chunk_index": chunk.chunk_index,
        "page_number": chunk.page_number,
        "content": chunk.content,
        "character_count": chunk.character_count,
        "token_count": chunk.token_count,
        "similarity": round(
            float(similarity),
            6,
        ),
        "distance": round(
            float(distance),
            6,
        ),
        "metadata": to_json_safe(
            chunk.chunk_metadata,
        ),
        "created_at": to_json_safe(
            chunk.created_at,
        ),
    }


def parse_document_id(
    document_id: str | None,
) -> UUID | None:
    if document_id is None:
        return None

    try:
        return UUID(document_id)
    except ValueError as error:
        raise ValueError(
            "document_id must be a valid UUID."
        ) from error


def search_documents_tool(
    database_session: Session,
    *,
    query: str,
    limit: int = 5,
    document_id: str | None = None,
) -> dict[str, Any]:
    cleaned_query = query.strip()

    if len(cleaned_query) < 2:
        raise ValueError(
            "query must contain at least 2 characters."
        )

    safe_limit = max(
        1,
        min(limit, 10),
    )

    results = search_rag_chunks(
        database_session,
        cleaned_query,
        limit=safe_limit,
        document_id=parse_document_id(
            document_id,
        ),
    )

    sources = [
        serialize_rag_source(
            chunk,
            similarity,
            distance,
        )
        for chunk, similarity, distance
        in results
    ]

    return {
        "query": cleaned_query,
        "sources": sources,
        "total_sources": len(sources),
    }


def answer_document_question_tool(
    database_session: Session,
    *,
    question: str,
    top_k: int = 5,
    document_id: str | None = None,
) -> dict[str, Any]:
    cleaned_question = question.strip()

    if len(cleaned_question) < 2:
        raise ValueError(
            "question must contain at least "
            "2 characters."
        )

    safe_top_k = max(
        1,
        min(top_k, 10),
    )

    result = answer_rag_question(
        database_session,
        cleaned_question,
        top_k=safe_top_k,
        document_id=parse_document_id(
            document_id,
        ),
    )

    sources = [
        serialize_rag_source(
            chunk,
            similarity,
            distance,
        )
        for chunk, similarity, distance
        in result.sources
    ]

    return {
        "question": cleaned_question,
        "answer": result.answer,
        "sources": sources,
        "total_sources": len(sources),
    }
