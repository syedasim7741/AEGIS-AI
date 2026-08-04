import { configureStore } from "@reduxjs/toolkit";

import adminReducer, { type AdminState } from "./slices/adminSlice";

import alertsReducer from "./slices/alertsSlice";
import authReducer from "./slices/authSlice";

import { clearAuthSession, saveAuthSession } from "../utils/authStorage";

import { loadAdminState, saveAdminState } from "../utils/adminStorage";

const persistedAdminState = loadAdminState<AdminState>();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    alerts: alertsReducer,
    admin: adminReducer,
  },

  preloadedState: persistedAdminState
    ? {
        admin: persistedAdminState,
      }
    : undefined,
});

let previousAuthState = store.getState().auth;

let previousAdminState = store.getState().admin;

store.subscribe(() => {
  const currentState = store.getState();

  if (currentState.auth !== previousAuthState) {
    const authState = currentState.auth;

    if (
      authState.isAuthenticated &&
      authState.user &&
      authState.accessToken &&
      authState.expiresAt
    ) {
      saveAuthSession({
        user: authState.user,
        accessToken: authState.accessToken,
        expiresAt: authState.expiresAt,
        rememberMe: authState.rememberMe,
      });
    } else {
      clearAuthSession();
    }

    previousAuthState = authState;
  }

  if (currentState.admin !== previousAdminState) {
    saveAdminState(currentState.admin);

    previousAdminState = currentState.admin;
  }
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
