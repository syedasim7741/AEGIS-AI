from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    AdministratorUser,
)
from app.db.session import (
    get_database_session,
)
from app.schemas.user import (
    UserCreate,
    UserListResponse,
    UserResponse,
    UserStatusUpdate,
    UserUpdate,
)
from app.services.user_service import (
    SelfAdministrationError,
    UserAlreadyExistsError,
    UserNotFoundError,
    change_user_status,
    create_user,
    get_user_or_raise,
    list_users,
    update_user,
)


router = APIRouter(
    prefix="/users",
    tags=["User Administration"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


@router.get(
    "",
    response_model=UserListResponse,
    summary="List platform users",
)
def get_users(
    administrator: AdministratorUser,
    database_session: DatabaseSession,
    offset: Annotated[
        int,
        Query(
            ge=0,
            description="Number of users to skip.",
        ),
    ] = 0,
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=100,
            description="Maximum users to return.",
        ),
    ] = 50,
) -> UserListResponse:
    del administrator

    users, total = list_users(
        database_session,
        offset=offset,
        limit=limit,
    )

    return UserListResponse(
        items=[
            UserResponse.model_validate(user)
            for user in users
        ],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a platform user",
)
def create_platform_user(
    user_data: UserCreate,
    administrator: AdministratorUser,
    database_session: DatabaseSession,
) -> UserResponse:
    try:
        user = create_user(
            database_session,
            user_data,
            administrator=administrator,
        )

    except UserAlreadyExistsError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    return UserResponse.model_validate(
        user
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get one platform user",
)
def get_platform_user(
    user_id: UUID,
    administrator: AdministratorUser,
    database_session: DatabaseSession,
) -> UserResponse:
    del administrator

    try:
        user = get_user_or_raise(
            database_session,
            user_id,
        )

    except UserNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return UserResponse.model_validate(
        user
    )


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update a platform user",
)
def update_platform_user(
    user_id: UUID,
    user_data: UserUpdate,
    administrator: AdministratorUser,
    database_session: DatabaseSession,
) -> UserResponse:
    try:
        user = update_user(
            database_session,
            administrator=administrator,
            user_id=user_id,
            user_data=user_data,
        )

    except UserNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except UserAlreadyExistsError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except SelfAdministrationError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return UserResponse.model_validate(
        user
    )


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
    summary="Change a user's account status",
)
def update_platform_user_status(
    user_id: UUID,
    status_data: UserStatusUpdate,
    administrator: AdministratorUser,
    database_session: DatabaseSession,
) -> UserResponse:
    try:
        user = change_user_status(
            database_session,
            administrator=administrator,
            user_id=user_id,
            status_data=status_data,
        )

    except UserNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except SelfAdministrationError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return UserResponse.model_validate(
        user
    )