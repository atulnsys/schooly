import { parseGoogleSheetUrl } from "./dataSourceEngine";
import { getGoogleWorkspaceAccessToken, getGoogleWorkspaceAuthState } from "./googleWorkspaceAuth";

export type GoogleSheetRow = Record<string, string>;
export type GoogleSheetReadPolicy = "authenticated-required" | "authenticated-preferred" | "public-only";
export type GoogleSheetReadSourceMode = "authenticated" | "public";
export type GoogleSheetReadErrorCode =
  | "AUTH_REQUIRED"
  | "TOKEN_EXPIRED"
  | "ACCESS_DENIED"
  | "INVALID_URL"
  | "UNKNOWN";

export interface GoogleSheetTabResult {
  headers: string[];
  rows: GoogleSheetRow[];
  source: "google-sheets-api" | "gviz-public";
  accessMode: GoogleSheetReadSourceMode;
  readPolicy: GoogleSheetReadPolicy;
  checkedAt: string;
}

export class GoogleSheetReadError extends Error {
  code: GoogleSheetReadErrorCode;
  source: "google-sheets-api" | "gviz-public" | "auth";
  status?: number;

  constructor(
    message: string,
    code: GoogleSheetReadErrorCode,
    source: "google-sheets-api" | "gviz-public" | "auth",
    status?: number,
  ) {
    super(message);
    this.name = "GoogleSheetReadError";
    this.code = code;
    this.source = source;
    this.status = status;
  }
}

const inFlightReads = new Map<string, Promise<GoogleSheetTabResult>>();

function normalizeKey(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function cellToString(cell: unknown): string {
  if (cell == null) return "";
  if (typeof cell === "string") return cell.trim();
  if (typeof cell === "number" || typeof cell === "boolean") return String(cell);
  if (typeof cell === "object") {
    const typed = cell as { v?: unknown; f?: unknown };
    if (typeof typed.v !== "undefined" && typed.v != null) return String(typed.v).trim();
    if (typeof typed.f !== "undefined" && typed.f != null) return String(typed.f).trim();
  }
  return "";
}

function looksLikeGeneratedColumnLabels(headers: string[]): boolean {
  return headers.length > 0 && headers.every((header, index) => {
    let label = "";
    let n = index + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      label = String.fromCharCode(65 + rem) + label;
      n = Math.floor((n - 1) / 26);
    }
    return header === normalizeKey(label);
  });
}

function parseValuesTable(values: unknown[][]): { headers: string[]; rows: GoogleSheetRow[] } {
  const firstRow = Array.isArray(values) ? values[0] || [] : [];
  const headers = firstRow.map((value, index) => String(value || `column_${index + 1}`).trim());
  const normalizedHeaders = headers.map((header, index) => normalizeKey(header || `column_${index + 1}`));
  const dataRows = Array.isArray(values) ? values.slice(1) : [];

  const rows = dataRows
    .map((row) => {
      const entry: GoogleSheetRow = {};
      (row || []).forEach((cell, index) => {
        entry[normalizedHeaders[index] || `column_${index + 1}`] = cellToString(cell);
      });
      return entry;
    })
    .filter((row) => Object.values(row).some((value) => String(value || "").trim() !== ""));

  return { headers, rows };
}

function parseGvizTable(text: string): { headers: string[]; rows: GoogleSheetRow[] } {
  const match = text.match(/setResponse\(([\s\S]+)\);\s*$/);
  if (!match) throw new Error("Unexpected Google Sheets response format.");
  const payload = JSON.parse(match[1]);
  const rawHeaders = (payload?.table?.cols || []).map((col: any, index: number) =>
    String(col.label || col.id || col.columnId || `column_${index + 1}`).trim()
  );
  const bodyRows = payload?.table?.rows || [];
  const firstRowValues = (bodyRows[0]?.c || []).map(cellToString);
  const useFirstRowAsHeaders = looksLikeGeneratedColumnLabels(rawHeaders.map(normalizeKey)) &&
    firstRowValues.some((value: string) => value.trim() !== "");
  const headers = useFirstRowAsHeaders ? firstRowValues.map((value: string) => value.trim()) : rawHeaders;
  const normalizedHeaders = headers.map((header, index) => normalizeKey(header || `column_${index + 1}`));
  const dataRows = useFirstRowAsHeaders ? bodyRows.slice(1) : bodyRows;
  const rows = dataRows
    .map((row: any) => {
      const entry: GoogleSheetRow = {};
      (row.c || []).forEach((cell: any, index: number) => {
        entry[normalizedHeaders[index] || `column_${index + 1}`] = cellToString(cell);
      });
      return entry;
    })
    .filter((row: GoogleSheetRow) => Object.values(row).some((value) => String(value || "").trim() !== ""));
  return { headers, rows };
}

