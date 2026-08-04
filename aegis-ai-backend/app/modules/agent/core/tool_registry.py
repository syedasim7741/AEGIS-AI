from dataclasses import dataclass
from typing import Any

from app.modules.agent.core.schemas import (
    AgentToolName,
    AgentToolRisk,
)


@dataclass(
    frozen=True,
    slots=True,
)
class AgentToolDefinition:
    name: AgentToolName
    description: str
    risk: AgentToolRisk
    parameters: dict[str, Any]


TOOL_REGISTRY: dict[
    AgentToolName,
    AgentToolDefinition,
] = {
    AgentToolName.GET_MACHINE_SUMMARY: (
        AgentToolDefinition(
            name=AgentToolName.GET_MACHINE_SUMMARY,
            description=(
                "Return the total machine count, "
                "status counts, and average health score."
            ),
            risk=AgentToolRisk.READ_ONLY,
            parameters={
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        )
    ),
    AgentToolName.LIST_MACHINES: AgentToolDefinition(
        name=AgentToolName.LIST_MACHINES,
        description=(
            "List machines using optional search, "
            "facility, status, and type filters."
        ),
        risk=AgentToolRisk.READ_ONLY,
        parameters={
            "type": "object",
            "properties": {
                "search": {
                    "type": ["string", "null"],
                },
                "facility": {
                    "type": ["string", "null"],
                },
                "status": {
                    "type": ["string", "null"],
                    "enum": [
                        "Operational",
                        "Warning",
                        "Critical",
                        "Offline",
                        "Maintenance",
                        None,
                    ],
                },
                "machine_type": {
                    "type": ["string", "null"],
                    "enum": [
                        "CNC",
                        "Conveyor",
                        "Compressor",
                        "Pump",
                        "Turbine",
                        "Generator",
                        "Packaging",
                        "Other",
                        None,
                    ],
                },
                "limit": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100,
                    "default": 20,
                },
            },
            "additionalProperties": False,
        },
    ),
    AgentToolName.GET_ROBOT_SUMMARY: (
        AgentToolDefinition(
            name=AgentToolName.GET_ROBOT_SUMMARY,
            description=(
                "Return robot status counts, average "
                "health, and average utilization."
            ),
            risk=AgentToolRisk.READ_ONLY,
            parameters={
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        )
    ),
    AgentToolName.LIST_ROBOTS: AgentToolDefinition(
        name=AgentToolName.LIST_ROBOTS,
        description=(
            "List robots using optional search, "
            "facility, status, and type filters."
        ),
        risk=AgentToolRisk.READ_ONLY,
        parameters={
            "type": "object",
            "properties": {
                "search": {
                    "type": ["string", "null"],
                },
                "facility": {
                    "type": ["string", "null"],
                },
                "status": {
                    "type": ["string", "null"],
                    "enum": [
                        "Active",
                        "Idle",
                        "Warning",
                        "Error",
                        "Offline",
                        "Maintenance",
                        None,
                    ],
                },
                "robot_type": {
                    "type": ["string", "null"],
                },
                "limit": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100,
                    "default": 20,
                },
            },
            "additionalProperties": False,
        },
    ),
    AgentToolName.GET_PREDICTIVE_MAINTENANCE: (
        AgentToolDefinition(
            name=(
                AgentToolName
                .GET_PREDICTIVE_MAINTENANCE
            ),
            description=(
                "Assess all machines and return their "
                "predictive-maintenance risk details."
            ),
            risk=AgentToolRisk.READ_ONLY,
            parameters={
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        )
    ),
    AgentToolName.LIST_WORK_ORDERS: (
        AgentToolDefinition(
            name=AgentToolName.LIST_WORK_ORDERS,
            description=(
                "List maintenance work orders using "
                "optional filters."
            ),
            risk=AgentToolRisk.READ_ONLY,
            parameters={
                "type": "object",
                "properties": {
                    "search": {
                        "type": ["string", "null"],
                    },
                    "status": {
                        "type": ["string", "null"],
                        "enum": [
                            "Open",
                            "Scheduled",
                            "In Progress",
                            "Completed",
                            "Cancelled",
                            None,
                        ],
                    },
                    "priority": {
                        "type": ["string", "null"],
                        "enum": [
                            "Low",
                            "Medium",
                            "High",
                            "Critical",
                            None,
                        ],
                    },
                    "machine_id": {
                        "type": ["string", "null"],
                        "format": "uuid",
                    },
                    "facility": {
                        "type": ["string", "null"],
                    },
                    "assigned_to": {
                        "type": ["string", "null"],
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 100,
                        "default": 20,
                    },
                },
                "additionalProperties": False,
            },
        )
    ),
    AgentToolName.CREATE_WORK_ORDER: (
        AgentToolDefinition(
            name=AgentToolName.CREATE_WORK_ORDER,
            description=(
                "Create a maintenance work order. "
                "This action changes stored data and "
                "must be approved by the user."
            ),
            risk=AgentToolRisk.REQUIRES_APPROVAL,
            parameters={
                "type": "object",
                "properties": {
                    "machine_id": {
                        "type": "string",
                        "format": "uuid",
                    },
                    "title": {
                        "type": "string",
                        "minLength": 2,
                        "maxLength": 200,
                    },
                    "description": {
                        "type": ["string", "null"],
                    },
                    "priority": {
                        "type": "string",
                        "enum": [
                            "Low",
                            "Medium",
                            "High",
                            "Critical",
                        ],
                    },
                    "risk_score": {
                        "type": ["number", "null"],
                        "minimum": 0,
                        "maximum": 100,
                    },
                    "recommended_action": {
                        "type": ["string", "null"],
                    },
                    "assigned_to": {
                        "type": ["string", "null"],
                    },
                    "scheduled_for": {
                        "type": ["string", "null"],
                        "format": "date-time",
                    },
                },
                "required": [
                    "machine_id",
                    "title",
                    "priority",
                ],
                "additionalProperties": False,
            },
        )
    ),
    AgentToolName.SEARCH_DOCUMENTS: (
        AgentToolDefinition(
            name=AgentToolName.SEARCH_DOCUMENTS,
            description=(
                "Search processed RAG documents and "
                "return relevant source chunks."
            ),
            risk=AgentToolRisk.READ_ONLY,
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "minLength": 2,
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "default": 5,
                    },
                    "document_id": {
                        "type": ["string", "null"],
                        "format": "uuid",
                    },
                },
                "required": ["query"],
                "additionalProperties": False,
            },
        )
    ),
    AgentToolName.ANSWER_DOCUMENT_QUESTION: (
        AgentToolDefinition(
            name=(
                AgentToolName
                .ANSWER_DOCUMENT_QUESTION
            ),
            description=(
                "Answer a question using uploaded "
                "documents and return cited sources."
            ),
            risk=AgentToolRisk.READ_ONLY,
            parameters={
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "minLength": 2,
                    },
                    "top_k": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "default": 5,
                    },
                    "document_id": {
                        "type": ["string", "null"],
                        "format": "uuid",
                    },
                },
                "required": ["question"],
                "additionalProperties": False,
            },
        )
    ),
}


def get_tool_definition(
    tool_name: AgentToolName,
) -> AgentToolDefinition:
    return TOOL_REGISTRY[tool_name]


def get_available_tools() -> list[
    AgentToolDefinition
]:
    return list(TOOL_REGISTRY.values())


def tool_requires_approval(
    tool_name: AgentToolName,
) -> bool:
    definition = get_tool_definition(tool_name)

    return (
        definition.risk
        == AgentToolRisk.REQUIRES_APPROVAL
    )
