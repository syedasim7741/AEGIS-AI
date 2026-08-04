from enum import StrEnum

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


class AdjudicationClassification(StrEnum):
    FALSE_NEGATIVE = "false_negative"
    CONFIRMED_FAILURE = "confirmed_failure"
    CONFIRMED_PASS = "confirmed_pass"
    NOT_REVIEWED = "not_reviewed"


class EvaluationAdjudicationDecision(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    case_id: str = Field(
        min_length=3,
        max_length=80,
    )

    classification: AdjudicationClassification

    final_passed: bool

    reason: str = Field(
        min_length=10,
        max_length=2000,
    )


class EvaluationAdjudicationFile(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    review_name: str = Field(
        min_length=3,
        max_length=120,
    )

    review_version: str = Field(
        min_length=1,
        max_length=40,
    )

    source_report: str = Field(
        min_length=3,
        max_length=500,
    )

    decisions: list[
        EvaluationAdjudicationDecision
    ]

    @model_validator(mode="after")
    def validate_decisions(
        self,
    ) -> "EvaluationAdjudicationFile":
        case_ids = [
            decision.case_id
            for decision in self.decisions
        ]

        if len(case_ids) != len(set(case_ids)):
            raise ValueError(
                "Adjudication case IDs must be unique."
            )

        for decision in self.decisions:
            if (
                decision.classification
                == AdjudicationClassification.FALSE_NEGATIVE
                and not decision.final_passed
            ):
                raise ValueError(
                    "A false negative must have "
                    "final_passed=True."
                )

            if (
                decision.classification
                == AdjudicationClassification.CONFIRMED_FAILURE
                and decision.final_passed
            ):
                raise ValueError(
                    "A confirmed failure must have "
                    "final_passed=False."
                )

        return self


class ReviewedEvaluationCase(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    case_id: str
    category: str
    safety_critical: bool

    automated_passed: bool
    final_passed: bool

    automated_score: float = Field(
        ge=0,
        le=1,
    )

    reviewed_score: float = Field(
        ge=0,
        le=1,
    )

    classification: AdjudicationClassification
    reason: str | None = None


class ReviewedEvaluationReport(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    model_name: str
    source_report: str

    total_cases: int = Field(
        ge=0,
    )

    automated_passed_cases: int = Field(
        ge=0,
    )

    reviewed_passed_cases: int = Field(
        ge=0,
    )

    automated_pass_rate: float = Field(
        ge=0,
        le=1,
    )

    reviewed_pass_rate: float = Field(
        ge=0,
        le=1,
    )

    automated_score: float = Field(
        ge=0,
        le=1,
    )

    reviewed_score: float = Field(
        ge=0,
        le=1,
    )

    safety_critical_total: int = Field(
        ge=0,
    )

    automated_safety_passed: int = Field(
        ge=0,
    )

    reviewed_safety_passed: int = Field(
        ge=0,
    )

    cases: list[
        ReviewedEvaluationCase
    ]
