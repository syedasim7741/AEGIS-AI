import { useMemo, useState, type ReactNode } from "react";

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
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { useQuery } from "@tanstack/react-query";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard } from "../components/dashboard/MetricCard";

import CreateWorkOrderButton from "../components/maintenance/CreateWorkOrderButton";
import MaintenanceWorkOrdersPanel from "../components/maintenance/MaintenanceWorkOrdersPanel";

import {
  getPredictiveMaintenanceAssessments,
  getPredictiveMaintenanceSummary,
  type PredictiveMaintenanceAssessment,
  type PredictiveRiskLevel,
} from "../services/predictiveMaintenanceService";

type RiskFilter = "All" | PredictiveRiskLevel;

const riskFilters: RiskFilter[] = ["All", "Low", "Medium", "High", "Critical"];

const riskColorMap: Record<
  PredictiveRiskLevel,
  "success" | "info" | "warning" | "error"
> = {
  Low: "success",
  Medium: "info",
  High: "warning",
  Critical: "error",
};

const riskBorderColorMap: Record<PredictiveRiskLevel, string> = {
  Low: "success.main",
  Medium: "info.main",
  High: "warning.main",
  Critical: "error.main",
};

function formatDateTime(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return "Not available";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${value.toFixed(1)}%`;
}

function formatMeasurement(
  value: number | null | undefined,
  unit: string,
): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${value.toFixed(2)} ${unit}`;
}

