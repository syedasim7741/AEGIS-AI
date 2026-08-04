import { httpClient } from "../api/httpClient";

export type MaintenancePriority = "Low" | "Medium" | "High" | "Critical";

export type MaintenanceWorkOrderStatus =
  | "Open"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export interface MaintenanceWorkOrder {
  id: string;
  work_order_code: string;
  machine_id: string;

  title: string;
  description: string | null;

  priority: MaintenancePriority;
  status: MaintenanceWorkOrderStatus;

  risk_score: number | null;
  recommended_action: string | null;

  assigned_to: string | null;
  scheduled_for: string | null;

  started_at: string | null;
  completed_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface MaintenanceWorkOrderDetail extends MaintenanceWorkOrder {
  machine_name: string;
  asset_code: string;
  facility: string;
  production_line: string | null;
}

export interface MaintenanceWorkOrderListResponse {
  work_orders: MaintenanceWorkOrderDetail[];
  total: number;
}

export interface MaintenanceWorkOrderSummary {
  total: number;
  open: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  high_priority: number;
  critical_priority: number;
  overdue: number;
}

export interface MaintenanceWorkOrderCreatePayload {
  machine_id: string;
  title: string;
  description?: string | null;
  priority?: MaintenancePriority;
  risk_score?: number | null;
  recommended_action?: string | null;
  assigned_to?: string | null;
  scheduled_for?: string | null;
}

export interface MaintenanceWorkOrderUpdatePayload {
  title?: string;
  description?: string | null;
  priority?: MaintenancePriority;
  status?: MaintenanceWorkOrderStatus;
  risk_score?: number | null;
  recommended_action?: string | null;
  assigned_to?: string | null;
  scheduled_for?: string | null;
}

export interface MaintenanceWorkOrderStatusPayload {
  status: MaintenanceWorkOrderStatus;
  assigned_to?: string | null;
  scheduled_for?: string | null;
}

export interface MaintenanceWorkOrderParameters {
  skip?: number;
  limit?: number;
  search?: string;
  status?: MaintenanceWorkOrderStatus;
  priority?: MaintenancePriority;
  machine_id?: string;
  facility?: string;
  assigned_to?: string;
}

export async function getMaintenanceWorkOrders(
  parameters: MaintenanceWorkOrderParameters = {},
): Promise<MaintenanceWorkOrderListResponse> {
  const response = await httpClient.get<MaintenanceWorkOrderListResponse>(
    "/maintenance-work-orders",
    {
      params: parameters,
    },
  );

  return response.data;
}

export async function getMaintenanceWorkOrderSummary(): Promise<MaintenanceWorkOrderSummary> {
  const response = await httpClient.get<MaintenanceWorkOrderSummary>(
    "/maintenance-work-orders/summary",
  );

  return response.data;
}

export async function getMaintenanceWorkOrder(
  workOrderId: string,
): Promise<MaintenanceWorkOrderDetail> {
  const response = await httpClient.get<MaintenanceWorkOrderDetail>(
    `/maintenance-work-orders/${workOrderId}`,
  );

  return response.data;
}

export async function createMaintenanceWorkOrder(
  payload: MaintenanceWorkOrderCreatePayload,
): Promise<MaintenanceWorkOrder> {
  const response = await httpClient.post<MaintenanceWorkOrder>(
    "/maintenance-work-orders",
    payload,
  );

  return response.data;
}

export async function updateMaintenanceWorkOrder(
  workOrderId: string,
  payload: MaintenanceWorkOrderUpdatePayload,
): Promise<MaintenanceWorkOrder> {
  const response = await httpClient.patch<MaintenanceWorkOrder>(
    `/maintenance-work-orders/${workOrderId}`,
    payload,
  );

  return response.data;
}

export async function updateMaintenanceWorkOrderStatus(
  workOrderId: string,
  payload: MaintenanceWorkOrderStatusPayload,
): Promise<MaintenanceWorkOrder> {
  const response = await httpClient.patch<MaintenanceWorkOrder>(
    `/maintenance-work-orders/${workOrderId}/status`,
    payload,
  );

  return response.data;
}

export async function deleteMaintenanceWorkOrder(
  workOrderId: string,
): Promise<void> {
  await httpClient.delete(`/maintenance-work-orders/${workOrderId}`);
}
