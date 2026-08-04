import { AddTaskRounded, CheckCircleRounded } from "@mui/icons-material";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMaintenanceWorkOrder,
  getMaintenanceWorkOrders,
  type MaintenancePriority,
} from "../../services/maintenanceWorkOrderService";

import type {
  PredictiveMaintenanceAssessment,
  PredictiveRiskLevel,
} from "../../services/predictiveMaintenanceService";

interface CreateWorkOrderButtonProps {
  assessment: PredictiveMaintenanceAssessment;
}

function convertRiskToPriority(
  riskLevel: PredictiveRiskLevel,
): MaintenancePriority {
  switch (riskLevel) {
    case "Critical":
      return "Critical";

    case "High":
      return "High";

    case "Medium":
      return "Medium";

    case "Low":
      return "Low";

    default:
      return "Medium";
  }
}

function buildDescription(assessment: PredictiveMaintenanceAssessment): string {
  const riskFactors =
    assessment.risk_factors.length > 0
      ? assessment.risk_factors
          .map((riskFactor) => `- ${riskFactor}`)
          .join("\n")
      : "- No significant risk factors detected.";

  return [
    `Automatically created from the predictive-maintenance assessment for ${assessment.machine_name}.`,
    "",
    `Asset code: ${assessment.asset_code}`,
    `Facility: ${assessment.facility}`,
    `Production line: ${assessment.production_line ?? "Not assigned"}`,
    `Risk level: ${assessment.risk_level}`,
    `Risk score: ${assessment.risk_score.toFixed(1)}%`,
    `Health score: ${assessment.health_score.toFixed(1)}%`,
    `Anomalies detected: ${assessment.anomaly_count}`,
    "",
    "Risk factors:",
    riskFactors,
  ].join("\n");
}

export default function CreateWorkOrderButton({
  assessment,
}: CreateWorkOrderButtonProps) {
  const queryClient = useQueryClient();

  const existingWorkOrdersQuery = useQuery({
    queryKey: ["maintenance-work-orders", "machine", assessment.machine_id],

    queryFn: () =>
      getMaintenanceWorkOrders({
        machine_id: assessment.machine_id,

        limit: 100,
      }),

    staleTime: 10_000,
  });

  const activeWorkOrder = existingWorkOrdersQuery.data?.work_orders.find(
    (workOrder) =>
      workOrder.status !== "Completed" && workOrder.status !== "Cancelled",
  );

  const createMutation = useMutation({
    mutationFn: () =>
      createMaintenanceWorkOrder({
        machine_id: assessment.machine_id,

        title: `Predictive maintenance inspection — ${assessment.machine_name}`,

        description: buildDescription(assessment),

        priority: convertRiskToPriority(assessment.risk_level),

        risk_score: assessment.risk_score,

        recommended_action: assessment.recommended_action,
      }),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["maintenance-work-orders"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["maintenance-work-order-summary"],
        }),
      ]);
    },
  });

  const isCheckingExisting = existingWorkOrdersQuery.isLoading;

  const isDisabled =
    isCheckingExisting ||
    createMutation.isPending ||
    createMutation.isSuccess ||
    Boolean(activeWorkOrder);

  return (
    <Stack spacing={1}>
      <Button
        variant={
          assessment.risk_level === "Critical" ||
          assessment.risk_level === "High"
            ? "contained"
            : "outlined"
        }
        color={
          assessment.risk_level === "Critical"
            ? "error"
            : assessment.risk_level === "High"
              ? "warning"
              : "primary"
        }
        startIcon={
          isCheckingExisting || createMutation.isPending ? (
            <CircularProgress size={18} color="inherit" />
          ) : createMutation.isSuccess ? (
            <CheckCircleRounded />
          ) : (
            <AddTaskRounded />
          )
        }
        disabled={isDisabled}
        onClick={() => createMutation.mutate()}
      >
        {isCheckingExisting
          ? "Checking Work Orders..."
          : activeWorkOrder
            ? "Active Work Order Exists"
            : createMutation.isPending
              ? "Creating Work Order..."
              : createMutation.isSuccess
                ? "Work Order Created"
                : "Create Work Order"}
      </Button>

      {activeWorkOrder && (
        <Alert severity="info">
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
            }}
          >
            {activeWorkOrder.work_order_code}
          </Typography>

          <Typography variant="body2">
            This machine already has an active work order with status{" "}
            {activeWorkOrder.status}.
          </Typography>
        </Alert>
      )}

      {existingWorkOrdersQuery.isError && (
        <Alert severity="error">
          Existing work orders could not be checked.
        </Alert>
      )}

      {createMutation.isError && (
        <Alert severity="error">
          The work order could not be created. Administrator access may be
          required.
        </Alert>
      )}

      {createMutation.isSuccess && (
        <Alert severity="success">
          A maintenance work order was created and saved in PostgreSQL.
        </Alert>
      )}
    </Stack>
  );
}
