from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.robot import Robot
from app.models.robot_telemetry import (
    RobotTelemetryReading,
)
from app.repositories.robot_telemetry import (
    count_robot_telemetry_readings,
    create_robot_telemetry_reading,
    get_latest_robot_telemetry_reading,
    get_robot_telemetry_readings,
)
from app.schemas.robot_telemetry import (
    RobotTelemetryCreate,
)


def get_robot_or_404(
    database_session: Session,
    robot_id: UUID,
) -> Robot:
    robot = database_session.get(
        Robot,
        robot_id,
    )

    if robot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robot not found.",
        )

    return robot


def create_robot_telemetry(
    database_session: Session,
    robot_id: UUID,
    telemetry_data: RobotTelemetryCreate,
) -> RobotTelemetryReading:
    robot = get_robot_or_404(
        database_session,
        robot_id,
    )

    robot.status = telemetry_data.status
    robot.current_task = telemetry_data.current_task
    robot.health_score = telemetry_data.health_score

    robot.utilization_percent = (
        telemetry_data.utilization_percent
    )

    robot.battery_level_percent = (
        telemetry_data.battery_level_percent
    )

    robot.payload_kg = telemetry_data.payload_kg

    robot.temperature_celsius = (
        telemetry_data.temperature_celsius
    )

    robot.position_x = telemetry_data.position_x
    robot.position_y = telemetry_data.position_y
    robot.position_z = telemetry_data.position_z

    robot.error_code = telemetry_data.error_code

    robot.last_seen_at = datetime.now(
        timezone.utc,
    )

    try:
        reading = create_robot_telemetry_reading(
            database_session,
            robot_id,
            telemetry_data,
        )

        database_session.commit()
        database_session.refresh(robot)
        database_session.refresh(reading)

        return reading

    except SQLAlchemyError:
        database_session.rollback()
        raise


def get_robot_telemetry_history(
    database_session: Session,
    robot_id: UUID,
    *,
    offset: int = 0,
    limit: int = 100,
) -> tuple[
    list[RobotTelemetryReading],
    int,
]:
    get_robot_or_404(
        database_session,
        robot_id,
    )

    readings = get_robot_telemetry_readings(
        database_session,
        robot_id,
        offset=offset,
        limit=limit,
    )

    total = count_robot_telemetry_readings(
        database_session,
        robot_id,
    )

    return readings, total


def get_latest_robot_telemetry(
    database_session: Session,
    robot_id: UUID,
) -> RobotTelemetryReading:
    get_robot_or_404(
        database_session,
        robot_id,
    )

    reading = (
        get_latest_robot_telemetry_reading(
            database_session,
            robot_id,
        )
    )

    if reading is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No telemetry readings exist "
                "for this robot."
            ),
        )

    return reading