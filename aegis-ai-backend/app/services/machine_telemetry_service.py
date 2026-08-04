from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.machine import Machine
from app.models.machine_telemetry import (
    MachineTelemetryReading,
)
from app.repositories.machine_telemetry import (
    count_machine_telemetry_readings,
    create_machine_telemetry_reading,
    get_latest_machine_telemetry_reading,
    get_machine_telemetry_readings,
)
from app.schemas.machine_telemetry import (
    MachineTelemetryCreate,
)


def get_machine_or_404(
    database_session: Session,
    machine_id: UUID,
) -> Machine:
    machine = database_session.get(
        Machine,
        machine_id,
    )

    if machine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found.",
        )

    return machine


def create_machine_telemetry(
    database_session: Session,
    machine_id: UUID,
    telemetry_data: MachineTelemetryCreate,
) -> MachineTelemetryReading:
    machine = get_machine_or_404(
        database_session,
        machine_id,
    )

    machine.status = telemetry_data.status
    machine.health_score = telemetry_data.health_score

    machine.temperature_celsius = (
        telemetry_data.temperature_celsius
    )

    machine.vibration_mm_s = (
        telemetry_data.vibration_mm_s
    )

    machine.power_consumption_kw = (
        telemetry_data.power_consumption_kw
    )

    machine.last_seen_at = datetime.now(
        timezone.utc,
    )

    try:
        reading = create_machine_telemetry_reading(
            database_session,
            machine_id,
            telemetry_data,
        )

        database_session.commit()
        database_session.refresh(machine)
        database_session.refresh(reading)

        return reading

    except SQLAlchemyError:
        database_session.rollback()
        raise


def get_machine_telemetry_history(
    database_session: Session,
    machine_id: UUID,
    *,
    offset: int = 0,
    limit: int = 100,
) -> tuple[
    list[MachineTelemetryReading],
    int,
]:
    get_machine_or_404(
        database_session,
        machine_id,
    )

    readings = get_machine_telemetry_readings(
        database_session,
        machine_id,
        offset=offset,
        limit=limit,
    )

    total = count_machine_telemetry_readings(
        database_session,
        machine_id,
    )

    return readings, total


def get_latest_machine_telemetry(
    database_session: Session,
    machine_id: UUID,
) -> MachineTelemetryReading:
    get_machine_or_404(
        database_session,
        machine_id,
    )

    reading = (
        get_latest_machine_telemetry_reading(
            database_session,
            machine_id,
        )
    )

    if reading is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No telemetry readings exist "
                "for this machine."
            ),
        )

    return reading