from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
)


class PredictiveRiskLevel(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class PredictiveMaintenanceAssessment(
    BaseModel
):
    machine_id: UUID

    machine_name: str = Field(
        min_length=1,
        max_length=150,
    )

    asset_code: str = Field(
        min_length=1,
        max_length=80,
    )

    facility: str = Field(
        min_length=1,
        max_length=150,
    )

    production_line: str | None = None

    risk_score: float = Field(
        ge=0,
        le=100,
    )

    risk_level: PredictiveRiskLevel

    current_status: str

    health_score: float = Field(
        ge=0,
        le=100,
    )

    temperature_celsius: float | None

    vibration_mm_s: float | None

    power_consumption_kw: float | None

    health_trend_percent: float

    temperature_trend_celsius: float

    vibration_trend_mm_s: float

    anomaly_count: int = Field(
        ge=0,
    )

    telemetry_reading_count: int = Field(
        ge=0,
    )

    risk_factors: list[str]

    recommended_action: str

    assessed_at: datetime


class PredictiveMaintenanceListResponse(
    BaseModel
):
    assessments: list[
        PredictiveMaintenanceAssessment
    ]

    total: int = Field(
        ge=0,
    )


class PredictiveMaintenanceSummary(
    BaseModel
):
    total_machines: int = Field(
        ge=0,
    )

    low_risk: int = Field(
        ge=0,
    )

    medium_risk: int = Field(
        ge=0,
    )

    high_risk: int = Field(
        ge=0,
    )

    critical_risk: int = Field(
        ge=0,
    )

    machines_requiring_attention: int = Field(
        ge=0,
    )

    average_risk_score: float = Field(
        ge=0,
        le=100,
    )

    generated_at: datetime