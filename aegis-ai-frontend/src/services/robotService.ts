import { httpClient } from "../api/httpClient";

export type RobotType =
  | "Articulated"
  | "Collaborative Robot"
  | "SCARA"
  | "Delta"
  | "Autonomous Mobile Robot"
  | "Welding Robot"
  | "Palletizing Robot"
  | "Inspection Robot"
  | "Other";

export type RobotStatus =
  | "Active"
  | "Idle"
  | "Warning"
  | "Error"
  | "Offline"
  | "Maintenance";

export interface Robot {
  id: string;
  name: string;
  robot_code: string;
  robot_type: RobotType;
  status: RobotStatus;
  facility: string;
  production_line: string | null;
  manufacturer: string | null;
  model_number: string | null;
  current_task: string | null;
  health_score: number;
  utilization_percent: number;
  battery_level_percent: number | null;
  payload_kg: number | null;
  temperature_celsius: number | null;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
  error_code: string | null;
  last_maintenance_at: string | null;
  next_maintenance_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RobotSummary {
  total: number;
  active: number;
  idle: number;
  warning: number;
  error: number;
  offline: number;
  maintenance: number;
  average_health_score: number;
  average_utilization_percent: number;
}

export interface RobotListParameters {
  skip?: number;
  limit?: number;
  search?: string;
  facility?: string;
  status?: RobotStatus;
  robot_type?: RobotType;
}

export interface RobotListResult {
  robots: Robot[];
  total: number;
}

export interface RobotTelemetryPayload {
  status?: RobotStatus;
  current_task?: string | null;
  health_score?: number;
  utilization_percent?: number;
  battery_level_percent?: number | null;
  payload_kg?: number | null;
  temperature_celsius?: number | null;
  position_x?: number | null;
  position_y?: number | null;
  position_z?: number | null;
  error_code?: string | null;
}

export interface RobotTelemetryCreatePayload {
  status: RobotStatus;
  current_task?: string | null;
  health_score: number;
  utilization_percent: number;
  battery_level_percent?: number | null;
  payload_kg?: number | null;
  temperature_celsius?: number | null;
  position_x?: number | null;
  position_y?: number | null;
  position_z?: number | null;
  error_code?: string | null;
  source?: string;
}

export interface RobotTelemetryReading {
  id: string;
  robot_id: string;
  status: RobotStatus;
  current_task: string | null;
  health_score: number;
  utilization_percent: number;
  battery_level_percent: number | null;
  payload_kg: number | null;
  temperature_celsius: number | null;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
  error_code: string | null;
  source: string;
  recorded_at: string;
}

export interface RobotTelemetryHistoryParameters {
  skip?: number;
  limit?: number;
}

export interface RobotTelemetryHistoryResult {
  readings: RobotTelemetryReading[];
  total: number;
}

export async function getRobots(
  parameters: RobotListParameters = {},
): Promise<RobotListResult> {
  const response = await httpClient.get<Robot[]>("/robots", {
    params: parameters,
  });

  const totalHeader = response.headers["x-total-count"];

  const parsedTotal = Number(totalHeader);

  return {
    robots: response.data,

    total: Number.isFinite(parsedTotal) ? parsedTotal : response.data.length,
  };
}

export async function getRobotSummary(): Promise<RobotSummary> {
  const response = await httpClient.get<RobotSummary>("/robots/summary");

  return response.data;
}

export async function getRobotById(robotId: string): Promise<Robot> {
  const response = await httpClient.get<Robot>(`/robots/${robotId}`);

  return response.data;
}

export async function updateRobotTelemetry(
  robotId: string,
  payload: RobotTelemetryPayload,
): Promise<Robot> {
  const response = await httpClient.patch<Robot>(
    `/robots/${robotId}/telemetry`,
    payload,
  );

  return response.data;
}

export async function recordRobotTelemetry(
  robotId: string,
  payload: RobotTelemetryCreatePayload,
): Promise<RobotTelemetryReading> {
  const response = await httpClient.post<RobotTelemetryReading>(
    `/robots/${robotId}/telemetry/readings`,
    payload,
  );

  return response.data;
}

export async function getRobotTelemetryHistory(
  robotId: string,
  parameters: RobotTelemetryHistoryParameters = {},
): Promise<RobotTelemetryHistoryResult> {
  const response = await httpClient.get<RobotTelemetryHistoryResult>(
    `/robots/${robotId}/telemetry/history`,
    {
      params: parameters,
    },
  );

  return response.data;
}

export async function getLatestRobotTelemetry(
  robotId: string,
): Promise<RobotTelemetryReading> {
  const response = await httpClient.get<RobotTelemetryReading>(
    `/robots/${robotId}/telemetry/latest`,
  );

  return response.data;
}
