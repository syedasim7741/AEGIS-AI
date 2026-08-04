import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { Navigate, useLocation, useNavigate } from "react-router";

import {
  getAuthenticationErrorMessage,
  loginWithBackend,
} from "../services/authService";

import { useAppDispatch, useAppSelector } from "../store/hooks";

import { loginSuccess } from "../store/slices/authSlice";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),

  password: z.string().min(1, "Enter your password."),

  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const location = useLocation();

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const [showPassword, setShowPassword] = useState(false);

  const [loginError, setLoginError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const redirectPath =
    (
      location.state as {
        from?: {
          pathname?: string;
        };
      } | null
    )?.from?.pathname ?? "/dashboard";

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function submitLogin(formValues: LoginFormValues) {
    setLoginError("");

    try {
      const loginResult = await loginWithBackend(
        formValues.email,
        formValues.password,
      );

      dispatch(
        loginSuccess({
          user: loginResult.user,

          accessToken: loginResult.accessToken,

          expiresIn: loginResult.expiresIn,

          rememberMe: formValues.rememberMe,
        }),
      );

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      setLoginError(getAuthenticationErrorMessage(error));
    }
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        px: 2,
        py: 5,

        background:
          "radial-gradient(circle at 15% 20%, rgba(47,128,237,0.22), transparent 35%), radial-gradient(circle at 85% 80%, rgba(0,194,168,0.14), transparent 35%), #07111f",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1fr) 460px",
            },

            gap: {
              xs: 4,
              lg: 8,
            },

            alignItems: "center",
          }}
        >
          <Stack
            spacing={3}
            sx={{
              display: {
                xs: "none",
                lg: "flex",
              },
            }}
          >
            <Box
              sx={{
                width: 68,
                height: 68,
                display: "grid",
                placeItems: "center",
                borderRadius: 3,
                color: "primary.light",

                backgroundColor: "rgba(47,128,237,0.14)",

                border: "1px solid rgba(47,128,237,0.3)",
              }}
            >
              <EngineeringRoundedIcon
                sx={{
                  fontSize: 38,
                }}
              />
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: {
                  lg: "4rem",
                  xl: "4.8rem",
                },

                lineHeight: 1,
                maxWidth: 700,
              }}
            >
              Industrial intelligence, unified.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                maxWidth: 650,
                lineHeight: 1.7,
                fontWeight: 400
              }}>
              Securely access industrial monitoring, predictive maintenance,
              worker safety, analytics and AI automation through the AEGIS AI
              platform.
            </Typography>

            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5} sx={{
                alignItems: "center"
              }}>
                <ApiRoundedIcon color="primary" />

                <Typography sx={{
                  color: "text.secondary"
                }}>
                  FastAPI backend authentication
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{
                alignItems: "center"
              }}>
                <StorageRoundedIcon color="secondary" />

                <Typography sx={{
                  color: "text.secondary"
                }}>
                  PostgreSQL user accounts
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{
                alignItems: "center"
              }}>
                <SecurityRoundedIcon color="success" />

                <Typography sx={{
                  color: "text.secondary"
                }}>
                  JWT protected access
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 3,
                sm: 4,
              },

              backgroundImage: "none",

              backgroundColor: "rgba(16,29,46,0.92)",

              border: "1px solid rgba(255,255,255,0.09)",

              backdropFilter: "blur(18px)",
            }}
          >
            <Stack
              component="form"
              spacing={3}
              onSubmit={handleSubmit(submitLogin)}
            >
              <Box>
                <Typography variant="h4" sx={{
                  fontWeight: 800
                }}>
                  AEGIS AI
                </Typography>

                <Typography
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    mt: 0.5
                  }}>
                  Enterprise Operations Platform
                </Typography>
              </Box>

              <Box>
                <Typography variant="h5" sx={{
                  fontWeight: 700
                }}>
                  Secure sign in
                </Typography>

                <Typography
                  sx={{
                    color: "text.secondary",
                    mt: 0.75
                  }}>
                  Enter your database-backed AEGIS AI account credentials.
                </Typography>
              </Box>

              <Alert severity="info" variant="outlined">
                Use the administrator email and password created with the
                FastAPI administrator script.
              </Alert>

              {loginError && <Alert severity="error">{loginError}</Alert>}

              <TextField
                label="Email address"
                fullWidth
                autoComplete="email"
                autoFocus
                {...register("email")}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                label="Password"
                fullWidth
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon />
                      </InputAdornment>
                    ),

                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          onClick={() => setShowPassword((current) => !current)}
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon />
                          ) : (
                            <VisibilityRoundedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Controller
                name="rememberMe"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(_event, checked) => field.onChange(checked)}
                      />
                    }
                    label="Keep me signed in"
                  />
                )}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<LoginRoundedIcon />}
                disabled={isSubmitting}
                sx={{
                  minHeight: 50,
                }}
              >
                {isSubmitting ? "Authenticating..." : "Sign in securely"}
              </Button>

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textAlign: "center"
                }}>
                Authentication is verified by FastAPI using PostgreSQL and
                Argon2 password hashes.
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
