from datetime import (
    datetime,
    timezone,
)
from uuid import UUID

from sqlalchemy import (
    select,
    update,
)
from sqlalchemy.orm import Session

from app.models.refresh_session import (
    RefreshSession,
)


def create_refresh_session(
    database_session: Session,
    *,
    user_id: UUID,
    token_hash: str,
    expires_at: datetime,
) -> RefreshSession:
    refresh_session = RefreshSession(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    database_session.add(
        refresh_session
    )

    database_session.commit()

    database_session.refresh(
        refresh_session
    )

    return refresh_session


def get_refresh_session_by_hash(
    database_session: Session,
    *,
    token_hash: str,
) -> RefreshSession | None:
    statement = select(
        RefreshSession
    ).where(
        RefreshSession.token_hash
        == token_hash
    )

    return database_session.scalar(
        statement
    )


def mark_refresh_session_used(
    database_session: Session,
    *,
    refresh_session: RefreshSession,
) -> RefreshSession:
    refresh_session.last_used_at = (
        datetime.now(
            timezone.utc
        )
    )

    database_session.add(
        refresh_session
    )

    database_session.commit()

    database_session.refresh(
        refresh_session
    )

    return refresh_session


def revoke_refresh_session(
    database_session: Session,
    *,
    refresh_session: RefreshSession,
) -> RefreshSession:
    if (
        refresh_session.revoked_at
        is None
    ):
        refresh_session.revoked_at = (
            datetime.now(
                timezone.utc
            )
        )

        database_session.add(
            refresh_session
        )

        database_session.commit()

        database_session.refresh(
            refresh_session
        )

    return refresh_session


def revoke_user_refresh_sessions(
    database_session: Session,
    *,
    user_id: UUID,
) -> int:
    revoked_at = datetime.now(
        timezone.utc
    )

    statement = (
        update(RefreshSession)
        .where(
            RefreshSession.user_id
            == user_id,
            RefreshSession.revoked_at
            .is_(None),
        )
        .values(
            revoked_at=revoked_at
        )
    )

    result = database_session.execute(
        statement
    )

    database_session.commit()

    return int(
        result.rowcount or 0
    )