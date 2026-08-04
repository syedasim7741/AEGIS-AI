import { httpClient } from "../api/httpClient";

export type MachineType =
  | "CNC"
  | "Conveyor"
  | "Compressor"
  | "Pump"
  | "Turbine"
  | "Generator"
  | "Packaging"
  | "Other";

export type MachineStatus =
  | "Operational"
  | "Warning"
  | "Critical"
  | "Offline"
  | "Maintenance";

export interface Machine {
  id: string;
  name: string;
  asset_code: string;
  machine_type: MachineType;
  status: MachineStatus;
  facility: string;
  production_line: string | null;
  manufacturer: string | null;
  model_number: string | null;
  health_score: number;
  temperature_celsius: number | null;
  vibration_mm_s: number | null;
  power_consumption_kw: number | null;
  last_maintenance_at: string | null;
  next_maintenance_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MachineSummary {
  total: number;
  operational: number;
  warning: number;
  critical: number;
  offline: number;
  maintenance: number;
  average_health_score: number;
}

export interface MachineListParameters {
  skip?: number;
  limit?: number;
  search?: string;
  facility?: string;
  status?: MachineStatus;
  machine_type?: MachineType;
}

export interface MachineListResult {
  machines: Machine[];
  total: number;
}

export interface MachineTelemetryPayload {
  status?: MachineStatus;
  health_score?: number;
  temperature_celsius?: number | null;
  vibration_mm_s?: number | null;
  power_consumption_kw?: number | null;
}

export interface MachineTelemetryCreatePayload {
  status: MachineStatus;
  health_score: number;
  temperature_celsius?: number | null;
  vibration_mm_s?: number | null;
  power_consumption_kw?: number | null;
  source?: string;
}

export interface MachineTelemetryReading {
  id: string;
  machine_id: string;
  status: MachineStatus;
  health_score: number;
  temperature_celsius: number | null;
  vibration_mm_s: number | null;
  power_consumption_kw: number | null;
  source: string;
  recorded_at: string;
}

export interface MachineTelemetryHistoryParameters {
  skip?: number;
  limit?: number;
}

export interface MachineTelemetryHistoryResult {
  readings: MachineTelemetryReading[];
  total: number;
}

export async function getMachines(
  parameters: MachineListParameters = {},
): Promise<MachineListResult> {
  const response = await httpClient.get<Machine[]>("/machines", {
    params: parameters,
  });

  const totalHeader = response.headers["x-total-count"];

  const parsedTotal = Number(totalHeader);

  return {
    machines: response.data,

    total: Number.isFinite(parsedTotal) ? parsedTotal : response.data.length,
  };
}

export async function getMachineSummary(): Promise<MachineSummary> {
  const response = await httpClient.get<MachineSummary>("/machines/summary");

  return response.data;
}

export async function getMachineById(machineId: string): Promise<Machine> {
  const response = await httpClient.get<Machine>(`/machines/${machineId}`);

  return response.data;
}

export async function updateMachineTelemetry(
  machineId: string,
  payload: MachineTelemetryPayload,
): Promise<Machine> {
  const response = await httpClient.patch<Machine>(
    `/machines/${machineId}/telemetry`,
    payload,
  );

  return response.data;
}

export async function recordMachineTelemetry(
  machineId: string,
  payload: MachineTelemetryCreatePayload,
): Promise<MachineTelemetryReading> {
  const response = await httpClient.post<MachineTelemetryReading>(
    `/machines/${machineId}/telemetry/readings`,
    payload,
  );

  return response.data;
}

export async function getMachineTelemetryHistory(
  machineId: string,
  parameters: MachineTelemetryHistoryParameters = {},
): Promise<MachineTelemetryHistoryResult> {
  const response = await httpClient.get<MachineTelemetryHistoryResult>(
    `/machines/${machineId}/telemetry/history`,
    {
      params: parameters,
    },
  );

  return response.data;
}

export async function getLatestMachineTelemetry(
  machineId: string,
): Promise<MachineTelemetryReading> {
  const response = await httpClient.get<MachineTelemetryReading>(
    `/machines/${machineId}/telemetry/latest`,
  );

  return response.data;
}
