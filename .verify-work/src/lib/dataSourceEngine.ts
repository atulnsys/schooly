/**
 * Schooly AI — Connector-Ready Data-Source Abstraction Layer
 * This script serves as the engine to govern data connection states, Mode classifications,
 * link validations, and transparent fallback notifications when mock datasets are in use.
 */

export type DataSourceMode = "mock" | "live";

export interface SchoolyDataSource {
  id: string;               // e.g. "google_workspace", "google_classroom", "academic_repository", "forms_monitoring", "governance_compliance"
  name: string;             // Display name (e.g. "Google Workspace Directory")
  mode: DataSourceMode;     // Active execution mode
  configuredUrl: string;    // Placed user-facing sync URL
  status: "connected" | "disconnected" | "error"; // Synced link status
  lastSynced: string | null; // Last successful sync timestamp
}

export interface DataSourceResult<T> {
  data: T;
  mode: DataSourceMode;
  source: string;
  isFallback: boolean;
  statusText: string;
}

/**
 * Lightweight URL/Link validation filter
 * Accepts patterns starting with drive.google.com, docs.google.com, or classroom.google.com
 */
export function validateSourceLink(url: string, type: "google_workspace" | "google_classroom" | string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  
  if (type === "google_workspace") {
    return trimmed.startsWith("https://drive.google.com/") || trimmed.startsWith("https://docs.google.com/");
  }
  if (type === "google_classroom") {
    return trimmed.startsWith("https://classroom.google.com/");
  }
  
  // Generic fallback patterns
  return trimmed.startsWith("https://drive.google.com/") || 
         trimmed.startsWith("https://docs.google.com/") || 
         trimmed.startsWith("https://classroom.google.com/");
}

/**
 * Persists Google Cloud Connection properties inside localStorage
 */
export function saveConnectionConfig(type: "google_workspace" | "google_classroom", url: string, isConnected: boolean): void {
  try {
    if (type === "google_workspace") {
      localStorage.setItem("schooly_workspace_url", url);
      localStorage.setItem("schooly_workspace_connected", isConnected ? "true" : "false");
      if (isConnected) {
        localStorage.setItem("schooly_workspace_last_synced", new Date().toISOString());
      }
    } else if (type === "google_classroom") {
      localStorage.setItem("schooly_classroom_url", url);
      localStorage.setItem("schooly_classroom_connected", isConnected ? "true" : "false");
      if (isConnected) {
        localStorage.setItem("schooly_classroom_last_synced", new Date().toISOString());
      }
    }
  } catch (e) {
    console.warn("[PERSISTENCE WARNING] Saved connection state limited by sandbox restrictions.", e);
  }
}

/**
 * Retreives active connection properties from local states
 */
export function loadConnectionConfig(type: "google_workspace" | "google_classroom") {
  try {
    const isConnected = localStorage.getItem(`schooly_${type === "google_workspace" ? "workspace" : "classroom"}_connected`) === "true";
    const savedUrl = localStorage.getItem(`schooly_${type === "google_workspace" ? "workspace" : "classroom"}_url`) || "";
    const lastSynced = localStorage.getItem(`schooly_${type === "google_workspace" ? "workspace" : "classroom"}_last_synced`) || null;
    
    // Light validations
    const isValid = validateSourceLink(savedUrl, type);
    const resolvedMode: DataSourceMode = (isConnected && isValid) ? "live" : "mock";
    
    return {
      id: type,
      name: type === "google_workspace" ? "Google Workspace Directory" : "Google Classroom Streams",
      mode: resolvedMode,
      configuredUrl: savedUrl,
      status: isConnected && isValid ? "connected" as const : (savedUrl && !isValid ? "error" as const : "disconnected" as const),
      lastSynced: isConnected && isValid ? lastSynced : null
    };
  } catch {
    return {
      id: type,
      name: type === "google_workspace" ? "Google Workspace" : "Google Classroom",
      mode: "mock" as DataSourceMode,
      configuredUrl: "",
      status: "disconnected" as const,
      lastSynced: null
    };
  }
}

/**
 * Standard plain copy alerts dictionary for faculty users
 */
export const FALLBACK_ALERT_MESSAGES = {
  BANNER_HEADING: "Fallback Data Active (Simulated Workspace)",
  BANNER_COPY: "Real-time Google Workspace sync is not connected. The information shown is a mock simulation. Please link a valid Google Drive folder or Google Classroom link under 'School Drive Structure' or our Universal Search configuration panel to enable live data integration.",
  DISCONNECTED_COORDINATOR: "Coordinator sync fallback loaded. Connect classroom.google.com to retrieve live lesson plannings checklists.",
  DASHBOARD_NOTICE_SHORT: "Previewing Simulated Dataset",
  NOT_CONNECTED_WARN: "No active Google connection"
};
