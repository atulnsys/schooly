const GOOGLE_WORKSPACE_OPENID_SCOPE = "openid";
const GOOGLE_WORKSPACE_EMAIL_SCOPE = "email";
const GOOGLE_WORKSPACE_PROFILE_SCOPE = "profile";
const GOOGLE_WORKSPACE_SHEETS_READ_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const GOOGLE_WORKSPACE_SHEETS_WRITE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const GOOGLE_WORKSPACE_DRIVE_METADATA_SCOPE = "https://www.googleapis.com/auth/drive.metadata.readonly";
const GOOGLE_WORKSPACE_READ_SCOPE = [
  GOOGLE_WORKSPACE_OPENID_SCOPE,
  GOOGLE_WORKSPACE_EMAIL_SCOPE,
  GOOGLE_WORKSPACE_PROFILE_SCOPE,
  GOOGLE_WORKSPACE_SHEETS_READ_SCOPE,
  GOOGLE_WORKSPACE_DRIVE_METADATA_SCOPE
].join(" ");
const GOOGLE_WORKSPACE_WRITE_SCOPE = [
  GOOGLE_WORKSPACE_OPENID_SCOPE,
  GOOGLE_WORKSPACE_EMAIL_SCOPE,
  GOOGLE_WORKSPACE_PROFILE_SCOPE,
  GOOGLE_WORKSPACE_SHEETS_WRITE_SCOPE,
  GOOGLE_WORKSPACE_DRIVE_METADATA_SCOPE
].join(" ");

const AUTH_STATE_STORAGE_KEY = "schooly_google_workspace_auth_state";
const AUTH_STATE_CHANGED_EVENT = "schooly-google-workspace-auth-changed";
const SAFETY_EXPIRY_BUFFER_MS = 60_000;

type WorkspaceAccessMode = "read" | "write";

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
  authMode?: WorkspaceAccessMode | null;
  expectedAccount?: string | null;
  connectedAccount?: string | null;
  grantedScopes?: string[] | null;
};

type TokenClient = {
  callback: (response: TokenResponse) => void | Promise<void>;
  requestAccessToken: (options?: { prompt?: string }) => void;
  scope?: string;
  hint?: string;
  login_hint?: string;
  hd?: string;
};

type TokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void | Promise<void>;
  error_callback?: (error: { type?: string; message?: string; error?: string; error_description?: string }) => void;
  hint?: string;
  login_hint?: string;
  hd?: string;
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
  authMode: WorkspaceAccessMode | null;
  expectedAccount: string | null;
  connectedAccount: string | null;
  grantedScopes: string[];
}

export interface GoogleWorkspaceAuthState {
  clientIdConfigured: boolean;
  clientId: string;
  currentOrigin: string;
  identityScope: string;
  readScope: string;
  writeScope: string;
  driveScope: string;
  requiredScope: string;
  grantedScopes: string[];
  authMode: WorkspaceAccessMode | null;
  connected: boolean;
  tokenPresent: boolean;
  expiresAt: string | null;
  expiresInSecondsRemaining: number | null;
  expectedAccount: string | null;
  loginHint: string | null;
  connectedAccount: string | null;
  accountMatch: boolean | null;
  accountMatchStatus: "match" | "mismatch" | "pending" | "not_configured" | "unknown";
  errorMessage: string | null;
  requestedAuthorizedOrigins: string[];
}

function getRuntimeState(): GoogleWorkspaceRuntimeState {
  const fallback: GoogleWorkspaceRuntimeState = {
    accessToken: null,
    expiresAtMs: null,
    connectedAtMs: null,
    lastError: null,
    authMode: null,
    expectedAccount: null,
    connectedAccount: null,
    grantedScopes: []
  };
  if (typeof window === "undefined") return fallback;
  window.__schoolyGoogleWorkspaceAuthState = window.__schoolyGoogleWorkspaceAuthState || fallback;
  return window.__schoolyGoogleWorkspaceAuthState;
}

const state = getRuntimeState();

let tokenClient: TokenClient | null = null;
let tokenClientMode: WorkspaceAccessMode | null = null;
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

