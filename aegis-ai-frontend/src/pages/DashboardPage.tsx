import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { MetricCard } from "../components/dashboard/MetricCard";

import { OperationsChart } from "../components/dashboard/OperationsChart";

import { LiveTelemetryStatus } from "../components/telemetry/LiveTelemetryStatus";

import {
  getMachines,
  getMachineSummary,
  type Machine,
  type MachineStatus,
} from "../services/machineService";

import {
  getRobots,
  getRobotSummary,
  type Robot,
  type RobotStatus,
} from "../services/robotService";

type FacilityCondition =
  | "Operational"
  | "Warning"
  | "Maintenance"
  | "Offline"
  | "Critical";

interface FacilityOverview {
  name: string;
  machineCount: number;
  robotCount: number;
  totalAssets: number;
  issueCount: number;
  severity: number;
  status: FacilityCondition;
}

const facilityStatusColorMap: Record<
  FacilityCondition,
  "success" | "warning" | "info" | "error" | "default"
> = {
  Operational: "success",
  Warning: "warning",
  Maintenance: "info",
  Offline: "default",
  Critical: "error",
};

function getMachineSeverity(status: MachineStatus): number {
  const severityMap: Record<MachineStatus, number> = {
    Operational: 0,
    Warning: 1,
    Maintenance: 2,
    Offline: 3,
    Critical: 4,
  };

  return severityMap[status];
}

function getRobotSeverity(status: RobotStatus): number {
  const severityMap: Record<RobotStatus, number> = {
    Active: 0,
    Idle: 0,
    Warning: 1,
    Maintenance: 2,
    Offline: 3,
    Error: 4,
  };

  return severityMap[status];
}

function getFacilityCondition(severity: number): FacilityCondition {
  if (severity >= 4) {
    return "Critical";
  }

  if (severity === 3) {
    return "Offline";
  }

  if (severity === 2) {
    return "Maintenance";
  }

  if (severity === 1) {
    return "Warning";
  }

  return "Operational";
}

function buildFacilityOverview(
  machines: Machine[],
  robots: Robot[],
): FacilityOverview[] {
  const facilities = new Map<
    string,
    {
      machineCount: number;
      robotCount: number;
      totalAssets: number;
      issueCount: number;
      severity: number;
    }
  >();

  for (const machine of machines) {
    const existing = facilities.get(machine.facility) ?? {
      machineCount: 0,
      robotCount: 0,
      totalAssets: 0,
      issueCount: 0,
      severity: 0,
    };

    const severity = getMachineSeverity(machine.status);

    existing.machineCount += 1;
    existing.totalAssets += 1;

    existing.severity = Math.max(existing.severity, severity);

    if (severity > 0) {
      existing.issueCount += 1;
    }

    facilities.set(machine.facility, existing);
  }

  for (const robot of robots) {
    const existing = facilities.get(robot.facility) ?? {
      machineCount: 0,
      robotCount: 0,
      totalAssets: 0,
      issueCount: 0,
      severity: 0,
    };

    const severity = getRobotSeverity(robot.status);

    existing.robotCount += 1;
    existing.totalAssets += 1;

    existing.severity = Math.max(existing.severity, severity);

    if (severity > 0) {
      existing.issueCount += 1;
    }

    facilities.set(robot.facility, existing);
  }

  return Array.from(facilities.entries())
    .map(
      ([name, facility]): FacilityOverview => ({
        name,
        ...facility,
        status: getFacilityCondition(facility.severity),
      }),
    )
    .sort(
      (first, second) =>
        second.severity - first.severity ||
        first.name.localeCompare(second.name),
    );
}

function calculateEquipmentHealth(
  machines: Machine[],
  robots: Robot[],
): number {
  const scores = [
    ...machines.map((machine) => machine.health_score),

    ...robots.map((robot) => robot.health_score),
  ];

  if (scores.length === 0) {
    return 0;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);

  return total / scores.length;
}

