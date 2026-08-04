import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { useQuery } from "@tanstack/react-query";

import { MetricCard } from "../components/dashboard/MetricCard";

import { RobotStatusCard } from "../components/robots/RobotStatusCard";

import {
  getRobots,
  getRobotSummary,
  type Robot,
  type RobotStatus,
} from "../services/robotService";

const statusColorMap: Record<
  RobotStatus,
  "success" | "info" | "warning" | "error"
> = {
  Active: "success",
  Idle: "info",
  Warning: "warning",
  Error: "error",
  Offline: "error",
  Maintenance: "warning",
};

function formatTemperature(temperature: number | null): string {
  if (temperature === null) {
    return "—";
  }

  return `${temperature.toFixed(1)}°C`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calculateAverageHealth(robots: Robot[]): number {
  if (robots.length === 0) {
    return 0;
  }

  const totalHealth = robots.reduce(
    (total, robot) => total + robot.health_score,
    0,
  );

  return totalHealth / robots.length;
}

export function RobotMonitoringPage() {
  const robotsQuery = useQuery({
    queryKey: ["robots", "fleet"],

    queryFn: () =>
      getRobots({
        limit: 100,
      }),

    staleTime: 30_000,
  });

  const summaryQuery = useQuery({
    queryKey: ["robots", "summary"],

    queryFn: getRobotSummary,

    staleTime: 30_000,
  });

  const robots = robotsQuery.data?.robots ?? [];

  const summary = summaryQuery.data;

  const activeRobots =
    summary?.active ??
    robots.filter((robot) => robot.status === "Active").length;

  const maintenanceRobots =
    summary?.maintenance ??
    robots.filter((robot) => robot.status === "Maintenance").length;

  const averageHealth =
    summary?.average_health_score ?? calculateAverageHealth(robots);

  const totalRobots =
    summary?.total ?? robotsQuery.data?.total ?? robots.length;

  const isInitialLoading =
    (robotsQuery.isLoading || summaryQuery.isLoading) && robots.length === 0;

  const isRefreshing = robotsQuery.isFetching || summaryQuery.isFetching;

  const hasRequestError = robotsQuery.isError || summaryQuery.isError;

  async function refreshRobotData() {
    await Promise.all([robotsQuery.refetch(), summaryQuery.refetch()]);
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
            Robot Monitoring
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",

              mt: 1,
            }}
          >
            Live industrial robot health, utilization, temperature, task and
            maintenance information from PostgreSQL.
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
            void refreshRobotData();
          }}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </Stack>

      {hasRequestError && (
        <Alert severity="error">
          Robot information could not be loaded. Confirm that the FastAPI
          backend is running and that you are signed in.
        </Alert>
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
          title="Total Robots"
          value={String(totalRobots)}
          description="Registered industrial robots"
          icon={<PrecisionManufacturingRoundedIcon />}
          iconBackground="rgba(47, 128, 237, 0.14)"
          iconColor="#56a0ff"
        />

        <MetricCard
          title="Active Robots"
          value={String(activeRobots)}
          description="Currently performing operations"
          icon={<CheckCircleRoundedIcon />}
          iconBackground="rgba(39, 174, 96, 0.14)"
          iconColor="#27ae60"
        />

        <MetricCard
          title="Average Health"
          value={`${averageHealth.toFixed(1)}%`}
          description="Fleet-wide robot health score"
          icon={<WarningAmberRoundedIcon />}
          iconBackground="rgba(242, 201, 76, 0.14)"
          iconColor="#f2c94c"
        />

        <MetricCard
          title="Under Maintenance"
          value={String(maintenanceRobots)}
          description="Robots receiving maintenance"
          icon={<BuildRoundedIcon />}
          iconBackground="rgba(235, 87, 87, 0.14)"
          iconColor="#eb5757"
        />
      </Box>

      {isInitialLoading ? (
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
                minHeight: 200,
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
                Loading robot fleet…
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : robots.length === 0 ? (
        <Alert severity="info">No robots are currently registered.</Alert>
      ) : (
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
          {robots.map((robot) => (
            <RobotStatusCard
              key={robot.id}
              name={robot.name}
              robotCode={robot.robot_code}
              robotType={robot.robot_type}
              facility={robot.facility}
              productionLine={robot.production_line}
              status={robot.status}
              healthScore={robot.health_score}
              temperatureCelsius={robot.temperature_celsius}
              utilizationPercent={robot.utilization_percent}
              currentTask={robot.current_task}
              errorCode={robot.error_code}
            />
          ))}
        </Box>
      )}

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
                Robot Fleet Overview
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                }}
              >
                Live status of registered industrial robots
              </Typography>
            </Box>

            <TableContainer>
              <Table
                sx={{
                  minWidth: 1000,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Robot</TableCell>

                    <TableCell>Facility</TableCell>

                    <TableCell>Status</TableCell>

                    <TableCell>Current Task</TableCell>

                    <TableCell align="right">Health</TableCell>

                    <TableCell align="right">Utilization</TableCell>

                    <TableCell align="right">Temperature</TableCell>

                    <TableCell>Last Service</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {robots.map((robot) => (
                    <TableRow
                      key={robot.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": {
                          border: 0,
                        },
                      }}
                    >
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 600,
                          }}
                        >
                          {robot.name}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                          }}
                        >
                          {robot.robot_code}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {robot.facility}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                          }}
                        >
                          {robot.production_line ?? "No line assigned"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={robot.status}
                          color={statusColorMap[robot.status]}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        {robot.current_task ?? "No active task"}
                      </TableCell>

                      <TableCell align="right">
                        {robot.health_score.toFixed(1)}%
                      </TableCell>

                      <TableCell align="right">
                        {robot.utilization_percent.toFixed(1)}%
                      </TableCell>

                      <TableCell align="right">
                        {formatTemperature(robot.temperature_celsius)}
                      </TableCell>

                      <TableCell>
                        {formatDate(robot.last_maintenance_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
