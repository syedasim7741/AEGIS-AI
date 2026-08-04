import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AlertSeverity = "Critical" | "High" | "Medium" | "Low";

export type AlertStatus = "Open" | "Investigating" | "Resolved";

export interface IndustrialAlert {
  id: string;
  title: string;
  description: string;
  module: string;
  location: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;
  isRead: boolean;
}

interface AlertsState {
  alerts: IndustrialAlert[];
}

const initialState: AlertsState = {
  alerts: [
    {
      id: "ALT-2026-001",
      title: "Critical spindle condition",
      description:
        "CNC Spindle S2 health has fallen below the approved operating threshold.",
      module: "Predictive Maintenance",
      location: "Machining Zone",
      timestamp: "5 minutes ago",
      severity: "Critical",
      status: "Open",
      isRead: false,
    },
    {
      id: "ALT-2026-002",
      title: "Restricted zone entry",
      description:
        "Computer vision detected unauthorized access inside Robotics Cell B.",
      module: "Worker Safety",
      location: "Robotics Cell B",
      timestamp: "18 minutes ago",
      severity: "High",
      status: "Investigating",
      isRead: false,
    },
    {
      id: "ALT-2026-003",
      title: "Vision processing degraded",
      description:
        "The computer-vision processing service is operating with increased latency.",
      module: "Vision Inspection",
      location: "Cloud AI Service",
      timestamp: "32 minutes ago",
      severity: "Medium",
      status: "Open",
      isRead: false,
    },
    {
      id: "ALT-2026-004",
      title: "Robot workload warning",
      description:
        "Welding Robot W2 has maintained a workload above 90% for an extended period.",
      module: "Robot Monitoring",
      location: "Welding Zone",
      timestamp: "1 hour ago",
      severity: "Medium",
      status: "Open",
      isRead: true,
    },
    {
      id: "ALT-2026-005",
      title: "Maintenance workflow completed",
      description:
        "The daily robot maintenance workflow completed successfully.",
      module: "Workflow Automation",
      location: "Platform Service",
      timestamp: "2 hours ago",
      severity: "Low",
      status: "Resolved",
      isRead: true,
    },
  ],
};

const alertsSlice = createSlice({
  name: "alerts",
  initialState,

  reducers: {
    markAlertAsRead(state, action: PayloadAction<string>) {
      const alert = state.alerts.find((item) => item.id === action.payload);

      if (alert) {
        alert.isRead = true;
      }
    },

    markAllAlertsAsRead(state) {
      state.alerts.forEach((alert) => {
        alert.isRead = true;
      });
    },

    updateAlertStatus(
      state,
      action: PayloadAction<{
        alertId: string;
        status: AlertStatus;
      }>,
    ) {
      const alert = state.alerts.find(
        (item) => item.id === action.payload.alertId,
      );

      if (alert) {
        alert.status = action.payload.status;
        alert.isRead = true;
      }
    },

    addAlert(state, action: PayloadAction<IndustrialAlert>) {
      state.alerts.unshift(action.payload);
    },
  },
});

export const {
  markAlertAsRead,
  markAllAlertsAsRead,
  updateAlertStatus,
  addAlert,
} = alertsSlice.actions;

export default alertsSlice.reducer;
