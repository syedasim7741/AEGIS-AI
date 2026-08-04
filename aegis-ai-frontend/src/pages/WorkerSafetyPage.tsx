import { useMemo, useState } from "react";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";

import AddAlertRoundedIcon from "@mui/icons-material/AddAlertRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { MetricCard } from "../components/dashboard/MetricCard";
import {
  SafetyIncidentCard,
  type SafetyIncidentStatus,
  type SafetySeverity,
} from "../components/safety/SafetyIncidentCard";

interface SafetyIncident {
  id: string;
  title: string;
  location: string;
  time: string;
  description: string;
  severity: SafetySeverity;
  status: SafetyIncidentStatus;
}

type SafetyFilter = "All" | SafetyIncidentStatus;

const safetyIncidents: SafetyIncident[] = [
  {
    id: "SAF-2026-001",
    title: "Missing Safety Helmet",
    location: "Production Line A",
    time: "10 minutes ago",
    description:
      "Computer vision detected a worker entering the assembly zone without a safety helmet.",
    severity: "High",
    status: "Open",
  },
  {
    id: "SAF-2026-002",
    title: "Restricted Zone Entry",
    location: "Robotics Cell B",
    time: "35 minutes ago",
    description:
      "An unauthorized person entered a restricted robotic operating area.",
    severity: "Critical",
    status: "Investigating",
  },
  {
    id: "SAF-2026-003",
    title: "Safety Vest Violation",
    location: "Warehouse Zone 3",
    time: "1 hour ago",
    description:
      "A worker was detected without a reflective safety vest near active forklifts.",
    severity: "Medium",
    status: "Open",
  },
  {
    id: "SAF-2026-004",
    title: "Blocked Emergency Exit",
    location: "Packaging Zone",
    time: "Yesterday",
    description:
      "Materials were found temporarily blocking an emergency exit route.",
    severity: "High",
    status: "Resolved",
  },
];

const filters: SafetyFilter[] = ["All", "Open", "Investigating", "Resolved"];

export function WorkerSafetyPage() {
  const [selectedFilter, setSelectedFilter] = useState<SafetyFilter>("All");

  const filteredIncidents = useMemo(() => {
    if (selectedFilter === "All") {
      return safetyIncidents;
    }

    return safetyIncidents.filter(
      (incident) => incident.status === selectedFilter,
    );
  }, [selectedFilter]);

  const openIncidents = safetyIncidents.filter(
    (incident) => incident.status === "Open",
  ).length;

  const investigatingIncidents = safetyIncidents.filter(
    (incident) => incident.status === "Investigating",
  ).length;

  const resolvedIncidents = safetyIncidents.filter(
    (incident) => incident.status === "Resolved",
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
            Worker Safety
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 1
            }}>
            Monitor PPE compliance, safety incidents and computer-vision alerts
            across industrial zones.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="warning"
          startIcon={<AddAlertRoundedIcon />}
        >
          Report Incident
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
          title="Safety Compliance"
          value="96.8%"
          description="Overall PPE compliance score"
          icon={<HealthAndSafetyRoundedIcon />}
          iconBackground="rgba(39, 174, 96, 0.14)"
          iconColor="#27ae60"
        />

        <MetricCard
          title="Open Incidents"
          value={String(openIncidents)}
          description="Incidents requiring immediate action"
          icon={<ReportProblemRoundedIcon />}
          iconBackground="rgba(235, 87, 87, 0.14)"
          iconColor="#eb5757"
        />

        <MetricCard
          title="Investigating"
          value={String(investigatingIncidents)}
          description="Incidents under safety review"
          icon={<VisibilityRoundedIcon />}
          iconBackground="rgba(242, 201, 76, 0.14)"
          iconColor="#f2c94c"
        />

        <MetricCard
          title="Resolved"
          value={String(resolvedIncidents)}
          description="Incidents successfully closed"
          icon={<CheckCircleRoundedIcon />}
          iconBackground="rgba(0, 194, 168, 0.14)"
          iconColor="#00c2a8"
        />
      </Box>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{
            fontWeight: 700
          }}>
            Safety Incidents
          </Typography>

          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Review recent safety alerts and investigation status
          </Typography>
        </Box>

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
      </Stack>
      {filteredIncidents.length > 0 ? (
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
          {filteredIncidents.map((incident) => (
            <SafetyIncidentCard
              key={incident.id}
              title={incident.title}
              incidentId={incident.id}
              location={incident.location}
              time={incident.time}
              description={incident.description}
              severity={incident.severity}
              status={incident.status}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 3,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Typography sx={{
            fontWeight: 700
          }}>No incidents found</Typography>

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 1
            }}>
            There are no incidents matching this filter.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
