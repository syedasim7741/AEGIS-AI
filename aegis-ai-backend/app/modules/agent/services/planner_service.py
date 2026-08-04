import json
from collections.abc import Sequence
from typing import Protocol

from pydantic import ValidationError

from app.modules.agent.core.schemas import (
    AgentPlan,
    AgentToolName,
)
from app.modules.agent.core.tool_registry import (
    AgentToolDefinition,
    get_available_tools,
)
from app.modules.rag.providers.chat_provider import (
    get_chat_provider,
)


class AgentPlannerError(Exception):
    """Raised when the AI cannot produce a valid plan."""


class AgentPlannerProvider(Protocol):
    def generate_answer(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        ...


def serialize_tool_definition(
    definition: AgentToolDefinition,
) -> dict:
    return {
        "name": definition.name.value,
        "description": definition.description,
        "risk": definition.risk.value,
        "parameters": definition.parameters,
    }


def build_planner_system_prompt(
    tools: Sequence[AgentToolDefinition],
) -> str:
    serialized_tools = [
        serialize_tool_definition(tool)
        for tool in tools
    ]

    tools_json = json.dumps(
        serialized_tools,
        indent=2,
    )

    return f"""
You are the planning engine for AEGIS AI,
an enterprise industrial operations assistant.

Create a small, safe tool-execution plan for
the user's goal.

Rules:
1. Use only tools listed below.
2. Never invent tool names or arguments.
3. Prefer read-only tools.
4. Use no more than 5 tool calls unless necessary.
5. Do not execute tools yourself.
6. A tool marked requires_approval may be planned,
   but it cannot run without user approval.
7. Return JSON only. Do not use Markdown.
8. If no tool is required, return an empty
   tool_calls array.
9. Preserve the user's actual goal.
10. Do not invent machines, robots, documents,
    work orders, IDs, readings, or operational facts.

Return exactly this structure:
{{
  "goal": "User goal",
  "tool_calls": [
    {{
      "tool": "registered_tool_name",
      "arguments": {{}},
      "reason": "Why this tool is required"
    }}
  ],
  "final_response_instruction":
    "How the final answer should summarize results"
}}

Available tools:
{tools_json}
""".strip()


def extract_json_object(
    raw_response: str,
) -> dict:
    cleaned_response = raw_response.strip()

    if cleaned_response.startswith("```"):
        lines = cleaned_response.splitlines()

        if lines:
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        cleaned_response = "\n".join(lines).strip()

    first_brace = cleaned_response.find("{")
    last_brace = cleaned_response.rfind("}")

    if first_brace == -1 or last_brace == -1:
        raise AgentPlannerError(
            "The planner did not return a JSON object."
        )

    json_text = cleaned_response[
        first_brace:last_brace + 1
    ]

    try:
        parsed_data = json.loads(json_text)
    except json.JSONDecodeError as error:
        raise AgentPlannerError(
            "The planner returned invalid JSON."
        ) from error

    if not isinstance(parsed_data, dict):
        raise AgentPlannerError(
            "The planner response must be an object."
        )

    return parsed_data



def goal_explicitly_requests(
    normalized_goal: str,
    phrases: tuple[str, ...],
) -> bool:
    return any(
        phrase in normalized_goal
        for phrase in phrases
    )


def sanitize_agent_plan(
    goal: str,
    plan: AgentPlan,
) -> AgentPlan:
    """
    Remove optional protected-action arguments
    unless the user explicitly requested them.
    """

    normalized_goal = goal.lower()

    sanitized_calls = []

    for tool_call in plan.tool_calls:
        if (
            tool_call.tool
            != AgentToolName.CREATE_WORK_ORDER
        ):
            sanitized_calls.append(tool_call)
            continue

        arguments = dict(
            tool_call.arguments
        )

        optional_argument_rules = {
            "risk_score": (
                "risk score",
            ),
            "recommended_action": (
                "recommended action",
                "recommendation",
            ),
            "assigned_to": (
                "assign to",
                "assigned to",
                "assignee",
            ),
            "scheduled_for": (
                "schedule for",
                "scheduled for",
                "schedule it",
            ),
        }

        for argument_name, phrases in (
            optional_argument_rules.items()
        ):
            if not goal_explicitly_requests(
                normalized_goal,
                phrases,
            ):
                arguments.pop(
                    argument_name,
                    None,
                )

        sanitized_calls.append(
            tool_call.model_copy(
                update={
                    "arguments": arguments,
                }
            )
        )

    return plan.model_copy(
        update={
            "tool_calls": sanitized_calls,
        }
    )


def create_agent_plan(
    goal: str,
    *,
    planner_provider: (
        AgentPlannerProvider | None
    ) = None,
) -> AgentPlan:
    cleaned_goal = goal.strip()

    if len(cleaned_goal) < 2:
        raise AgentPlannerError(
            "The agent goal must contain at least "
            "2 characters."
        )

    provider = (
        planner_provider
        or get_chat_provider()
    )

    system_prompt = build_planner_system_prompt(
        get_available_tools()
    )

    raw_response = provider.generate_answer(
        system_prompt=system_prompt,
        user_prompt=cleaned_goal,
    )

    parsed_data = extract_json_object(
        raw_response
    )

    try:
        validated_plan = AgentPlan.model_validate(
            parsed_data
        )

        return sanitize_agent_plan(
            cleaned_goal,
            validated_plan,
        )
    except ValidationError as error:
        raise AgentPlannerError(
            "The planner response failed validation: "
            f"{error}"
        ) from error
