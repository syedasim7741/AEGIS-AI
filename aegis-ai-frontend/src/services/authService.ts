import axios from "axios";

import { httpClient } from "../api/httpClient";

import type { AuthUser, UserRole } from "../store/slices/authSlice";

interface BackendTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

interface BackendUserResponse {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  status: "Active" | "Suspended" | "Invited";
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

interface BackendErrorResponse {
  detail?:
    | string
    | Array<{
        msg?: string;
      }>;
}

export interface BackendLoginResult {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export async function loginWithBackend(
  email: string,
  password: string,
): Promise<BackendLoginResult> {
  const requestBody = new URLSearchParams();

  requestBody.set("grant_type", "password");

  requestBody.set("username", email.trim().toLowerCase());

  requestBody.set("password", password);

  requestBody.set("scope", "");
  requestBody.set("client_id", "");
  requestBody.set("client_secret", "");

  const tokenResponse = await httpClient.post<BackendTokenResponse>(
    "/auth/login",
    requestBody,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const accessToken = tokenResponse.data.access_token;

  const userResponse = await httpClient.get<BackendUserResponse>("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const authenticatedUser: AuthUser = {
    id: userResponse.data.id,
    name: userResponse.data.full_name,
    email: userResponse.data.email,
    role: userResponse.data.role,
    department: userResponse.data.department,
  };

  return {
    user: authenticatedUser,
    accessToken,
    expiresIn: tokenResponse.data.expires_in,
  };
}

export function getAuthenticationErrorMessage(error: unknown): string {
  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    if (!error.response) {
      return (
        "Unable to connect to the AEGIS AI " +
        "backend. Confirm that FastAPI is running."
      );
    }

    const detail = error.response.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0]?.msg ?? "The login information is invalid.";
    }

    if (error.response.status === 401) {
      return "The email address or password " + "is incorrect.";
    }

    if (error.response.status === 403) {
      return "This account is not permitted " + "to access the platform.";
    }

    return "The authentication request failed. " + "Please try again.";
  }

  return "An unexpected authentication error occurred.";
}
