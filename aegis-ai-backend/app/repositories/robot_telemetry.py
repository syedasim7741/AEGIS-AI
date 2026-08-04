from uuid import UUID

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.orm import Session

from app.models.robot_telemetry import (
    RobotTelemetryReading,
)
from app.schemas.robot_telemetry import (
    RobotTelemetryCreate,
)


def create_robot_telemetry_reading(
    database_session: Session,
    robot_id: UUID,
    telemetry_data: RobotTelemetryCreate,
) -> RobotTelemetryReading:
    reading = RobotTelemetryReading(
        robot_id=robot_id,
        status=telemetry_data.status.value,
        current_task=telemetry_data.current_task,
        health_score=telemetry_data.health_score,
        utilization_percent=(
            telemetry_data.utilization_percent
        ),
        battery_level_percent=(
            telemetry_data.battery_level_percent
        ),
        payload_kg=telemetry_data.payload_kg,
        temperature_celsius=(
            telemetry_data.temperature_celsius
        ),
        position_x=telemetry_data.position_x,
        position_y=telemetry_data.position_y,
        position_z=telemetry_data.position_z,
        error_code=telemetry_data.error_code,
        source=telemetry_data.source,
    )

    database_session.add(reading)
    database_session.flush()
    database_session.refresh(reading)

    return reading


def get_robot_telemetry_readings(
    database_session: Session,
    robot_id: UUID,
    *,
    offset: int = 0,
    limit: int = 100,
) -> list[RobotTelemetryReading]:
    statement = (
        select(
            RobotTelemetryReading
        )
        .where(
            RobotTelemetryReading.robot_id
            == robot_id
        )
        .order_by(
            RobotTelemetryReading.recorded_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return list(
        database_session.scalars(
            statement
        ).all()
    )


def count_robot_telemetry_readings(
    database_session: Session,
    robot_id: UUID,
) -> int:
    statement = (
        select(
            func.count(
                RobotTelemetryReading.id
            )
        )
        .where(
            RobotTelemetryReading.robot_id
            == robot_id
        )
    )

    count = database_session.scalar(
        statement
    )

    return int(count or 0)


def get_latest_robot_telemetry_reading(
    database_session: Session,
    robot_id: UUID,
) -> RobotTelemetryReading | None:
    statement = (
        select(
            RobotTelemetryReading
        )
        .where(
            RobotTelemetryReading.robot_id
            == robot_id
        )
        .order_by(
            RobotTelemetryReading.recorded_at.desc()
        )
        .limit(1)
    )

    return database_session.scalar(
        statement
    )