from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.machine import (
    MachineStatus,
)


class MachineTelemetryCreate(BaseModel):
    status: MachineStatus

    health_score: float = Field(
        ge=0,
        le=100,
    )

    temperature_celsius: float | None = Field(
        default=None,
        ge=-100,
        le=500,
    )

    vibration_mm_s: float | None = Field(
        default=None,
        ge=0,
    )

    power_consumption_kw: float | None = Field(
        default=None,
        ge=0,
    )

    source: str = Field(
        default="api",
        min_length=1,
        max_length=50,
    )


class MachineTelemetryResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    machine_id: UUID
    status: str
    health_score: float
    temperature_celsius: float | None
    vibration_mm_s: float | None
    power_consumption_kw: float | None
    source: str
    recorded_at: datetime


class MachineTelemetryListResponse(BaseModel):
    readings: list[
        MachineTelemetryResponse
    ]

    total: int = Field(
        ge=0,
    )