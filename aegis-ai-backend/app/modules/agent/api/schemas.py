from typing import Annotated

from pydantic import (
    BaseModel,
    Field,
    StringConstraints,
)

from app.modules.agent.core.schemas import (
    AgentPlan,
    AgentRunResult,
)


AgentGoal = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=2,
        max_length=4000,
    ),
]


class AgentRunRequest(BaseModel):
    goal: AgentGoal


class AgentApprovalRequest(BaseModel):
    """
    Executes the exact plan previously returned by
    the agent. Approval does not generate a new plan.
    """

    plan: AgentPlan

    approved: bool = Field(
        default=False,
        description=(
            "Must be true to execute tools that "
            "change stored application data."
        ),
    )


class AgentExecutionResponse(BaseModel):
    plan: AgentPlan
    result: AgentRunResult


class AgentToolSummary(BaseModel):
    name: str
    description: str
    risk: str


class AgentToolListResponse(BaseModel):
    tools: list[AgentToolSummary]
    total: int = Field(
        ge=0,
    )
