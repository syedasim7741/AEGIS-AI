from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.repositories.audit_log import (
    count_audit_logs as count_audit_log_records,
)
from app.repositories.audit_log import (
    create_audit_log as create_audit_log_record,
)
from app.repositories.audit_log import (
    list_audit_logs as list_audit_log_records,
)


def record_audit_log(
    database_session: Session,
    *,
    action: str,
    actor_user_id: UUID | None,
    actor_name: str,
    target_user_id: UUID | None,
    target_name: str,
    details: str,
) -> AuditLog:
    return create_audit_log_record(
        database_session,
        action=action,
        actor_user_id=actor_user_id,
        actor_name=actor_name,
        target_user_id=target_user_id,
        target_name=target_name,
        details=details,
    )


def get_audit_logs(
    database_session: Session,
    *,
    offset: int,
    limit: int,
) -> tuple[list[AuditLog], int]:
    audit_logs = list_audit_log_records(
        database_session,
        offset=offset,
        limit=limit,
    )

    total = count_audit_log_records(
        database_session
    )

    return audit_logs, total