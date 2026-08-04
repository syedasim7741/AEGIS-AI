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
from app.models.maintenance_work_order import (
    MaintenancePriority,
    MaintenanceWorkOrderStatus,
)
from app.schemas.maintenance_work_order import (
    MaintenanceWorkOrderCreate,
    MaintenanceWorkOrderDetailResponse,
    MaintenanceWorkOrderListResponse,
    MaintenanceWorkOrderResponse,
    MaintenanceWorkOrderStatusUpdate,
    MaintenanceWorkOrderSummary,
    MaintenanceWorkOrderUpdate,
)
from app.services.maintenance_work_order_service import (
    InvalidMaintenanceWorkOrderUpdateError,
    MaintenanceMachineNotFoundError,
    MaintenanceWorkOrderNotFoundError,
    create_maintenance_work_order,
    delete_maintenance_work_order,
    get_maintenance_work_order,
    get_maintenance_work_order_summary,
    list_maintenance_work_orders,
    update_maintenance_work_order,
    update_maintenance_work_order_status,
)


router = APIRouter(
    prefix="/maintenance-work-orders",
    tags=["Maintenance Work Orders"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


def build_detail_response(
    work_order,
    machine,
) -> MaintenanceWorkOrderDetailResponse:
    work_order_data = (
        MaintenanceWorkOrderResponse
        .model_validate(
            work_order
        )
        .model_dump()
    )

    return MaintenanceWorkOrderDetailResponse(
        **work_order_data,
        machine_name=machine.name,
        asset_code=machine.asset_code,
        facility=machine.facility,
        production_line=(
            machine.production_line
        ),
    )


@router.get(
    "",
    response_model=MaintenanceWorkOrderListResponse,
    summary="List maintenance work orders",
)
def list_work_orders(
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
            le=200,
        ),
    ] = 100,
    search: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=200,
        ),
    ] = None,
    work_order_status: Annotated[
        MaintenanceWorkOrderStatus | None,
        Query(
            alias="status",
        ),
    ] = None,
    priority: (
        MaintenancePriority | None
    ) = None,
    machine_id: UUID | None = None,
    facility: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=150,
        ),
    ] = None,
    assigned_to: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=150,
        ),
    ] = None,
) -> MaintenanceWorkOrderListResponse:
    del current_user

    records, total = (
        list_maintenance_work_orders(
            database_session,
            skip=skip,
            limit=limit,
            search=search,
            status=work_order_status,
            priority=priority,
            machine_id=machine_id,
            facility=facility,
            assigned_to=assigned_to,
        )
    )

    return MaintenanceWorkOrderListResponse(
        work_orders=[
            build_detail_response(
                work_order,
                machine,
            )
            for work_order, machine
            in records
        ],
        total=total,
    )


@router.get(
    "/summary",
    response_model=MaintenanceWorkOrderSummary,
    summary="Get maintenance work-order summary",
)
def read_work_order_summary(
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> MaintenanceWorkOrderSummary:
    del current_user

    return (
        get_maintenance_work_order_summary(
            database_session
        )
    )


@router.post(
    "",
    response_model=MaintenanceWorkOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a maintenance work order",
)
def create_work_order(
    payload: MaintenanceWorkOrderCreate,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> MaintenanceWorkOrderResponse:
    del administrator

    try:
        work_order = (
            create_maintenance_work_order(
                database_session,
                payload,
            )
        )

    except (
        MaintenanceMachineNotFoundError
    ) as error:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(error),
        ) from error

    return (
        MaintenanceWorkOrderResponse
        .model_validate(
            work_order
        )
    )


@router.get(
    "/{work_order_id}",
    response_model=MaintenanceWorkOrderDetailResponse,
    summary="Get a maintenance work order",
)
def get_work_order(
    work_order_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> MaintenanceWorkOrderDetailResponse:
    del current_user

    try:
        work_order, machine = (
            get_maintenance_work_order(
                database_session,
                work_order_id,
            )
        )

    except (
        MaintenanceWorkOrderNotFoundError
    ) as error:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(error),
        ) from error

    return build_detail_response(
        work_order,
        machine,
    )


@router.patch(
    "/{work_order_id}",
    response_model=MaintenanceWorkOrderResponse,
    summary="Update a maintenance work order",
)
def update_work_order(
    work_order_id: UUID,
    payload: MaintenanceWorkOrderUpdate,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> MaintenanceWorkOrderResponse:
    del administrator

    try:
        work_order = (
            update_maintenance_work_order(
                database_session,
                work_order_id,
                payload,
            )
        )

    except (
        MaintenanceWorkOrderNotFoundError
    ) as error:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(error),
        ) from error

    except (
        InvalidMaintenanceWorkOrderUpdateError
    ) as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(error),
        ) from error

    return (
        MaintenanceWorkOrderResponse
        .model_validate(
            work_order
        )
    )


@router.patch(
    "/{work_order_id}/status",
    response_model=MaintenanceWorkOrderResponse,
    summary="Update maintenance work-order status",
)
def update_work_order_status(
    work_order_id: UUID,
    payload: MaintenanceWorkOrderStatusUpdate,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> MaintenanceWorkOrderResponse:
    del administrator

    try:
        work_order = (
            update_maintenance_work_order_status(
                database_session,
                work_order_id,
                payload,
            )
        )

    except (
        MaintenanceWorkOrderNotFoundError
    ) as error:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(error),
        ) from error

    return (
        MaintenanceWorkOrderResponse
        .model_validate(
            work_order
        )
    )


@router.delete(
    "/{work_order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a maintenance work order",
)
def delete_work_order(
    work_order_id: UUID,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> Response:
    del administrator

    try:
        delete_maintenance_work_order(
            database_session,
            work_order_id,
        )

    except (
        MaintenanceWorkOrderNotFoundError
    ) as error:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(error),
        ) from error

    return Response(
        status_code=(
            status.HTTP_204_NO_CONTENT
        )
    )