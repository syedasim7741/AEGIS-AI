import type { AuthUser } from "../store/slices/authSlice";

const AUTH_STORAGE_KEY = "aegis_auth_session";

export interface StoredAuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
  rememberMe: boolean;
}

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const session = value as Partial<StoredAuthSession>;

  return (
    typeof session.user === "object" &&
    session.user !== null &&
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.expiresAt === "number" &&
    typeof session.rememberMe === "boolean"
  );
}

function readSessionFromStorage(storage: Storage): StoredAuthSession | null {
  try {
    const storedValue = storage.getItem(AUTH_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!isStoredAuthSession(parsedValue)) {
      storage.removeItem(AUTH_STORAGE_KEY);

      return null;
    }

    return parsedValue;
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);

    return null;
  }
}

export function loadAuthSession(): StoredAuthSession | null {
  const persistentSession = readSessionFromStorage(localStorage);

  if (persistentSession) {
    return persistentSession;
  }

  return readSessionFromStorage(sessionStorage);
}

export function saveAuthSession(session: StoredAuthSession): void {
  clearAuthSession();

  const selectedStorage = session.rememberMe ? localStorage : sessionStorage;

  selectedStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);

  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredAccessToken(): string | null {
  return loadAuthSession()?.accessToken ?? null;
}
