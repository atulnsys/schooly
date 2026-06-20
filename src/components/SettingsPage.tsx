import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Lock,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { ClassroomAssignment, ClassroomCourse, StudentDetails, TeacherDetails, WorkspaceFile } from "../types";
import type { SchoolRegistryState } from "../lib/schoolRegistry";
import {
  connectGoogleWorkspaceReadAccess,
  connectGoogleWorkspaceWriteAccess,
  disconnectGoogleWorkspaceAccess,
  getGoogleWorkspaceAuthState,
  getGoogleWorkspaceAccessToken,
  setGoogleWorkspaceAccountHint,
  type GoogleWorkspaceAuthState
} from "../lib/googleWorkspaceAuth";
import { parseGoogleSheetUrl, validateSourceLink } from "../lib/dataSourceEngine";
import { discoverRegistrySources } from "../lib/registrySourceDiscovery";
import { getRegistryExplorerSummary } from "../lib/registryExplorerEntityDefinition";
import { loadSeededRegistryConfig } from "../lib/seededRegistryConfig";
import { readGoogleSheetTabRows } from "../lib/googleSheetRead";
import LiveDataReconciliationPanel from "./LiveDataReconciliationPanel";

type SettingsSection = "organization" | "registry" | "summary" | "application" | "advanced";

interface OrganizationDraft {
  organizationName: string;
  organizationCode: string;
  board: string;
  medium: string;
  academicYear: string;
  principalName: string;
  city: string;
  state: string;
  country: string;
}

interface ConnectionTestSnapshot {
  success: boolean;
  checkedAt: string;
  message: string;
  registryLocationStatus: string;
  registryCatalogStatus: string;
  googleAccount: string;
  accountMatch: string;
  registriesDiscovered: number;
  registriesReadable: number;
  nextAction: string;
}

interface SummaryRow {
  displayName: string;
  registryId: string;
  sourceTab: string;
  sourceState: string;
  rawRecords: number;
  usableRecords: number;
  excludedRecords: number;
  routeLabel: string;
}

interface SettingsPageProps {
  currentRole: string;
  currentUser: string;
  workspaceUrl: string;
  geminiApiKey: string;
  schoolRegistry: SchoolRegistryState | null;
  files: WorkspaceFile[];
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  students: StudentDetails[];
  teachers: TeacherDetails[];
  googleWorkspaceAuthState: GoogleWorkspaceAuthState;
  onWorkspaceUrlSave: (url: string) => void;
  onGeminiApiKeySave: (value: string) => void;
  onRefreshData: () => Promise<void> | void;
  onNavigateTab: (tab: string) => void;
  onDisconnectWorkspace: () => void;
  settingsSection?: string | null;
}

const ORGANIZATION_STORAGE_KEY = "schooly_settings_organization_draft";
const REGISTRY_ACCOUNT_STORAGE_KEY = "schooly_registry_access_account";

function safeLocalStorageGet(key: string): string {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage restrictions.
  }
}

function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage restrictions.
  }
}

function loadOrganizationDraft(): OrganizationDraft {
  try {
    const saved = localStorage.getItem(ORGANIZATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<OrganizationDraft>;
      return {
        organizationName: String(parsed.organizationName || "").trim(),
        organizationCode: String(parsed.organizationCode || "").trim(),
        board: String(parsed.board || "").trim(),
        medium: String(parsed.medium || "").trim(),
        academicYear: String(parsed.academicYear || "").trim(),
        principalName: String(parsed.principalName || "").trim(),
        city: String(parsed.city || "").trim(),
        state: String(parsed.state || "").trim(),
        country: String(parsed.country || "").trim()
      };
    }
  } catch {
    // Ignore malformed storage.
  }
  return {
    organizationName: "",
    organizationCode: "",
    board: "",
    medium: "",
    academicYear: "",
    principalName: "",
    city: "",
    state: "",
    country: ""
  };
}

function saveOrganizationDraft(draft: OrganizationDraft): void {
  safeLocalStorageSet(ORGANIZATION_STORAGE_KEY, JSON.stringify(draft));
}

