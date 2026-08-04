import { httpClient } from "../api/httpClient";

export type PredictiveRiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface PredictiveMaintenanceAssessment {
  machine_id: string;
  machine_name: string;
  asset_code: string;
  facility: string;
  production_line: string | null;

  risk_score: number;
  risk_level: PredictiveRiskLevel;

  current_status: string;
  health_score: number;

  temperature_celsius: number | null;
  vibration_mm_s: number | null;
  power_consumption_kw: number | null;

  health_trend_percent: number;
  temperature_trend_celsius: number;
  vibration_trend_mm_s: number;

  anomaly_count: number;
  telemetry_reading_count: number;

  risk_factors: string[];
  recommended_action: string;

  assessed_at: string;
}

export interface PredictiveMaintenanceListResponse {
  assessments: PredictiveMaintenanceAssessment[];
  total: number;
}

export interface PredictiveMaintenanceSummary {
  total_machines: number;

  low_risk: number;
  medium_risk: number;
  high_risk: number;
  critical_risk: number;

  machines_requiring_attention: number;

  average_risk_score: number;

  generated_at: string;
}

export interface PredictiveMaintenanceParameters {
  facility?: string;
  risk_level?: PredictiveRiskLevel;
}

export async function getPredictiveMaintenanceAssessments(
  parameters: PredictiveMaintenanceParameters = {},
): Promise<PredictiveMaintenanceListResponse> {
  const response = await httpClient.get<PredictiveMaintenanceListResponse>(
    "/predictive-maintenance/assessments",
    {
      params: parameters,
    },
  );

  return response.data;
}

export async function getPredictiveMaintenanceSummary(): Promise<PredictiveMaintenanceSummary> {
  const response = await httpClient.get<PredictiveMaintenanceSummary>(
    "/predictive-maintenance/summary",
  );

  return response.data;
}