function normalizeEmailAddress(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function persistState(): void {
  try {
    const payload = {
      accessToken: state.accessToken,
      expiresAtMs: state.expiresAtMs,
      connectedAtMs: state.connectedAtMs,
      lastError: state.lastError,
      authMode: state.authMode,
      expectedAccount: state.expectedAccount,
      connectedAccount: state.connectedAccount,
      grantedScopes: state.grantedScopes
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
    if (parsed.authMode === "read" || parsed.authMode === "write" || parsed.authMode === null) state.authMode = parsed.authMode || null;
    if (typeof parsed.expectedAccount === "string" || parsed.expectedAccount === null) state.expectedAccount = parsed.expectedAccount || null;
    if (typeof parsed.connectedAccount === "string" || parsed.connectedAccount === null) state.connectedAccount = parsed.connectedAccount || null;
    if (Array.isArray(parsed.grantedScopes)) state.grantedScopes = parsed.grantedScopes.filter((scope) => typeof scope === "string");
  } catch {
    // Ignore invalid session payloads.
  }
}

function dispatchAuthStateChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

function setExpectedAccount(expectedAccount: string | null): void {
  state.expectedAccount = normalizeEmailAddress(expectedAccount) || null;
  persistState();
  dispatchAuthStateChanged();
}

function setToken(
  accessToken: string,
  expiresInSeconds: number,
  authMode: WorkspaceAccessMode,
  expectedAccount: string | null,
  grantedScopeString: string | null
): void {
  const expiresAtMs = Date.now() + Math.max(0, (expiresInSeconds * 1000) - SAFETY_EXPIRY_BUFFER_MS);
  state.accessToken = accessToken;
  state.expiresAtMs = expiresAtMs;
  state.connectedAtMs = Date.now();
  state.lastError = null;
  state.authMode = authMode;
  state.expectedAccount = normalizeEmailAddress(expectedAccount) || state.expectedAccount;
  state.grantedScopes = String(grantedScopeString || "")
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
  persistState();
  dispatchAuthStateChanged();
}

function clearToken(errorMessage: string | null = null): void {
  state.accessToken = null;
  state.expiresAtMs = null;
  state.connectedAtMs = null;
  state.lastError = errorMessage;
  state.authMode = null;
  state.connectedAccount = null;
  state.grantedScopes = [];
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
  return "Google Workspace access could not be established.";
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

function scopesForMode(mode: WorkspaceAccessMode): string[] {
  return mode === "write"
    ? GOOGLE_WORKSPACE_WRITE_SCOPE.split(" ")
    : GOOGLE_WORKSPACE_READ_SCOPE.split(" ");
}

function buildHintOptions(expectedAccount?: string | null): Pick<TokenClientConfig, "hint" | "login_hint" | "hd"> {
  const normalized = normalizeEmailAddress(expectedAccount);
  if (!normalized) return {};
  return {
    hint: normalized,
    login_hint: normalized
  };
}

async function resolveConnectedAccount(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    });
    if (!response.ok) return null;
    const payload = await response.json() as { email?: unknown };
    return typeof payload.email === "string" ? payload.email.trim() : null;
  } catch {
    return null;
  }
}

async function requestWorkspaceAccess(mode: WorkspaceAccessMode, expectedAccount?: string | null): Promise<GoogleWorkspaceAuthState> {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error("Google OAuth client ID is not configured.");
  }

  await ensureScriptLoaded();
  if (!window.google?.accounts?.oauth2?.initTokenClient) {
    throw new Error("Google Identity Services is not available in this browser.");
  }

  const requestedScopes = scopesForMode(mode).join(" ");
  if (!tokenClient || tokenClientMode !== mode) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: requestedScopes,
      ...buildHintOptions(expectedAccount),
      callback: () => undefined
    });
    tokenClientMode = mode;
  } else {
    tokenClient.scope = requestedScopes;
    const hintOptions = buildHintOptions(expectedAccount);
    if (hintOptions.hint) {
      tokenClient.hint = hintOptions.hint;
      tokenClient.login_hint = hintOptions.login_hint;
    }
  }

  return new Promise<GoogleWorkspaceAuthState>((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Google Identity Services token client could not be created."));
      return;
    }

    tokenClient.callback = async (response) => {
      try {
        if (response.error || response.error_description) {
          const message = normalizeErrorMessage(`${response.error || ""} ${response.error_description || ""}`.trim());
          clearToken(message);
          reject(new Error(message));
          return;
        }
        if (!response.access_token || !response.expires_in) {
          const message = "Google Workspace access could not be established.";
          clearToken(message);
          reject(new Error(message));
          return;
        }
        const accountHint = normalizeEmailAddress(expectedAccount) || state.expectedAccount;
        setExpectedAccount(accountHint || null);
        setToken(response.access_token, response.expires_in, mode, accountHint || null, response.scope || requestedScopes);
        const connectedAccount = await resolveConnectedAccount(response.access_token);
        state.connectedAccount = connectedAccount;
        persistState();
        dispatchAuthStateChanged();
        resolve(getGoogleWorkspaceAuthState());
      } catch (error) {
        const message = normalizeErrorMessage(error);
        clearToken(message);
        reject(new Error(message));
      }
    };

    try {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (error) {
      const message = normalizeErrorMessage(error);
      clearToken(message);
      reject(new Error(message));
    }
  });
}

