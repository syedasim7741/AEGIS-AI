from typing import Annotated
from uuid import UUID

from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    OAuth2PasswordBearer,
)
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.security import (
    decode_access_token,
)
from app.db.session import (
    get_database_session,
)
from app.models.user import (
    User,
    UserRole,
    UserStatus,
)
from app.repositories.user import (
    get_user_by_id,
)


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


def get_current_user(
    token: Annotated[
        str,
        Depends(oauth2_scheme),
    ],
    database_session: DatabaseSession,
) -> User:
    credentials_error = HTTPException(
        status_code=(
            status.HTTP_401_UNAUTHORIZED
        ),
        detail=(
            "The authentication token is "
            "invalid or has expired."
        ),
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        user_id = UUID(
            decode_access_token(token)
        )

    except (
        InvalidTokenError,
        ValueError,
    ) as error:
        raise credentials_error from error

    user = get_user_by_id(
        database_session,
        user_id,
    )

    if user is None:
        raise credentials_error

    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "This user account has "
                "been suspended."
            ),
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "This user account is "
                "not active."
            ),
        )

    return user


CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]


def require_administrator(
    current_user: CurrentUser,
) -> User:
    if (
        current_user.role
        != UserRole.ADMINISTRATOR
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "Administrator access "
                "is required."
            ),
        )

    return current_user


AdministratorUser = Annotated[
    User,
    Depends(require_administrator),
]