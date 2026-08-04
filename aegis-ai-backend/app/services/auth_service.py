from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
)
from app.models.user import (
    User,
    UserStatus,
)
from app.repositories.user import (
    get_user_by_email,
    update_user_last_login,
)
from app.services.audit_log_service import (
    record_audit_log,
)


class InvalidCredentialsError(Exception):
    pass


class UserAccessDeniedError(Exception):
    pass


def authenticate_user(
    database_session: Session,
    *,
    email: str,
    password: str,
) -> User:
    user = get_user_by_email(
        database_session,
        email,
    )

    if user is None:
        raise InvalidCredentialsError(
            "The email or password is incorrect."
        )

    password_is_valid = verify_password(
        password,
        user.password_hash,
    )

    if not password_is_valid:
        raise InvalidCredentialsError(
            "The email or password is incorrect."
        )

    if user.status == UserStatus.SUSPENDED:
        raise UserAccessDeniedError(
            "This user account has been suspended."
        )

    if user.status != UserStatus.ACTIVE:
        raise UserAccessDeniedError(
            "This user account is not active."
        )

    authenticated_user = (
        update_user_last_login(
            database_session,
            user,
        )
    )

    record_audit_log(
        database_session,
        action="User signed in",
        actor_user_id=authenticated_user.id,
        actor_name=authenticated_user.full_name,
        target_user_id=authenticated_user.id,
        target_name=authenticated_user.full_name,
        details=(
            "The user successfully authenticated "
            "through the AEGIS AI login endpoint."
        ),
    )

    return authenticated_user