function buildCacheKey(sheetId: string, tabName: string, sourceMode: GoogleSheetReadSourceMode, policy: GoogleSheetReadPolicy): string {
  return `${sheetId}::${normalizeKey(tabName)}::${sourceMode}::${policy}`;
}

async function readTabWithGoogleSheetsApi(sheetId: string, tabName: string, token: string, policy: GoogleSheetReadPolicy): Promise<GoogleSheetTabResult> {
  const range = encodeURIComponent(tabName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?majorDimension=ROWS`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401) {
      throw new GoogleSheetReadError("Google Sheets access expired. Reconnect Workspace and retry.", "TOKEN_EXPIRED", "google-sheets-api", response.status);
    }
    if (response.status === 403) {
      throw new GoogleSheetReadError("Google Sheets access was denied. Verify the connected account and sheet permissions.", "ACCESS_DENIED", "google-sheets-api", response.status);
    }
    throw new GoogleSheetReadError(detail || `Tab '${tabName}' returned ${response.status}.`, "UNKNOWN", "google-sheets-api", response.status);
  }

  const payload = await response.json() as { values?: unknown[][] };
  const { headers, rows } = parseValuesTable(payload.values || []);
  return {
    headers,
    rows,
    source: "google-sheets-api",
    accessMode: "authenticated",
    readPolicy: policy,
    checkedAt: new Date().toISOString()
  };
}

async function readTabWithPublicGviz(sheetId: string, tabName: string, policy: GoogleSheetReadPolicy): Promise<GoogleSheetTabResult> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const response = await fetch(url, { headers: { Accept: "text/plain, */*" } });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GoogleSheetReadError(detail || `Tab '${tabName}' returned ${response.status}.`, "UNKNOWN", "gviz-public", response.status);
  }
  const { headers, rows } = parseGvizTable(await response.text());
  return {
    headers,
    rows,
    source: "gviz-public",
    accessMode: "public",
    readPolicy: policy,
    checkedAt: new Date().toISOString()
  };
}

export function clearGoogleSheetReadCache(): void {
  inFlightReads.clear();
}

export async function readGoogleSheetTabRows(
  sheetUrl: string,
  tabName: string,
  options: { policy?: GoogleSheetReadPolicy } = {}
): Promise<GoogleSheetTabResult> {
  const policy = options.policy || "authenticated-preferred";
  const parsed = parseGoogleSheetUrl(sheetUrl);
  if (!parsed) {
    throw new GoogleSheetReadError("Google Sheets URL is not configured or invalid.", "INVALID_URL", "auth");
  }

  const token = getGoogleWorkspaceAccessToken();
  const sourceMode: GoogleSheetReadSourceMode = policy === "public-only"
    ? "public"
    : token
      ? "authenticated"
      : "public";
  const cacheKey = buildCacheKey(parsed.sheetId, tabName, sourceMode, policy);

  const inFlight = inFlightReads.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      if (policy === "public-only") {
        return await readTabWithPublicGviz(parsed.sheetId, tabName, policy);
      }

      if (policy === "authenticated-required") {
        if (!token) {
          const authState = getGoogleWorkspaceAuthState();
          if (authState.errorMessage && /expired/i.test(authState.errorMessage)) {
            throw new GoogleSheetReadError(authState.errorMessage, "TOKEN_EXPIRED", "auth");
          }
          throw new GoogleSheetReadError("Google account connection required. Connect Google Workspace and retry.", "AUTH_REQUIRED", "auth");
        }
        return await readTabWithGoogleSheetsApi(parsed.sheetId, tabName, token, policy);
      }

      if (token) {
        return await readTabWithGoogleSheetsApi(parsed.sheetId, tabName, token, policy);
      }

      return await readTabWithPublicGviz(parsed.sheetId, tabName, policy);
    } finally {
      inFlightReads.delete(cacheKey);
    }
  })();

  inFlightReads.set(cacheKey, promise);
  return promise;
}