function buildOrganizationDraftFromRegistry(registry: SchoolRegistryState | null): OrganizationDraft {
  const profile = registry?.schoolProfile?.[0] || null;
  const summary = registry?.registrySummary?.[0] || null;
  const classesSection = registry?.classesSections?.[0] || null;
  return {
    organizationName: String(profile?.school_name || summary?.school_name || "").trim(),
    organizationCode: String(profile?.school_id || summary?.school_id || "").trim(),
    board: String(profile?.board || summary?.board || "").trim(),
    medium: String(summary?.medium || classesSection?.medium || "").trim(),
    academicYear: String(profile?.academic_year || summary?.academic_year || registry?.academicYears?.[0]?.academic_year || "").trim(),
    principalName: String(summary?.principal_name || "").trim(),
    city: String(profile?.city || "").trim(),
    state: String(profile?.state || "").trim(),
    country: ""
  };
}

function normalizeCountRows(rows: Array<Record<string, any>>): { usableRecords: number; excludedRecords: number } {
  const excluded = rows.filter((row) => {
    const lowered = String(row?.status || "").trim().toLowerCase();
    return lowered === "archived" || lowered === "inactive" || lowered === "deleted" || lowered === "removed";
  }).length;
  return { usableRecords: Math.max(0, rows.length - excluded), excludedRecords: excluded };
}

function formatMatchLabel(status: GoogleWorkspaceAuthState["accountMatchStatus"]): string {
  if (status === "match") return "Match";
  if (status === "mismatch") return "Mismatch";
  if (status === "pending") return "Pending";
  if (status === "not_configured") return "Not configured";
  return "Unknown";
}

function getSettingsSectionId(section: SettingsSection): string {
  return `settings-section-${section}`;
}

