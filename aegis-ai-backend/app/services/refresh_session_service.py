from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.refresh_tokens import (
    create_refresh_expiration,
    generate_refresh_token,
    hash_refresh_token,
    is_refresh_session_expired,
)
from app.models.refresh_session import (
    RefreshSession,
)
from app.models.user import (
    User,
    UserStatus,
)
from app.repositories.refresh_session import (
    create_refresh_session,
    get_refresh_session_by_hash,
    mark_refresh_session_used,
    revoke_refresh_session,
    revoke_user_refresh_sessions,
)
from app.repositories.user import (
    get_user_by_id,
)


class InvalidRefreshTokenError(Exception):
    pass


class ExpiredRefreshTokenError(Exception):
    pass


class RevokedRefreshTokenError(Exception):
    pass


class RefreshUserAccessDeniedError(Exception):
    pass


@dataclass
class RefreshSessionResult:
    user: User
    refresh_token: str
    refresh_session: RefreshSession


def issue_refresh_session(
    database_session: Session,
    *,
    user: User,
    lifetime_days: int,
) -> RefreshSessionResult:
    refresh_token = (
        generate_refresh_token()
    )

    token_hash = hash_refresh_token(
        refresh_token
    )

    expires_at = (
        create_refresh_expiration(
            lifetime_days
        )
    )

    refresh_session = (
        create_refresh_session(
            database_session,
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
    )

    return RefreshSessionResult(
        user=user,
        refresh_token=refresh_token,
        refresh_session=refresh_session,
    )


def validate_refresh_session(
    database_session: Session,
    *,
    refresh_token: str,
) -> tuple[User, RefreshSession]:
    try:
        token_hash = (
            hash_refresh_token(
                refresh_token
            )
        )

    except ValueError as error:
        raise InvalidRefreshTokenError(
            "The refresh token is invalid."
        ) from error

    refresh_session = (
        get_refresh_session_by_hash(
            database_session,
            token_hash=token_hash,
        )
    )

    if refresh_session is None:
        raise InvalidRefreshTokenError(
            "The refresh token is invalid."
        )

    if (
        refresh_session.revoked_at
        is not None
    ):
        revoke_user_refresh_sessions(
            database_session,
            user_id=(
                refresh_session.user_id
            ),
        )

        raise RevokedRefreshTokenError(
            "The refresh token has already "
            "been revoked."
        )

    if is_refresh_session_expired(
        refresh_session.expires_at
    ):
        revoke_refresh_session(
            database_session,
            refresh_session=(
                refresh_session
            ),
        )

        raise ExpiredRefreshTokenError(
            "The refresh token has expired."
        )

    user = get_user_by_id(
        database_session,
        refresh_session.user_id,
    )

    if user is None:
        revoke_refresh_session(
            database_session,
            refresh_session=(
                refresh_session
            ),
        )

        raise InvalidRefreshTokenError(
            "The refresh-token user "
            "was not found."
        )

    if (
        user.status
        == UserStatus.SUSPENDED
    ):
        revoke_user_refresh_sessions(
            database_session,
            user_id=user.id,
        )

        raise RefreshUserAccessDeniedError(
            "This user account has "
            "been suspended."
        )

    if (
        user.status
        != UserStatus.ACTIVE
    ):
        revoke_user_refresh_sessions(
            database_session,
            user_id=user.id,
        )

        raise RefreshUserAccessDeniedError(
            "This user account is "
            "not active."
        )

    return user, refresh_session


def rotate_refresh_session(
    database_session: Session,
    *,
    refresh_token: str,
    lifetime_days: int,
) -> RefreshSessionResult:
    user, current_session = (
        validate_refresh_session(
            database_session,
            refresh_token=refresh_token,
        )
    )

    mark_refresh_session_used(
        database_session,
        refresh_session=current_session,
    )

    revoke_refresh_session(
        database_session,
        refresh_session=current_session,
    )

    return issue_refresh_session(
        database_session,
        user=user,
        lifetime_days=lifetime_days,
    )


def revoke_refresh_token(
    database_session: Session,
    *,
    refresh_token: str,
) -> bool:
    try:
        token_hash = (
            hash_refresh_token(
                refresh_token
            )
        )

    except ValueError:
        return False

    refresh_session = (
        get_refresh_session_by_hash(
            database_session,
            token_hash=token_hash,
        )
    )

    if refresh_session is None:
        return False

    revoke_refresh_session(
        database_session,
        refresh_session=refresh_session,
    )

    return True