export function DashboardPage() {
  const machinesQuery = useQuery({
    queryKey: ["machines", "dashboard"],

    queryFn: () =>
      getMachines({
        limit: 100,
      }),

    staleTime: 30_000,
  });

  const machineSummaryQuery = useQuery({
    queryKey: ["machines", "summary"],

    queryFn: getMachineSummary,

    staleTime: 30_000,
  });

  const robotsQuery = useQuery({
    queryKey: ["robots", "dashboard"],

    queryFn: () =>
      getRobots({
        limit: 100,
      }),

    staleTime: 30_000,
  });

  const robotSummaryQuery = useQuery({
    queryKey: ["robots", "summary"],

    queryFn: getRobotSummary,

    staleTime: 30_000,
  });

  const machines = machinesQuery.data?.machines ?? [];

  const robots = robotsQuery.data?.robots ?? [];

  const machineSummary = machineSummaryQuery.data;

  const robotSummary = robotSummaryQuery.data;

  const facilities = useMemo(
    () => buildFacilityOverview(machines, robots),
    [machines, robots],
  );

  const totalMachines =
    machineSummary?.total ?? machinesQuery.data?.total ?? machines.length;

  const operationalMachines =
    machineSummary?.operational ??
    machines.filter((machine) => machine.status === "Operational").length;

  const totalRobots =
    robotSummary?.total ?? robotsQuery.data?.total ?? robots.length;

  const activeRobots =
    robotSummary?.active ??
    robots.filter((robot) => robot.status === "Active").length;

  const maintenanceAssets =
    (machineSummary?.maintenance ??
      machines.filter((machine) => machine.status === "Maintenance").length) +
    (robotSummary?.maintenance ??
      robots.filter((robot) => robot.status === "Maintenance").length);

  const machineCriticalCount =
    machineSummary?.critical ??
    machines.filter((machine) => machine.status === "Critical").length;

  const robotErrorCount =
    robotSummary?.error ??
    robots.filter((robot) => robot.status === "Error").length;

  const offlineAssetCount =
    (machineSummary?.offline ??
      machines.filter((machine) => machine.status === "Offline").length) +
    (robotSummary?.offline ??
      robots.filter((robot) => robot.status === "Offline").length);

  const criticalIssueCount = machineCriticalCount + robotErrorCount;

  const totalAssets = totalMachines + totalRobots;

  const averageEquipmentHealth = calculateEquipmentHealth(machines, robots);

  const hasRequestError =
    machinesQuery.isError ||
    machineSummaryQuery.isError ||
    robotsQuery.isError ||
    robotSummaryQuery.isError;

  const isRefreshing =
    machinesQuery.isFetching ||
    machineSummaryQuery.isFetching ||
    robotsQuery.isFetching ||
    robotSummaryQuery.isFetching;

  const hasLoadedData = machinesQuery.isSuccess || robotsQuery.isSuccess;

  const isInitialLoading = !hasLoadedData && isRefreshing;

  async function refreshDashboard() {
    await Promise.all([
      machinesQuery.refetch(),
      machineSummaryQuery.refetch(),
      robotsQuery.refetch(),
      robotSummaryQuery.refetch(),
    ]);
  }

  return (
    <Stack spacing={4}>
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
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Industrial Operations Dashboard
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",

              mt: 1,
            }}
          >
            Live machine, robot, equipment-health and facility information
            loaded from PostgreSQL.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={
            isRefreshing ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <RefreshRoundedIcon />
            )
          }
          disabled={isRefreshing}
          onClick={() => {
            void refreshDashboard();
          }}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Dashboard"}
        </Button>
      </Stack>

      <LiveTelemetryStatus />

      {hasRequestError && (
        <Alert severity="error">
          Some industrial information could not be loaded. Confirm that FastAPI
          is running and that you are signed in.
        </Alert>
      )}

      {isInitialLoading && (
        <Card
          sx={{
            backgroundImage: "none",

            backgroundColor: "background.paper",

            border: "1px solid",

            borderColor: "divider",
          }}
        >
          <CardContent>
            <Stack
              spacing={2}
              sx={{
                minHeight: 160,

                alignItems: "center",

                justifyContent: "center",
              }}
            >
              <CircularProgress />

              <Typography
                sx={{
                  color: "text.secondary",
                }}
              >
                Loading industrial operations data…
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },

          gap: 3,
        }}
      >
        <MetricCard
          title="Industrial Machines"
          value={String(totalMachines)}
          description={`${operationalMachines} operational across all facilities`}
          icon={<EngineeringRoundedIcon />}
          iconBackground="rgba(47, 128, 237, 0.14)"
          iconColor="#56a0ff"
        />

        <MetricCard
          title="Industrial Robots"
          value={String(totalRobots)}
          description={`${activeRobots} active and ${maintenanceAssets} total assets under maintenance`}
          icon={<PrecisionManufacturingRoundedIcon />}
          iconBackground="rgba(0, 194, 168, 0.14)"
          iconColor="#00c2a8"
        />

        <MetricCard
          title="Equipment Health"
          value={`${averageEquipmentHealth.toFixed(1)}%`}
          description={`Average health across ${totalAssets} industrial assets`}
          icon={<HealthAndSafetyRoundedIcon />}
          iconBackground="rgba(39, 174, 96, 0.14)"
          iconColor="#27ae60"
        />

        <MetricCard
          title="Critical Issues"
          value={String(criticalIssueCount)}
          description={`${machineCriticalCount} critical machines, ${robotErrorCount} robot errors`}
          icon={<WarningAmberRoundedIcon />}
          iconBackground="rgba(235, 87, 87, 0.14)"
          iconColor="#eb5757"
        />
      </Box>

      <OperationsChart />

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            lg: "2fr 1fr",
          },

          gap: 3,
        }}
      >
        <Card
          sx={{
            backgroundImage: "none",

            backgroundColor: "background.paper",

            border: "1px solid",

            borderColor: "divider",
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  Facility Status
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Combined machine and robot status across industrial facilities
                </Typography>
              </Box>

              {facilities.length === 0 ? (
                <Alert severity="info">
                  No facility data is currently available.
                </Alert>
              ) : (
                facilities.map((facility) => (
                  <FacilityStatusRow key={facility.name} facility={facility} />
                ))
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            backgroundImage: "none",

            backgroundColor: "background.paper",

            border: "1px solid",

            borderColor: "divider",
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  System Health
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Current API and data service availability
                </Typography>
              </Box>

              <SystemHealthRow
                label="Machine API"
                status={
                  machinesQuery.isError
                    ? "Unavailable"
                    : machinesQuery.isFetching
                      ? "Refreshing"
                      : "Connected"
                }
                tone={
                  machinesQuery.isError
                    ? "error"
                    : machinesQuery.isFetching
                      ? "warning"
                      : "success"
                }
              />

              <Divider />

              <SystemHealthRow
                label="Robot API"
                status={
                  robotsQuery.isError
                    ? "Unavailable"
                    : robotsQuery.isFetching
                      ? "Refreshing"
                      : "Connected"
                }
                tone={
                  robotsQuery.isError
                    ? "error"
                    : robotsQuery.isFetching
                      ? "warning"
                      : "success"
                }
              />

              <Divider />

              <SystemHealthRow
                label="PostgreSQL Data"
                status={
                  hasRequestError
                    ? "Check Required"
                    : hasLoadedData
                      ? "Connected"
                      : "Loading"
                }
                tone={
                  hasRequestError
                    ? "error"
                    : hasLoadedData
                      ? "success"
                      : "warning"
                }
              />

              <Divider />

              <SystemHealthRow
                label="Offline Assets"
                status={String(offlineAssetCount)}
                tone={offlineAssetCount > 0 ? "warning" : "success"}
              />

              <Divider />

              <SystemHealthRow
                label="Authenticated Session"
                status="Active"
                tone="success"
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

interface FacilityStatusRowProps {
  facility: FacilityOverview;
}

function FacilityStatusRow({ facility }: FacilityStatusRowProps) {
  return (
    <Stack
      direction={{
        xs: "column",
        sm: "row",
      }}
      spacing={2}
      sx={{
        alignItems: {
          xs: "flex-start",
          sm: "center",
        },

        justifyContent: "space-between",

        p: 2,
        borderRadius: 2,

        backgroundColor: "rgba(255,255,255,0.025)",

        border: "1px solid",

        borderColor: "divider",
      }}
    >
      <Box>
        <Typography
          sx={{
            fontWeight: 600,
          }}
        >
          {facility.name}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",

            mt: 0.5,
          }}
        >
          {facility.machineCount} machines · {facility.robotCount} robots
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: facility.issueCount > 0 ? "warning.main" : "success.main",

            display: "block",
            mt: 0.5,
          }}
        >
          {facility.issueCount > 0
            ? `${facility.issueCount} assets require attention`
            : "All registered assets are operating normally"}
        </Typography>
      </Box>

      <Chip
        label={facility.status}
        color={facilityStatusColorMap[facility.status]}
        size="small"
        variant="outlined"
      />
    </Stack>
  );
}

interface SystemHealthRowProps {
  label: string;
  status: string;
  tone: "success" | "warning" | "error";
}

function SystemHealthRow({ label, status, tone }: SystemHealthRowProps) {
  const glowColor =
    tone === "success"
      ? "rgba(39,174,96,0.8)"
      : tone === "warning"
        ? "rgba(242,201,76,0.8)"
        : "rgba(235,87,87,0.8)";

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: "center",

        justifyContent: "space-between",
      }}
    >
      <Typography
        sx={{
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: "50%",

            backgroundColor: `${tone}.main`,

            boxShadow: `0 0 8px ${glowColor}`,
          }}
        />

        <Typography
          variant="body2"
          sx={{
            color: `${tone}.main`,

            fontWeight: 600,
          }}
        >
          {status}
        </Typography>
      </Stack>
    </Stack>
  );
}
