import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";

import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";

import {
  useLiveTelemetry,
  type LiveTelemetryStatus as TelemetryConnectionStatus,
} from "../../hooks/useLiveTelemetry";

type StatusColor = "default" | "success" | "warning" | "error" | "info";

interface StatusPresentation {
  label: string;
  color: StatusColor;
}

const statusPresentationMap: Record<
  TelemetryConnectionStatus,
  StatusPresentation
> = {
  disconnected: {
    label: "Disconnected",
    color: "default",
  },

  connecting: {
    label: "Connecting",
    color: "info",
  },

  connected: {
    label: "Live",
    color: "success",
  },

  reconnecting: {
    label: "Reconnecting",
    color: "warning",
  },

  error: {
    label: "Connection Error",
    color: "error",
  },
};

function formatLastUpdated(timestamp: string | null): string {
  if (!timestamp) {
    return "Waiting for telemetry";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Telemetry received";
  }

  return `Updated ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

export function LiveTelemetryStatus() {
  const { status, lastUpdatedAt, errorMessage } = useLiveTelemetry();

  const presentation = statusPresentationMap[status];

  const isConnecting = status === "connecting" || status === "reconnecting";

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: status === "error" ? "error.main" : "divider",

        backgroundColor: "background.paper",
      }}
    >
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
        }}
      >
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
            }}
          >
            Live Industrial Telemetry
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 0.5,
              color: errorMessage ? "error.main" : "text.secondary",
            }}
          >
            {errorMessage ?? formatLastUpdated(lastUpdatedAt)}
          </Typography>
        </Box>

        <Chip
          label={presentation.label}
          color={presentation.color}
          variant="outlined"
          icon={
            isConnecting ? (
              <CircularProgress size={14} color="inherit" />
            ) : status === "disconnected" ? (
              <WifiOffRoundedIcon />
            ) : (
              <FiberManualRecordRoundedIcon />
            )
          }
          sx={{
            fontWeight: 700,
          }}
        />
      </Stack>
    </Box>
  );
}
