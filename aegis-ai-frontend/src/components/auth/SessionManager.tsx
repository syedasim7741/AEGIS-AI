import { useCallback, useEffect, useRef, useState } from "react";

import axios from "axios";

import { Alert, Snackbar } from "@mui/material";

import { useLocation, useNavigate } from "react-router";

import { useQueryClient } from "@tanstack/react-query";

import { refreshAccessToken } from "../../api/httpClient";

import { useAppDispatch, useAppSelector } from "../../store/hooks";

import { logout } from "../../store/slices/authSlice";

import {
  SESSION_EXPIRED_EVENT,
  type SessionExpiredDetail,
} from "../../utils/sessionEvents";

const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

const TOKEN_REFRESH_RETRY_MS = 15 * 1000;

export function SessionManager() {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const location = useLocation();

  const queryClient = useQueryClient();

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const expiresAt = useAppSelector((state) => state.auth.expiresAt);

  const [notificationMessage, setNotificationMessage] = useState("");

  const sessionEndingRef = useRef(false);

  const endSession = useCallback(
    (detail: SessionExpiredDetail) => {
      if (!isAuthenticated || sessionEndingRef.current) {
        return;
      }

      sessionEndingRef.current = true;

      queryClient.clear();

      dispatch(logout());

      setNotificationMessage(detail.message);

      navigate("/login", {
        replace: true,

        state: {
          sessionExpired: true,
          message: detail.message,

          from: {
            pathname: location.pathname,
          },
        },
      });
    },
    [dispatch, isAuthenticated, location.pathname, navigate, queryClient],
  );

  useEffect(() => {
    if (isAuthenticated) {
      sessionEndingRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    function handleSessionExpired(event: Event) {
      const customEvent = event as CustomEvent<SessionExpiredDetail>;

      endSession(customEvent.detail);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [endSession]);

  useEffect(() => {
    if (!isAuthenticated || !expiresAt) {
      return;
    }

    let cancelled = false;

    let refreshTimerId: number | undefined;

    function scheduleRefresh(delay: number) {
      refreshTimerId = window.setTimeout(() => {
        void attemptRefresh();
      }, delay);
    }

    async function attemptRefresh() {
      try {
        await refreshAccessToken();
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        const isTemporaryFailure =
          axios.isAxiosError(error) &&
          (!error.response || error.response.status >= 500);

        if (isTemporaryFailure) {
          scheduleRefresh(TOKEN_REFRESH_RETRY_MS);

          return;
        }

        endSession({
          reason: "token-expired",

          message: "Your session has expired. Please sign in again.",
        });
      }
    }

    const remainingTime = expiresAt - Date.now();

    const refreshDelay = Math.max(0, remainingTime - TOKEN_REFRESH_BUFFER_MS);

    scheduleRefresh(refreshDelay);

    return () => {
      cancelled = true;

      if (refreshTimerId !== undefined) {
        window.clearTimeout(refreshTimerId);
      }
    };
  }, [endSession, expiresAt, isAuthenticated]);

  return (
    <Snackbar
      open={Boolean(notificationMessage)}
      autoHideDuration={6000}
      anchorOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      onClose={() => setNotificationMessage("")}
    >
      <Alert
        severity="warning"
        variant="filled"
        onClose={() => setNotificationMessage("")}
        sx={{
          width: "100%",
        }}
      >
        {notificationMessage}
      </Alert>
    </Snackbar>
  );
}
