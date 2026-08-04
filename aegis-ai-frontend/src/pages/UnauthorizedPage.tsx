import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LockPersonRoundedIcon from "@mui/icons-material/LockPersonRounded";

import { useLocation, useNavigate } from "react-router";

import { useAppSelector } from "../store/hooks";

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAppSelector((state) => state.auth.user);

  const attemptedPath =
    (
      location.state as {
        attemptedPath?: string;
      } | null
    )?.attemptedPath ?? "the requested module";

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 150px)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 620,
          backgroundImage: "none",
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 3,
              sm: 5,
            },

            "&:last-child": {
              pb: {
                xs: 3,
                sm: 5,
              },
            },
          }}
        >
          <Stack
            spacing={3}
            sx={{
              alignItems: "center",
              textAlign: "center"
            }}>
            <Box
              sx={{
                width: 82,
                height: 82,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: "warning.main",
                backgroundColor: "rgba(242, 201, 76, 0.12)",
                border: "1px solid rgba(242, 201, 76, 0.25)",
              }}
            >
              <LockPersonRoundedIcon
                sx={{
                  fontSize: 42,
                }}
              />
            </Box>

            <Box>
              <Typography variant="h4" sx={{
                fontWeight: 800
              }}>
                Access Restricted
              </Typography>

              <Typography
                sx={{
                  color: "text.secondary",
                  mt: 1.5,
                  lineHeight: 1.7
                }}>
                Your current role does not have permission to open{" "}
                <Box
                  component="span"
                  sx={{
                    color: "text.primary",
                    fontWeight: 700,
                  }}
                >
                  {attemptedPath}
                </Box>
                .
              </Typography>
            </Box>

            <Box
              sx={{
                width: "100%",
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.025)",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                Signed in as
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                  mt: 0.5
                }}>
                {user?.name}
              </Typography>

              <Typography variant="body2" sx={{
                color: "primary.main"
              }}>
                {user?.role}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() =>
                navigate("/dashboard", {
                  replace: true,
                })
              }
            >
              Return to Dashboard
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
