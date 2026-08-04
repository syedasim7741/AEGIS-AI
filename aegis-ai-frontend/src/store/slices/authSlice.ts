import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { loadAuthSession } from "../../utils/authStorage";

export type UserRole =
  | "Administrator"
  | "Plant Manager"
  | "Maintenance Engineer"
  | "Safety Officer"
  | "Machine Operator"
  | "AI Engineer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  expiresAt: number | null;
  rememberMe: boolean;
  isAuthenticated: boolean;
}

interface LoginSuccessPayload {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
  rememberMe: boolean;
}

interface AccessTokenRefreshedPayload {
  accessToken: string;
  expiresIn: number;
}

type UserProfileUpdate = Partial<Pick<AuthUser, "name" | "department">>;

const storedSession = loadAuthSession();

const initialState: AuthState = storedSession
  ? {
      user: storedSession.user,

      accessToken: storedSession.accessToken,

      expiresAt: storedSession.expiresAt,

      rememberMe: storedSession.rememberMe,

      isAuthenticated: true,
    }
  : {
      user: null,
      accessToken: null,
      expiresAt: null,
      rememberMe: false,
      isAuthenticated: false,
    };

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    loginSuccess(state, action: PayloadAction<LoginSuccessPayload>) {
      state.user = action.payload.user;

      state.accessToken = action.payload.accessToken;

      state.expiresAt = Date.now() + action.payload.expiresIn * 1000;

      state.rememberMe = action.payload.rememberMe;

      state.isAuthenticated = true;
    },

    accessTokenRefreshed(
      state,
      action: PayloadAction<AccessTokenRefreshedPayload>,
    ) {
      if (!state.user || !state.isAuthenticated) {
        return;
      }

      state.accessToken = action.payload.accessToken;

      state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
    },

    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.expiresAt = null;
      state.rememberMe = false;
      state.isAuthenticated = false;
    },

    updateUser(state, action: PayloadAction<UserProfileUpdate>) {
      if (!state.user) {
        return;
      }

      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
  },
});

export const { loginSuccess, accessTokenRefreshed, logout, updateUser } =
  authSlice.actions;

export default authSlice.reducer;
