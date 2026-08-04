from datetime import (
    datetime,
    timezone,
)
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.machine import (
    Machine,
    MachineStatus,
    MachineType,
)
from app.repositories.machine import (
    count_machines,
    count_machines_by_status,
    create_machine,
    delete_machine,
    get_average_machine_health,
    get_machine_by_asset_code,
    get_machine_by_id,
    list_machines,
    update_machine,
    update_machine_telemetry,
)
from app.schemas.machine import (
    MachineCreate,
    MachineSummaryResponse,
    MachineTelemetryUpdate,
    MachineUpdate,
)


class MachineNotFoundError(Exception):
    pass


class DuplicateMachineAssetCodeError(
    Exception
):
    pass


class InvalidMachineUpdateError(
    Exception
):
    pass


def get_machine_record(
    database_session: Session,
    *,
    machine_id: UUID,
) -> Machine:
    machine = get_machine_by_id(
        database_session,
        machine_id,
    )

    if machine is None:
        raise MachineNotFoundError(
            "The requested machine "
            "was not found."
        )

    return machine


def get_machine_records(
    database_session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    facility: str | None = None,
    status: MachineStatus | None = None,
    machine_type: MachineType | None = None,
) -> tuple[list[Machine], int]:
    machines = list_machines(
        database_session,
        skip=skip,
        limit=limit,
        search=search,
        facility=facility,
        status=status,
        machine_type=machine_type,
    )

    total = count_machines(
        database_session,
        search=search,
        facility=facility,
        status=status,
        machine_type=machine_type,
    )

    return machines, total


def create_machine_record(
    database_session: Session,
    *,
    payload: MachineCreate,
) -> Machine:
    existing_machine = (
        get_machine_by_asset_code(
            database_session,
            payload.asset_code,
        )
    )

    if existing_machine is not None:
        raise (
            DuplicateMachineAssetCodeError(
                "A machine with this "
                "asset code already exists."
            )
        )

    return create_machine(
        database_session,
        payload=payload,
    )


def update_machine_record(
    database_session: Session,
    *,
    machine_id: UUID,
    payload: MachineUpdate,
) -> Machine:
    machine = get_machine_record(
        database_session,
        machine_id=machine_id,
    )

    update_fields = (
        payload.model_fields_set
    )

    required_fields = {
        "name",
        "asset_code",
        "machine_type",
        "status",
        "facility",
        "health_score",
    }

    for field_name in required_fields:
        if (
            field_name in update_fields
            and getattr(
                payload,
                field_name,
            )
            is None
        ):
            raise InvalidMachineUpdateError(
                f"{field_name} cannot be null."
            )

    if (
        "asset_code" in update_fields
        and payload.asset_code
        is not None
    ):
        existing_machine = (
            get_machine_by_asset_code(
                database_session,
                payload.asset_code,
            )
        )

        if (
            existing_machine is not None
            and existing_machine.id
            != machine.id
        ):
            raise (
                DuplicateMachineAssetCodeError(
                    "A machine with this "
                    "asset code already exists."
                )
            )

    return update_machine(
        database_session,
        machine=machine,
        payload=payload,
    )


def update_machine_telemetry_record(
    database_session: Session,
    *,
    machine_id: UUID,
    payload: MachineTelemetryUpdate,
) -> Machine:
    machine = get_machine_record(
        database_session,
        machine_id=machine_id,
    )

    machine.last_seen_at = datetime.now(
        timezone.utc
    )

    return update_machine_telemetry(
        database_session,
        machine=machine,
        payload=payload,
    )


def delete_machine_record(
    database_session: Session,
    *,
    machine_id: UUID,
) -> None:
    get_machine_record(
        database_session,
        machine_id=machine_id,
    )

    was_deleted = delete_machine(
        database_session,
        machine_id=machine_id,
    )

    if not was_deleted:
        raise MachineNotFoundError(
            "The requested machine "
            "was not found."
        )


def get_machine_summary(
    database_session: Session,
) -> MachineSummaryResponse:
    return MachineSummaryResponse(
        total=count_machines(
            database_session
        ),
        operational=(
            count_machines_by_status(
                database_session,
                MachineStatus.OPERATIONAL,
            )
        ),
        warning=count_machines_by_status(
            database_session,
            MachineStatus.WARNING,
        ),
        critical=count_machines_by_status(
            database_session,
            MachineStatus.CRITICAL,
        ),
        offline=count_machines_by_status(
            database_session,
            MachineStatus.OFFLINE,
        ),
        maintenance=(
            count_machines_by_status(
                database_session,
                MachineStatus.MAINTENANCE,
            )
        ),
        average_health_score=(
            get_average_machine_health(
                database_session
            )
        ),
    )