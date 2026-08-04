from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    CurrentUser,
)
from app.db.session import (
    get_database_session,
)
from app.schemas.profile import (
    PasswordChangeRequest,
    PasswordChangeResponse,
    ProfileUpdate,
)
from app.schemas.user import (
    UserResponse,
)
from app.services.profile_service import (
    InvalidCurrentPasswordError,
    PasswordReuseError,
    change_current_user_password,
    update_current_user_profile,
)


router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


@router.get(
    "",
    response_model=UserResponse,
    summary="Get the current user's profile",
)
def get_profile(
    current_user: CurrentUser,
) -> UserResponse:
    return UserResponse.model_validate(
        current_user
    )


@router.patch(
    "",
    response_model=UserResponse,
    summary="Update the current user's profile",
)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: CurrentUser,
    database_session: DatabaseSession,
) -> UserResponse:
    updated_user = (
        update_current_user_profile(
            database_session,
            current_user=current_user,
            profile_data=profile_data,
        )
    )

    return UserResponse.model_validate(
        updated_user
    )


@router.post(
    "/change-password",
    response_model=PasswordChangeResponse,
    summary="Change the current user's password",
)
def change_password(
    password_data: PasswordChangeRequest,
    current_user: CurrentUser,
    database_session: DatabaseSession,
) -> PasswordChangeResponse:
    try:
        change_current_user_password(
            database_session,
            current_user=current_user,
            password_data=password_data,
        )

    except InvalidCurrentPasswordError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(error),
        ) from error

    except PasswordReuseError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(error),
        ) from error

    return PasswordChangeResponse(
        message=(
            "Your password was changed "
            "successfully."
        )
    )