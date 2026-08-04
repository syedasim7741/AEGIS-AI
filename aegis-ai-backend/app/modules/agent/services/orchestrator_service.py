from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.modules.agent.core.schemas import (
    AgentPlan,
    AgentRunResult,
)
from app.modules.agent.services.planner_service import (
    AgentPlannerProvider,
    create_agent_plan,
)
from app.modules.agent.services.response_service import (
    AgentResponseProvider,
    generate_agent_response,
)
from app.modules.agent.services.runner_service import (
    AgentExecutor,
    run_agent_plan,
)
from app.modules.agent.services.tool_executor import (
    execute_agent_tool,
)


@dataclass(
    frozen=True,
    slots=True,
)
class AgentExecution:
    plan: AgentPlan
    result: AgentRunResult


def execute_agent_plan(
    database_session: Session,
    *,
    plan: AgentPlan,
    approved: bool = False,
    response_provider: (
        AgentResponseProvider | None
    ) = None,
    tool_executor: AgentExecutor = (
        execute_agent_tool
    ),
) -> AgentExecution:
    """
    Execute an existing validated plan.

    This is used by the approval endpoint so the
    agent does not generate a different plan after
    the user approves an action.
    """

    run_result = run_agent_plan(
        database_session,
        plan=plan,
        approved=approved,
        tool_executor=tool_executor,
    )

    final_answer = generate_agent_response(
        plan,
        run_result,
        response_provider=response_provider,
    )

    final_result = run_result.model_copy(
        update={
            "answer": final_answer,
        }
    )

    return AgentExecution(
        plan=plan,
        result=final_result,
    )


def execute_agent_goal(
    database_session: Session,
    *,
    goal: str,
    approved: bool = False,
    planner_provider: (
        AgentPlannerProvider | None
    ) = None,
    response_provider: (
        AgentResponseProvider | None
    ) = None,
    tool_executor: AgentExecutor = (
        execute_agent_tool
    ),
) -> AgentExecution:
    """
    Create and execute an AEGIS agent plan.
    """

    plan = create_agent_plan(
        goal,
        planner_provider=planner_provider,
    )

    return execute_agent_plan(
        database_session,
        plan=plan,
        approved=approved,
        response_provider=response_provider,
        tool_executor=tool_executor,
    )
