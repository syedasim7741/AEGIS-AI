from uuid import UUID

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    database_session: Session,
    *,
    action: str,
    actor_user_id: UUID | None,
    actor_name: str,
    target_user_id: UUID | None,
    target_name: str,
    details: str,
) -> AuditLog:
    audit_log = AuditLog(
        action=action,
        actor_user_id=actor_user_id,
        actor_name=actor_name,
        target_user_id=target_user_id,
        target_name=target_name,
        details=details,
    )

    database_session.add(audit_log)
    database_session.commit()
    database_session.refresh(audit_log)

    return audit_log


def list_audit_logs(
    database_session: Session,
    *,
    offset: int = 0,
    limit: int = 100,
) -> list[AuditLog]:
    statement = (
        select(AuditLog)
        .order_by(
            AuditLog.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
    )

    audit_logs = database_session.scalars(
        statement
    ).all()

    return list(audit_logs)


def count_audit_logs(
    database_session: Session,
) -> int:
    statement = (
        select(func.count())
        .select_from(AuditLog)
    )

    result = database_session.scalar(
        statement
    )

    return int(result or 0)