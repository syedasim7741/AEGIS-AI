import axios from "axios";

import { httpClient } from "../api/httpClient";

import type { AuthUser, UserRole } from "../store/slices/authSlice";

export type ProfileAccountStatus = "Active" | "Suspended" | "Invited";

export interface BackendProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  status: ProfileAccountStatus;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UpdateProfilePayload {
  full_name?: string;
  department?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

interface BackendErrorResponse {
  detail?:
    | string
    | Array<{
        msg?: string;
      }>;
}

export function convertProfileToAuthUser(profile: BackendProfile): AuthUser {
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    department: profile.department,
  };
}

export async function getCurrentProfile(): Promise<BackendProfile> {
  const response = await httpClient.get<BackendProfile>("/profile");

  return response.data;
}

export async function updateCurrentProfile(
  payload: UpdateProfilePayload,
): Promise<BackendProfile> {
  const response = await httpClient.patch<BackendProfile>("/profile", payload);

  return response.data;
}

export async function changeCurrentPassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> {
  const response = await httpClient.post<ChangePasswordResponse>(
    "/profile/change-password",
    payload,
  );

  return response.data;
}

export function getProfileApiErrorMessage(error: unknown): string {
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
      return detail[0]?.msg ?? "The submitted profile information is invalid.";
    }

    if (error.response.status === 400) {
      return "The submitted profile or password " + "information is incorrect.";
    }

    if (error.response.status === 401) {
      return (
        "Your authentication session has expired. " + "Please sign in again."
      );
    }

    if (error.response.status === 403) {
      return "Your account is not permitted to perform " + "this action.";
    }

    if (error.response.status === 422) {
      return (
        "Please check all fields and make sure " +
        "the password meets the security requirements."
      );
    }

    return "The profile request failed. " + "Please try again.";
  }

  return "An unexpected profile error occurred.";
}
