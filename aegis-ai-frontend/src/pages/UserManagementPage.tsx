import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { MetricCard } from "../components/dashboard/MetricCard";

import {
  getAuditLogApiErrorMessage,
  getAuditLogs,
  type AuditLogRecord,
} from "../services/auditLogService";

import {
  createPlatformUser,
  getPlatformUsers,
  getUserApiErrorMessage,
  updatePlatformUser,
  updatePlatformUserStatus,
  type BackendUserStatus,
  type CreatePlatformUserPayload,
  type PlatformUser,
  type UpdatePlatformUserPayload,
} from "../services/userService";

import { useAppSelector } from "../store/hooks";

import type { UserRole } from "../store/slices/authSlice";

const userRoles = [
  "Administrator",
  "Plant Manager",
  "Maintenance Engineer",
  "Safety Officer",
  "Machine Operator",
  "AI Engineer",
] as const satisfies readonly UserRole[];

const userStatuses = [
  "Active",
  "Suspended",
  "Invited",
] as const satisfies readonly BackendUserStatus[];

const createUserSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter the user's full name.")
      .max(150, "The name is too long."),

    email: z.string().trim().email("Enter a valid email address."),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters.")
      .max(128, "Password cannot exceed 128 characters.")
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[a-z]/, "Include at least one lowercase letter.")
      .regex(/[0-9]/, "Include at least one number.")
      .regex(/[^A-Za-z0-9]/, "Include at least one special character."),

    confirmPassword: z.string(),

    role: z.enum(userRoles),

    department: z
      .string()
      .trim()
      .min(2, "Enter a department.")
      .max(150, "The department is too long."),

    status: z.enum(userStatuses),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });

const editUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the user's full name.")
    .max(150, "The name is too long."),

  email: z.string().trim().email("Enter a valid email address."),

  role: z.enum(userRoles),

  department: z
    .string()
    .trim()
    .min(2, "Enter a department.")
    .max(150, "The department is too long."),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

type EditUserFormValues = z.infer<typeof editUserSchema>;

type AccountFilter = "All" | BackendUserStatus;

type AdminTab = "users" | "audit";

const accountFilters: AccountFilter[] = [
  "All",
  "Active",
  "Suspended",
  "Invited",
];

