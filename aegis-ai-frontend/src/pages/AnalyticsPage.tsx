import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { useQuery } from "@tanstack/react-query";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard } from "../components/dashboard/MetricCard";

import {
  getMachineTelemetryHistory,
  getMachines,
  type Machine,
  type MachineTelemetryReading,
} from "../services/machineService";

import {
  getRobots,
  getRobotTelemetryHistory,
  type Robot,
  type RobotTelemetryReading,
} from "../services/robotService";

interface MachineChartPoint {
  label: string;
  recordedAt: string;
  healthScore: number;
  temperature: number | null;
  vibration: number | null;
  power: number | null;
}

interface RobotChartPoint {
  label: string;
  recordedAt: string;
  healthScore: number;
  utilization: number;
  battery: number | null;
  temperature: number | null;
}

function formatChartLabel(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortMachineReadings(
  readings: MachineTelemetryReading[],
): MachineTelemetryReading[] {
  return [...readings].sort(
    (first, second) =>
      new Date(first.recorded_at).getTime() -
      new Date(second.recorded_at).getTime(),
  );
}

function sortRobotReadings(
  readings: RobotTelemetryReading[],
): RobotTelemetryReading[] {
  return [...readings].sort(
    (first, second) =>
      new Date(first.recorded_at).getTime() -
      new Date(second.recorded_at).getTime(),
  );
}

function getLatestMachineReading(
  readings: MachineTelemetryReading[],
): MachineTelemetryReading | null {
  const sortedReadings = sortMachineReadings(readings);

  if (sortedReadings.length === 0) {
    return null;
  }

  return sortedReadings[sortedReadings.length - 1];
}

function getLatestRobotReading(
  readings: RobotTelemetryReading[],
): RobotTelemetryReading | null {
  const sortedReadings = sortRobotReadings(readings);

  if (sortedReadings.length === 0) {
    return null;
  }

  return sortedReadings[sortedReadings.length - 1];
}

function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${value.toFixed(1)}%`;
}

function formatTemperature(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${value.toFixed(1)}°C`;
}

