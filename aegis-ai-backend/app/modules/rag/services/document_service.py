from datetime import (
    datetime,
    timezone,
)
from hashlib import sha256
from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.rag_document import (
    RAGDocument,
    RAGDocumentStatus,
)
from app.models.rag_document_chunk import (
    RAGDocumentChunk,
)
from app.modules.rag.loaders.document_loader import (
    DocumentLoadingError,
    load_document,
)
from app.modules.rag.providers.embedding_provider import (
    EmbeddingProvider,
    EmbeddingProviderError,
    get_embedding_provider,
)
from app.modules.rag.repositories.document_repository import (
    create_chunk_records,
    create_document_record,
    delete_document_record,
    delete_document_chunks,
    get_document_by_checksum,
    get_document_by_id,
    get_document_chunks,
    get_document_records,
)
from app.modules.rag.services.chunking_service import (
    DocumentChunkingError,
    chunk_document,
)
from app.modules.rag.services.storage_service import (
    InvalidDocumentError,
    delete_stored_document,
    save_document,
)


class RAGDocumentNotFoundError(
    ValueError
):
    pass


class DuplicateRAGDocumentError(
    ValueError
):
    pass


class RAGDocumentProcessingError(
    RuntimeError
):
    pass


def get_document_or_raise(
    database_session: Session,
    document_id: UUID,
) -> RAGDocument:
    document = get_document_by_id(
        database_session,
        document_id,
    )

    if document is None:
        raise RAGDocumentNotFoundError(
            "RAG document not found."
        )

    return document


def register_document(
    database_session: Session,
    *,
    uploaded_by_user_id: UUID | None,
    filename: str | None,
    content_type: str | None,
    content: bytes,
) -> RAGDocument:
    checksum = sha256(
        content
    ).hexdigest()

    existing_document = (
        get_document_by_checksum(
            database_session,
            checksum,
        )
    )

    if existing_document is not None:
        raise DuplicateRAGDocumentError(
            "This document has already "
            "been uploaded."
        )

    stored_document = save_document(
        filename=filename,
        content_type=content_type,
        content=content,
    )

    document = RAGDocument(
        uploaded_by_user_id=(
            uploaded_by_user_id
        ),
        original_filename=(
            stored_document
            .original_filename
        ),
        stored_filename=(
            stored_document
            .stored_filename
        ),
        content_type=(
            stored_document.content_type
        ),
        file_size_bytes=(
            stored_document.file_size_bytes
        ),
        storage_path=(
            stored_document.storage_path
        ),
        checksum_sha256=(
            stored_document.checksum_sha256
        ),
        status=RAGDocumentStatus.PENDING,
        chunk_count=0,
    )

    try:
        document = create_document_record(
            database_session,
            document,
        )

        database_session.commit()
        database_session.refresh(
            document
        )

        return document

    except SQLAlchemyError:
        database_session.rollback()

        delete_stored_document(
            stored_document.storage_path
        )

        raise


def process_document(
    database_session: Session,
    document_id: UUID,
    *,
    embedding_provider: (
        EmbeddingProvider | None
    ) = None,
) -> RAGDocument:
    document = get_document_or_raise(
        database_session,
        document_id,
    )

    provider = (
        embedding_provider
        or get_embedding_provider()
    )

    document.status = (
        RAGDocumentStatus.PROCESSING
    )
    document.error_message = None

    try:
        database_session.commit()
        database_session.refresh(
            document
        )

        extracted_document = load_document(
            document.storage_path
        )

        prepared_chunks = chunk_document(
            extracted_document
        )

        embeddings: list[
            list[float]
        ] = []

        batch_size = 64

        for batch_start in range(
            0,
            len(prepared_chunks),
            batch_size,
        ):
            batch = prepared_chunks[
                batch_start:
                batch_start + batch_size
            ]

            batch_embeddings = (
                provider.embed_texts(
                    [
                        chunk.content
                        for chunk in batch
                    ]
                )
            )

            embeddings.extend(
                batch_embeddings
            )

        delete_document_chunks(
            database_session,
            document.id,
        )

        chunk_records = [
            RAGDocumentChunk(
                document_id=document.id,
                chunk_index=chunk.chunk_index,
                page_number=chunk.page_number,
                content=chunk.content,
                character_count=(
                    chunk.character_count
                ),
                token_count=chunk.token_count,
                embedding=embedding,
                chunk_metadata=(
                    chunk.metadata
                ),
            )
            for chunk, embedding
            in zip(
                prepared_chunks,
                embeddings,
                strict=True,
            )
        ]

        create_chunk_records(
            database_session,
            chunk_records,
        )

        document.page_count = (
            extracted_document.page_count
        )
        document.chunk_count = len(
            chunk_records
        )
        document.status = (
            RAGDocumentStatus.READY
        )
        document.processed_at = (
            datetime.now(timezone.utc)
        )
        document.error_message = None

        database_session.commit()
        database_session.refresh(
            document
        )

        return document

    except (
        DocumentLoadingError,
        DocumentChunkingError,
        EmbeddingProviderError,
        SQLAlchemyError,
        ValueError,
    ) as error:
        database_session.rollback()

        failed_document = (
            get_document_by_id(
                database_session,
                document_id,
            )
        )

        if failed_document is not None:
            failed_document.status = (
                RAGDocumentStatus.FAILED
            )
            failed_document.error_message = (
                str(error)[:2000]
            )

            try:
                database_session.commit()
                database_session.refresh(
                    failed_document
                )

            except SQLAlchemyError:
                database_session.rollback()

        raise RAGDocumentProcessingError(
            "The document could not "
            "be processed."
        ) from error


def list_documents(
    database_session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: (
        RAGDocumentStatus | None
    ) = None,
    uploaded_by_user_id: (
        UUID | None
    ) = None,
) -> tuple[list[RAGDocument], int]:
    return get_document_records(
        database_session,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        uploaded_by_user_id=(
            uploaded_by_user_id
        ),
    )


def read_document_chunks(
    database_session: Session,
    document_id: UUID,
) -> list[RAGDocumentChunk]:
    get_document_or_raise(
        database_session,
        document_id,
    )

    return get_document_chunks(
        database_session,
        document_id,
    )


def delete_document(
    database_session: Session,
    document_id: UUID,
) -> None:
    document = get_document_or_raise(
        database_session,
        document_id,
    )

    storage_path = document.storage_path

    try:
        delete_document_record(
            database_session,
            document,
        )

        database_session.commit()

    except SQLAlchemyError:
        database_session.rollback()
        raise

    delete_stored_document(
        storage_path
    )
