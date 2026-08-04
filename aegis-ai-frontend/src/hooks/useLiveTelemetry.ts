import { useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  createLiveTelemetrySocket,
  parseLiveTelemetryMessage,
} from "../services/liveTelemetryService";

import { useAppSelector } from "../store/hooks";

export type LiveTelemetryStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

interface UseLiveTelemetryResult {
  status: LiveTelemetryStatus;
  lastUpdatedAt: string | null;
  errorMessage: string | null;
}

const RECONNECT_DELAY_MS = 5000;

export function useLiveTelemetry(): UseLiveTelemetryResult {
  const queryClient = useQueryClient();

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const [status, setStatus] = useState<LiveTelemetryStatus>("disconnected");

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setStatus("disconnected");

      setLastUpdatedAt(null);

      setErrorMessage(null);

      return;
    }

    let cancelled = false;

    let hasConnectedBefore = false;

    function clearReconnectTimer() {
      if (reconnectTimerRef.current === null) {
        return;
      }

      window.clearTimeout(reconnectTimerRef.current);

      reconnectTimerRef.current = null;
    }

    function closeCurrentSocket() {
      const currentSocket = socketRef.current;

      if (!currentSocket) {
        return;
      }

      currentSocket.onopen = null;

      currentSocket.onmessage = null;

      currentSocket.onerror = null;

      currentSocket.onclose = null;

      if (
        currentSocket.readyState === WebSocket.OPEN ||
        currentSocket.readyState === WebSocket.CONNECTING
      ) {
        currentSocket.close(1000, "Telemetry connection replaced.");
      }

      socketRef.current = null;
    }

    function scheduleReconnect() {
      if (cancelled || reconnectTimerRef.current !== null) {
        return;
      }

      setStatus("reconnecting");

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;

        connect();
      }, RECONNECT_DELAY_MS);
    }

    function connect() {
      if (cancelled) {
        return;
      }

      clearReconnectTimer();

      closeCurrentSocket();

      setStatus(hasConnectedBefore ? "reconnecting" : "connecting");

      setErrorMessage(null);

      let socket: WebSocket;

      try {
        socket = createLiveTelemetrySocket();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to create the " + "live telemetry connection.";

        setStatus("error");

        setErrorMessage(message);

        scheduleReconnect();

        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) {
          return;
        }

        hasConnectedBefore = true;

        setStatus("connected");

        setErrorMessage(null);
      };

      socket.onmessage = (event) => {
        if (cancelled) {
          return;
        }

        const message = parseLiveTelemetryMessage(event.data);

        if (!message) {
          return;
        }

        if (message.event === "telemetry.connected") {
          setStatus("connected");

          return;
        }

        queryClient.setQueryData(["machines", "summary"], message.machines);

        queryClient.setQueryData(["robots", "summary"], message.robots);

        setLastUpdatedAt(message.timestamp);

        setStatus("connected");

        setErrorMessage(null);
      };

      socket.onerror = () => {
        if (cancelled) {
          return;
        }

        setErrorMessage("The live telemetry connection encountered an error.");
      };

      socket.onclose = (event) => {
        if (cancelled) {
          return;
        }

        socketRef.current = null;

        if (event.code === 4401) {
          setStatus("error");

          setErrorMessage("Live telemetry authentication failed.");

          return;
        }

        if (event.code === 4403) {
          setStatus("error");

          setErrorMessage(
            "Your account is not permitted to use live telemetry.",
          );

          return;
        }

        scheduleReconnect();
      };
    }

    connect();

    function handleOnline() {
      if (cancelled || socketRef.current) {
        return;
      }

      connect();
    }

    function handleOffline() {
      clearReconnectTimer();

      setStatus("disconnected");

      setErrorMessage("Your device is offline.");
    }

    window.addEventListener("online", handleOnline);

    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;

      clearReconnectTimer();

      closeCurrentSocket();

      window.removeEventListener("online", handleOnline);

      window.removeEventListener("offline", handleOffline);
    };
  }, [accessToken, isAuthenticated, queryClient]);

  return {
    status,
    lastUpdatedAt,
    errorMessage,
  };
}
