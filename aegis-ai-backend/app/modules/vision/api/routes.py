from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    AdministratorUser,
    CurrentUser,
)
from app.db.session import (
    get_database_session,
)
from app.models.machine import Machine
from app.models.vision_inspection import (
    VisionInspectionResult,
    VisionInspectionSeverity,
    VisionInspectionStatus,
)
from app.modules.vision.api.schemas import (
    VisionInspectionListResponse,
    VisionInspectionResponse,
)
from app.modules.vision.core.settings import (
    get_vision_settings,
)
from app.modules.vision.services.inspection_service import (
    VisionInspectionNotFoundError,
    VisionInspectionProcessingError,
    delete_vision_inspection,
    get_vision_inspection_or_raise,
    list_vision_inspections,
    run_vision_inspection,
)
from app.modules.vision.services.storage_service import (
    InvalidImageError,
)


router = APIRouter(
    prefix="/vision/inspections",
    tags=["Vision Inspections"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


@router.post(
    "",
    response_model=VisionInspectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run a vision inspection",
)
async def create_vision_inspection(
    database_session: DatabaseSession,
    current_user: CurrentUser,
    file: Annotated[
        UploadFile,
        File(
            description=(
                "JPEG, PNG, or WebP inspection image"
            ),
        ),
    ],
    product_name: Annotated[
        str,
        Form(
            min_length=1,
            max_length=150,
        ),
    ],
    machine_id: Annotated[
        UUID | None,
        Form(),
    ] = None,
    camera: Annotated[
        str | None,
        Form(max_length=100),
    ] = None,
    zone: Annotated[
        str | None,
        Form(max_length=150),
    ] = None,
    inspection_context: Annotated[
        str | None,
        Form(max_length=2000),
    ] = None,
) -> VisionInspectionResponse:
    settings = get_vision_settings()

    if machine_id is not None:
        machine = database_session.get(
            Machine,
            machine_id,
        )

        if machine is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "The selected machine "
                    "was not found."
                ),
            )

    maximum_bytes = (
        settings.vision_max_file_size_mb
        * 1024
        * 1024
    )

    filename = file.filename
    content_type = file.content_type

    try:
        content = await file.read(
            maximum_bytes + 1
        )

    finally:
        await file.close()

    try:
        inspection = run_vision_inspection(
            database_session,
            uploaded_by_user_id=current_user.id,
            filename=filename,
            content_type=content_type,
            content=content,
            product_name=product_name,
            machine_id=machine_id,
            camera=camera,
            zone=zone,
            inspection_context=(
                inspection_context
            ),
        )

    except InvalidImageError as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(error),
        ) from error

    except VisionInspectionProcessingError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error

    return VisionInspectionResponse.model_validate(
        inspection
    )


@router.get(
    "",
    response_model=VisionInspectionListResponse,
    summary="List vision inspections",
)
def read_vision_inspections(
    database_session: DatabaseSession,
    current_user: CurrentUser,
    skip: Annotated[
        int,
        Query(ge=0),
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
            max_length=255,
        ),
    ] = None,
    inspection_status: Annotated[
        VisionInspectionStatus | None,
        Query(alias="status"),
    ] = None,
    result: Annotated[
        VisionInspectionResult | None,
        Query(),
    ] = None,
    severity: Annotated[
        VisionInspectionSeverity | None,
        Query(),
    ] = None,
    machine_id: Annotated[
        UUID | None,
        Query(),
    ] = None,
) -> VisionInspectionListResponse:
    del current_user

    inspections, total = (
        list_vision_inspections(
            database_session,
            skip=skip,
            limit=limit,
            search=search,
            status=inspection_status,
            result=result,
            severity=severity,
            machine_id=machine_id,
        )
    )

    return VisionInspectionListResponse(
        inspections=[
            VisionInspectionResponse
            .model_validate(inspection)
            for inspection in inspections
        ],
        total=total,
    )


@router.get(
    "/{inspection_id}/image",
    response_class=FileResponse,
    summary="Get an inspection image",
)
def read_vision_inspection_image(
    inspection_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> FileResponse:
    del current_user

    try:
        inspection = (
            get_vision_inspection_or_raise(
                database_session,
                inspection_id,
            )
        )

    except VisionInspectionNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    image_path = Path(
        inspection.storage_path
    )

    if not image_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "The inspection image "
                "was not found."
            ),
        )

    return FileResponse(
        path=image_path,
        media_type=inspection.content_type,
        filename=inspection.original_filename,
    )


@router.get(
    "/{inspection_id}",
    response_model=VisionInspectionResponse,
    summary="Get a vision inspection",
)
def read_vision_inspection(
    inspection_id: UUID,
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> VisionInspectionResponse:
    del current_user

    try:
        inspection = (
            get_vision_inspection_or_raise(
                database_session,
                inspection_id,
            )
        )

    except VisionInspectionNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return VisionInspectionResponse.model_validate(
        inspection
    )


@router.delete(
    "/{inspection_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a vision inspection",
)
def remove_vision_inspection(
    inspection_id: UUID,
    database_session: DatabaseSession,
    administrator: AdministratorUser,
) -> Response:
    del administrator

    try:
        delete_vision_inspection(
            database_session,
            inspection_id,
        )

    except VisionInspectionNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )
