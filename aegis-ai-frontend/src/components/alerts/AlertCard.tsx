import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";

import type {
  AlertSeverity,
  AlertStatus,
  IndustrialAlert,
} from "../../store/slices/alertsSlice";

interface AlertCardProps {
  alert: IndustrialAlert;
  onRead: () => void;
  onStatusChange: (status: AlertStatus) => void;
}

const severityColorMap: Record<
  AlertSeverity,
  "error" | "warning" | "info" | "success"
> = {
  Critical: "error",
  High: "warning",
  Medium: "info",
  Low: "success",
};

const statusColorMap: Record<AlertStatus, "error" | "warning" | "success"> = {
  Open: "error",
  Investigating: "warning",
  Resolved: "success",
};

export function AlertCard({ alert, onRead, onStatusChange }: AlertCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        backgroundImage: "none",
        backgroundColor: alert.isRead
          ? "background.paper"
          : "rgba(47, 128, 237, 0.08)",
        border: "1px solid",
        borderColor: alert.isRead ? "divider" : "primary.main",
        transition: "transform 0.2s ease, border-color 0.2s ease",

        "&:hover": {
          transform: "translateY(-3px)",
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
                  color: alert.isRead ? "text.secondary" : "primary.light",
                  backgroundColor: "rgba(47, 128, 237, 0.14)",
                }}
              >
                <NotificationsActiveRoundedIcon />
              </Box>

              <Box>
                <Stack direction="row" spacing={1} sx={{
                  alignItems: "center"
                }}>
                  <Typography sx={{
                    fontWeight: 700
                  }}>{alert.title}</Typography>

                  {!alert.isRead && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "primary.main",
                      }}
                    />
                  )}
                </Stack>

                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  {alert.id}
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={alert.severity}
              color={severityColorMap[alert.severity]}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              lineHeight: 1.7
            }}>
            {alert.description}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap sx={{
            flexWrap: "wrap"
          }}>
            <Chip
              label={alert.module}
              size="small"
              color="primary"
              variant="outlined"
            />

            <Chip
              label={alert.status}
              size="small"
              color={statusColorMap[alert.status]}
              variant="outlined"
            />
          </Stack>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
          >
            <Stack direction="row" spacing={0.75} sx={{
              alignItems: "center"
            }}>
              <LocationOnRoundedIcon
                sx={{
                  fontSize: 18,
                  color: "text.secondary",
                }}
              />

              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {alert.location}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.75} sx={{
              alignItems: "center"
            }}>
              <AccessTimeRoundedIcon
                sx={{
                  fontSize: 18,
                  color: "text.secondary",
                }}
              />

              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {alert.timestamp}
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              flexWrap: "wrap",
              pt: 1,
              borderTop: "1px solid",
              borderColor: "divider"
            }}>
            {!alert.isRead && (
              <Button size="small" variant="outlined" onClick={onRead}>
                Mark as read
              </Button>
            )}

            {alert.status === "Open" && (
              <Button
                size="small"
                color="warning"
                variant="outlined"
                onClick={() => onStatusChange("Investigating")}
              >
                Start investigation
              </Button>
            )}

            {alert.status !== "Resolved" && (
              <Button
                size="small"
                color="success"
                variant="outlined"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => onStatusChange("Resolved")}
              >
                Resolve
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
