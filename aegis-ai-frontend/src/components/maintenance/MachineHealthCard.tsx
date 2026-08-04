import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import BuildCircleRoundedIcon from "@mui/icons-material/BuildCircleRounded";

export type MaintenanceRisk = "Low" | "Medium" | "High" | "Critical";

export type MaintenanceStatus = "Healthy" | "Monitor" | "Service Required";

interface MachineHealthCardProps {
  machineName: string;
  machineId: string;
  location: string;
  healthScore: number;
  failureRisk: MaintenanceRisk;
  status: MaintenanceStatus;
  remainingLife: string;
  nextService: string;
}

const riskColorMap: Record<
  MaintenanceRisk,
  "success" | "info" | "warning" | "error"
> = {
  Low: "success",
  Medium: "info",
  High: "warning",
  Critical: "error",
};

const statusColorMap: Record<
  MaintenanceStatus,
  "success" | "warning" | "error"
> = {
  Healthy: "success",
  Monitor: "warning",
  "Service Required": "error",
};

export function MachineHealthCard({
  machineName,
  machineId,
  location,
  healthScore,
  failureRisk,
  status,
  remainingLife,
  nextService,
}: MachineHealthCardProps) {
  const healthColor =
    healthScore >= 85 ? "success" : healthScore >= 65 ? "warning" : "error";

  return (
    <Card
      sx={{
        height: "100%",
        backgroundImage: "none",
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 0.2s ease, border-color 0.2s ease",

        "&:hover": {
          transform: "translateY(-3px)",
          borderColor:
            failureRisk === "Critical" ? "error.main" : "primary.main",
        },
      }}
    >
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start"
            }}>
            <Stack direction="row" spacing={1.5} sx={{
              alignItems: "center"
            }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2,
                  color: "primary.light",
                  backgroundColor: "rgba(47,128,237,0.14)",
                }}
              >
                <BuildCircleRoundedIcon />
              </Box>

              <Box>
                <Typography sx={{
                  fontWeight: 700
                }}>{machineName}</Typography>

                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  {machineId}
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={status}
              color={statusColorMap[status]}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Location: {location}
          </Typography>

          <Box>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                mb: 1
              }}>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                Equipment health
              </Typography>

              <Typography variant="body2" sx={{
                fontWeight: 700
              }}>
                {healthScore}%
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={healthScore}
              color={healthColor}
              sx={{
                height: 8,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "rgba(255,255,255,0.025)",
              }}
            >
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Remaining life
              </Typography>

              <Typography sx={{
                fontWeight: 700
              }}>{remainingLife}</Typography>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "rgba(255,255,255,0.025)",
              }}
            >
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Failure risk
              </Typography>

              <Chip
                label={failureRisk}
                color={riskColorMap[failureRisk]}
                size="small"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            Next recommended service: {nextService}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
