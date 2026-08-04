from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    CurrentUser,
)
from app.db.session import (
    get_database_session,
)
from app.schemas.predictive_maintenance import (
    PredictiveMaintenanceListResponse,
    PredictiveMaintenanceSummary,
    PredictiveRiskLevel,
)
from app.services.predictive_maintenance_service import (
    get_predictive_maintenance_assessments,
    get_predictive_maintenance_summary,
)


router = APIRouter(
    prefix="/predictive-maintenance",
    tags=["Predictive Maintenance"],
)


DatabaseSession = Annotated[
    Session,
    Depends(get_database_session),
]


@router.get(
    "/assessments",
    response_model=PredictiveMaintenanceListResponse,
    summary="Get predictive-maintenance assessments",
)
def list_predictive_maintenance_assessments(
    database_session: DatabaseSession,
    current_user: CurrentUser,
    facility: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=150,
        ),
    ] = None,
    risk_level: PredictiveRiskLevel | None = None,
) -> PredictiveMaintenanceListResponse:
    del current_user

    assessments = (
        get_predictive_maintenance_assessments(
            database_session
        )
    )

    if facility is not None:
        normalized_facility = (
            facility.strip().casefold()
        )

        assessments = [
            assessment
            for assessment in assessments
            if assessment.facility
            .strip()
            .casefold()
            == normalized_facility
        ]

    if risk_level is not None:
        assessments = [
            assessment
            for assessment in assessments
            if assessment.risk_level
            == risk_level
        ]

    return PredictiveMaintenanceListResponse(
        assessments=assessments,
        total=len(assessments),
    )


@router.get(
    "/summary",
    response_model=PredictiveMaintenanceSummary,
    summary="Get predictive-maintenance summary",
)
def read_predictive_maintenance_summary(
    database_session: DatabaseSession,
    current_user: CurrentUser,
) -> PredictiveMaintenanceSummary:
    del current_user

    return get_predictive_maintenance_summary(
        database_session
    )