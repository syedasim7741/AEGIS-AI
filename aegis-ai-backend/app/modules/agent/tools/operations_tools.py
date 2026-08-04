from enum import Enum
from typing import TypeVar
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.machine import (
    MachineStatus,
    MachineType,
)
from app.models.maintenance_work_order import (
    MaintenancePriority,
    MaintenanceWorkOrderStatus,
)
from app.models.robot import (
    RobotStatus,
    RobotType,
)
from app.modules.agent.core.serialization import (
    to_json_safe,
)
from app.services.machine_service import (
    get_machine_records,
    get_machine_summary,
)
from app.services.maintenance_work_order_service import (
    list_maintenance_work_orders,
)
from app.services.predictive_maintenance_service import (
    get_predictive_maintenance_assessments,
)
from app.services.robot_service import (
    get_robot_records,
    get_robot_summary,
)


EnumType = TypeVar(
    "EnumType",
    bound=Enum,
)


def parse_optional_enum(
    enum_class: type[EnumType],
    value: str | None,
) -> EnumType | None:
    if value is None:
        return None

    try:
        return enum_class(value)
    except ValueError:
        normalized_value = value.strip().lower()

        for member in enum_class:
            if (
                member.name.lower()
                == normalized_value
                or str(member.value).lower()
                == normalized_value
            ):
                return member

        allowed_values = ", ".join(
            str(member.value)
            for member in enum_class
        )

        raise ValueError(
            f"Invalid {enum_class.__name__}: "
            f"{value}. Allowed values: "
            f"{allowed_values}."
        )


def get_machine_summary_tool(
    database_session: Session,
) -> dict:
    summary = get_machine_summary(
        database_session,
    )

    return to_json_safe(summary)


def list_machines_tool(
    database_session: Session,
    *,
    search: str | None = None,
    facility: str | None = None,
    status: str | None = None,
    machine_type: str | None = None,
    limit: int = 20,
) -> dict:
    safe_limit = max(
        1,
        min(limit, 100),
    )

    machines, total = get_machine_records(
        database_session,
        skip=0,
        limit=safe_limit,
        search=search,
        facility=facility,
        status=parse_optional_enum(
            MachineStatus,
            status,
        ),
        machine_type=parse_optional_enum(
            MachineType,
            machine_type,
        ),
    )

    return {
        "machines": to_json_safe(machines),
        "total": total,
        "returned": len(machines),
    }


def get_robot_summary_tool(
    database_session: Session,
) -> dict:
    summary = get_robot_summary(
        database_session,
    )

    return to_json_safe(summary)


def list_robots_tool(
    database_session: Session,
    *,
    search: str | None = None,
    facility: str | None = None,
    status: str | None = None,
    robot_type: str | None = None,
    limit: int = 20,
) -> dict:
    safe_limit = max(
        1,
        min(limit, 100),
    )

    robots, total = get_robot_records(
        database_session,
        skip=0,
        limit=safe_limit,
        search=search,
        facility=facility,
        status=parse_optional_enum(
            RobotStatus,
            status,
        ),
        robot_type=parse_optional_enum(
            RobotType,
            robot_type,
        ),
    )

    return {
        "robots": to_json_safe(robots),
        "total": total,
        "returned": len(robots),
    }


def get_predictive_maintenance_tool(
    database_session: Session,
) -> dict:
    assessments = (
        get_predictive_maintenance_assessments(
            database_session,
        )
    )

    return {
        "assessments": to_json_safe(
            assessments,
        ),
        "total": len(assessments),
    }


def list_work_orders_tool(
    database_session: Session,
    *,
    search: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    machine_id: str | None = None,
    facility: str | None = None,
    assigned_to: str | None = None,
    limit: int = 20,
) -> dict:
    safe_limit = max(
        1,
        min(limit, 100),
    )

    parsed_machine_id = (
        UUID(machine_id)
        if machine_id
        else None
    )

    records, total = (
        list_maintenance_work_orders(
            database_session,
            skip=0,
            limit=safe_limit,
            search=search,
            status=parse_optional_enum(
                MaintenanceWorkOrderStatus,
                status,
            ),
            priority=parse_optional_enum(
                MaintenancePriority,
                priority,
            ),
            machine_id=parsed_machine_id,
            facility=facility,
            assigned_to=assigned_to,
        )
    )

    work_orders = []

    for work_order, machine in records:
        item = to_json_safe(work_order)

        item.update(
            {
                "machine_name": machine.name,
                "asset_code": machine.asset_code,
                "facility": machine.facility,
                "production_line": (
                    machine.production_line
                ),
            }
        )

        work_orders.append(item)

    return {
        "work_orders": work_orders,
        "total": total,
        "returned": len(work_orders),
    }
