from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.rag_document import (
    RAGDocumentStatus,
)


class RAGDocumentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    uploaded_by_user_id: UUID | None

    original_filename: str
    content_type: str
    file_size_bytes: int

    checksum_sha256: str
    status: RAGDocumentStatus

    page_count: int | None
    chunk_count: int
    error_message: str | None

    processed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class RAGDocumentListResponse(BaseModel):
    documents: list[RAGDocumentResponse]

    total: int = Field(
        ge=0,
    )


class RAGDocumentChunkResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    document_id: UUID

    chunk_index: int
    page_number: int | None

    content: str
    character_count: int
    token_count: int | None

    chunk_metadata: dict

    created_at: datetime


class RAGDocumentChunkListResponse(
    BaseModel
):
    document_id: UUID

    chunks: list[
        RAGDocumentChunkResponse
    ]

    total: int = Field(
        ge=0,
    )


class RAGDocumentUploadResponse(BaseModel):
    message: str
    document: RAGDocumentResponse


class RAGSearchRequest(BaseModel):
    query: str = Field(
        min_length=2,
        max_length=2000,
    )

    limit: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    document_id: UUID | None = None


class RAGSearchResultResponse(BaseModel):
    chunk: RAGDocumentChunkResponse

    similarity: float = Field(
        ge=-1.0,
        le=1.0,
    )

    cosine_distance: float = Field(
        ge=0.0,
        le=2.0,
    )


class RAGSearchResponse(BaseModel):
    query: str

    results: list[
        RAGSearchResultResponse
    ]

    total: int = Field(
        ge=0,
    )


class RAGAnswerRequest(BaseModel):
    question: str = Field(
        min_length=2,
        max_length=4000,
    )

    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    document_id: UUID | None = None


class RAGAnswerResponse(BaseModel):
    question: str
    answer: str

    sources: list[
        RAGSearchResultResponse
    ]

    total_sources: int = Field(
        ge=0,
    )

