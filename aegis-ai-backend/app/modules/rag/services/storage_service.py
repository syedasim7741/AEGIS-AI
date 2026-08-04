from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from uuid import uuid4

from app.modules.rag.core.settings import (
    get_rag_settings,
)


class InvalidDocumentError(ValueError):
    pass


class UnsupportedDocumentTypeError(
    InvalidDocumentError
):
    pass


class DocumentTooLargeError(
    InvalidDocumentError
):
    pass


class EmptyDocumentError(
    InvalidDocumentError
):
    pass


@dataclass(frozen=True)
class StoredDocument:
    original_filename: str
    stored_filename: str
    content_type: str
    file_size_bytes: int
    storage_path: str
    checksum_sha256: str


ALLOWED_DOCUMENT_TYPES = {
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/markdown": ".md",
}


def normalize_filename(
    filename: str | None,
) -> str:
    if filename is None:
        raise InvalidDocumentError(
            "A document filename is required."
        )

    normalized_filename = Path(
        filename
    ).name.strip()

    if not normalized_filename:
        raise InvalidDocumentError(
            "A valid document filename is required."
        )

    return normalized_filename


def validate_document_content(
    *,
    filename: str | None,
    content_type: str | None,
    content: bytes,
) -> tuple[str, str]:
    settings = get_rag_settings()

    normalized_filename = normalize_filename(
        filename
    )

    normalized_content_type = (
        content_type
        or "application/octet-stream"
    ).lower()

    expected_extension = (
        ALLOWED_DOCUMENT_TYPES.get(
            normalized_content_type
        )
    )

    if expected_extension is None:
        raise UnsupportedDocumentTypeError(
            "Only PDF, TXT, and Markdown "
            "documents are supported."
        )

    actual_extension = Path(
        normalized_filename
    ).suffix.lower()

    if actual_extension != expected_extension:
        raise UnsupportedDocumentTypeError(
            "The file extension does not match "
            "the uploaded document type."
        )

    if not content:
        raise EmptyDocumentError(
            "The uploaded document is empty."
        )

    maximum_size_bytes = (
        settings.rag_max_file_size_mb
        * 1024
        * 1024
    )

    if len(content) > maximum_size_bytes:
        raise DocumentTooLargeError(
            "The uploaded document exceeds "
            f"{settings.rag_max_file_size_mb} MB."
        )

    return (
        normalized_filename,
        normalized_content_type,
    )


def save_document(
    *,
    filename: str | None,
    content_type: str | None,
    content: bytes,
) -> StoredDocument:
    settings = get_rag_settings()

    (
        normalized_filename,
        normalized_content_type,
    ) = validate_document_content(
        filename=filename,
        content_type=content_type,
        content=content,
    )

    extension = Path(
        normalized_filename
    ).suffix.lower()

    stored_filename = (
        f"{uuid4().hex}{extension}"
    )

    storage_directory = Path(
        settings.rag_storage_directory
    )

    storage_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    storage_path = (
        storage_directory
        / stored_filename
    )

    storage_path.write_bytes(content)

    return StoredDocument(
        original_filename=normalized_filename,
        stored_filename=stored_filename,
        content_type=normalized_content_type,
        file_size_bytes=len(content),
        storage_path=str(
            storage_path.resolve()
        ),
        checksum_sha256=sha256(
            content
        ).hexdigest(),
    )


def delete_stored_document(
    storage_path: str,
) -> None:
    document_path = Path(storage_path)

    if document_path.exists():
        document_path.unlink()
