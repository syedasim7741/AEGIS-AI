import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";

import type { RobotStatus, RobotType } from "../../services/robotService";

interface RobotStatusCardProps {
  name: string;
  robotCode: string;
  robotType: RobotType;
  facility: string;
  productionLine: string | null;
  status: RobotStatus;
  healthScore: number;
  temperatureCelsius: number | null;
  utilizationPercent: number;
  currentTask: string | null;
  errorCode: string | null;
}

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

export function RobotStatusCard({
  name,
  robotCode,
  robotType,
  facility,
  productionLine,
  status,
  healthScore,
  temperatureCelsius,
  utilizationPercent,
  currentTask,
  errorCode,
}: RobotStatusCardProps) {
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
          borderColor: "primary.main",
        },
      }}
    >
      <CardContent>
        <Stack spacing={3}>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: "flex-start",

              justifyContent: "space-between",
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2,
                  color: "primary.light",

                  backgroundColor: "rgba(47, 128, 237, 0.14)",
                }}
              >
                <PrecisionManufacturingRoundedIcon />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {name}
                </Typography>

                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {robotCode}
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

          <Box>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              {robotType}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
              }}
            >
              {facility}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",

                display: "block",
                mt: 0.25,
              }}
            >
              {productionLine ?? "No production line assigned"}
            </Typography>
          </Box>

          <Box>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",

                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                }}
              >
                Robot Health
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                }}
              >
                {healthScore.toFixed(1)}%
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
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Temperature
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                {formatTemperature(temperatureCelsius)}
              </Typography>
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
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Utilization
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                {utilizationPercent.toFixed(1)}%
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: errorCode ? "error.main" : "divider",

              backgroundColor: "rgba(255,255,255,0.025)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",

                display: "block",
              }}
            >
              Current Task
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                fontWeight: 600,
              }}
            >
              {currentTask ?? "No active task"}
            </Typography>

            {errorCode && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1,
                  color: "error.main",
                  fontWeight: 700,
                }}
              >
                Error: {errorCode}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
