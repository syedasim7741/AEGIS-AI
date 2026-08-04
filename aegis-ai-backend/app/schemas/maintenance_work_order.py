from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)

from app.models.maintenance_work_order import (
    MaintenancePriority,
    MaintenanceWorkOrderStatus,
)


class MaintenanceWorkOrderCreate(BaseModel):
    machine_id: UUID

    title: str = Field(
        min_length=3,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    priority: MaintenancePriority = (
        MaintenancePriority.MEDIUM
    )

    risk_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    recommended_action: str | None = Field(
        default=None,
        max_length=5000,
    )

    assigned_to: str | None = Field(
        default=None,
        max_length=150,
    )

    scheduled_for: datetime | None = None


class MaintenanceWorkOrderUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    priority: MaintenancePriority | None = None

    status: MaintenanceWorkOrderStatus | None = None

    risk_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    recommended_action: str | None = Field(
        default=None,
        max_length=5000,
    )

    assigned_to: str | None = Field(
        default=None,
        max_length=150,
    )

    scheduled_for: datetime | None = None

    @model_validator(
        mode="after",
    )
    def validate_update_fields(
        self,
    ) -> "MaintenanceWorkOrderUpdate":
        if not self.model_fields_set:
            raise ValueError(
                "At least one work-order field "
                "must be provided."
            )

        return self


class MaintenanceWorkOrderStatusUpdate(
    BaseModel
):
    status: MaintenanceWorkOrderStatus

    assigned_to: str | None = Field(
        default=None,
        max_length=150,
    )

    scheduled_for: datetime | None = None


class MaintenanceWorkOrderResponse(
    BaseModel
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    work_order_code: str
    machine_id: UUID

    title: str
    description: str | None

    priority: MaintenancePriority
    status: MaintenanceWorkOrderStatus

    risk_score: float | None
    recommended_action: str | None

    assigned_to: str | None
    scheduled_for: datetime | None

    started_at: datetime | None
    completed_at: datetime | None

    created_at: datetime
    updated_at: datetime


class MaintenanceWorkOrderDetailResponse(
    MaintenanceWorkOrderResponse
):
    machine_name: str
    asset_code: str
    facility: str
    production_line: str | None


class MaintenanceWorkOrderListResponse(
    BaseModel
):
    work_orders: list[
        MaintenanceWorkOrderDetailResponse
    ]

    total: int = Field(
        ge=0,
    )


class MaintenanceWorkOrderSummary(
    BaseModel
):
    total: int = Field(
        ge=0,
    )

    open: int = Field(
        ge=0,
    )

    scheduled: int = Field(
        ge=0,
    )

    in_progress: int = Field(
        ge=0,
    )

    completed: int = Field(
        ge=0,
    )

    cancelled: int = Field(
        ge=0,
    )

    high_priority: int = Field(
        ge=0,
    )

    critical_priority: int = Field(
        ge=0,
    )

    overdue: int = Field(
        ge=0,
    )