function getAccountMatchStatus(expectedAccount: string | null, connectedAccount: string | null): GoogleWorkspaceAuthState["accountMatchStatus"] {
  const normalizedExpected = normalizeEmailAddress(expectedAccount);
  const normalizedConnected = normalizeEmailAddress(connectedAccount);
  if (!normalizedExpected) return "not_configured";
  if (!normalizedConnected) return "pending";
  if (normalizedExpected === normalizedConnected) return "match";
  return "mismatch";
}

restoreState();

export function setGoogleWorkspaceAccountHint(expectedAccount: string | null): void {
  setExpectedAccount(expectedAccount);
}

export async function connectGoogleWorkspaceReadAccess(expectedAccount?: string | null): Promise<GoogleWorkspaceAuthState> {
  return requestWorkspaceAccess("read", expectedAccount);
}

export async function connectGoogleWorkspaceWriteAccess(expectedAccount?: string | null): Promise<GoogleWorkspaceAuthState> {
  return requestWorkspaceAccess("write", expectedAccount);
}

export function getGoogleWorkspaceAccessToken(): string | null {
  if (!state.accessToken || !state.expiresAtMs) {
    restoreState();
  }
  if (!state.accessToken || !state.expiresAtMs) return null;
  if (Date.now() >= state.expiresAtMs) {
    clearToken("Google Workspace access expired. Reconnect and retry.");
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
  const identityScope = `${GOOGLE_WORKSPACE_OPENID_SCOPE} ${GOOGLE_WORKSPACE_EMAIL_SCOPE} ${GOOGLE_WORKSPACE_PROFILE_SCOPE}`;
  const readScope = GOOGLE_WORKSPACE_READ_SCOPE;
  const writeScope = GOOGLE_WORKSPACE_WRITE_SCOPE;
  const driveScope = GOOGLE_WORKSPACE_DRIVE_METADATA_SCOPE;
  const requiredScope = state.authMode === "write" ? writeScope : readScope;
  const accountMatchStatus = getAccountMatchStatus(state.expectedAccount, state.connectedAccount);
  const accountMatch = accountMatchStatus === "match" ? true : accountMatchStatus === "mismatch" ? false : null;

  return {
    clientIdConfigured: Boolean(clientId),
    clientId,
    currentOrigin: getCurrentOrigin(),
    identityScope,
    readScope,
    writeScope,
    driveScope,
    requiredScope,
    grantedScopes: state.grantedScopes,
    authMode: state.authMode,
    connected,
    tokenPresent: connected,
    expiresAt: state.expiresAtMs ? new Date(state.expiresAtMs).toISOString() : null,
    expiresInSecondsRemaining,
    expectedAccount: state.expectedAccount,
    loginHint: state.expectedAccount,
    connectedAccount: state.connectedAccount,
    accountMatch,
    accountMatchStatus,
    errorMessage: state.lastError,
    requestedAuthorizedOrigins: ["http://127.0.0.1:3001", "http://localhost:3001"]
  };
}

export {
  AUTH_STATE_CHANGED_EVENT as GOOGLE_WORKSPACE_AUTH_STATE_CHANGED_EVENT,
  GOOGLE_WORKSPACE_DRIVE_METADATA_SCOPE,
  GOOGLE_WORKSPACE_SHEETS_READ_SCOPE,
  GOOGLE_WORKSPACE_SHEETS_WRITE_SCOPE,
  GOOGLE_WORKSPACE_READ_SCOPE,
  GOOGLE_WORKSPACE_WRITE_SCOPE
};
