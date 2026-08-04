from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.core.config import (
    Settings,
    get_settings,
)
from app.schemas.system import (
    APIInformationResponse,
    HealthCheckResponse,
)


router = APIRouter(
    prefix="/system",
    tags=["System"],
)


@router.get(
    "/info",
    response_model=APIInformationResponse,
    summary="Get API information",
)
async def get_api_information(
    settings: Settings = Depends(get_settings),
) -> APIInformationResponse:
    return APIInformationResponse(
        name=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        environment=settings.environment,
        api_prefix=settings.api_v1_prefix,
    )


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Check backend health",
)
async def health_check(
    settings: Settings = Depends(get_settings),
) -> HealthCheckResponse:
    return HealthCheckResponse(
        status="healthy",
        service="aegis-ai-backend",
        environment=settings.environment,
        timestamp=datetime.now(timezone.utc),
    )