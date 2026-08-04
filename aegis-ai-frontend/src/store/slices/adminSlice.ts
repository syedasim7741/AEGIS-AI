import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { UserRole } from "./authSlice";

export type ManagedUserStatus = "Active" | "Suspended";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  status: ManagedUserStatus;
  createdAt: string;
  lastLogin: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface AdminState {
  users: ManagedUser[];
  auditLogs: AuditLogEntry[];
}

export const initialAdminState: AdminState = {
  users: [
    {
      id: "USR-AEG-001",
      name: "Sayyad Asim",
      email: "admin@aegis.ai",
      password: "Admin@123",
      role: "Administrator",
      department: "Platform Administration",
      status: "Active",
      createdAt: "01 Jul 2026",
      lastLogin: "Today",
    },
    {
      id: "USR-AEG-002",
      name: "Ahmed Rahman",
      email: "manager@aegis.ai",
      password: "Manager@123",
      role: "Plant Manager",
      department: "Industrial Operations",
      status: "Active",
      createdAt: "03 Jul 2026",
      lastLogin: "Today",
    },
    {
      id: "USR-AEG-003",
      name: "Sara Malik",
      email: "safety@aegis.ai",
      password: "Safety@123",
      role: "Safety Officer",
      department: "Health and Safety",
      status: "Active",
      createdAt: "05 Jul 2026",
      lastLogin: "Yesterday",
    },
    {
      id: "USR-AEG-004",
      name: "Omar Farooq",
      email: "maintenance@aegis.ai",
      password: "Maintenance@123",
      role: "Maintenance Engineer",
      department: "Engineering Maintenance",
      status: "Active",
      createdAt: "08 Jul 2026",
      lastLogin: "Yesterday",
    },
    {
      id: "USR-AEG-005",
      name: "Layla Hassan",
      email: "operator@aegis.ai",
      password: "Operator@123",
      role: "Machine Operator",
      department: "Production Line A",
      status: "Suspended",
      createdAt: "10 Jul 2026",
      lastLogin: "18 Jul 2026",
    },
    {
      id: "USR-AEG-006",
      name: "Yusuf Kareem",
      email: "ai.engineer@aegis.ai",
      password: "Engineer@123",
      role: "AI Engineer",
      department: "Artificial Intelligence",
      status: "Active",
      createdAt: "12 Jul 2026",
      lastLogin: "Today",
    },
  ],

  auditLogs: [
    {
      id: "AUD-AEG-001",
      action: "User signed in",
      actor: "Sayyad Asim",
      target: "Administrator account",
      details: "Successful authentication from the AEGIS AI login page.",
      timestamp: "Today",
    },
    {
      id: "AUD-AEG-002",
      action: "Account suspended",
      actor: "Sayyad Asim",
      target: "Layla Hassan",
      details: "Machine Operator account was suspended pending access review.",
      timestamp: "Today",
    },
    {
      id: "AUD-AEG-003",
      action: "Role updated",
      actor: "Sayyad Asim",
      target: "Ahmed Rahman",
      details: "User role was updated to Plant Manager.",
      timestamp: "Yesterday",
    },
  ],
};

const adminSlice = createSlice({
  name: "admin",
  initialState: initialAdminState,

  reducers: {
    addManagedUser(state, action: PayloadAction<ManagedUser>) {
      state.users.unshift(action.payload);
    },

    updateManagedUserRole(
      state,
      action: PayloadAction<{
        userId: string;
        role: UserRole;
      }>,
    ) {
      const user = state.users.find(
        (item) => item.id === action.payload.userId,
      );

      if (user) {
        user.role = action.payload.role;
      }
    },

    updateManagedUserProfile(
      state,
      action: PayloadAction<{
        userId: string;
        name: string;
        department: string;
      }>,
    ) {
      const user = state.users.find(
        (item) => item.id === action.payload.userId,
      );

      if (user) {
        user.name = action.payload.name;
        user.department = action.payload.department;
      }
    },

    updateManagedUserPassword(
      state,
      action: PayloadAction<{
        userId: string;
        password: string;
      }>,
    ) {
      const user = state.users.find(
        (item) => item.id === action.payload.userId,
      );

      if (user) {
        user.password = action.payload.password;
      }
    },

    updateManagedUserLastLogin(
      state,
      action: PayloadAction<{
        userId: string;
        lastLogin: string;
      }>,
    ) {
      const user = state.users.find(
        (item) => item.id === action.payload.userId,
      );

      if (user) {
        user.lastLogin = action.payload.lastLogin;
      }
    },

    toggleManagedUserStatus(state, action: PayloadAction<string>) {
      const user = state.users.find((item) => item.id === action.payload);

      if (user) {
        user.status = user.status === "Active" ? "Suspended" : "Active";
      }
    },

    recordAuditLog(state, action: PayloadAction<AuditLogEntry>) {
      state.auditLogs.unshift(action.payload);
    },
  },
});

export const {
  addManagedUser,
  updateManagedUserRole,
  updateManagedUserProfile,
  updateManagedUserPassword,
  updateManagedUserLastLogin,
  toggleManagedUserStatus,
  recordAuditLog,
} = adminSlice.actions;

export default adminSlice.reducer;
