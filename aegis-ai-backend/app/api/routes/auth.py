from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from fastapi.security import (
    OAuth2PasswordRequestForm,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    CurrentUser,
)
from app.core.config import (
    Settings,
    get_settings,
)
from app.core.security import (
    create_access_token,
)
from app.db.session import (
    get_database_session,
)
from app.schemas.auth import (
    TokenResponse,
)
from app.schemas.user import (
    UserResponse,
)
from app.services.auth_service import (
    InvalidCredentialsError,
    UserAccessDeniedError,
    authenticate_user,
)
from app.services.refresh_session_service import (
    ExpiredRefreshTokenError,
    InvalidRefreshTokenError,
    RefreshUserAccessDeniedError,
    RevokedRefreshTokenError,
    issue_refresh_session,
    revoke_refresh_token,
    rotate_refresh_session,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


SettingsDependency = Annotated[
    Settings,
    Depends(get_settings),
]


LoginForm = Annotated[
    OAuth2PasswordRequestForm,
    Depends(),
]


def set_refresh_cookie(
    response: Response,
    *,
    refresh_token: str,
    settings: Settings,
) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=(
            settings
            .refresh_cookie_max_age_seconds
        ),
        path=settings.refresh_cookie_path,
        secure=settings.refresh_cookie_secure,
        httponly=(
            settings.refresh_cookie_httponly
        ),
        samesite=(
            settings.refresh_cookie_samesite
        ),
    )


def delete_refresh_cookie(
    response: Response,
    *,
    settings: Settings,
) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        secure=settings.refresh_cookie_secure,
        httponly=(
            settings.refresh_cookie_httponly
        ),
        samesite=(
            settings.refresh_cookie_samesite
        ),
    )


def create_token_response(
    *,
    user_id: str,
    settings: Settings,
) -> TokenResponse:
    access_token = create_access_token(
        subject=user_id
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=(
            settings.access_token_expire_minutes
            * 60
        ),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary=(
        "Sign in and receive an "
        "access token"
    ),
)
def login(
    response: Response,
    form_data: LoginForm,
    database_session: DatabaseSession,
    settings: SettingsDependency,
) -> TokenResponse:
    try:
        user = authenticate_user(
            database_session,
            email=form_data.username,
            password=form_data.password,
        )

    except InvalidCredentialsError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "The email address or password "
                "is incorrect."
            ),
            headers={
                "WWW-Authenticate": "Bearer",
            },
        ) from error

    except UserAccessDeniedError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=str(error),
        ) from error

    refresh_result = issue_refresh_session(
        database_session,
        user=user,
        lifetime_days=(
            settings.refresh_token_expire_days
        ),
    )

    set_refresh_cookie(
        response,
        refresh_token=(
            refresh_result.refresh_token
        ),
        settings=settings,
    )

    return create_token_response(
        user_id=str(user.id),
        settings=settings,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary=(
        "Rotate the refresh token and "
        "receive a new access token"
    ),
)
def refresh_access_token(
    request: Request,
    response: Response,
    database_session: DatabaseSession,
    settings: SettingsDependency,
) -> TokenResponse:
    refresh_token = request.cookies.get(
        settings.refresh_cookie_name
    )

    if not refresh_token:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "A refresh token was not "
                "provided."
            ),
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    try:
        refresh_result = (
            rotate_refresh_session(
                database_session,
                refresh_token=refresh_token,
                lifetime_days=(
                    settings
                    .refresh_token_expire_days
                ),
            )
        )

    except RefreshUserAccessDeniedError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=str(error),
        ) from error

    except (
        InvalidRefreshTokenError,
        ExpiredRefreshTokenError,
        RevokedRefreshTokenError,
    ) as error:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=str(error),
            headers={
                "WWW-Authenticate": "Bearer",
            },
        ) from error

    set_refresh_cookie(
        response,
        refresh_token=(
            refresh_result.refresh_token
        ),
        settings=settings,
    )

    return create_token_response(
        user_id=str(
            refresh_result.user.id
        ),
        settings=settings,
    )


@router.post(
    "/logout",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
    response_class=Response,
    summary=(
        "Revoke the refresh token "
        "and sign out"
    ),
)
def logout(
    request: Request,
    database_session: DatabaseSession,
    settings: SettingsDependency,
) -> Response:
    refresh_token = request.cookies.get(
        settings.refresh_cookie_name
    )

    if refresh_token:
        revoke_refresh_token(
            database_session,
            refresh_token=refresh_token,
        )

    response = Response(
        status_code=(
            status.HTTP_204_NO_CONTENT
        )
    )

    delete_refresh_cookie(
        response,
        settings=settings,
    )

    return response


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the authenticated user",
)
def get_authenticated_user(
    current_user: CurrentUser,
) -> UserResponse:
    return UserResponse.model_validate(
        current_user
    )