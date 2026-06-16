import { parseGoogleSheetUrl } from "./dataSourceEngine";
import { disconnectGoogleWorkspaceAccess, getGoogleWorkspaceAccessToken } from "./googleWorkspaceAuth";
import { DashboardSourceState } from "./dashboardDataResolver";
import { BootstrapDestinationPreview, BootstrapProposedRow } from "./registryBootstrapPreview";
import { findMissingRequiredHeaders, normalizeHeaderForComparison } from "./registrySchema";

export interface BootstrapWriteGroupResult {
  groupId: string;
  spreadsheet: string;
  tab: string;
  primaryKeyColumn: string;
  created: number;
  skipped: number;
  errors: string[];
  writtenKeys: string[];
  skippedKeys: string[];
}

export interface BootstrapWritebackResult {
  appliedAt: string;
  approvedBy: string;
  totalCreated: number;
  totalSkipped: number;
  errors: string[];
  groups: BootstrapWriteGroupResult[];
}

export interface BootstrapWritebackProgress {
  phase: "preparing" | "checking_tab" | "validating_rows" | "appending_rows" | "writing_log" | "group_complete" | "group_error" | "complete";
  message: string;
  spreadsheet?: string;
  tab?: string;
  groupIndex?: number;
  groupTotal?: number;
  rowsToCreate?: number;
  created?: number;
  skipped?: number;
  error?: string;
}

const LOG_TAB_NAME = "Registry_Bootstrap_Log";
const LOG_HEADERS = ["timestamp", "registry", "tab", "primary_key", "action", "source", "approved_by", "error_message"];

function groupId(destination: Pick<BootstrapDestinationPreview, "spreadsheet" | "tab" | "primaryKeyColumn">): string {
  return `${destination.spreadsheet}::${destination.tab}::${destination.primaryKeyColumn}`;
}

function encodeSheetRange(tabName: string, range: string): string {
  return encodeURIComponent(`'${tabName.replace(/'/g, "''")}'!${range}`);
}

function registryUrlFor(sourceState: DashboardSourceState, spreadsheet: string): string {
  return sourceState.registries.find((registry) => registry.label === spreadsheet)?.url || "";
}

function sheetRequestHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };
}

async function sheetsFetch<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...sheetRequestHeaders(accessToken),
      ...(init?.headers || {})
    }
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = payload?.error?.message || response.statusText || "Google Sheets request failed.";
    if (response.status === 401) {
      disconnectGoogleWorkspaceAccess();
      throw new Error("Google Sheets write access expired. Reconnect and retry.");
    }
    if (response.status === 403) {
      throw new Error(`Google Sheets write access was denied: ${message}`);
    }
    throw new Error(message);
  }
  return payload as T;
}

async function getSpreadsheetTabs(spreadsheetId: string, accessToken: string): Promise<Set<string>> {
  const metadata = await sheetsFetch<{ sheets?: { properties?: { title?: string } }[] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    accessToken
  );
  return new Set((metadata.sheets || []).map((sheet) => sheet.properties?.title || "").filter(Boolean));
}

async function readTabValues(spreadsheetId: string, tab: string, accessToken: string): Promise<string[][]> {
  const range = encodeSheetRange(tab, "A:ZZ");
  const payload = await sheetsFetch<{ values?: string[][] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    accessToken
  );
  return payload.values || [];
}

async function appendValues(spreadsheetId: string, tab: string, values: string[][], accessToken: string): Promise<void> {
  if (values.length === 0) return;
  const range = encodeSheetRange(tab, "A:ZZ");
  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ values })
    }
  );
}

async function updateValues(spreadsheetId: string, tab: string, rangeA1: string, values: string[][], accessToken: string): Promise<void> {
  const range = encodeSheetRange(tab, rangeA1);
  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({ values })
    }
  );
}

async function ensureBootstrapLogTab(spreadsheetId: string, accessToken: string): Promise<void> {
  const tabs = await getSpreadsheetTabs(spreadsheetId, accessToken);
  if (!tabs.has(LOG_TAB_NAME)) {
    await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: LOG_TAB_NAME } } }] })
      }
    );
  }

  const values = await readTabValues(spreadsheetId, LOG_TAB_NAME, accessToken);
  if (values.length === 0) {
    await updateValues(spreadsheetId, LOG_TAB_NAME, "A1:H1", [LOG_HEADERS], accessToken);
  }
}

