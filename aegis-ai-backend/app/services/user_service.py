from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
)
from app.models.user import (
    User,
    UserRole,
    UserStatus,
)
from app.repositories.user import (
    count_users as count_user_records,
)
from app.repositories.user import (
    create_user as create_user_record,
)
from app.repositories.user import (
    get_user_by_email,
    get_user_by_id,
)
from app.repositories.user import (
    list_users as list_user_records,
)
from app.repositories.user import (
    update_user as update_user_record,
)
from app.repositories.user import (
    update_user_status as update_user_status_record,
)
from app.schemas.user import (
    UserCreate,
    UserStatusUpdate,
    UserUpdate,
)
from app.services.audit_log_service import (
    record_audit_log,
)


class UserAlreadyExistsError(Exception):
    pass


class UserNotFoundError(Exception):
    pass


class SelfAdministrationError(Exception):
    pass


def get_user_or_raise(
    database_session: Session,
    user_id: UUID,
) -> User:
    user = get_user_by_id(
        database_session,
        user_id,
    )

    if user is None:
        raise UserNotFoundError(
            "The requested user was not found."
        )

    return user


def list_users(
    database_session: Session,
    *,
    offset: int,
    limit: int,
) -> tuple[list[User], int]:
    users = list_user_records(
        database_session,
        offset=offset,
        limit=limit,
    )

    total = count_user_records(
        database_session
    )

    return users, total


def create_user(
    database_session: Session,
    user_data: UserCreate,
    *,
    administrator: User | None = None,
) -> User:
    existing_user = get_user_by_email(
        database_session,
        str(user_data.email),
    )

    if existing_user is not None:
        raise UserAlreadyExistsError(
            "A user with this email already exists."
        )

    password_hash = hash_password(
        user_data.password
    )

    try:
        created_user = create_user_record(
            database_session,
            full_name=user_data.full_name,
            email=str(user_data.email),
            password_hash=password_hash,
            role=user_data.role,
            department=user_data.department,
            status=user_data.status,
        )

    except IntegrityError as error:
        database_session.rollback()

        raise UserAlreadyExistsError(
            "A user with this email already exists."
        ) from error

    if administrator is not None:
        record_audit_log(
            database_session,
            action="User account created",
            actor_user_id=administrator.id,
            actor_name=administrator.full_name,
            target_user_id=created_user.id,
            target_name=created_user.full_name,
            details=(
                f"A {created_user.role.value} account "
                f"was created for {created_user.email}."
            ),
        )

    return created_user


def update_user(
    database_session: Session,
    *,
    administrator: User,
    user_id: UUID,
    user_data: UserUpdate,
) -> User:
    user = get_user_or_raise(
        database_session,
        user_id,
    )

    updates = user_data.model_dump(
        exclude_unset=True,
    )

    new_email = updates.get("email")

    if (
        isinstance(new_email, str)
        and new_email.lower()
        != user.email.lower()
    ):
        existing_user = get_user_by_email(
            database_session,
            new_email,
        )

        if (
            existing_user is not None
            and existing_user.id != user.id
        ):
            raise UserAlreadyExistsError(
                "A user with this email already exists."
            )

    new_role = updates.get("role")

    if (
        user.id == administrator.id
        and new_role is not None
        and new_role
        != UserRole.ADMINISTRATOR
    ):
        raise SelfAdministrationError(
            "You cannot remove your own "
            "Administrator role."
        )

    try:
        updated_user = update_user_record(
            database_session,
            user=user,
            updates=updates,
        )

    except IntegrityError as error:
        database_session.rollback()

        raise UserAlreadyExistsError(
            "A user with this email already exists."
        ) from error

    changed_fields = ", ".join(
        sorted(updates.keys())
    )

    record_audit_log(
        database_session,
        action="User account updated",
        actor_user_id=administrator.id,
        actor_name=administrator.full_name,
        target_user_id=updated_user.id,
        target_name=updated_user.full_name,
        details=(
            "The following account fields were "
            f"updated: {changed_fields}."
        ),
    )

    return updated_user


def change_user_status(
    database_session: Session,
    *,
    administrator: User,
    user_id: UUID,
    status_data: UserStatusUpdate,
) -> User:
    user = get_user_or_raise(
        database_session,
        user_id,
    )

    if (
        user.id == administrator.id
        and status_data.status
        != UserStatus.ACTIVE
    ):
        raise SelfAdministrationError(
            "You cannot suspend or deactivate "
            "your own Administrator account."
        )

    updated_user = (
        update_user_status_record(
            database_session,
            user=user,
            new_status=status_data.status,
        )
    )

    if updated_user.status == UserStatus.ACTIVE:
        action = "User account activated"

    elif (
        updated_user.status
        == UserStatus.SUSPENDED
    ):
        action = "User account suspended"

    else:
        action = "User account invited"

    record_audit_log(
        database_session,
        action=action,
        actor_user_id=administrator.id,
        actor_name=administrator.full_name,
        target_user_id=updated_user.id,
        target_name=updated_user.full_name,
        details=(
            "The account status was changed to "
            f"{updated_user.status.value}."
        ),
    )

    return updated_user