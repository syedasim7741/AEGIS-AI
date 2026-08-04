from uuid import UUID

from sqlalchemy import (
    delete,
    func,
    or_,
    select,
)
from sqlalchemy.orm import Session

from app.models.machine import (
    Machine,
    MachineStatus,
    MachineType,
)
from app.schemas.machine import (
    MachineCreate,
    MachineTelemetryUpdate,
    MachineUpdate,
)


def get_machine_by_id(
    database_session: Session,
    machine_id: UUID,
) -> Machine | None:
    statement = select(
        Machine
    ).where(
        Machine.id == machine_id
    )

    return database_session.scalar(
        statement
    )


def get_machine_by_asset_code(
    database_session: Session,
    asset_code: str,
) -> Machine | None:
    cleaned_asset_code = (
        asset_code.strip().lower()
    )

    statement = select(
        Machine
    ).where(
        func.lower(
            Machine.asset_code
        ) == cleaned_asset_code
    )

    return database_session.scalar(
        statement
    )


def list_machines(
    database_session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    facility: str | None = None,
    status: MachineStatus | None = None,
    machine_type: MachineType | None = None,
) -> list[Machine]:
    statement = select(
        Machine
    )

    if search:
        cleaned_search = (
            f"%{search.strip()}%"
        )

        statement = statement.where(
            or_(
                Machine.name.ilike(
                    cleaned_search
                ),
                Machine.asset_code.ilike(
                    cleaned_search
                ),
                Machine.facility.ilike(
                    cleaned_search
                ),
                Machine.production_line.ilike(
                    cleaned_search
                ),
            )
        )

    if facility:
        statement = statement.where(
            Machine.facility.ilike(
                facility.strip()
            )
        )

    if status is not None:
        statement = statement.where(
            Machine.status == status
        )

    if machine_type is not None:
        statement = statement.where(
            Machine.machine_type
            == machine_type
        )

    statement = (
        statement
        .order_by(
            Machine.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
    )

    return list(
        database_session.scalars(
            statement
        ).all()
    )


def count_machines(
    database_session: Session,
    *,
    search: str | None = None,
    facility: str | None = None,
    status: MachineStatus | None = None,
    machine_type: MachineType | None = None,
) -> int:
    statement = select(
        func.count(Machine.id)
    )

    if search:
        cleaned_search = (
            f"%{search.strip()}%"
        )

        statement = statement.where(
            or_(
                Machine.name.ilike(
                    cleaned_search
                ),
                Machine.asset_code.ilike(
                    cleaned_search
                ),
                Machine.facility.ilike(
                    cleaned_search
                ),
                Machine.production_line.ilike(
                    cleaned_search
                ),
            )
        )

    if facility:
        statement = statement.where(
            Machine.facility.ilike(
                facility.strip()
            )
        )

    if status is not None:
        statement = statement.where(
            Machine.status == status
        )

    if machine_type is not None:
        statement = statement.where(
            Machine.machine_type
            == machine_type
        )

    return int(
        database_session.scalar(
            statement
        ) or 0
    )


def create_machine(
    database_session: Session,
    *,
    payload: MachineCreate,
) -> Machine:
    machine = Machine(
        **payload.model_dump()
    )

    database_session.add(
        machine
    )

    database_session.commit()

    database_session.refresh(
        machine
    )

    return machine


def update_machine(
    database_session: Session,
    *,
    machine: Machine,
    payload: MachineUpdate,
) -> Machine:
    update_values = (
        payload.model_dump(
            exclude_unset=True
        )
    )

    for field_name, value in (
        update_values.items()
    ):
        setattr(
            machine,
            field_name,
            value,
        )

    database_session.add(
        machine
    )

    database_session.commit()

    database_session.refresh(
        machine
    )

    return machine


def update_machine_telemetry(
    database_session: Session,
    *,
    machine: Machine,
    payload: MachineTelemetryUpdate,
) -> Machine:
    update_values = (
        payload.model_dump(
            exclude_unset=True
        )
    )

    for field_name, value in (
        update_values.items()
    ):
        setattr(
            machine,
            field_name,
            value,
        )

    database_session.add(
        machine
    )

    database_session.commit()

    database_session.refresh(
        machine
    )

    return machine


def delete_machine(
    database_session: Session,
    *,
    machine_id: UUID,
) -> bool:
    statement = delete(
        Machine
    ).where(
        Machine.id == machine_id
    )

    result = database_session.execute(
        statement
    )

    database_session.commit()

    return bool(
        result.rowcount
    )


def count_machines_by_status(
    database_session: Session,
    status: MachineStatus,
) -> int:
    statement = select(
        func.count(Machine.id)
    ).where(
        Machine.status == status
    )

    return int(
        database_session.scalar(
            statement
        ) or 0
    )


def get_average_machine_health(
    database_session: Session,
) -> float:
    statement = select(
        func.avg(
            Machine.health_score
        )
    )

    average = database_session.scalar(
        statement
    )

    return round(
        float(average or 0),
        2,
    )