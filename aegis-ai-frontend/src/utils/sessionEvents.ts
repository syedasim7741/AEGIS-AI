export const SESSION_EXPIRED_EVENT = "aegis:session-expired";

export type SessionExpirationReason = "token-expired" | "unauthorized";

export interface SessionExpiredDetail {
  reason: SessionExpirationReason;
  message: string;
}

export function notifySessionExpired(detail: SessionExpiredDetail): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<SessionExpiredDetail>(SESSION_EXPIRED_EVENT, {
      detail,
    }),
  );
}