function formatTrend(value: number, unit: string): string {
  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(2)} ${unit}`;
}

function calculateAverageHealth(
  assessments: PredictiveMaintenanceAssessment[],
): number {
  if (assessments.length === 0) {
    return 0;
  }

  const total = assessments.reduce(
    (sum, assessment) => sum + assessment.health_score,
    0,
  );

  return total / assessments.length;
}

export function PredictiveMaintenancePage() {
  const [selectedRisk, setSelectedRisk] = useState<RiskFilter>("All");

  const [selectedFacility, setSelectedFacility] = useState("All");

  const [searchText, setSearchText] = useState("");

  const assessmentsQuery = useQuery({
    queryKey: ["predictive-maintenance", "assessments"],

    queryFn: () => getPredictiveMaintenanceAssessments(),

    staleTime: 30_000,
  });

  const summaryQuery = useQuery({
    queryKey: ["predictive-maintenance", "summary"],

    queryFn: getPredictiveMaintenanceSummary,

    staleTime: 30_000,
  });

  const assessments = assessmentsQuery.data?.assessments ?? [];

  const summary = summaryQuery.data;

  const facilities = useMemo(
    () =>
      Array.from(
        new Set(assessments.map((assessment) => assessment.facility)),
      ).sort((first, second) => first.localeCompare(second)),
    [assessments],
  );

  const filteredAssessments = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return assessments.filter((assessment) => {
      const matchesRisk =
        selectedRisk === "All" || assessment.risk_level === selectedRisk;

      const matchesFacility =
        selectedFacility === "All" || assessment.facility === selectedFacility;

      const matchesSearch =
        !normalizedSearch ||
        assessment.machine_name.toLowerCase().includes(normalizedSearch) ||
        assessment.asset_code.toLowerCase().includes(normalizedSearch) ||
        assessment.facility.toLowerCase().includes(normalizedSearch) ||
        (assessment.production_line ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesRisk && matchesFacility && matchesSearch;
    });
  }, [assessments, searchText, selectedFacility, selectedRisk]);

  const chartData = useMemo(
    () =>
      assessments.map((assessment) => ({
        assetCode: assessment.asset_code,

        riskScore: assessment.risk_score,

        healthScore: assessment.health_score,

        anomalies: assessment.anomaly_count,
      })),
    [assessments],
  );

  const totalMachines = summary?.total_machines ?? assessments.length;

  const lowRiskCount =
    summary?.low_risk ??
    assessments.filter((assessment) => assessment.risk_level === "Low").length;

  const criticalRiskCount =
    summary?.critical_risk ??
    assessments.filter((assessment) => assessment.risk_level === "Critical")
      .length;

  const machinesRequiringAttention =
    summary?.machines_requiring_attention ??
    assessments.filter((assessment) => assessment.risk_level !== "Low").length;

  const averageRiskScore =
    summary?.average_risk_score ??
    (assessments.length > 0
      ? assessments.reduce(
          (total, assessment) => total + assessment.risk_score,
          0,
        ) / assessments.length
      : 0);

  const averageHealth = calculateAverageHealth(assessments);

  const hasRequestError = assessmentsQuery.isError || summaryQuery.isError;

  const isInitialLoading = assessmentsQuery.isLoading || summaryQuery.isLoading;

  const isRefreshing = assessmentsQuery.isFetching || summaryQuery.isFetching;

  async function refreshMaintenanceData() {
    await Promise.all([assessmentsQuery.refetch(), summaryQuery.refetch()]);
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
            Predictive Maintenance
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",

              mt: 1,
            }}
          >
            Analyze machine telemetry, identify failure risks and prioritize
            maintenance before operational breakdowns occur.
          </Typography>

          {summary && (
            <Typography
              variant="caption"
              sx={{
                display: "block",

                color: "text.secondary",

                mt: 1,
              }}
            >
              Last assessment generated {formatDateTime(summary.generated_at)}
            </Typography>
          )}
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
            void refreshMaintenanceData();
          }}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Assessment"}
        </Button>
      </Stack>

      {hasRequestError && (
        <Alert severity="error">
          Predictive-maintenance data could not be loaded. Confirm that FastAPI
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
                Calculating machine maintenance risks…
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!isInitialLoading && (
        <>
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
              title="Average Risk"
              value={`${averageRiskScore.toFixed(1)}%`}
              description={`Average health ${averageHealth.toFixed(
                1,
              )}% across ${totalMachines} machines`}
              icon={<EngineeringRoundedIcon />}
              iconBackground="rgba(47,128,237,0.14)"
              iconColor="#56a0ff"
            />

            <MetricCard
              title="Low Risk"
              value={String(lowRiskCount)}
              description="Machines operating within normal limits"
              icon={<CheckCircleRoundedIcon />}
              iconBackground="rgba(39,174,96,0.14)"
              iconColor="#27ae60"
            />

            <MetricCard
              title="Require Attention"
              value={String(machinesRequiringAttention)}
              description="Medium, high or critical maintenance risk"
              icon={<WarningAmberRoundedIcon />}
              iconBackground="rgba(242,201,76,0.14)"
              iconColor="#f2c94c"
            />

            <MetricCard
              title="Critical Risk"
              value={String(criticalRiskCount)}
              description="Machines requiring immediate inspection"
              icon={<ErrorOutlineRoundedIcon />}
              iconBackground="rgba(235,87,87,0.14)"
              iconColor="#eb5757"
            />
          </Box>

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
                    Machine Risk Comparison
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",

                      mt: 0.5,
                    }}
                  >
                    Predictive risk and current health scores calculated from
                    the latest 24 telemetry readings.
                  </Typography>
                </Box>

                {chartData.length === 0 ? (
                  <Alert severity="info">
                    No machine assessments are available.
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: 340,
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 10,
                          right: 20,
                          left: -15,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="4 4"
                          stroke="rgba(255,255,255,0.08)"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="assetCode"
                          stroke="#a7b4c5"
                          tickLine={false}
                          axisLine={false}
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

                        <Bar
                          dataKey="healthScore"
                          name="Health score"
                          fill="#27ae60"
                          radius={[5, 5, 0, 0]}
                        />

                        <Bar
                          dataKey="riskScore"
                          name="Risk score"
                          fill="#eb5757"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
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
                    Assessment Filters
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",

                      mt: 0.5,
                    }}
                  >
                    Filter assessments by maintenance risk, facility or machine.
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
                  {riskFilters.map((risk) => (
                    <Chip
                      key={risk}
                      label={risk}
                      clickable
                      color={
                        risk === selectedRisk
                          ? risk === "All"
                            ? "primary"
                            : riskColorMap[risk]
                          : "default"
                      }
                      variant={risk === selectedRisk ? "filled" : "outlined"}
                      onClick={() => setSelectedRisk(risk)}
                    />
                  ))}
                </Stack>

                <Box
                  sx={{
                    display: "grid",

                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "260px 1fr",
                    },

                    gap: 2,
                  }}
                >
                  <TextField
                    select
                    size="small"
                    label="Facility"
                    value={selectedFacility}
                    onChange={(event) =>
                      setSelectedFacility(event.target.value)
                    }
                  >
                    <MenuItem value="All">All facilities</MenuItem>

                    {facilities.map((facility) => (
                      <MenuItem key={facility} value={facility}>
                        {facility}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    size="small"
                    placeholder="Search machine, asset code, facility or production line..."
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Showing {filteredAssessments.length} of {assessments.length}{" "}
                  machine assessments
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {filteredAssessments.length > 0 ? (
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
              {filteredAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.machine_id}
                  assessment={assessment}
                />
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                p: 6,

                textAlign: "center",

                border: "1px dashed",

                borderColor: "divider",

                borderRadius: 3,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                No machine assessments found
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",

                  mt: 1,
                }}
              >
                Change the risk filter, facility or search term.
              </Typography>
            </Box>
          )}

          <Divider />

          <MaintenanceWorkOrdersPanel />
        </>
      )}
    </Stack>
  );
}

interface AssessmentCardProps {
  assessment: PredictiveMaintenanceAssessment;
}

function AssessmentCard({ assessment }: AssessmentCardProps) {
  return (
    <Card
      sx={{
        height: "100%",

        backgroundImage: "none",

        backgroundColor: "background.paper",

        border: "1px solid",

        borderColor: riskBorderColorMap[assessment.risk_level],
      }}
    >
      <CardContent>
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
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                {assessment.machine_name}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",

                  mt: 0.5,
                }}
              >
                {assessment.asset_code} · {assessment.facility}
              </Typography>

              {assessment.production_line && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",

                    color: "text.secondary",

                    mt: 0.5,
                  }}
                >
                  Production line: {assessment.production_line}
                </Typography>
              )}
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
                label={`${assessment.risk_level} risk`}
                color={riskColorMap[assessment.risk_level]}
                variant="filled"
              />

              <Chip label={assessment.current_status} variant="outlined" />
            </Stack>
          </Stack>

          <Box>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",

                alignItems: "center",

                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                Predictive risk score
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,

                  color: riskBorderColorMap[assessment.risk_level],
                }}
              >
                {assessment.risk_score.toFixed(1)}%
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={assessment.risk_score}
              color={riskColorMap[assessment.risk_level]}
              sx={{
                height: 8,
                borderRadius: 10,
              }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(4, 1fr)",
              },

              gap: 2,
            }}
          >
            <AssessmentValue
              label="Health"
              value={formatPercentage(assessment.health_score)}
            />

            <AssessmentValue
              label="Temperature"
              value={formatMeasurement(assessment.temperature_celsius, "°C")}
            />

            <AssessmentValue
              label="Vibration"
              value={formatMeasurement(assessment.vibration_mm_s, "mm/s")}
            />

            <AssessmentValue
              label="Power"
              value={formatMeasurement(assessment.power_consumption_kw, "kW")}
            />
          </Box>

          <Divider />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
              },

              gap: 2,
            }}
          >
            <TrendValue
              label="Health trend"
              value={formatTrend(assessment.health_trend_percent, "points")}
              isWarning={assessment.health_trend_percent < 0}
            />

            <TrendValue
              label="Temperature trend"
              value={formatTrend(assessment.temperature_trend_celsius, "°C")}
              isWarning={assessment.temperature_trend_celsius > 0}
            />

            <TrendValue
              label="Vibration trend"
              value={formatTrend(assessment.vibration_trend_mm_s, "mm/s")}
              isWarning={assessment.vibration_trend_mm_s > 0}
            />
          </Box>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
            useFlexGap
            sx={{
              flexWrap: "wrap",
            }}
          >
            <Chip
              size="small"
              variant="outlined"
              label={`${assessment.anomaly_count} anomalies`}
              color={assessment.anomaly_count > 0 ? "warning" : "success"}
            />

            <Chip
              size="small"
              variant="outlined"
              label={`${assessment.telemetry_reading_count} telemetry readings`}
            />

            <Chip
              size="small"
              variant="outlined"
              label={`Assessed ${formatDateTime(assessment.assessed_at)}`}
            />
          </Stack>

          <Divider />

          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
              }}
            >
              Risk factors
            </Typography>

            {assessment.risk_factors.length > 0 ? (
              <Stack
                spacing={1}
                sx={{
                  mt: 1.5,
                }}
              >
                {assessment.risk_factors.map((riskFactor, index) => (
                  <Stack
                    key={`${riskFactor}-${index}`}
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        width: 7,
                        height: 7,

                        mt: "7px",

                        flexShrink: 0,

                        borderRadius: "50%",

                        backgroundColor:
                          riskBorderColorMap[assessment.risk_level],
                      }}
                    />

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                      }}
                    >
                      {riskFactor}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "success.main",

                  mt: 1,
                }}
              >
                No significant risk factors were detected.
              </Typography>
            )}
          </Box>

          <Alert
            severity={
              assessment.risk_level === "Critical"
                ? "error"
                : assessment.risk_level === "High"
                  ? "warning"
                  : assessment.risk_level === "Medium"
                    ? "info"
                    : "success"
            }
            icon={<BuildRoundedIcon />}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,

                mb: 0.5,
              }}
            >
              Recommended action
            </Typography>

            {assessment.recommended_action}
          </Alert>

          <CreateWorkOrderButton assessment={assessment} />
        </Stack>
      </CardContent>
    </Card>
  );
}

interface AssessmentValueProps {
  label: string;
  value: ReactNode;
}

function AssessmentValue({ label, value }: AssessmentValueProps) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontWeight: 700,

          mt: 0.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

interface TrendValueProps {
  label: string;
  value: string;
  isWarning: boolean;
}

function TrendValue({ label, value, isWarning }: TrendValueProps) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          mt: 0.5,

          fontWeight: 700,

          color: isWarning ? "warning.main" : "success.main",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
