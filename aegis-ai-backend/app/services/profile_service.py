from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user import (
    update_user as update_user_record,
)
from app.schemas.profile import (
    PasswordChangeRequest,
    ProfileUpdate,
)
from app.services.audit_log_service import (
    record_audit_log,
)


class InvalidCurrentPasswordError(Exception):
    pass


class PasswordReuseError(Exception):
    pass


def update_current_user_profile(
    database_session: Session,
    *,
    current_user: User,
    profile_data: ProfileUpdate,
) -> User:
    updates = profile_data.model_dump(
        exclude_unset=True,
    )

    updated_user = update_user_record(
        database_session,
        user=current_user,
        updates=updates,
    )

    changed_fields = ", ".join(
        sorted(updates.keys())
    )

    record_audit_log(
        database_session,
        action="User profile updated",
        actor_user_id=updated_user.id,
        actor_name=updated_user.full_name,
        target_user_id=updated_user.id,
        target_name=updated_user.full_name,
        details=(
            "The user updated the following "
            f"profile fields: {changed_fields}."
        ),
    )

    return updated_user


def change_current_user_password(
    database_session: Session,
    *,
    current_user: User,
    password_data: PasswordChangeRequest,
) -> None:
    current_password_is_valid = (
        verify_password(
            password_data.current_password,
            current_user.password_hash,
        )
    )

    if not current_password_is_valid:
        raise InvalidCurrentPasswordError(
            "The current password is incorrect."
        )

    new_password_matches_old_password = (
        verify_password(
            password_data.new_password,
            current_user.password_hash,
        )
    )

    if new_password_matches_old_password:
        raise PasswordReuseError(
            "The new password must be different "
            "from the current password."
        )

    new_password_hash = hash_password(
        password_data.new_password
    )

    updated_user = update_user_record(
        database_session,
        user=current_user,
        updates={
            "password_hash":
                new_password_hash,
        },
    )

    record_audit_log(
        database_session,
        action="User password changed",
        actor_user_id=updated_user.id,
        actor_name=updated_user.full_name,
        target_user_id=updated_user.id,
        target_name=updated_user.full_name,
        details=(
            "The user successfully changed "
            "their account password."
        ),
    )