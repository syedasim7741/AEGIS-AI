import axios from "axios";

import { httpClient } from "../api/httpClient";

import type { UserRole } from "../store/slices/authSlice";

export type BackendUserStatus = "Active" | "Suspended" | "Invited";

export interface PlatformUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  status: BackendUserStatus;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserListResponse {
  items: PlatformUser[];
  total: number;
  offset: number;
  limit: number;
}

export interface CreatePlatformUserPayload {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  status: BackendUserStatus;
}

export interface UpdatePlatformUserPayload {
  full_name?: string;
  email?: string;
  role?: UserRole;
  department?: string;
}

interface BackendErrorResponse {
  detail?:
    | string
    | Array<{
        msg?: string;
      }>;
}

export async function getPlatformUsers(): Promise<UserListResponse> {
  const response = await httpClient.get<UserListResponse>("/users", {
    params: {
      offset: 0,
      limit: 100,
    },
  });

  return response.data;
}

export async function createPlatformUser(
  payload: CreatePlatformUserPayload,
): Promise<PlatformUser> {
  const response = await httpClient.post<PlatformUser>("/users", payload);

  return response.data;
}

export async function updatePlatformUser(
  userId: string,
  payload: UpdatePlatformUserPayload,
): Promise<PlatformUser> {
  const response = await httpClient.patch<PlatformUser>(
    `/users/${userId}`,
    payload,
  );

  return response.data;
}

export async function updatePlatformUserStatus(
  userId: string,
  newStatus: BackendUserStatus,
): Promise<PlatformUser> {
  const response = await httpClient.patch<PlatformUser>(
    `/users/${userId}/status`,
    {
      status: newStatus,
    },
  );

  return response.data;
}

export function getUserApiErrorMessage(error: unknown): string {
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
      return detail[0]?.msg ?? "The submitted user information is invalid.";
    }

    if (error.response.status === 401) {
      return "Your authentication session is invalid " + "or has expired.";
    }

    if (error.response.status === 403) {
      return "Administrator access is required " + "to perform this action.";
    }

    if (error.response.status === 409) {
      return "A user with this email address " + "already exists.";
    }

    return "The user-management request failed. " + "Please try again.";
  }

  return "An unexpected user-management error occurred.";
}
