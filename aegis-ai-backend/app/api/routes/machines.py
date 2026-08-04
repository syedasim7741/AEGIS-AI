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
from app.models.machine import (
    MachineStatus,
    MachineType,
)
from app.schemas.machine import (
    MachineCreate,
    MachineResponse,
    MachineSummaryResponse,
    MachineTelemetryUpdate,
    MachineUpdate,
)
from app.schemas.machine_telemetry import (
    MachineTelemetryCreate,
    MachineTelemetryListResponse,
    MachineTelemetryResponse,
)
from app.services.machine_service import (
    DuplicateMachineAssetCodeError,
    InvalidMachineUpdateError,
    MachineNotFoundError,
    create_machine_record,
    delete_machine_record,
    get_machine_record,
    get_machine_records,
    get_machine_summary,
    update_machine_record,
    update_machine_telemetry_record,
)
from app.services.machine_telemetry_service import (
    create_machine_telemetry,
    get_latest_machine_telemetry,
    get_machine_telemetry_history,
)


router = APIRouter(
    prefix="/machines",
    tags=["Machines"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


@router.get(
    "",
    response_model=list[MachineResponse],
    summary="List industrial machines",
)
def list_machine_records(
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
    machine_status: Annotated[
        MachineStatus | None,
        Query(
            alias="status",
        ),
    ] = None,
    machine_type: MachineType | None = None,
) -> list[MachineResponse]:
    del current_user

    machines, total = get_machine_records(
        database_session,
        skip=skip,
        limit=limit,
        search=search,
        facility=facility,
        status=machine_status,
        machine_type=machine_type,
    )

    response.headers[
        "X-Total-Count"
    ] = str(total)

    return [
        MachineResponse.model_validate(
            machine
        )
        for machine in machines
    ]


@router.get(
    "/summary",
    response_model=MachineSummaryResponse,
    summary="Get machine operations summary",
)
def get_machine_operations_summary(
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> MachineSummaryResponse:
    del current_user

    return get_machine_summary(
        database_session
    )


@router.post(
    "",
    response_model=MachineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an industrial machine",
)
def create_machine(
    payload: MachineCreate,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> MachineResponse:
    del administrator

    try:
        machine = create_machine_record(
            database_session,
            payload=payload,
        )

    except DuplicateMachineAssetCodeError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    return MachineResponse.model_validate(
        machine
    )


@router.post(
    "/{machine_id}/telemetry/readings",
    response_model=MachineTelemetryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record machine telemetry history",
)
def record_machine_telemetry(
    machine_id: UUID,
    payload: MachineTelemetryCreate,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> MachineTelemetryResponse:
    del current_user

    reading = create_machine_telemetry(
        database_session,
        machine_id,
        payload,
    )

    return MachineTelemetryResponse.model_validate(
        reading
    )


@router.get(
    "/{machine_id}/telemetry/history",
    response_model=MachineTelemetryListResponse,
    summary="Get machine telemetry history",
)
def list_machine_telemetry_history(
    machine_id: UUID,
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
) -> MachineTelemetryListResponse:
    del current_user

    readings, total = (
        get_machine_telemetry_history(
            database_session,
            machine_id,
            offset=skip,
            limit=limit,
        )
    )

    return MachineTelemetryListResponse(
        readings=[
            MachineTelemetryResponse.model_validate(
                reading
            )
            for reading in readings
        ],
        total=total,
    )


@router.get(
    "/{machine_id}/telemetry/latest",
    response_model=MachineTelemetryResponse,
    summary="Get latest machine telemetry reading",
)
def get_latest_machine_telemetry_reading(
    machine_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> MachineTelemetryResponse:
    del current_user

    reading = get_latest_machine_telemetry(
        database_session,
        machine_id,
    )

    return MachineTelemetryResponse.model_validate(
        reading
    )


@router.get(
    "/{machine_id}",
    response_model=MachineResponse,
    summary="Get an industrial machine",
)
def get_machine(
    machine_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> MachineResponse:
    del current_user

    try:
        machine = get_machine_record(
            database_session,
            machine_id=machine_id,
        )

    except MachineNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return MachineResponse.model_validate(
        machine
    )


@router.patch(
    "/{machine_id}",
    response_model=MachineResponse,
    summary="Update an industrial machine",
)
def update_machine(
    machine_id: UUID,
    payload: MachineUpdate,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> MachineResponse:
    del administrator

    try:
        machine = update_machine_record(
            database_session,
            machine_id=machine_id,
            payload=payload,
        )

    except MachineNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except DuplicateMachineAssetCodeError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except InvalidMachineUpdateError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(error),
        ) from error

    return MachineResponse.model_validate(
        machine
    )


@router.patch(
    "/{machine_id}/telemetry",
    response_model=MachineResponse,
    summary="Update latest machine telemetry",
)
def update_machine_telemetry(
    machine_id: UUID,
    payload: MachineTelemetryUpdate,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> MachineResponse:
    del current_user

    try:
        machine = (
            update_machine_telemetry_record(
                database_session,
                machine_id=machine_id,
                payload=payload,
            )
        )

    except MachineNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return MachineResponse.model_validate(
        machine
    )


@router.delete(
    "/{machine_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete an industrial machine",
)
def delete_machine(
    machine_id: UUID,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> Response:
    del administrator

    try:
        delete_machine_record(
            database_session,
            machine_id=machine_id,
        )

    except MachineNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )