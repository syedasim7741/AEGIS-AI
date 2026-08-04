from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    AdministratorUser,
    CurrentUser,
)
from app.db.session import (
    get_database_session,
)
from app.models.rag_document import (
    RAGDocumentStatus,
)
from app.modules.rag.api.schemas import (
    RAGDocumentChunkListResponse,
    RAGDocumentChunkResponse,
    RAGDocumentListResponse,
    RAGDocumentResponse,
    RAGAnswerRequest,
    RAGAnswerResponse,
    RAGDocumentUploadResponse,
    RAGSearchRequest,
    RAGSearchResponse,
    RAGSearchResultResponse,
)
from app.modules.rag.core.settings import (
    get_rag_settings,
)
from app.modules.rag.services.document_service import (
    DuplicateRAGDocumentError,
    RAGDocumentNotFoundError,
    RAGDocumentProcessingError,
    delete_document,
    get_document_or_raise,
    list_documents,
    process_document,
    read_document_chunks,
    register_document,
)
from app.modules.rag.services.answer_service import (
    RAGAnswerError,
    answer_rag_question,
)
from app.modules.rag.services.search_service import (
    RAGSearchError,
    search_rag_chunks,
)
from app.modules.rag.services.storage_service import (
    InvalidDocumentError,
)


router = APIRouter(
    prefix="/rag/documents",
    tags=["RAG Documents"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


@router.post(
    "/upload",
    response_model=RAGDocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a RAG document",
)
async def upload_document(
    database_session: DatabaseSession,
    administrator: AdministratorUser,
    file: Annotated[
        UploadFile,
        File(
            description=(
                "PDF, TXT, or Markdown document"
            ),
        ),
    ],
) -> RAGDocumentUploadResponse:
    settings = get_rag_settings()

    maximum_bytes = (
        settings.rag_max_file_size_mb
        * 1024
        * 1024
    )

    try:
        content = await file.read(
            maximum_bytes + 1
        )

    finally:
        await file.close()

    try:
        document = register_document(
            database_session,
            uploaded_by_user_id=(
                administrator.id
            ),
            filename=file.filename,
            content_type=file.content_type,
            content=content,
        )

    except DuplicateRAGDocumentError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except InvalidDocumentError as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(error),
        ) from error

    return RAGDocumentUploadResponse(
        message=(
            "Document uploaded successfully. "
            "It is ready for processing."
        ),
        document=(
            RAGDocumentResponse
            .model_validate(document)
        ),
    )


@router.get(
    "",
    response_model=RAGDocumentListResponse,
    summary="List RAG documents",
)
def read_documents(
    database_session: DatabaseSession,
    current_user: CurrentUser,
    skip: Annotated[
        int,
        Query(ge=0),
    ] = 0,
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=200,
        ),
    ] = 100,
    search: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=255,
        ),
    ] = None,
    document_status: Annotated[
        RAGDocumentStatus | None,
        Query(alias="status"),
    ] = None,
) -> RAGDocumentListResponse:
    del current_user

    documents, total = list_documents(
        database_session,
        skip=skip,
        limit=limit,
        search=search,
        status=document_status,
    )

    return RAGDocumentListResponse(
        documents=[
            RAGDocumentResponse
            .model_validate(document)
            for document in documents
        ],
        total=total,
    )


@router.post(
    "/answer",
    response_model=RAGAnswerResponse,
    summary="Answer a question using RAG",
)
def answer_document_question(
    request: RAGAnswerRequest,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> RAGAnswerResponse:
    del current_user

    try:
        result = answer_rag_question(
            database_session,
            request.question,
            top_k=request.top_k,
            document_id=request.document_id,
        )

    except RAGAnswerError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=str(error),
        ) from error

    return RAGAnswerResponse(
        question=request.question,
        answer=result.answer,
        sources=[
            RAGSearchResultResponse(
                chunk=(
                    RAGDocumentChunkResponse
                    .model_validate(chunk)
                ),
                similarity=similarity,
                cosine_distance=cosine_distance,
            )
            for (
                chunk,
                similarity,
                cosine_distance,
            ) in result.sources
        ],
        total_sources=len(result.sources),
    )


@router.post(
    "/search",
    response_model=RAGSearchResponse,
    summary="Search RAG document chunks",
)
def search_documents(
    request: RAGSearchRequest,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> RAGSearchResponse:
    del current_user

    try:
        results = search_rag_chunks(
            database_session,
            request.query,
            limit=request.limit,
            document_id=request.document_id,
        )

    except RAGSearchError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=str(error),
        ) from error

    return RAGSearchResponse(
        query=request.query,
        results=[
            RAGSearchResultResponse(
                chunk=(
                    RAGDocumentChunkResponse
                    .model_validate(chunk)
                ),
                similarity=similarity,
                cosine_distance=cosine_distance,
            )
            for (
                chunk,
                similarity,
                cosine_distance,
            ) in results
        ],
        total=len(results),
    )


@router.post(
    "/{document_id}/process",
    response_model=RAGDocumentResponse,
    summary="Process and embed a RAG document",
)
def process_uploaded_document(
    document_id: UUID,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> RAGDocumentResponse:
    del administrator

    settings = get_rag_settings()

    if (
        settings.ai_provider == "ollama"
        and not settings.is_ollama_configured
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=(
                "Ollama is not configured."
            ),
        )

    if (
        settings.ai_provider == "openai"
        and not settings.is_openai_configured
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=(
                "OPENAI_API_KEY is not configured."
            ),
        )

    try:
        document = process_document(
            database_session,
            document_id,
        )

    except RAGDocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except RAGDocumentProcessingError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=str(error),
        ) from error

    return RAGDocumentResponse.model_validate(
        document
    )


@router.get(
    "/{document_id}/chunks",
    response_model=RAGDocumentChunkListResponse,
    summary="List document chunks",
)
def read_uploaded_document_chunks(
    document_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> RAGDocumentChunkListResponse:
    del current_user

    try:
        chunks = read_document_chunks(
            database_session,
            document_id,
        )

    except RAGDocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return RAGDocumentChunkListResponse(
        document_id=document_id,
        chunks=[
            RAGDocumentChunkResponse
            .model_validate(chunk)
            for chunk in chunks
        ],
        total=len(chunks),
    )


@router.get(
    "/{document_id}",
    response_model=RAGDocumentResponse,
    summary="Get a RAG document",
)
def read_document(
    document_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> RAGDocumentResponse:
    del current_user

    try:
        document = get_document_or_raise(
            database_session,
            document_id,
        )

    except RAGDocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return RAGDocumentResponse.model_validate(
        document
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a RAG document",
)
def remove_document(
    document_id: UUID,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> Response:
    del administrator

    try:
        delete_document(
            database_session,
            document_id,
        )

    except RAGDocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )
