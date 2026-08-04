from enum import StrEnum
from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class CustomizationRole(StrEnum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class CustomizationCategory(StrEnum):
    INDUSTRIAL_OPERATIONS = (
        "industrial_operations"
    )
    MACHINE_MAINTENANCE = (
        "machine_maintenance"
    )
    WORKER_SAFETY = "worker_safety"
    DOCUMENT_ASSISTANT = (
        "document_assistant"
    )
    COMPUTER_VISION = "computer_vision"
    AGENTIC_WORKFLOW = (
        "agentic_workflow"
    )
    GENERAL = "general"


class CustomizationMessage(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    role: CustomizationRole

    content: str = Field(
        min_length=1,
        max_length=8000,
    )

    @field_validator(
        "content",
        mode="before",
    )
    @classmethod
    def normalize_content(
        cls,
        value: object,
    ) -> object:
        if not isinstance(value, str):
            return value

        return value.strip()


class CustomizationExample(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    example_id: str = Field(
        min_length=3,
        max_length=80,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._-]+$",
    )

    category: CustomizationCategory

    messages: list[
        CustomizationMessage
    ] = Field(
        min_length=2,
        max_length=12,
    )

    tags: list[str] = Field(
        default_factory=list,
        max_length=20,
    )

    source: str | None = Field(
        default=None,
        max_length=255,
    )

    metadata: dict[
        str,
        str | int | float | bool | None,
    ] = Field(
        default_factory=dict,
    )

    @field_validator(
        "example_id",
        "source",
        mode="before",
    )
    @classmethod
    def normalize_optional_text(
        cls,
        value: object,
    ) -> object:
        if value is None:
            return None

        if not isinstance(value, str):
            return value

        normalized = value.strip()

        if not normalized:
            return None

        return normalized

    @field_validator(
        "tags",
        mode="before",
    )
    @classmethod
    def normalize_tags(
        cls,
        value: object,
    ) -> object:
        if not isinstance(value, list):
            return value

        normalized_tags: list[str] = []

        for item in value:
            if not isinstance(item, str):
                normalized_tags.append(item)
                continue

            normalized_item = (
                item.strip().lower()
            )

            if (
                normalized_item
                and normalized_item
                not in normalized_tags
            ):
                normalized_tags.append(
                    normalized_item
                )

        return normalized_tags

    @model_validator(mode="after")
    def validate_message_sequence(
        self,
    ) -> "CustomizationExample":
        messages = self.messages

        system_message_count = sum(
            message.role
            == CustomizationRole.SYSTEM
            for message in messages
        )

        if system_message_count > 1:
            raise ValueError(
                "Only one system message is allowed."
            )

        if (
            system_message_count == 1
            and messages[0].role
            != CustomizationRole.SYSTEM
        ):
            raise ValueError(
                "The system message must be first."
            )

        conversation_messages = [
            message
            for message in messages
            if message.role
            != CustomizationRole.SYSTEM
        ]

        if not conversation_messages:
            raise ValueError(
                "The example must include a user "
                "and assistant exchange."
            )

        if (
            conversation_messages[0].role
            != CustomizationRole.USER
        ):
            raise ValueError(
                "The first conversation message "
                "must be from the user."
            )

        if (
            conversation_messages[-1].role
            != CustomizationRole.ASSISTANT
        ):
            raise ValueError(
                "The final message must be from "
                "the assistant."
            )

        expected_role = (
            CustomizationRole.USER
        )

        for message in conversation_messages:
            if message.role != expected_role:
                raise ValueError(
                    "User and assistant messages "
                    "must alternate."
                )

            expected_role = (
                CustomizationRole.ASSISTANT
                if expected_role
                == CustomizationRole.USER
                else CustomizationRole.USER
            )

        normalized_contents = [
            message.content.casefold()
            for message in messages
        ]

        if (
            len(normalized_contents)
            != len(set(normalized_contents))
        ):
            raise ValueError(
                "Duplicate messages are not allowed "
                "within one training example."
            )

        return self


class DatasetValidationIssue(BaseModel):
    line_number: int = Field(
        ge=1,
    )

    error: str = Field(
        min_length=1,
        max_length=2000,
    )


class DatasetValidationReport(BaseModel):
    dataset_filename: str

    total_lines: int = Field(
        ge=0,
    )

    valid_examples: int = Field(
        ge=0,
    )

    invalid_examples: int = Field(
        ge=0,
    )

    duplicate_examples: int = Field(
        ge=0,
    )

    categories: dict[str, int] = Field(
        default_factory=dict,
    )

    issues: list[
        DatasetValidationIssue
    ] = Field(
        default_factory=list,
    )

    is_valid: bool


class DatasetSummary(BaseModel):
    dataset_name: str
    dataset_version: str
    description: str
    example_count: int = Field(
        ge=0,
    )
    category_counts: dict[str, int]
    source_files: list[str]
    metadata: dict[str, Any] = Field(
        default_factory=dict,
    )
