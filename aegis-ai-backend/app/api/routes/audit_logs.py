from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    AdministratorUser,
)
from app.db.session import (
    get_database_session,
)
from app.schemas.audit_log import (
    AuditLogListResponse,
    AuditLogResponse,
)
from app.services.audit_log_service import (
    get_audit_logs,
)


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="List security audit logs",
)
def list_security_audit_logs(
    administrator: AdministratorUser,
    database_session: DatabaseSession,
    offset: Annotated[
        int,
        Query(
            ge=0,
            description=(
                "Number of audit records to skip."
            ),
        ),
    ] = 0,
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=100,
            description=(
                "Maximum audit records to return."
            ),
        ),
    ] = 50,
) -> AuditLogListResponse:
    del administrator

    audit_logs, total = get_audit_logs(
        database_session,
        offset=offset,
        limit=limit,
    )

    return AuditLogListResponse(
        items=[
            AuditLogResponse.model_validate(
                audit_log
            )
            for audit_log in audit_logs
        ],
        total=total,
        offset=offset,
        limit=limit,
    )