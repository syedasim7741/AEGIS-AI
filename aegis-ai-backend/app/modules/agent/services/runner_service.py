from collections.abc import Callable
from typing import Any

from sqlalchemy.orm import Session

from app.modules.agent.core.schemas import (
    AgentPlan,
    AgentRunResult,
    AgentToolCall,
    AgentToolResult,
    AgentTraceStep,
)
from app.modules.agent.core.tool_registry import (
    tool_requires_approval,
)
from app.modules.agent.services.tool_executor import (
    execute_agent_tool,
)


AgentExecutor = Callable[
    ...,
    AgentToolResult,
]


def build_approval_message(
    tool_call: AgentToolCall,
) -> str:
    return (
        f"Approval is required before running "
        f"'{tool_call.tool.value}'. "
        f"Reason: {tool_call.reason}"
    )


def build_execution_summary(
    trace: list[AgentTraceStep],
) -> str:
    if not trace:
        return (
            "No operational tools were required "
            "for this request."
        )

    successful_count = sum(
        1
        for step in trace
        if step.tool_result.success
    )

    failed_steps = [
        step
        for step in trace
        if not step.tool_result.success
    ]

    if failed_steps:
        failed_tool = (
            failed_steps[0]
            .tool_call
            .tool
            .value
        )

        return (
            f"Executed {successful_count} tool(s) "
            f"successfully. Tool '{failed_tool}' "
            "failed. Review the execution trace."
        )

    return (
        f"Successfully executed "
        f"{successful_count} agent tool(s)."
    )


def run_agent_plan(
    database_session: Session,
    *,
    plan: AgentPlan,
    approved: bool = False,
    tool_executor: AgentExecutor = (
        execute_agent_tool
    ),
) -> AgentRunResult:
    trace: list[AgentTraceStep] = []

    for sequence, tool_call in enumerate(
        plan.tool_calls,
        start=1,
    ):
        if (
            tool_requires_approval(
                tool_call.tool
            )
            and not approved
        ):
            return AgentRunResult(
                goal=plan.goal,
                answer=(
                    "The agent paused before "
                    "performing a protected action."
                ),
                trace=trace,
                requires_approval=True,
                approval_message=(
                    build_approval_message(
                        tool_call
                    )
                ),
            )

        tool_result = tool_executor(
            database_session,
            tool_call=tool_call,
            approved=approved,
        )

        trace.append(
            AgentTraceStep(
                sequence=sequence,
                tool_call=tool_call,
                tool_result=tool_result,
            )
        )

        if not tool_result.success:
            break

    return AgentRunResult(
        goal=plan.goal,
        answer=build_execution_summary(
            trace
        ),
        trace=trace,
        requires_approval=False,
        approval_message=None,
    )
