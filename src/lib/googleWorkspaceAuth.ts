const GOOGLE_OAUTH_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const AUTH_STATE_STORAGE_KEY = "schooly_google_workspace_auth_state";
const AUTH_STATE_CHANGED_EVENT = "schooly-google-workspace-auth-changed";
const SAFETY_EXPIRY_BUFFER_MS = 60_000;

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
  scope?: string;
};

type StoredAuthState = {
  accessToken?: string | null;
  expiresAtMs?: number | null;
  connectedAtMs?: number | null;
  lastError?: string | null;
};

type TokenClient = {
  callback: (response: TokenResponse) => void;
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type TokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type?: string; message?: string; error?: string; error_description?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: TokenClientConfig) => TokenClient;
        };
      };
    };
    __schoolyGoogleWorkspaceAuthState?: GoogleWorkspaceRuntimeState;
  }
}

interface GoogleWorkspaceRuntimeState {
  accessToken: string | null;
  expiresAtMs: number | null;
  connectedAtMs: number | null;
  lastError: string | null;
}

export interface GoogleWorkspaceAuthState {
  clientIdConfigured: boolean;
  clientId: string;
  currentOrigin: string;
  requiredScope: string;
  connected: boolean;
  tokenPresent: boolean;
  expiresAt: string | null;
  expiresInSecondsRemaining: number | null;
  connectedAccount: string;
  errorMessage: string | null;
  requestedAuthorizedOrigins: string[];
}

function getRuntimeState(): GoogleWorkspaceRuntimeState {
  const fallback: GoogleWorkspaceRuntimeState = {
    accessToken: null,
    expiresAtMs: null,
    connectedAtMs: null,
    lastError: null
  };
  if (typeof window === "undefined") return fallback;
  window.__schoolyGoogleWorkspaceAuthState = window.__schoolyGoogleWorkspaceAuthState || fallback;
  return window.__schoolyGoogleWorkspaceAuthState;
}

const state = getRuntimeState();

let tokenClient: TokenClient | null = null;
let scriptPromise: Promise<void> | null = null;

function getClientId(): string {
  try {
    return String(import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || "").trim();
  } catch {
    return "";
  }
}

function getCurrentOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

function persistState(): void {
  try {
    const payload = {
      accessToken: state.accessToken,
      expiresAtMs: state.expiresAtMs,
      connectedAtMs: state.connectedAtMs,
      lastError: state.lastError
    };
    sessionStorage.setItem(AUTH_STATE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Session storage is optional.
  }
}

function restoreState(): void {
  try {
    const payload = sessionStorage.getItem(AUTH_STATE_STORAGE_KEY);
    if (!payload) return;
    const parsed = JSON.parse(payload) as StoredAuthState;
    if (typeof parsed.accessToken === "string") state.accessToken = parsed.accessToken;
    if (typeof parsed.expiresAtMs === "number") state.expiresAtMs = parsed.expiresAtMs;
    if (typeof parsed.connectedAtMs === "number") state.connectedAtMs = parsed.connectedAtMs;
    if (typeof parsed.lastError === "string" || parsed.lastError === null) state.lastError = parsed.lastError || null;
  } catch {
    // Ignore invalid session payloads.
  }
}

function dispatchAuthStateChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

function setToken(accessToken: string, expiresInSeconds: number): void {
  const bufferMs = SAFETY_EXPIRY_BUFFER_MS;
  const expiresAtMs = Date.now() + Math.max(0, (expiresInSeconds * 1000) - bufferMs);
  state.accessToken = accessToken;
  state.expiresAtMs = expiresAtMs;
  state.connectedAtMs = Date.now();
  state.lastError = null;
  persistState();
  dispatchAuthStateChanged();
}

function clearToken(errorMessage: string | null = null): void {
  state.accessToken = null;
  state.expiresAtMs = null;
  state.connectedAtMs = null;
  state.lastError = errorMessage;
  try {
    sessionStorage.removeItem(AUTH_STATE_STORAGE_KEY);
  } catch {
    // Ignored.
  }
  persistState();
  dispatchAuthStateChanged();
}

function normalizeErrorMessage(error: unknown): string {
  const text = typeof error === "string" ? error : JSON.stringify(error || {});
  const lowered = text.toLowerCase();
  if (lowered.includes("origin") || lowered.includes("authorized javascript origins") || lowered.includes("idpiframe_initialization_failed")) {
    return "This app origin must be added to the OAuth client Authorized JavaScript origins in Google Cloud Console.";
  }
  if (lowered.includes("client id") || lowered.includes("missing client")) {
    return "Google OAuth client ID is not configured.";
  }
  if (lowered.includes("popup_closed_by_user")) {
    return "Google sign-in was closed before access could be granted.";
  }
  return "Google Sheets write access could not be established.";
}

function ensureScriptLoaded(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity Services can only run in the browser."));
  }
  if (window.google?.accounts?.oauth2?.initTokenClient) {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-schooly-google-gis="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Google Identity Services.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.schoolyGoogleGis = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google Identity Services."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function ensureTokenClient(): Promise<TokenClient> {
  const clientId = getClientId();
  if (!clientId) {
    return Promise.reject(new Error("Google OAuth client ID is not configured."));
  }
  if (tokenClient) return Promise.resolve(tokenClient);

  return ensureScriptLoaded().then(() => {
    if (!window.google?.accounts?.oauth2?.initTokenClient) {
      throw new Error("Google Identity Services is not available in this browser.");
    }
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_OAUTH_SCOPE,
      callback: (response) => {
        if (response.error || response.error_description) {
          const message = normalizeErrorMessage(`${response.error || ""} ${response.error_description || ""}`.trim());
          clearToken(message);
          return;
        }
        if (!response.access_token || !response.expires_in) {
          clearToken("Google Sheets write access could not be established.");
          return;
        }
        setToken(response.access_token, response.expires_in);
      },
      error_callback: (error) => {
        clearToken(normalizeErrorMessage(error));
      }
    });
    return tokenClient;
  });
}

