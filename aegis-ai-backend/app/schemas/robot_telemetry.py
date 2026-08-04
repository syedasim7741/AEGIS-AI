from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.robot import (
    RobotStatus,
)


class RobotTelemetryCreate(BaseModel):
    status: RobotStatus

    current_task: str | None = Field(
        default=None,
        max_length=250,
    )

    health_score: float = Field(
        ge=0,
        le=100,
    )

    utilization_percent: float = Field(
        ge=0,
        le=100,
    )

    battery_level_percent: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    payload_kg: float | None = Field(
        default=None,
        ge=0,
    )

    temperature_celsius: float | None = Field(
        default=None,
        ge=-100,
        le=500,
    )

    position_x: float | None = None
    position_y: float | None = None
    position_z: float | None = None

    error_code: str | None = Field(
        default=None,
        max_length=100,
    )

    source: str = Field(
        default="api",
        min_length=1,
        max_length=50,
    )


class RobotTelemetryResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    robot_id: UUID
    status: str
    current_task: str | None
    health_score: float
    utilization_percent: float
    battery_level_percent: float | None
    payload_kg: float | None
    temperature_celsius: float | None
    position_x: float | None
    position_y: float | None
    position_z: float | None
    error_code: str | None
    source: str
    recorded_at: datetime


class RobotTelemetryListResponse(BaseModel):
    readings: list[
        RobotTelemetryResponse
    ]

    total: int = Field(
        ge=0,
    )