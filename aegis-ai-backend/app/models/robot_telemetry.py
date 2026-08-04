from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
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


class RobotTelemetryReading(Base):
    __tablename__ = "robot_telemetry_readings"

    __table_args__ = (
        Index(
            "ix_robot_telemetry_robot_recorded",
            "robot_id",
            "recorded_at",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    robot_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "robots.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    current_task: Mapped[
        str | None
    ] = mapped_column(
        String(250),
        nullable=True,
    )

    health_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    utilization_percent: Mapped[float] = mapped_column(
        Float,
        nullable=False,
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
    )

    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="api",
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )