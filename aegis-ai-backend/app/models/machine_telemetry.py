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


class MachineTelemetryReading(Base):
    __tablename__ = "machine_telemetry_readings"

    __table_args__ = (
        Index(
            "ix_machine_telemetry_machine_recorded",
            "machine_id",
            "recorded_at",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    machine_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "machines.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    health_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    temperature_celsius: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    vibration_mm_s: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    power_consumption_kw: Mapped[
        float | None
    ] = mapped_column(
        Float,
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