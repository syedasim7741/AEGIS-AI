import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type KeyboardEvent,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

import {
  CopilotMessage,
  type CopilotMessageData,
} from "../components/copilot/CopilotMessage";

import {
  approveAgentPlan,
  getAgentErrorMessage,
  runAgentGoal,
  type AgentPlan,
} from "../services/agentService";


interface CopilotState {
  messages: CopilotMessageData[];
  input: string;
  isResponding: boolean;
  approvingMessageId: string | null;
  pageError: string | null;
}


type CopilotAction =
  | {
      type: "SET_INPUT";
      payload: string;
    }
  | {
      type: "ADD_MESSAGE";
      payload: CopilotMessageData;
    }
  | {
      type: "UPDATE_MESSAGE";
      payload: {
        messageId: string;
        message: CopilotMessageData;
      };
    }
  | {
      type: "SET_RESPONDING";
      payload: boolean;
    }
  | {
      type: "SET_APPROVING";
      payload: string | null;
    }
  | {
      type: "SET_PAGE_ERROR";
      payload: string | null;
    }
  | {
      type: "CLEAR_CHAT";
    };


const initialMessage: CopilotMessageData = {
  id: "welcome-message",
  role: "assistant",
  content:
    "Hello, I am the AEGIS Industrial Copilot.\n\n" +
    "I can inspect machines and robots, review predictive-maintenance risks, " +
    "search uploaded documents, analyze work orders and prepare protected " +
    "maintenance actions for your approval.",
  timestamp: "Now",
};


const initialState: CopilotState = {
  messages: [initialMessage],
  input: "",
  isResponding: false,
  approvingMessageId: null,
  pageError: null,
};


function copilotReducer(
  state: CopilotState,
  action: CopilotAction,
): CopilotState {
  switch (action.type) {
    case "SET_INPUT":
      return {
        ...state,
        input: action.payload,
      };

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          action.payload,
        ],
      };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map(
          (message) =>
            message.id === action.payload.messageId
              ? action.payload.message
              : message,
        ),
      };

    case "SET_RESPONDING":
      return {
        ...state,
        isResponding: action.payload,
      };

    case "SET_APPROVING":
      return {
        ...state,
        approvingMessageId: action.payload,
      };

    case "SET_PAGE_ERROR":
      return {
        ...state,
        pageError: action.payload,
      };

    case "CLEAR_CHAT":
      return initialState;

    default:
      return state;
  }
}


const suggestedPrompts = [
  {
    label: "Review machine health",
    icon: (
      <EngineeringRoundedIcon
        fontSize="small"
      />
    ),
    prompt:
      "Review the current machine health summary and identify anything requiring attention.",
  },
  {
    label: "Analyze robot fleet",
    icon: (
      <SmartToyRoundedIcon
        fontSize="small"
      />
    ),
    prompt:
      "Analyze the current robot fleet health and identify robots requiring attention.",
  },
  {
    label: "Review maintenance risks",
    icon: (
      <PsychologyRoundedIcon
        fontSize="small"
      />
    ),
    prompt:
      "Review predictive-maintenance assessments and summarize the highest-risk machines.",
  },
  {
    label: "Check safety procedure",
    icon: (
      <DescriptionRoundedIcon
        fontSize="small"
      />
    ),
    prompt:
      "Using the uploaded documents, explain what an operator should do when a machine produces smoke.",
  },
];


function getCurrentTime(): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date());
}


function createErrorMessage(
  error: unknown,
): CopilotMessageData {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: getAgentErrorMessage(error),
    timestamp: getCurrentTime(),
    isError: true,
  };
}


