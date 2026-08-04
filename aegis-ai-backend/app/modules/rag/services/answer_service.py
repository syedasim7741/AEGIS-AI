from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.rag_document_chunk import (
    RAGDocumentChunk,
)
from app.modules.rag.core.settings import (
    get_rag_settings,
)
from app.modules.rag.providers.chat_provider import (
    ChatProviderError,
    OllamaChatProvider,
    get_chat_provider,
)
from app.modules.rag.services.search_service import (
    RAGSearchError,
    search_rag_chunks,
)


class RAGAnswerError(RuntimeError):
    pass


@dataclass(frozen=True)
class RAGAnswerResult:
    answer: str

    sources: list[
        tuple[
            RAGDocumentChunk,
            float,
            float,
        ]
    ]


def answer_rag_question(
    database_session: Session,
    question: str,
    *,
    top_k: int = 5,
    document_id: UUID | None = None,
    chat_provider: (
        OllamaChatProvider | None
    ) = None,
) -> RAGAnswerResult:
    normalized_question = question.strip()

    if not normalized_question:
        raise ValueError(
            "Question cannot be empty."
        )

    if top_k < 1 or top_k > 20:
        raise ValueError(
            "Top K must be between 1 and 20."
        )

    try:
        search_results = search_rag_chunks(
            database_session,
            normalized_question,
            limit=top_k,
            document_id=document_id,
        )

        settings = get_rag_settings()

        search_results = [
            result
            for result in search_results
            if result[1] >= settings.rag_min_similarity
        ]

        if not search_results:
            return RAGAnswerResult(
                answer=(
                    "I could not find relevant "
                    "information in the uploaded "
                    "documents."
                ),
                sources=[],
            )

        context_sections: list[str] = []

        for source_number, (
            chunk,
            similarity,
            _cosine_distance,
        ) in enumerate(
            search_results,
            start=1,
        ):
            context_sections.append(
                "\n".join(
                    [
                        f"[Source {source_number}]",
                        (
                            "Document ID: "
                            f"{chunk.document_id}"
                        ),
                        (
                            "Chunk ID: "
                            f"{chunk.id}"
                        ),
                        (
                            "Similarity: "
                            f"{similarity:.4f}"
                        ),
                        "Content:",
                        chunk.content,
                    ]
                )
            )

        context = "\n\n".join(
            context_sections
        )

        provider = (
            chat_provider
            or get_chat_provider()
        )

        system_prompt = (
            "You are the AEGIS AI industrial "
            "document assistant. Answer the user's "
            "question only from the supplied document "
            "context. Do not invent facts. If the "
            "context does not contain the answer, say "
            "that the uploaded documents do not provide "
            "enough information. Give a clear and concise "
            "answer. Cite supporting sources using labels "
            "such as [Source 1]."
        )

        user_prompt = (
            f"Question:\n{normalized_question}"
            f"\n\nDocument context:\n{context}"
        )

        answer = provider.generate_answer(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        return RAGAnswerResult(
            answer=answer,
            sources=search_results,
        )

    except (
        RAGSearchError,
        ChatProviderError,
    ) as error:
        raise RAGAnswerError(
            "The RAG answer could not be generated."
        ) from error
