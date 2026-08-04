from collections.abc import Callable
from time import perf_counter
from typing import Any

from sqlalchemy.orm import Session

from app.modules.agent.core.schemas import (
    AgentToolCall,
    AgentToolName,
    AgentToolResult,
)
from app.modules.agent.core.tool_registry import (
    tool_requires_approval,
)
from app.modules.agent.tools.document_tools import (
    answer_document_question_tool,
    search_documents_tool,
)
from app.modules.agent.tools.operations_tools import (
    get_machine_summary_tool,
    get_predictive_maintenance_tool,
    get_robot_summary_tool,
    list_machines_tool,
    list_robots_tool,
    list_work_orders_tool,
)
from app.modules.agent.tools.work_order_tools import (
    create_work_order_tool,
)


AgentToolFunction = Callable[
    ...,
    dict[str, Any],
]


class AgentToolApprovalRequiredError(
    Exception
):
    """Raised when a write tool lacks approval."""


TOOL_EXECUTORS: dict[
    AgentToolName,
    AgentToolFunction,
] = {
    AgentToolName.GET_MACHINE_SUMMARY: (
        get_machine_summary_tool
    ),
    AgentToolName.LIST_MACHINES: (
        list_machines_tool
    ),
    AgentToolName.GET_ROBOT_SUMMARY: (
        get_robot_summary_tool
    ),
    AgentToolName.LIST_ROBOTS: (
        list_robots_tool
    ),
    AgentToolName.GET_PREDICTIVE_MAINTENANCE: (
        get_predictive_maintenance_tool
    ),
    AgentToolName.LIST_WORK_ORDERS: (
        list_work_orders_tool
    ),
    AgentToolName.CREATE_WORK_ORDER: (
        create_work_order_tool
    ),
    AgentToolName.SEARCH_DOCUMENTS: (
        search_documents_tool
    ),
    AgentToolName.ANSWER_DOCUMENT_QUESTION: (
        answer_document_question_tool
    ),
}


def execute_agent_tool(
    database_session: Session,
    *,
    tool_call: AgentToolCall,
    approved: bool = False,
) -> AgentToolResult:
    """
    Execute one registered agent tool.

    Read-only tools run immediately. Tools that
    modify data require explicit approval.
    """

    if (
        tool_requires_approval(
            tool_call.tool
        )
        and not approved
    ):
        raise AgentToolApprovalRequiredError(
            f"Tool '{tool_call.tool.value}' "
            "requires explicit user approval."
        )

    executor = TOOL_EXECUTORS.get(
        tool_call.tool
    )

    if executor is None:
        return AgentToolResult(
            tool=tool_call.tool,
            success=False,
            error=(
                "No executor is registered for "
                f"'{tool_call.tool.value}'."
            ),
        )

    started_at = perf_counter()

    try:
        result = executor(
            database_session,
            **tool_call.arguments,
        )

    except Exception as error:
        elapsed_ms = (
            perf_counter() - started_at
        ) * 1000

        return AgentToolResult(
            tool=tool_call.tool,
            success=False,
            error=str(error),
            execution_time_ms=round(
                elapsed_ms,
                3,
            ),
        )

    elapsed_ms = (
        perf_counter() - started_at
    ) * 1000

    return AgentToolResult(
        tool=tool_call.tool,
        success=True,
        data=result,
        execution_time_ms=round(
            elapsed_ms,
            3,
        ),
    )
