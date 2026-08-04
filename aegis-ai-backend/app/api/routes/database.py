from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import (
    get_database_session,
)
from app.schemas.database import (
    DatabaseHealthResponse,
)


router = APIRouter(
    prefix="/database",
    tags=["Database"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


@router.get(
    "/health",
    response_model=DatabaseHealthResponse,
    summary="Check PostgreSQL connection",
)
def check_database_health(
    database_session: DatabaseSession,
) -> DatabaseHealthResponse:
    try:
        database_name = database_session.scalar(
            text("SELECT current_database()")
        )

        database_user = database_session.scalar(
            text("SELECT current_user")
        )

        server_version = database_session.scalar(
            text("SHOW server_version")
        )

        return DatabaseHealthResponse(
            status="healthy",
            database=str(database_name),
            user=str(database_user),
            server_version=str(server_version),
        )

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "The PostgreSQL database connection "
                "is unavailable."
            ),
        ) from error