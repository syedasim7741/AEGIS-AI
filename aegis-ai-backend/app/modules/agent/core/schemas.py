from enum import StrEnum
from typing import Any

from pydantic import (
    BaseModel,
    Field,
)


class AgentToolName(StrEnum):
    GET_MACHINE_SUMMARY = "get_machine_summary"
    LIST_MACHINES = "list_machines"

    GET_ROBOT_SUMMARY = "get_robot_summary"
    LIST_ROBOTS = "list_robots"

    GET_PREDICTIVE_MAINTENANCE = (
        "get_predictive_maintenance"
    )

    LIST_WORK_ORDERS = "list_work_orders"
    CREATE_WORK_ORDER = "create_work_order"

    SEARCH_DOCUMENTS = "search_documents"
    ANSWER_DOCUMENT_QUESTION = (
        "answer_document_question"
    )


class AgentToolRisk(StrEnum):
    READ_ONLY = "read_only"
    REQUIRES_APPROVAL = "requires_approval"


class AgentToolCall(BaseModel):
    tool: AgentToolName

    arguments: dict[str, Any] = Field(
        default_factory=dict,
    )

    reason: str = Field(
        min_length=2,
        max_length=1000,
    )


class AgentToolResult(BaseModel):
    tool: AgentToolName
    success: bool

    data: Any = None
    error: str | None = None

    execution_time_ms: float = Field(
        default=0.0,
        ge=0.0,
    )


class AgentPlan(BaseModel):
    goal: str = Field(
        min_length=2,
        max_length=4000,
    )

    tool_calls: list[AgentToolCall] = Field(
        default_factory=list,
        max_length=10,
    )

    final_response_instruction: str = Field(
        default=(
            "Summarize the tool results clearly "
            "and do not invent facts."
        ),
        max_length=2000,
    )


class AgentTraceStep(BaseModel):
    sequence: int = Field(
        ge=1,
    )

    tool_call: AgentToolCall
    tool_result: AgentToolResult


class AgentRunResult(BaseModel):
    goal: str
    answer: str

    trace: list[AgentTraceStep] = Field(
        default_factory=list,
    )

    requires_approval: bool = False
    approval_message: str | None = None
