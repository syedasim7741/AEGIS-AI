import axios from "axios";

import { httpClient } from "../api/httpClient";


export type AgentToolName =
  | "get_machine_summary"
  | "list_machines"
  | "get_robot_summary"
  | "list_robots"
  | "get_predictive_maintenance"
  | "list_work_orders"
  | "create_work_order"
  | "search_documents"
  | "answer_document_question";


export type AgentToolRisk =
  | "read_only"
  | "requires_approval";


export interface AgentToolCall {
  tool: AgentToolName;
  arguments: Record<string, unknown>;
  reason: string;
}


export interface AgentToolResult {
  tool: AgentToolName;
  success: boolean;
  data: unknown;
  error: string | null;
  execution_time_ms: number;
}


export interface AgentPlan {
  goal: string;
  tool_calls: AgentToolCall[];
  final_response_instruction: string;
}


export interface AgentTraceStep {
  sequence: number;
  tool_call: AgentToolCall;
  tool_result: AgentToolResult;
}


export interface AgentRunResult {
  goal: string;
  answer: string;
  trace: AgentTraceStep[];
  requires_approval: boolean;
  approval_message: string | null;
}


export interface AgentExecutionResponse {
  plan: AgentPlan;
  result: AgentRunResult;
}


export interface AgentToolSummary {
  name: AgentToolName;
  description: string;
  risk: AgentToolRisk;
}


export interface AgentToolListResponse {
  tools: AgentToolSummary[];
  total: number;
}


interface BackendErrorResponse {
  detail?:
    | string
    | Array<{
        msg?: string;
      }>;
}


export async function listAgentTools(): Promise<
  AgentToolListResponse
> {
  const response =
    await httpClient.get<AgentToolListResponse>(
      "/agent/tools",
    );

  return response.data;
}


export async function runAgentGoal(
  goal: string,
): Promise<AgentExecutionResponse> {
  const response =
    await httpClient.post<AgentExecutionResponse>(
      "/agent/run",
      {
        goal,
      },
      {
        timeout: 300000,
      },
    );

  return response.data;
}


export async function approveAgentPlan(
  plan: AgentPlan,
): Promise<AgentExecutionResponse> {
  const response =
    await httpClient.post<AgentExecutionResponse>(
      "/agent/approve",
      {
        plan,
        approved: true,
      },
      {
        timeout: 300000,
      },
    );

  return response.data;
}


export function getAgentErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    if (!error.response) {
      return (
        "Unable to connect to AEGIS AI. " +
        "Confirm that FastAPI and Ollama are running."
      );
    }

    const detail = error.response.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return (
        detail[0]?.msg ??
        "The Agentic AI request was invalid."
      );
    }

    if (error.response.status === 401) {
      return "Your session has expired. Sign in again.";
    }

    if (error.response.status === 403) {
      return (
        "Administrator permission is required " +
        "to approve this action."
      );
    }

    if (error.response.status === 502) {
      return (
        "The local AI model could not complete " +
        "the request. Confirm that Ollama is running."
      );
    }

    return "The Agentic AI request failed.";
  }

  return "An unexpected Agentic AI error occurred.";
}
