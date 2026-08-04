import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

import type {
  AgentExecutionResponse,
  AgentPlan,
} from "../../services/agentService";


export type CopilotRole =
  | "user"
  | "assistant";


export interface CopilotMessageData {
  id: string;
  role: CopilotRole;
  content: string;
  timestamp: string;

  execution?: AgentExecutionResponse;
  isError?: boolean;
}


interface CopilotMessageProps {
  message: CopilotMessageData;

  onApprove?: (
    messageId: string,
    plan: AgentPlan,
  ) => void;

  isApproving?: boolean;
}


function formatToolName(
  toolName: string,
): string {
  return toolName
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}


function cleanBasicMarkdown(
  content: string,
): string {
  return content.replace(
    /\*\*(.*?)\*\*/g,
    "$1",
  );
}


function formatArgumentLabel(
  argumentName: string,
): string {
  return argumentName
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}


function formatArgumentValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not provided";
  }

  if (typeof value === "object") {
    return JSON.stringify(
      value,
      null,
      2,
    );
  }

  return String(value);
}


export function CopilotMessage({
  message,
  onApprove,
  isApproving = false,
}: CopilotMessageProps) {
  const isUser = message.role === "user";

  const execution = message.execution;

  const plannedToolCount =
    execution?.plan.tool_calls.length ?? 0;

  const trace =
    execution?.result.trace ?? [];

  const requiresApproval =
    execution?.result.requires_approval ??
    false;

  const protectedToolCalls =
    execution?.plan.tool_calls.filter(
      (toolCall) =>
        toolCall.tool ===
        "create_work_order",
    ) ?? [];

  return (
    <Stack
      direction={
        isUser
          ? "row-reverse"
          : "row"
      }
      spacing={1.5}
      sx={{
        alignItems: "flex-start",
      }}
    >
      <Avatar
        sx={{
          width: 38,
          height: 38,

          backgroundColor: isUser
            ? "primary.main"
            : message.isError
              ? "error.main"
              : "secondary.main",

          color: "#ffffff",
        }}
      >
        {isUser ? (
          <PersonRoundedIcon
            fontSize="small"
          />
        ) : message.isError ? (
          <ErrorOutlineRoundedIcon
            fontSize="small"
          />
        ) : (
          <SmartToyRoundedIcon
            fontSize="small"
          />
        )}
      </Avatar>

      <Box
        sx={{
          width: "100%",

          maxWidth: {
            xs: "85%",
            md: "78%",
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.5,

            backgroundImage: "none",

            backgroundColor: isUser
              ? "rgba(47, 128, 237, 0.18)"
              : message.isError
                ? "rgba(211, 47, 47, 0.08)"
                : "rgba(255, 255, 255, 0.045)",

            border: "1px solid",

            borderColor: isUser
              ? "rgba(47, 128, 237, 0.35)"
              : message.isError
                ? "error.main"
                : "divider",

            borderRadius: 2.5,
          }}
        >
          <Typography
            variant="body2"
            component="div"
            sx={{
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {cleanBasicMarkdown(
              message.content,
            )}
          </Typography>

          {!isUser && execution && (
            <Stack
              spacing={1.5}
              sx={{
                mt: 2,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  label={
                    `${plannedToolCount} planned`
                  }
                  size="small"
                  variant="outlined"
                  color="info"
                />

                <Chip
                  label={
                    `${trace.length} executed`
                  }
                  size="small"
                  variant="outlined"
                  color="secondary"
                />

                {requiresApproval && (
                  <Chip
                    label="Approval required"
                    size="small"
                    color="warning"
                  />
                )}
              </Stack>

              {trace.length > 0 && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,

                    border: "1px solid",
                    borderColor: "divider",

                    backgroundColor:
                      "rgba(0, 0, 0, 0.12)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mb: 1,
                      fontWeight: 700,
                      color: "text.secondary",
                    }}
                  >
                    Execution trace
                  </Typography>

                  <Stack spacing={1}>
                    {trace.map((step) => (
                      <Stack
                        key={
                          `${step.sequence}-${step.tool_call.tool}`
                        }
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems:
                            "flex-start",
                        }}
                      >
                        {step.tool_result.success ? (
                          <CheckCircleRoundedIcon
                            color="success"
                            sx={{
                              fontSize: 18,
                              mt: 0.15,
                            }}
                          />
                        ) : (
                          <ErrorOutlineRoundedIcon
                            color="error"
                            sx={{
                              fontSize: 18,
                              mt: 0.15,
                            }}
                          />
                        )}

                        <Box
                          sx={{
                            flexGrow: 1,
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontWeight: 700,
                            }}
                          >
                            {formatToolName(
                              step.tool_call.tool,
                            )}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              color:
                                "text.secondary",
                            }}
                          >
                            {
                              step.tool_call
                                .reason
                            }
                          </Typography>

                          {step.tool_result.error && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                mt: 0.5,
                                color:
                                  "error.main",
                              }}
                            >
                              {
                                step.tool_result
                                  .error
                              }
                            </Typography>
                          )}
                        </Box>

                        <Chip
                          label={
                            `${step.tool_result.execution_time_ms.toFixed(1)} ms`
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}

              {requiresApproval && (
                <Alert
                  severity="warning"
                  variant="outlined"
                  sx={{
                    alignItems: "flex-start",
                  }}
                >
                  <Stack spacing={1.25}>
                    <Typography
                      variant="body2"
                    >
                      {
                        execution.result
                          .approval_message
                      }
                    </Typography>

                    {protectedToolCalls.map(
                      (
                        toolCall,
                        toolIndex,
                      ) => (
                        <Box
                          key={
                            `${toolCall.tool}-${toolIndex}`
                          }
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            border:
                              "1px solid",
                            borderColor:
                              "warning.main",
                            backgroundColor:
                              "rgba(237, 108, 2, 0.06)",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display:
                                "block",
                              mb: 1,
                              fontWeight: 700,
                            }}
                          >
                            Exact action details
                          </Typography>

                          <Stack spacing={1}>
                            {Object.entries(
                              toolCall.arguments,
                            ).map(
                              ([
                                argumentName,
                                argumentValue,
                              ]) => (
                                <Box
                                  key={
                                    argumentName
                                  }
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display:
                                        "block",
                                      color:
                                        "text.secondary",
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    {formatArgumentLabel(
                                      argumentName,
                                    )}
                                  </Typography>

                                  <Typography
                                    variant="body2"
                                    sx={{
                                      whiteSpace:
                                        "pre-wrap",
                                      overflowWrap:
                                        "anywhere",
                                    }}
                                  >
                                    {formatArgumentValue(
                                      argumentValue,
                                    )}
                                  </Typography>
                                </Box>
                              ),
                            )}
                          </Stack>
                        </Box>
                      ),
                    )}

                    <Button
                      variant="contained"
                      color="warning"
                      size="small"

                      startIcon={
                        isApproving ? (
                          <CircularProgress
                            size={16}
                            color="inherit"
                          />
                        ) : (
                          <LockOpenRoundedIcon />
                        )
                      }

                      disabled={
                        isApproving ||
                        !onApprove
                      }

                      onClick={() =>
                        onApprove?.(
                          message.id,
                          execution.plan,
                        )
                      }

                      sx={{
                        alignSelf:
                          "flex-start",
                      }}
                    >
                      {isApproving
                        ? "Executing approved action..."
                        : "Approve exact action"}
                    </Button>
                  </Stack>
                </Alert>
              )}
            </Stack>
          )}
        </Paper>

        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            display: "block",
            mt: 0.5,

            textAlign: isUser
              ? "right"
              : "left",
          }}
        >
          {message.timestamp}
        </Typography>
      </Box>
    </Stack>
  );
}
