import json
from collections.abc import Sequence
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.modules.rag.core.settings import (
    RAGSettings,
    get_rag_settings,
)


class ChatProviderError(RuntimeError):
    pass


class ChatProviderNotConfiguredError(
    ChatProviderError
):
    pass


class InvalidChatInputError(
    ChatProviderError
):
    pass


class InvalidChatResponseError(
    ChatProviderError
):
    pass


@dataclass(frozen=True)
class ChatMessage:
    role: str
    content: str


class OllamaChatProvider:
    def __init__(
        self,
        settings: RAGSettings | None = None,
    ) -> None:
        self.settings = (
            settings
            or get_rag_settings()
        )

    def chat(
        self,
        messages: Sequence[ChatMessage],
    ) -> str:
        if not self.settings.is_ollama_configured:
            raise ChatProviderNotConfiguredError(
                "Ollama is not configured."
            )

        normalized_messages: list[
            dict[str, str]
        ] = []

        for message in messages:
            role = message.role.strip().lower()
            content = message.content.strip()

            if role not in {
                "system",
                "user",
                "assistant",
            }:
                raise InvalidChatInputError(
                    f"Unsupported chat role: {role}"
                )

            if not content:
                raise InvalidChatInputError(
                    "Chat message content cannot be empty."
                )

            normalized_messages.append(
                {
                    "role": role,
                    "content": content,
                }
            )

        if not normalized_messages:
            raise InvalidChatInputError(
                "At least one chat message is required."
            )

        base_url = (
            self.settings
            .ollama_base_url
            .rstrip("/")
        )

        request_body = json.dumps(
            {
                "model": (
                    self.settings
                    .ollama_chat_model
                ),
                "messages": normalized_messages,
                "stream": False,
                "think": False,
                "keep_alive": "10m",
                "options": {
                    "temperature": 0.1,
                    "num_predict": 300,
                },
            }
        ).encode("utf-8")

        request = Request(
            url=f"{base_url}/api/chat",
            data=request_body,
            method="POST",
            headers={
                "Content-Type": "application/json",
            },
        )

        try:
            with urlopen(
                request,
                timeout=300,
            ) as response:
                response_data = json.loads(
                    response.read().decode("utf-8")
                )

        except HTTPError as error:
            error_body = (
                error.read()
                .decode(
                    "utf-8",
                    errors="replace",
                )
            )

            raise ChatProviderError(
                "Ollama rejected the chat request: "
                f"{error_body}"
            ) from error

        except URLError as error:
            raise ChatProviderError(
                "Could not connect to Ollama at "
                f"{base_url}."
            ) from error

        except TimeoutError as error:
            raise ChatProviderError(
                "The Ollama chat request timed out."
            ) from error

        except json.JSONDecodeError as error:
            raise InvalidChatResponseError(
                "Ollama returned invalid JSON."
            ) from error

        message_data = response_data.get(
            "message"
        )

        if not isinstance(message_data, dict):
            raise InvalidChatResponseError(
                "Ollama did not return a chat message."
            )

        content = message_data.get("content")

        if not isinstance(content, str):
            raise InvalidChatResponseError(
                "Ollama returned invalid message content."
            )

        normalized_content = content.strip()

        if not normalized_content:
            raise InvalidChatResponseError(
                "Ollama returned an empty answer."
            )

        return normalized_content

    def generate_answer(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        return self.chat(
            [
                ChatMessage(
                    role="system",
                    content=system_prompt,
                ),
                ChatMessage(
                    role="user",
                    content=user_prompt,
                ),
            ]
        )


def get_chat_provider(
    settings: RAGSettings | None = None,
) -> OllamaChatProvider:
    active_settings = (
        settings
        or get_rag_settings()
    )

    if active_settings.ai_provider != "ollama":
        raise ChatProviderNotConfiguredError(
            "The active chat provider is not supported."
        )

    return OllamaChatProvider(
        active_settings
    )
