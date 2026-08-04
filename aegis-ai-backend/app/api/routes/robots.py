from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    AdministratorUser,
    CurrentUser,
)
from app.db.session import (
    get_database_session,
)
from app.models.robot import (
    RobotStatus,
    RobotType,
)
from app.schemas.robot import (
    RobotCreate,
    RobotResponse,
    RobotSummaryResponse,
    RobotTelemetryUpdate,
    RobotUpdate,
)
from app.schemas.robot_telemetry import (
    RobotTelemetryCreate,
    RobotTelemetryListResponse,
    RobotTelemetryResponse,
)
from app.services.robot_service import (
    DuplicateRobotCodeError,
    InvalidRobotUpdateError,
    RobotNotFoundError,
    create_robot_record,
    delete_robot_record,
    get_robot_record,
    get_robot_records,
    get_robot_summary,
    update_robot_record,
    update_robot_telemetry_record,
)
from app.services.robot_telemetry_service import (
    create_robot_telemetry,
    get_latest_robot_telemetry,
    get_robot_telemetry_history,
)


router = APIRouter(
    prefix="/robots",
    tags=["Robots"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


@router.get(
    "",
    response_model=list[RobotResponse],
    summary="List industrial robots",
)
def list_robot_records(
    database_session: DatabaseSession,
    current_user: CurrentUser,
    response: Response,
    skip: Annotated[
        int,
        Query(
            ge=0,
        ),
    ] = 0,
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=200,
        ),
    ] = 100,
    search: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=150,
        ),
    ] = None,
    facility: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=150,
        ),
    ] = None,
    robot_status: Annotated[
        RobotStatus | None,
        Query(
            alias="status",
        ),
    ] = None,
    robot_type: RobotType | None = None,
) -> list[RobotResponse]:
    del current_user

    robots, total = get_robot_records(
        database_session,
        skip=skip,
        limit=limit,
        search=search,
        facility=facility,
        status=robot_status,
        robot_type=robot_type,
    )

    response.headers[
        "X-Total-Count"
    ] = str(total)

    return [
        RobotResponse.model_validate(
            robot
        )
        for robot in robots
    ]


@router.get(
    "/summary",
    response_model=RobotSummaryResponse,
    summary="Get robot operations summary",
)
def get_robot_operations_summary(
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> RobotSummaryResponse:
    del current_user

    return get_robot_summary(
        database_session
    )


@router.post(
    "",
    response_model=RobotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an industrial robot",
)
def create_robot(
    payload: RobotCreate,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> RobotResponse:
    del administrator

    try:
        robot = create_robot_record(
            database_session,
            payload=payload,
        )

    except DuplicateRobotCodeError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    return RobotResponse.model_validate(
        robot
    )


@router.post(
    "/{robot_id}/telemetry/readings",
    response_model=RobotTelemetryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record robot telemetry history",
)
def record_robot_telemetry(
    robot_id: UUID,
    payload: RobotTelemetryCreate,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> RobotTelemetryResponse:
    del current_user

    reading = create_robot_telemetry(
        database_session,
        robot_id,
        payload,
    )

    return RobotTelemetryResponse.model_validate(
        reading
    )


@router.get(
    "/{robot_id}/telemetry/history",
    response_model=RobotTelemetryListResponse,
    summary="Get robot telemetry history",
)
def list_robot_telemetry_history(
    robot_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
    skip: Annotated[
        int,
        Query(
            ge=0,
        ),
    ] = 0,
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=500,
        ),
    ] = 100,
) -> RobotTelemetryListResponse:
    del current_user

    readings, total = (
        get_robot_telemetry_history(
            database_session,
            robot_id,
            offset=skip,
            limit=limit,
        )
    )

    return RobotTelemetryListResponse(
        readings=[
            RobotTelemetryResponse.model_validate(
                reading
            )
            for reading in readings
        ],
        total=total,
    )


@router.get(
    "/{robot_id}/telemetry/latest",
    response_model=RobotTelemetryResponse,
    summary="Get latest robot telemetry reading",
)
def get_latest_robot_telemetry_reading(
    robot_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> RobotTelemetryResponse:
    del current_user

    reading = get_latest_robot_telemetry(
        database_session,
        robot_id,
    )

    return RobotTelemetryResponse.model_validate(
        reading
    )


@router.get(
    "/{robot_id}",
    response_model=RobotResponse,
    summary="Get an industrial robot",
)
def get_robot(
    robot_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> RobotResponse:
    del current_user

    try:
        robot = get_robot_record(
            database_session,
            robot_id=robot_id,
        )

    except RobotNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return RobotResponse.model_validate(
        robot
    )


@router.patch(
    "/{robot_id}",
    response_model=RobotResponse,
    summary="Update an industrial robot",
)
def update_robot(
    robot_id: UUID,
    payload: RobotUpdate,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> RobotResponse:
    del administrator

    try:
        robot = update_robot_record(
            database_session,
            robot_id=robot_id,
            payload=payload,
        )

    except RobotNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except DuplicateRobotCodeError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except InvalidRobotUpdateError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(error),
        ) from error

    return RobotResponse.model_validate(
        robot
    )


@router.patch(
    "/{robot_id}/telemetry",
    response_model=RobotResponse,
    summary="Update latest robot telemetry",
)
def update_robot_telemetry(
    robot_id: UUID,
    payload: RobotTelemetryUpdate,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> RobotResponse:
    del current_user

    try:
        robot = (
            update_robot_telemetry_record(
                database_session,
                robot_id=robot_id,
                payload=payload,
            )
        )

    except RobotNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return RobotResponse.model_validate(
        robot
    )


@router.delete(
    "/{robot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete an industrial robot",
)
def delete_robot(
    robot_id: UUID,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> Response:
    del administrator

    try:
        delete_robot_record(
            database_session,
            robot_id=robot_id,
        )

    except RobotNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )