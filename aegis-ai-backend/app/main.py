from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.schemas.system import RootResponse


def create_application() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(
        api_router,
        prefix=settings.api_v1_prefix,
    )

    return application


app = create_application()


@app.get(
    "/health",
    tags=["System"],
    summary="Container health check",
    include_in_schema=False,
)
async def health() -> dict[str, str]:
    settings = get_settings()

    return {
        "status": "healthy",
        "application": settings.app_name,
        "version": settings.app_version,
    }


@app.get(
    "/",
    response_model=RootResponse,
    tags=["System"],
    summary="AEGIS AI API root",
)
async def root() -> RootResponse:
    settings = get_settings()

    return RootResponse(
        application=settings.app_name,
        status="running",
        version=settings.app_version,
        environment=settings.environment,
        documentation="/docs",
    )