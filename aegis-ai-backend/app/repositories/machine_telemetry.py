from uuid import UUID

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.orm import Session

from app.models.machine_telemetry import (
    MachineTelemetryReading,
)
from app.schemas.machine_telemetry import (
    MachineTelemetryCreate,
)


def create_machine_telemetry_reading(
    database_session: Session,
    machine_id: UUID,
    telemetry_data: MachineTelemetryCreate,
) -> MachineTelemetryReading:
    reading = MachineTelemetryReading(
        machine_id=machine_id,
        status=telemetry_data.status.value,
        health_score=telemetry_data.health_score,
        temperature_celsius=(
            telemetry_data.temperature_celsius
        ),
        vibration_mm_s=(
            telemetry_data.vibration_mm_s
        ),
        power_consumption_kw=(
            telemetry_data.power_consumption_kw
        ),
        source=telemetry_data.source,
    )

    database_session.add(reading)
    database_session.flush()
    database_session.refresh(reading)

    return reading


def get_machine_telemetry_readings(
    database_session: Session,
    machine_id: UUID,
    *,
    offset: int = 0,
    limit: int = 100,
) -> list[MachineTelemetryReading]:
    statement = (
        select(
            MachineTelemetryReading
        )
        .where(
            MachineTelemetryReading.machine_id
            == machine_id
        )
        .order_by(
            MachineTelemetryReading.recorded_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return list(
        database_session.scalars(
            statement
        ).all()
    )


def count_machine_telemetry_readings(
    database_session: Session,
    machine_id: UUID,
) -> int:
    statement = (
        select(
            func.count(
                MachineTelemetryReading.id
            )
        )
        .where(
            MachineTelemetryReading.machine_id
            == machine_id
        )
    )

    count = database_session.scalar(
        statement
    )

    return int(count or 0)


def get_latest_machine_telemetry_reading(
    database_session: Session,
    machine_id: UUID,
) -> MachineTelemetryReading | None:
    statement = (
        select(
            MachineTelemetryReading
        )
        .where(
            MachineTelemetryReading.machine_id
            == machine_id
        )
        .order_by(
            MachineTelemetryReading.recorded_at.desc()
        )
        .limit(1)
    )

    return database_session.scalar(
        statement
    )