export default function SettingsPage({
  currentRole,
  currentUser,
  workspaceUrl,
  geminiApiKey,
  schoolRegistry,
  files,
  courses,
  assignments,
  students,
  teachers,
  googleWorkspaceAuthState,
  onWorkspaceUrlSave,
  onGeminiApiKeySave,
  onRefreshData,
  onNavigateTab,
  onDisconnectWorkspace,
  settingsSection
}: SettingsPageProps) {
  const [organizationDraft, setOrganizationDraft] = useState<OrganizationDraft>(() => loadOrganizationDraft());
  const [workspaceUrlDraft, setWorkspaceUrlDraft] = useState(workspaceUrl);
  const [registryAccountDraft, setRegistryAccountDraft] = useState<string>(() => safeLocalStorageGet(REGISTRY_ACCOUNT_STORAGE_KEY) || googleWorkspaceAuthState.expectedAccount || "");
  const [geminiDraft, setGeminiDraft] = useState(geminiApiKey);
  const [useRegistryUpdateConfirm, setUseRegistryUpdateConfirm] = useState(false);
  const [organizationStatus, setOrganizationStatus] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionSnapshot, setConnectionSnapshot] = useState<ConnectionTestSnapshot | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(settingsSection === "advanced");
  const [writeAccessPending, setWriteAccessPending] = useState(false);
  const [writeAccessStatus, setWriteAccessStatus] = useState<string>("");

  const activeSection = (settingsSection as SettingsSection | null) || "organization";

  useEffect(() => {
    setWorkspaceUrlDraft(workspaceUrl);
  }, [workspaceUrl]);

  useEffect(() => {
    setGeminiDraft(geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    const saved = safeLocalStorageGet(REGISTRY_ACCOUNT_STORAGE_KEY) || googleWorkspaceAuthState.expectedAccount || "";
    if (saved) {
      setRegistryAccountDraft(saved);
    }
  }, [googleWorkspaceAuthState.expectedAccount]);

  useEffect(() => {
    if (settingsSection === "advanced") {
      setAdvancedOpen(true);
    }
  }, [settingsSection]);

  useEffect(() => {
    const targetSection = getSettingsSectionId(activeSection);
    window.requestAnimationFrame(() => {
      const target = document.getElementById(targetSection);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.focus?.({ preventScroll: true });
    });
  }, [activeSection]);

  const sectionButtons: Array<{ id: SettingsSection; label: string }> = [
    { id: "organization", label: "Organization" },
    { id: "registry", label: "Registry Connection" },
    { id: "summary", label: "Registry Summary" },
    { id: "application", label: "Application" },
    { id: "advanced", label: "Advanced" }
  ];

  const registrySourceDiscovery = useMemo(() => discoverRegistrySources(files), [files]);
  const registryCatalogSummary = useMemo(() => getRegistryExplorerSummary(), []);
  const registryMasterUrl = schoolRegistry?.config.masterDataRegistryUrl || loadSeededRegistryConfig().masterDataRegistryUrl;
  const registryLocationIsValid = validateSourceLink(workspaceUrlDraft, "google_workspace");
  const registryLocationLabel = !workspaceUrlDraft.trim()
    ? "Not configured"
    : registryLocationIsValid
      ? "Configured"
      : "Invalid link";
  const catalogStatusLabel = schoolRegistry?.mode === "live"
    ? `Live (${schoolRegistry.schoolProfile.length > 0 ? "found" : "empty"})`
    : schoolRegistry?.mode === "missing"
      ? "Unavailable"
      : schoolRegistry?.mode === "error"
        ? "Unavailable"
        : "Fallback";
  const connectedAccount = googleWorkspaceAuthState.connectedAccount || "Not connected";
  const accountMatchLabel = formatMatchLabel(googleWorkspaceAuthState.accountMatchStatus);

  const summaryRows = useMemo<SummaryRow[]>(() => {
    const studentRows = schoolRegistry?.studentDirectory || [];
    const enrollmentRows = schoolRegistry?.studentEnrollment || [];
    const staffRows = schoolRegistry?.staffDirectory || [];
    const teacherRows = schoolRegistry?.teacherAllocations || [];
    const classRows = schoolRegistry?.classesSections || [];
    const subjectRows = schoolRegistry?.subjects || [];
    const courseRows = courses || [];
    const assignmentRows = assignments || [];
    const bookRows = schoolRegistry?.booksRegistry || [];

    const items: SummaryRow[] = [
      {
        displayName: "Students",
        registryId: "students",
        sourceTab: "Student_Directory",
        sourceState: schoolRegistry?.mode === "live" ? (studentRows.length > 0 ? "Ready" : "0 records") : "Unavailable",
        rawRecords: studentRows.length,
        ...normalizeCountRows(studentRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Student Enrolments",
        registryId: "masterDataRegistryUrl__student-enrollment",
        sourceTab: "Student_Enrollment",
        sourceState: schoolRegistry?.mode === "live" ? (enrollmentRows.length > 0 ? "Ready" : "0 records") : "Unavailable",
        rawRecords: enrollmentRows.length,
        ...normalizeCountRows(enrollmentRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Staff",
        registryId: "staff",
        sourceTab: "Staff_Directory",
        sourceState: schoolRegistry?.mode === "live" ? (staffRows.length > 0 ? "Ready" : "0 records") : "Unavailable",
        rawRecords: staffRows.length,
        ...normalizeCountRows(staffRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Teachers",
        registryId: "teachers",
        sourceTab: "Teacher_Allocations",
        sourceState: schoolRegistry?.mode === "live" ? (teacherRows.length > 0 ? "Ready" : "0 records") : "Unavailable",
        rawRecords: teacherRows.length,
        ...normalizeCountRows(teacherRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Classes / Sections",
        registryId: "courses",
        sourceTab: "Classes_Sections",
        sourceState: schoolRegistry?.mode === "live" ? (classRows.length > 0 ? "Ready" : "0 records") : "Unavailable",
        rawRecords: classRows.length,
        ...normalizeCountRows(classRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Subjects",
        registryId: "masterDataRegistryUrl__subjects",
        sourceTab: "Subjects",
        sourceState: schoolRegistry?.mode === "live" ? (subjectRows.length > 0 ? "Ready" : "0 records") : "Unavailable",
        rawRecords: subjectRows.length,
        ...normalizeCountRows(subjectRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Teacher Allocations",
        registryId: "REG_TEACHER_ALLOCATIONS",
        sourceTab: "Teacher_Allocations",
        sourceState: schoolRegistry?.mode === "live" ? (teacherRows.length > 0 ? "Ready" : "0 records") : "Unavailable",
        rawRecords: teacherRows.length,
        ...normalizeCountRows(teacherRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Classroom Courses",
        registryId: "classroom-courses",
        sourceTab: "Classroom API",
        sourceState: courseRows.length > 0 ? "Ready" : "0 records",
        rawRecords: courseRows.length,
        ...normalizeCountRows(courseRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Assignments",
        registryId: "assignments",
        sourceTab: "Classroom API",
        sourceState: assignmentRows.length > 0 ? "Ready" : "0 records",
        rawRecords: assignmentRows.length,
        ...normalizeCountRows(assignmentRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Books / Textbooks",
        registryId: "textbooks",
        sourceTab: "Books_Registry",
        sourceState: schoolRegistry?.mode === "live" ? (bookRows.length > 0 ? "Ready" : "0 records") : "Unavailable",
        rawRecords: bookRows.length,
        ...normalizeCountRows(bookRows),
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Registry Catalog",
        registryId: "registry-catalog",
        sourceTab: "Registry Catalog",
        sourceState: "Ready",
        rawRecords: registryCatalogSummary.totalEntries,
        usableRecords: registryCatalogSummary.totalEntries,
        excludedRecords: 0,
        routeLabel: "Open in Registry Explorer"
      }
    ];

    return items.map((item) => ({
      ...item,
      sourceState: googleWorkspaceAuthState.accountMatchStatus === "mismatch" ? "Account mismatch" : item.sourceState
    }));
  }, [assignments, courses, googleWorkspaceAuthState.accountMatchStatus, schoolRegistry, registryCatalogSummary.totalEntries]);

  const handleSaveOrganization = () => {
    saveOrganizationDraft(organizationDraft);
    setOrganizationStatus("Saved locally.");
  };

  const handleUseRegistryValues = () => {
    const nextDraft = buildOrganizationDraftFromRegistry(schoolRegistry);
    setOrganizationDraft(nextDraft);
    saveOrganizationDraft(nextDraft);
    setOrganizationStatus("Loaded registry values into the editable form.");
  };

  const handleSaveConnection = () => {
    const trimmedUrl = workspaceUrlDraft.trim();
    if (!trimmedUrl) {
      setConnectionStatus("Add a registry link before saving.");
      return;
    }
    onWorkspaceUrlSave(trimmedUrl);
    safeLocalStorageSet(REGISTRY_ACCOUNT_STORAGE_KEY, registryAccountDraft.trim());
    setGoogleWorkspaceAccountHint(registryAccountDraft.trim() || null);
    setConnectionStatus("Connection details saved.");
  };

  const handleConnectGoogleAccount = async () => {
    setConnectionStatus("Connecting Google account...");
    try {
      setGoogleWorkspaceAccountHint(registryAccountDraft.trim() || null);
      await connectGoogleWorkspaceReadAccess(registryAccountDraft.trim() || null);
      setConnectionStatus("Google account connected for read access.");
      void onRefreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google account connection failed.";
      setConnectionStatus(message);
    }
  };

  const handleGrantWriteAccess = async () => {
    setWriteAccessPending(true);
    setWriteAccessStatus("Requesting write authorization...");
    try {
      setGoogleWorkspaceAccountHint(registryAccountDraft.trim() || null);
      await connectGoogleWorkspaceWriteAccess(registryAccountDraft.trim() || null);
      setWriteAccessStatus("Write authorization granted for approved registry updates.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Write authorization failed.";
      setWriteAccessStatus(message);
    } finally {
      setWriteAccessPending(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleWorkspaceAccess();
    onDisconnectWorkspace();
    setConnectionStatus("Disconnected.");
    setConnectionSnapshot(null);
  };

  const handleTestConnection = async () => {
    const trimmedUrl = workspaceUrlDraft.trim();
    if (!trimmedUrl) {
      setConnectionSnapshot({
        success: false,
        checkedAt: new Date().toISOString(),
        message: "Add a registry link first.",
        registryLocationStatus: "Not configured",
        registryCatalogStatus: "Unavailable",
        googleAccount: googleWorkspaceAuthState.connectedAccount || "Not connected",
        accountMatch: formatMatchLabel(googleWorkspaceAuthState.accountMatchStatus),
        registriesDiscovered: 0,
        registriesReadable: 0,
        nextAction: "Save a registry link"
      });
      return;
    }

    setTestingConnection(true);
    try {
      const authState = getGoogleWorkspaceAuthState();
      const sourceDiscovery = discoverRegistrySources(files);
      const registryUrl = registryMasterUrl || loadSeededRegistryConfig().masterDataRegistryUrl;
      const parsed = parseGoogleSheetUrl(registryUrl);
      const keyTabs = ["School_Profile", "Staff_Directory", "Student_Directory"];
      const results = await Promise.allSettled(
        parsed
          ? keyTabs.map((tabName) => readGoogleSheetTabRows(registryUrl, tabName))
          : []
      );
      const readableRegistries = results.filter((entry) => entry.status === "fulfilled").length;
      const registryCatalogStatus = schoolRegistry?.mode === "live" ? "Found" : "Unavailable";
      const connectionOk = Boolean(parsed) && Boolean(authState.clientIdConfigured) && authState.accountMatchStatus !== "mismatch" && readableRegistries > 0;
      setConnectionSnapshot({
        success: connectionOk,
        checkedAt: new Date().toISOString(),
        message: connectionOk
          ? "Registry connection looks ready."
          : "One or more registry checks need attention.",
        registryLocationStatus: registryLocationIsValid ? "Configured" : "Invalid link",
        registryCatalogStatus,
        googleAccount: authState.connectedAccount || authState.expectedAccount || "Not connected",
        accountMatch: formatMatchLabel(authState.accountMatchStatus),
        registriesDiscovered: sourceDiscovery.discoveredRegistryFiles.length,
        registriesReadable: readableRegistries,
        nextAction: authState.accountMatchStatus === "mismatch"
          ? "Use the matching Google account"
          : readableRegistries === 0
            ? "Reconnect or review the registry link"
            : "Open Registry Explorer"
      });
    } catch (error) {
      setConnectionSnapshot({
        success: false,
        checkedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Registry connection test failed.",
        registryLocationStatus: registryLocationIsValid ? "Configured" : "Invalid link",
        registryCatalogStatus: schoolRegistry?.mode === "live" ? "Found" : "Unavailable",
        googleAccount: googleWorkspaceAuthState.connectedAccount || googleWorkspaceAuthState.expectedAccount || "Not connected",
        accountMatch: formatMatchLabel(googleWorkspaceAuthState.accountMatchStatus),
        registriesDiscovered: registrySourceDiscovery.discoveredRegistryFiles.length,
        registriesReadable: 0,
        nextAction: "Review the link and try again"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveRegistryUpdate = async () => {
    if (!useRegistryUpdateConfirm) {
      setOrganizationStatus("Confirm the write before updating the registry.");
      return;
    }
    if (googleWorkspaceAuthState.authMode !== "write" || !getGoogleWorkspaceAccessToken()) {
      setOrganizationStatus("Grant write access before updating the registry.");
      return;
    }

    const parsed = parseGoogleSheetUrl(registryMasterUrl);
    if (!parsed) {
      setOrganizationStatus("Registry URL is missing or invalid.");
      return;
    }

    const rowValues = [
      organizationDraft.organizationCode || "",
      organizationDraft.organizationName || "",
      organizationDraft.academicYear || "",
      organizationDraft.board || "",
      organizationDraft.medium || "",
      organizationDraft.principalName || "",
      organizationDraft.city || "",
      organizationDraft.state || "",
      organizationDraft.country || "",
      "Active"
    ];

    const accessToken = getGoogleWorkspaceAccessToken();
    if (!accessToken) {
      setOrganizationStatus("Connect write access before updating the registry.");
      return;
    }

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${parsed.sheetId}/values/${encodeURIComponent("'School_Profile'!A2:J2")}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ values: [rowValues] })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      setOrganizationStatus(text || `Registry update failed with status ${response.status}.`);
      return;
    }

    setOrganizationStatus("Registry updated from the editable organization form.");
    void onRefreshData();
  };

  const googleAccountStatus = googleWorkspaceAuthState.connected ? "Connected" : "Not connected";
  const authModeLabel = googleWorkspaceAuthState.authMode === "write" ? "Write" : googleWorkspaceAuthState.authMode === "read" ? "Read" : "Idle";

  return (
    <main className="space-y-6 animate-fade-in">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Settings</div>
            <h1 className="text-xl font-black text-slate-900">Central Schooly Settings</h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Keep organization details, registry connection hints, and app configuration in one simple page. Dashboard pages stay focused on operational work.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sectionButtons.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  const target = document.getElementById(getSettingsSectionId(section.id));
                  target?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-extrabold ${activeSection === section.id ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Current role", currentRole],
            ["Current user", currentUser],
            ["Workspace", registryLocationLabel],
            ["Account", googleAccountStatus]
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
              <div className="mt-1 text-sm font-bold text-slate-900 truncate">{String(value)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id={getSettingsSectionId("organization")} tabIndex={-1}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Organization</div>
            <h2 className="text-base font-extrabold text-slate-900">Editable school profile</h2>
            <p className="text-xs text-slate-600 mt-1">Use live registry values where available, then save the local settings or update the registry with explicit write authorization.</p>
          </div>
          <button
            type="button"
            onClick={handleUseRegistryValues}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
          >
            Use Registry Values
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ["Organization / School Name", "organizationName"],
            ["Organization Code", "organizationCode"],
            ["Board / Affiliation", "board"],
            ["Medium", "medium"],
            ["Current Academic Year", "academicYear"],
            ["Principal / Organization Head", "principalName"],
            ["City", "city"],
            ["State", "state"],
            ["Country", "country"]
          ].map(([label, key]) => (
            <label key={String(key)} className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
              <input
                value={organizationDraft[key as keyof OrganizationDraft]}
                onChange={(event) => setOrganizationDraft((current) => ({ ...current, [key]: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveOrganization}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-blue-700"
          >
            Save Local Settings
          </button>
          <button
            type="button"
            onClick={handleSaveRegistryUpdate}
            disabled={!useRegistryUpdateConfirm || googleWorkspaceAuthState.authMode !== "write"}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-extrabold ${useRegistryUpdateConfirm && googleWorkspaceAuthState.authMode === "write" ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50" : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            Update Registry
            <ShieldCheck size={12} />
          </button>
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
            <input type="checkbox" checked={useRegistryUpdateConfirm} onChange={(event) => setUseRegistryUpdateConfirm(event.target.checked)} />
            I confirm this write
          </label>
        </div>
        {organizationStatus && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            {organizationStatus}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id={getSettingsSectionId("registry")} tabIndex={-1}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Registry Connection</div>
            <h2 className="text-base font-extrabold text-slate-900">Registry Access Google Account and source link</h2>
            <p className="text-xs text-slate-600 mt-1">The account field is only a login hint and comparison target. It is not a password or token.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">Auth {authModeLabel}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">Scope {googleWorkspaceAuthState.requiredScope === googleWorkspaceAuthState.writeScope ? "Sheets write" : "Sheets read"}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">Origin {googleWorkspaceAuthState.currentOrigin || "Unavailable"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Registry Access Google Account</div>
            <input
              value={registryAccountDraft}
              onChange={(event) => setRegistryAccountDraft(event.target.value)}
              onBlur={() => {
                safeLocalStorageSet(REGISTRY_ACCOUNT_STORAGE_KEY, registryAccountDraft.trim());
                setGoogleWorkspaceAccountHint(registryAccountDraft.trim() || null);
              }}
              placeholder="principal@example.edu"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Registry URL / Drive Folder URL</div>
            <input
              value={workspaceUrlDraft}
              onChange={(event) => setWorkspaceUrlDraft(event.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            ["Connected Google Account", connectedAccount],
            ["Account Match", accountMatchLabel],
            ["Authentication Status", googleWorkspaceAuthState.connected ? "Connected" : "Not connected"],
            ["Registry Location Status", registryLocationLabel]
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
              <div className="mt-1 text-sm font-bold text-slate-900 truncate">{String(value)}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ["Registry Catalog Status", catalogStatusLabel],
            ["Last Tested", connectionSnapshot?.checkedAt ? new Date(connectionSnapshot.checkedAt).toLocaleString() : "Not tested"]
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
              <div className="mt-1 text-sm font-bold text-slate-900 truncate">{String(value)}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveConnection}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-blue-700"
          >
            Save Connection
          </button>
          <button
            type="button"
            onClick={handleConnectGoogleAccount}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
          >
            Connect Google Account
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[11px] font-extrabold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          >
            <Search size={12} />
            {testingConnection ? "Testing..." : "Test Connection"}
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={!workspaceUrlDraft.trim()}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-extrabold ${workspaceUrlDraft.trim() ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            Disconnect
          </button>
        </div>

        {connectionStatus && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            {connectionStatus}
          </div>
        )}

        {connectionSnapshot && (
          <div className={`rounded-2xl border px-4 py-3 space-y-2 ${connectionSnapshot.success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-extrabold">{connectionSnapshot.message}</div>
              <span className="text-[10px] font-black uppercase tracking-wider">{connectionSnapshot.success ? "Ready" : "Needs attention"}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 text-xs">
              {[
                ["Google account", connectionSnapshot.googleAccount],
                ["Account match", connectionSnapshot.accountMatch],
                ["Registry location", connectionSnapshot.registryLocationStatus],
                ["Registry catalog", connectionSnapshot.registryCatalogStatus],
                ["Registries discovered", String(connectionSnapshot.registriesDiscovered)],
                ["Registries readable", String(connectionSnapshot.registriesReadable)],
                ["Last checked", new Date(connectionSnapshot.checkedAt).toLocaleString()],
                ["Next action", connectionSnapshot.nextAction]
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-white/70 bg-white/80 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
                  <div className="mt-1 font-semibold text-slate-900">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id={getSettingsSectionId("summary")} tabIndex={-1}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Registry Summary</div>
            <h2 className="text-base font-extrabold text-slate-900">Dynamic registry counts from the live school data</h2>
            <p className="text-xs text-slate-600 mt-1">Counts update from the live registry and classroom sources. They are not hard-coded.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("registries")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
          >
            Open Registry Explorer
            <ExternalLink size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {summaryRows.map((row) => (
            <div key={row.displayName} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 truncate">{row.displayName}</div>
                  <div className="text-[11px] text-blue-700 font-semibold truncate">Registry ID: {row.registryId}</div>
                  <div className="text-[11px] text-slate-500 truncate">Source tab: {row.sourceTab}</div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider rounded-full border px-2.5 py-1 ${row.sourceState === "Ready" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : row.sourceState === "Account mismatch" ? "border-rose-200 bg-rose-50 text-rose-700" : row.sourceState === "0 records" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-700"}`}>
                  {row.sourceState}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  ["Raw records", row.rawRecords],
                  ["Usable records", row.usableRecords],
                  ["Excluded", row.excludedRecords]
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl border border-white bg-white px-3 py-2">
                    <div className="text-[9px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
                    <div className="mt-1 font-bold text-slate-900">{String(value)}</div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab("registries")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
              >
                {row.routeLabel}
                <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id={getSettingsSectionId("application")} tabIndex={-1}>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Application</div>
          <h2 className="text-base font-extrabold text-slate-900">Application settings and access state</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            ["OAuth client", googleWorkspaceAuthState.clientIdConfigured ? "Configured" : "Missing"],
            ["Current origin", googleWorkspaceAuthState.currentOrigin || "Unavailable"],
            ["Current scope", googleWorkspaceAuthState.requiredScope],
            ["Token expiry", googleWorkspaceAuthState.expiresInSecondsRemaining === null ? "Not connected" : `${googleWorkspaceAuthState.expiresInSecondsRemaining}s remaining`]
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
              <div className="mt-1 text-sm font-bold text-slate-900 break-all">{String(value)}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            ["Identity scope", googleWorkspaceAuthState.identityScope],
            ["Read scope", googleWorkspaceAuthState.readScope],
            ["Write scope", googleWorkspaceAuthState.writeScope],
            ["Drive metadata scope", googleWorkspaceAuthState.driveScope]
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
              <div className="mt-1 text-[11px] font-semibold text-slate-900 break-all">{String(value)}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <span className="font-bold text-slate-800">Authorized origins:</span> {googleWorkspaceAuthState.requestedAuthorizedOrigins.join(", ")}
        </div>
        <label className="space-y-1 block">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Gemini API key</div>
          <input
            type="password"
            value={geminiDraft}
            onChange={(event) => setGeminiDraft(event.target.value)}
            onBlur={() => onGeminiApiKeySave(geminiDraft.trim())}
            placeholder="AI Studio developer key"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onGeminiApiKeySave(geminiDraft.trim())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
          >
            Save Application Settings
          </button>
          <button
            type="button"
            onClick={handleGrantWriteAccess}
            disabled={writeAccessPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[11px] font-extrabold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          >
            <Lock size={12} />
            {writeAccessPending ? "Requesting..." : "Grant Write Access"}
          </button>
        </div>
        {writeAccessStatus && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            {writeAccessStatus}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id={getSettingsSectionId("advanced")} tabIndex={-1}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Advanced</div>
            <h2 className="text-base font-extrabold text-slate-900">Collapsed diagnostics and write safety</h2>
          </div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((current) => !current)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
          >
            {advancedOpen ? "Collapse" : "Expand"}
            <Settings size={12} />
          </button>
        </div>

        {advancedOpen ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Source Mapping</div>
                <div className="text-sm font-bold text-slate-900">Registry source discovery</div>
                <p className="text-xs text-slate-600">Mapped {registrySourceDiscovery.mappedSources.length} of {registrySourceDiscovery.discoveredRegistryFiles.length} discovered registry files.</p>
                <div className="text-[11px] text-slate-600 space-y-1">
                  {registrySourceDiscovery.mappedSources.slice(0, 3).map((source) => (
                    <div key={source.key} className="rounded-lg border border-white bg-white px-2.5 py-1.5">
                      {source.label}
                    </div>
                  ))}
                  {registrySourceDiscovery.unmappedRegistryFiles.length > 0 && (
                    <div className="rounded-lg border border-white bg-white px-2.5 py-1.5">
                      {registrySourceDiscovery.unmappedRegistryFiles.length} unmapped file(s)
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Registry Diagnostics</div>
                <div className="text-sm font-bold text-slate-900">Current auth and link checks</div>
                <p className="text-xs text-slate-600">Origin, scopes, token expiry, and account match stay visible here without exposing the token.</p>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>Origin: {googleWorkspaceAuthState.currentOrigin || "Unavailable"}</div>
                  <div>Account match: {accountMatchLabel}</div>
                  <div>Scope mode: {authModeLabel}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Write Safety</div>
                <div className="text-sm font-bold text-slate-900">Grant write access only when needed</div>
                <p className="text-xs text-slate-600">Use the write flow only for explicit registry updates. Normal connection testing stays read-only.</p>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>Read access: available for setup and testing</div>
                  <div>Write access: only for approved updates</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <LiveDataReconciliationPanel
                files={files}
                courses={courses}
                assignments={assignments}
                students={students}
                teachers={teachers}
                schoolRegistry={schoolRegistry}
                dashboardSourceState={{
                  mode: schoolRegistry?.mode === "live" ? "live" : "setup_required",
                  sourceLabel: schoolRegistry?.sourceLabel || "Live master data registry",
                  sourceUrl: registryMasterUrl,
                  lastSyncedAt: schoolRegistry?.loadedAt || null,
                  activeAcademicYearLabel: organizationDraft.academicYear,
                  warnings: schoolRegistry?.warnings || [],
                  setupMessages: [],
                  registries: []
                } as any}
                principalDashboard={null}
                onRefreshSources={onRefreshData}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
            Advanced diagnostics stay collapsed by default.
          </div>
        )}
      </section>
    </main>
  );
}
