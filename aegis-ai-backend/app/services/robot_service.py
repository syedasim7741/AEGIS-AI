from datetime import (
    datetime,
    timezone,
)
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.robot import (
    Robot,
    RobotStatus,
    RobotType,
)
from app.repositories.robot import (
    count_robots,
    count_robots_by_status,
    create_robot,
    delete_robot,
    get_average_robot_health,
    get_average_robot_utilization,
    get_robot_by_code,
    get_robot_by_id,
    list_robots,
    update_robot,
    update_robot_telemetry,
)
from app.schemas.robot import (
    RobotCreate,
    RobotSummaryResponse,
    RobotTelemetryUpdate,
    RobotUpdate,
)


class RobotNotFoundError(Exception):
    pass


class DuplicateRobotCodeError(Exception):
    pass


class InvalidRobotUpdateError(Exception):
    pass


def get_robot_record(
    database_session: Session,
    *,
    robot_id: UUID,
) -> Robot:
    robot = get_robot_by_id(
        database_session,
        robot_id,
    )

    if robot is None:
        raise RobotNotFoundError(
            "The requested robot was not found."
        )

    return robot


def get_robot_records(
    database_session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    facility: str | None = None,
    status: RobotStatus | None = None,
    robot_type: RobotType | None = None,
) -> tuple[list[Robot], int]:
    robots = list_robots(
        database_session,
        skip=skip,
        limit=limit,
        search=search,
        facility=facility,
        status=status,
        robot_type=robot_type,
    )

    total = count_robots(
        database_session,
        search=search,
        facility=facility,
        status=status,
        robot_type=robot_type,
    )

    return robots, total


def create_robot_record(
    database_session: Session,
    *,
    payload: RobotCreate,
) -> Robot:
    existing_robot = get_robot_by_code(
        database_session,
        payload.robot_code,
    )

    if existing_robot is not None:
        raise DuplicateRobotCodeError(
            "A robot with this robot code already exists."
        )

    return create_robot(
        database_session,
        payload=payload,
    )


def update_robot_record(
    database_session: Session,
    *,
    robot_id: UUID,
    payload: RobotUpdate,
) -> Robot:
    robot = get_robot_record(
        database_session,
        robot_id=robot_id,
    )

    update_fields = payload.model_fields_set

    required_fields = {
        "name",
        "robot_code",
        "robot_type",
        "status",
        "facility",
        "health_score",
        "utilization_percent",
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
            raise InvalidRobotUpdateError(
                f"{field_name} cannot be null."
            )

    if (
        "robot_code" in update_fields
        and payload.robot_code is not None
    ):
        existing_robot = get_robot_by_code(
            database_session,
            payload.robot_code,
        )

        if (
            existing_robot is not None
            and existing_robot.id != robot.id
        ):
            raise DuplicateRobotCodeError(
                "A robot with this robot code already exists."
            )

    return update_robot(
        database_session,
        robot=robot,
        payload=payload,
    )


def update_robot_telemetry_record(
    database_session: Session,
    *,
    robot_id: UUID,
    payload: RobotTelemetryUpdate,
) -> Robot:
    robot = get_robot_record(
        database_session,
        robot_id=robot_id,
    )

    robot.last_seen_at = datetime.now(
        timezone.utc
    )

    return update_robot_telemetry(
        database_session,
        robot=robot,
        payload=payload,
    )


def delete_robot_record(
    database_session: Session,
    *,
    robot_id: UUID,
) -> None:
    get_robot_record(
        database_session,
        robot_id=robot_id,
    )

    was_deleted = delete_robot(
        database_session,
        robot_id=robot_id,
    )

    if not was_deleted:
        raise RobotNotFoundError(
            "The requested robot was not found."
        )


def get_robot_summary(
    database_session: Session,
) -> RobotSummaryResponse:
    return RobotSummaryResponse(
        total=count_robots(
            database_session
        ),
        active=count_robots_by_status(
            database_session,
            RobotStatus.ACTIVE,
        ),
        idle=count_robots_by_status(
            database_session,
            RobotStatus.IDLE,
        ),
        warning=count_robots_by_status(
            database_session,
            RobotStatus.WARNING,
        ),
        error=count_robots_by_status(
            database_session,
            RobotStatus.ERROR,
        ),
        offline=count_robots_by_status(
            database_session,
            RobotStatus.OFFLINE,
        ),
        maintenance=count_robots_by_status(
            database_session,
            RobotStatus.MAINTENANCE,
        ),
        average_health_score=(
            get_average_robot_health(
                database_session
            )
        ),
        average_utilization_percent=(
            get_average_robot_utilization(
                database_session
            )
        ),
    )