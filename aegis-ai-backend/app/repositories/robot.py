from uuid import UUID

from sqlalchemy import (
    delete,
    func,
    or_,
    select,
)
from sqlalchemy.orm import Session

from app.models.robot import (
    Robot,
    RobotStatus,
    RobotType,
)
from app.schemas.robot import (
    RobotCreate,
    RobotTelemetryUpdate,
    RobotUpdate,
)


def get_robot_by_id(
    database_session: Session,
    robot_id: UUID,
) -> Robot | None:
    statement = select(
        Robot
    ).where(
        Robot.id == robot_id
    )

    return database_session.scalar(
        statement
    )


def get_robot_by_code(
    database_session: Session,
    robot_code: str,
) -> Robot | None:
    cleaned_robot_code = (
        robot_code.strip().lower()
    )

    statement = select(
        Robot
    ).where(
        func.lower(
            Robot.robot_code
        ) == cleaned_robot_code
    )

    return database_session.scalar(
        statement
    )


def list_robots(
    database_session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    facility: str | None = None,
    status: RobotStatus | None = None,
    robot_type: RobotType | None = None,
) -> list[Robot]:
    statement = select(
        Robot
    )

    if search:
        cleaned_search = (
            f"%{search.strip()}%"
        )

        statement = statement.where(
            or_(
                Robot.name.ilike(
                    cleaned_search
                ),
                Robot.robot_code.ilike(
                    cleaned_search
                ),
                Robot.facility.ilike(
                    cleaned_search
                ),
                Robot.production_line.ilike(
                    cleaned_search
                ),
                Robot.current_task.ilike(
                    cleaned_search
                ),
            )
        )

    if facility:
        statement = statement.where(
            Robot.facility.ilike(
                facility.strip()
            )
        )

    if status is not None:
        statement = statement.where(
            Robot.status == status
        )

    if robot_type is not None:
        statement = statement.where(
            Robot.robot_type == robot_type
        )

    statement = (
        statement
        .order_by(
            Robot.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
    )

    return list(
        database_session.scalars(
            statement
        ).all()
    )


def count_robots(
    database_session: Session,
    *,
    search: str | None = None,
    facility: str | None = None,
    status: RobotStatus | None = None,
    robot_type: RobotType | None = None,
) -> int:
    statement = select(
        func.count(Robot.id)
    )

    if search:
        cleaned_search = (
            f"%{search.strip()}%"
        )

        statement = statement.where(
            or_(
                Robot.name.ilike(
                    cleaned_search
                ),
                Robot.robot_code.ilike(
                    cleaned_search
                ),
                Robot.facility.ilike(
                    cleaned_search
                ),
                Robot.production_line.ilike(
                    cleaned_search
                ),
                Robot.current_task.ilike(
                    cleaned_search
                ),
            )
        )

    if facility:
        statement = statement.where(
            Robot.facility.ilike(
                facility.strip()
            )
        )

    if status is not None:
        statement = statement.where(
            Robot.status == status
        )

    if robot_type is not None:
        statement = statement.where(
            Robot.robot_type == robot_type
        )

    return int(
        database_session.scalar(
            statement
        ) or 0
    )


def create_robot(
    database_session: Session,
    *,
    payload: RobotCreate,
) -> Robot:
    robot = Robot(
        **payload.model_dump()
    )

    database_session.add(
        robot
    )

    database_session.commit()

    database_session.refresh(
        robot
    )

    return robot


def update_robot(
    database_session: Session,
    *,
    robot: Robot,
    payload: RobotUpdate,
) -> Robot:
    update_values = (
        payload.model_dump(
            exclude_unset=True
        )
    )

    for field_name, value in (
        update_values.items()
    ):
        setattr(
            robot,
            field_name,
            value,
        )

    database_session.add(
        robot
    )

    database_session.commit()

    database_session.refresh(
        robot
    )

    return robot


def update_robot_telemetry(
    database_session: Session,
    *,
    robot: Robot,
    payload: RobotTelemetryUpdate,
) -> Robot:
    update_values = (
        payload.model_dump(
            exclude_unset=True
        )
    )

    for field_name, value in (
        update_values.items()
    ):
        setattr(
            robot,
            field_name,
            value,
        )

    database_session.add(
        robot
    )

    database_session.commit()

    database_session.refresh(
        robot
    )

    return robot


def delete_robot(
    database_session: Session,
    *,
    robot_id: UUID,
) -> bool:
    statement = delete(
        Robot
    ).where(
        Robot.id == robot_id
    )

    result = database_session.execute(
        statement
    )

    database_session.commit()

    return bool(
        result.rowcount
    )


def count_robots_by_status(
    database_session: Session,
    status: RobotStatus,
) -> int:
    statement = select(
        func.count(Robot.id)
    ).where(
        Robot.status == status
    )

    return int(
        database_session.scalar(
            statement
        ) or 0
    )


def get_average_robot_health(
    database_session: Session,
) -> float:
    statement = select(
        func.avg(
            Robot.health_score
        )
    )

    average = database_session.scalar(
        statement
    )

    return round(
        float(average or 0),
        2,
    )


def get_average_robot_utilization(
    database_session: Session,
) -> float:
    statement = select(
        func.avg(
            Robot.utilization_percent
        )
    )

    average = database_session.scalar(
        statement
    )

    return round(
        float(average or 0),
        2,
    )