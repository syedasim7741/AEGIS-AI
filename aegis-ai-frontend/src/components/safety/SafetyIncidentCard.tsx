import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

export type SafetySeverity = "Critical" | "High" | "Medium" | "Low";

export type SafetyIncidentStatus = "Open" | "Investigating" | "Resolved";

interface SafetyIncidentCardProps {
  title: string;
  incidentId: string;
  location: string;
  time: string;
  description: string;
  severity: SafetySeverity;
  status: SafetyIncidentStatus;
}

const severityColorMap: Record<
  SafetySeverity,
  "error" | "warning" | "info" | "success"
> = {
  Critical: "error",
  High: "warning",
  Medium: "info",
  Low: "success",
};

const statusColorMap: Record<
  SafetyIncidentStatus,
  "error" | "warning" | "success"
> = {
  Open: "error",
  Investigating: "warning",
  Resolved: "success",
};

export function SafetyIncidentCard({
  title,
  incidentId,
  location,
  time,
  description,
  severity,
  status,
}: SafetyIncidentCardProps) {
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
          borderColor: "warning.main",
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
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2,
                  color: "warning.main",
                  backgroundColor: "rgba(242, 201, 76, 0.12)",
                }}
              >
                <WarningAmberRoundedIcon />
              </Box>

              <Box>
                <Typography sx={{
                  fontWeight: 700
                }}>{title}</Typography>

                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  {incidentId}
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={severity}
              color={severityColorMap[severity]}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {description}
          </Typography>

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
                {location}
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
                {time}
              </Typography>
            </Stack>
          </Stack>

          <Chip
            label={status}
            color={statusColorMap[status]}
            size="small"
            sx={{
              alignSelf: "flex-start",
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
