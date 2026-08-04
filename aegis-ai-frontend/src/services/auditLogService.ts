import axios from "axios";

import { httpClient } from "../api/httpClient";

export interface AuditLogRecord {
  id: string;
  action: string;

  actor_user_id: string | null;
  actor_name: string;

  target_user_id: string | null;
  target_name: string;

  details: string;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLogRecord[];
  total: number;
  offset: number;
  limit: number;
}

interface BackendErrorResponse {
  detail?:
    | string
    | Array<{
        msg?: string;
      }>;
}

export async function getAuditLogs(): Promise<AuditLogListResponse> {
  const response = await httpClient.get<AuditLogListResponse>("/audit-logs", {
    params: {
      offset: 0,
      limit: 100,
    },
  });

  return response.data;
}

export function getAuditLogApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    if (!error.response) {
      return (
        "Unable to connect to the AEGIS AI backend. " +
        "Confirm that FastAPI is running."
      );
    }

    const detail = error.response.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0]?.msg ?? "The audit-log request is invalid.";
    }

    if (error.response.status === 401) {
      return "Your authentication session is invalid " + "or has expired.";
    }

    if (error.response.status === 403) {
      return "Administrator access is required " + "to view audit logs.";
    }

    return "The audit-log request failed. " + "Please try again.";
  }

  return "An unexpected audit-log error occurred.";
}
