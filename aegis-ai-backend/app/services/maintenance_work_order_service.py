from datetime import (
    datetime,
    timezone,
)
from uuid import UUID, uuid4

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.exc import (
    SQLAlchemyError,
)
from sqlalchemy.orm import Session

from app.models.machine import Machine
from app.models.maintenance_work_order import (
    MaintenancePriority,
    MaintenanceWorkOrder,
    MaintenanceWorkOrderStatus,
)
from app.repositories.maintenance_work_order import (
    create_maintenance_work_order_record,
    delete_maintenance_work_order_record,
    get_maintenance_work_order_by_code,
    get_maintenance_work_order_by_id,
    get_maintenance_work_order_records,
    get_maintenance_work_order_with_machine,
)
from app.schemas.maintenance_work_order import (
    MaintenanceWorkOrderCreate,
    MaintenanceWorkOrderStatusUpdate,
    MaintenanceWorkOrderSummary,
    MaintenanceWorkOrderUpdate,
)


class MaintenanceWorkOrderNotFoundError(
    ValueError
):
    pass


class MaintenanceMachineNotFoundError(
    ValueError
):
    pass


class DuplicateMaintenanceWorkOrderCodeError(
    ValueError
):
    pass


class InvalidMaintenanceWorkOrderUpdateError(
    ValueError
):
    pass


def generate_work_order_code(
    database_session: Session,
) -> str:
    for _ in range(10):
        timestamp = datetime.now(
            timezone.utc
        ).strftime(
            "%Y%m%d-%H%M%S"
        )

        random_suffix = (
            uuid4().hex[:6].upper()
        )

        work_order_code = (
            f"WO-{timestamp}-"
            f"{random_suffix}"
        )

        existing_work_order = (
            get_maintenance_work_order_by_code(
                database_session,
                work_order_code,
            )
        )

        if existing_work_order is None:
            return work_order_code

    raise DuplicateMaintenanceWorkOrderCodeError(
        "Unable to generate a unique "
        "maintenance work-order code."
    )


def get_machine_or_raise(
    database_session: Session,
    machine_id: UUID,
) -> Machine:
    machine = database_session.get(
        Machine,
        machine_id,
    )

    if machine is None:
        raise MaintenanceMachineNotFoundError(
            "Machine not found."
        )

    return machine


def get_maintenance_work_order_or_raise(
    database_session: Session,
    work_order_id: UUID,
) -> MaintenanceWorkOrder:
    work_order = (
        get_maintenance_work_order_by_id(
            database_session,
            work_order_id,
        )
    )

    if work_order is None:
        raise (
            MaintenanceWorkOrderNotFoundError(
                "Maintenance work order "
                "not found."
            )
        )

    return work_order


def apply_status_timestamps(
    work_order: MaintenanceWorkOrder,
    new_status: (
        MaintenanceWorkOrderStatus
    ),
) -> None:
    current_time = datetime.now(
        timezone.utc
    )

    if (
        new_status
        == MaintenanceWorkOrderStatus
        .IN_PROGRESS
    ):
        if work_order.started_at is None:
            work_order.started_at = (
                current_time
            )

        work_order.completed_at = None

    elif (
        new_status
        == MaintenanceWorkOrderStatus
        .COMPLETED
    ):
        if work_order.started_at is None:
            work_order.started_at = (
                current_time
            )

        work_order.completed_at = (
            current_time
        )

    elif new_status in {
        MaintenanceWorkOrderStatus.OPEN,
        MaintenanceWorkOrderStatus.SCHEDULED,
    }:
        work_order.completed_at = None


def create_maintenance_work_order(
    database_session: Session,
    payload: MaintenanceWorkOrderCreate,
) -> MaintenanceWorkOrder:
    get_machine_or_raise(
        database_session,
        payload.machine_id,
    )

    work_order = MaintenanceWorkOrder(
        work_order_code=(
            generate_work_order_code(
                database_session
            )
        ),
        machine_id=payload.machine_id,
        title=payload.title.strip(),
        description=payload.description,
        priority=payload.priority,
        status=(
            MaintenanceWorkOrderStatus.OPEN
        ),
        risk_score=payload.risk_score,
        recommended_action=(
            payload.recommended_action
        ),
        assigned_to=payload.assigned_to,
        scheduled_for=(
            payload.scheduled_for
        ),
    )

    if payload.scheduled_for is not None:
        work_order.status = (
            MaintenanceWorkOrderStatus
            .SCHEDULED
        )

    try:
        work_order = (
            create_maintenance_work_order_record(
                database_session,
                work_order,
            )
        )

        database_session.commit()
        database_session.refresh(
            work_order
        )

        return work_order

    except SQLAlchemyError:
        database_session.rollback()
        raise


def get_maintenance_work_order(
    database_session: Session,
    work_order_id: UUID,
) -> tuple[
    MaintenanceWorkOrder,
    Machine,
]:
    result = (
        get_maintenance_work_order_with_machine(
            database_session,
            work_order_id,
        )
    )

    if result is None:
        raise (
            MaintenanceWorkOrderNotFoundError(
                "Maintenance work order "
                "not found."
            )
        )

    return result