export function AnalyticsPage() {
  const [selectedMachineId, setSelectedMachineId] = useState("");

  const [selectedRobotId, setSelectedRobotId] = useState("");

  const machinesQuery = useQuery({
    queryKey: ["machines", "analytics"],

    queryFn: () =>
      getMachines({
        limit: 200,
      }),

    staleTime: 30_000,
  });

  const robotsQuery = useQuery({
    queryKey: ["robots", "analytics"],

    queryFn: () =>
      getRobots({
        limit: 200,
      }),

    staleTime: 30_000,
  });

  const machines = machinesQuery.data?.machines ?? [];

  const robots = robotsQuery.data?.robots ?? [];

  useEffect(() => {
    if (machines.length === 0) {
      if (selectedMachineId !== "") {
        setSelectedMachineId("");
      }

      return;
    }

    const selectedMachineExists = machines.some(
      (machine) => machine.id === selectedMachineId,
    );

    if (!selectedMachineExists) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  useEffect(() => {
    if (robots.length === 0) {
      if (selectedRobotId !== "") {
        setSelectedRobotId("");
      }

      return;
    }

    const selectedRobotExists = robots.some(
      (robot) => robot.id === selectedRobotId,
    );

    if (!selectedRobotExists) {
      setSelectedRobotId(robots[0].id);
    }
  }, [robots, selectedRobotId]);

  const machineHistoryQuery = useQuery({
    queryKey: ["machines", selectedMachineId, "telemetry", "history"],

    queryFn: () =>
      getMachineTelemetryHistory(selectedMachineId, {
        limit: 24,
      }),

    enabled: Boolean(selectedMachineId),

    staleTime: 15_000,
  });

  const robotHistoryQuery = useQuery({
    queryKey: ["robots", selectedRobotId, "telemetry", "history"],

    queryFn: () =>
      getRobotTelemetryHistory(selectedRobotId, {
        limit: 24,
      }),

    enabled: Boolean(selectedRobotId),

    staleTime: 15_000,
  });

  const selectedMachine = useMemo<Machine | undefined>(
    () => machines.find((machine) => machine.id === selectedMachineId),
    [machines, selectedMachineId],
  );

  const selectedRobot = useMemo<Robot | undefined>(
    () => robots.find((robot) => robot.id === selectedRobotId),
    [robots, selectedRobotId],
  );

  const machineReadings = machineHistoryQuery.data?.readings ?? [];

  const robotReadings = robotHistoryQuery.data?.readings ?? [];

  const machineChartData = useMemo<MachineChartPoint[]>(
    () =>
      sortMachineReadings(machineReadings).map(
        (reading): MachineChartPoint => ({
          label: formatChartLabel(reading.recorded_at),

          recordedAt: reading.recorded_at,

          healthScore: reading.health_score,

          temperature: reading.temperature_celsius,

          vibration: reading.vibration_mm_s,

          power: reading.power_consumption_kw,
        }),
      ),
    [machineReadings],
  );

  const robotChartData = useMemo<RobotChartPoint[]>(
    () =>
      sortRobotReadings(robotReadings).map(
        (reading): RobotChartPoint => ({
          label: formatChartLabel(reading.recorded_at),

          recordedAt: reading.recorded_at,

          healthScore: reading.health_score,

          utilization: reading.utilization_percent,

          battery: reading.battery_level_percent,

          temperature: reading.temperature_celsius,
        }),
      ),
    [robotReadings],
  );

  const latestMachineReading = useMemo(
    () => getLatestMachineReading(machineReadings),
    [machineReadings],
  );

  const latestRobotReading = useMemo(
    () => getLatestRobotReading(robotReadings),
    [robotReadings],
  );

  const machineReadingCount = machineHistoryQuery.data?.total ?? 0;

  const robotReadingCount = robotHistoryQuery.data?.total ?? 0;

  const totalHistoricalReadings = machineReadingCount + robotReadingCount;

  const machineIssueCount = machines.filter(
    (machine) => machine.status !== "Operational",
  ).length;

  const robotIssueCount = robots.filter(
    (robot) => !["Active", "Idle"].includes(robot.status),
  ).length;

  const totalIssueCount = machineIssueCount + robotIssueCount;

  const hasRequestError =
    machinesQuery.isError ||
    robotsQuery.isError ||
    machineHistoryQuery.isError ||
    robotHistoryQuery.isError;

  const isInitialLoading = machinesQuery.isLoading || robotsQuery.isLoading;

  const isRefreshing =
    machinesQuery.isFetching ||
    robotsQuery.isFetching ||
    machineHistoryQuery.isFetching ||
    robotHistoryQuery.isFetching;

  async function refreshAnalytics() {
    const requests: Array<Promise<unknown>> = [
      machinesQuery.refetch(),
      robotsQuery.refetch(),
    ];

    if (selectedMachineId) {
      requests.push(machineHistoryQuery.refetch());
    }

    if (selectedRobotId) {
      requests.push(robotHistoryQuery.refetch());
    }

    await Promise.all(requests);
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
            Industrial Analytics
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",

              mt: 1,
            }}
          >
            Analyze 24-hour machine and robot telemetry stored in PostgreSQL.
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
            void refreshAnalytics();
          }}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Analytics"}
        </Button>
      </Stack>

      {hasRequestError && (
        <Alert severity="error">
          Some analytics data could not be loaded. Confirm that FastAPI is
          running and that you are signed in.
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
                minHeight: 180,

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
                Loading industrial analytics…
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!isInitialLoading && (
        <>
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
                    Analytics Assets
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",

                      mt: 0.5,
                    }}
                  >
                    Select a machine and robot to view their most recent 24
                    telemetry readings.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",

                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1fr 1fr",
                    },

                    gap: 3,
                  }}
                >
                  <TextField
                    select
                    fullWidth
                    label="Machine"
                    value={selectedMachineId}
                    disabled={machines.length === 0}
                    onChange={(event) =>
                      setSelectedMachineId(event.target.value)
                    }
                  >
                    {machines.map((machine) => (
                      <MenuItem key={machine.id} value={machine.id}>
                        {machine.name} — {machine.asset_code}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    fullWidth
                    label="Robot"
                    value={selectedRobotId}
                    disabled={robots.length === 0}
                    onChange={(event) => setSelectedRobotId(event.target.value)}
                  >
                    {robots.map((robot) => (
                      <MenuItem key={robot.id} value={robot.id}>
                        {robot.name} — {robot.robot_code}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={1}
                >
                  <Chip
                    variant="outlined"
                    color="info"
                    label={`${machineReadingCount} machine readings`}
                  />

                  <Chip
                    variant="outlined"
                    color="secondary"
                    label={`${robotReadingCount} robot readings`}
                  />

                  {selectedMachine && (
                    <Chip variant="outlined" label={selectedMachine.facility} />
                  )}

                  {selectedRobot && (
                    <Chip variant="outlined" label={selectedRobot.facility} />
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

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
              title="Machine Health"
              value={formatPercentage(latestMachineReading?.health_score)}
              description={
                selectedMachine
                  ? `${selectedMachine.name} latest recorded health`
                  : "No machine selected"
              }
              icon={<EngineeringRoundedIcon />}
              iconBackground="rgba(47,128,237,0.14)"
              iconColor="#56a0ff"
            />

            <MetricCard
              title="Robot Utilization"
              value={formatPercentage(latestRobotReading?.utilization_percent)}
              description={
                selectedRobot
                  ? `${selectedRobot.name} latest recorded utilization`
                  : "No robot selected"
              }
              icon={<PrecisionManufacturingRoundedIcon />}
              iconBackground="rgba(0,194,168,0.14)"
              iconColor="#00c2a8"
            />

            <MetricCard
              title="Machine Temperature"
              value={formatTemperature(
                latestMachineReading?.temperature_celsius,
              )}
              description={
                latestMachineReading
                  ? `Recorded ${formatFullTimestamp(
                      latestMachineReading.recorded_at,
                    )}`
                  : "No telemetry available"
              }
              icon={<HealthAndSafetyRoundedIcon />}
              iconBackground="rgba(39,174,96,0.14)"
              iconColor="#27ae60"
            />

            <MetricCard
              title="Historical Samples"
              value={String(totalHistoricalReadings)}
              description={`${totalIssueCount} current assets require attention`}
              icon={<AnalyticsRoundedIcon />}
              iconBackground="rgba(235,87,87,0.14)"
              iconColor="#eb5757"
            />
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                xl: "repeat(2, 1fr)",
              },

              gap: 3,
            }}
          >
            <AnalyticsCard
              title="Machine Health and Temperature"
              description={
                selectedMachine
                  ? `${selectedMachine.name} · ${selectedMachine.asset_code}`
                  : "Select a machine"
              }
              loading={machineHistoryQuery.isLoading}
              error={machineHistoryQuery.isError}
              empty={machineChartData.length === 0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={machineChartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />

                  <YAxis
                    yAxisId="health"
                    domain={[0, 100]}
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    yAxisId="temperature"
                    orientation="right"
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#101d2e",

                      border: "1px solid rgba(255,255,255,0.12)",

                      borderRadius: 10,
                    }}
                  />

                  <Legend />

                  <Line
                    yAxisId="health"
                    type="monotone"
                    dataKey="healthScore"
                    name="Health %"
                    stroke="#2f80ed"
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                  />

                  <Line
                    yAxisId="temperature"
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature °C"
                    stroke="#f2c94c"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsCard>

            <AnalyticsCard
              title="Machine Vibration and Power"
              description="Historical vibration and power-consumption readings"
              loading={machineHistoryQuery.isLoading}
              error={machineHistoryQuery.isError}
              empty={machineChartData.length === 0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={machineChartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />

                  <YAxis
                    yAxisId="vibration"
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    yAxisId="power"
                    orientation="right"
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#101d2e",

                      border: "1px solid rgba(255,255,255,0.12)",

                      borderRadius: 10,
                    }}
                  />

                  <Legend />

                  <Line
                    yAxisId="vibration"
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration mm/s"
                    stroke="#eb5757"
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                  />

                  <Line
                    yAxisId="power"
                    type="monotone"
                    dataKey="power"
                    name="Power kW"
                    stroke="#00c2a8"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsCard>

            <AnalyticsCard
              title="Robot Health and Utilization"
              description={
                selectedRobot
                  ? `${selectedRobot.name} · ${selectedRobot.robot_code}`
                  : "Select a robot"
              }
              loading={robotHistoryQuery.isLoading}
              error={robotHistoryQuery.isError}
              empty={robotChartData.length === 0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={robotChartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#101d2e",

                      border: "1px solid rgba(255,255,255,0.12)",

                      borderRadius: 10,
                    }}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="healthScore"
                    name="Health %"
                    stroke="#27ae60"
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                  />

                  <Line
                    type="monotone"
                    dataKey="utilization"
                    name="Utilization %"
                    stroke="#2f80ed"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsCard>

            <AnalyticsCard
              title="Robot Battery and Temperature"
              description="Historical battery-level and temperature readings"
              loading={robotHistoryQuery.isLoading}
              error={robotHistoryQuery.isError}
              empty={robotChartData.length === 0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={robotChartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />

                  <YAxis
                    yAxisId="battery"
                    domain={[0, 100]}
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    yAxisId="temperature"
                    orientation="right"
                    stroke="#a7b4c5"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#101d2e",

                      border: "1px solid rgba(255,255,255,0.12)",

                      borderRadius: 10,
                    }}
                  />

                  <Legend />

                  <Line
                    yAxisId="battery"
                    type="monotone"
                    dataKey="battery"
                    name="Battery %"
                    stroke="#00c2a8"
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                  />

                  <Line
                    yAxisId="temperature"
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature °C"
                    stroke="#f2c94c"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </Box>
        </>
      )}
    </Stack>
  );
}

interface AnalyticsCardProps {
  title: string;
  description: string;
  loading: boolean;
  error: boolean;
  empty: boolean;
  children: ReactNode;
}

function AnalyticsCard({
  title,
  description,
  loading,
  error,
  empty,
  children,
}: AnalyticsCardProps) {
  return (
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
              {title}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",

                mt: 0.5,
              }}
            >
              {description}
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              height: 340,
            }}
          >
            {loading ? (
              <Stack
                spacing={2}
                sx={{
                  height: "100%",

                  alignItems: "center",

                  justifyContent: "center",
                }}
              >
                <CircularProgress />

                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Loading telemetry…
                </Typography>
              </Stack>
            ) : error ? (
              <Stack
                sx={{
                  height: "100%",

                  justifyContent: "center",
                }}
              >
                <Alert severity="error">
                  Telemetry history could not be loaded.
                </Alert>
              </Stack>
            ) : empty ? (
              <Stack
                sx={{
                  height: "100%",

                  justifyContent: "center",
                }}
              >
                <Alert severity="info">
                  No telemetry history is available for this asset.
                </Alert>
              </Stack>
            ) : (
              children
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
