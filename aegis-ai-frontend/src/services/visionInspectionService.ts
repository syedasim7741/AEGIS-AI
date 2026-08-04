import axios from "axios";

import { httpClient } from "../api/httpClient";


export type VisionInspectionStatus =
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed";

export type VisionInspectionResult =
  | "Pass"
  | "Defect"
  | "Review";

export type VisionInspectionSeverity =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";


export interface VisionInspection {
  id: string;
  inspection_code: string;

  uploaded_by_user_id: string | null;
  machine_id: string | null;

  product_name: string;
  camera: string | null;
  zone: string | null;

  original_filename: string;
  content_type: string;
  file_size_bytes: number;

  image_width: number;
  image_height: number;

  model_provider: string;
  model_name: string;

  status: VisionInspectionStatus;
  result: VisionInspectionResult | null;
  severity: VisionInspectionSeverity | null;

  confidence: number | null;
  finding: string | null;
  defect_type: string | null;
  recommended_action: string | null;

  analysis_duration_ms: number | null;
  error_message: string | null;

  completed_at: string | null;
  created_at: string;
  updated_at: string;
}


export interface VisionInspectionListResponse {
  inspections: VisionInspection[];
  total: number;
}


export interface VisionInspectionListParameters {
  skip?: number;
  limit?: number;
  search?: string;
  status?: VisionInspectionStatus;
  result?: VisionInspectionResult;
  severity?: VisionInspectionSeverity;
  machine_id?: string;
}


export interface CreateVisionInspectionPayload {
  file: File;
  productName: string;
  machineId?: string | null;
  camera?: string | null;
  zone?: string | null;
  inspectionContext?: string | null;
}


interface BackendErrorResponse {
  detail?:
    | string
    | Array<{
        msg?: string;
      }>;
}


function appendOptionalField(
  formData: FormData,
  fieldName: string,
  value: string | null | undefined,
): void {
  const normalizedValue = value?.trim();

  if (normalizedValue) {
    formData.append(
      fieldName,
      normalizedValue,
    );
  }
}


export async function listVisionInspections(
  parameters: VisionInspectionListParameters = {},
): Promise<VisionInspectionListResponse> {
  const response =
    await httpClient.get<VisionInspectionListResponse>(
      "/vision/inspections",
      {
        params: parameters,
      },
    );

  return response.data;
}


export async function createVisionInspection(
  payload: CreateVisionInspectionPayload,
): Promise<VisionInspection> {
  const formData = new FormData();

  formData.append(
    "file",
    payload.file,
  );

  formData.append(
    "product_name",
    payload.productName.trim(),
  );

  appendOptionalField(
    formData,
    "machine_id",
    payload.machineId,
  );

  appendOptionalField(
    formData,
    "camera",
    payload.camera,
  );

  appendOptionalField(
    formData,
    "zone",
    payload.zone,
  );

  appendOptionalField(
    formData,
    "inspection_context",
    payload.inspectionContext,
  );

  const response =
    await httpClient.post<VisionInspection>(
      "/vision/inspections",
      formData,
      {
        timeout: 300000,
      },
    );

  return response.data;
}


export async function getVisionInspection(
  inspectionId: string,
): Promise<VisionInspection> {
  const response =
    await httpClient.get<VisionInspection>(
      `/vision/inspections/${inspectionId}`,
    );

  return response.data;
}


export async function getVisionInspectionImage(
  inspectionId: string,
): Promise<Blob> {
  const response = await httpClient.get<Blob>(
    `/vision/inspections/${inspectionId}/image`,
    {
      responseType: "blob",
      timeout: 120000,
    },
  );

  return response.data;
}


export async function deleteVisionInspection(
  inspectionId: string,
): Promise<void> {
  await httpClient.delete(
    `/vision/inspections/${inspectionId}`,
  );
}


export function getVisionErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    if (!error.response) {
      return (
        "Unable to connect to the AEGIS AI backend. " +
        "Confirm that FastAPI and Ollama are running."
      );
    }

    const detail = error.response.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (
      Array.isArray(detail) &&
      detail.length > 0
    ) {
      return (
        detail[0]?.msg ??
        "The vision inspection request was invalid."
      );
    }

    if (error.response.status === 401) {
      return (
        "Your session has expired. " +
        "Sign in again."
      );
    }

    if (error.response.status === 404) {
      return (
        "The requested inspection or machine " +
        "was not found."
      );
    }

    if (error.response.status === 422) {
      return (
        "Select a valid JPEG, PNG, or WebP image."
      );
    }

    if (error.response.status === 502) {
      return (
        "The local vision model could not " +
        "complete the inspection."
      );
    }

    return "The vision inspection request failed.";
  }

  return "An unexpected vision inspection error occurred.";
}
