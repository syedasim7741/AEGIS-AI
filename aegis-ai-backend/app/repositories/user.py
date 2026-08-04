from datetime import (
    datetime,
    timezone,
)
from typing import Any
from uuid import UUID

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.orm import Session

from app.models.user import (
    User,
    UserRole,
    UserStatus,
)


def get_user_by_id(
    database_session: Session,
    user_id: UUID,
) -> User | None:
    return database_session.get(
        User,
        user_id,
    )


def get_user_by_email(
    database_session: Session,
    email: str,
) -> User | None:
    normalized_email = (
        email.strip().lower()
    )

    statement = select(User).where(
        User.email == normalized_email
    )

    return database_session.scalar(
        statement
    )


def list_users(
    database_session: Session,
    *,
    offset: int = 0,
    limit: int = 100,
) -> list[User]:
    statement = (
        select(User)
        .order_by(
            User.created_at.desc(),
            User.full_name.asc(),
        )
        .offset(offset)
        .limit(limit)
    )

    users = database_session.scalars(
        statement
    ).all()

    return list(users)


def count_users(
    database_session: Session,
) -> int:
    statement = (
        select(func.count())
        .select_from(User)
    )

    result = database_session.scalar(
        statement
    )

    return int(result or 0)


def create_user(
    database_session: Session,
    *,
    full_name: str,
    email: str,
    password_hash: str,
    role: UserRole,
    department: str,
    status: UserStatus,
) -> User:
    user = User(
        full_name=full_name,
        email=email.strip().lower(),
        password_hash=password_hash,
        role=role,
        department=department,
        status=status,
    )

    database_session.add(user)
    database_session.commit()
    database_session.refresh(user)

    return user


def update_user(
    database_session: Session,
    *,
    user: User,
    updates: dict[str, Any],
) -> User:
    for field_name, field_value in updates.items():
        setattr(
            user,
            field_name,
            field_value,
        )

    database_session.add(user)
    database_session.commit()
    database_session.refresh(user)

    return user


def update_user_status(
    database_session: Session,
    *,
    user: User,
    new_status: UserStatus,
) -> User:
    user.status = new_status

    database_session.add(user)
    database_session.commit()
    database_session.refresh(user)

    return user


def update_user_last_login(
    database_session: Session,
    user: User,
) -> User:
    user.last_login_at = datetime.now(
        timezone.utc
    )

    database_session.add(user)
    database_session.commit()
    database_session.refresh(user)

    return user