restoreState();

export async function connectGoogleWorkspaceWriteAccess(): Promise<GoogleWorkspaceAuthState> {
  const client = await ensureTokenClient();
  return new Promise<GoogleWorkspaceAuthState>((resolve, reject) => {
    client.callback = (response) => {
      if (response.error || response.error_description) {
        const message = normalizeErrorMessage(`${response.error || ""} ${response.error_description || ""}`.trim());
        clearToken(message);
        reject(new Error(message));
        return;
      }
      if (!response.access_token || !response.expires_in) {
        const message = "Google Sheets write access could not be established.";
        clearToken(message);
        reject(new Error(message));
        return;
      }
      setToken(response.access_token, response.expires_in);
      resolve(getGoogleWorkspaceAuthState());
    };
    try {
      client.requestAccessToken({ prompt: "consent" });
    } catch (error) {
      const message = normalizeErrorMessage(error);
      clearToken(message);
      reject(new Error(message));
    }
  });
}

export function getGoogleWorkspaceAccessToken(): string | null {
  if (!state.accessToken || !state.expiresAtMs) {
    restoreState();
  }
  if (!state.accessToken || !state.expiresAtMs) return null;
  if (Date.now() >= state.expiresAtMs) {
    clearToken("Google Sheets write access expired. Reconnect and retry.");
    return null;
  }
  return state.accessToken;
}

export function disconnectGoogleWorkspaceAccess(): void {
  clearToken(null);
}

export function getGoogleWorkspaceAuthState(): GoogleWorkspaceAuthState {
  const clientId = getClientId();
  const accessToken = getGoogleWorkspaceAccessToken();
  const now = Date.now();
  const expiresInSecondsRemaining = state.expiresAtMs ? Math.max(0, Math.floor((state.expiresAtMs - now) / 1000)) : null;
  const connected = Boolean(accessToken);
  return {
    clientIdConfigured: Boolean(clientId),
    clientId,
    currentOrigin: getCurrentOrigin(),
    requiredScope: GOOGLE_OAUTH_SCOPE,
    connected,
    tokenPresent: connected,
    expiresAt: state.expiresAtMs ? new Date(state.expiresAtMs).toISOString() : null,
    expiresInSecondsRemaining,
    connectedAccount: "unavailable",
    errorMessage: state.lastError,
    requestedAuthorizedOrigins: ["http://127.0.0.1:3000", "http://localhost:3000"]
  };
}

export { AUTH_STATE_CHANGED_EVENT as GOOGLE_WORKSPACE_AUTH_STATE_CHANGED_EVENT };
