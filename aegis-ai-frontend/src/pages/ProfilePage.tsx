import { useEffect, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import {
  changeCurrentPassword,
  convertProfileToAuthUser,
  getCurrentProfile,
  getProfileApiErrorMessage,
  updateCurrentProfile,
  type ChangePasswordPayload,
  type UpdateProfilePayload,
} from "../services/profileService";

import { useAppDispatch, useAppSelector } from "../store/hooks";

import { updateUser } from "../store/slices/authSlice";

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(150, "The name cannot exceed 150 characters."),

  department: z
    .string()
    .trim()
    .min(2, "Enter your department.")
    .max(150, "The department cannot exceed 150 characters."),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Enter your current password.")
      .max(128, "The password is too long."),

    newPassword: z
      .string()
      .min(8, "Password must contain at least 8 characters.")
      .max(128, "Password cannot exceed 128 characters.")
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[a-z]/, "Include at least one lowercase letter.")
      .regex(/[0-9]/, "Include at least one number.")
      .regex(/[^A-Za-z0-9]/, "Include at least one special character."),

    confirmNewPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: "The new passwords do not match.",
    path: ["confirmNewPassword"],
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: "The new password must be different from the current password.",
    path: ["newPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

type PasswordFormValues = z.infer<typeof passwordSchema>;

function formatDate(value: string | null): string {
  if (!value) {
    return "Never";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function getInitials(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((namePart) => namePart.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "AU";
}

export function ProfilePage() {
  const dispatch = useAppDispatch();

  const queryClient = useQueryClient();

  const authenticatedUser = useAppSelector((state) => state.auth.user);

  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");

  const [profileErrorMessage, setProfileErrorMessage] = useState("");

  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");

  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["current-profile"],

    queryFn: getCurrentProfile,
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),

    defaultValues: {
      fullName: authenticatedUser?.name ?? "",

      department: authenticatedUser?.department ?? "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),

    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    resetProfileForm({
      fullName: profileQuery.data.full_name,

      department: profileQuery.data.department,
    });
  }, [profileQuery.data, resetProfileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: updateCurrentProfile,

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["current-profile"], updatedProfile);

      const updatedAuthUser = convertProfileToAuthUser(updatedProfile);

      dispatch(
        updateUser({
          name: updatedAuthUser.name,

          department: updatedAuthUser.department,
        }),
      );

      resetProfileForm({
        fullName: updatedProfile.full_name,

        department: updatedProfile.department,
      });

      setProfileErrorMessage("");

      setProfileSuccessMessage("Your profile was updated successfully.");
    },

    onError: (error) => {
      setProfileSuccessMessage("");

      setProfileErrorMessage(getProfileApiErrorMessage(error));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changeCurrentPassword,

    onSuccess: (response) => {
      resetPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      setShowCurrentPassword(false);

      setShowNewPassword(false);

      setShowConfirmPassword(false);

      setPasswordErrorMessage("");

      setPasswordSuccessMessage(response.message);
    },

    onError: (error) => {
      setPasswordSuccessMessage("");

      setPasswordErrorMessage(getProfileApiErrorMessage(error));
    },
  });

  function submitProfile(formValues: ProfileFormValues) {
    setProfileSuccessMessage("");
    setProfileErrorMessage("");

    const payload: UpdateProfilePayload = {
      full_name: formValues.fullName,

      department: formValues.department,
    };

    updateProfileMutation.mutate(payload);
  }

  function submitPasswordChange(formValues: PasswordFormValues) {
    setPasswordSuccessMessage("");
    setPasswordErrorMessage("");

    const payload: ChangePasswordPayload = {
      current_password: formValues.currentPassword,

      new_password: formValues.newPassword,

      confirm_new_password: formValues.confirmNewPassword,
    };

    changePasswordMutation.mutate(payload);
  }

  if (profileQuery.isPending) {
    return (
      <Stack
        spacing={2}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          minHeight: 420
        }}>
        <CircularProgress />
        <Typography sx={{
          color: "text.secondary"
        }}>
          Loading your PostgreSQL profile...
        </Typography>
      </Stack>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4" sx={{
          fontWeight: 700
        }}>
          My Profile
        </Typography>
        <Alert severity="error">
          {getProfileApiErrorMessage(profileQuery.error)}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => void profileQuery.refetch()}
          sx={{
            alignSelf: "flex-start",
          }}
        >
          Try Again
        </Button>
      </Stack>
    );
  }

  const profile = profileQuery.data;

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
            My Profile
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 1
            }}>
            Manage your PostgreSQL profile and account password.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          disabled={profileQuery.isFetching}
          onClick={() => void profileQuery.refetch()}
        >
          Refresh Profile
        </Button>
      </Stack>
      <Card
        sx={{
          backgroundImage: "none",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent>
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={3}
            sx={{
              alignItems: {
                xs: "flex-start",
                md: "center",
              }
            }}
          >
            <Avatar
              sx={{
                width: 84,
                height: 84,
                fontSize: 28,
                fontWeight: 700,
                backgroundColor: "primary.main",
              }}
            >
              {getInitials(profile.full_name)}
            </Avatar>

            <Box
              sx={{
                flexGrow: 1,
              }}
            >
              <Typography variant="h5" sx={{
                fontWeight: 700
              }}>
                {profile.full_name}
              </Typography>

              <Typography
                sx={{
                  color: "text.secondary",
                  mt: 0.5
                }}>
                {profile.email}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{
                  flexWrap: "wrap",
                  mt: 2
                }}>
                <Chip
                  label={profile.role}
                  color={
                    profile.role === "Administrator" ? "primary" : "default"
                  }
                  variant="outlined"
                />

                <Chip
                  label={profile.status}
                  color={
                    profile.status === "Active"
                      ? "success"
                      : profile.status === "Suspended"
                        ? "error"
                        : "warning"
                  }
                  variant="outlined"
                />

                <Chip label={profile.department} variant="outlined" />
              </Stack>
            </Box>

            <SecurityRoundedIcon
              color="primary"
              sx={{
                fontSize: 42,
              }}
            />
          </Stack>

          <Divider
            sx={{
              my: 3,
            }}
          />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                xl: "repeat(4, 1fr)",
              },

              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Account ID
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  wordBreak: "break-all",
                }}
              >
                {profile.id}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Created
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                }}
              >
                {formatDate(profile.created_at)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Last updated
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                }}
              >
                {formatDate(profile.updated_at)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Last login
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                }}
              >
                {formatDate(profile.last_login_at)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            xl: "repeat(2, minmax(0, 1fr))",
          },

          gap: 3,
          alignItems: "start",
        }}
      >
        <Card
          sx={{
            backgroundImage: "none",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Stack
              component="form"
              spacing={3}
              onSubmit={handleProfileSubmit(submitProfile)}
            >
              <Stack direction="row" spacing={1.5} sx={{
                alignItems: "center"
              }}>
                <ManageAccountsRoundedIcon color="primary" />

                <Box>
                  <Typography variant="h6" sx={{
                    fontWeight: 700
                  }}>
                    Profile Information
                  </Typography>

                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    Update your name and department.
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              {profileSuccessMessage && (
                <Alert
                  severity="success"
                  onClose={() => setProfileSuccessMessage("")}
                >
                  {profileSuccessMessage}
                </Alert>
              )}

              {profileErrorMessage && (
                <Alert
                  severity="error"
                  onClose={() => setProfileErrorMessage("")}
                >
                  {profileErrorMessage}
                </Alert>
              )}

              <TextField
                label="Full name"
                fullWidth
                {...registerProfile("fullName")}
                error={Boolean(profileErrors.fullName)}
                helperText={profileErrors.fullName?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeRoundedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                label="Email address"
                fullWidth
                value={profile.email}
                disabled
                helperText="Email changes must be performed by an Administrator."
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
                label="Department"
                fullWidth
                {...registerProfile("department")}
                error={Boolean(profileErrors.department)}
                helperText={profileErrors.department?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessRoundedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                startIcon={
                  updateProfileMutation.isPending ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveRoundedIcon />
                  )
                }
                disabled={updateProfileMutation.isPending}
                sx={{
                  alignSelf: "flex-start",
                }}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            backgroundImage: "none",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Stack
              component="form"
              spacing={3}
              onSubmit={handlePasswordSubmit(submitPasswordChange)}
            >
              <Stack direction="row" spacing={1.5} sx={{
                alignItems: "center"
              }}>
                <LockResetRoundedIcon color="primary" />

                <Box>
                  <Typography variant="h6" sx={{
                    fontWeight: 700
                  }}>
                    Change Password
                  </Typography>

                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    Your new password will be hashed by FastAPI using Argon2.
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              {passwordSuccessMessage && (
                <Alert
                  severity="success"
                  onClose={() => setPasswordSuccessMessage("")}
                >
                  {passwordSuccessMessage}
                </Alert>
              )}

              {passwordErrorMessage && (
                <Alert
                  severity="error"
                  onClose={() => setPasswordErrorMessage("")}
                >
                  {passwordErrorMessage}
                </Alert>
              )}

              <TextField
                label="Current password"
                fullWidth
                type={showCurrentPassword ? "text" : "password"}
                autoComplete="current-password"
                {...registerPassword("currentPassword")}
                error={Boolean(passwordErrors.currentPassword)}
                helperText={passwordErrors.currentPassword?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          aria-label={
                            showCurrentPassword
                              ? "Hide current password"
                              : "Show current password"
                          }
                          onClick={() =>
                            setShowCurrentPassword(
                              (currentValue) => !currentValue,
                            )
                          }
                        >
                          {showCurrentPassword ? (
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

              <TextField
                label="New password"
                fullWidth
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                {...registerPassword("newPassword")}
                error={Boolean(passwordErrors.newPassword)}
                helperText={
                  passwordErrors.newPassword?.message ??
                  "Use uppercase, lowercase, number and special character."
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                          onClick={() =>
                            setShowNewPassword((currentValue) => !currentValue)
                          }
                        >
                          {showNewPassword ? (
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

              <TextField
                label="Confirm new password"
                fullWidth
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                {...registerPassword("confirmNewPassword")}
                error={Boolean(passwordErrors.confirmNewPassword)}
                helperText={passwordErrors.confirmNewPassword?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirmed password"
                              : "Show confirmed password"
                          }
                          onClick={() =>
                            setShowConfirmPassword(
                              (currentValue) => !currentValue,
                            )
                          }
                        >
                          {showConfirmPassword ? (
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

              <Alert severity="info">
                After changing your password, use the new password the next time
                you sign in.
              </Alert>

              <Button
                type="submit"
                variant="contained"
                startIcon={
                  changePasswordMutation.isPending ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <LockResetRoundedIcon />
                  )
                }
                disabled={changePasswordMutation.isPending}
                sx={{
                  alignSelf: "flex-start",
                }}
              >
                {changePasswordMutation.isPending
                  ? "Changing..."
                  : "Change Password"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