def list_maintenance_work_orders(
    database_session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: (
        MaintenanceWorkOrderStatus
        | None
    ) = None,
    priority: (
        MaintenancePriority
        | None
    ) = None,
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
    return (
        get_maintenance_work_order_records(
            database_session,
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            priority=priority,
            machine_id=machine_id,
            facility=facility,
            assigned_to=assigned_to,
        )
    )


def update_maintenance_work_order(
    database_session: Session,
    work_order_id: UUID,
    payload: MaintenanceWorkOrderUpdate,
) -> MaintenanceWorkOrder:
    work_order = (
        get_maintenance_work_order_or_raise(
            database_session,
            work_order_id,
        )
    )

    update_values = payload.model_dump(
        exclude_unset=True
    )

    if not update_values:
        raise (
            InvalidMaintenanceWorkOrderUpdateError(
                "At least one work-order "
                "field must be provided."
            )
        )

    new_status = update_values.get(
        "status"
    )

    if new_status is not None:
        apply_status_timestamps(
            work_order,
            new_status,
        )

    for field_name, field_value in (
        update_values.items()
    ):
        if (
            field_name == "title"
            and field_value is not None
        ):
            field_value = (
                field_value.strip()
            )

        setattr(
            work_order,
            field_name,
            field_value,
        )

    try:
        database_session.commit()
        database_session.refresh(
            work_order
        )

        return work_order

    except SQLAlchemyError:
        database_session.rollback()
        raise


def update_maintenance_work_order_status(
    database_session: Session,
    work_order_id: UUID,
    payload: (
        MaintenanceWorkOrderStatusUpdate
    ),
) -> MaintenanceWorkOrder:
    work_order = (
        get_maintenance_work_order_or_raise(
            database_session,
            work_order_id,
        )
    )

    apply_status_timestamps(
        work_order,
        payload.status,
    )

    work_order.status = payload.status

    if (
        "assigned_to"
        in payload.model_fields_set
    ):
        work_order.assigned_to = (
            payload.assigned_to
        )

    if (
        "scheduled_for"
        in payload.model_fields_set
    ):
        work_order.scheduled_for = (
            payload.scheduled_for
        )

    try:
        database_session.commit()
        database_session.refresh(
            work_order
        )

        return work_order

    except SQLAlchemyError:
        database_session.rollback()
        raise


def delete_maintenance_work_order(
    database_session: Session,
    work_order_id: UUID,
) -> None:
    work_order = (
        get_maintenance_work_order_or_raise(
            database_session,
            work_order_id,
        )
    )

    try:
        delete_maintenance_work_order_record(
            database_session,
            work_order,
        )

        database_session.commit()

    except SQLAlchemyError:
        database_session.rollback()
        raise


def get_maintenance_work_order_summary(
    database_session: Session,
) -> MaintenanceWorkOrderSummary:
    total_statement = select(
        func.count(
            MaintenanceWorkOrder.id
        )
    )

    def count_status(
        work_order_status: (
            MaintenanceWorkOrderStatus
        ),
    ) -> int:
        statement = select(
            func.count(
                MaintenanceWorkOrder.id
            )
        ).where(
            MaintenanceWorkOrder.status
            == work_order_status
        )

        return int(
            database_session.scalar(
                statement
            )
            or 0
        )

    def count_priority(
        work_order_priority: (
            MaintenancePriority
        ),
    ) -> int:
        statement = select(
            func.count(
                MaintenanceWorkOrder.id
            )
        ).where(
            MaintenanceWorkOrder.priority
            == work_order_priority
        )

        return int(
            database_session.scalar(
                statement
            )
            or 0
        )

    current_time = datetime.now(
        timezone.utc
    )

    overdue_statement = select(
        func.count(
            MaintenanceWorkOrder.id
        )
    ).where(
        MaintenanceWorkOrder.scheduled_for
        < current_time,
        MaintenanceWorkOrder.status.notin_(
            [
                MaintenanceWorkOrderStatus
                .COMPLETED,
                MaintenanceWorkOrderStatus
                .CANCELLED,
            ]
        ),
    )

    return MaintenanceWorkOrderSummary(
        total=int(
            database_session.scalar(
                total_statement
            )
            or 0
        ),
        open=count_status(
            MaintenanceWorkOrderStatus.OPEN
        ),
        scheduled=count_status(
            MaintenanceWorkOrderStatus
            .SCHEDULED
        ),
        in_progress=count_status(
            MaintenanceWorkOrderStatus
            .IN_PROGRESS
        ),
        completed=count_status(
            MaintenanceWorkOrderStatus
            .COMPLETED
        ),
        cancelled=count_status(
            MaintenanceWorkOrderStatus
            .CANCELLED
        ),
        high_priority=count_priority(
            MaintenancePriority.HIGH
        ),
        critical_priority=count_priority(
            MaintenancePriority.CRITICAL
        ),
        overdue=int(
            database_session.scalar(
                overdue_statement
            )
            or 0
        ),
    )