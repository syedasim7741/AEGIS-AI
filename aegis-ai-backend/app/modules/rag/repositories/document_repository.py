from uuid import UUID

from sqlalchemy import (
    delete,
    func,
    or_,
    select,
)
from sqlalchemy.orm import Session

from app.models.rag_document import (
    RAGDocument,
    RAGDocumentStatus,
)
from app.models.rag_document_chunk import (
    RAGDocumentChunk,
)


def create_document_record(
    database_session: Session,
    document: RAGDocument,
) -> RAGDocument:
    database_session.add(document)
    database_session.flush()
    database_session.refresh(document)

    return document


def get_document_by_id(
    database_session: Session,
    document_id: UUID,
) -> RAGDocument | None:
    return database_session.get(
        RAGDocument,
        document_id,
    )


def get_document_by_checksum(
    database_session: Session,
    checksum_sha256: str,
) -> RAGDocument | None:
    statement = (
        select(RAGDocument)
        .where(
            RAGDocument.checksum_sha256
            == checksum_sha256
        )
        .limit(1)
    )

    return database_session.scalar(
        statement
    )


def get_document_records(
    database_session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: RAGDocumentStatus | None = None,
    uploaded_by_user_id: UUID | None = None,
) -> tuple[list[RAGDocument], int]:
    filters = []

    if search is not None:
        normalized_search = search.strip()

        if normalized_search:
            search_pattern = (
                f"%{normalized_search}%"
            )

            filters.append(
                or_(
                    RAGDocument
                    .original_filename
                    .ilike(search_pattern),

                    RAGDocument
                    .stored_filename
                    .ilike(search_pattern),
                )
            )

    if status is not None:
        filters.append(
            RAGDocument.status == status
        )

    if uploaded_by_user_id is not None:
        filters.append(
            RAGDocument.uploaded_by_user_id
            == uploaded_by_user_id
        )

    records_statement = select(
        RAGDocument
    )

    count_statement = select(
        func.count(RAGDocument.id)
    )

    if filters:
        records_statement = (
            records_statement.where(
                *filters
            )
        )

        count_statement = (
            count_statement.where(
                *filters
            )
        )

    records_statement = (
        records_statement
        .order_by(
            RAGDocument.created_at.desc(),
            RAGDocument.original_filename.asc(),
        )
        .offset(skip)
        .limit(limit)
    )

    records = list(
        database_session.scalars(
            records_statement
        ).all()
    )

    total = database_session.scalar(
        count_statement
    )

    return records, int(total or 0)


def delete_document_record(
    database_session: Session,
    document: RAGDocument,
) -> None:
    database_session.delete(document)
    database_session.flush()


def create_chunk_records(
    database_session: Session,
    chunks: list[RAGDocumentChunk],
) -> list[RAGDocumentChunk]:
    if not chunks:
        return []

    database_session.add_all(chunks)
    database_session.flush()

    return chunks


def get_document_chunks(
    database_session: Session,
    document_id: UUID,
) -> list[RAGDocumentChunk]:
    statement = (
        select(RAGDocumentChunk)
        .where(
            RAGDocumentChunk.document_id
            == document_id
        )
        .order_by(
            RAGDocumentChunk.chunk_index.asc()
        )
    )

    return list(
        database_session.scalars(
            statement
        ).all()
    )


def delete_document_chunks(
    database_session: Session,
    document_id: UUID,
) -> int:
    statement = (
        delete(RAGDocumentChunk)
        .where(
            RAGDocumentChunk.document_id
            == document_id
        )
    )

    result = database_session.execute(
        statement
    )

    database_session.flush()

    return int(result.rowcount or 0)


def count_document_chunks(
    database_session: Session,
    document_id: UUID,
) -> int:
    statement = (
        select(
            func.count(
                RAGDocumentChunk.id
            )
        )
        .where(
            RAGDocumentChunk.document_id
            == document_id
        )
    )

    return int(
        database_session.scalar(
            statement
        )
        or 0
    )


def search_document_chunks(
    database_session: Session,
    query_embedding: list[float],
    *,
    limit: int = 5,
    document_id: UUID | None = None,
) -> list[tuple[RAGDocumentChunk, float]]:
    """Return chunks ordered by cosine similarity."""

    if not query_embedding:
        raise ValueError(
            "Query embedding cannot be empty."
        )

    if limit < 1:
        raise ValueError(
            "Search limit must be at least 1."
        )

    cosine_distance = (
        RAGDocumentChunk
        .embedding
        .cosine_distance(query_embedding)
        .label("cosine_distance")
    )

    filters = [
        RAGDocumentChunk.embedding.is_not(None),
        RAGDocument.status
        == RAGDocumentStatus.READY,
    ]

    if document_id is not None:
        filters.append(
            RAGDocumentChunk.document_id
            == document_id
        )

    statement = (
        select(
            RAGDocumentChunk,
            cosine_distance,
        )
        .join(
            RAGDocument,
            RAGDocument.id
            == RAGDocumentChunk.document_id,
        )
        .where(*filters)
        .order_by(cosine_distance.asc())
        .limit(limit)
    )

    rows = database_session.execute(
        statement
    ).all()

    return [
        (
            row[0],
            float(row[1]),
        )
        for row in rows
    ]

