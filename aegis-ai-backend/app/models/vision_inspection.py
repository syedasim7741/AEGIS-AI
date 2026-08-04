from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import (
    UUID as PostgreSQLUUID,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.db.base import Base


class VisionInspectionStatus(StrEnum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"


class VisionInspectionResult(StrEnum):
    PASS = "Pass"
    DEFECT = "Defect"
    REVIEW = "Review"


class VisionInspectionSeverity(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class VisionInspection(Base):
    __tablename__ = "vision_inspections"

    __table_args__ = (
        CheckConstraint(
            (
                "confidence IS NULL OR "
                "(confidence >= 0 AND confidence <= 100)"
            ),
            name=(
                "ck_vision_inspections_"
                "confidence_range"
            ),
        ),
        CheckConstraint(
            "image_width > 0",
            name=(
                "ck_vision_inspections_"
                "image_width_positive"
            ),
        ),
        CheckConstraint(
            "image_height > 0",
            name=(
                "ck_vision_inspections_"
                "image_height_positive"
            ),
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    inspection_code: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        unique=True,
        index=True,
    )

    uploaded_by_user_id: Mapped[
        UUID | None
    ] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    machine_id: Mapped[
        UUID | None
    ] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "machines.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    product_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    camera: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    zone: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    stored_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
    )

    content_type: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    file_size_bytes: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    storage_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        unique=True,
    )

    checksum_sha256: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    image_width: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    image_height: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    model_provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="ollama",
    )

    model_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    status: Mapped[
        VisionInspectionStatus
    ] = mapped_column(
        Enum(
            VisionInspectionStatus,
            name="vision_inspection_status",
            values_callable=lambda enum: [
                item.value
                for item in enum
            ],
        ),
        nullable=False,
        default=VisionInspectionStatus.PENDING,
        index=True,
    )

    result: Mapped[
        VisionInspectionResult | None
    ] = mapped_column(
        Enum(
            VisionInspectionResult,
            name="vision_inspection_result",
            values_callable=lambda enum: [
                item.value
                for item in enum
            ],
        ),
        nullable=True,
        index=True,
    )

    severity: Mapped[
        VisionInspectionSeverity | None
    ] = mapped_column(
        Enum(
            VisionInspectionSeverity,
            name="vision_inspection_severity",
            values_callable=lambda enum: [
                item.value
                for item in enum
            ],
        ),
        nullable=True,
        index=True,
    )

    confidence: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    finding: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    defect_type: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
    )

    recommended_action: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    analysis_duration_ms: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        nullable=True,
    )

    error_message: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    completed_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