function formatBackendDate(value: string | null): string {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusColor(
  status: BackendUserStatus,
): "success" | "error" | "warning" {
  if (status === "Active") {
    return "success";
  }

  if (status === "Suspended") {
    return "error";
  }

  return "warning";
}

function getAuditIcon(auditLog: AuditLogRecord) {
  const action = auditLog.action.toLowerCase();

  if (action.includes("signed in")) {
    return <LoginRoundedIcon />;
  }

  if (action.includes("created")) {
    return <PersonAddRoundedIcon />;
  }

  if (action.includes("suspended")) {
    return <BlockRoundedIcon />;
  }

  if (action.includes("activated")) {
    return <CheckCircleRoundedIcon />;
  }

  if (action.includes("updated")) {
    return <ManageAccountsRoundedIcon />;
  }

  return <SecurityRoundedIcon />;
}

function getAuditColor(
  auditLog: AuditLogRecord,
): "primary" | "success" | "error" | "warning" | "default" {
  const action = auditLog.action.toLowerCase();

  if (action.includes("suspended")) {
    return "error";
  }

  if (action.includes("activated")) {
    return "success";
  }

  if (action.includes("created")) {
    return "primary";
  }

  if (action.includes("signed in")) {
    return "success";
  }

  if (action.includes("updated")) {
    return "warning";
  }

  return "default";
}

export function UserManagementPage() {
  const queryClient = useQueryClient();

  const currentUser = useAppSelector((state) => state.auth.user);

  const [selectedTab, setSelectedTab] = useState<AdminTab>("users");

  const [selectedFilter, setSelectedFilter] = useState<AccountFilter>("All");

  const [searchText, setSearchText] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  const [pageMessage, setPageMessage] = useState("");

  const [pageError, setPageError] = useState("");

  const {
    register: registerCreateUser,
    control: createUserControl,
    handleSubmit: handleCreateUserSubmit,
    reset: resetCreateUser,
    formState: { errors: createUserErrors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),

    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "Machine Operator",
      department: "",
      status: "Active",
    },
  });

  const {
    register: registerEditUser,
    control: editUserControl,
    handleSubmit: handleEditUserSubmit,
    reset: resetEditUser,
    formState: { errors: editUserErrors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),

    defaultValues: {
      fullName: "",
      email: "",
      role: "Machine Operator",
      department: "",
    },
  });

  const usersQuery = useQuery({
    queryKey: ["platform-users"],

    queryFn: getPlatformUsers,
  });

  const auditLogsQuery = useQuery({
    queryKey: ["audit-logs"],

    queryFn: getAuditLogs,

    enabled: selectedTab === "audit",
  });

  const users = usersQuery.data?.items ?? [];

  const auditLogs = auditLogsQuery.data?.items ?? [];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        selectedFilter === "All" || user.status === selectedFilter;

      const matchesSearch =
        !normalizedSearch ||
        user.full_name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch) ||
        user.department.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [users, selectedFilter, searchText]);

  const activeUsers = users.filter((user) => user.status === "Active").length;

  const suspendedUsers = users.filter(
    (user) => user.status === "Suspended",
  ).length;

  const administratorCount = users.filter(
    (user) => user.role === "Administrator",
  ).length;

  function refreshUserData() {
    void queryClient.invalidateQueries({
      queryKey: ["platform-users"],
    });

    void queryClient.invalidateQueries({
      queryKey: ["audit-logs"],
    });
  }

  const createUserMutation = useMutation({
    mutationFn: createPlatformUser,

    onSuccess: (createdUser) => {
      refreshUserData();

      closeCreateDialog();

      setPageError("");

      setPageMessage(`${createdUser.full_name} was created successfully.`);
    },

    onError: (error) => {
      setPageMessage("");

      setPageError(getUserApiErrorMessage(error));
    },
  });

  const editUserMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdatePlatformUserPayload;
    }) => updatePlatformUser(userId, payload),

    onSuccess: (updatedUser) => {
      refreshUserData();

      closeEditDialog();

      setPageError("");

      setPageMessage(`${updatedUser.full_name} was updated successfully.`);
    },

    onError: (error) => {
      setPageMessage("");

      setPageError(getUserApiErrorMessage(error));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      user,
      newStatus,
    }: {
      user: PlatformUser;
      newStatus: BackendUserStatus;
    }) => updatePlatformUserStatus(user.id, newStatus),

    onSuccess: (updatedUser) => {
      refreshUserData();

      setPageError("");

      setPageMessage(`${updatedUser.full_name} is now ${updatedUser.status}.`);
    },

    onError: (error) => {
      setPageMessage("");

      setPageError(getUserApiErrorMessage(error));
    },
  });

  function closeCreateDialog() {
    setCreateDialogOpen(false);

    resetCreateUser({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "Machine Operator",
      department: "",
      status: "Active",
    });
  }

  function openEditDialog(user: PlatformUser) {
    setSelectedUser(user);

    resetEditUser({
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department,
    });

    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    setEditDialogOpen(false);
    setSelectedUser(null);

    resetEditUser({
      fullName: "",
      email: "",
      role: "Machine Operator",
      department: "",
    });
  }

  function submitCreateUser(formValues: CreateUserFormValues) {
    setPageMessage("");
    setPageError("");

    const payload: CreatePlatformUserPayload = {
      full_name: formValues.fullName,

      email: formValues.email,

      password: formValues.password,

      role: formValues.role,

      department: formValues.department,

      status: formValues.status,
    };

    createUserMutation.mutate(payload);
  }

  function submitEditUser(formValues: EditUserFormValues) {
    if (!selectedUser) {
      return;
    }

    setPageMessage("");
    setPageError("");

    editUserMutation.mutate({
      userId: selectedUser.id,

      payload: {
        full_name: formValues.fullName,

        email: formValues.email,

        role: formValues.role,

        department: formValues.department,
      },
    });
  }

  function changeStatus(user: PlatformUser) {
    const newStatus: BackendUserStatus =
      user.status === "Active" ? "Suspended" : "Active";

    setPageMessage("");
    setPageError("");

    statusMutation.mutate({
      user,
      newStatus,
    });
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
            Administration
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 1
            }}>
            Manage PostgreSQL users and review database-backed security
            activity.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            disabled={usersQuery.isFetching || auditLogsQuery.isFetching}
            onClick={() => refreshUserData()}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<PersonAddRoundedIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create User
          </Button>
        </Stack>
      </Stack>
      {pageMessage && (
        <Alert severity="success" onClose={() => setPageMessage("")}>
          {pageMessage}
        </Alert>
      )}
      {pageError && (
        <Alert severity="error" onClose={() => setPageError("")}>
          {pageError}
        </Alert>
      )}
      {usersQuery.isError && (
        <Alert severity="error">
          {getUserApiErrorMessage(usersQuery.error)}
        </Alert>
      )}
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
          title="Total Users"
          value={String(users.length)}
          description="PostgreSQL platform accounts"
          icon={<GroupRoundedIcon />}
          iconBackground="rgba(47,128,237,0.14)"
          iconColor="#56a0ff"
        />

        <MetricCard
          title="Active Users"
          value={String(activeUsers)}
          description="Accounts allowed to sign in"
          icon={<CheckCircleRoundedIcon />}
          iconBackground="rgba(39,174,96,0.14)"
          iconColor="#27ae60"
        />

        <MetricCard
          title="Suspended Users"
          value={String(suspendedUsers)}
          description="Accounts blocked by FastAPI"
          icon={<BlockRoundedIcon />}
          iconBackground="rgba(235,87,87,0.14)"
          iconColor="#eb5757"
        />

        <MetricCard
          title="Administrators"
          value={String(administratorCount)}
          description="Accounts with full API access"
          icon={<AdminPanelSettingsRoundedIcon />}
          iconBackground="rgba(242,201,76,0.14)"
          iconColor="#f2c94c"
        />
      </Box>
      <Card
        sx={{
          backgroundImage: "none",
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent>
          <Tabs
            value={selectedTab}
            onChange={(_event, newValue: AdminTab) => setSelectedTab(newValue)}
          >
            <Tab
              value="users"
              label="Database Users"
              icon={<GroupRoundedIcon />}
              iconPosition="start"
            />

            <Tab
              value="audit"
              label="Database Audit Logs"
              icon={<HistoryRoundedIcon />}
              iconPosition="start"
            />
          </Tabs>

          <Divider sx={{ mb: 3 }} />

          {selectedTab === "users" ? (
            <Stack spacing={3}>
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
                  {accountFilters.map((filter) => (
                    <Chip
                      key={filter}
                      label={filter}
                      clickable
                      color={selectedFilter === filter ? "primary" : "default"}
                      variant={
                        selectedFilter === filter ? "filled" : "outlined"
                      }
                      onClick={() => setSelectedFilter(filter)}
                    />
                  ))}
                </Stack>

                <TextField
                  size="small"
                  placeholder="Search database users..."
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  sx={{
                    width: {
                      xs: "100%",
                      md: 350,
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
                Showing {filteredUsers.length} of {users.length} PostgreSQL
                users
              </Typography>

              <TableContainer>
                <Table
                  sx={{
                    minWidth: 1100,
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>

                      <TableCell>Department</TableCell>

                      <TableCell>Role</TableCell>

                      <TableCell>Status</TableCell>

                      <TableCell>Last Login</TableCell>

                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {usersQuery.isPending ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                          <CircularProgress />

                          <Typography
                            sx={{
                              color: "text.secondary",
                              mt: 2
                            }}>
                            Loading PostgreSQL users...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                          <Typography sx={{
                            color: "text.secondary"
                          }}>
                            No users match the selected filter.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => {
                        const isCurrentUser = user.id === currentUser?.id;

                        return (
                          <TableRow key={user.id} hover>
                            <TableCell>
                              <Typography sx={{
                                fontWeight: 700
                              }}>
                                {user.full_name}

                                {isCurrentUser && " (You)"}
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  display: "block"
                                }}>
                                {user.email}
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  display: "block"
                                }}>
                                ID: {user.id}
                              </Typography>
                            </TableCell>
                            <TableCell>{user.department}</TableCell>
                            <TableCell>
                              <Chip
                                label={user.role}
                                size="small"
                                color={
                                  user.role === "Administrator"
                                    ? "primary"
                                    : "default"
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.status}
                                color={getStatusColor(user.status)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {formatBackendDate(user.last_login_at)}
                            </TableCell>
                            <TableCell align="right">
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                  justifyContent: "flex-end"
                                }}
                              >
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditRoundedIcon />}
                                  disabled={isCurrentUser}
                                  onClick={() => openEditDialog(user)}
                                >
                                  Edit
                                </Button>

                                <Button
                                  size="small"
                                  color={
                                    user.status === "Active"
                                      ? "error"
                                      : "success"
                                  }
                                  variant="outlined"
                                  disabled={
                                    isCurrentUser || statusMutation.isPending
                                  }
                                  onClick={() => changeStatus(user)}
                                >
                                  {user.status === "Active"
                                    ? "Suspend"
                                    : "Activate"}
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          ) : (
            <Stack spacing={3}>
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
                  <Typography variant="h6" sx={{
                    fontWeight: 700
                  }}>
                    PostgreSQL Security Audit
                  </Typography>

                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    Permanent authentication and user-management activity.
                  </Typography>
                </Box>

                <Chip
                  label={`${auditLogsQuery.data?.total ?? 0} records`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>

              {auditLogsQuery.isError && (
                <Alert severity="error">
                  {getAuditLogApiErrorMessage(auditLogsQuery.error)}
                </Alert>
              )}

              {auditLogsQuery.isPending ? (
                <Stack
                  spacing={2}
                  sx={{
                    alignItems: "center",
                    py: 7
                  }}>
                  <CircularProgress />

                  <Typography sx={{
                    color: "text.secondary"
                  }}>
                    Loading PostgreSQL audit logs...
                  </Typography>
                </Stack>
              ) : auditLogs.length === 0 ? (
                <Alert severity="info">
                  No database audit records have been created yet.
                </Alert>
              ) : (
                auditLogs.map((auditLog) => (
                  <Box
                    key={auditLog.id}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "rgba(255,255,255,0.025)",
                    }}
                  >
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={2}
                      sx={{
                        justifyContent: "space-between"
                      }}
                    >
                      <Stack direction="row" spacing={2}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            borderRadius: 2,
                            color: "primary.main",
                            backgroundColor: "rgba(47,128,237,0.12)",
                          }}
                        >
                          {getAuditIcon(auditLog)}
                        </Box>

                        <Box>
                          <Typography sx={{
                            fontWeight: 700
                          }}>
                            {auditLog.action}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mt: 0.5
                            }}>
                            {auditLog.details}
                          </Typography>
                        </Box>
                      </Stack>

                      <Chip
                        label={formatBackendDate(auditLog.created_at)}
                        size="small"
                        variant="outlined"
                        sx={{
                          alignSelf: {
                            xs: "flex-start",
                            sm: "center",
                          },
                        }}
                      />
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      sx={{
                        flexWrap: "wrap",
                        mt: 2
                      }}>
                      <Chip
                        label={`Actor: ${auditLog.actor_name}`}
                        size="small"
                        color={getAuditColor(auditLog)}
                        variant="outlined"
                      />

                      <Chip
                        label={`Target: ${auditLog.target_name}`}
                        size="small"
                        variant="outlined"
                      />

                      {auditLog.actor_user_id && (
                        <Chip
                          label={`Actor ID: ${auditLog.actor_user_id}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                ))
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={createDialogOpen}
        onClose={closeCreateDialog}
        fullWidth
        maxWidth="sm"
      >
        <Stack
          component="form"
          onSubmit={handleCreateUserSubmit(submitCreateUser)}
        >
          <DialogTitle>Create PostgreSQL User</DialogTitle>

          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                This account will be stored in PostgreSQL and can sign in
                through FastAPI.
              </Typography>

              {createUserMutation.isError && (
                <Alert severity="error">
                  {getUserApiErrorMessage(createUserMutation.error)}
                </Alert>
              )}

              <TextField
                label="Full name"
                fullWidth
                {...registerCreateUser("fullName")}
                error={Boolean(createUserErrors.fullName)}
                helperText={createUserErrors.fullName?.message}
              />

              <TextField
                label="Email address"
                fullWidth
                autoComplete="off"
                {...registerCreateUser("email")}
                error={Boolean(createUserErrors.email)}
                helperText={createUserErrors.email?.message}
              />

              <TextField
                label="Temporary password"
                type="password"
                fullWidth
                autoComplete="new-password"
                {...registerCreateUser("password")}
                error={Boolean(createUserErrors.password)}
                helperText={createUserErrors.password?.message}
              />

              <TextField
                label="Confirm password"
                type="password"
                fullWidth
                autoComplete="new-password"
                {...registerCreateUser("confirmPassword")}
                error={Boolean(createUserErrors.confirmPassword)}
                helperText={createUserErrors.confirmPassword?.message}
              />

              <Controller
                name="role"
                control={createUserControl}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="User role">
                    {userRoles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <TextField
                label="Department"
                fullWidth
                {...registerCreateUser("department")}
                error={Boolean(createUserErrors.department)}
                helperText={createUserErrors.department?.message}
              />

              <Controller
                name="status"
                control={createUserControl}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Account status">
                    {userStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Alert severity="success">
                FastAPI hashes the password with Argon2 and writes an audit
                record to PostgreSQL.
              </Alert>
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 3,
            }}
          >
            <Button
              onClick={closeCreateDialog}
              color="inherit"
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
      <Dialog
        open={editDialogOpen}
        onClose={closeEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <Stack component="form" onSubmit={handleEditUserSubmit(submitEditUser)}>
          <DialogTitle>Edit PostgreSQL User</DialogTitle>

          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                Update this user's database account information.
              </Typography>

              {editUserMutation.isError && (
                <Alert severity="error">
                  {getUserApiErrorMessage(editUserMutation.error)}
                </Alert>
              )}

              <TextField
                label="Full name"
                fullWidth
                {...registerEditUser("fullName")}
                error={Boolean(editUserErrors.fullName)}
                helperText={editUserErrors.fullName?.message}
              />

              <TextField
                label="Email address"
                fullWidth
                {...registerEditUser("email")}
                error={Boolean(editUserErrors.email)}
                helperText={editUserErrors.email?.message}
              />

              <Controller
                name="role"
                control={editUserControl}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="User role">
                    {userRoles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <TextField
                label="Department"
                fullWidth
                {...registerEditUser("department")}
                error={Boolean(editUserErrors.department)}
                helperText={editUserErrors.department?.message}
              />

              <Alert severity="info">
                Saving changes also creates a permanent PostgreSQL audit record.
              </Alert>
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 3,
            }}
          >
            <Button
              onClick={closeEditDialog}
              color="inherit"
              disabled={editUserMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={editUserMutation.isPending}
            >
              {editUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  );
}
