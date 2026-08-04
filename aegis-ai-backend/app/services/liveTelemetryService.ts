import { getStoredAccessToken } from "../utils/authStorage";

import type { MachineSummary } from "./machineService";

import type { RobotSummary } from "./robotService";

const WEBSOCKET_AUTH_PROTOCOL = "aegis-auth";

export interface TelemetryConnectedMessage {
  event: "telemetry.connected";
  timestamp: string;
  message: string;
}

export interface TelemetrySnapshotMessage {
  event: "telemetry.snapshot";
  timestamp: string;
  machines: MachineSummary;
  robots: RobotSummary;
}

export type LiveTelemetryMessage =
  | TelemetryConnectedMessage
  | TelemetrySnapshotMessage;

function getApiBaseUrl(): string {
  return (
    import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8000/api/v1"
  ).replace(/\/+$/, "");
}

export function getLiveTelemetryUrl(): string {
  const apiBaseUrl = getApiBaseUrl();

  const webSocketBaseUrl = apiBaseUrl
    .replace(/^https:/i, "wss:")
    .replace(/^http:/i, "ws:");

  return `${webSocketBaseUrl}` + "/telemetry/live";
}

export function createLiveTelemetrySocket(): WebSocket {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    throw new Error(
      "An authenticated access token " + "is required for live telemetry.",
    );
  }

  return new WebSocket(getLiveTelemetryUrl(), [
    WEBSOCKET_AUTH_PROTOCOL,
    accessToken,
  ]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTelemetryConnectedMessage(
  value: unknown,
): value is TelemetryConnectedMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.event === "telemetry.connected" &&
    typeof value.timestamp === "string" &&
    typeof value.message === "string"
  );
}

function isTelemetrySnapshotMessage(
  value: unknown,
): value is TelemetrySnapshotMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.event === "telemetry.snapshot" &&
    typeof value.timestamp === "string" &&
    isRecord(value.machines) &&
    isRecord(value.robots)
  );
}

export function parseLiveTelemetryMessage(
  messageData: unknown,
): LiveTelemetryMessage | null {
  if (typeof messageData !== "string") {
    return null;
  }

  try {
    const parsedMessage: unknown = JSON.parse(messageData);

    if (
      isTelemetryConnectedMessage(parsedMessage) ||
      isTelemetrySnapshotMessage(parsedMessage)
    ) {
      return parsedMessage;
    }

    return null;
  } catch {
    return null;
  }
}
