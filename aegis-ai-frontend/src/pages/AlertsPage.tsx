import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { AlertCard } from "../components/alerts/AlertCard";
import { MetricCard } from "../components/dashboard/MetricCard";

import {
  markAlertAsRead,
  markAllAlertsAsRead,
  updateAlertStatus,
  type AlertStatus,
} from "../store/slices/alertsSlice";

import { useAppDispatch, useAppSelector } from "../store/hooks";

type AlertFilter = "All" | AlertStatus | "Unread";

const filters: AlertFilter[] = [
  "All",
  "Unread",
  "Open",
  "Investigating",
  "Resolved",
];

export function AlertsPage() {
  const dispatch = useAppDispatch();

  const alerts = useAppSelector((state) => state.alerts.alerts);

  const [selectedFilter, setSelectedFilter] = useState<AlertFilter>("All");

  const [searchText, setSearchText] = useState("");

  const filteredAlerts = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesFilter =
        selectedFilter === "All" ||
        (selectedFilter === "Unread"
          ? !alert.isRead
          : alert.status === selectedFilter);

      const matchesSearch =
        !normalizedSearch ||
        alert.title.toLowerCase().includes(normalizedSearch) ||
        alert.description.toLowerCase().includes(normalizedSearch) ||
        alert.module.toLowerCase().includes(normalizedSearch) ||
        alert.location.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [alerts, selectedFilter, searchText]);

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  const openCount = alerts.filter((alert) => alert.status === "Open").length;

  const investigatingCount = alerts.filter(
    (alert) => alert.status === "Investigating",
  ).length;

  const resolvedCount = alerts.filter(
    (alert) => alert.status === "Resolved",
  ).length;

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
          }
        }}>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 700
          }}>
            Alerts & Notifications
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 1
            }}>
            Review operational alerts, investigate incidents and resolve system
            notifications.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<MarkEmailReadRoundedIcon />}
          disabled={unreadCount === 0}
          onClick={() => dispatch(markAllAlertsAsRead())}
        >
          Mark all as read
        </Button>
      </Stack>
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
          title="Unread Alerts"
          value={String(unreadCount)}
          description="New notifications requiring review"
          icon={<NotificationsActiveRoundedIcon />}
          iconBackground="rgba(47, 128, 237, 0.14)"
          iconColor="#56a0ff"
        />

        <MetricCard
          title="Open Alerts"
          value={String(openCount)}
          description="Alerts requiring operational action"
          icon={<ErrorRoundedIcon />}
          iconBackground="rgba(235, 87, 87, 0.14)"
          iconColor="#eb5757"
        />

        <MetricCard
          title="Investigating"
          value={String(investigatingCount)}
          description="Alerts currently under review"
          icon={<VisibilityRoundedIcon />}
          iconBackground="rgba(242, 201, 76, 0.14)"
          iconColor="#f2c94c"
        />

        <MetricCard
          title="Resolved"
          value={String(resolvedCount)}
          description="Successfully closed alerts"
          icon={<CheckCircleRoundedIcon />}
          iconBackground="rgba(39, 174, 96, 0.14)"
          iconColor="#27ae60"
        />
      </Box>
      <Stack spacing={2}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
          sx={{
            justifyContent: "space-between"
          }}
        >
          <Stack direction="row" spacing={1} useFlexGap sx={{
            flexWrap: "wrap"
          }}>
            {filters.map((filter) => (
              <Chip
                key={filter}
                label={filter}
                clickable
                color={selectedFilter === filter ? "primary" : "default"}
                variant={selectedFilter === filter ? "filled" : "outlined"}
                onClick={() => setSelectedFilter(filter)}
              />
            ))}
          </Stack>

          <TextField
            size="small"
            placeholder="Search alerts..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            sx={{
              width: {
                xs: "100%",
                md: 330,
              },
            }}
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
        </Stack>

        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </Typography>
      </Stack>
      {filteredAlerts.length > 0 ? (
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
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onRead={() => dispatch(markAlertAsRead(alert.id))}
              onStatusChange={(status) =>
                dispatch(
                  updateAlertStatus({
                    alertId: alert.id,
                    status,
                  }),
                )
              }
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
          <Typography sx={{
            fontWeight: 700
          }}>No alerts found</Typography>

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 1
            }}>
            Change the selected filter or search term.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
