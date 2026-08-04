const ADMIN_STORAGE_KEY = "aegis_admin_state";

export function loadAdminState<T>(): T | null {
  try {
    const savedState = localStorage.getItem(ADMIN_STORAGE_KEY);

    if (!savedState) {
      return null;
    }

    return JSON.parse(savedState) as T;
  } catch {
    return null;
  }
}

export function saveAdminState(state: unknown): void {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error("Unable to save the administration state.");
  }
}
