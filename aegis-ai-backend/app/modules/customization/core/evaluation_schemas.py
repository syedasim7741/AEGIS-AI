from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.modules.customization.core.schemas import (
    CustomizationCategory,
)


class EvaluationConceptGroup(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    label: str = Field(
        min_length=2,
        max_length=120,
    )

    any_of: list[str] = Field(
        min_length=1,
        max_length=20,
    )

    @field_validator(
        "label",
        mode="before",
    )
    @classmethod
    def normalize_label(
        cls,
        value: object,
    ) -> object:
        if isinstance(value, str):
            return value.strip()

        return value

    @field_validator(
        "any_of",
        mode="before",
    )
    @classmethod
    def normalize_phrases(
        cls,
        value: object,
    ) -> object:
        if not isinstance(value, list):
            return value

        normalized: list[str] = []

        for item in value:
            if not isinstance(item, str):
                normalized.append(item)
                continue

            phrase = item.strip().casefold()

            if (
                phrase
                and phrase not in normalized
            ):
                normalized.append(phrase)

        return normalized


class CustomizationEvaluationCase(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    case_id: str = Field(
        min_length=3,
        max_length=80,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._-]+$",
    )

    category: CustomizationCategory

    prompt: str = Field(
        min_length=10,
        max_length=4000,
    )

    required_concepts: list[
        EvaluationConceptGroup
    ] = Field(
        min_length=1,
        max_length=20,
    )

    forbidden_phrases: list[str] = Field(
        default_factory=list,
        max_length=30,
    )

    safety_critical: bool = False

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )

    @field_validator(
        "prompt",
        "notes",
        mode="before",
    )
    @classmethod
    def normalize_text(
        cls,
        value: object,
    ) -> object:
        if value is None:
            return None

        if isinstance(value, str):
            normalized = value.strip()

            return normalized or None

        return value

    @field_validator(
        "forbidden_phrases",
        mode="before",
    )
    @classmethod
    def normalize_forbidden_phrases(
        cls,
        value: object,
    ) -> object:
        if not isinstance(value, list):
            return value

        normalized: list[str] = []

        for item in value:
            if not isinstance(item, str):
                normalized.append(item)
                continue

            phrase = item.strip().casefold()

            if (
                phrase
                and phrase not in normalized
            ):
                normalized.append(phrase)

        return normalized

    @model_validator(mode="after")
    def validate_concepts(
        self,
    ) -> "CustomizationEvaluationCase":
        labels = [
            group.label.casefold()
            for group in self.required_concepts
        ]

        if len(labels) != len(set(labels)):
            raise ValueError(
                "Required concept labels must be unique."
            )

        required_phrases = {
            phrase
            for group in self.required_concepts
            for phrase in group.any_of
        }

        overlapping_phrases = (
            required_phrases
            & set(self.forbidden_phrases)
        )

        if overlapping_phrases:
            raise ValueError(
                "A phrase cannot be both required "
                "and forbidden."
            )

        return self


class CustomizationEvaluationSuite(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    suite_name: str = Field(
        min_length=3,
        max_length=120,
    )

    suite_version: str = Field(
        min_length=1,
        max_length=40,
    )

    description: str = Field(
        min_length=10,
        max_length=1000,
    )

    cases: list[
        CustomizationEvaluationCase
    ] = Field(
        min_length=1,
        max_length=1000,
    )

    @model_validator(mode="after")
    def validate_suite(
        self,
    ) -> "CustomizationEvaluationSuite":
        case_ids = [
            case.case_id
            for case in self.cases
        ]

        if (
            len(case_ids)
            != len(set(case_ids))
        ):
            raise ValueError(
                "Evaluation case IDs must be unique."
            )

        normalized_prompts = [
            case.prompt.casefold()
            for case in self.cases
        ]

        if (
            len(normalized_prompts)
            != len(set(normalized_prompts))
        ):
            raise ValueError(
                "Evaluation prompts must be unique."
            )

        return self
