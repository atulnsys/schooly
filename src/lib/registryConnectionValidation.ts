import type { WorkspaceFile } from "../types";
import type { GoogleWorkspaceAuthState } from "./googleWorkspaceAuth";
import { getGoogleWorkspaceAuthState } from "./googleWorkspaceAuth";
import { parseGoogleSheetUrl, validateSourceLink } from "./dataSourceEngine";
import { discoverRegistrySources } from "./registrySourceDiscovery";
import { loadSeededRegistryConfig } from "./seededRegistryConfig";
import {
  GoogleSheetReadError,
  readGoogleSheetTabRows,
  type GoogleSheetReadPolicy,
  type GoogleSheetTabResult,
} from "./googleSheetRead";

export type RegistryConnectionReadStatus =
  | "not_tested"
  | "authentication_required"
  | "account_mismatch"
  | "readable"
  | "empty"
  | "tab_missing"
  | "file_missing"
  | "access_denied"
  | "error";

export type RegistryConnectionSourceMode = "authenticated" | "public" | "unavailable";

export interface RegistryConnectionTabResult {
  tabName: string;
  status: RegistryConnectionReadStatus;
  sourceMode: RegistryConnectionSourceMode;
  source: GoogleSheetTabResult["source"] | "not_tested";
  rowCount: number | null;
  headers: string[];
  checkedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface RegistryConnectionSourceSummary {
  label: string;
  url: string;
  sourceFamily: string;
  sourceTab: string;
  sourceMode: RegistryConnectionSourceMode;
  status: RegistryConnectionReadStatus;
  rowCount: number | null;
  checkedAt: string | null;
  note: string;
}

export interface RegistryConnectionValidationSnapshot {
  checkedAt: string;
  requestedUrl: string;
  resolvedUrl: string | null;
  urlStatus: "configured" | "missing" | "invalid";
  sourceResolutionLabel: string;
  sourceFallbackLabel: string | null;
  authState: GoogleWorkspaceAuthState;
  connectedAccount: string;
  accountMatchStatus: GoogleWorkspaceAuthState["accountMatchStatus"];
  accessMode: RegistryConnectionSourceMode;
  status: RegistryConnectionReadStatus;
  message: string;
  nextAction: string;
  sourceMetadata: {
    family: string;
    label: string;
    detail: string;
  };
  masterWorkbook: RegistryConnectionSourceSummary;
  connectedRegistryCatalog: RegistryConnectionSourceSummary;
  discoveredRegistryCount: number;
  authenticatedReadableRegistryCount: number;
  publicReadableRegistryCount: number;
  tabResults: RegistryConnectionTabResult[];
}

export interface RegistryConnectionValidationInput {
  currentUrl: string;
  expectedAccount?: string | null;
  authState?: GoogleWorkspaceAuthState;
  files?: WorkspaceFile[];
  fallbackRegistryUrl?: string;
}

function createTabResult(tabName: string, sourceMode: RegistryConnectionSourceMode): RegistryConnectionTabResult {
  return {
    tabName,
    status: "not_tested",
    sourceMode,
    source: "not_tested",
    rowCount: null,
    headers: [],
    checkedAt: null,
    errorCode: null,
    errorMessage: null
  };
}

function classifyValidationError(error: unknown): Pick<RegistryConnectionTabResult, "status" | "errorCode" | "errorMessage"> {
  const message = error instanceof Error ? error.message : String(error || "");
  const code = error instanceof GoogleSheetReadError ? error.code : null;
  if (code === "AUTH_REQUIRED" || /connection required|sign in|reconnect/i.test(message)) {
    return { status: "authentication_required", errorCode: code || "AUTH_REQUIRED", errorMessage: message };
  }
  if (code === "TOKEN_EXPIRED" || /expired/i.test(message)) {
    return { status: "access_denied", errorCode: code || "TOKEN_EXPIRED", errorMessage: message };
  }
  if (code === "ACCESS_DENIED" || /denied|forbidden/i.test(message)) {
    return { status: "access_denied", errorCode: code || "ACCESS_DENIED", errorMessage: message };
  }
  if (code === "INVALID_URL" || /not configured|invalid/i.test(message)) {
    return { status: "file_missing", errorCode: code || "INVALID_URL", errorMessage: message };
  }
  if (/tab .* not found|range .* not found|sheet .* not found|requested entity was not found/i.test(message)) {
    return { status: "tab_missing", errorCode: code || "UNKNOWN", errorMessage: message };
  }
  return { status: "error", errorCode: code || "UNKNOWN", errorMessage: message };
}

function summarizeSource(
  label: string,
  url: string,
  sourceFamily: string,
  sourceTab: string,
  sourceMode: RegistryConnectionSourceMode,
  status: RegistryConnectionReadStatus,
  rowCount: number | null,
  checkedAt: string | null,
  note: string,
): RegistryConnectionSourceSummary {
  return { label, url, sourceFamily, sourceTab, sourceMode, status, rowCount, checkedAt, note };
}

function emptySnapshot(
  input: Required<Pick<RegistryConnectionValidationInput, "currentUrl">> & RegistryConnectionValidationInput,
  authState: GoogleWorkspaceAuthState,
  checkedAt: string,
  requestedUrl: string,
  resolvedUrl: string | null,
  sourceResolutionLabel: string,
  sourceFallbackLabel: string | null,
  status: RegistryConnectionReadStatus,
  message: string,
  nextAction: string,
): RegistryConnectionValidationSnapshot {
  const connectedAccount = authState.connectedAccount || authState.expectedAccount || "Not connected";
  const sourceLabel = sourceResolutionLabel || "Source unavailable";
  return {
    checkedAt,
    requestedUrl,
    resolvedUrl,
    urlStatus: requestedUrl ? "configured" : "missing",
    sourceResolutionLabel,
    sourceFallbackLabel,
    authState,
    connectedAccount,
    accountMatchStatus: authState.accountMatchStatus,
    accessMode: "unavailable",
    status,
    message,
    nextAction,
    sourceMetadata: {
      family: "Source unavailable",
      label: sourceLabel,
      detail: sourceFallbackLabel || message
    },
    masterWorkbook: summarizeSource(sourceLabel, resolvedUrl || "", "Source unavailable", "School_Profile", "unavailable", status, null, null, message),
    connectedRegistryCatalog: summarizeSource("Connected Registry Catalog", resolvedUrl || "", "Source unavailable", "Registry_Catalog", "unavailable", status, null, null, "Not verified."),
    discoveredRegistryCount: 0,
    authenticatedReadableRegistryCount: 0,
    publicReadableRegistryCount: 0,
    tabResults: []
  };
}

async function readTabResults(url: string, tabNames: string[]): Promise<RegistryConnectionTabResult[]> {
  const settled = await Promise.allSettled(
    tabNames.map(async (tabName) => {
      const result = await readGoogleSheetTabRows(url, tabName, { policy: "authenticated-required" });
      return { tabName, result };
    })
  );

  return settled.map((entry, index) => {
    const tabName = tabNames[index];
    if (entry.status === "fulfilled") {
      const { result } = entry.value;
      return {
        tabName,
        status: result.rows.length > 0 ? "readable" : "empty",
        sourceMode: result.accessMode,
        source: result.source,
        rowCount: result.rows.length,
        headers: result.headers,
        checkedAt: result.checkedAt,
        errorCode: null,
        errorMessage: null
      };
    }

    const failure = classifyValidationError(entry.reason);
    return {
      ...createTabResult(tabName, "unavailable"),
      status: failure.status,
      errorCode: failure.errorCode,
      errorMessage: failure.errorMessage
    };
  });
}

export async function validateRegistryConnection(input: RegistryConnectionValidationInput): Promise<RegistryConnectionValidationSnapshot> {
  const checkedAt = new Date().toISOString();
  const authState = input.authState || getGoogleWorkspaceAuthState();
  const requestedUrl = String(input.currentUrl || "").trim();
  const fallbackRegistryUrl = String(input.fallbackRegistryUrl || loadSeededRegistryConfig().masterDataRegistryUrl || "").trim();
  const discovery = discoverRegistrySources(input.files || []);
  const discoveredMasterUrl = String(discovery.config.masterDataRegistryUrl || "").trim();
  const parsedRequested = parseGoogleSheetUrl(requestedUrl);
  const isDriveFolder = Boolean(requestedUrl) && validateSourceLink(requestedUrl, "google_workspace") && !parsedRequested;

  let resolvedUrl = parsedRequested ? requestedUrl : discoveredMasterUrl || fallbackRegistryUrl || "";
  let sourceResolutionLabel = parsedRequested
    ? "Configured Google Sheet"
    : isDriveFolder
      ? (discoveredMasterUrl ? "Drive folder discovery" : "Drive folder not mapped")
      : requestedUrl
        ? "Configured link"
        : "No registry link configured";
  let sourceFallbackLabel: string | null = null;

  if (!requestedUrl && fallbackRegistryUrl) {
    resolvedUrl = fallbackRegistryUrl;
    sourceResolutionLabel = "Seeded default master registry";
    sourceFallbackLabel = "No registry URL was configured, so the seeded default master registry was used.";
  } else if (isDriveFolder && !discoveredMasterUrl && fallbackRegistryUrl) {
    resolvedUrl = fallbackRegistryUrl;
    sourceResolutionLabel = "Seeded default master registry";
    sourceFallbackLabel = "The drive folder could not be mapped, so the seeded default master registry was used.";
  } else if (requestedUrl && !parsedRequested && !discoveredMasterUrl && fallbackRegistryUrl) {
    resolvedUrl = fallbackRegistryUrl;
    sourceResolutionLabel = "Seeded default master registry";
    sourceFallbackLabel = "The configured link could not be read, so the seeded default master registry was used.";
  } else if (requestedUrl && !parsedRequested && !discoveredMasterUrl && !fallbackRegistryUrl) {
    return emptySnapshot(input, authState, checkedAt, requestedUrl, null, sourceResolutionLabel, null, "file_missing", "The configured registry link does not resolve to a readable Google Sheet.", "Provide a Google Sheets link or connect a Drive folder that contains one.");
  }

  if (!requestedUrl && !resolvedUrl) {
    return emptySnapshot(input, authState, checkedAt, requestedUrl, null, sourceResolutionLabel, sourceFallbackLabel, "file_missing", "Add a registry link before testing the connection.", "Save a Google Sheets link or a Drive folder first.");
  }

  if (!authState.clientIdConfigured) {
    return emptySnapshot(input, authState, checkedAt, requestedUrl, resolvedUrl || null, sourceResolutionLabel, sourceFallbackLabel, "authentication_required", "Google OAuth client is not configured.", "Configure Google OAuth before testing the connection.");
  }

  if (!authState.connected || !authState.tokenPresent) {
    return emptySnapshot(input, authState, checkedAt, requestedUrl, resolvedUrl || null, sourceResolutionLabel, sourceFallbackLabel, "authentication_required", "Google account connection required.", "Connect Google Workspace and retry.");
  }

  if (authState.accountMatchStatus === "mismatch" && authState.expectedAccount) {
    return emptySnapshot(input, authState, checkedAt, requestedUrl, resolvedUrl || null, sourceResolutionLabel, sourceFallbackLabel, "account_mismatch", "Google account mismatch.", "Use the matching Google account and retry.");
  }

  const connectedAccount = authState.connectedAccount || authState.expectedAccount || "Not connected";
  const keyTabs = ["School_Profile", "Staff_Directory", "Student_Directory", "Student_Enrollment", "Classes_Sections", "Subjects", "Teacher_Allocations", "Books_Registry"];
  const catalogTabs = ["Registry_Catalog"];
  const tabResults = await readTabResults(resolvedUrl || requestedUrl, [...keyTabs, ...catalogTabs]);
  const authenticatedReadableRegistryCount = tabResults.filter((result) => result.status === "readable" || result.status === "empty").length;
  const publicReadableRegistryCount = 0;
  const masterTabResults = tabResults.filter((result) => keyTabs.includes(result.tabName));
  const catalogResult = tabResults.find((result) => result.tabName === "Registry_Catalog") || createTabResult("Registry_Catalog", "authenticated");
  const failedResults = tabResults.filter((result) => result.status !== "readable" && result.status !== "empty");
  const hasReadableRows = tabResults.some((result) => (result.rowCount || 0) > 0);
  const hasAnyRows = tabResults.some((result) => (result.rowCount || 0) >= 0 && (result.rowCount || 0) !== null);
  const totalRows = tabResults.reduce((sum, result) => sum + (result.rowCount || 0), 0);
  const sourceMode: RegistryConnectionSourceMode = authenticatedReadableRegistryCount > 0 ? "authenticated" : "unavailable";
  const overallStatus: RegistryConnectionReadStatus = failedResults.length > 0
    ? failedResults[0].status
    : hasReadableRows
      ? "readable"
      : hasAnyRows
        ? "empty"
        : "error";

  const masterSummary = summarizeSource(
    sourceResolutionLabel,
    resolvedUrl || requestedUrl,
    "Connected Google Registry",
    keyTabs.find((tabName) => tabResults.some((result) => result.tabName === tabName)) || "School_Profile",
    sourceMode,
    overallStatus,
    totalRows,
    checkedAt,
    failedResults.length > 0 ? "One or more tabs need attention." : (hasReadableRows ? "Authenticated sheet reads succeeded." : "The connected workbook was reachable but contained no rows.")
  );

  const catalogSummary = catalogResult.rowCount === null
    ? summarizeSource("Connected Registry Catalog", resolvedUrl || requestedUrl, "Source unavailable", "Registry_Catalog", "unavailable", catalogResult.status, null, catalogResult.checkedAt, catalogResult.errorMessage || "Not verified.")
    : summarizeSource(
        "Connected Registry Catalog",
        resolvedUrl || requestedUrl,
        "Connected Google Registry",
        "Registry_Catalog",
        catalogResult.sourceMode,
        catalogResult.status,
        catalogResult.rowCount,
        catalogResult.checkedAt,
        catalogResult.status === "readable" ? "Authenticated catalog rows were read." : "Connected catalog has no rows."
      );

  return {
    checkedAt,
    requestedUrl,
    resolvedUrl: resolvedUrl || null,
    urlStatus: requestedUrl ? "configured" : "missing",
    sourceResolutionLabel,
    sourceFallbackLabel,
    authState,
    connectedAccount,
    accountMatchStatus: authState.accountMatchStatus,
    accessMode: sourceMode,
    status: overallStatus,
    message: failedResults.length > 0
      ? "Google account connected, but one or more registry tabs need attention."
      : hasReadableRows
        ? "Google account connected and authenticated registry reads succeeded."
        : "Connected workbook was reachable but returned no rows.",
    nextAction: failedResults.length > 0
      ? (failedResults[0].status === "access_denied"
        ? "Review registry permissions and try again."
        : failedResults[0].status === "tab_missing"
          ? "Add the missing tab or remap the source."
          : failedResults[0].status === "file_missing"
            ? "Check the selected registry source."
            : "Review the connected workbook and retry.")
      : "Open Registry Summary or refresh the workspace.",
    sourceMetadata: {
      family: "Connected Google Registry",
      label: sourceResolutionLabel,
      detail: sourceFallbackLabel || "Authenticated Google Sheets API reads were used."
    },
    masterWorkbook: masterSummary,
    connectedRegistryCatalog: catalogSummary,
    discoveredRegistryCount: discovery.discoveredRegistryFiles.length,
    authenticatedReadableRegistryCount,
    publicReadableRegistryCount,
    tabResults
  };
}
