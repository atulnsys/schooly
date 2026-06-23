import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { clearGoogleSheetReadCache } from "../lib/googleSheetRead";
import {
  validateRegistryConnection,
  type RegistryConnectionTabResult,
  type RegistryConnectionValidationSnapshot
} from "../lib/registryConnectionValidation";
import LiveDataReconciliationPanel from "./LiveDataReconciliationPanel";

type SettingsSection = "organization" | "registry" | "application" | "advanced";
const SETTINGS_SECTION_VALUES = new Set<SettingsSection>(["organization", "registry", "application", "advanced"]);

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
interface SummaryRow {
  displayName: string;
  registryId: string;
  sourceFamily: string;
  sourceFile: string;
  sourceTab: string;
  sourceMode: string;
  sourceState: string;
  rawRecords: number | null;
  usableRecords: number | null;
  excludedRecords: number | null;
  lastChecked: string | null;
  detail: string;
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
  onOpenRegistryExplorer: () => void;
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

function isActiveRegistryStatus(value: string): boolean {
  const lowered = String(value || "").trim().toLowerCase();
  return !lowered || lowered.includes("active") || lowered.includes("enabled") || lowered.includes("current");
}

function formatCountValue(value: number | null): string {
  return value === null ? "â€”" : String(value);
}

function formatCheckedAt(value: string | null | undefined): string {
  if (!value) return "â€”";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function formatSourceModeLabel(mode: string): string {
  if (mode === "authenticated") return "Authenticated API";
  if (mode === "public") return "Public GViz";
  if (mode === "local") return "Local metadata";
  if (mode === "runtime") return "Application runtime";
  if (mode === "not_tested") return "Not tested";
  return mode;
}

function formatSchoolRegistrySourceStatus(status?: SchoolRegistryState["sourceStatus"] | null): string {
  if (!status) return "Unknown";
  if (status === "ready") return "Ready";
  if (status === "empty") return "Empty";
  if (status === "filtered_empty") return "Filtered empty";
  if (status === "loading") return "Loading";
  if (status === "refreshing") return "Refreshing";
  if (status === "authentication_required") return "Authentication required";
  if (status === "account_mismatch") return "Account mismatch";
  if (status === "permission_denied") return "Permission denied";
  if (status === "source_unavailable") return "Source unavailable";
  if (status === "stale") return "Stale";
  if (status === "error") return "Error";
  return status;
}

function formatSummaryStatusLabel(row: SummaryRow): string {
  if (row.sourceState) return row.sourceState;
  return row.sourceMode ? formatSourceModeLabel(row.sourceMode) : "Unknown";
}

function isCurrentValidationSnapshot(
  snapshot: RegistryConnectionValidationSnapshot | null,
  currentUrl: string,
  authState: GoogleWorkspaceAuthState
): boolean {
  if (!snapshot) return false;
  const normalizedCurrentUrl = String(currentUrl || "").trim();
  const normalizedRequested = String(snapshot.requestedUrl || "").trim();
  const normalizedConnectedAccount = String(authState.connectedAccount || authState.expectedAccount || "Not connected").trim().toLowerCase();
  const snapshotConnectedAccount = String(snapshot.connectedAccount || "").trim().toLowerCase();
  return normalizedCurrentUrl === normalizedRequested
    && snapshotConnectedAccount === normalizedConnectedAccount
    && snapshot.accountMatchStatus === authState.accountMatchStatus
    && snapshot.authState.connected === authState.connected
    && snapshot.authState.tokenPresent === authState.tokenPresent;
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

function normalizeSettingsSection(section: string | null | undefined): SettingsSection {
  if (section === "summary") return "registry";
  if (section && SETTINGS_SECTION_VALUES.has(section as SettingsSection)) return section as SettingsSection;
  return "organization";
}

function isSuccessFeedback(message: string): boolean {
  return [
    "Saved locally.",
    "Loaded registry values into the editable form.",
    "Registry updated from the editable organization form.",
    "Connection details saved.",
    "Google account connected for read access.",
    "Disconnected.",
    "Write authorization granted for approved registry updates."
  ].includes(String(message || "").trim());
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
  onOpenRegistryExplorer,
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
  const [savingOrganizationDraft, setSavingOrganizationDraft] = useState(false);
  const [savingConnectionDetails, setSavingConnectionDetails] = useState(false);
  const [savingApplicationSettings, setSavingApplicationSettings] = useState(false);
  const [registryUpdatePending, setRegistryUpdatePending] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionValidation, setConnectionValidation] = useState<RegistryConnectionValidationSnapshot | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(settingsSection === "advanced");
  const [writeAccessPending, setWriteAccessPending] = useState(false);
  const [writeAccessStatus, setWriteAccessStatus] = useState<string>("");
  const organizationSaveLockRef = useRef(false);
  const connectionSaveLockRef = useRef(false);
  const applicationSaveLockRef = useRef(false);
  const registryUpdateLockRef = useRef(false);

  const activeSection = normalizeSettingsSection(settingsSection);

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
    setConnectionValidation(null);
  }, [
    googleWorkspaceAuthState.connected,
    googleWorkspaceAuthState.connectedAccount,
    googleWorkspaceAuthState.accountMatchStatus,
    googleWorkspaceAuthState.errorMessage,
  ]);

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
    { id: "registry", label: "Data connections" },
    { id: "application", label: "Application" },
    { id: "advanced", label: "Advanced" }
  ];
  const activeSectionLabel = sectionButtons.find((section) => section.id === activeSection)?.label ?? "Organization";

  const registrySourceDiscovery = useMemo(() => discoverRegistrySources(files), [files]);
  const registryCatalogSummary = useMemo(() => getRegistryExplorerSummary(), []);
  const registryMasterUrl = schoolRegistry?.config.masterDataRegistryUrl || loadSeededRegistryConfig().masterDataRegistryUrl;
  const currentRegistryUrl = workspaceUrlDraft.trim() || workspaceUrl.trim();
  const registryLocationIsValid = validateSourceLink(workspaceUrlDraft, "google_workspace");
  const registryLocationLabel = !workspaceUrlDraft.trim()
    ? "Not configured"
    : registryLocationIsValid
      ? "Configured"
      : "Invalid link";
  const activeConnectionValidation = connectionValidation && isCurrentValidationSnapshot(connectionValidation, currentRegistryUrl, googleWorkspaceAuthState)
    ? connectionValidation
    : null;
  const connectedAccount = googleWorkspaceAuthState.connectedAccount || googleWorkspaceAuthState.expectedAccount || "Not connected";
  const accountMatchLabel = formatMatchLabel(googleWorkspaceAuthState.accountMatchStatus);
  const connectionStatusRole = /fail|error|denied|unavailable/i.test(connectionStatus) ? "alert" : "status";
  const writeAccessStatusRole = /fail|error|denied|unavailable/i.test(writeAccessStatus) ? "alert" : "status";

  const summaryRows = useMemo<SummaryRow[]>(() => {
    const studentDirectoryRows = schoolRegistry?.studentDirectory || [];
    const studentEnrollmentRows = schoolRegistry?.studentEnrollment || [];
    const staffRows = schoolRegistry?.staffDirectory || [];
    const teacherAllocationRows = schoolRegistry?.teacherAllocations || [];
    const classRows = schoolRegistry?.classesSections || [];
    const subjectRows = schoolRegistry?.subjects || [];
    const bookRows = schoolRegistry?.booksRegistry || [];
    const validationTabMap = new Map<string, RegistryConnectionTabResult>((activeConnectionValidation?.tabResults || []).map((result) => [result.tabName, result] as const));
    const getTabResult = (...tabNames: string[]): RegistryConnectionTabResult | null => tabNames.map((tabName) => validationTabMap.get(tabName)).find(Boolean) || null;
    const isReadableTab = (tabResult: RegistryConnectionTabResult | null) => Boolean(tabResult && (tabResult.status === "readable" || tabResult.status === "empty"));
    const getTabStateLabel = (tabResult: RegistryConnectionTabResult | null) => {
      if (!activeConnectionValidation) return "Not tested";
      if (!tabResult) return "Not verified";
      if (tabResult.status === "readable") return "Authenticated read";
      if (tabResult.status === "empty") return "No rows";
      if (tabResult.status === "account_mismatch") return "Account mismatch";
      if (tabResult.status === "authentication_required") return "Authentication required";
      if (tabResult.status === "access_denied") return "Access denied";
      if (tabResult.status === "tab_missing") return "Tab missing";
      if (tabResult.status === "file_missing") return "Source unavailable";
      return "Unavailable";
    };
    const studentTabResult = getTabResult("Student_Directory");
    const enrollmentTabResult = getTabResult("Student_Enrollment");
    const staffTabResult = getTabResult("Staff_Directory");
    const teacherAllocationTabResult = getTabResult("Teacher_Allocations");
    const classTabResult = getTabResult("Classes_Sections");
    const subjectTabResult = getTabResult("Subjects");
    const bookTabResult = getTabResult("Books_Registry");
    const catalogTabResult = getTabResult("Registry_Catalog");
    const usableStudentCount = isReadableTab(studentTabResult) ? students.length : null;
    const usableTeacherCount = isReadableTab(staffTabResult) ? teachers.length : null;
    const activeStudentDirectoryRows = studentDirectoryRows.filter((row) => isActiveRegistryStatus(row.status)).length;
    const activeEnrollmentRows = studentEnrollmentRows.filter((row) => isActiveRegistryStatus(row.status)).length;
    const activeStaffRows = staffRows.filter((row) => isActiveRegistryStatus(row.status)).length;
    const activeTeacherAllocationRows = teacherAllocationRows.filter((row) => isActiveRegistryStatus(row.status)).length;
    const activeClassRows = classRows.filter((row) => isActiveRegistryStatus(row.status)).length;
    const activeSubjectRows = subjectRows.filter((row) => isActiveRegistryStatus(row.status)).length;
    const activeBookRows = bookRows.filter((row) => isActiveRegistryStatus(row.status)).length;

    const items: SummaryRow[] = [
      {
        displayName: "Students",
        registryId: "students",
        sourceFamily: "Connected Google Registry",
        sourceFile: activeConnectionValidation?.masterWorkbook.label || "Connected workbook",
        sourceTab: "Student_Directory",
        sourceMode: activeConnectionValidation?.masterWorkbook.sourceMode || "unavailable",
        sourceState: getTabStateLabel(studentTabResult),
        rawRecords: isReadableTab(studentTabResult) ? studentDirectoryRows.length : null,
        usableRecords: usableStudentCount,
        excludedRecords: isReadableTab(studentTabResult) ? Math.max(0, studentDirectoryRows.length - activeStudentDirectoryRows) : null,
        lastChecked: activeConnectionValidation?.checkedAt || null,
        detail: activeConnectionValidation
          ? `Directory rows: ${studentDirectoryRows.length} | Enrolment rows: ${studentEnrollmentRows.length}`
          : "Authentication required to confirm the connected student registry.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Student enrollments",
        registryId: "masterDataRegistryUrl__student-enrollment",
        sourceFamily: "Connected Google Registry",
        sourceFile: activeConnectionValidation?.masterWorkbook.label || "Connected workbook",
        sourceTab: "Student_Enrollment",
        sourceMode: activeConnectionValidation?.masterWorkbook.sourceMode || "unavailable",
        sourceState: getTabStateLabel(enrollmentTabResult),
        rawRecords: isReadableTab(enrollmentTabResult) ? studentEnrollmentRows.length : null,
        usableRecords: isReadableTab(enrollmentTabResult) ? activeEnrollmentRows : null,
        excludedRecords: isReadableTab(enrollmentTabResult) ? Math.max(0, studentEnrollmentRows.length - activeEnrollmentRows) : null,
        lastChecked: activeConnectionValidation?.checkedAt || null,
        detail: activeConnectionValidation
          ? "Enrollment rows are joined into the usable student count."
          : "Authentication required to confirm enrolment rows.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Staff",
        registryId: "staff",
        sourceFamily: "Connected Google Registry",
        sourceFile: activeConnectionValidation?.masterWorkbook.label || "Connected workbook",
        sourceTab: "Staff_Directory",
        sourceMode: activeConnectionValidation?.masterWorkbook.sourceMode || "unavailable",
        sourceState: getTabStateLabel(staffTabResult),
        rawRecords: isReadableTab(staffTabResult) ? staffRows.length : null,
        usableRecords: isReadableTab(staffTabResult) ? activeStaffRows : null,
        excludedRecords: isReadableTab(staffTabResult) ? Math.max(0, staffRows.length - activeStaffRows) : null,
        lastChecked: activeConnectionValidation?.checkedAt || null,
        detail: activeConnectionValidation
          ? `Raw staff rows: ${staffRows.length}`
          : "Authentication required to confirm the staff directory.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Teachers",
        registryId: "teachers",
        sourceFamily: "Connected Google Registry",
        sourceFile: activeConnectionValidation?.masterWorkbook.label || "Connected workbook",
        sourceTab: "Staff_Directory + Teacher_Allocations",
        sourceMode: activeConnectionValidation?.masterWorkbook.sourceMode || "unavailable",
        sourceState: getTabStateLabel(staffTabResult),
        rawRecords: isReadableTab(staffTabResult) ? staffRows.length : null,
        usableRecords: usableTeacherCount,
        excludedRecords: isReadableTab(staffTabResult) ? Math.max(0, staffRows.length - (usableTeacherCount || 0)) : null,
        lastChecked: activeConnectionValidation?.checkedAt || null,
        detail: activeConnectionValidation
          ? `Derived from staff + allocation logic. Allocation rows: ${teacherAllocationRows.length}${teacherAllocationTabResult && !isReadableTab(teacherAllocationTabResult) ? " | Allocation tab not fully verified." : ""}`
          : "Authentication required to confirm the derived teacher count.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Classes / Sections",
        registryId: "courses",
        sourceFamily: "Connected Google Registry",
        sourceFile: activeConnectionValidation?.masterWorkbook.label || "Connected workbook",
        sourceTab: "Classes_Sections",
        sourceMode: activeConnectionValidation?.masterWorkbook.sourceMode || "unavailable",
        sourceState: getTabStateLabel(classTabResult),
        rawRecords: isReadableTab(classTabResult) ? classRows.length : null,
        usableRecords: isReadableTab(classTabResult) ? activeClassRows : null,
        excludedRecords: isReadableTab(classTabResult) ? Math.max(0, classRows.length - activeClassRows) : null,
        lastChecked: activeConnectionValidation?.checkedAt || null,
        detail: activeConnectionValidation
          ? `Active class rows: ${activeClassRows}`
          : "Authentication required to confirm classes and sections.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Subjects",
        registryId: "masterDataRegistryUrl__subjects",
        sourceFamily: "Connected Google Registry",
        sourceFile: activeConnectionValidation?.masterWorkbook.label || "Connected workbook",
        sourceTab: "Subjects",
        sourceMode: activeConnectionValidation?.masterWorkbook.sourceMode || "unavailable",
        sourceState: getTabStateLabel(subjectTabResult),
        rawRecords: isReadableTab(subjectTabResult) ? subjectRows.length : null,
        usableRecords: isReadableTab(subjectTabResult) ? activeSubjectRows : null,
        excludedRecords: isReadableTab(subjectTabResult) ? Math.max(0, subjectRows.length - activeSubjectRows) : null,
        lastChecked: activeConnectionValidation?.checkedAt || null,
        detail: activeConnectionValidation
          ? `Active subject rows: ${activeSubjectRows}`
          : "Authentication required to confirm subject rows.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Teacher Allocations",
        registryId: "REG_TEACHER_ALLOCATIONS",
        sourceFamily: "Connected Google Registry",
        sourceFile: activeConnectionValidation?.masterWorkbook.label || "Connected workbook",
        sourceTab: "Teacher_Allocations",
        sourceMode: activeConnectionValidation?.masterWorkbook.sourceMode || "unavailable",
        sourceState: getTabStateLabel(teacherAllocationTabResult),
        rawRecords: isReadableTab(teacherAllocationTabResult) ? teacherAllocationRows.length : null,
        usableRecords: isReadableTab(teacherAllocationTabResult) ? activeTeacherAllocationRows : null,
        excludedRecords: isReadableTab(teacherAllocationTabResult) ? Math.max(0, teacherAllocationRows.length - activeTeacherAllocationRows) : null,
        lastChecked: activeConnectionValidation?.checkedAt || null,
        detail: activeConnectionValidation
          ? "Teacher allocations are tracked separately from teacher headcount."
          : "Authentication required to confirm allocation rows.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Classroom Courses",
        registryId: "classroom-courses",
        sourceFamily: "Application Runtime â€” source not verified",
        sourceFile: "Schooly runtime data",
        sourceTab: "Classroom API",
        sourceMode: "runtime",
        sourceState: courses.length > 0 ? "Application runtime - source not verified" : "Source unavailable",
        rawRecords: courses.length > 0 ? courses.length : null,
        usableRecords: courses.length > 0 ? courses.length : null,
        excludedRecords: courses.length > 0 ? 0 : null,
        lastChecked: null,
        detail: courses.length > 0
          ? "Classroom rows come from application runtime data and are not proof of registry-sheet access."
          : "No classroom course rows are currently loaded.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Assignments",
        registryId: "assignments",
        sourceFamily: "Application Runtime â€” source not verified",
        sourceFile: "Schooly runtime data",
        sourceTab: "Classroom API",
        sourceMode: "runtime",
        sourceState: assignments.length > 0 ? "Application runtime - source not verified" : "Source unavailable",
        rawRecords: assignments.length > 0 ? assignments.length : null,
        usableRecords: assignments.length > 0 ? assignments.length : null,
        excludedRecords: assignments.length > 0 ? 0 : null,
        lastChecked: null,
        detail: assignments.length > 0
          ? "Assignment rows come from application runtime data and are not proof of registry-sheet access."
          : "No assignment rows are currently loaded.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Books / Textbooks",
        registryId: "textbooks",
        sourceFamily: "Connected Google Registry",
        sourceFile: activeConnectionValidation?.masterWorkbook.label || "Connected workbook",
        sourceTab: "Books_Registry",
        sourceMode: activeConnectionValidation?.masterWorkbook.sourceMode || "unavailable",
        sourceState: getTabStateLabel(bookTabResult),
        rawRecords: isReadableTab(bookTabResult) ? bookRows.length : null,
        usableRecords: isReadableTab(bookTabResult) ? activeBookRows : null,
        excludedRecords: isReadableTab(bookTabResult) ? Math.max(0, bookRows.length - activeBookRows) : null,
        lastChecked: activeConnectionValidation?.checkedAt || null,
        detail: activeConnectionValidation
          ? `Book rows read from the connected registry: ${bookRows.length}`
          : "Authentication required to confirm textbook rows.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Application Registry Catalog",
        registryId: "registry-catalog",
        sourceFamily: "Schooly Application Catalog",
        sourceFile: "Schooly application metadata",
        sourceTab: "Registry catalog",
        sourceMode: "local",
        sourceState: "Local metadata",
        rawRecords: registryCatalogSummary.totalEntries,
        usableRecords: registryCatalogSummary.totalEntries,
        excludedRecords: 0,
        lastChecked: null,
        detail: "This is the application catalog used for navigation and metadata. It does not prove connected registry access.",
        routeLabel: "Open in Registry Explorer"
      },
      {
        displayName: "Connected Registry Catalog",
        registryId: "connected-registry-catalog",
        sourceFamily: "Connected Google Registry",
        sourceFile: activeConnectionValidation?.connectedRegistryCatalog.label || "Connected workbook",
        sourceTab: "Registry_Catalog",
        sourceMode: activeConnectionValidation?.connectedRegistryCatalog.sourceMode || "unavailable",
        sourceState: activeConnectionValidation
          ? getTabStateLabel(catalogTabResult)
          : "Not verified",
        rawRecords: isReadableTab(catalogTabResult)
          ? Number(catalogTabResult?.rowCount || 0)
          : null,
        usableRecords: isReadableTab(catalogTabResult)
          ? Number(catalogTabResult?.rowCount || 0)
          : null,
        excludedRecords: isReadableTab(catalogTabResult)
          ? 0
          : null,
        lastChecked: activeConnectionValidation?.connectedRegistryCatalog.checkedAt || null,
        detail: activeConnectionValidation
          ? catalogTabResult?.status === "readable"
            ? "Connected registry catalog rows were read with authenticated access."
            : catalogTabResult?.status === "empty"
              ? "The connected registry catalog was reachable, but no rows were returned."
              : "The connected registry catalog is not yet verified."
          : "Not verified against a connected Google registry yet.",
        routeLabel: "Open in Registry Explorer"
      }
    ];

    return items;
  }, [activeConnectionValidation, assignments.length, courses.length, registryCatalogSummary.totalEntries, schoolRegistry, students.length, teachers.length]);

  const handleSaveOrganization = () => {
    if (savingOrganizationDraft || organizationSaveLockRef.current) return;
    organizationSaveLockRef.current = true;
    setSavingOrganizationDraft(true);
    try {
      saveOrganizationDraft(organizationDraft);
      setOrganizationStatus("Saved locally.");
    } finally {
      window.setTimeout(() => {
        organizationSaveLockRef.current = false;
        setSavingOrganizationDraft(false);
      }, 0);
    }
  };

  const handleUseRegistryValues = () => {
    const nextDraft = buildOrganizationDraftFromRegistry(schoolRegistry);
    setOrganizationDraft(nextDraft);
    saveOrganizationDraft(nextDraft);
    setOrganizationStatus("Loaded registry values into the editable form.");
  };

  const handleSaveConnection = () => {
    if (savingConnectionDetails || connectionSaveLockRef.current) return;
    connectionSaveLockRef.current = true;
    setSavingConnectionDetails(true);
    const trimmedUrl = workspaceUrlDraft.trim();
    if (!trimmedUrl) {
      setConnectionStatus("Add a registry link before saving.");
      window.setTimeout(() => {
        connectionSaveLockRef.current = false;
        setSavingConnectionDetails(false);
      }, 0);
      return;
    }
    clearGoogleSheetReadCache();
    onWorkspaceUrlSave(trimmedUrl);
    safeLocalStorageSet(REGISTRY_ACCOUNT_STORAGE_KEY, registryAccountDraft.trim());
    setGoogleWorkspaceAccountHint(registryAccountDraft.trim() || null);
    setConnectionValidation(null);
    setConnectionStatus("Connection details saved.");
    window.setTimeout(() => {
      connectionSaveLockRef.current = false;
      setSavingConnectionDetails(false);
    }, 0);
  };

  const handleSaveApplicationSettings = () => {
    if (savingApplicationSettings || applicationSaveLockRef.current) return;
    applicationSaveLockRef.current = true;
    setSavingApplicationSettings(true);
    try {
      onGeminiApiKeySave(geminiDraft.trim());
    } finally {
      window.setTimeout(() => {
        applicationSaveLockRef.current = false;
        setSavingApplicationSettings(false);
      }, 0);
    }
  };

  const handleConnectGoogleAccount = async () => {
    setConnectionStatus("Connecting Google account...");
    try {
      setGoogleWorkspaceAccountHint(registryAccountDraft.trim() || null);
      await connectGoogleWorkspaceReadAccess(registryAccountDraft.trim() || null);
      clearGoogleSheetReadCache();
      setConnectionValidation(null);
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
    clearGoogleSheetReadCache();
    disconnectGoogleWorkspaceAccess();
    onDisconnectWorkspace();
    setConnectionStatus("Disconnected.");
    setConnectionValidation(null);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      clearGoogleSheetReadCache();
      const authState = getGoogleWorkspaceAuthState();
      const snapshot = await validateRegistryConnection({
        currentUrl: currentRegistryUrl,
        expectedAccount: registryAccountDraft.trim() || authState.expectedAccount || null,
        authState,
        files,
        fallbackRegistryUrl: registryMasterUrl
      });
      setConnectionValidation(snapshot);
      const connectionOk = snapshot.status === "readable" || snapshot.status === "empty";
      setConnectionStatus(snapshot.message);
      if (connectionOk) {
        clearGoogleSheetReadCache();
        void onRefreshData();
      }
    } catch (error) {
      setConnectionValidation(null);
      setConnectionStatus(error instanceof Error ? error.message : "Registry connection test failed.");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveRegistryUpdate = async () => {
    if (registryUpdatePending || registryUpdateLockRef.current) return;
    registryUpdateLockRef.current = true;
    setRegistryUpdatePending(true);
    try {
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
        "Active",
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [rowValues] }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        setOrganizationStatus(text || `Registry update failed with status ${response.status}.`);
        return;
      }

      setOrganizationStatus("Registry updated from the editable organization form.");
      void onRefreshData();
    } finally {
      registryUpdateLockRef.current = false;
      setRegistryUpdatePending(false);
    }
  };

  const googleAccountStatus = googleWorkspaceAuthState.connected ? "Connected" : "Not connected";
  const authModeLabel = googleWorkspaceAuthState.authMode === "write" ? "Write" : googleWorkspaceAuthState.authMode === "read" ? "Read" : "Idle";

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Settings</div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Settings</h1>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {activeSectionLabel}
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-3xl">
              Manage organization details, data connections, and app access from one place.
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
                onChange={(event) => {
                  setOrganizationDraft((current) => ({ ...current, [key]: event.target.value }));
                  if (organizationStatus && isSuccessFeedback(organizationStatus)) {
                    setOrganizationStatus("");
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveOrganization}
            disabled={savingOrganizationDraft || registryUpdatePending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {savingOrganizationDraft ? "Saving..." : "Save Local Settings"}
          </button>
          <button
            type="button"
            onClick={handleSaveRegistryUpdate}
            disabled={registryUpdatePending || !useRegistryUpdateConfirm || googleWorkspaceAuthState.authMode !== "write"}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-extrabold disabled:opacity-60 ${useRegistryUpdateConfirm && googleWorkspaceAuthState.authMode === "write" ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50" : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            {registryUpdatePending ? "Updating..." : "Update Registry"}
            <ShieldCheck size={12} />
          </button>
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
            <input type="checkbox" checked={useRegistryUpdateConfirm} onChange={(event) => setUseRegistryUpdateConfirm(event.target.checked)} />
            I confirm this write
          </label>
        </div>
        {organizationStatus && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700" role="status" aria-live="polite" aria-atomic="true">
            {organizationStatus}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id={getSettingsSectionId("registry")} tabIndex={-1} aria-busy={testingConnection}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Data connections</div>
            <h2 className="text-base font-extrabold text-slate-900">Registry access and source link</h2>
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
              onChange={(event) => {
                setRegistryAccountDraft(event.target.value);
                if (connectionStatus && isSuccessFeedback(connectionStatus)) {
                  setConnectionStatus("");
                }
                if (writeAccessStatus && isSuccessFeedback(writeAccessStatus)) {
                  setWriteAccessStatus("");
                }
              }}
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
              onChange={(event) => {
                setWorkspaceUrlDraft(event.target.value);
                if (connectionStatus && isSuccessFeedback(connectionStatus)) {
                  setConnectionStatus("");
                }
              }}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none"
            />
            <div className="text-[11px] text-slate-500">Paste the shared registry folder or spreadsheet link. The connection test will tell you if the URL is readable.</div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            ["Connected Google Account", connectedAccount],
            ["Account Match", accountMatchLabel],
            ["Access Mode", activeConnectionValidation ? formatSourceModeLabel(activeConnectionValidation.accessMode) : (googleWorkspaceAuthState.connected ? "Connected" : "Not connected")],
            ["Registry Source State", schoolRegistry ? (schoolRegistry.isRefreshing ? "Refreshing" : formatSchoolRegistrySourceStatus(schoolRegistry.sourceStatus)) : (currentRegistryUrl ? "Not tested" : "No registry link configured")]
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
              <div className="mt-1 text-sm font-bold text-slate-900 truncate">{String(value)}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[
            ["Test Result", activeConnectionValidation ? activeConnectionValidation.message : "Not tested"],
            ["Last Checked", schoolRegistry?.lastCheckedAt ? formatCheckedAt(schoolRegistry.lastCheckedAt) : activeConnectionValidation ? formatCheckedAt(activeConnectionValidation.checkedAt) : "Not tested"],
            ["Last successful sync", schoolRegistry?.lastSuccessfulSyncAt ? formatCheckedAt(schoolRegistry.lastSuccessfulSyncAt) : "Not yet synced"],
            ["Next Action", schoolRegistry?.recoveryAction || (activeConnectionValidation ? activeConnectionValidation.nextAction : "Connect Google Workspace and test the source")]
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
            disabled={savingConnectionDetails || !workspaceUrlDraft.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {savingConnectionDetails ? "Saving..." : "Save Connection"}
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
          <button
            type="button"
            onClick={onOpenRegistryExplorer}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
          >
            View Registry Explorer
            <ExternalLink size={12} />
          </button>
        </div>

        {connectionStatus && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700" role={connectionStatusRole} aria-live={connectionStatusRole === "alert" ? "assertive" : "polite"} aria-atomic="true">
            {connectionStatus}
          </div>
        )}

        {activeConnectionValidation && (
          <div className={`rounded-2xl border px-4 py-3 space-y-2 ${activeConnectionValidation.status === "readable" || activeConnectionValidation.status === "empty" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-extrabold">{activeConnectionValidation.message}</div>
              <span className="text-[10px] font-black uppercase tracking-wider">{activeConnectionValidation.status === "readable" || activeConnectionValidation.status === "empty" ? "Ready" : "Needs attention"}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 text-xs">
              {[
                ["Source family", activeConnectionValidation.sourceMetadata.family],
                ["Source detail", activeConnectionValidation.sourceMetadata.detail],
                ["Master workbook", activeConnectionValidation.masterWorkbook.note],
                ["Connected catalog", activeConnectionValidation.connectedRegistryCatalog.note],
                ["Discovered registries", String(activeConnectionValidation.discoveredRegistryCount)],
                ["Authenticated tabs", String(activeConnectionValidation.authenticatedReadableRegistryCount)],
                ["Public tabs", String(activeConnectionValidation.publicReadableRegistryCount)],
                ["Last checked", formatCheckedAt(activeConnectionValidation.checkedAt)]
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id={getSettingsSectionId("application")} tabIndex={-1} aria-busy={writeAccessPending}>
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
            onChange={(event) => {
              setGeminiDraft(event.target.value);
            }}
            onBlur={handleSaveApplicationSettings}
            placeholder="AI Studio developer key"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveApplicationSettings}
            disabled={savingApplicationSettings}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
          >
            {savingApplicationSettings ? "Saving..." : "Save Application Settings"}
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
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700" role={writeAccessStatusRole} aria-live={writeAccessStatusRole === "alert" ? "assertive" : "polite"} aria-atomic="true">
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
                  lastSyncedAt: schoolRegistry?.lastSuccessfulSyncAt || schoolRegistry?.loadedAt || null,
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
    </div>
  );
}
