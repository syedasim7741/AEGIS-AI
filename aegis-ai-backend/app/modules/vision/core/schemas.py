from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.models.vision_inspection import (
    VisionInspectionResult,
    VisionInspectionSeverity,
)


class VisionModelResult(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    result: VisionInspectionResult

    severity: VisionInspectionSeverity

    confidence: float = Field(
        ge=0,
        le=100,
    )

    finding: str = Field(
        min_length=1,
        max_length=2000,
    )

    defect_type: str | None = Field(
        default=None,
        max_length=150,
    )

    recommended_action: str | None = Field(
        default=None,
        max_length=2000,
    )

    inspection_subject_visible: bool = Field(
        default=False,
        description=(
            "Whether the requested product or asset "
            "is clearly visible in the image."
        ),
    )

    @field_validator(
        "finding",
        "defect_type",
        "recommended_action",
        mode="before",
    )
    @classmethod
    def normalize_text(
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

    @field_validator("finding")
    @classmethod
    def require_finding(
        cls,
        value: str | None,
    ) -> str:
        if value is None:
            raise ValueError(
                "The vision finding cannot be empty."
            )

        return value


    @model_validator(mode="after")
    def enforce_result_consistency(
        self,
    ) -> "VisionModelResult":
        normalized_finding = (
            self.finding.casefold()
        )

        non_inspection_terms = (
            "web browser",
            "browser interface",
            "developer tools",
            "devtools",
            "webpage",
            "website",
            "user interface",
            "software interface",
            "application window",
            "computer screen",
            "desktop screen",
            "screenshot",
            "code editor",
            "terminal window",
            "spreadsheet",
            "document page",
        )

        if any(
            term in normalized_finding
            for term in non_inspection_terms
        ):
            self.inspection_subject_visible = False

        if not self.inspection_subject_visible:
            self.result = (
                VisionInspectionResult.REVIEW
            )
            self.severity = (
                VisionInspectionSeverity.LOW
            )
            self.defect_type = (
                "Inspection subject not visible"
            )
            self.recommended_action = (
                "Upload a clear photograph that visibly "
                "shows the specified product or asset."
            )

            return self

        if (
            self.result
            == VisionInspectionResult.PASS
            and self.defect_type is not None
        ):
            self.result = (
                VisionInspectionResult.DEFECT
            )

            if (
                self.severity
                == VisionInspectionSeverity.LOW
            ):
                self.severity = (
                    VisionInspectionSeverity.MEDIUM
                )

        if (
            self.result
            == VisionInspectionResult.PASS
        ):
            self.severity = (
                VisionInspectionSeverity.LOW
            )
            self.defect_type = None
            self.recommended_action = None

        if (
            self.result
            == VisionInspectionResult.DEFECT
            and self.defect_type is None
        ):
            self.defect_type = "Visible anomaly"

        if (
            self.result
            == VisionInspectionResult.DEFECT
            and self.severity
            == VisionInspectionSeverity.LOW
        ):
            self.severity = (
                VisionInspectionSeverity.MEDIUM
            )

        return self
