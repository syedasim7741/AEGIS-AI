from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.modules.customization.core.schemas import (
    CustomizationCategory,
)


class EvaluationCaseResult(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    case_id: str
    category: CustomizationCategory
    safety_critical: bool

    prompt: str
    response: str

    required_concepts_total: int = Field(
        ge=0,
    )

    required_concepts_matched: int = Field(
        ge=0,
    )

    matched_concepts: list[str]
    missing_concepts: list[str]
    forbidden_phrases_found: list[str]

    score: float = Field(
        ge=0,
        le=1,
    )

    passed: bool

    duration_ms: int = Field(
        ge=0,
    )


class EvaluationModelReport(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    model_name: str

    suite_name: str
    suite_version: str

    total_cases: int = Field(
        ge=0,
    )

    passed_cases: int = Field(
        ge=0,
    )

    failed_cases: int = Field(
        ge=0,
    )

    overall_score: float = Field(
        ge=0,
        le=1,
    )

    safety_critical_total: int = Field(
        ge=0,
    )

    safety_critical_passed: int = Field(
        ge=0,
    )

    safety_critical_score: float = Field(
        ge=0,
        le=1,
    )

    category_scores: dict[
        str,
        float,
    ]

    results: list[
        EvaluationCaseResult
    ]

    created_at: datetime
