from fastapi import APIRouter

from app.api.routes import (
    audit_logs,
    auth,
    database,
    live_telemetry,
    machines,
    maintenance_work_orders,
    predictive_maintenance,
    profile,
    robots,
    system,
    users,
)
from app.modules.agent.api import (
    routes as agent_routes,
)
from app.modules.rag.api import (
    routes as rag_routes,
)
from app.modules.vision.api import (
    routes as vision_routes,
)


api_router = APIRouter()


api_router.include_router(
    system.router,
)


api_router.include_router(
    database.router,
)


api_router.include_router(
    auth.router,
)


api_router.include_router(
    profile.router,
)


api_router.include_router(
    users.router,
)


api_router.include_router(
    audit_logs.router,
)


api_router.include_router(
    machines.router,
)


api_router.include_router(
    robots.router,
)


api_router.include_router(
    predictive_maintenance.router,
)


api_router.include_router(
    maintenance_work_orders.router,
)


api_router.include_router(
    live_telemetry.router,
)


api_router.include_router(
    rag_routes.router,
)


api_router.include_router(
    agent_routes.router,
)


api_router.include_router(
    vision_routes.router,
)
