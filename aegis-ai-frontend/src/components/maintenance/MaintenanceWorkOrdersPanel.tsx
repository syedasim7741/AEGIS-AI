import {
  AssignmentRounded,
  BuildCircleRounded,
  CancelRounded,
  CheckCircleRounded,
  ErrorRounded,
  PlayArrowRounded,
  RefreshRounded,
  ScheduleRounded,
  SearchRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";

import {
  getMaintenanceWorkOrders,
  getMaintenanceWorkOrderSummary,
  updateMaintenanceWorkOrderStatus,
  type MaintenancePriority,
  type MaintenanceWorkOrderDetail,
  type MaintenanceWorkOrderStatus,
} from "../../services/maintenanceWorkOrderService";

type PriorityFilter = MaintenancePriority | "All";

type StatusFilter = MaintenanceWorkOrderStatus | "All";

interface StatusMutationVariables {
  workOrderId: string;
  status: MaintenanceWorkOrderStatus;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not scheduled";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return parsedDate.toLocaleString();
}

function getPriorityChipColor(
  priority: MaintenancePriority,
): "default" | "success" | "warning" | "error" | "info" {
  switch (priority) {
    case "Critical":
      return "error";

    case "High":
      return "warning";

    case "Medium":
      return "info";

    case "Low":
      return "success";

    default:
      return "default";
  }
}

function getStatusChipColor(
  status: MaintenanceWorkOrderStatus,
): "default" | "success" | "warning" | "error" | "info" | "primary" {
  switch (status) {
    case "Completed":
      return "success";

    case "In Progress":
      return "primary";

    case "Scheduled":
      return "info";

    case "Cancelled":
      return "default";

    case "Open":
      return "warning";

    default:
      return "default";
  }
}

function isWorkOrderOverdue(workOrder: MaintenanceWorkOrderDetail): boolean {
  if (!workOrder.scheduled_for) {
    return false;
  }

  if (workOrder.status === "Completed" || workOrder.status === "Cancelled") {
    return false;
  }

  return new Date(workOrder.scheduled_for).getTime() < Date.now();
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: ReactNode;
}

function SummaryCard({ title, value, icon }: SummaryCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                mt: 0.5,
                fontWeight: 700,
              }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "action.hover",
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface WorkOrderCardProps {
  workOrder: MaintenanceWorkOrderDetail;

  isUpdating: boolean;

  onStatusChange: (
    workOrderId: string,
    status: MaintenanceWorkOrderStatus,
  ) => void;
}

function WorkOrderCard({
  workOrder,
  isUpdating,
  onStatusChange,
}: WorkOrderCardProps) {
  const overdue = isWorkOrderOverdue(workOrder);

  const canStart =
    workOrder.status === "Open" || workOrder.status === "Scheduled";

  const canComplete = workOrder.status === "In Progress";

  const canCancel =
    workOrder.status !== "Completed" && workOrder.status !== "Cancelled";

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
            sx={{
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
                {workOrder.work_order_code}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                {workOrder.title}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{
                flexWrap: "wrap",
              }}
            >
              <Chip
                size="small"
                label={workOrder.priority}
                color={getPriorityChipColor(workOrder.priority)}
              />

              <Chip
                size="small"
                label={workOrder.status}
                color={getStatusChipColor(workOrder.status)}
              />

              {overdue && (
                <Chip
                  size="small"
                  label="Overdue"
                  color="error"
                  icon={<WarningAmberRounded />}
                />
              )}
            </Stack>
          </Stack>

          <Divider />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Machine
              </Typography>

              <Typography
                sx={{
                  fontWeight: 600,
                }}
              >
                {workOrder.machine_name}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {workOrder.asset_code}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Facility
              </Typography>

              <Typography
                sx={{
                  fontWeight: 600,
                }}
              >
                {workOrder.facility}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {workOrder.production_line ?? "No production line"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Assigned team
              </Typography>

              <Typography
                sx={{
                  fontWeight: 600,
                }}
              >
                {workOrder.assigned_to ?? "Not assigned"}
              </Typography>
            </Box>
          </Box>

          {workOrder.description && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Description
              </Typography>

              <Typography variant="body2">{workOrder.description}</Typography>
            </Box>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
              },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Scheduled for
              </Typography>

              <Typography variant="body2">
                {formatDateTime(workOrder.scheduled_for)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Predictive risk score
              </Typography>

              <Typography variant="body2">
                {workOrder.risk_score !== null
                  ? `${workOrder.risk_score.toFixed(1)}%`
                  : "Not available"}
              </Typography>
            </Box>
          </Box>

          {workOrder.recommended_action && (
            <Alert
              severity={
                workOrder.priority === "Critical" ||
                workOrder.priority === "High"
                  ? "warning"
                  : "info"
              }
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                Recommended action
              </Typography>

              <Typography variant="body2">
                {workOrder.recommended_action}
              </Typography>
            </Alert>
          )}

          <Divider />

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              flexWrap: "wrap",
            }}
          >
            {canStart && (
              <Button
                size="small"
                variant="contained"
                startIcon={<PlayArrowRounded />}
                disabled={isUpdating}
                onClick={() => onStatusChange(workOrder.id, "In Progress")}
              >
                Start Work
              </Button>
            )}

            {canComplete && (
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckCircleRounded />}
                disabled={isUpdating}
                onClick={() => onStatusChange(workOrder.id, "Completed")}
              >
                Mark Completed
              </Button>
            )}

            {canCancel && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelRounded />}
                disabled={isUpdating}
                onClick={() => onStatusChange(workOrder.id, "Cancelled")}
              >
                Cancel
              </Button>
            )}

            {isUpdating && <CircularProgress size={22} />}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function MaintenanceWorkOrdersPanel() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const workOrdersQuery = useQuery({
    queryKey: ["maintenance-work-orders", search, priorityFilter, statusFilter],

    queryFn: () =>
      getMaintenanceWorkOrders({
        limit: 100,

        search: search.trim() || undefined,

        priority: priorityFilter === "All" ? undefined : priorityFilter,

        status: statusFilter === "All" ? undefined : statusFilter,
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ["maintenance-work-order-summary"],

    queryFn: () => getMaintenanceWorkOrderSummary(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ workOrderId, status }: StatusMutationVariables) =>
      updateMaintenanceWorkOrderStatus(workOrderId, {
        status,
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

  const workOrders = useMemo(
    () => workOrdersQuery.data?.work_orders ?? [],
    [workOrdersQuery.data],
  );

  const isLoading = workOrdersQuery.isLoading || summaryQuery.isLoading;

  const hasRequestError = workOrdersQuery.isError || summaryQuery.isError;

  const handleRefresh = async () => {
    await Promise.all([workOrdersQuery.refetch(), summaryQuery.refetch()]);
  };

  const handleStatusChange = (
    workOrderId: string,
    status: MaintenanceWorkOrderStatus,
  ) => {
    statusMutation.mutate({
      workOrderId,
      status,
    });
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        sx={{
          justifyContent: "space-between",

          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
            }}
          >
            Maintenance Work Orders
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Track predictive maintenance actions from detection to completion.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={handleRefresh}
          disabled={workOrdersQuery.isFetching || summaryQuery.isFetching}
        >
          Refresh
        </Button>
      </Stack>

      {hasRequestError && (
        <Alert severity="error">
          Unable to load maintenance work orders. Confirm that the backend is
          running and then refresh the page.
        </Alert>
      )}

      {statusMutation.isError && (
        <Alert severity="error">
          The work-order status could not be changed. Administrator access may
          be required.
        </Alert>
      )}

      {statusMutation.isSuccess && (
        <Alert severity="success">
          Work-order status updated successfully.
        </Alert>
      )}

      {isLoading ? (
        <Box
          sx={{
            minHeight: 220,
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },

              gap: 2,
            }}
          >
            <SummaryCard
              title="Total work orders"
              value={summaryQuery.data?.total ?? 0}
              icon={<AssignmentRounded />}
            />

            <SummaryCard
              title="Open"
              value={summaryQuery.data?.open ?? 0}
              icon={<BuildCircleRounded />}
            />

            <SummaryCard
              title="In progress"
              value={summaryQuery.data?.in_progress ?? 0}
              icon={<ScheduleRounded />}
            />

            <SummaryCard
              title="Completed"
              value={summaryQuery.data?.completed ?? 0}
              icon={<CheckCircleRounded />}
            />

            <SummaryCard
              title="Critical priority"
              value={summaryQuery.data?.critical_priority ?? 0}
              icon={<ErrorRounded />}
            />

            <SummaryCard
              title="High priority"
              value={summaryQuery.data?.high_priority ?? 0}
              icon={<WarningAmberRounded />}
            />

            <SummaryCard
              title="Scheduled"
              value={summaryQuery.data?.scheduled ?? 0}
              icon={<ScheduleRounded />}
            />

            <SummaryCard
              title="Overdue"
              value={summaryQuery.data?.overdue ?? 0}
              icon={<WarningAmberRounded />}
            />
          </Box>

          <Card variant="outlined">
            <CardContent>
              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "2fr 1fr 1fr",
                  },

                  gap: 2,
                }}
              >
                <TextField
                  label="Search work orders"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Code, machine, facility or team"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRounded />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  select
                  label="Priority"
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value as PriorityFilter)
                  }
                >
                  <MenuItem value="All">All priorities</MenuItem>

                  <MenuItem value="Critical">Critical</MenuItem>

                  <MenuItem value="High">High</MenuItem>

                  <MenuItem value="Medium">Medium</MenuItem>

                  <MenuItem value="Low">Low</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Status"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                >
                  <MenuItem value="All">All statuses</MenuItem>

                  <MenuItem value="Open">Open</MenuItem>

                  <MenuItem value="Scheduled">Scheduled</MenuItem>

                  <MenuItem value="In Progress">In Progress</MenuItem>

                  <MenuItem value="Completed">Completed</MenuItem>

                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
              </Box>
            </CardContent>
          </Card>

          {workOrders.length === 0 ? (
            <Alert severity="info">
              No maintenance work orders match the selected filters.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {workOrders.map((workOrder) => (
                <WorkOrderCard
                  key={workOrder.id}
                  workOrder={workOrder}
                  isUpdating={
                    statusMutation.isPending &&
                    statusMutation.variables?.workOrderId === workOrder.id
                  }
                  onStatusChange={handleStatusChange}
                />
              ))}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
