import {
  CANONICAL_DASHBOARD_SOURCE_DISPLAY_NAME,
  LEGACY_DASHBOARD_SOURCE_DISPLAY_NAME,
  loadSeededRegistryConfig
} from "./seededRegistryConfig";

export const DASHBOARD_SHEET_STORAGE_KEY = "schooly_dashboard_sheet_url";

export const DEFAULT_DASHBOARD_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1jz1VHYUKxOJ0Ia0H9J3MZvJVm15lktz7CF4XBI2Tb3Y/edit";

export function isGoogleSheetsUrl(url: string): boolean {
  if (!url) return false;
  return url.trim().toLowerCase().startsWith("https://docs.google.com/spreadsheets/d/");
}

export function isUploadedExcelUrl(url: string): boolean {
  const lowered = String(url || "").trim().toLowerCase();
  return lowered.endsWith(".xlsx") ||
    lowered.includes("export?format=xlsx") ||
    lowered.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export function getDashboardSourceHealthWarnings(candidateUrl?: string): string[] {
  const warnings: string[] = [];
  const raw = String(candidateUrl || "").trim();
  const lowered = raw.toLowerCase();
  const legacyName = LEGACY_DASHBOARD_SOURCE_DISPLAY_NAME.toLowerCase();
  const canonicalName = CANONICAL_DASHBOARD_SOURCE_DISPLAY_NAME.toLowerCase();

  if (raw && isUploadedExcelUrl(raw)) {
    warnings.push("This file is an uploaded Excel file, not a native Google Sheet. Open it with Google Sheets or use the converted Google Sheet URL.");
  }

  if (lowered.includes(legacyName)) {
    warnings.push("Legacy dashboard source configured. This may still work only if legacy tab aliases are supported. Recommended: switch to Schooly_Dashboard_Source_SEEDED.");
  }

  try {
    const seeded = loadSeededRegistryConfig().dashboardDataSourceUrl.trim();
    const saved = localStorage.getItem(DASHBOARD_SHEET_STORAGE_KEY)?.trim() || "";
    const configuredValues = [raw, seeded, saved].filter(Boolean);
    const hasCanonical = configuredValues.some((value) => value.toLowerCase().includes(canonicalName));
    const hasLegacy = configuredValues.some((value) => value.toLowerCase().includes(legacyName));

    if (hasCanonical && hasLegacy) {
      warnings.push("Two dashboard source workbooks detected. Using Schooly_Dashboard_Source_SEEDED. Archive the older Schooly_Dashboard_Data_Source_SEEDED after confirming data migration.");
    }
  } catch {
    // Ignore localStorage access issues in browser-restricted contexts.
  }

  return Array.from(new Set(warnings));
}

export function getConfiguredDashboardSheetUrl(candidateUrl?: string): string {
  const trimmedCandidate = candidateUrl?.trim();
  if (trimmedCandidate && isGoogleSheetsUrl(trimmedCandidate)) {
    return trimmedCandidate;
  }

  try {
    const seeded = loadSeededRegistryConfig().dashboardDataSourceUrl.trim();
    if (seeded && isGoogleSheetsUrl(seeded)) {
      return seeded;
    }

    const saved = localStorage.getItem(DASHBOARD_SHEET_STORAGE_KEY)?.trim();
    if (saved && isGoogleSheetsUrl(saved)) {
      return saved;
    }
  } catch {
    // Ignore storage access issues in static/browser sandboxed modes.
  }

  return DEFAULT_DASHBOARD_SHEET_URL;
}
