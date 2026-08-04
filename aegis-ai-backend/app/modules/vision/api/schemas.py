from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.vision_inspection import (
    VisionInspectionResult,
    VisionInspectionSeverity,
    VisionInspectionStatus,
)


class VisionInspectionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    inspection_code: str

    uploaded_by_user_id: UUID | None
    machine_id: UUID | None

    product_name: str
    camera: str | None
    zone: str | None

    original_filename: str
    content_type: str
    file_size_bytes: int

    image_width: int
    image_height: int

    model_provider: str
    model_name: str

    status: VisionInspectionStatus
    result: VisionInspectionResult | None
    severity: VisionInspectionSeverity | None

    confidence: float | None
    finding: str | None
    defect_type: str | None
    recommended_action: str | None

    analysis_duration_ms: int | None
    error_message: str | None

    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class VisionInspectionListResponse(BaseModel):
    inspections: list[
        VisionInspectionResponse
    ]

    total: int = Field(
        ge=0,
    )
