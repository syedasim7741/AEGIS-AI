from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    String,
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


class RobotType(StrEnum):
    ARTICULATED = "Articulated"
    COBOT = "Collaborative Robot"
    SCARA = "SCARA"
    DELTA = "Delta"
    MOBILE = "Autonomous Mobile Robot"
    WELDING = "Welding Robot"
    PALLETIZING = "Palletizing Robot"
    INSPECTION = "Inspection Robot"
    OTHER = "Other"


class RobotStatus(StrEnum):
    ACTIVE = "Active"
    IDLE = "Idle"
    WARNING = "Warning"
    ERROR = "Error"
    OFFLINE = "Offline"
    MAINTENANCE = "Maintenance"


class Robot(Base):
    __tablename__ = "robots"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    robot_code: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        unique=True,
        index=True,
    )

    robot_type: Mapped[RobotType] = (
        mapped_column(
            Enum(
                RobotType,
                name="robot_type",
                values_callable=lambda enum: [
                    item.value
                    for item in enum
                ],
            ),
            nullable=False,
            index=True,
        )
    )

    status: Mapped[RobotStatus] = (
        mapped_column(
            Enum(
                RobotStatus,
                name="robot_status",
                values_callable=lambda enum: [
                    item.value
                    for item in enum
                ],
            ),
            nullable=False,
            default=RobotStatus.IDLE,
            index=True,
        )
    )

    facility: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    production_line: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
    )

    manufacturer: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
    )

    model_number: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    current_task: Mapped[
        str | None
    ] = mapped_column(
        String(250),
        nullable=True,
    )

    health_score: Mapped[float] = (
        mapped_column(
            Float,
            nullable=False,
            default=100.0,
        )
    )

    utilization_percent: Mapped[float] = (
        mapped_column(
            Float,
            nullable=False,
            default=0.0,
        )
    )

    battery_level_percent: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    payload_kg: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    temperature_celsius: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    position_x: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    position_y: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    position_z: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    error_code: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    last_maintenance_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    next_maintenance_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    last_seen_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = (
        mapped_column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        )
    )

    updated_at: Mapped[datetime] = (
        mapped_column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        )
    )