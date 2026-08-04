import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import { MetricCard } from "../components/dashboard/MetricCard";

import {
  WorkflowCard,
  type WorkflowStatus,
  type WorkflowTrigger,
} from "../components/workflows/WorkflowCard";

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  status: WorkflowStatus;
  lastRun: string;
  successRate: number;
  actionCount: number;
}

type WorkflowFilter = "All" | WorkflowStatus;

const initialWorkflows: WorkflowItem[] = [
  {
    id: "WF-AEG-001",
    name: "Critical Machine Alert",
    description:
      "Creates a maintenance ticket, alerts the engineering team and records the incident when equipment health becomes critical.",
    trigger: "Alert Trigger",
    status: "Active",
    lastRun: "12 minutes ago",
    successRate: 98,
    actionCount: 4,
  },
  {
    id: "WF-AEG-002",
    name: "Daily Operations Summary",
    description:
      "Generates an AI operational summary and sends it to plant managers at the end of every production day.",
    trigger: "Scheduled",
    status: "Active",
    lastRun: "Yesterday",
    successRate: 100,
    actionCount: 3,
  },
  {
    id: "WF-AEG-003",
    name: "PPE Violation Response",
    description:
      "Captures evidence, creates a safety incident and notifies the safety officer when a PPE violation is detected.",
    trigger: "AI Decision",
    status: "Active",
    lastRun: "35 minutes ago",
    successRate: 96,
    actionCount: 5,
  },
  {
    id: "WF-AEG-004",
    name: "Robot Maintenance Reminder",
    description:
      "Checks robot service dates and sends maintenance reminders before scheduled service deadlines.",
    trigger: "Scheduled",
    status: "Paused",
    lastRun: "3 days ago",
    successRate: 94,
    actionCount: 3,
  },
  {
    id: "WF-AEG-005",
    name: "Defect Escalation",
    description:
      "Escalates high-confidence visual defects to the quality-control manager and pauses the affected production process.",
    trigger: "AI Decision",
    status: "Paused",
    lastRun: "5 days ago",
    successRate: 92,
    actionCount: 4,
  },
  {
    id: "WF-AEG-006",
    name: "Weekly Maintenance Report",
    description:
      "Draft workflow for generating a weekly maintenance report using equipment-health and service-history data.",
    trigger: "Manual",
    status: "Draft",
    lastRun: "Never",
    successRate: 0,
    actionCount: 2,
  },
];

const filters: WorkflowFilter[] = ["All", "Active", "Paused", "Draft"];

export function WorkflowAutomationPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(initialWorkflows);

  const [selectedFilter, setSelectedFilter] = useState<WorkflowFilter>("All");

  const [searchText, setSearchText] = useState("");

  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(
    null,
  );

  const [isPending, startTransition] = useTransition();

  const executionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }
    };
  }, []);

  const filteredWorkflows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return workflows.filter((workflow) => {
      const matchesFilter =
        selectedFilter === "All" || workflow.status === selectedFilter;

      const matchesSearch =
        !normalizedSearch ||
        workflow.name.toLowerCase().includes(normalizedSearch) ||
        workflow.description.toLowerCase().includes(normalizedSearch) ||
        workflow.trigger.toLowerCase().includes(normalizedSearch) ||
        workflow.id.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [workflows, selectedFilter, searchText]);

  const activeCount = workflows.filter(
    (workflow) => workflow.status === "Active",
  ).length;

  const successfulRuns = workflows.filter(
    (workflow) => workflow.successRate >= 95,
  ).length;

  const pausedCount = workflows.filter(
    (workflow) => workflow.status === "Paused",
  ).length;

  function toggleWorkflow(workflowId: string) {
    startTransition(() => {
      setWorkflows((currentWorkflows) =>
        currentWorkflows.map((workflow) => {
          if (workflow.id !== workflowId || workflow.status === "Draft") {
            return workflow;
          }

          return {
            ...workflow,
            status: workflow.status === "Active" ? "Paused" : "Active",
          };
        }),
      );
    });
  }

  function runWorkflow(workflowId: string) {
    if (runningWorkflowId) {
      return;
    }

    setRunningWorkflowId(workflowId);

    executionTimeoutRef.current = setTimeout(() => {
      setWorkflows((currentWorkflows) =>
        currentWorkflows.map((workflow) =>
          workflow.id === workflowId
            ? {
                ...workflow,
                lastRun: "Just now",
                successRate:
                  workflow.successRate === 0 ? 100 : workflow.successRate,
              }
            : workflow,
        ),
      );

      setRunningWorkflowId(null);
    }, 1200);
  }

  function createDraftWorkflow() {
    const newWorkflow: WorkflowItem = {
      id: `WF-AEG-${String(workflows.length + 1).padStart(3, "0")}`,
      name: `New Automation ${workflows.length + 1}`,
      description:
        "New draft workflow. Configure the trigger, conditions and automated actions before activation.",
      trigger: "Manual",
      status: "Draft",
      lastRun: "Never",
      successRate: 0,
      actionCount: 0,
    };

    setWorkflows((currentWorkflows) => [newWorkflow, ...currentWorkflows]);

    setSelectedFilter("All");
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
          }
        }}>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 700
          }}>
            Workflow Automation
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 1
            }}>
            Automate industrial alerts, maintenance processes, safety responses
            and AI-powered operational tasks.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={createDraftWorkflow}
        >
          Create Workflow
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
          title="Active Workflows"
          value={String(activeCount)}
          description="Automations currently enabled"
          icon={<BoltRoundedIcon />}
          iconBackground="rgba(47, 128, 237, 0.14)"
          iconColor="#56a0ff"
        />

        <MetricCard
          title="Successful Automations"
          value={String(successfulRuns)}
          description="Workflows with at least 95% success"
          icon={<CheckCircleRoundedIcon />}
          iconBackground="rgba(39, 174, 96, 0.14)"
          iconColor="#27ae60"
        />

        <MetricCard
          title="Paused Workflows"
          value={String(pausedCount)}
          description="Automations temporarily disabled"
          icon={<PlayCircleRoundedIcon />}
          iconBackground="rgba(242, 201, 76, 0.14)"
          iconColor="#f2c94c"
        />

        <MetricCard
          title="Failed Runs"
          value="2"
          description="Execution failures during this month"
          icon={<ErrorRoundedIcon />}
          iconBackground="rgba(235, 87, 87, 0.14)"
          iconColor="#eb5757"
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
                onClick={() =>
                  startTransition(() => {
                    setSelectedFilter(filter);
                  })
                }
              />
            ))}
          </Stack>

          <TextField
            size="small"
            placeholder="Search workflows..."
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
          Showing {filteredWorkflows.length} of {workflows.length} workflows
          {isPending ? " • Updating results..." : ""}
        </Typography>
      </Stack>
      {filteredWorkflows.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              xl: "repeat(2, 1fr)",
            },
            gap: 3,
            opacity: isPending ? 0.7 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              name={workflow.name}
              description={workflow.description}
              workflowId={workflow.id}
              trigger={workflow.trigger}
              status={workflow.status}
              lastRun={workflow.lastRun}
              successRate={workflow.successRate}
              actionCount={workflow.actionCount}
              isRunning={runningWorkflowId === workflow.id}
              isUpdating={isPending}
              onToggle={() => toggleWorkflow(workflow.id)}
              onRun={() => runWorkflow(workflow.id)}
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
          }}>No workflows found</Typography>

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
