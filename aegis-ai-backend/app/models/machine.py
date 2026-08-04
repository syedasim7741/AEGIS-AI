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


class MachineType(StrEnum):
    CNC = "CNC"
    CONVEYOR = "Conveyor"
    COMPRESSOR = "Compressor"
    PUMP = "Pump"
    TURBINE = "Turbine"
    GENERATOR = "Generator"
    PACKAGING = "Packaging"
    OTHER = "Other"


class MachineStatus(StrEnum):
    OPERATIONAL = "Operational"
    WARNING = "Warning"
    CRITICAL = "Critical"
    OFFLINE = "Offline"
    MAINTENANCE = "Maintenance"


class Machine(Base):
    __tablename__ = "machines"

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

    asset_code: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        unique=True,
        index=True,
    )

    machine_type: Mapped[MachineType] = (
        mapped_column(
            Enum(
                MachineType,
                name="machine_type",
                values_callable=lambda enum: [
                    item.value
                    for item in enum
                ],
            ),
            nullable=False,
        )
    )

    status: Mapped[MachineStatus] = (
        mapped_column(
            Enum(
                MachineStatus,
                name="machine_status",
                values_callable=lambda enum: [
                    item.value
                    for item in enum
                ],
            ),
            nullable=False,
            default=MachineStatus.OPERATIONAL,
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

    health_score: Mapped[float] = (
        mapped_column(
            Float,
            nullable=False,
            default=100.0,
        )
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