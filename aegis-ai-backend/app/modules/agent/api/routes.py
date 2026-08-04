from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    get_current_user,
    require_administrator,
)
from app.db.session import (
    get_database_session,
)
from app.models.user import User
from app.modules.agent.api.schemas import (
    AgentApprovalRequest,
    AgentExecutionResponse,
    AgentRunRequest,
    AgentToolListResponse,
    AgentToolSummary,
)
from app.modules.agent.core.tool_registry import (
    get_available_tools,
)
from app.modules.agent.services.orchestrator_service import (
    execute_agent_goal,
    execute_agent_plan,
)
from app.modules.agent.services.planner_service import (
    AgentPlannerError,
)
from app.modules.agent.services.response_service import (
    AgentResponseError,
)


router = APIRouter(
    prefix="/agent",
    tags=["Agentic AI"],
)


@router.get(
    "/tools",
    response_model=AgentToolListResponse,
)
def list_agent_tools(
    _current_user: User = Depends(
        get_current_user
    ),
) -> AgentToolListResponse:
    tools = [
        AgentToolSummary(
            name=definition.name.value,
            description=definition.description,
            risk=definition.risk.value,
        )
        for definition in get_available_tools()
    ]

    return AgentToolListResponse(
        tools=tools,
        total=len(tools),
    )


@router.post(
    "/run",
    response_model=AgentExecutionResponse,
)
def run_agent(
    payload: AgentRunRequest,
    database_session: Session = Depends(
        get_database_session
    ),
    _current_user: User = Depends(
        get_current_user
    ),
) -> AgentExecutionResponse:
    try:
        execution = execute_agent_goal(
            database_session,
            goal=payload.goal,
            approved=False,
        )

    except AgentPlannerError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_502_BAD_GATEWAY
            ),
            detail=str(error),
        ) from error

    except AgentResponseError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_502_BAD_GATEWAY
            ),
            detail=str(error),
        ) from error

    return AgentExecutionResponse(
        plan=execution.plan,
        result=execution.result,
    )


@router.post(
    "/approve",
    response_model=AgentExecutionResponse,
)
def approve_agent_plan(
    payload: AgentApprovalRequest,
    database_session: Session = Depends(
        get_database_session
    ),
    _administrator: User = Depends(
        require_administrator
    ),
) -> AgentExecutionResponse:
    if payload.approved is not True:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "approved must be true before "
                "protected tools can execute."
            ),
        )

    try:
        execution = execute_agent_plan(
            database_session,
            plan=payload.plan,
            approved=True,
        )

    except AgentResponseError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_502_BAD_GATEWAY
            ),
            detail=str(error),
        ) from error

    return AgentExecutionResponse(
        plan=execution.plan,
        result=execution.result,
    )
