from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.machine import (
    MachineStatus,
    MachineType,
)


class MachineBase(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    asset_code: str = Field(
        min_length=2,
        max_length=80,
    )

    machine_type: MachineType

    status: MachineStatus = (
        MachineStatus.OPERATIONAL
    )

    facility: str = Field(
        min_length=2,
        max_length=150,
    )

    production_line: str | None = Field(
        default=None,
        max_length=150,
    )

    manufacturer: str | None = Field(
        default=None,
        max_length=150,
    )

    model_number: str | None = Field(
        default=None,
        max_length=100,
    )

    health_score: float = Field(
        default=100.0,
        ge=0,
        le=100,
    )

    temperature_celsius: float | None = (
        Field(
            default=None,
            ge=-100,
            le=500,
        )
    )

    vibration_mm_s: float | None = Field(
        default=None,
        ge=0,
    )

    power_consumption_kw: float | None = (
        Field(
            default=None,
            ge=0,
        )
    )

    last_maintenance_at: datetime | None = (
        None
    )

    next_maintenance_at: datetime | None = (
        None
    )

    last_seen_at: datetime | None = None


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    asset_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=80,
    )

    machine_type: MachineType | None = None

    status: MachineStatus | None = None

    facility: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    production_line: str | None = Field(
        default=None,
        max_length=150,
    )

    manufacturer: str | None = Field(
        default=None,
        max_length=150,
    )

    model_number: str | None = Field(
        default=None,
        max_length=100,
    )

    health_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    temperature_celsius: float | None = (
        Field(
            default=None,
            ge=-100,
            le=500,
        )
    )

    vibration_mm_s: float | None = Field(
        default=None,
        ge=0,
    )

    power_consumption_kw: float | None = (
        Field(
            default=None,
            ge=0,
        )
    )

    last_maintenance_at: datetime | None = (
        None
    )

    next_maintenance_at: datetime | None = (
        None
    )

    last_seen_at: datetime | None = None


class MachineTelemetryUpdate(BaseModel):
    status: MachineStatus | None = None

    health_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    temperature_celsius: float | None = (
        Field(
            default=None,
            ge=-100,
            le=500,
        )
    )

    vibration_mm_s: float | None = Field(
        default=None,
        ge=0,
    )

    power_consumption_kw: float | None = (
        Field(
            default=None,
            ge=0,
        )
    )


class MachineResponse(MachineBase):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    created_at: datetime
    updated_at: datetime


class MachineSummaryResponse(BaseModel):
    total: int
    operational: int
    warning: int
    critical: int
    offline: int
    maintenance: int
    average_health_score: float