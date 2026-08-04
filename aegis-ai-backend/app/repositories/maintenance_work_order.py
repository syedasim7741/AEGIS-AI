from uuid import UUID

from sqlalchemy import (
    func,
    or_,
    select,
)
from sqlalchemy.orm import Session

from app.models.machine import Machine
from app.models.maintenance_work_order import (
    MaintenancePriority,
    MaintenanceWorkOrder,
    MaintenanceWorkOrderStatus,
)


def create_maintenance_work_order_record(
    database_session: Session,
    work_order: MaintenanceWorkOrder,
) -> MaintenanceWorkOrder:
    database_session.add(
        work_order
    )

    database_session.flush()
    database_session.refresh(
        work_order
    )

    return work_order


def get_maintenance_work_order_by_id(
    database_session: Session,
    work_order_id: UUID,
) -> MaintenanceWorkOrder | None:
    return database_session.get(
        MaintenanceWorkOrder,
        work_order_id,
    )


def get_maintenance_work_order_by_code(
    database_session: Session,
    work_order_code: str,
) -> MaintenanceWorkOrder | None:
    statement = (
        select(
            MaintenanceWorkOrder
        )
        .where(
            MaintenanceWorkOrder.work_order_code
            == work_order_code
        )
        .limit(1)
    )

    return database_session.scalar(
        statement
    )


def get_maintenance_work_order_with_machine(
    database_session: Session,
    work_order_id: UUID,
) -> tuple[
    MaintenanceWorkOrder,
    Machine,
] | None:
    statement = (
        select(
            MaintenanceWorkOrder,
            Machine,
        )
        .join(
            Machine,
            Machine.id
            == MaintenanceWorkOrder.machine_id,
        )
        .where(
            MaintenanceWorkOrder.id
            == work_order_id
        )
        .limit(1)
    )

    row = database_session.execute(
        statement
    ).one_or_none()

    if row is None:
        return None

    work_order, machine = row

    return work_order, machine


def get_maintenance_work_order_records(
    database_session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: MaintenanceWorkOrderStatus | None = None,
    priority: MaintenancePriority | None = None,
    machine_id: UUID | None = None,
    facility: str | None = None,
    assigned_to: str | None = None,
) -> tuple[
    list[
        tuple[
            MaintenanceWorkOrder,
            Machine,
        ]
    ],
    int,
]:
    filters = []

    if search is not None:
        normalized_search = (
            search.strip()
        )

        if normalized_search:
            search_pattern = (
                f"%{normalized_search}%"
            )

            filters.append(
                or_(
                    MaintenanceWorkOrder.work_order_code.ilike(
                        search_pattern
                    ),
                    MaintenanceWorkOrder.title.ilike(
                        search_pattern
                    ),
                    MaintenanceWorkOrder.description.ilike(
                        search_pattern
                    ),
                    MaintenanceWorkOrder.assigned_to.ilike(
                        search_pattern
                    ),
                    Machine.name.ilike(
                        search_pattern
                    ),
                    Machine.asset_code.ilike(
                        search_pattern
                    ),
                    Machine.facility.ilike(
                        search_pattern
                    ),
                )
            )

    if status is not None:
        filters.append(
            MaintenanceWorkOrder.status
            == status
        )

    if priority is not None:
        filters.append(
            MaintenanceWorkOrder.priority
            == priority
        )

    if machine_id is not None:
        filters.append(
            MaintenanceWorkOrder.machine_id
            == machine_id
        )

    if facility is not None:
        filters.append(
            func.lower(
                Machine.facility
            )
            == facility.strip().lower()
        )

    if assigned_to is not None:
        filters.append(
            func.lower(
                MaintenanceWorkOrder.assigned_to
            )
            == assigned_to.strip().lower()
        )

    records_statement = (
        select(
            MaintenanceWorkOrder,
            Machine,
        )
        .join(
            Machine,
            Machine.id
            == MaintenanceWorkOrder.machine_id,
        )
    )

    count_statement = (
        select(
            func.count(
                MaintenanceWorkOrder.id
            )
        )
        .select_from(
            MaintenanceWorkOrder
        )
        .join(
            Machine,
            Machine.id
            == MaintenanceWorkOrder.machine_id,
        )
    )

    if filters:
        records_statement = (
            records_statement.where(
                *filters
            )
        )

        count_statement = (
            count_statement.where(
                *filters
            )
        )

    records_statement = (
        records_statement
        .order_by(
            MaintenanceWorkOrder.created_at.desc(),
            MaintenanceWorkOrder.work_order_code.desc(),
        )
        .offset(skip)
        .limit(limit)
    )

    rows = database_session.execute(
        records_statement
    ).all()

    total = database_session.scalar(
        count_statement
    )

    records = [
        (
            work_order,
            machine,
        )
        for work_order, machine in rows
    ]

    return records, int(
        total or 0
    )


def delete_maintenance_work_order_record(
    database_session: Session,
    work_order: MaintenanceWorkOrder,
) -> None:
    database_session.delete(
        work_order
    )

    database_session.flush()