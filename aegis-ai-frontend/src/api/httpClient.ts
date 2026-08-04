import axios, { type InternalAxiosRequestConfig } from "axios";

import { getStoredAccessToken } from "../utils/authStorage";

import { notifySessionExpired } from "../utils/sessionEvents";

import { accessTokenRefreshed } from "../store/slices/authSlice";

import { store } from "../store/store";

interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8000/api/v1";

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true,

  headers: {
    Accept: "application/json",
  },
});

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true,

  headers: {
    Accept: "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;

async function requestNewAccessToken(): Promise<string> {
  const response = await refreshClient.post<TokenResponse>("/auth/refresh");

  store.dispatch(
    accessTokenRefreshed({
      accessToken: response.data.access_token,

      expiresIn: response.data.expires_in,
    }),
  );

  return response.data.access_token;
}

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

httpClient.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,

  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const responseStatus = error.response?.status;

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (responseStatus !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";

    const isAuthenticationRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout");

    if (isAuthenticationRequest) {
      return Promise.reject(error);
    }

    const authState = store.getState().auth;

    if (!authState.isAuthenticated || !authState.user) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      notifySessionExpired({
        reason: "unauthorized",

        message: "Your session is no longer valid. Please sign in again.",
      });

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);

      return httpClient(originalRequest);
    } catch (refreshError) {
      notifySessionExpired({
        reason: "token-expired",

        message: "Your session has expired. Please sign in again.",
      });

      return Promise.reject(refreshError);
    }
  },
);
