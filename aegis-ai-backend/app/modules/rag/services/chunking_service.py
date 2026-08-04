from dataclasses import dataclass

from app.modules.rag.core.settings import (
    get_rag_settings,
)
from app.modules.rag.loaders.document_loader import (
    ExtractedDocument,
)


class DocumentChunkingError(ValueError):
    pass


@dataclass(frozen=True)
class DocumentChunk:
    chunk_index: int
    page_number: int | None
    content: str
    character_count: int
    token_count: int | None
    metadata: dict


def find_chunk_end(
    text: str,
    *,
    start: int,
    target_end: int,
) -> int:
    if target_end >= len(text):
        return len(text)

    minimum_boundary = start + int(
        (target_end - start) * 0.7
    )

    boundary_candidates = (
        "\n\n",
        "\n",
        ". ",
        "! ",
        "? ",
        "; ",
        ", ",
        " ",
    )

    for boundary in boundary_candidates:
        position = text.rfind(
            boundary,
            minimum_boundary,
            target_end,
        )

        if position != -1:
            return position + len(boundary)

    return target_end


def split_text(
    text: str,
    *,
    chunk_size: int,
    chunk_overlap: int,
) -> list[
    tuple[int, int, str]
]:
    normalized_text = text.strip()

    if not normalized_text:
        return []

    chunks: list[
        tuple[int, int, str]
    ] = []

    start = 0
    text_length = len(normalized_text)

    while start < text_length:
        target_end = min(
            start + chunk_size,
            text_length,
        )

        end = find_chunk_end(
            normalized_text,
            start=start,
            target_end=target_end,
        )

        if end <= start:
            end = target_end

        chunk_content = normalized_text[
            start:end
        ].strip()

        if chunk_content:
            chunks.append(
                (
                    start,
                    end,
                    chunk_content,
                )
            )

        if end >= text_length:
            break

        next_start = max(
            end - chunk_overlap,
            start + 1,
        )

        while (
            next_start < text_length
            and normalized_text[next_start].isspace()
        ):
            next_start += 1

        start = next_start

    return chunks


def chunk_document(
    document: ExtractedDocument,
) -> list[DocumentChunk]:
    settings = get_rag_settings()

    document_chunks: list[
        DocumentChunk
    ] = []

    chunk_index = 0

    for page in document.pages:
        page_chunks = split_text(
            page.text,
            chunk_size=settings.rag_chunk_size,
            chunk_overlap=(
                settings.rag_chunk_overlap
            ),
        )

        for (
            start_character,
            end_character,
            chunk_content,
        ) in page_chunks:
            document_chunks.append(
                DocumentChunk(
                    chunk_index=chunk_index,
                    page_number=page.page_number,
                    content=chunk_content,
                    character_count=len(
                        chunk_content
                    ),
                    token_count=None,
                    metadata={
                        "page_number": (
                            page.page_number
                        ),
                        "start_character": (
                            start_character
                        ),
                        "end_character": (
                            end_character
                        ),
                    },
                )
            )

            chunk_index += 1

    if not document_chunks:
        raise DocumentChunkingError(
            "The document did not contain "
            "any text that could be chunked."
        )

    return document_chunks