function duplicateKeys(keys: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  keys.forEach((key) => {
    if (!key) return;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  });
  return Array.from(duplicates);
}

function buildLogRows(
  timestamp: string,
  approvedBy: string,
  destination: BootstrapDestinationPreview,
  actions: { row: BootstrapProposedRow; action: "created" | "skipped" | "error"; error?: string }[]
): string[][] {
  return actions.map(({ row, action, error }) => [
    timestamp,
    destination.spreadsheet,
    destination.tab,
    row.primaryKeyValue,
    action,
    row.source,
    approvedBy,
    error || ""
  ]);
}

export async function applyRegistryBootstrapWriteback(options: {
  sourceState: DashboardSourceState;
  destinations: BootstrapDestinationPreview[];
  approvedBy?: string;
  accessToken?: string;
  onProgress?: (progress: BootstrapWritebackProgress) => void;
}): Promise<BootstrapWritebackResult> {
  const accessToken = options.accessToken || await getGoogleWorkspaceAccessToken();
  if (!accessToken) {
    throw new Error("Connect Google Sheets Write Access before applying setup rows.");
  }

  const appliedAt = new Date().toISOString();
  const approvedBy = options.approvedBy || "Schooly user";
  const groups: BootstrapWriteGroupResult[] = [];
  options.onProgress?.({
    phase: "preparing",
    message: "Preparing selected safe foundation rows for append-only writeback.",
    groupTotal: options.destinations.length
  });

  for (const [destinationIndex, destination] of options.destinations.entries()) {
    const currentAccessToken = accessToken;
    const progressBase = {
      spreadsheet: destination.spreadsheet,
      tab: destination.tab,
      groupIndex: destinationIndex + 1,
      groupTotal: options.destinations.length
    };
    const result: BootstrapWriteGroupResult = {
      groupId: groupId(destination),
      spreadsheet: destination.spreadsheet,
      tab: destination.tab,
      primaryKeyColumn: destination.primaryKeyColumn,
      created: 0,
      skipped: 0,
      errors: [],
      writtenKeys: [],
      skippedKeys: []
    };
    groups.push(result);

    const registryUrl = registryUrlFor(options.sourceState, destination.spreadsheet);
    const parsed = parseGoogleSheetUrl(registryUrl);
    if (!parsed) {
      result.errors.push(`No writable Google Sheet URL is configured for ${destination.spreadsheet}.`);
      options.onProgress?.({
        ...progressBase,
        phase: "group_error",
        message: `No writable Google Sheet URL is configured for ${destination.spreadsheet}.`,
        error: result.errors[result.errors.length - 1]
      });
      continue;
    }

    try {
      options.onProgress?.({
        ...progressBase,
        phase: "checking_tab",
        message: `Checking ${destination.spreadsheet} / ${destination.tab}.`
      });
      const tabs = await getSpreadsheetTabs(parsed.sheetId, currentAccessToken);
      if (!tabs.has(destination.tab)) {
        throw new Error(`${destination.spreadsheet} / ${destination.tab} is missing. Schooly will not create destination tabs during bootstrap writeback.`);
      }

      options.onProgress?.({
        ...progressBase,
        phase: "validating_rows",
        message: `Validating headers and existing primary keys for ${destination.tab}.`
      });
      const proposedRows = destination.rows.filter((row) => !row.skippedBecauseKeyExists);
      const proposedDuplicates = duplicateKeys(proposedRows.map((row) => row.primaryKeyValue));
      if (proposedDuplicates.length > 0) {
        throw new Error(`Duplicate primary key(s) in the selected proposal: ${proposedDuplicates.join(", ")}.`);
      }

      const values = await readTabValues(parsed.sheetId, destination.tab, currentAccessToken);
      const headers = (values[0] || []).map((header) => String(header || "").trim());
      const normalizedHeaderMap = new Map(headers.map((header, index) => [normalizeHeaderForComparison(header), { header, index }]));
      const primaryKeyMeta = normalizedHeaderMap.get(normalizeHeaderForComparison(destination.primaryKeyColumn));
      const missingHeaders = findMissingRequiredHeaders(destination.tab, headers);
      const primaryKeyIndex = primaryKeyMeta?.index ?? -1;
      if (missingHeaders.length > 0) {
        throw new Error(`${destination.spreadsheet} / ${destination.tab} is missing required header(s): ${missingHeaders.join(", ")}.`);
      }
      if (primaryKeyIndex < 0) {
        throw new Error(`${destination.spreadsheet} / ${destination.tab} is missing primary key column ${destination.primaryKeyColumn}.`);
      }

      const existingKeys = values.slice(1).map((row) => String(row[primaryKeyIndex] || "").trim()).filter(Boolean);
      const existingDuplicates = duplicateKeys(existingKeys);
      if (existingDuplicates.length > 0) {
        throw new Error(`${destination.spreadsheet} / ${destination.tab} already contains duplicate primary key(s): ${existingDuplicates.join(", ")}.`);
      }

      const existingKeySet = new Set(existingKeys);
      const rowsToCreate: BootstrapProposedRow[] = [];
      const actions: { row: BootstrapProposedRow; action: "created" | "skipped" | "error"; error?: string }[] = [];

      destination.rows.forEach((row) => {
        if (row.skippedBecauseKeyExists || existingKeySet.has(row.primaryKeyValue)) {
          result.skipped += 1;
          result.skippedKeys.push(row.primaryKeyValue);
          actions.push({ row, action: "skipped" });
          return;
        }
        rowsToCreate.push(row);
      });

      const appendRows = rowsToCreate.map((row) =>
        headers.map((header) => {
          if (normalizeHeaderForComparison(header) === normalizeHeaderForComparison(destination.primaryKeyColumn)) return row.primaryKeyValue;
          return row.row[header] ?? "";
        })
      );

      options.onProgress?.({
        ...progressBase,
        phase: "appending_rows",
        message: rowsToCreate.length > 0
          ? `Appending ${rowsToCreate.length} new row${rowsToCreate.length === 1 ? "" : "s"} to ${destination.tab}.`
          : `No new rows needed for ${destination.tab}; existing primary keys are preserved.`,
        rowsToCreate: rowsToCreate.length
      });
      await appendValues(parsed.sheetId, destination.tab, appendRows, currentAccessToken);
      rowsToCreate.forEach((row) => {
        result.created += 1;
        result.writtenKeys.push(row.primaryKeyValue);
        actions.push({ row, action: "created" });
      });

      options.onProgress?.({
        ...progressBase,
        phase: "writing_log",
        message: `Writing bootstrap audit log for ${destination.tab}.`,
        created: result.created,
        skipped: result.skipped
      });
      await ensureBootstrapLogTab(parsed.sheetId, currentAccessToken);
      await appendValues(parsed.sheetId, LOG_TAB_NAME, buildLogRows(appliedAt, approvedBy, destination, actions), currentAccessToken);
      options.onProgress?.({
        ...progressBase,
        phase: "group_complete",
        message: `${destination.spreadsheet} / ${destination.tab} complete: ${result.created} created, ${result.skipped} skipped.`,
        created: result.created,
        skipped: result.skipped
      });
    } catch (error: any) {
      const errorMessage = error?.message || "Google Sheets write failed.";
      result.errors.push(errorMessage);
      options.onProgress?.({
        ...progressBase,
        phase: "group_error",
        message: `${destination.spreadsheet} / ${destination.tab} could not be written.`,
        error: errorMessage
      });
      if (/Google Sheets write access (expired|was denied)/i.test(errorMessage)) {
        continue;
      }
      try {
        const logAccessToken = options.accessToken || await getGoogleWorkspaceAccessToken();
        if (!logAccessToken) {
          continue;
        }
        await ensureBootstrapLogTab(parsed.sheetId, logAccessToken);
        await appendValues(
          parsed.sheetId,
          LOG_TAB_NAME,
          buildLogRows(appliedAt, approvedBy, destination, destination.rows.map((row) => ({
            row,
            action: "error",
            error: error?.message || "Google Sheets write failed."
          }))),
          logAccessToken
        );
      } catch {
        result.errors.push("Could not write Registry_Bootstrap_Log entry for this failed operation.");
      }
    }
  }

  options.onProgress?.({
    phase: "complete",
    message: "Writeback finished. Schooly is refreshing live registry status.",
    groupTotal: options.destinations.length,
    created: groups.reduce((sum, group) => sum + group.created, 0),
    skipped: groups.reduce((sum, group) => sum + group.skipped, 0)
  });

  return {
    appliedAt,
    approvedBy,
    totalCreated: groups.reduce((sum, group) => sum + group.created, 0),
    totalSkipped: groups.reduce((sum, group) => sum + group.skipped, 0),
    errors: groups.flatMap((group) => group.errors),
    groups
  };
}
