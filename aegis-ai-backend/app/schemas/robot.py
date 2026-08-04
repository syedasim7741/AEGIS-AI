from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.robot import (
    RobotStatus,
    RobotType,
)


class RobotBase(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    robot_code: str = Field(
        min_length=2,
        max_length=80,
    )

    robot_type: RobotType

    status: RobotStatus = (
        RobotStatus.IDLE
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

    current_task: str | None = Field(
        default=None,
        max_length=250,
    )

    health_score: float = Field(
        default=100.0,
        ge=0,
        le=100,
    )

    utilization_percent: float = Field(
        default=0.0,
        ge=0,
        le=100,
    )

    battery_level_percent: float | None = (
        Field(
            default=None,
            ge=0,
            le=100,
        )
    )

    payload_kg: float | None = Field(
        default=None,
        ge=0,
    )

    temperature_celsius: float | None = (
        Field(
            default=None,
            ge=-100,
            le=500,
        )
    )

    position_x: float | None = None
    position_y: float | None = None
    position_z: float | None = None

    error_code: str | None = Field(
        default=None,
        max_length=100,
    )

    last_maintenance_at: datetime | None = (
        None
    )

    next_maintenance_at: datetime | None = (
        None
    )

    last_seen_at: datetime | None = None


class RobotCreate(RobotBase):
    pass


class RobotUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    robot_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=80,
    )

    robot_type: RobotType | None = None

    status: RobotStatus | None = None

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

    current_task: str | None = Field(
        default=None,
        max_length=250,
    )

    health_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    utilization_percent: float | None = (
        Field(
            default=None,
            ge=0,
            le=100,
        )
    )

    battery_level_percent: float | None = (
        Field(
            default=None,
            ge=0,
            le=100,
        )
    )

    payload_kg: float | None = Field(
        default=None,
        ge=0,
    )

    temperature_celsius: float | None = (
        Field(
            default=None,
            ge=-100,
            le=500,
        )
    )

    position_x: float | None = None
    position_y: float | None = None
    position_z: float | None = None

    error_code: str | None = Field(
        default=None,
        max_length=100,
    )

    last_maintenance_at: datetime | None = (
        None
    )

    next_maintenance_at: datetime | None = (
        None
    )

    last_seen_at: datetime | None = None


class RobotTelemetryUpdate(BaseModel):
    status: RobotStatus | None = None

    current_task: str | None = Field(
        default=None,
        max_length=250,
    )

    health_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    utilization_percent: float | None = (
        Field(
            default=None,
            ge=0,
            le=100,
        )
    )

    battery_level_percent: float | None = (
        Field(
            default=None,
            ge=0,
            le=100,
        )
    )

    payload_kg: float | None = Field(
        default=None,
        ge=0,
    )

    temperature_celsius: float | None = (
        Field(
            default=None,
            ge=-100,
            le=500,
        )
    )

    position_x: float | None = None
    position_y: float | None = None
    position_z: float | None = None

    error_code: str | None = Field(
        default=None,
        max_length=100,
    )


class RobotResponse(RobotBase):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    created_at: datetime
    updated_at: datetime


class RobotSummaryResponse(BaseModel):
    total: int
    active: int
    idle: int
    warning: int
    error: int
    offline: int
    maintenance: int
    average_health_score: float
    average_utilization_percent: float