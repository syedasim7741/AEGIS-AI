from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader
from pypdf.errors import PdfReadError


class DocumentLoadingError(ValueError):
    pass


class DocumentNotFoundError(
    DocumentLoadingError
):
    pass


class DocumentDecodingError(
    DocumentLoadingError
):
    pass


class DocumentTextExtractionError(
    DocumentLoadingError
):
    pass


class EncryptedDocumentError(
    DocumentLoadingError
):
    pass


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int | None
    text: str


@dataclass(frozen=True)
class ExtractedDocument:
    pages: list[ExtractedPage]
    page_count: int
    character_count: int


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".md",
}


def normalize_text(
    text: str,
) -> str:
    normalized_text = (
        text
        .replace("\x00", "")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
    )

    normalized_lines = [
        line.rstrip()
        for line in normalized_text.splitlines()
    ]

    return "\n".join(
        normalized_lines
    ).strip()


def load_pdf_document(
    document_path: Path,
) -> ExtractedDocument:
    try:
        reader = PdfReader(
            document_path,
            strict=False,
        )

    except (
        PdfReadError,
        OSError,
        ValueError,
    ) as error:
        raise DocumentLoadingError(
            "The PDF document could not be read."
        ) from error

    if reader.is_encrypted:
        try:
            decryption_result = reader.decrypt(
                ""
            )

        except Exception as error:
            raise EncryptedDocumentError(
                "Password-protected PDF documents "
                "are not supported."
            ) from error

        if decryption_result == 0:
            raise EncryptedDocumentError(
                "Password-protected PDF documents "
                "are not supported."
            )

    extracted_pages: list[
        ExtractedPage
    ] = []

    total_character_count = 0

    for page_index, page in enumerate(
        reader.pages,
        start=1,
    ):
        try:
            extracted_text = (
                page.extract_text()
                or ""
            )

        except Exception as error:
            raise DocumentTextExtractionError(
                "Text extraction failed on "
                f"PDF page {page_index}."
            ) from error

        normalized_text = normalize_text(
            extracted_text
        )

        total_character_count += len(
            normalized_text
        )

        extracted_pages.append(
            ExtractedPage(
                page_number=page_index,
                text=normalized_text,
            )
        )

    if total_character_count == 0:
        raise DocumentTextExtractionError(
            "No readable text was found in the PDF. "
            "The document may contain only scanned images."
        )

    return ExtractedDocument(
        pages=extracted_pages,
        page_count=len(extracted_pages),
        character_count=total_character_count,
    )


def load_text_document(
    document_path: Path,
) -> ExtractedDocument:
    try:
        raw_content = document_path.read_bytes()

        decoded_text = raw_content.decode(
            "utf-8-sig"
        )

    except UnicodeDecodeError as error:
        raise DocumentDecodingError(
            "TXT and Markdown documents must use "
            "UTF-8 text encoding."
        ) from error

    except OSError as error:
        raise DocumentLoadingError(
            "The text document could not be read."
        ) from error

    normalized_text = normalize_text(
        decoded_text
    )

    if not normalized_text:
        raise DocumentTextExtractionError(
            "No readable text was found "
            "in the document."
        )

    return ExtractedDocument(
        pages=[
            ExtractedPage(
                page_number=None,
                text=normalized_text,
            )
        ],
        page_count=1,
        character_count=len(
            normalized_text
        ),
    )


def load_document(
    storage_path: str,
) -> ExtractedDocument:
    document_path = Path(
        storage_path
    )

    if not document_path.is_file():
        raise DocumentNotFoundError(
            "The stored document was not found."
        )

    extension = document_path.suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise DocumentLoadingError(
            "Unsupported stored document type."
        )

    if extension == ".pdf":
        return load_pdf_document(
            document_path
        )

    return load_text_document(
        document_path
    )
