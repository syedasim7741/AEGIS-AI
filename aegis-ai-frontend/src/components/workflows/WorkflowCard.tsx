import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

export type WorkflowStatus = "Active" | "Paused" | "Draft";

export type WorkflowTrigger =
  | "Alert Trigger"
  | "Scheduled"
  | "Manual"
  | "AI Decision";

interface WorkflowCardProps {
  name: string;
  description: string;
  workflowId: string;
  trigger: WorkflowTrigger;
  status: WorkflowStatus;
  lastRun: string;
  successRate: number;
  actionCount: number;
  isRunning: boolean;
  isUpdating: boolean;
  onToggle: () => void;
  onRun: () => void;
}

const statusColorMap: Record<
  WorkflowStatus,
  "success" | "warning" | "default"
> = {
  Active: "success",
  Paused: "warning",
  Draft: "default",
};

export function WorkflowCard({
  name,
  description,
  workflowId,
  trigger,
  status,
  lastRun,
  successRate,
  actionCount,
  isRunning,
  isUpdating,
  onToggle,
  onRun,
}: WorkflowCardProps) {
  const canRun = status !== "Draft";

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
                  color: "secondary.main",
                  backgroundColor: "rgba(0, 194, 168, 0.12)",
                }}
              >
                <BoltRoundedIcon />
              </Box>

              <Box>
                <Typography sx={{
                  fontWeight: 700
                }}>{name}</Typography>

                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  {workflowId}
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

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              lineHeight: 1.7,
              minHeight: 48
            }}>
            {description}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap sx={{
            flexWrap: "wrap"
          }}>
            <Chip
              label={trigger}
              size="small"
              color="primary"
              variant="outlined"
            />

            <Chip
              label={`${actionCount} actions`}
              size="small"
              variant="outlined"
            />
          </Stack>

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
                backgroundColor: "rgba(255, 255, 255, 0.025)",
              }}
            >
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Success rate
              </Typography>

              <Typography sx={{
                fontWeight: 700
              }}>{successRate}%</Typography>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "rgba(255, 255, 255, 0.025)",
              }}
            >
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Last execution
              </Typography>

              <Typography variant="body2" sx={{
                fontWeight: 700
              }}>
                {lastRun}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} sx={{
            alignItems: "center"
          }}>
            <ScheduleRoundedIcon
              sx={{
                fontSize: 18,
                color: "text.secondary",
              }}
            />

            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              Trigger type: {trigger}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              pt: 1,
              borderTop: "1px solid",
              borderColor: "divider"
            }}>
            <Stack direction="row" spacing={0.5} sx={{
              alignItems: "center"
            }}>
              <Switch
                checked={status === "Active"}
                onChange={onToggle}
                disabled={status === "Draft" || isUpdating}
                color="success"
              />

              <Typography variant="body2">
                {status === "Active" ? "Enabled" : "Disabled"}
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              startIcon={
                isRunning ? (
                  <CircularProgress size={17} color="inherit" />
                ) : (
                  <PlayArrowRoundedIcon />
                )
              }
              disabled={!canRun || isRunning || isUpdating}
              onClick={onRun}
            >
              {isRunning ? "Running" : "Run now"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