export function AICopilotPage() {
  const [state, dispatch] = useReducer(
    copilotReducer,
    initialState,
  );

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    state.messages,
    state.isResponding,
    state.approvingMessageId,
  ]);


  const sendMessage = useCallback(
    async (
      messageText?: string,
    ) => {
      const finalMessage = (
        messageText ?? state.input
      ).trim();

      if (
        !finalMessage ||
        state.isResponding ||
        state.approvingMessageId
      ) {
        return;
      }

      const userMessage: CopilotMessageData = {
        id: crypto.randomUUID(),
        role: "user",
        content: finalMessage,
        timestamp: getCurrentTime(),
      };

      dispatch({
        type: "ADD_MESSAGE",
        payload: userMessage,
      });

      dispatch({
        type: "SET_INPUT",
        payload: "",
      });

      dispatch({
        type: "SET_PAGE_ERROR",
        payload: null,
      });

      dispatch({
        type: "SET_RESPONDING",
        payload: true,
      });

      try {
        const execution =
          await runAgentGoal(
            finalMessage,
          );

        const assistantMessage:
          CopilotMessageData = {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              execution.result.answer,
            timestamp: getCurrentTime(),
            execution,
          };

        dispatch({
          type: "ADD_MESSAGE",
          payload: assistantMessage,
        });
      } catch (error) {
        dispatch({
          type: "ADD_MESSAGE",
          payload:
            createErrorMessage(error),
        });
      } finally {
        dispatch({
          type: "SET_RESPONDING",
          payload: false,
        });
      }
    },
    [
      state.input,
      state.isResponding,
      state.approvingMessageId,
    ],
  );


  const approvePlan = useCallback(
    async (
      messageId: string,
      plan: AgentPlan,
    ) => {
      if (
        state.isResponding ||
        state.approvingMessageId
      ) {
        return;
      }

      dispatch({
        type: "SET_PAGE_ERROR",
        payload: null,
      });

      dispatch({
        type: "SET_APPROVING",
        payload: messageId,
      });

      try {
        const execution =
          await approveAgentPlan(plan);

        const approvedMessage:
          CopilotMessageData = {
            id: messageId,
            role: "assistant",
            content:
              execution.result.answer,
            timestamp: getCurrentTime(),
            execution,
          };

        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            messageId,
            message: approvedMessage,
          },
        });
      } catch (error) {
        dispatch({
          type: "SET_PAGE_ERROR",
          payload:
            getAgentErrorMessage(error),
        });
      } finally {
        dispatch({
          type: "SET_APPROVING",
          payload: null,
        });
      }
    },
    [
      state.isResponding,
      state.approvingMessageId,
    ],
  );


  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void sendMessage();
    }
  }


  function clearConversation() {
    if (
      state.isResponding ||
      state.approvingMessageId
    ) {
      return;
    }

    dispatch({
      type: "CLEAR_CHAT",
    });
  }


  const isBusy =
    state.isResponding ||
    Boolean(
      state.approvingMessageId,
    );


  return (
    <Stack
      spacing={3}
      sx={{
        height: "100%",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        sx={{
          justifyContent:
            "space-between",

          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            AI Copilot
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 1,
            }}
          >
            Plan and execute industrial
            operations using real AEGIS tools,
            live database information and local AI.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={
            <DeleteOutlineRoundedIcon />
          }
          onClick={clearConversation}
          disabled={isBusy}
        >
          Clear conversation
        </Button>
      </Stack>

      {state.pageError && (
        <Alert
          severity="error"
          onClose={() =>
            dispatch({
              type: "SET_PAGE_ERROR",
              payload: null,
            })
          }
        >
          {state.pageError}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(0, 1fr) 320px",
          },

          gap: 3,
          minHeight: 650,
        }}
      >
        <Card
          sx={{
            minWidth: 0,
            backgroundImage: "none",
            backgroundColor:
              "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              p: 0,

              "&:last-child": {
                pb: 0,
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                px: 3,
                py: 2,
                borderBottom:
                  "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2,
                  color: "secondary.main",

                  backgroundColor:
                    "rgba(0, 194, 168, 0.12)",
                }}
              >
                <SmartToyRoundedIcon />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  AEGIS Industrial Agent
                </Typography>

                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",

                      backgroundColor:
                        "success.main",
                    }}
                  />

                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        "text.secondary",
                    }}
                  >
                    FastAPI + Ollama + Agent Tools
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            <Stack
              spacing={2.5}
              sx={{
                flexGrow: 1,
                minHeight: 0,
                maxHeight: 540,
                overflowY: "auto",

                px: {
                  xs: 2,
                  md: 3,
                },

                py: 3,
              }}
            >
              {state.messages.map(
                (message) => (
                  <CopilotMessage
                    key={message.id}
                    message={message}
                    onApprove={
                      approvePlan
                    }
                    isApproving={
                      state.approvingMessageId ===
                      message.id
                    }
                  />
                ),
              )}

              {state.isResponding && (
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <CircularProgress
                    size={20}
                    color="secondary"
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        "text.secondary",
                    }}
                  >
                    AEGIS AI is planning and
                    executing the request...
                  </Typography>
                </Stack>
              )}

              <div ref={messagesEndRef} />
            </Stack>

            <Box
              sx={{
                p: {
                  xs: 2,
                  md: 3,
                },

                borderTop:
                  "1px solid",

                borderColor: "divider",
              }}
            >
              <Stack
                direction="row"
                spacing={1.5}
              >
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Ask about machines, robots, maintenance, work orders or uploaded documents..."
                  value={state.input}

                  onChange={(event) =>
                    dispatch({
                      type: "SET_INPUT",
                      payload:
                        event.target.value,
                    })
                  }

                  onKeyDown={
                    handleKeyDown
                  }

                  disabled={isBusy}
                />

                <IconButton
                  color="primary"
                  aria-label="Send message"

                  onClick={() =>
                    void sendMessage()
                  }

                  disabled={
                    !state.input.trim() ||
                    isBusy
                  }

                  sx={{
                    width: 52,
                    height: 52,
                    alignSelf: "flex-end",
                    backgroundColor:
                      "primary.main",
                    color: "#ffffff",

                    "&:hover": {
                      backgroundColor:
                        "primary.dark",
                    },

                    "&.Mui-disabled": {
                      backgroundColor:
                        "rgba(255, 255, 255, 0.06)",
                    },
                  }}
                >
                  <SendRoundedIcon />
                </IconButton>
              </Stack>

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  display: "block",
                  mt: 1,
                }}
              >
                Press Enter to send. Press
                Shift + Enter for a new line.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Stack spacing={3}>
          <Card
            sx={{
              backgroundImage: "none",
              backgroundColor:
                "background.paper",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <AutoAwesomeRoundedIcon
                    color="primary"
                  />

                  <Typography
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Suggested prompts
                  </Typography>
                </Stack>

                {suggestedPrompts.map(
                  (item) => (
                    <Button
                      key={item.label}
                      variant="outlined"
                      color="inherit"
                      startIcon={item.icon}
                      disabled={isBusy}

                      onClick={() =>
                        void sendMessage(
                          item.prompt,
                        )
                      }

                      sx={{
                        justifyContent:
                          "flex-start",
                        textAlign: "left",
                        py: 1.25,
                      }}
                    >
                      {item.label}
                    </Button>
                  ),
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              backgroundImage: "none",
              backgroundColor:
                "background.paper",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Typography
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  Connected capabilities
                </Typography>

                <Chip
                  label="Machine operations"
                  color="primary"
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label="Robot operations"
                  color="secondary"
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label="Predictive maintenance"
                  color="warning"
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label="Work orders"
                  color="success"
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label="RAG documents"
                  color="info"
                  variant="outlined"
                  size="small"
                />

                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    pt: 0.5,
                  }}
                >
                  Protected database actions pause
                  until an administrator approves them.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}
