from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.maintenance_work_order import (
    MaintenancePriority,
)
from app.modules.agent.core.serialization import (
    to_json_safe,
)
from app.modules.agent.tools.operations_tools import (
    parse_optional_enum,
)
from app.schemas.maintenance_work_order import (
    MaintenanceWorkOrderCreate,
)
from app.services.maintenance_work_order_service import (
    create_maintenance_work_order,
)


def parse_required_uuid(
    value: str,
    *,
    field_name: str,
) -> UUID:
    try:
        return UUID(value)
    except (TypeError, ValueError) as error:
        raise ValueError(
            f"{field_name} must be a valid UUID."
        ) from error


def parse_optional_datetime(
    value: str | None,
) -> datetime | None:
    if value is None:
        return None

    cleaned_value = value.strip()

    if not cleaned_value:
        return None

    if cleaned_value.endswith("Z"):
        cleaned_value = (
            cleaned_value[:-1] + "+00:00"
        )

    try:
        return datetime.fromisoformat(
            cleaned_value
        )
    except ValueError as error:
        raise ValueError(
            "scheduled_for must be a valid "
            "ISO 8601 date-time."
        ) from error


def create_work_order_tool(
    database_session: Session,
    *,
    machine_id: str,
    title: str,
    priority: str,
    description: str | None = None,
    risk_score: float | None = None,
    recommended_action: str | None = None,
    assigned_to: str | None = None,
    scheduled_for: str | None = None,
) -> dict[str, Any]:
    cleaned_title = title.strip()

    if len(cleaned_title) < 2:
        raise ValueError(
            "title must contain at least "
            "2 characters."
        )

    parsed_priority = parse_optional_enum(
        MaintenancePriority,
        priority,
    )

    if parsed_priority is None:
        raise ValueError(
            "priority is required."
        )

    payload = MaintenanceWorkOrderCreate(
        machine_id=parse_required_uuid(
            machine_id,
            field_name="machine_id",
        ),
        title=cleaned_title,
        description=description,
        priority=parsed_priority,
        risk_score=risk_score,
        recommended_action=(
            recommended_action
        ),
        assigned_to=assigned_to,
        scheduled_for=(
            parse_optional_datetime(
                scheduled_for
            )
        ),
    )

    work_order = create_maintenance_work_order(
        database_session,
        payload,
    )

    return {
        "work_order": to_json_safe(
            work_order
        ),
        "message": (
            "Maintenance work order created "
            "successfully."
        ),
    }
