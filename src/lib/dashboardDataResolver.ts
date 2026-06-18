import { parseGoogleSheetUrl } from "./dataSourceEngine";
import { compareClassLabels, formatClassLabel, getClassSortValue } from "./classSort";
import { getConfiguredDashboardSheetUrl, getDashboardSourceHealthWarnings, isGoogleSheetsUrl } from "./dashboardConfig";
import {
  DEFAULT_SEEDED_REGISTRY_CONFIG,
  getSavedSeededRegistryOverrides,
  loadSeededRegistryConfig,
  type SeededRegistryConfig
} from "./seededRegistryConfig";
import {
  findMissingRequiredHeaders,
  getPrimaryKeyColumn,
  REGISTRY_DEFINITIONS
} from "./registrySchema";
import type {
  CoordinatorAnnouncement,
  CoordinatorAssessmentTracking,
  CoordinatorClassroomActivity,
  CoordinatorDashboardData,
  CoordinatorDashboardSourceReference,
  CoordinatorDutyStatus,
  CoordinatorKpiMetric,
  CoordinatorPlannerMatrixCell,
  CoordinatorPlannerMatrixRow,
  CoordinatorProfileHeader,
  CoordinatorRemedialStudent,
  CoordinatorRenewalStatus,
  CoordinatorSetupState,
  CoordinatorSyllabusCoverage,
  HodAssessmentTracking,
  HodComplianceAlert,
  HodDashboardData,
  HodDashboardSourceReference,
  HodEnrichmentOlympiadStatus,
  HodKpiMetric,
  HodProfileHeader,
  HodRemedialStatus,
  HodRepositoryHealthByClass,
  HodSetupState,
  HodTeacherActivityRow,
  ManagerAnnouncement,
  ManagerComplianceChecklistItem,
  ManagerDashboardData,
  ManagerDashboardSourceReference,
  ManagerKpiMetric,
  ManagerOperationalMetric,
  ManagerProfileHeader,
  ManagerSetupState,
  ParentAdvisoryTicket,
  ParentDashboardData,
  ParentDashboardHeader,
  ParentDashboardKpi,
  ParentDashboardNotice,
  ParentDashboardSetupState,
  ParentDashboardSourceReference,
  ParentSafetyItem,
  StudentAnnouncementItem,
  StudentDashboardData,
  StudentDashboardKpi,
  StudentDashboardSetupState,
  StudentDashboardSourceReference,
  StudentDashboardTask,
  StudentResourceLink,
  StudentTimetableItem,
  StudentDashboardHeader,
  TeacherAnnouncementItem,
  TeacherAssessmentTrackingItem,
  TeacherClassPerformance,
  TeacherClassroomActivity,
  TeacherDashboardData,
  TeacherDashboardHeader,
  TeacherDashboardKpi,
  TeacherDashboardQuickLink,
  TeacherDashboardSourceReference,
  TeacherDashboardSetupState,
  TeacherInvigilationDuty,
  TeacherPendingTask,
  TeacherRenewalStatus,
  TeacherTimetablePeriod,
  ExaminationAnnouncementItem,
  ExaminationBoardSubjectStat,
  ExaminationDashboardData,
  ExaminationDashboardHeader,
  ExaminationDashboardKpi,
  ExaminationDashboardSetupState,
  ExaminationDashboardSourceReference,
  ExaminationVerificationItem,
  RegistryHealthSummary
} from "../types";

type DashboardRoleView = "principal" | "teacher" | "coordinator" | "hod" | "manager" | "student" | "exams" | "parent" | "all";
type DashboardMode = "live" | "setup_required" | "error";
type SheetRow = Record<string, string>;
type SheetTabMap = Record<string, SheetRow[]>;
type RegistryDefinition = (typeof REGISTRY_DEFINITIONS)[number];

export interface DashboardRegistrySourceStatus {
  key: keyof SeededRegistryConfig;
  label: string;
  url: string;
  connected: boolean;
  missingTabs: string[];
  emptyTabs: string[];
  tabRowCounts: Record<string, number>;
  tabHeaders: Record<string, string[]>;
  missingHeaders: Record<string, string[]>;
  duplicatePrimaryIds: Record<string, string[]>;
  placeholderRows: Record<string, number>;
  invalidDriveReferences: Record<string, string[]>;
  rowCount: number;
  lastReadAt?: string | null;
  error?: string;
}

export interface DashboardSourceState {
  mode: DashboardMode;
  sourceLabel: string;
  sourceUrl?: string;
  lastSyncedAt?: string | null;
  activeAcademicYearLabel?: string;
  warnings: string[];
  setupMessages: string[];
  registries: DashboardRegistrySourceStatus[];
  registryHealthSummary: RegistryHealthSummary;
  localStorageOverrides: Partial<Record<keyof SeededRegistryConfig, string>>;
}

export interface DashboardBlueprintCard {
  title?: string;
  details?: string;
  percentage?: string;
}

interface LoadDashboardDataOptions {
  roleView: DashboardRoleView;
  dashboardSheetUrl?: string;
  workspaceUrl?: string;
  classroomUrl?: string;
  teacherIdentity?: string;
}

const TAB_ALIASES: Record<string, string> = {
  classes_sections: "classes_sections",
  staff_directory: "staff_directory",
  teacher_allocations: "teacher_allocations",
  coordinator_scope: "coordinator_scope",
  department_scope: "department_scope",
  school_profile: "school_profile",
  timetable: "timetable",
  student_directory: "student_directory",
  student_enrollment: "student_enrollment",
  books_registry: "books_registry",
  book_toc_registry: "book_toc_registry",
  registry_bootstrap_log: "registry_bootstrap_log",
  registry_summary: "registry_summary",
  ncert_drive_source_folders: "ncert_drive_source_folders",
  ncert_chapter_file_map: "ncert_chapter_file_map",
  lesson_workspace_registry: "planner_submissions",
  artifact_registry: "resource_contributions",
  lesson_execution_log: "syllabus_coverage",
  classroom_publish_log: "classroom_activity",
  qa_checklist_config: "dashboard_config",
  qa_review_log: "compliance_evidence",
  sqaa_evidence_map: "compliance_evidence",
  compliance_report_registry: "compliance_evidence",
  kpi_definitions: "dashboard_config",
  dashboard_kpi_source: "dashboard_metrics",
  curriculum_coverage: "syllabus_coverage",
  assessment_tracking: "assessment_tracking",
  alert_log: "dashboard_alerts",
  assessment_plan: "assessment_tracking",
  exam_calendar: "assessment_tracking",
  question_paper_registry: "assessment_tracking",
  marks_entry: "assessment_tracking",
  result_processing: "assessment_tracking",
  report_card_registry: "assessment_tracking",
  result_analysis: "remedial_risk",
  invigilation_olympiad_duties: "assessment_tracking",
  classroom_course_map: "classroom_activity",
  classroom_assignment_map: "classroom_activity",
  classroom_submission_sync: "classroom_activity",
  classroom_sync_log: "dashboard_source_log",
  classroom_announcement_sync: "classroom_activity",
  strategic_milestones: "schooly_strategic_operations_registry",
  operational_checklist: "schooly_strategic_operations_registry",
  budget_utilization: "schooly_strategic_operations_registry",
  teacher_cpd_status: "dashboard_metrics",
  mandatory_training: "dashboard_metrics",
  certification_renewals: "dashboard_metrics",
  review_action_log: "dashboard_source_log",
  enrichment_programmes: "hod_enrichment_olympiad_registry",
  olympiad_registrations: "hod_enrichment_olympiad_registry",
  enrichment_resources: "hod_enrichment_olympiad_registry",
  enrichment_classroom_posts: "hod_enrichment_olympiad_registry"
};

const EMPTY_PRINCIPAL_DASHBOARD = {
  academicMonitoring: { stages: [], syllabus: [], assessment: [] },
  classroomMonitoring: {
    totalClassrooms: 0,
    postedThisWeek: 0,
    zeroActivityThisWeek: 0,
    assignmentsCreatedThisWeek: 0,
    averageSubmissionRate: 0,
    avgSubmissionRate: 0,
    meetSessionsHeldThisWeek: 0,
    meetSessionsHeld: 0
  },
  compliance: { categories: [], overall: 0 },
  teacherPerformanceIndicators: [],
  monitoringFormsDataFeeds: [],
  alertsRequiringAttention: [],
  remedialRisk: []
};

const EMPTY_TEACHER_DASHBOARD = {
  teacherId: "",
  teacherName: "",
  subject: "",
  assessmentName: "",
  schoolSubjectAverage: 0,
  teacherAverage: 0,
  classroomPostingDaysExpected: 0,
  attentionThresholds: { performanceWarning: 70, postingPerfect: 5, postingWarning: 3, postingCritical: 1 },
  assignedClasses: []
};

const EMPTY_COORDINATOR_DASHBOARD = {
  coordinatorProfile: {
    initials: "",
    name: "",
    label: "Academic Coordinator",
    academicSession: "",
    scopeLabel: "Coordinator scope not configured.",
    configuredScope: "Coordinator scope not configured.",
    source: { workbook: "Master Registry", tab: "Staff_Directory", rowCount: 0, lastSyncedAt: null }
  },
  kpis: [],
  plannerStatusMatrix: { headers: ["Class / Section", "Planner", "Notebook", "Assessment", "Classroom", "Attendance"], rows: [] },
  syllabusCoverage: [],
  remedialTracking: [],
  classroomActivity: [],
  assessmentTracking: [],
  announcements: [],
  invigilationDuty: { configured: false, title: "Invigilation & olympiads", message: "Invigilation/Olympiad duty registry not configured.", statusLabel: "Setup required" },
  renewalStatus: { configured: false, title: "Renewal / compliance status", message: "Teacher CPD renewal registry is not configured.", statusLabel: "Setup required" },
  sourceHealth: [],
  setupState: { status: "setup_required", title: "Coordinator dashboard setup required", message: "Coordinator could not be resolved from live data.", messages: [] }
};

function normalizeKey(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function cellToString(cell: any): string {
  if (cell == null) return "";
  if (typeof cell === "string") return cell.trim();
  if (typeof cell === "number" || typeof cell === "boolean") return String(cell);
  if (typeof cell.v !== "undefined" && cell.v != null) return String(cell.v).trim();
  if (typeof cell.f !== "undefined" && cell.f != null) return String(cell.f).trim();
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

function parseGvizTable(text: string): { headers: string[]; rows: SheetRow[] } {
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
      const entry: SheetRow = {};
      (row.c || []).forEach((cell: any, index: number) => {
        entry[normalizedHeaders[index] || `column_${index + 1}`] = cellToString(cell);
      });
      return entry;
    })
    .filter((row: SheetRow) => Object.values(row).some((value) => value.trim() !== ""));
  return { headers, rows };
}

async function fetchSheetTabRows(sheetId: string, tabName: string): Promise<{ headers: string[]; rows: SheetRow[] }> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const response = await fetch(url, { headers: { Accept: "text/plain, */*" } });
  if (!response.ok) throw new Error(`Tab '${tabName}' returned ${response.status}.`);
  return parseGvizTable(await response.text());
}

function pickFirst(row: SheetRow, keys: string[], defaultValue = ""): string {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (row[normalized] && row[normalized].trim()) return row[normalized].trim();
  }
  return defaultValue;
}

function toNumber(value: string): number | null {
  const parsed = Number(String(value || "").replace(/[%,$]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumberFromRow(row: SheetRow, keys: string[]): number | null {
  for (const key of keys) {
    const parsed = toNumber(row[normalizeKey(key)] || "");
    if (parsed !== null) return parsed;
  }
  return null;
}

function averageFromRows(rows: SheetRow[], keys: string[]): number {
  const values = rows
    .map((row) => firstNumberFromRow(row, keys))
    .filter((value): value is number => value !== null);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function countTruthyRows(rows: SheetRow[], keys: string[]): number {
  return rows.filter((row) =>
    keys.some((key) => ["1", "true", "yes", "done", "active", "posted", "complete", "completed", "ok"].includes((row[normalizeKey(key)] || "").toLowerCase()))
  ).length;
}

function friendlySourceLabel(value: string, fallback: string): string {
  const raw = String(value || "").trim();
  const token = raw.toLowerCase();
  if (!raw || token === "live registry" || token === "live registry row" || token === "live") return fallback;
  if (/dashboard[_\s-]*alerts?/i.test(raw)) return "Dashboard Alerts";
  if (/alert[_\s-]*log/i.test(raw)) return "Dashboard Alerts";
  if (/syllabus/i.test(raw)) return "Syllabus Coverage";
  if (/(qa|sqaa|compliance)/i.test(raw)) return "QA Review";
  if (/classroom/i.test(raw)) return "Classroom Sync";
  if (/planner/i.test(raw)) return "Planner Submissions";
  if (/assessment/i.test(raw)) return "Assessment Tracking";
  if (/remedial/i.test(raw)) return "Remedial Tracking";
  if (/lesson/i.test(raw)) return "Lesson Workspace";
  return raw.replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim();
}

function humanizeDateValue(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const literalMatch = raw.match(/^Date\((\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})(?:\s*,.*)?\)$/i);
  const parsed = literalMatch
    ? new Date(Number(literalMatch[1]), Number(literalMatch[2]), Number(literalMatch[3]))
    : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return `${String(parsed.getDate()).padStart(2, "0")}-${parsed.toLocaleString("en-US", { month: "short" })}-${String(parsed.getFullYear()).slice(-2)}`;
}

function humanizeDateTimeValue(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return humanizeDateValue(raw);
}

function addRows(tabs: SheetTabMap, alias: string, rows: SheetRow[]): void {
  if (!tabs[alias]) tabs[alias] = [];
  tabs[alias].push(...rows);
}

function findDuplicateValues(rows: SheetRow[], key: string): string[] {
  if (!key) return [];
  const normalizedKey = normalizeKey(key);
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = String(row[normalizedKey] || "").trim();
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries()).filter(([, count]) => count > 1).map(([value]) => value);
}

function countPlaceholderRows(rows: SheetRow[]): number {
  return rows.filter((row) =>
    Object.values(row).some((value) => /demo|sample|placeholder|fake|lorem|test only/i.test(String(value || "")))
  ).length;
}

function findInvalidDriveReferences(rows: SheetRow[]): string[] {
  const invalid: string[] = [];
  rows.forEach((row, rowIndex) => {
    Object.entries(row).forEach(([key, value]) => {
      if (!/(drive|folder|file).*(_url|_id)$|drive_folder_url|drive_file_url|folder_url|file_url/i.test(key)) return;
      const trimmed = String(value || "").trim();
      if (!trimmed) return;
      const isGoogleUrl = /^https:\/\/(drive|docs)\.google\.com\//i.test(trimmed);
      const isLikelyId = /^[A-Za-z0-9_-]{15,}$/.test(trimmed);
      if (!isGoogleUrl && !isLikelyId) {
        invalid.push(`row ${rowIndex + 2}: ${key}`);
      }
    });
  });
  return invalid;
}

async function readRegistry(definition: RegistryDefinition, url: string): Promise<{ tabs: SheetTabMap; status: DashboardRegistrySourceStatus; }> {
  const parsed = parseGoogleSheetUrl(url);
  const status: DashboardRegistrySourceStatus = {
    key: definition.key,
    label: definition.label,
    url,
    connected: false,
    missingTabs: [],
    emptyTabs: [],
    tabRowCounts: {},
    tabHeaders: {},
    missingHeaders: {},
    duplicatePrimaryIds: {},
    placeholderRows: {},
    invalidDriveReferences: {},
    rowCount: 0,
    lastReadAt: null
  };
  const tabs: SheetTabMap = {};

  if (!url.trim()) {
    status.error = "Registry URL is not configured.";
    status.missingTabs = definition.tabs;
    return { tabs, status };
  }
  if (!parsed) {
    status.error = "Registry URL is not a Google Sheets link.";
    status.missingTabs = definition.tabs;
    return { tabs, status };
  }

  const settled = await Promise.allSettled(
    definition.tabs.map(async (tabName) => [tabName, await fetchSheetTabRows(parsed.sheetId, tabName)] as const)
  );

  settled.forEach((result, index) => {
    const tabName = definition.tabs[index];
    if (result.status === "rejected") {
      status.missingTabs.push(tabName);
      status.tabRowCounts[tabName] = 0;
      status.tabHeaders[tabName] = [];
      status.missingHeaders[tabName] = findMissingRequiredHeaders(tabName, []);
      return;
    }
    const { headers, rows } = result.value[1];
    status.tabHeaders[tabName] = headers;
    status.tabRowCounts[tabName] = rows.length;
    status.missingHeaders[tabName] = findMissingRequiredHeaders(tabName, headers);
    status.duplicatePrimaryIds[tabName] = findDuplicateValues(rows, getPrimaryKeyColumn(tabName));
    status.placeholderRows[tabName] = countPlaceholderRows(rows);
    status.invalidDriveReferences[tabName] = findInvalidDriveReferences(rows);
    if (rows.length === 0) {
      status.emptyTabs.push(tabName);
      return;
    }
    status.connected = true;
    status.rowCount += rows.length;
    const exactTabKey = normalizeKey(tabName);
    addRows(tabs, exactTabKey, rows);
    const aliasTabKey = TAB_ALIASES[exactTabKey];
    if (aliasTabKey && aliasTabKey !== exactTabKey) {
      addRows(tabs, aliasTabKey, rows);
    }
  });

  status.lastReadAt = new Date().toISOString();
  return { tabs, status };
}

function setupMessagesFromStatuses(statuses: DashboardRegistrySourceStatus[]): string[] {
  const messages: string[] = [];
  const byKey = Object.fromEntries(statuses.map((status) => [status.key, status]));
  if ((byKey.masterDataRegistryUrl?.rowCount || 0) === 0) {
    messages.push("Master Registry has no live class section rows.");
    messages.push("Master Registry has no live teacher allocation rows.");
  }
  if ((byKey.dashboardDataSourceUrl?.rowCount || 0) === 0) messages.push("Dashboard KPI source is unavailable.");
  if ((byKey.lessonWorkspaceRegistryUrl?.rowCount || 0) === 0) messages.push("Lesson Workspace source has no live rows.");
  if ((byKey.qaSqaaRegistryUrl?.rowCount || 0) === 0) messages.push("Evidence mapping is unavailable from this source.");
  if ((byKey.classroomSyncRegistryUrl?.rowCount || 0) === 0) messages.push("Google Classroom sync source is unavailable.");
  if ((byKey.assessmentResultRegistryUrl?.rowCount || 0) === 0) messages.push("Assessment registry is not connected yet.");
  return Array.from(new Set(messages));
}

function isCriticalRegistryStatus(registry: DashboardRegistrySourceStatus): boolean {
  return Boolean(registry.error) || !registry.connected || registry.missingTabs.length > 0;
}

function isWarningRegistryStatus(registry: DashboardRegistrySourceStatus): boolean {
  if (isCriticalRegistryStatus(registry)) return false;
  return Object.values(registry.missingHeaders).some((items) => items.length > 0)
    || Object.values(registry.duplicatePrimaryIds).some((items) => items.length > 0)
    || Object.values(registry.placeholderRows).some((count) => count > 0)
    || Object.values(registry.invalidDriveReferences).some((items) => items.length > 0)
    || registry.emptyTabs.length > 0;
}

function buildRegistryIssueLabel(registry: DashboardRegistrySourceStatus): string {
  if (registry.error) return registry.error;
  if (!registry.connected) return `${registry.label} is unavailable.`;
  if (registry.missingTabs.length > 0) return `${registry.label} is missing ${registry.missingTabs[0]}.`;
  if (registry.emptyTabs.length > 0) return `${registry.label} has no rows.`;
  if (Object.values(registry.missingHeaders).some((items) => items.length > 0)) return `${registry.label} is missing mandatory fields.`;
  if (Object.values(registry.placeholderRows).some((count) => count > 0)) return `${registry.label} still has fallback rows.`;
  if (Object.values(registry.invalidDriveReferences).some((items) => items.length > 0)) return `${registry.label} has invalid Drive references.`;
  return `${registry.label} needs review.`;
}

function buildRegistryHealthSummary(
  roleView: DashboardRoleView,
  sourceState: Pick<DashboardSourceState, "mode" | "lastSyncedAt" | "warnings" | "setupMessages">,
  registries: DashboardRegistrySourceStatus[]
): RegistryHealthSummary {
  const totalRegistries = registries.length;
  const connectedRegistries = registries.filter((registry) => registry.connected && !registry.error).length;
  const criticalRegistries = registries.filter(isCriticalRegistryStatus).length;
  const warningRegistries = registries.filter(isWarningRegistryStatus).length;
  const latestRegistrySync = registries
    .map((registry) => registry.lastReadAt || "")
    .filter(Boolean)
    .sort()
    .at(-1) || null;
  const lastSyncAt = sourceState.lastSyncedAt || latestRegistrySync;
  const privilegedRole = roleView !== "teacher" && roleView !== "parent" && roleView !== "student";
  const firstCritical = registries.find(isCriticalRegistryStatus);
  const firstWarning = registries.find(isWarningRegistryStatus);
  const sourceIssue = firstCritical || firstWarning;
  const primaryIssue = sourceIssue
    ? buildRegistryIssueLabel(sourceIssue)
    : (sourceState.warnings[0] || sourceState.setupMessages[0] || "All registry connections are healthy.");
  const onboardingStatus = sourceState.mode === "live"
    ? (criticalRegistries > 0 || totalRegistries === 0
      ? "Setup required"
      : warningRegistries > 0
        ? "Onboarding in progress"
        : "Onboarding complete")
    : "Setup required";
  const nextRequiredAction = sourceIssue
    ? (isCriticalRegistryStatus(sourceIssue)
      ? `Reconnect ${sourceIssue.label}`
      : `Review ${sourceIssue.label}`)
    : privilegedRole
      ? "Open Setup Centre"
      : "No setup action required";

  return {
    totalRegistries,
    connectedRegistries,
    warningRegistries,
    criticalRegistries,
    onboardingStatus,
    lastSyncAt,
    nextRequiredAction,
    primaryIssue,
    canOpenSetupCentre: privilegedRole || criticalRegistries > 0 || warningRegistries > 0,
    sourceHealthRows: registries.map((registry) => ({
      key: registry.key,
      label: registry.label,
      url: registry.url,
      connected: registry.connected,
      rowCount: registry.rowCount,
      lastReadAt: registry.lastReadAt || null,
      warning: registry.error || (isWarningRegistryStatus(registry) ? buildRegistryIssueLabel(registry) : undefined),
      error: registry.error,
      missingTabs: registry.missingTabs,
      emptyTabs: registry.emptyTabs
    }))
  };
}

function summarizeTab(tabName: string, rows: SheetRow[]): DashboardBlueprintCard {
  const first = rows[0] || {};
  return {
    title: pickFirst(first, ["title", "metric", "name", "label", "class", "subject"], tabName.replace(/_/g, " ")),
    details: pickFirst(first, ["details", "description", "summary", "status", "notes"], `${rows.length} live row${rows.length === 1 ? "" : "s"}`),
    percentage: pickFirst(first, ["percentage", "percent", "completion", "score", "coverage", "rate"], "")
  };
}

function isCurrentAcademicYearRow(row: SheetRow): boolean {
  const status = normalizeTeacherToken(pickFirst(row, ["status", "active_status", "current_status"], ""));
  if (/(current|active|live|latest)/.test(status)) return true;
  return ["is_current", "current", "active", "live"].some((key) => {
    const value = normalizeTeacherToken(pickFirst(row, [key], ""));
    return /^(true|yes|y|1|current|active|live)$/.test(value);
  });
}

function resolveActiveAcademicYearRow(rows: SheetRow[]): SheetRow | null {
  if (rows.length === 0) return null;
  const datedFields = ["updated_at", "modified_at", "created_at", "start_date", "term_start", "end_date", "term_end", "date"];
  const scoreForRow = (row: SheetRow, index: number) => {
    if (isCurrentAcademicYearRow(row)) return Number.MAX_SAFE_INTEGER - index;
    const parsedDates = datedFields
      .map((key) => Date.parse(pickFirst(row, [key], "")))
      .filter((value) => !Number.isNaN(value));
    if (parsedDates.length > 0) return Math.max(...parsedDates);
    const label = pickFirst(row, ["academic_year", "term_name", "session", "name"], "");
    const match = label.match(/(\d{4})(?:\D+(\d{2,4}))?/);
    if (match) {
      const start = Number(match[1]);
      const end = match[2]
        ? Number(match[2].length === 2 ? `${match[1].slice(0, 2)}${match[2]}` : match[2])
        : start;
      return Math.max(start, end);
    }
    return index;
  };
  return rows
    .map((row, index) => ({ row, index, score: scoreForRow(row, index) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.row || null;
}

function getActiveAcademicYearLabel(tabs: SheetTabMap): string {
  const academicYearRow = resolveActiveAcademicYearRow(tabs.academic_years || []);
  const schoolProfileRow = resolveActiveAcademicYearRow(tabs.school_profile || []);
  const academicYearLabel = pickFirst(academicYearRow || {}, ["academic_year", "academic_years", "term_name", "session", "name"], "");
  const schoolProfileLabel = pickFirst(schoolProfileRow || {}, ["academic_year", "academic_years", "term_name", "session", "name"], "");
  return academicYearLabel || schoolProfileLabel;
}

function buildBlueprintForRole(role: "principal" | "teacher" | "coordinator" | "manager" | "student" | "exams" | "parent", tabs: SheetTabMap): { cards: DashboardBlueprintCard[]; rows: SheetRow[] } {
  const roleTabMap: Record<typeof role, string[]> = {
    principal: Object.keys(tabs),
    teacher: ["teacher_allocations", "timetable", "classroom_activity", "planner_submissions", "assessment_tracking", "syllabus_coverage"],
    coordinator: ["classes_sections", "teacher_allocations", "planner_submissions", "classroom_activity", "assessment_tracking", "remedial_risk", "resource_contributions"],
    manager: ["school_profile", "academic_years", "staff_directory", "dashboard_metrics", "planner_submissions", "classroom_activity", "assessment_tracking", "evidence_gaps", "qa_checklist_config", "qa_review_log", "sqaa_evidence_map", "compliance_report_registry", "budget_utilization", "strategic_milestones", "operational_checklist", "classroom_announcement_sync"],
    student: ["classroom_activity", "assessment_tracking", "dashboard_alerts"],
    exams: ["school_profile", "academic_years", "staff_directory", "classes_sections", "student_enrollment", "subjects", "assessment_plan", "exam_calendar", "question_paper_registry", "marks_entry", "result_analysis", "result_processing", "classroom_announcement_sync"],
    parent: ["school_profile", "academic_years", "student_enrollment", "dashboard_alerts", "attendance_summary", "classroom_activity", "classroom_announcement_sync", "classroom_sync_log"]
  };
  const rows: SheetRow[] = [];
  const cards: DashboardBlueprintCard[] = [];
  roleTabMap[role].forEach((tabName) => {
    const tabRows = tabs[tabName] || [];
    if (tabRows.length === 0) return;
    rows.push(...tabRows);
    cards.push(summarizeTab(tabName, tabRows));
  });
  return { cards, rows };
}

function buildPrincipalDashboard(tabs: SheetTabMap, sourceState?: DashboardSourceState): any {
  const classRows = tabs.classes_sections || [];
  const staffRows = tabs.staff_directory || [];
  const allocationRows = tabs.teacher_allocations || [];
  const classroomRows = tabs.classroom_activity || [];
  const plannerRows = tabs.planner_submissions || [];
  const syllabusRows = tabs.syllabus_coverage || [];
  const assessmentRows = tabs.assessment_tracking || [];
  const complianceRows = tabs.compliance_evidence || [];
  const alertRows = tabs.dashboard_alerts || [];
  const remedialRows = tabs.remedial_risk || [];
  const classroomCourseRows = tabs.classroom_course_map || [];
  const sortedPlannerRows = [...plannerRows].sort((left, right) => compareClassLabels(
    pickFirst(left, ["class", "class_name", "grade"], ""),
    pickFirst(right, ["class", "class_name", "grade"], "")
  ) || pickFirst(left, ["section"], "").localeCompare(pickFirst(right, ["section"], "")));
  const sortedSyllabusRows = [...syllabusRows].sort((left, right) => compareClassLabels(
    pickFirst(left, ["class", "class_name", "grade"], ""),
    pickFirst(right, ["class", "class_name", "grade"], "")
  ) || pickFirst(left, ["section"], "").localeCompare(pickFirst(right, ["section"], "")));
  const sortedAssessmentRows = [...assessmentRows].sort((left, right) => compareClassLabels(
    pickFirst(left, ["class", "class_name", "grade"], ""),
    pickFirst(right, ["class", "class_name", "grade"], "")
  ) || pickFirst(left, ["section"], "").localeCompare(pickFirst(right, ["section"], "")));

  return {
    ...EMPTY_PRINCIPAL_DASHBOARD,
    classroomMonitoring: {
      ...EMPTY_PRINCIPAL_DASHBOARD.classroomMonitoring,
      totalClassrooms: classRows.length,
      activeClassSections: classRows.length,
      googleClassroomCourseCount: classroomCourseRows.length,
      monitoredClassroomsCount: classroomRows.filter((row) => countTruthyRows([row], ["status", "publish_status", "sync_status", "activity_status"]) > 0).length || classroomRows.length,
      postedThisWeek: countTruthyRows(classroomRows, ["status", "publish_status", "sync_status"]),
      zeroActivityThisWeek: Math.max(0, classRows.length - countTruthyRows(classroomRows, ["status", "publish_status", "sync_status"])),
      assignmentsCreatedThisWeek: classroomRows.length,
      averageSubmissionRate: averageFromRows(classroomRows, ["submission_rate", "completion", "percentage", "rate"]),
      meetSessionsHeldThisWeek: countTruthyRows(classroomRows, ["meet", "meet_sessions", "meet_status", "session_status"])
    },
    academicMonitoring: {
      stages: buildPrincipalAcademicClassSeries(plannerRows, ["completion", "percentage", "status_percent"]).map((item) => ({
        stage: item.label,
        plannerRate: item.percentage
      })),
      syllabus: buildPrincipalAcademicClassSeries(syllabusRows, ["coverage", "completion", "percentage"]).map((item) => ({
        level: item.label,
        percentage: item.percentage
      })),
      assessment: buildPrincipalAcademicClassSeries(assessmentRows, ["completion", "score", "percentage"]).map((item) => ({
        level: item.label,
        percentage: item.percentage
      }))
    },
    compliance: {
      categories: complianceRows.map((row, index) => ({
        name: pickFirst(row, ["category", "name", "standard", "evidence_area"], `Compliance ${index + 1}`),
        score: firstNumberFromRow(row, ["score", "completion", "percentage", "status_percent"]) ?? 0
      })),
      overall: averageFromRows(complianceRows, ["score", "completion", "percentage", "status_percent"])
    },
    teacherPerformanceIndicators: (allocationRows.length > 0 ? allocationRows : staffRows).map((row, index) => {
      const teacherName = pickFirst(row, ["teacher_name", "staff_name", "name", "teacher_email"], `Teacher ${index + 1}`);
      const teacherEmail = pickFirst(row, ["teacher_email", "email", "staff_email"], "");
      const teacherStaffId = pickFirst(row, ["teacher_staff_id", "staff_id", "allocation_id"], "");
      const className = pickFirst(row, ["class", "class_name", "grade"], "");
      const section = pickFirst(row, ["section"], "");
      const subject = pickFirst(row, ["subject", "subject_name"], "");
      const scopeMatches = (candidate: SheetRow) => {
        const candidateClass = pickFirst(candidate, ["class", "class_name", "grade"], "");
        const candidateSection = pickFirst(candidate, ["section"], "");
        const candidateSubject = pickFirst(candidate, ["subject", "subject_name"], "");
        const classMatch = !className || normalizeKey(candidateClass) === normalizeKey(className);
        const sectionMatch = !section || normalizeKey(candidateSection) === normalizeKey(section);
        const subjectMatch = !subject || !candidateSubject || normalizeKey(candidateSubject).includes(normalizeKey(subject)) || normalizeKey(subject).includes(normalizeKey(candidateSubject));
        return rowMatchesAnyTeacherIdentity(candidate, [teacherName, teacherEmail, teacherStaffId]) || (classMatch && sectionMatch && subjectMatch);
      };
      const matchingPlannerRows = sortedPlannerRows.filter(scopeMatches);
      const matchingAssessmentRows = sortedAssessmentRows.filter(scopeMatches);
      const matchingClassroomRows = classroomRows.filter(scopeMatches);
      const matchingResourceRows = [
        ...(tabs.lesson_workspace_registry || []),
        ...(tabs.artifact_registry || []),
        ...(tabs.classroom_publish_log || [])
      ].filter(scopeMatches);
      const latestLiveDate = pickFirstDate(
        [...matchingPlannerRows, ...matchingAssessmentRows, ...matchingClassroomRows, ...matchingResourceRows],
        ["updated_at", "created_at", "posted_at", "last_active", "last_synced_at", "timestamp", "date"]
      );
      const plannerStatus = matchingPlannerRows.some((candidate) => /done|submitted|complete|published|live/i.test(pickFirst(candidate, ["status", "completion_status", "publish_status", "review_status"], "")))
        ? "Done"
        : matchingPlannerRows.length > 0
          ? "Partial"
          : "Missing";
      const assessmentStatus = matchingAssessmentRows.some((candidate) => /done|submitted|complete|published|live|locked|approved/i.test(pickFirst(candidate, ["status", "completion_status", "review_status", "publish_status"], "")))
        ? "Done"
        : matchingAssessmentRows.length > 0
          ? "Partial"
          : "Missing";
      const classroomActivityStatus = matchingClassroomRows.length > 0
        ? "Active"
        : matchingResourceRows.length > 0
          ? "Low"
          : "Inactive";
      const resourceCount = matchingResourceRows.length;
      return {
        name: teacherName,
        class: section ? `${className}-${section}` : className,
        subject,
        syllabusPlanner: plannerStatus,
        assessmentsOnTrack: assessmentStatus,
        classroomActivity: classroomActivityStatus,
        remedialActionPlan: String(resourceCount),
        resourceCount,
        dateRange: latestLiveDate ? humanizeDateValue(latestLiveDate) : "",
        lastActive: latestLiveDate ? humanizeDateTimeValue(latestLiveDate) : "",
        source: classroomActivityStatus === "Active" ? "Google Classroom" : resourceCount > 0 ? "Google Drive" : "Schooly"
      };
    }),
    monitoringFormsDataFeeds: [
      {
        id: "lesson-workspace",
        form: "Lesson workspace",
        submitted: plannerRows.length,
        total: Math.max(plannerRows.length, classRows.length),
        overdue: Math.max(0, classRows.length - plannerRows.length),
        percent: classRows.length ? Math.round((plannerRows.length / classRows.length) * 100) : 0,
        responsibleOwner: pickFirst(sortedPlannerRows[0] || {}, ["teacher_name", "staff_name", "name", "submitted_by"], ""),
        linkedClassSection: [pickFirst(sortedPlannerRows[0] || {}, ["class", "class_name", "grade"], ""), pickFirst(sortedPlannerRows[0] || {}, ["section"], "")].filter(Boolean).join("-"),
        lastSubmittedDate: humanizeDateTimeValue(pickFirstDate(sortedPlannerRows, ["submitted_at", "created_at", "updated_at", "posted_at"])),
        evidenceLinkLabel: "Lesson Workspace",
        source: "Lesson Workspace"
      },
      {
        id: "assessment-tracking",
        form: "Assessment tracking",
        submitted: assessmentRows.length,
        total: Math.max(assessmentRows.length, classRows.length),
        overdue: Math.max(0, classRows.length - assessmentRows.length),
        percent: classRows.length ? Math.round((assessmentRows.length / classRows.length) * 100) : 0,
        responsibleOwner: pickFirst(sortedAssessmentRows[0] || {}, ["teacher_name", "staff_name", "name", "submitted_by"], ""),
        linkedClassSection: [pickFirst(sortedAssessmentRows[0] || {}, ["class", "class_name", "grade"], ""), pickFirst(sortedAssessmentRows[0] || {}, ["section"], "")].filter(Boolean).join("-"),
        lastSubmittedDate: humanizeDateTimeValue(pickFirstDate(sortedAssessmentRows, ["submitted_at", "created_at", "updated_at", "planned_date"])),
        evidenceLinkLabel: "Assessment Tracking",
        source: "Assessment Tracking"
      },
      {
        id: "sqaa-evidence",
        form: "SQAA evidence",
        submitted: complianceRows.length,
        total: Math.max(complianceRows.length, 1),
        overdue: 0,
        percent: complianceRows.length ? 100 : 0,
        responsibleOwner: pickFirst(complianceRows[0] || {}, ["owner", "responsible_owner", "teacher_name", "name"], ""),
        linkedClassSection: pickFirst(complianceRows[0] || {}, ["class", "class_name", "grade"], ""),
        lastSubmittedDate: humanizeDateTimeValue(pickFirstDate(complianceRows, ["submitted_at", "created_at", "updated_at"])),
        evidenceLinkLabel: "SQAA Evidence",
        source: "QA Review"
      }
    ].filter((feed) => feed.submitted > 0 || feed.total > 0),
    alertsRequiringAttention: alertRows.map((row, index) => {
      const title = pickFirst(row, ["alert_title", "title", "name"], "")
        || pickFirst(row, ["alert_type"], "")
        || [
          pickFirst(row, ["class", "class_name", "grade"], ""),
          pickFirst(row, ["subject", "subject_name"], ""),
          pickFirst(row, ["severity", "priority"], "")
        ].filter(Boolean).join(" ")
        || "Alert requires attention";
      const message = pickFirst(row, ["alert_message", "message", "description", "notes"], "")
        || `${friendlySourceLabel(pickFirst(row, ["source", "tab", "registry"], ""), "Dashboard Alerts")} · ${pickFirst(row, ["status"], "Open")}`;
      return {
        id: pickFirst(row, ["alert_id", "id"], `alert-${index + 1}`),
        severity: pickFirst(row, ["severity", "priority"], "Info"),
        title,
        text: message,
        message,
        statusLabel: pickFirst(row, ["status"], "Open"),
        classLabel: pickFirst(row, ["class", "class_name", "grade"], ""),
        sectionLabel: pickFirst(row, ["section"], ""),
        subjectLabel: pickFirst(row, ["subject", "subject_name"], ""),
        dueLabel: humanizeDateValue(pickFirst(row, ["due_date", "target_date", "created_at", "updated_at"], "")),
        sourceLabel: friendlySourceLabel(pickFirst(row, ["source", "tab", "registry"], ""), "Dashboard Alerts"),
        source: sourceState ? sourceRef(sourceState, "dashboardDataSourceUrl", pickFirst(row, ["tab"], "Dashboard_Alerts")) : {
          workbook: "Dashboard Data Source",
          tab: pickFirst(row, ["tab"], "Dashboard_Alerts"),
          rowCount: 0,
          lastSyncedAt: null
        }
      };
    }),
    remedialRisk: remedialRows
  };
}

function normalizeTeacherToken(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9@._+-]+/g, " ").replace(/\s+/g, " ").trim();
}

function valuesForRow(row: SheetRow): string[] {
  return Object.values(row).map((value) => String(value || "").trim()).filter(Boolean);
}

function rowMatchesTeacherIdentity(row: SheetRow, identity: string): boolean {
  const token = normalizeTeacherToken(identity);
  if (!token) return false;
  const rowValues = valuesForRow(row).map(normalizeTeacherToken);
  return rowValues.some((value) => value === token || value.includes(token) || token.includes(value));
}

function rowMatchesAnyTeacherIdentity(row: SheetRow, identities: string[]): boolean {
  const normalized = identities.map(normalizeTeacherToken).filter(Boolean);
  if (normalized.length === 0) return false;
  return normalized.some((identity) => rowMatchesTeacherIdentity(row, identity));
}

function resolveStaffDirectoryRow(rows: SheetRow[], identities: string[], rolePatterns: RegExp[] = []): SheetRow | null {
  const normalizedIdentities = identities.map(normalizeTeacherToken).filter(Boolean);
  const identityMatch = rows.find((row) => normalizedIdentities.some((identity) => rowMatchesTeacherIdentity(row, identity)));
  if (identityMatch) return identityMatch;
  const roleMatch = rows.find((row) => {
    const roleText = [
      pickFirst(row, ["role", "designation", "title", "position"], ""),
      valuesForRow(row).join(" ")
    ].join(" ");
    return rolePatterns.some((pattern) => pattern.test(roleText));
  });
  return roleMatch || null;
}

function formatCompactDate(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return humanizeDateValue(raw);
}

function formatCompactDateTime(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return humanizeDateValue(raw);
}

function parseClockMinutes(value: string): number | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || "0");
  const meridian = (match[3] || "").toLowerCase();
  if (meridian === "pm" && hours < 12) hours += 12;
  if (meridian === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function normalizeDayOfWeek(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function currentDayNames(date = new Date()): string[] {
  const full = date.toLocaleDateString(undefined, { weekday: "long" }).toLowerCase();
  const short = date.toLocaleDateString(undefined, { weekday: "short" }).toLowerCase();
  return [full, short];
}

function sourceRef(sourceState: DashboardSourceState, workbookKey: keyof SeededRegistryConfig, tabName: string): TeacherDashboardSourceReference {
  const workbook = REGISTRY_DEFINITIONS.find((item) => item.key === workbookKey)?.label || String(workbookKey);
  const registry = sourceState.registries.find((item) => item.key === workbookKey);
  return {
    workbook,
    tab: tabName,
    rowCount: registry?.tabRowCounts?.[tabName] ?? registry?.rowCount ?? 0,
    lastSyncedAt: registry?.lastReadAt || sourceState.lastSyncedAt || null
  };
}

function examSourceRef(sourceState: DashboardSourceState, workbookKey: keyof SeededRegistryConfig, tabName: string): ExaminationDashboardSourceReference {
  return sourceRef(sourceState, workbookKey, tabName) as ExaminationDashboardSourceReference;
}

function parentSourceRef(sourceState: DashboardSourceState, workbookKey: keyof SeededRegistryConfig, tabName: string): ParentDashboardSourceReference {
  return sourceRef(sourceState, workbookKey, tabName) as ParentDashboardSourceReference;
}

function hodSourceRef(sourceState: DashboardSourceState, workbookKey: keyof SeededRegistryConfig, tabName: string): HodDashboardSourceReference {
  const ref = sourceRef(sourceState, workbookKey, tabName);
  return ref;
}

function managerSourceRef(sourceState: DashboardSourceState, workbookKey: keyof SeededRegistryConfig, tabName: string): ManagerDashboardSourceReference {
  return sourceRef(sourceState, workbookKey, tabName);
}

function studentSourceRef(sourceState: DashboardSourceState, workbookKey: keyof SeededRegistryConfig, tabName: string): StudentDashboardSourceReference {
  return sourceRef(sourceState, workbookKey, tabName);
}

function normalizeManagerStatus(value: string): "healthy" | "warning" | "attention" | "neutral" {
  const token = String(value || "").trim().toLowerCase();
  if (!token) return "neutral";
  if (/(done|complete|completed|active|live|posted|verified|approved|met|yes|green|ok)/.test(token)) return "healthy";
  if (/(pending|draft|review|watch|partial|low|warning)/.test(token)) return "warning";
  if (/(overdue|missing|critical|blocked|alert|failed|risk)/.test(token)) return "attention";
  return "neutral";
}

function normalizeManagerSeverity(value: string): "critical" | "high" | "warning" | "neutral" {
  const token = String(value || "").trim().toLowerCase();
  if (/(critical|blocker|urgent|red|high)/.test(token)) return "critical";
  if (/(high|medium|amber|warning|attention)/.test(token)) return "high";
  if (token) return "warning";
  return "neutral";
}

function statusFromPercent(value: number | null | undefined): "healthy" | "warning" | "attention" | "neutral" {
  if (typeof value !== "number" || !Number.isFinite(value)) return "neutral";
  if (value >= 80) return "healthy";
  if (value >= 60) return "warning";
  if (value >= 40) return "attention";
  return "neutral";
}

function splitScopeValues(value: string): string[] {
  return String(value || "")
    .split(/[,;/|\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function sortClassLabelValue(value: string): number {
  return getClassSortValue(value);
}

const PRINCIPAL_ACADEMIC_CLASS_LABELS = Array.from({ length: 12 }, (_, index) => formatClassLabel(index + 1));

function buildPrincipalAcademicClassSeries(rows: SheetRow[], valueKeys: string[]): Array<{ label: string; percentage: number }> {
  const aggregates = new Map<string, { label: string; total: number; count: number }>();

  rows.forEach((row) => {
    const label = formatClassLabel(pickFirst(row, ["class", "class_name", "grade", "level", "stage"], ""));
    if (!label) return;
    const current = aggregates.get(label.toLowerCase()) || { label, total: 0, count: 0 };
    current.total += firstNumberFromRow(row, valueKeys) ?? 0;
    current.count += 1;
    aggregates.set(label.toLowerCase(), current);
  });

  return PRINCIPAL_ACADEMIC_CLASS_LABELS.map((label) => {
    const aggregate = aggregates.get(label.toLowerCase());
    return {
      label,
      percentage: aggregate && aggregate.count > 0 ? Math.round(aggregate.total / aggregate.count) : 0
    };
  });
}

function buildHodDashboard(tabs: SheetTabMap, sourceState: DashboardSourceState, options: LoadDashboardDataOptions): HodDashboardData {
  const staffRows = tabs.staff_directory || [];
  const allocationRows = tabs.teacher_allocations || [];
  const classRows = tabs.classes_sections || [];
  const subjectRows = tabs.subjects || [];
  const academicYearRows = tabs.academic_years || [];
  const departmentScopeRows = tabs.department_scope || [];
  const lessonRows = tabs.lesson_workspace_registry || [];
  const artifactRows = tabs.artifact_registry || [];
  const lessonExecRows = tabs.lesson_execution_log || [];
  const publishRows = tabs.classroom_publish_log || [];
  const ncertBookRows = tabs.ncert_book_registry || [];
  const ncertChapterRows = tabs.ncert_chapter_registry || [];
  const ncertFileMapRows = tabs.ncert_chapter_file_map || [];
  const dashboardMetricRows = tabs.dashboard_metrics || [];
  const classroomRows = tabs.classroom_activity || [];
  const plannerRows = tabs.planner_submissions || [];
  const dashboardAlertRows = tabs.dashboard_alerts || [];
  const evidenceGapRows = tabs.evidence_gaps || [];
  const assessmentPlanRows = tabs.assessment_plan || [];
  const questionPaperRows = tabs.question_paper_registry || [];
  const marksRows = tabs.marks_entry || [];
  const resultRows = tabs.result_analysis || [];
  const announcementRows = tabs.classroom_announcement_sync || [];
  const enrichmentRows = tabs.hod_enrichment_olympiad_registry || [];

  const hodIdentity = String(options.teacherIdentity || options.workspaceUrl || options.classroomUrl || "").trim();
  const hodRow =
    staffRows.find((row) => rowMatchesTeacherIdentity(row, hodIdentity)) ||
    staffRows.find((row) => /hod|head of department|department head/i.test(pickFirst(row, ["role", "designation"], ""))) ||
    null;

  const hodScopeRows = departmentScopeRows.filter((row) =>
    rowMatchesAnyTeacherIdentity(row, [hodIdentity, pickFirst(hodRow || {}, ["staff_name", "teacher_name", "name"], ""), pickFirst(hodRow || {}, ["email", "teacher_email"], ""), pickFirst(hodRow || {}, ["staff_id", "teacher_staff_id"], "")])
  );
  const inferredAllocations = allocationRows.filter((row) =>
    rowMatchesAnyTeacherIdentity(row, [hodIdentity, pickFirst(hodRow || {}, ["staff_name", "teacher_name", "name"], ""), pickFirst(hodRow || {}, ["email", "teacher_email"], ""), pickFirst(hodRow || {}, ["staff_id", "teacher_staff_id"], "")])
  );

  const hodName = pickFirst(hodRow || {}, ["staff_name", "teacher_name", "name"], "");
  const hodEmail = pickFirst(hodRow || {}, ["email", "teacher_email"], "");
  const hodStaffId = pickFirst(hodRow || {}, ["staff_id", "teacher_staff_id"], "");
  const department = pickFirst(hodScopeRows[0] || hodRow || {}, ["department", "designation"], "");
  const subjectArea = pickFirst(hodScopeRows[0] || hodRow || {}, ["subject_area", "subject", "department"], department || "Subject area pending");
  const academicSession = getActiveAcademicYearLabel(tabs);
  const classValues = Array.from(new Set([
    ...hodScopeRows.flatMap((row) => splitScopeValues(pickFirst(row, ["classes"], ""))),
    ...hodScopeRows.flatMap((row) => splitScopeValues(pickFirst(row, ["class_from"], ""))),
    ...hodScopeRows.flatMap((row) => splitScopeValues(pickFirst(row, ["class_to"], ""))),
    ...inferredAllocations.map((row) => pickFirst(row, ["class", "class_name", "grade"], "")).filter(Boolean)
  ])).filter(Boolean);
  const scopeClassRows = classRows.filter((row) => classValues.length === 0 || classValues.includes(pickFirst(row, ["class", "class_name", "grade"], "")));
  const scopeSubjectValues = Array.from(new Set([
    ...hodScopeRows.flatMap((row) => splitScopeValues(pickFirst(row, ["subjects"], ""))),
    ...subjectRows.filter((row) => classValues.length === 0 || classValues.includes(pickFirst(row, ["class", "class_name", "grade"], ""))).map((row) => pickFirst(row, ["subject", "subject_name"], ""))
  ])).filter(Boolean);
  const configuredScope = classValues.length > 0
    ? classValues.join(", ")
    : hodScopeRows.length > 0
      ? hodScopeRows.map((row) => pickFirst(row, ["scope_name", "department"], "")).filter(Boolean).join(", ")
      : "";
  const activeTeacherRows = inferredAllocations.length > 0
    ? inferredAllocations
    : allocationRows.filter((row) => {
        const className = pickFirst(row, ["class", "class_name", "grade"], "");
        const subject = pickFirst(row, ["subject", "subject_name"], "");
        return (classValues.length === 0 || classValues.includes(className)) && (scopeSubjectValues.length === 0 || scopeSubjectValues.includes(subject));
      });
  const uniqueTeacherIds = new Set(activeTeacherRows.map((row) => pickFirst(row, ["teacher_staff_id", "teacher_email", "teacher_name"], "")).filter(Boolean));
  const hasConfiguredScope = hodScopeRows.length > 0 || inferredAllocations.length > 0;
  const setupState: HodSetupState = hodRow
    ? {
        status: sourceState.mode === "live" && hasConfiguredScope ? "live" : "setup_required",
        title: hasConfiguredScope ? "HOD dashboard connected" : "HOD scope not configured.",
        message: hasConfiguredScope
          ? "Live rows found for this HOD context."
          : "HOD scope not configured.",
        messages: hasConfiguredScope
          ? (sourceState.setupMessages.length > 0 ? sourceState.setupMessages : ["Live rows are available."])
          : [
              "Add Schooly_Master_Data_Registry / Department_Scope.",
              "Seed Schooly_Master_Data_Registry / Teacher_Allocations for class and subject ownership."
            ]
      }
    : {
        status: "setup_required",
        title: "HOD dashboard setup required",
        message: "HOD could not be resolved from live data.",
        messages: [
          "Create a matching row in Schooly_Master_Data_Registry / Staff_Directory.",
          "Add a Department_Scope row or HOD-scoped Teacher_Allocations."
        ]
      };

  if (!hodRow && !hasConfiguredScope) {
    return {
      hodProfile: {
        initials: "",
        name: "",
        departmentLabel: "HOD scope not configured.",
        academicSession,
        subjectArea: "",
        classRange: "",
        activeTeacherCount: "0",
        source: hodSourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory")
      },
      kpis: [],
      repositoryHealthByClass: [],
      teacherActivity: [],
      assessmentTracking: [],
      enrichmentOlympiad: {
        configured: false,
        title: "Enrichment and Olympiads",
        message: "Schooly_Enrichment_Olympiad_Registry is not configured.",
        statusLabel: "Setup required"
      },
      remedialStatus: [],
      announcements: [],
      complianceAlerts: [],
      sourceHealth: [
        hodSourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory"),
        hodSourceRef(sourceState, "masterDataRegistryUrl", "Department_Scope"),
        hodSourceRef(sourceState, "masterDataRegistryUrl", "Teacher_Allocations"),
        hodSourceRef(sourceState, "ncertPrivateDriveMapUrl", "NCERT_Chapter_File_Map"),
        hodSourceRef(sourceState, "ncertRegistryUrl", "NCERT_Chapter_Registry"),
        hodSourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Workspace_Registry"),
        hodSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts"),
        hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan"),
        hodSourceRef(sourceState, "hodEnrichmentOlympiadRegistryUrl", "Enrichment_Programmes")
      ],
      setupState
    };
  }

  const classCompletion = (className: string) => {
    const chapterRows = ncertChapterRows.filter((row) => pickFirst(row, ["class", "class_name", "grade"], "") === className);
    const fileRows = ncertFileMapRows.filter((row) => pickFirst(row, ["class", "class_name", "grade"], "") === className);
    const resourceRows = [...artifactRows, ...lessonRows, ...publishRows, ...fileRows].filter((row) => pickFirst(row, ["class", "class_name", "grade"], "") === className);
    const denominator = chapterRows.length;
    const numerator = resourceRows.length;
    return {
      completion: denominator > 0 ? Math.min(100, Math.round((numerator / denominator) * 100)) : 0,
      label: denominator > 0 ? `${numerator}/${denominator} chapters/resources` : "Chapter source not configured."
    };
  };

  const repositoryHealthByClass: HodRepositoryHealthByClass[] = (scopeClassRows.length > 0 ? scopeClassRows : classRows).map((row, index) => {
    const className = pickFirst(row, ["class", "class_name", "grade"], `Class ${index + 1}`);
    const completionState = classCompletion(className);
    return {
      id: `repo-${className}-${index}`,
      className,
      completion: completionState.completion,
      label: completionState.label,
      source: hodSourceRef(sourceState, "ncertPrivateDriveMapUrl", "NCERT_Chapter_File_Map")
    };
  }).filter((item, index, self) => index === self.findIndex((candidate) => candidate.className === item.className))
    .sort((left, right) => {
      const diff = sortClassLabelValue(left.className) - sortClassLabelValue(right.className);
      return diff !== 0 ? diff : left.className.localeCompare(right.className);
    });

  const teacherActivity: HodTeacherActivityRow[] = Array.from(uniqueTeacherIds).slice(0, 5).map((teacherKey, index) => {
    const teacherRow = activeTeacherRows.find((row) => pickFirst(row, ["teacher_staff_id", "teacher_email", "teacher_name"], "") === teacherKey) || activeTeacherRows[index] || {};
    const teacherName = pickFirst(teacherRow, ["teacher_name", "teacher_staff_id", "teacher_email"], teacherKey);
    const plannerCount = plannerRows.filter((row) => rowMatchesAnyTeacherIdentity(row, [teacherName, hodEmail, hodStaffId])).length;
    const uploadCount = [...artifactRows, ...lessonRows, ...publishRows, ...lessonExecRows].filter((row) => rowMatchesAnyTeacherIdentity(row, [teacherName, hodEmail, hodStaffId])).length;
    const qbCount = questionPaperRows.filter((row) => rowMatchesAnyTeacherIdentity(row, [teacherName, hodEmail, hodStaffId]) || scopeSubjectValues.includes(pickFirst(row, ["subject", "subject_name"], ""))).length;
    const classroomCount = classroomRows.filter((row) => rowMatchesAnyTeacherIdentity(row, [teacherName, hodEmail, hodStaffId])).length;
    const alertRow = [...dashboardAlertRows, ...evidenceGapRows].find((row) => rowMatchesAnyTeacherIdentity(row, [teacherName, hodEmail, hodStaffId])) || null;
    return {
      id: `teacher-activity-${index}`,
      teacherName,
      plannerStatus: plannerCount > 0 ? "Done" : "Missing",
      uploads: String(uploadCount),
      questionBank: String(qbCount),
      classroomStatus: classroomCount > 0 ? "Active" : "Low",
      complianceAlert: alertRow ? pickFirst(alertRow, ["message", "notes", "alert_type"], "Follow-up needed") : "No follow-up alert",
      source: hodSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
    };
  });

  const resultAverage = averageFromRows(resultRows.filter((row) => scopeSubjectValues.length === 0 || scopeSubjectValues.includes(pickFirst(row, ["subject", "subject_name"], ""))), ["average_marks", "pass_percent", "percentage"]);
  const belowThresholdCount = [...marksRows, ...resultRows].filter((row) => {
    const className = pickFirst(row, ["class", "class_name", "grade"], "");
    const subject = pickFirst(row, ["subject", "subject_name"], "");
    return (classValues.length === 0 || classValues.includes(className)) && (scopeSubjectValues.length === 0 || scopeSubjectValues.includes(subject)) && (firstNumberFromRow(row, ["marks_obtained", "percentage", "average_marks"]) ?? 0) < 40;
  }).length;
  const assessmentTracking: HodAssessmentTracking[] = assessmentPlanRows
    .filter((row) => {
      const className = pickFirst(row, ["class", "class_name", "grade"], "");
      const subject = pickFirst(row, ["subject", "subject_name"], "");
      return (classValues.length === 0 || classValues.includes(className)) && (scopeSubjectValues.length === 0 || scopeSubjectValues.includes(subject));
    })
    .slice(0, 5)
    .map((row, index) => {
      const className = pickFirst(row, ["class", "class_name", "grade"], "");
      const subject = pickFirst(row, ["subject", "subject_name"], "");
      const assessmentId = pickFirst(row, ["assessment_plan_id", "id"], `assessment-${index + 1}`);
      return {
        id: assessmentId,
        title: pickFirst(row, ["assessment_type", "title", "name"], "Assessment"),
        dueLabel: pickFirst(row, ["planned_date", "due_date"], "Pending"),
        resultsLabel: marksRows.some((mark) => pickFirst(mark, ["assessment_plan_id"], "") === assessmentId) ? "Results entered" : "Results pending",
        departmentAverageLabel: `Dept avg ${resultAverage}%`,
        belowThresholdLabel: `${belowThresholdCount} below threshold`,
        source: hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan")
      };
    });

  const enrichmentCount = enrichmentRows.length;
  const enrichmentOlympiad: HodEnrichmentOlympiadStatus = enrichmentCount > 0
    ? {
        configured: true,
        title: "Enrichment and Olympiads",
        message: `${enrichmentCount} live row${enrichmentCount === 1 ? "" : "s"} found in the enrichment registry.`,
        statusLabel: "Live"
      }
    : {
        configured: false,
        title: "Enrichment and Olympiads",
        message: "Schooly_Enrichment_Olympiad_Registry is not configured.",
        statusLabel: "Setup required"
      };

  const remedialStatus: HodRemedialStatus[] = [
    { id: "identified", label: "Identified students", value: `${evidenceGapRows.length} students`, source: hodSourceRef(sourceState, "dashboardDataSourceUrl", "Evidence_Gaps") },
    { id: "sessions", label: "Remedial sessions held", value: `${lessonExecRows.filter((row) => /remedial/i.test(pickFirst(row, ["notes", "execution_status", "status"], ""))).length} this term`, source: hodSourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Execution_Log") },
    { id: "resources", label: "Resources in remedial folder", value: `${artifactRows.filter((row) => /remedial/i.test(pickFirst(row, ["artifact_type", "artifact_title", "notes"], ""))).length} files`, source: hodSourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Artifact_Registry") },
    { id: "improved", label: "Improved after remedial", value: `${resultRows.filter((row) => (firstNumberFromRow(row, ["pass_percent", "percentage"]) ?? 0) >= 60).length} students`, source: hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Analysis") },
    { id: "still-needs", label: "Still needs support", value: `${evidenceGapRows.length + marksRows.filter((row) => (firstNumberFromRow(row, ["marks_obtained", "percentage"]) ?? 0) < 40).length} students`, source: hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Marks_Entry") }
  ];

  const complianceAlerts: HodComplianceAlert[] = [...dashboardAlertRows, ...evidenceGapRows]
    .filter((row) => rowMatchesAnyTeacherIdentity(row, [hodIdentity, hodName, hodEmail, hodStaffId]) || (scopeSubjectValues.length > 0 && scopeSubjectValues.includes(pickFirst(row, ["subject", "subject_name"], ""))))
    .slice(0, 5)
    .map((row, index) => ({
      id: pickFirst(row, ["alert_id", "gap_id", "id"], `hod-alert-${index + 1}`),
      teacherName: pickFirst(row, ["teacher_name", "assigned_teacher", "owner"], hodName || "HOD"),
      alertType: pickFirst(row, ["alert_type", "gap_type", "severity"], "Follow-up"),
      severity: pickFirst(row, ["severity", "priority"], "medium"),
      message: pickFirst(row, ["message", "notes", "description"], "Open alert"),
      source: hodSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
    }));

  const announcements = announcementRows
    .filter((row) => classValues.length === 0 || classValues.includes(pickFirst(row, ["class", "class_name", "grade"], "")))
    .slice(0, 5)
    .map((row, index) => ({
      id: pickFirst(row, ["announcement_id", "id"], `hod-announcement-${index + 1}`),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      subject: pickFirst(row, ["subject", "subject_name"], ""),
      title: pickFirst(row, ["announcement_title", "post_title", "title"], "Classroom announcement"),
      text: pickFirst(row, ["announcement_text", "message", "notes"], ""),
      postedAt: pickFirst(row, ["posted_at", "created_at", "updated_at"], ""),
      status: pickFirst(row, ["status"], "Posted"),
      url: pickFirst(row, ["classroom_url"], ""),
      source: hodSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
    }));

  const kpis: HodKpiMetric[] = [
    {
      id: "repository-resources",
      label: "Repository resources",
      value: String([...artifactRows, ...lessonRows, ...publishRows, ...ncertFileMapRows].length),
      detail: "Files across the HOD scope.",
      status: repositoryHealthByClass.length > 0 ? "healthy" : "warning",
      source: hodSourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Artifact_Registry")
    },
    {
      id: "chapters-resourced",
      label: "Chapters fully resourced",
      value: `${repositoryHealthByClass.length > 0 ? Math.round(repositoryHealthByClass.reduce((sum, row) => sum + row.completion, 0) / repositoryHealthByClass.length) : 0}%`,
      detail: repositoryHealthByClass.length > 0 ? "Chapter coverage from live file map rows." : "Chapter source not configured.",
      status: repositoryHealthByClass.length > 0 ? "healthy" : "warning",
      source: hodSourceRef(sourceState, "ncertPrivateDriveMapUrl", "NCERT_Chapter_File_Map")
    },
    {
      id: "qb-questions",
      label: "QB questions added",
      value: String(questionPaperRows.length),
      detail: "Question paper rows in scope.",
      status: questionPaperRows.length > 0 ? "healthy" : "neutral",
      source: hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Question_Paper_Registry")
    },
    {
      id: "dept-average",
      label: "Department average",
      value: `${resultAverage}%`,
      detail: resultRows.length > 0 ? "Latest department average from results." : "No assessment results found.",
      status: resultRows.length > 0 ? "healthy" : "warning",
      source: hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Analysis")
    }
  ];

  const sourceHealth: HodDashboardSourceReference[] = [
    hodSourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory"),
    hodSourceRef(sourceState, "masterDataRegistryUrl", "Department_Scope"),
    hodSourceRef(sourceState, "masterDataRegistryUrl", "Teacher_Allocations"),
    hodSourceRef(sourceState, "masterDataRegistryUrl", "Classes_Sections"),
    hodSourceRef(sourceState, "masterDataRegistryUrl", "Subjects"),
    hodSourceRef(sourceState, "ncertRegistryUrl", "NCERT_Book_Registry"),
    hodSourceRef(sourceState, "ncertRegistryUrl", "NCERT_Chapter_Registry"),
    hodSourceRef(sourceState, "ncertPrivateDriveMapUrl", "NCERT_Chapter_File_Map"),
    hodSourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Workspace_Registry"),
    hodSourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Artifact_Registry"),
    hodSourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Classroom_Publish_Log"),
    hodSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts"),
    hodSourceRef(sourceState, "dashboardDataSourceUrl", "Evidence_Gaps"),
    hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan"),
    hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Question_Paper_Registry"),
    hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Marks_Entry"),
    hodSourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Analysis"),
    hodSourceRef(sourceState, "hodEnrichmentOlympiadRegistryUrl", "Enrichment_Programmes")
  ];

  return {
    hodProfile: {
      initials: hodName ? hodName.split(/\s+/).map((part) => part.trim()[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : (hodEmail ? hodEmail.slice(0, 2).toUpperCase() : "HOD"),
      name: hodName,
      departmentLabel: department ? `${department} Head of Department` : "HOD scope not configured.",
      academicSession,
      subjectArea,
      classRange: classValues.length > 0 ? classValues.join(", ") : "HOD scope not configured.",
      activeTeacherCount: String(uniqueTeacherIds.size || 0),
      source: hodSourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory")
    },
    kpis,
    repositoryHealthByClass,
    teacherActivity,
    assessmentTracking,
    enrichmentOlympiad,
    remedialStatus,
    announcements,
    complianceAlerts,
    sourceHealth,
    setupState
  };
}

function pickFirstDate(rows: SheetRow[], keys: string[]): string {
  for (const row of rows) {
    for (const key of keys) {
      const value = row[normalizeKey(key)];
      if (value && String(value).trim()) return String(value).trim();
    }
  }
  return "";
}

function buildTeacherDashboard(tabs: SheetTabMap, sourceState: DashboardSourceState, options: LoadDashboardDataOptions): TeacherDashboardData {
  const teacherIdentity = String(options.teacherIdentity || options.workspaceUrl || options.classroomUrl || "").trim();
  const schoolProfileRows = tabs.school_profile || [];
  const academicYearRows = tabs.academic_years || [];
  const classRows = tabs.classes_sections || [];
  const subjectRows = tabs.subjects || [];
  const staffRows = tabs.staff_directory || [];
  const allocationRows = tabs.teacher_allocations || [];
  const timetableRows = tabs.timetable || [];
  const studentEnrollmentRows = tabs.student_enrollment || [];
  const bookRows = tabs.books_registry || [];
  const tocRows = tabs.book_toc_registry || [];
  const dashboardMetricRows = tabs.dashboard_metrics || [];
  const dashboardPlannerRows = tabs.planner_submissions || [];
  const dashboardClassroomRows = tabs.classroom_activity || [];
  const dashboardAssessmentRows = tabs.assessment_tracking || [];
  const notebookRows = tabs.notebook_monitoring || [];
  const attendanceRows = tabs.attendance_summary || [];
  const syllabusRows = tabs.syllabus_coverage || [];
  const dashboardAlertRows = tabs.dashboard_alerts || [];
  const dashboardLogRows = tabs.dashboard_source_log || [];
  const lessonRows = tabs.lesson_workspace_registry || [];
  const artifactRows = tabs.artifact_registry || [];
  const lessonExecRows = tabs.lesson_execution_log || [];
  const publishRows = tabs.classroom_publish_log || [];
  const assessmentPlanRows = tabs.assessment_plan || [];
  const marksRows = tabs.marks_entry || [];
  const resultRows = tabs.result_analysis || [];
  const questionPaperRows = tabs.question_paper_registry || [];
  const invigilationRows = tabs.invigilation_olympiad_duties || [];
  const classroomCourseRows = tabs.classroom_course_map || [];
  const classroomAssignmentRows = tabs.classroom_assignment_map || [];
  const classroomSubmissionRows = tabs.classroom_submission_sync || [];
  const classroomSyncLogRows = tabs.classroom_sync_log || [];
  const classroomAnnouncementRows = tabs.classroom_announcement_sync || [];

  const teacherRow = resolveStaffDirectoryRow(staffRows, [teacherIdentity], [/teacher/i])
    || allocationRows.find((row) => rowMatchesTeacherIdentity(row, teacherIdentity));

  const setupState: TeacherDashboardSetupState = teacherRow
    ? {
        status: sourceState.mode === "live" ? "live" : sourceState.mode,
        title: "Teacher dashboard connected",
        message: "Live rows found for this teacher context.",
        messages: sourceState.setupMessages.length > 0 ? sourceState.setupMessages : ["Live rows are available."]
      }
    : {
        status: "setup_required",
        title: "Teacher dashboard setup required",
        message: "Teacher could not be resolved from live data.",
        messages: [
          "Create a matching row in Schooly_Master_Data_Registry / Staff_Directory.",
          "Add teacher allocations in Schooly_Master_Data_Registry / Teacher_Allocations."
        ]
      };

  if (!teacherRow) {
    return {
      header: {
        initials: "",
        name: "",
        label: "Teacher",
        subject: "",
        classes: [],
        academicSession: getActiveAcademicYearLabel(tabs),
        source: sourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory")
      },
      kpis: [],
      timetable: [],
      pendingTasks: [],
      quickLinks: [
        { label: "Class announcements", detail: "Review classroom updates.", actionTab: "classroom", actionLabel: "Open", available: true },
        { label: "My repository/files", detail: "Open lesson resources.", actionTab: "textbooks", actionLabel: "Open", available: true },
        { label: "Submit weekly planner", detail: "Go to lesson workspace.", actionTab: "lesson-plans", actionLabel: "Open", available: true },
        { label: "Apply for leave", detail: "No leave workflow is connected yet.", actionLabel: "Setup required", available: false }
      ],
      classPerformance: [],
      classroomActivity: [],
      assessmentTracking: [],
      invigilationDuty: null,
      renewalStatus: {
        configured: false,
        title: "My renewal status",
        message: "Teacher CPD renewal registry is not configured.",
        statusLabel: "Setup required"
      },
      announcements: [],
      sourceHealth: [
        sourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory"),
        sourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts"),
        sourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Workspace_Registry"),
        sourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan"),
        sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Course_Map")
      ],
      setupState
    };
  }

  const teacherName = pickFirst(teacherRow, ["teacher_name", "staff_name", "name"], "");
  const teacherEmail = pickFirst(teacherRow, ["teacher_email", "email", "staff_email"], "");
  const teacherStaffId = pickFirst(teacherRow, ["teacher_staff_id", "staff_id", "allocation_id"], "");
  const teacherInitials = teacherName
    ? teacherName.split(/\s+/).map((part) => part.trim()[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : teacherEmail.slice(0, 2).toUpperCase();
  const academicSession = getActiveAcademicYearLabel(tabs);
  const teacherAllocations = allocationRows.filter((row) => rowMatchesAnyTeacherIdentity(row, [teacherIdentity, teacherEmail, teacherName, teacherStaffId]));
  const teacherClasses = Array.from(new Set(
    teacherAllocations.map((row) => {
      const className = pickFirst(row, ["class", "class_name", "grade"], "");
      const section = pickFirst(row, ["section"], "");
      return section ? `${className}-${section}` : className;
    }).filter(Boolean)
  )).sort((left, right) => sortClassLabelValue(left) - sortClassLabelValue(right) || left.localeCompare(right));
  const teacherSubjects = Array.from(new Set(teacherAllocations.map((row) => pickFirst(row, ["subject", "subject_name"], "")).filter(Boolean))).sort();
  const teacherTimetableRows = timetableRows.filter((row) => rowMatchesAnyTeacherIdentity(row, [teacherIdentity, teacherEmail, teacherName, teacherStaffId]));
  const teacherClassKeys = new Set(teacherAllocations.map((row) => `${pickFirst(row, ["class", "class_name", "grade"], "")}__${pickFirst(row, ["section"], "")}`.toLowerCase()));
  const teacherSubjectKeys = new Set(teacherSubjects.map((value) => value.toLowerCase()));
  const teacherStudentCount = studentEnrollmentRows.filter((row) => {
    const classKey = `${pickFirst(row, ["class", "class_name", "grade"], "")}__${pickFirst(row, ["section"], "")}`.toLowerCase();
    return teacherClassKeys.has(classKey);
  }).length;

  const currentDayTokens = currentDayNames();
  const todayRows = teacherTimetableRows.filter((row) => currentDayTokens.includes(normalizeDayOfWeek(pickFirst(row, ["day", "weekday"], ""))));
  const timetableSourceRows = todayRows.length > 0 ? todayRows : teacherTimetableRows;
  const timetableNormalized = timetableSourceRows
    .map((row, index): TeacherTimetablePeriod => {
      const startTime = pickFirst(row, ["start_time", "start"], "");
      const endTime = pickFirst(row, ["end_time", "end"], "");
      const currentMinutes = (() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
      })();
      const startMinutes = parseClockMinutes(startTime);
      const endMinutes = parseClockMinutes(endTime);
      let highlight: TeacherTimetablePeriod["highlight"] = "normal";
      if (startMinutes != null && endMinutes != null && currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        highlight = "current";
      }
      return {
        id: pickFirst(row, ["timetable_id", "id"], `period-${index + 1}`),
        day: pickFirst(row, ["day", "weekday"], currentDayTokens[0] || "today"),
        className: pickFirst(row, ["class", "class_name", "grade"], ""),
        section: pickFirst(row, ["section"], ""),
        subject: pickFirst(row, ["subject", "subject_name"], ""),
        startTime,
        endTime,
        room: pickFirst(row, ["room", "room_no", "room_number"], ""),
        status: pickFirst(row, ["status", "period_status"], "Scheduled"),
        highlight,
        source: sourceRef(sourceState, "masterDataRegistryUrl", "Timetable")
      };
    })
    .sort((a, b) => {
      const aStart = parseClockMinutes(a.startTime) ?? 9999;
      const bStart = parseClockMinutes(b.startTime) ?? 9999;
      return aStart - bStart;
    });
  const currentPeriod = timetableNormalized.find((item) => item.highlight === "current");
  if (!currentPeriod && timetableNormalized.length > 0) {
    timetableNormalized[0].highlight = "next";
  }

  const dashboardPendingRows = [
    ...dashboardAlertRows.map((row, index) => ({
      id: pickFirst(row, ["alert_id", "id"], `alert-${index + 1}`),
      title: pickFirst(row, ["message", "alert", "title"], "Alert"),
      detail: pickFirst(row, ["description", "notes", "severity"], ""),
      severity: (pickFirst(row, ["severity", "priority"], "medium").toLowerCase() as TeacherPendingTask["severity"]),
      dueLabel: formatCompactDateTime(pickFirst(row, ["created_at", "updated_at", "alert_time", "timestamp"], "")) || "Open",
      actionLabel: "Review",
      actionTab: "dashboard-data-source",
      statusLabel: pickFirst(row, ["status"], "Open"),
      sourceLabel: "Dashboard Alerts",
      sourceTab: "Dashboard_Alerts",
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
    })),
    ...dashboardPlannerRows.map((row, index) => ({
      id: pickFirst(row, ["kpi_value_id", "id"], `planner-${index + 1}`),
      title: pickFirst(row, ["title", "name", "label"], "Weekly planner"),
      detail: pickFirst(row, ["status", "notes", "description"], "Planner submission pending"),
      severity: "medium" as const,
      dueLabel: formatCompactDateTime(pickFirst(row, ["planned_start_date", "planned_end_date", "due_date"], "")) || "Pending",
      actionLabel: "Open",
      actionTab: "lesson-plans",
      statusLabel: pickFirst(row, ["status"], "Pending"),
      sourceLabel: "Planner submissions",
      sourceTab: "Planner_Submissions",
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Planner_Submissions")
    })),
    ...classroomAssignmentRows.map((row, index) => ({
      id: pickFirst(row, ["classroom_assignment_id", "assignment_map_id", "id"], `assignment-${index + 1}`),
      title: pickFirst(row, ["assignment_title", "title"], "Classroom assignment"),
      detail: pickFirst(row, ["notes", "publish_status", "assignment_status"], ""),
      severity: "high" as const,
      dueLabel: formatCompactDate(pickFirst(row, ["due_date"], "")) || "Pending",
      actionLabel: "Grade",
      actionTab: "classroom",
      statusLabel: pickFirst(row, ["publish_status", "status"], "Open"),
      sourceLabel: "Classroom assignments",
      sourceTab: "Classroom_Assignment_Map",
      source: sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Assignment_Map")
    })),
    ...marksRows.map((row, index) => ({
      id: pickFirst(row, ["marks_entry_id", "id"], `marks-${index + 1}`),
      title: pickFirst(row, ["subject", "paper_title", "assessment_name"], "Marks entry"),
      detail: pickFirst(row, ["remarks", "status"], "Assessment marks entry pending"),
      severity: "medium" as const,
      dueLabel: formatCompactDate(pickFirst(row, ["planned_date", "due_date"], "")) || "Pending",
      actionLabel: "Enter marks",
      actionTab: "tasks",
      statusLabel: pickFirst(row, ["status"], "Pending"),
      sourceLabel: "Marks entry",
      sourceTab: "Marks_Entry",
      source: sourceRef(sourceState, "assessmentResultRegistryUrl", "Marks_Entry")
    })),
    ...lessonRows.map((row, index) => ({
      id: pickFirst(row, ["lesson_workspace_id", "id"], `lesson-${index + 1}`),
      title: pickFirst(row, ["book_title", "chapter_title", "topic_name"], "Lesson workspace"),
      detail: pickFirst(row, ["status", "qa_status", "classroom_publish_status"], "Resource upload or publish pending"),
      severity: "low" as const,
      dueLabel: formatCompactDate(pickFirst(row, ["planned_end_date", "planned_start_date"], "")) || "Pending",
      actionLabel: "Open",
      actionTab: "lesson-plans",
      statusLabel: pickFirst(row, ["status"], "Draft"),
      sourceLabel: "Lesson workspace",
      sourceTab: "Lesson_Workspace_Registry",
      source: sourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Workspace_Registry")
    })),
    ...publishRows.map((row, index) => ({
      id: pickFirst(row, ["publish_id", "id"], `publish-${index + 1}`),
      title: pickFirst(row, ["classroom_course_name", "course_name", "title"], "Classroom publish"),
      detail: pickFirst(row, ["publish_status", "notes"], "Resource publish pending"),
      severity: "low" as const,
      dueLabel: formatCompactDateTime(pickFirst(row, ["published_at", "created_at"], "")) || "Pending",
      actionLabel: "View",
      actionTab: "classroom",
      statusLabel: pickFirst(row, ["publish_status", "status"], "Pending"),
      sourceLabel: "Classroom publish",
      sourceTab: "Classroom_Publish_Log",
      source: sourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Classroom_Publish_Log")
    }))
  ]
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id))
    .sort((a, b) => {
      const severityRank: Record<TeacherPendingTask["severity"], number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const rankDiff = severityRank[a.severity] - severityRank[b.severity];
      if (rankDiff !== 0) return rankDiff;
      return a.dueLabel.localeCompare(b.dueLabel);
    });

  const classPerformance = resultRows.length > 0
    ? resultRows
        .filter((row) => !teacherSubjects.length || teacherSubjectKeys.has(normalizeKey(pickFirst(row, ["subject"], ""))))
        .filter((row) => {
          const classKey = `${pickFirst(row, ["class", "class_name", "grade"], "")}__${pickFirst(row, ["section"], "")}`.toLowerCase();
          return teacherClassKeys.size === 0 || teacherClassKeys.has(classKey);
        })
        .map((row, index): TeacherClassPerformance => ({
          id: pickFirst(row, ["analysis_id", "result_id", "id"], `performance-${index + 1}`),
          className: pickFirst(row, ["class", "class_name", "grade"], ""),
          section: pickFirst(row, ["section"], ""),
          subject: pickFirst(row, ["subject", "assessment_name"], ""),
          percent: firstNumberFromRow(row, ["average_marks", "percentage", "pass_percent", "marks_obtained"]) ?? 0,
          summary: pickFirst(row, ["weak_chapters", "remediation_required", "notes"], "Live result analysis"),
          source: sourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Analysis")
        }))
    : marksRows
        .filter((row) => {
          const classKey = `${pickFirst(row, ["class", "class_name", "grade"], "")}__${pickFirst(row, ["section"], "")}`.toLowerCase();
          return teacherClassKeys.size === 0 || teacherClassKeys.has(classKey);
        })
        .map((row, index): TeacherClassPerformance => ({
          id: pickFirst(row, ["marks_entry_id", "id"], `marks-performance-${index + 1}`),
          className: pickFirst(row, ["class", "class_name", "grade"], ""),
          section: pickFirst(row, ["section"], ""),
          subject: pickFirst(row, ["subject", "paper_title"], ""),
          percent: firstNumberFromRow(row, ["marks_obtained", "percentage", "score"]) ?? 0,
          summary: pickFirst(row, ["remarks", "status"], "Live marks entry"),
          source: sourceRef(sourceState, "assessmentResultRegistryUrl", "Marks_Entry")
        }));

  const classroomActivity = [
    ...classroomAnnouncementRows
      .filter((row) => rowMatchesAnyTeacherIdentity(row, [teacherIdentity, teacherName, teacherEmail, teacherStaffId]))
      .map((row, index): TeacherClassroomActivity => ({
      id: pickFirst(row, ["announcement_id", "id"], `announcement-${index + 1}`),
      title: pickFirst(row, ["announcement_title", "title"], "Class announcement"),
      detail: pickFirst(row, ["announcement_text", "notes", "message"], ""),
      tag: pickFirst(row, ["class", "section", "subject"], "Announcement"),
      postedAt: pickFirst(row, ["posted_at", "created_at", "updated_at"], ""),
      source: sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
      })),
    ...dashboardClassroomRows
      .filter((row) => rowMatchesAnyTeacherIdentity(row, [teacherIdentity, teacherName, teacherEmail, teacherStaffId]))
      .map((row, index): TeacherClassroomActivity => ({
      id: pickFirst(row, ["activity_id", "id"], `activity-${index + 1}`),
      title: pickFirst(row, ["title", "name", "label"], "Classroom activity"),
      detail: pickFirst(row, ["description", "notes", "status"], ""),
      tag: pickFirst(row, ["class", "section", "subject"], "Activity"),
      postedAt: pickFirst(row, ["created_at", "updated_at", "posted_at"], ""),
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Classroom_Activity")
      }))
  ]
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")))
    .slice(0, 5);

  const assessmentTracking = [
    ...assessmentPlanRows.map((row, index): TeacherAssessmentTrackingItem => ({
      id: pickFirst(row, ["assessment_plan_id", "id"], `assessment-plan-${index + 1}`),
      title: pickFirst(row, ["assessment_type", "assessment_name", "title"], "Assessment"),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      subject: pickFirst(row, ["subject", "paper_title"], ""),
      dueLabel: formatCompactDate(pickFirst(row, ["planned_date", "due_date"], "")) || "Pending",
      completionLabel: pickFirst(row, ["status", "planned_count"], "Open"),
      marksStatusLabel: marksRows.some((marksRow) => pickFirst(marksRow, ["assessment_plan_id"], "") === pickFirst(row, ["assessment_plan_id"], "")) ? "Marks linked" : "Marks pending",
      analysisStatusLabel: resultRows.some((analysisRow) => pickFirst(analysisRow, ["subject"], "") === pickFirst(row, ["subject"], "")) ? "Analysis linked" : "Analysis pending",
      source: sourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan")
    })),
    ...dashboardAssessmentRows.map((row, index): TeacherAssessmentTrackingItem => ({
      id: pickFirst(row, ["assessment_tracking_id", "id"], `tracking-${index + 1}`),
      title: pickFirst(row, ["assessment_type", "title", "name", "label"], "Assessment tracking"),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      subject: pickFirst(row, ["subject"], ""),
      dueLabel: formatCompactDate(pickFirst(row, ["as_of_date", "planned_date", "due_date"], "")) || "Live",
      completionLabel: pickFirst(row, ["status", "planned_count", "completed_count"], "Open"),
      marksStatusLabel: "Live dashboard source",
      analysisStatusLabel: "Live dashboard source",
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Assessment_Tracking")
    }))
  ]
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id))
    .sort((a, b) => a.dueLabel.localeCompare(b.dueLabel))
    .slice(0, 5);

  const announcementRows: TeacherAnnouncementItem[] = classroomAnnouncementRows
    .filter((row) => rowMatchesAnyTeacherIdentity(row, [teacherIdentity, teacherName, teacherEmail, teacherStaffId]))
    .map((row, index) => ({
      id: pickFirst(row, ["announcement_id", "id"], `announcement-${index + 1}`),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      subject: pickFirst(row, ["subject", "subject_name"], ""),
      title: pickFirst(row, ["announcement_title", "title"], "Classroom announcement"),
      text: pickFirst(row, ["announcement_text", "message", "notes"], ""),
      postedAt: pickFirst(row, ["posted_at", "created_at", "updated_at"], ""),
      url: pickFirst(row, ["classroom_url"], ""),
      status: pickFirst(row, ["status"], "Posted"),
      source: sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
    }))
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")))
    .slice(0, 5);

  const invigilationDutyRow = invigilationRows.find((row) =>
    rowMatchesAnyTeacherIdentity(row, [teacherIdentity, teacherName, teacherEmail, teacherStaffId])
  ) || null;

  const renewalRow = (tabs.teacher_cpd_status || []).find((row) =>
    rowMatchesAnyTeacherIdentity(row, [teacherIdentity, teacherName, teacherEmail, teacherStaffId])
  ) || null;

  const kpis: TeacherDashboardKpi[] = [
    {
      id: "active-classes",
      label: "Active classes",
      value: String(teacherClasses.length || teacherTimetableRows.length || 0),
      detail: teacherClasses.length > 0 ? teacherClasses.join(", ") : "No active classes",
      status: teacherClasses.length > 0 ? "healthy" : "warning",
      source: sourceRef(sourceState, "masterDataRegistryUrl", "Teacher_Allocations")
    },
    {
      id: "pending-tasks",
      label: "Pending tasks",
      value: String(dashboardPendingRows.length),
      detail: dashboardPendingRows.length > 0 ? `${dashboardPendingRows[0].title}` : "No open tasks",
      status: dashboardPendingRows.length > 0 ? "attention" : "healthy",
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
    },
    {
      id: "assets-synced",
      label: "Assets synced",
      value: String(artifactRows.length + publishRows.length + dashboardClassroomRows.length),
      detail: `${artifactRows.length} artifacts, ${publishRows.length} publishes`,
      status: artifactRows.length + publishRows.length + dashboardClassroomRows.length > 0 ? "healthy" : "warning",
      source: sourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Artifact_Registry")
    },
    {
      id: "alerts-notices",
      label: "Alerts / notices",
      value: String(dashboardAlertRows.length + classroomAnnouncementRows.length + dashboardLogRows.length),
      detail: dashboardAlertRows.length > 0 ? `${dashboardAlertRows.length} alerts` : "No notices yet",
      status: dashboardAlertRows.length > 0 ? "attention" : "neutral",
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
    }
  ];

  const quickLinks: TeacherDashboardQuickLink[] = [
    { label: "Class announcements", detail: "Open classroom notices and posts.", actionTab: "classroom", actionLabel: "Open", available: true },
    { label: "My repository/files", detail: "Open lesson workspace and artifacts.", actionTab: "textbooks", actionLabel: "Open", available: true },
    { label: "Submit weekly planner", detail: "Go to lesson workspace planner.", actionTab: "lesson-plans", actionLabel: "Open", available: true },
    { label: "Apply for leave", detail: "No leave workflow is connected yet.", actionLabel: "Setup required", available: false }
  ];

  const renewalStatus: TeacherRenewalStatus = renewalRow
    ? {
        configured: true,
        title: "My renewal status",
        message: pickFirst(renewalRow, ["status", "notes"], "Live renewal row"),
        nextReviewDate: pickFirst(renewalRow, ["next_review_date", "last_review_date"], ""),
        statusLabel: pickFirst(renewalRow, ["status"], "Live")
      }
    : {
        configured: false,
        title: "My renewal status",
        message: "Teacher CPD renewal registry is not configured.",
        statusLabel: "Setup required"
      };

  const sourceHealth: TeacherDashboardSourceReference[] = [
    sourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory"),
    sourceRef(sourceState, "masterDataRegistryUrl", "Teacher_Allocations"),
    sourceRef(sourceState, "masterDataRegistryUrl", "Timetable"),
    sourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts"),
    sourceRef(sourceState, "dashboardDataSourceUrl", "Planner_Submissions"),
    sourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Workspace_Registry"),
    sourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan"),
    sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Course_Map"),
    sourceRef(sourceState, "teacherCpdRenewalRegistryUrl", "Teacher_CPD_Status")
  ];

  return {
    header: {
      initials: teacherInitials,
      name: teacherName,
      label: pickFirst(teacherRow, ["role", "designation"], "Teacher"),
      subject: teacherSubjects.join(" • ") || pickFirst(teacherRow, ["subject", "subject_name"], ""),
      classes: teacherClasses,
      academicSession,
      staffId: teacherStaffId,
      source: sourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory")
    },
    kpis,
    timetable: timetableNormalized.map((item) => ({
      ...item,
      highlight: item.highlight === "current" ? "current" : currentPeriod && item.id === currentPeriod.id ? "current" : item.highlight
    })),
    pendingTasks: dashboardPendingRows.slice(0, 5),
    quickLinks,
    classPerformance: classPerformance.slice(0, 5),
    classroomActivity,
    assessmentTracking,
    invigilationDuty: invigilationDutyRow
      ? {
          id: pickFirst(invigilationDutyRow, ["duty_id", "id"], ""),
          eventType: pickFirst(invigilationDutyRow, ["event_type"], ""),
          eventName: pickFirst(invigilationDutyRow, ["event_name"], ""),
          className: pickFirst(invigilationDutyRow, ["class"], ""),
          section: pickFirst(invigilationDutyRow, ["section"], ""),
          subject: pickFirst(invigilationDutyRow, ["subject"], ""),
          dutyDate: pickFirst(invigilationDutyRow, ["duty_date"], ""),
          status: pickFirst(invigilationDutyRow, ["status"], "")
        }
      : null,
    renewalStatus,
    announcements: announcementRows.slice(0, 5),
    sourceHealth,
    setupState
  };
}

function buildCoordinatorDashboard(tabs: SheetTabMap, sourceState: DashboardSourceState, options: LoadDashboardDataOptions): CoordinatorDashboardData {
  const classRows = tabs.classes_sections || [];
  const subjectRows = tabs.subjects || [];
  const staffRows = tabs.staff_directory || [];
  const allocationRows = tabs.teacher_allocations || [];
  const plannerRows = tabs.planner_submissions || [];
  const lessonRows = tabs.lesson_workspace_registry || [];
  const lessonExecRows = tabs.lesson_execution_log || [];
  const classroomRows = tabs.classroom_activity || [];
  const classroomCourseRows = tabs.classroom_course_map || [];
  const classroomAssignmentRows = tabs.classroom_assignment_map || [];
  const classroomSubmissionRows = tabs.classroom_submission_sync || [];
  const classroomSyncLogRows = tabs.classroom_sync_log || [];
  const attendanceRows = tabs.attendance_summary || [];
  const syllabusRows = tabs.syllabus_coverage || [];
  const evidenceGapRows = tabs.evidence_gaps || [];
  const assessmentRows = tabs.assessment_tracking || [];
  const assessmentPlanRows = tabs.assessment_plan || [];
  const marksRows = tabs.marks_entry || [];
  const resultRows = tabs.result_analysis || [];
  const questionRows = tabs.question_paper_registry || [];
  const announcementRows = tabs.classroom_announcement_sync || [];
  const invigilationRows = tabs.invigilation_olympiad_duties || [];
  const cpdRows = tabs.teacher_cpd_status || [];

  const coordinatorIdentity = String(options.teacherIdentity || options.workspaceUrl || options.classroomUrl || "").trim();
  const coordinatorRow = resolveStaffDirectoryRow(staffRows, [coordinatorIdentity], [/coordinator/i, /academic coordinator/i]);

  const coordinatorName = pickFirst(coordinatorRow || {}, ["staff_name", "teacher_name", "name"], "");
  const coordinatorEmail = pickFirst(coordinatorRow || {}, ["email", "teacher_email"], "");
  const coordinatorStaffId = pickFirst(coordinatorRow || {}, ["staff_id", "teacher_staff_id"], "");
  const coordinatorLabel = pickFirst(coordinatorRow || {}, ["role", "designation"], "Academic Coordinator");
  const academicSession = getActiveAcademicYearLabel(tabs);
  const profileSource = sourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory");

  const coordinatorScopeRows = (tabs.coordinator_scope || []).filter((row) =>
    rowMatchesAnyTeacherIdentity(row, [coordinatorIdentity, coordinatorName, coordinatorEmail, coordinatorStaffId])
  );
  const inferredAllocationRows = allocationRows.filter((row) =>
    rowMatchesAnyTeacherIdentity(row, [coordinatorIdentity, coordinatorName, coordinatorEmail, coordinatorStaffId])
  );
  const inferredClassKeys = new Set<string>();
  const inferredClassNames = new Set<string>();
  const inferredSectionNames = new Set<string>();

  const addClassFromText = (value: string) => {
    String(value || "")
      .split(/[,;/|\n]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        inferredClassNames.add(entry);
        inferredClassKeys.add(normalizeKey(entry));
      });
  };

  coordinatorScopeRows.forEach((row) => {
    addClassFromText(pickFirst(row, ["classes"], ""));
    addClassFromText(pickFirst(row, ["scope_name"], ""));
    addClassFromText(pickFirst(row, ["class_from"], ""));
    addClassFromText(pickFirst(row, ["class_to"], ""));
    addClassFromText(pickFirst(row, ["class"], ""));
    addClassFromText(pickFirst(row, ["section", "sections"], ""));
    const section = pickFirst(row, ["section", "sections"], "");
    if (section) inferredSectionNames.add(section);
  });

  inferredAllocationRows.forEach((row) => {
    const className = pickFirst(row, ["class", "class_name", "grade"], "");
    const section = pickFirst(row, ["section"], "");
    const key = `${normalizeKey(className)}__${normalizeKey(section)}`;
    if (className) inferredClassNames.add(className);
    if (className) inferredClassKeys.add(normalizeKey(className));
    if (section) inferredSectionNames.add(section);
    if (className || section) inferredClassKeys.add(key);
  });

  const hasConfiguredScope = coordinatorScopeRows.length > 0 || inferredAllocationRows.length > 0;
  const scopedClassRows = hasConfiguredScope
    ? classRows.filter((row) => {
        const className = pickFirst(row, ["class", "class_name", "grade", "class_section"], "");
        const section = pickFirst(row, ["section"], "");
        const key = `${normalizeKey(className)}__${normalizeKey(section)}`;
        return inferredClassNames.has(className) || inferredClassNames.has(pickFirst(row, ["class_section"], "")) || inferredClassKeys.has(normalizeKey(className)) || inferredClassKeys.has(key);
      })
    : [];
  const scopeClassRows = scopedClassRows.length > 0 ? scopedClassRows : (hasConfiguredScope ? classRows.slice(0, 0) : []);
  const scopeSubjects = Array.from(new Set(
    subjectRows
      .filter((row) => {
        const className = pickFirst(row, ["class", "class_name", "grade"], "");
        return inferredClassNames.size === 0 || inferredClassNames.has(className) || inferredClassKeys.has(normalizeKey(className));
      })
      .map((row) => pickFirst(row, ["subject", "subject_name"], ""))
      .filter(Boolean)
  )).sort();
  const classSectionLabels = scopeClassRows.length > 0
    ? scopeClassRows.map((row) => {
        const className = pickFirst(row, ["class", "class_name", "grade"], "");
        const section = pickFirst(row, ["section"], "");
        return section ? `${className}-${section}` : className;
      }).filter(Boolean)
    : inferredAllocationRows.map((row) => {
        const className = pickFirst(row, ["class", "class_name", "grade"], "");
        const section = pickFirst(row, ["section"], "");
        return section ? `${className}-${section}` : className;
      }).filter(Boolean);
  const coordinatorScopeLabel = classSectionLabels.length > 0
    ? classSectionLabels.join(", ")
    : coordinatorScopeRows.length > 0
      ? coordinatorScopeRows.map((row) => pickFirst(row, ["scope_name", "classes"], "")).filter(Boolean).join(", ")
      : "";
  const configuredScope = coordinatorScopeLabel || "Coordinator scope not configured.";

  const scopeRowSet = new Set(scopeClassRows.map((row) => {
    const className = pickFirst(row, ["class", "class_name", "grade"], "");
    const section = pickFirst(row, ["section"], "");
    return `${normalizeKey(className)}__${normalizeKey(section)}`;
  }));
  const rowInScope = (row: SheetRow): boolean => {
    if (!hasConfiguredScope) return false;
    const className = pickFirst(row, ["class", "class_name", "grade"], "");
    const section = pickFirst(row, ["section"], "");
    const classSectionKey = `${normalizeKey(className)}__${normalizeKey(section)}`;
    const classOnlyKey = normalizeKey(className);
    const subject = pickFirst(row, ["subject", "subject_name"], "");
    return scopeRowSet.has(classSectionKey) || inferredClassKeys.has(classOnlyKey) || inferredClassNames.has(className) || (scopeSubjects.length > 0 && scopeSubjects.includes(subject));
  };
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const isThisWeek = (value: string): boolean => {
    const raw = String(value || "").trim();
    if (!raw) return false;
    const parsed = new Date(raw);
    return !Number.isNaN(parsed.getTime()) && parsed >= weekStart && parsed < weekEnd;
  };

  const plannedRows = plannerRows.filter(rowInScope);
  const classroomWeekRows = classroomRows.filter((row) => rowInScope(row) && isThisWeek(pickFirst(row, ["created_at", "updated_at", "posted_at"], "")));
  const classroomCourseScopeRows = classroomCourseRows.filter(rowInScope);
  const classroomAssignmentScopeRows = classroomAssignmentRows.filter(rowInScope);
  const classroomSubmissionScopeRows = classroomSubmissionRows.filter(rowInScope);
  const classroomSyncScopeRows = classroomSyncLogRows.filter(rowInScope);
  const lessonScopeRows = lessonRows.filter(rowInScope);
  const lessonExecScopeRows = lessonExecRows.filter(rowInScope);
  const assessmentScopeRows = assessmentPlanRows.filter(rowInScope);
  const assessmentTrackingRows = assessmentRows.filter(rowInScope);
  const syllabusScopeRows = syllabusRows.filter(rowInScope);
  const evidenceScopeRows = evidenceGapRows.filter(rowInScope);
  const resultScopeRows = resultRows.filter(rowInScope);
  const marksScopeRows = marksRows.filter(rowInScope);
  const questionScopeRows = questionRows.filter(rowInScope);
  const announcementScopeRows = announcementRows.filter(rowInScope);
  const cpdScopeRows = cpdRows.filter((row) => rowMatchesAnyTeacherIdentity(row, [coordinatorIdentity, coordinatorName, coordinatorEmail, coordinatorStaffId]));
  const invigilationScopeRows = invigilationRows.filter((row) => rowMatchesAnyTeacherIdentity(row, [coordinatorIdentity, coordinatorName, coordinatorEmail, coordinatorStaffId]));

  const setupState: CoordinatorSetupState = coordinatorRow
    ? {
        status: sourceState.mode === "live" ? "live" : sourceState.mode,
        title: hasConfiguredScope ? "Coordinator dashboard connected" : "Coordinator scope not configured",
        message: hasConfiguredScope
          ? "Live rows found for this coordinator context."
          : "Coordinator scope not configured.",
        messages: hasConfiguredScope
          ? (sourceState.setupMessages.length > 0 ? sourceState.setupMessages : ["Live rows are available."])
          : [
              "Add Schooly_Master_Data_Registry / Coordinator_Scope.",
              "Seed Schooly_Master_Data_Registry / Teacher_Allocations for class/section mapping."
            ]
      }
    : {
        status: "setup_required",
        title: "Coordinator dashboard setup required",
        message: "Coordinator could not be resolved from live data.",
        messages: [
          "Create a matching row in Schooly_Master_Data_Registry / Staff_Directory.",
          "Seed Schooly_Master_Data_Registry / Teacher_Allocations and Coordinator_Scope."
        ]
      };

  if (!coordinatorRow && !hasConfiguredScope) {
    return {
      coordinatorProfile: {
        initials: "",
        name: "",
        label: "Academic Coordinator",
        academicSession: academicSession || "",
        scopeLabel: "Coordinator scope not configured.",
        configuredScope: "Coordinator scope not configured.",
        source: profileSource
      },
      kpis: [],
      plannerStatusMatrix: { headers: ["Class / Section", "Planner", "Notebook", "Assessment", "Classroom"], rows: [] },
      syllabusCoverage: [],
      remedialTracking: [],
      classroomActivity: [],
      assessmentTracking: [],
      announcements: [],
      invigilationDuty: { configured: false, title: "Invigilation & olympiads", message: "Invigilation/Olympiad duty registry not configured.", statusLabel: "Setup required" },
      renewalStatus: { configured: false, title: "Renewal status", message: "Teacher CPD renewal registry is not configured.", statusLabel: "Setup required" },
      sourceHealth: [
        profileSource,
        sourceRef(sourceState, "masterDataRegistryUrl", "Academic_Years"),
        sourceRef(sourceState, "masterDataRegistryUrl", "Classes_Sections"),
        sourceRef(sourceState, "masterDataRegistryUrl", "Teacher_Allocations"),
        sourceRef(sourceState, "dashboardDataSourceUrl", "Planner_Submissions"),
        sourceRef(sourceState, "dashboardDataSourceUrl", "Classroom_Activity"),
        sourceRef(sourceState, "dashboardDataSourceUrl", "Assessment_Tracking"),
        sourceRef(sourceState, "dashboardDataSourceUrl", "Evidence_Gaps"),
        sourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan"),
        sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Course_Map")
      ],
      setupState
    };
  }

  const coordinatorInitials = coordinatorName
    ? coordinatorName.split(/\s+/).map((part) => part.trim()[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : coordinatorEmail.slice(0, 2).toUpperCase();
  const scopeSummary = configuredScope;
  const rowLabel = classSectionLabels.length > 0 ? classSectionLabels.join(", ") : "Scope pending";
  const statusRank = (value: string): number => {
    const token = normalizeKey(value);
    if (token.includes("submitted") || token.includes("complete") || token.includes("done")) return 0;
    if (token.includes("partial") || token.includes("review")) return 1;
    if (token.includes("pending")) return 2;
    return 3;
  };

  const plannerMatrixRows: CoordinatorPlannerMatrixRow[] = (scopeClassRows.length > 0 ? scopeClassRows : classRows.slice(0, 0)).map((row, index) => {
    const className = pickFirst(row, ["class", "class_name", "grade"], `Class ${index + 1}`);
    const section = pickFirst(row, ["section"], "");
    const classKey = `${normalizeKey(className)}__${normalizeKey(section)}`;
    const plannerCount = plannedRows.filter((plannerRow) => `${normalizeKey(pickFirst(plannerRow, ["class", "class_name", "grade"], ""))}__${normalizeKey(pickFirst(plannerRow, ["section"], ""))}` === classKey).length;
    const lessonCount = lessonScopeRows.filter((lessonRow) => `${normalizeKey(pickFirst(lessonRow, ["class", "class_name", "grade"], ""))}__${normalizeKey(pickFirst(lessonRow, ["section"], ""))}` === classKey).length;
    const assessmentCount = assessmentTrackingRows.filter((assessmentRow) => `${normalizeKey(pickFirst(assessmentRow, ["class", "class_name", "grade"], ""))}__${normalizeKey(pickFirst(assessmentRow, ["section"], ""))}` === classKey).length;
    const classroomCount = classroomWeekRows.filter((activityRow) => `${normalizeKey(pickFirst(activityRow, ["class", "class_name", "grade"], ""))}__${normalizeKey(pickFirst(activityRow, ["section"], ""))}` === classKey).length;
    const attendanceCount = attendanceRows.filter((attendanceRow) => `${normalizeKey(pickFirst(attendanceRow, ["class", "class_name", "grade"], ""))}__${normalizeKey(pickFirst(attendanceRow, ["section"], ""))}` === classKey).length;
    return {
      className,
      section,
      cells: [
        { label: "Planner", status: plannerCount > 0 ? "submitted" : "missing" },
        { label: "Notebook", status: lessonCount > 0 ? "partial" : "missing" },
        { label: "Assessment", status: assessmentCount > 0 ? "submitted" : "missing" },
        { label: "Classroom", status: classroomCount > 0 ? "partial" : "missing" },
        { label: "Attendance", status: attendanceCount > 0 ? "submitted" : "missing" }
      ].map((cell) => ({
        ...cell,
        status: cell.status as CoordinatorPlannerMatrixCell["status"]
      }))
    };
  });

  const assessmentTracking: CoordinatorAssessmentTracking[] = [...assessmentScopeRows, ...assessmentTrackingRows]
    .filter((row, index, self) => index === self.findIndex((candidate) => pickFirst(candidate, ["assessment_tracking_id", "assessment_plan_id", "id"], "") === pickFirst(row, ["assessment_tracking_id", "assessment_plan_id", "id"], "")))
    .slice(0, 5)
    .map((row, index) => {
      const className = pickFirst(row, ["class", "class_name", "grade"], "");
      const section = pickFirst(row, ["section"], "");
      const subject = pickFirst(row, ["subject", "assessment_name", "title"], "");
      const plannedDate = pickFirst(row, ["planned_date", "due_date", "as_of_date"], "");
      const completedCount = firstNumberFromRow(row, ["completed_count", "completion", "percentage"]) ?? 0;
      return {
        id: pickFirst(row, ["assessment_tracking_id", "assessment_plan_id", "id"], `assessment-${index + 1}`),
        title: pickFirst(row, ["assessment_type", "assessment_name", "title", "name"], "Assessment"),
        className,
        section,
        subject,
        plannedDate,
        completionLabel: questionScopeRows.some((questionRow) => pickFirst(questionRow, ["assessment_plan_id"], "") === pickFirst(row, ["assessment_plan_id"], "")) ? "Paper ready" : pickFirst(row, ["status", "planned_count"], "Open"),
        marksStatusLabel: marksScopeRows.some((marksRow) => pickFirst(marksRow, ["assessment_plan_id"], "") === pickFirst(row, ["assessment_plan_id"], "")) ? "Marks linked" : "Marks pending",
        analysisStatusLabel: resultScopeRows.some((resultRow) => pickFirst(resultRow, ["subject"], "") === subject) ? "Analysis linked" : "Analysis pending",
        completionPercent: completedCount > 100 ? 100 : completedCount,
        source: sourceRef(sourceState, "dashboardDataSourceUrl", "Assessment_Tracking")
      };
    });

  const syllabusCoverage: CoordinatorSyllabusCoverage[] = [...syllabusScopeRows, ...lessonExecScopeRows]
    .filter((row, index, self) => index === self.findIndex((candidate) => `${pickFirst(candidate, ["class", "class_name", "grade"], "")}__${pickFirst(candidate, ["section"], "")}__${pickFirst(candidate, ["subject", "subject_name"], "")}` === `${pickFirst(row, ["class", "class_name", "grade"], "")}__${pickFirst(row, ["section"], "")}__${pickFirst(row, ["subject", "subject_name"], "")}`))
    .slice(0, 5)
    .map((row, index) => ({
      id: pickFirst(row, ["coverage_id", "execution_id", "id"], `coverage-${index + 1}`),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      subject: pickFirst(row, ["subject", "subject_name"], ""),
      termLabel: pickFirst(row, ["term", "term_name", "unit", "chapter_title"], ""),
      completion: firstNumberFromRow(row, ["coverage_percent", "completion", "percentage"]) ?? 0,
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Syllabus_Coverage")
    }));

  const remedialTracking: CoordinatorRemedialStudent[] = [...evidenceScopeRows, ...resultScopeRows, ...assessmentTrackingRows]
    .map((row, index) => ({
      id: pickFirst(row, ["gap_id", "analysis_id", "assessment_tracking_id", "id"], `remedial-${index + 1}`),
      name: pickFirst(row, ["student_name", "name", "learner_name"], "Student"),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      riskArea: pickFirst(row, ["risk_area", "weak_chapters", "remediation_required", "notes"], "Live risk row"),
      status: pickFirst(row, ["status", "severity", "priority"], "Open"),
      owner: pickFirst(row, ["assigned_teacher", "owner", "teacher_name"], ""),
      lastUpdated: pickFirst(row, ["updated_at", "created_at", "review_date"], ""),
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Evidence_Gaps")
    }))
    .filter((item) => Boolean(item.name || item.className || item.riskArea))
    .slice(0, 5);

  const classroomActivity: CoordinatorClassroomActivity[] = [
    ...classroomWeekRows,
    ...classroomCourseScopeRows,
    ...classroomAssignmentScopeRows,
    ...classroomSubmissionScopeRows,
    ...classroomSyncScopeRows
  ]
    .map((row, index) => ({
      id: pickFirst(row, ["activity_id", "assignment_map_id", "submission_sync_id", "sync_log_id", "course_map_id", "id"], `activity-${index + 1}`),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      title: pickFirst(row, ["title", "assignment_title", "classroom_course_name", "sync_type"], "Classroom activity"),
      detail: pickFirst(row, ["description", "notes", "status", "sync_status"], ""),
      metricLabel: pickFirst(row, ["metric", "status", "submission_status"], "Live"),
      metricValue: pickFirst(row, ["value", "records_processed", "marks"], ""),
      postedAt: pickFirst(row, ["created_at", "updated_at", "posted_at", "completed_at", "sync_time"], ""),
      source: sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Activity")
    }))
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id))
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")))
    .slice(0, 5);

  const announcements: CoordinatorAnnouncement[] = announcementScopeRows
    .map((row, index) => ({
      id: pickFirst(row, ["announcement_id", "id"], `announcement-${index + 1}`),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      subject: pickFirst(row, ["subject", "subject_name"], ""),
      title: pickFirst(row, ["announcement_title", "title"], "Classroom announcement"),
      text: pickFirst(row, ["announcement_text", "message", "notes"], ""),
      postedAt: pickFirst(row, ["posted_at", "created_at", "updated_at"], ""),
      status: pickFirst(row, ["status"], "Posted"),
      url: pickFirst(row, ["classroom_url"], ""),
      source: sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
    }))
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")))
    .slice(0, 5);

  const kpis: CoordinatorKpiMetric[] = [
    {
      id: "pending-planners",
      label: "Pending sheets / planners",
      value: String(plannedRows.filter((row) => /pending|open|draft/i.test(pickFirst(row, ["status", "review_status", "publish_status"], ""))).length),
      detail: plannedRows.length > 0 ? `${plannedRows.length} planner rows in scope` : "No planner submissions found for this coordinator scope.",
      status: plannedRows.length > 0 ? "attention" : "warning",
      source: sourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Workspace_Registry")
    },
    {
      id: "classroom-posts",
      label: "Classroom posts",
      value: String(classroomWeekRows.length),
      detail: classroomWeekRows.length > 0 ? `${classroomWeekRows.length} live activity rows this week` : "No Classroom activity this week.",
      status: classroomWeekRows.length > 0 ? "healthy" : "warning",
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Classroom_Activity")
    },
    {
      id: "assessments-due",
      label: "Assessments due",
      value: String(assessmentScopeRows.filter((row) => /due|open|pending|scheduled/i.test(pickFirst(row, ["status", "completion_status"], "")) || isThisWeek(pickFirst(row, ["planned_date", "due_date"], ""))).length),
      detail: assessmentScopeRows.length > 0 ? `${assessmentScopeRows.length} assessment rows in scope` : "No assessment tracking rows found.",
      status: assessmentScopeRows.length > 0 ? "attention" : "warning",
      source: sourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan")
    },
    {
      id: "remedial-students",
      label: "Remedial students",
      value: String(remedialTracking.length),
      detail: remedialTracking.length > 0 ? `${remedialTracking[0].name}` : "No remedial tracking rows found.",
      status: remedialTracking.length > 0 ? "attention" : "neutral",
      source: sourceRef(sourceState, "dashboardDataSourceUrl", "Evidence_Gaps")
    }
  ];

  const invigilationDuty: CoordinatorDutyStatus = invigilationScopeRows.length > 0
    ? {
        configured: true,
        title: "Invigilation & olympiads",
        message: `${invigilationScopeRows.length} live duty row${invigilationScopeRows.length === 1 ? "" : "s"} found.`,
        statusLabel: "Live"
      }
    : {
        configured: false,
        title: "Invigilation & olympiads",
        message: "Invigilation/Olympiad duty registry not configured.",
        statusLabel: "Setup required"
      };

  const renewalStatus: CoordinatorRenewalStatus = cpdScopeRows.length > 0
    ? {
        configured: true,
        title: "Renewal / compliance status",
        message: pickFirst(cpdScopeRows[0], ["status", "notes"], "Live CPD row"),
        nextReviewDate: pickFirst(cpdScopeRows[0], ["next_review_date"], ""),
        statusLabel: pickFirst(cpdScopeRows[0], ["status"], "Live")
      }
    : {
        configured: false,
        title: "Renewal / compliance status",
        message: "Teacher CPD renewal registry is not configured.",
        statusLabel: "Setup required"
      };

  const sourceHealth: CoordinatorDashboardSourceReference[] = [
    sourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory"),
    sourceRef(sourceState, "masterDataRegistryUrl", "Academic_Years"),
    sourceRef(sourceState, "masterDataRegistryUrl", "Classes_Sections"),
    sourceRef(sourceState, "masterDataRegistryUrl", "Teacher_Allocations"),
    sourceRef(sourceState, "masterDataRegistryUrl", "Coordinator_Scope"),
    sourceRef(sourceState, "dashboardDataSourceUrl", "Planner_Submissions"),
    sourceRef(sourceState, "dashboardDataSourceUrl", "Classroom_Activity"),
    sourceRef(sourceState, "dashboardDataSourceUrl", "Assessment_Tracking"),
    sourceRef(sourceState, "dashboardDataSourceUrl", "Evidence_Gaps"),
    sourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Workspace_Registry"),
    sourceRef(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Execution_Log"),
    sourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan"),
    sourceRef(sourceState, "assessmentResultRegistryUrl", "Marks_Entry"),
    sourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Analysis"),
    sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Course_Map"),
    sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Submission_Sync"),
    sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Sync_Log"),
    sourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync"),
    sourceRef(sourceState, "teacherCpdRenewalRegistryUrl", "Teacher_CPD_Status")
  ];

  return {
    coordinatorProfile: {
      initials: coordinatorInitials,
      name: coordinatorName,
      label: coordinatorLabel,
      academicSession,
      scopeLabel: scopeSummary,
      configuredScope,
      source: profileSource
    },
    kpis,
    plannerStatusMatrix: {
      headers: ["Class / Section", "Planner", "Notebook", "Assessment", "Classroom", "Attendance"],
      rows: plannerMatrixRows
    },
    syllabusCoverage,
    remedialTracking,
    classroomActivity,
    assessmentTracking,
    announcements,
    invigilationDuty,
    renewalStatus,
    sourceHealth,
    setupState
  };
}

function buildExamsDashboard(tabs: SheetTabMap, sourceState: DashboardSourceState, options: LoadDashboardDataOptions): ExaminationDashboardData {
  const staffRows = tabs.staff_directory || [];
  const schoolProfileRows = tabs.school_profile || [];
  const academicYearRows = tabs.academic_years || [];
  const classRows = tabs.classes_sections || [];
  const subjectRows = tabs.subjects || [];
  const studentEnrollmentRows = tabs.student_enrollment || [];
  const dashboardMetricRows = tabs.dashboard_metrics || [];
  const assessmentPlanRows = tabs.assessment_plan || [];
  const examCalendarRows = tabs.exam_calendar || [];
  const questionPaperRows = tabs.question_paper_registry || [];
  const marksRows = tabs.marks_entry || [];
  const resultRows = tabs.result_analysis || [];
  const resultProcessingRows = tabs.result_processing || [];
  const classroomAnnouncementRows = tabs.classroom_announcement_sync || [];
  const classroomActivityRows = tabs.classroom_activity || [];

  const examIdentity = String(options.teacherIdentity || options.workspaceUrl || options.classroomUrl || "").trim();
  const examRow = resolveStaffDirectoryRow(staffRows, [examIdentity], [/examination chair/i, /exam chair/i, /assessment chair/i, /boards cell/i]);

  const schoolProfileRow = schoolProfileRows.find((row) => /active|live|current/i.test(pickFirst(row, ["status"], ""))) || schoolProfileRows[0] || {};
  const schoolId = pickFirst(schoolProfileRow, ["school_id"], "");
  const boardValues = Array.from(new Set([
    pickFirst(schoolProfileRow, ["board"], ""),
    ...subjectRows.map((row) => pickFirst(row, ["board"], ""))
  ].filter(Boolean)));
  const boardLabel = boardValues.length > 0 ? boardValues.join(" & ") : "Boards";
  const academicSession = getActiveAcademicYearLabel(tabs);
  const classNumbers = classRows
    .map((row) => toNumber(pickFirst(row, ["class_number"], "")) ?? toNumber(String(pickFirst(row, ["class"], "")).replace(/[^\d]/g, "")) ?? null)
    .filter((value): value is number => value !== null);
  const minClass = classNumbers.length > 0 ? Math.min(...classNumbers) : null;
  const maxClass = classNumbers.length > 0 ? Math.max(...classNumbers) : null;
  const gradeScope = minClass !== null && maxClass !== null ? `Grade ${minClass}${minClass === maxClass ? "" : `-${maxClass}`}` : "Grade Audit Authority";
  const boardScope = boardValues.length > 0 ? `${boardLabel} Boards Cell` : "Boards Cell";
  const roleLabel = examRow ? pickFirst(examRow, ["role", "designation"], "Examination Chair") : "Examination Chair";
  const examSource: ExaminationDashboardSourceReference = examSourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan");

  const schoolYearMatch = (row: SheetRow): boolean => {
    const rowSchoolId = pickFirst(row, ["school_id"], "");
    const rowAcademicYear = pickFirst(row, ["academic_year", "term", "session"], "");
    const schoolMatch = !schoolId || !rowSchoolId || rowSchoolId === schoolId;
    const yearMatch = !academicSession || !rowAcademicYear || rowAcademicYear === academicSession;
    return schoolMatch && yearMatch;
  };

  const classSubjectKey = (row: SheetRow): string => {
    const className = pickFirst(row, ["class", "class_name", "grade"], "");
    const section = pickFirst(row, ["section"], "");
    const subject = pickFirst(row, ["subject", "subject_name"], "");
    return `${normalizeKey(className)}__${normalizeKey(section)}__${normalizeKey(subject)}`;
  };

  const candidateRows = studentEnrollmentRows.filter(schoolYearMatch);
  const assessmentRows = [...assessmentPlanRows, ...examCalendarRows].filter(schoolYearMatch);
  const verificationSourceRows = [...questionPaperRows, ...assessmentPlanRows].filter(schoolYearMatch);
  const resultSourceRows = [...resultRows, ...resultProcessingRows, ...marksRows].filter(schoolYearMatch);
  const announcementSourceRows = [...classroomAnnouncementRows, ...classroomActivityRows].filter(schoolYearMatch);

  const uniqueStatsSourceRows = [...assessmentRows, ...resultSourceRows, ...questionPaperRows]
    .filter((row, index, self) => index === self.findIndex((candidate) => classSubjectKey(candidate) === classSubjectKey(row)))
    .slice(0, 4);

  const subjectStats: ExaminationBoardSubjectStat[] = uniqueStatsSourceRows.map((row, index) => {
    const className = pickFirst(row, ["class", "class_name", "grade"], "");
    const section = pickFirst(row, ["section"], "");
    const subject = pickFirst(row, ["subject", "subject_name"], pickFirst(subjectRows[index] || {}, ["subject", "subject_name"], "Subject"));
    const board = pickFirst(row, ["board"], boardValues[0] || "Board");
    const relatedQuestionRows = questionPaperRows.filter((candidate) => schoolYearMatch(candidate) && classSubjectKey(candidate) === classSubjectKey(row));
    const relatedResultRows = [...resultRows, ...resultProcessingRows, ...marksRows].filter((candidate) => schoolYearMatch(candidate) && classSubjectKey(candidate) === classSubjectKey(row));
    const registeredCount = candidateRows.filter((candidate) => {
      const candidateClass = pickFirst(candidate, ["class", "class_name", "grade"], "");
      const candidateSection = pickFirst(candidate, ["section"], "");
      return (!className || normalizeKey(candidateClass) === normalizeKey(className)) && (!section || normalizeKey(candidateSection) === normalizeKey(section));
    }).length || firstNumberFromRow(row, ["registered_count", "candidate_count", "student_count"]) || 0;
    const approvedPaperCount = relatedQuestionRows.filter((candidate) => /approved|verified|locked|final/i.test(pickFirst(candidate, ["review_status", "blueprint_status", "status"], ""))).length;
    const syllabusCompliance = firstNumberFromRow(row, ["syllabus_percent", "coverage_percent", "completion", "percentage", "score"])
      ?? (relatedQuestionRows.length > 0 ? Math.round((approvedPaperCount / relatedQuestionRows.length) * 100) : null)
      ?? averageFromRows(dashboardMetricRows.filter((metric) => {
        const metricClass = pickFirst(metric, ["class", "class_name", "grade"], "");
        const metricSubject = pickFirst(metric, ["subject", "subject_name", "kpi_name", "metric_name", "name"], "");
        return (!className || normalizeKey(metricClass) === normalizeKey(className)) && (!subject || normalizeKey(metricSubject).includes(normalizeKey(subject)));
      }), ["coverage_percent", "completion", "percentage", "score"])
      ?? 0;
    const mockAverage = firstNumberFromRow(row, ["mock_average", "projected_score", "percentage", "score"])
      ?? averageFromRows(relatedResultRows, ["percentage", "score", "marks_obtained", "total_marks"])
      ?? 0;
    return {
      id: pickFirst(row, ["assessment_plan_id", "exam_id", "question_paper_id", "result_id", "marks_entry_id", "id"], `exam-stat-${index + 1}`),
      board,
      subject,
      registeredCount,
      syllabusCompliance: Math.max(0, Math.min(100, Math.round(syllabusCompliance))),
      mockAverage: Math.max(0, Math.min(100, Math.round(mockAverage))),
      source: examSourceRef(sourceState, "assessmentResultRegistryUrl", pickFirst(row, ["question_paper_id"], "") ? "Question_Paper_Registry" : pickFirst(row, ["exam_id"], "") ? "Exam_Calendar" : "Assessment_Plan")
    };
  });

  const candidateCount = candidateRows.length || firstNumberFromRow(dashboardMetricRows.find((row) => /candidate|board/i.test(pickFirst(row, ["dashboard_role", "role", "kpi_name", "metric_name", "name", "title"], ""))) || {}, ["value", "count", "total"]) || 0;
  const approvedAssessmentCount = assessmentRows.filter((row) => /approved|verified|audited|locked|ready/i.test(pickFirst(row, ["status", "review_status", "blueprint_status"], ""))).length;
  const syllabusCompliancePercent = assessmentRows.length > 0
    ? Math.round((approvedAssessmentCount / assessmentRows.length) * 100)
    : averageFromRows(dashboardMetricRows.filter((row) => /syllabus|coverage|audit/i.test(pickFirst(row, ["dashboard_role", "role", "kpi_name", "metric_name", "name", "title"], ""))), ["coverage_percent", "completion", "percentage", "score"]);
  const projectedScoreAverage = averageFromRows(resultSourceRows, ["percentage", "score", "marks_obtained", "total_marks"]);
  const mockAssessmentsCount = verificationSourceRows.length || assessmentRows.length;

  const verificationItems: ExaminationVerificationItem[] = verificationSourceRows
    .map((row, index) => {
      const title = pickFirst(row, ["paper_title", "assessment_type", "title", "name"], `Draft exam ${index + 1}`);
      const className = pickFirst(row, ["class", "class_name", "grade"], "");
      const subject = pickFirst(row, ["subject", "subject_name"], "");
      const status = pickFirst(row, ["review_status", "blueprint_status", "status"], "");
      const detailBits = [
        className,
        subject,
        pickFirst(row, ["teacher_name", "submitted_by", "created_by"], ""),
        pickFirst(row, ["notes", "description", "summary"], "")
      ].filter(Boolean);
      return {
        id: pickFirst(row, ["question_paper_id", "assessment_plan_id", "exam_id", "id"], `verification-${index + 1}`),
        title,
        detail: detailBits.join(" | ") || "Live row",
        statusLabel: status || "Review",
        actionLabel: /approved|verified|locked|final/i.test(status) ? "Approved" : "Verify & Accept",
        actionTab: /approved|verified|locked|final/i.test(status) ? undefined : "registry-detail",
        source: examSourceRef(sourceState, "assessmentResultRegistryUrl", pickFirst(row, ["question_paper_id"], "") ? "Question_Paper_Registry" : pickFirst(row, ["exam_id"], "") ? "Exam_Calendar" : "Assessment_Plan")
      };
    })
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id || candidate.title === item.title))
    .sort((a, b) => Number(/approved|verified|locked|final/i.test(a.statusLabel)) - Number(/approved|verified|locked|final/i.test(b.statusLabel)))
    .slice(0, 3);

  const announcements: ExaminationAnnouncementItem[] = announcementSourceRows
    .map((row, index) => ({
      id: pickFirst(row, ["announcement_id", "activity_id", "id"], `announcement-${index + 1}`),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      subject: pickFirst(row, ["subject", "subject_name"], ""),
      title: pickFirst(row, ["announcement_title", "title", "post_title"], "Classroom announcement"),
      text: pickFirst(row, ["announcement_text", "message", "notes", "description"], ""),
      postedAt: pickFirst(row, ["posted_at", "created_at", "updated_at", "completed_at"], ""),
      status: pickFirst(row, ["status", "sync_status"], "Posted"),
      teacherName: pickFirst(row, ["teacher_name", "staff_name", "owner"], ""),
      url: pickFirst(row, ["classroom_url"], ""),
      source: examSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
    }))
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id || candidate.title === item.title))
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")))
    .slice(0, 5);

  const hasLiveExamRows = candidateCount > 0 || subjectStats.length > 0 || verificationItems.length > 0 || announcements.length > 0 || dashboardMetricRows.length > 0 || resultSourceRows.length > 0;
  const setupState: ExaminationDashboardSetupState = hasLiveExamRows && sourceState.mode === "live"
    ? {
        status: "live",
        title: "Examination chair dashboard connected",
        message: "Live rows are available for the examination chair view.",
        messages: sourceState.setupMessages.length > 0 ? sourceState.setupMessages : ["Live rows are available."]
      }
    : {
        status: "setup_required",
        title: "Examination chair dashboard setup required",
        message: examRow
          ? "One or more examination registries are still missing."
          : "Examination chair could not be resolved from live data.",
        messages: examRow
          ? [
              "Seed Assessment_Plan, Exam_Calendar, Question_Paper_Registry, Marks_Entry, and Result_Analysis.",
              "Add Classroom_Announcement_Sync rows for recent notices."
            ]
          : [
              "Create a matching row in Schooly_Master_Data_Registry / Staff_Directory.",
              "Seed Assessment/Result Registry rows for board candidates and exam reviews."
            ]
      };

  const sourceHealth: ExaminationDashboardSourceReference[] = [
    examSourceRef(sourceState, "masterDataRegistryUrl", "School_Profile"),
    examSourceRef(sourceState, "masterDataRegistryUrl", "Academic_Years"),
    examSourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory"),
    examSourceRef(sourceState, "masterDataRegistryUrl", "Classes_Sections"),
    examSourceRef(sourceState, "masterDataRegistryUrl", "Student_Enrollment"),
    examSourceRef(sourceState, "masterDataRegistryUrl", "Subjects"),
    examSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Metrics"),
    examSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts"),
    examSourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan"),
    examSourceRef(sourceState, "assessmentResultRegistryUrl", "Exam_Calendar"),
    examSourceRef(sourceState, "assessmentResultRegistryUrl", "Question_Paper_Registry"),
    examSourceRef(sourceState, "assessmentResultRegistryUrl", "Marks_Entry"),
    examSourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Analysis"),
    examSourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Processing"),
    examSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync"),
    examSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Activity")
  ];

  const examName = pickFirst(examRow || {}, ["staff_name", "teacher_name", "name"], "");
  const examInitials = examName
    ? examName.split(/\s+/).map((part) => part.trim()[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : "EC";

  return {
    header: {
      initials: examInitials,
      name: examName,
      label: roleLabel,
      boardScope,
      gradeScope,
      academicSession,
      source: examSource
    },
    kpis: [
      {
        id: "board-candidates",
        label: "Board candidates",
        value: `${candidateCount}`,
        detail: candidateCount > 0 ? `${boardLabel} registrations checked` : "No candidate roster rows found.",
        status: candidateCount > 0 ? "healthy" : "warning",
        source: examSourceRef(sourceState, "masterDataRegistryUrl", "Student_Enrollment")
      },
      {
        id: "syllabus-compliance",
        label: "Syllabus compliance",
        value: `${Math.max(0, Math.min(100, Math.round(syllabusCompliancePercent || 0)))}% Audited`,
        detail: assessmentRows.length > 0 ? `${approvedAssessmentCount} active branches aligned` : "No syllabus audit rows found.",
        status: statusFromPercent(syllabusCompliancePercent),
        source: examSourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan")
      },
      {
        id: "projected-score",
        label: "Projected score avg",
        value: projectedScoreAverage > 0 ? `+${Math.round(projectedScoreAverage)}% projected` : "--",
        detail: projectedScoreAverage > 0 ? "Improvement over previous board session" : "No result rows found.",
        status: statusFromPercent(projectedScoreAverage),
        source: examSourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Analysis")
      },
      {
        id: "mock-assessments",
        label: "Mock assessments",
        value: `${mockAssessmentsCount} Preps`,
        detail: mockAssessmentsCount > 0 ? "Mock evaluations concluded" : "No mock paper rows found.",
        status: mockAssessmentsCount > 0 ? "neutral" : "warning",
        source: examSourceRef(sourceState, "assessmentResultRegistryUrl", "Question_Paper_Registry")
      }
    ],
    boardSubjectStats: subjectStats,
    verificationItems,
    announcements,
    sourceHealth,
    setupState
  };
}

function buildParentDashboard(tabs: SheetTabMap, sourceState: DashboardSourceState, options: LoadDashboardDataOptions): ParentDashboardData {
  const staffRows = tabs.staff_directory || [];
  const schoolProfileRows = tabs.school_profile || [];
  const academicYearRows = tabs.academic_years || [];
  const attendanceRows = tabs.attendance_summary || [];
  const dashboardMetricRows = tabs.dashboard_metrics || [];
  const dashboardAlertRows = tabs.dashboard_alerts || [];
  const classroomAnnouncementRows = tabs.classroom_announcement_sync || [];
  const classroomActivityRows = tabs.classroom_activity || [];
  const classroomCourseRows = tabs.classroom_course_map || [];
  const classroomSubmissionRows = tabs.classroom_submission_sync || [];
  const classroomSyncLogRows = tabs.classroom_sync_log || [];
  const studentEnrollmentRows = tabs.student_enrollment || [];

  const parentIdentity = String(options.teacherIdentity || options.workspaceUrl || options.classroomUrl || "").trim();
  const parentRow = resolveStaffDirectoryRow(staffRows, [parentIdentity], [/parent representative/i, /liaison officer/i, /parent liaison/i]);

  const schoolProfileRow = schoolProfileRows.find((row) => /active|live|current/i.test(pickFirst(row, ["status"], ""))) || schoolProfileRows[0] || {};
  const academicSession = getActiveAcademicYearLabel(tabs);
  const schoolName = pickFirst(schoolProfileRow, ["school_name", "institution_name", "name"], "");

  const parentName = pickFirst(parentRow || {}, ["staff_name", "teacher_name", "name"], "");
  const committeeLabel = pickFirst(parentRow || {}, ["role", "designation"], "Parent Advisory Committee");
  const liaisonLabel = pickFirst(parentRow || {}, ["title", "position", "notes"], "Liaison Officer");
  const parentSource = parentSourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory");
  const schoolId = pickFirst(schoolProfileRow, ["school_id"], "");

  const liveScope = (row: SheetRow): boolean => {
    const rowSchoolId = pickFirst(row, ["school_id"], "");
    const rowAcademicYear = pickFirst(row, ["academic_year", "term_name", "session"], "");
    const schoolMatch = !schoolId || !rowSchoolId || rowSchoolId === schoolId;
    const yearMatch = !academicSession || !rowAcademicYear || rowAcademicYear === academicSession;
    return schoolMatch && yearMatch;
  };

  const attendanceScopeRows = attendanceRows.filter(liveScope);
  const metricScopeRows = dashboardMetricRows.filter(liveScope);
  const alertScopeRows = dashboardAlertRows.filter(liveScope);
  const noticeScopeRows = [...classroomAnnouncementRows, ...classroomActivityRows].filter(liveScope);
  const transportScopeRows = [...classroomSyncLogRows, ...classroomCourseRows, ...classroomSubmissionRows].filter(liveScope);

  const engagementValues = attendanceScopeRows
    .map((row) => firstNumberFromRow(row, ["attendance_percent", "attendance_rate", "percentage", "score"]))
    .filter((value): value is number => value !== null);
  const engagementAverage = engagementValues.length > 0 ? Math.round(engagementValues.reduce((sum, value) => sum + value, 0) / engagementValues.length) : null;
  const announcementCount = noticeScopeRows.length || metricScopeRows.filter((row) => /announcement|notice/i.test(pickFirst(row, ["dashboard_role", "role", "kpi_name", "metric_name", "name", "title"], ""))).length;
  const advisoryTicketRows = alertScopeRows.filter((row) => /parent|transport|safety|advisory|notice|support/i.test([pickFirst(row, ["alert_type", "severity", "owner_role"], ""), pickFirst(row, ["message", "description", "notes"], "")].join(" ")));
  const transportVerifiedCount = transportScopeRows.filter((row) => /verified|synced|active|ok|complete|done/i.test(pickFirst(row, ["status", "sync_status", "submission_status"], ""))).length;
  const safetyRows = alertScopeRows.filter((row) => /safety|health|transport|bus|security|campus|hygiene/i.test([pickFirst(row, ["alert_type", "severity", "owner_role"], ""), pickFirst(row, ["message", "description", "notes"], "")].join(" ")));
  const safetyScore = safetyRows.length > 0 ? Math.max(60, 100 - safetyRows.filter((row) => /critical|high/i.test(pickFirst(row, ["severity", "priority"], ""))).length * 10) : 98;

  const kpis: ParentDashboardKpi[] = [
    {
      id: "engagement",
      label: "Pupil engagement avg",
      value: engagementAverage !== null ? `${engagementAverage}%` : "--",
      detail: schoolName ? `High overall attendance in ${schoolName}` : "Live attendance rows not found.",
      status: statusFromPercent(engagementAverage),
      source: parentSourceRef(sourceState, "dashboardDataSourceUrl", "Attendance_Summary")
    },
    {
      id: "announcements",
      label: "Announcements",
      value: `${announcementCount} Active Notices`,
      detail: "Broadcasted safety to parents portal.",
      status: announcementCount > 0 ? "healthy" : "warning",
      source: parentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
    },
    {
      id: "advisory",
      label: "Advisory interactions",
      value: `${advisoryTicketRows.length} Open Ticket${advisoryTicketRows.length === 1 ? "" : "s"}`,
      detail: "Responsive advisory council feedback loop.",
      status: advisoryTicketRows.length > 0 ? "attention" : "neutral",
      source: parentSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
    },
    {
      id: "safety",
      label: "Campus safety score",
      value: `${Math.max(0, Math.min(100, safetyScore))}% Rating`,
      detail: transportVerifiedCount > 0 ? "Emergency and hygiene checklist verified." : "Safety checklist not fully connected yet.",
      status: statusFromPercent(safetyScore),
      source: parentSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
    }
  ];

  const notices: ParentDashboardNotice[] = noticeScopeRows
    .map((row, index) => ({
      id: pickFirst(row, ["announcement_id", "activity_id", "id"], `notice-${index + 1}`),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      title: pickFirst(row, ["announcement_title", "title", "post_title"], "Parent notice"),
      text: pickFirst(row, ["announcement_text", "message", "notes", "description"], "Live row"),
      postedAt: pickFirst(row, ["posted_at", "created_at", "updated_at", "completed_at"], ""),
      source: parentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
    }))
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id || candidate.title === item.title))
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")))
    .slice(0, 5);

  const advisoryTickets: ParentAdvisoryTicket[] = advisoryTicketRows
    .map((row, index) => {
      const title = pickFirst(row, ["message", "title", "alert", "description"], `Advisory ticket ${index + 1}`);
      const detail = pickFirst(row, ["notes", "description", "message"], "Live parent advisory row");
      const status = pickFirst(row, ["status", "severity", "priority"], "Open");
      return {
        id: pickFirst(row, ["alert_id", "id"], `ticket-${index + 1}`),
        title,
        detail,
        statusLabel: status,
        dueLabel: pickFirst(row, ["due_date", "created_at", "updated_at"], "Today"),
        actionLabel: /resolved|closed|done|complete/i.test(status) ? "Resolved" : "Submit Ticket",
        actionTab: /resolved|closed|done|complete/i.test(status) ? undefined : "registers",
        source: parentSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
      };
    })
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id || candidate.title === item.title))
    .slice(0, 4);

  const safetyItems: ParentSafetyItem[] = [
    {
      id: "bus",
      label: "Bus fleet security monitor",
      detail: transportVerifiedCount > 0 ? `${transportVerifiedCount} routes verified` : "Bus route records not configured.",
      statusLabel: transportVerifiedCount > 0 ? "Routes verified" : "Setup required",
      source: parentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Sync_Log")
    },
    {
      id: "fire",
      label: "Annual fire & safety audit",
      detail: safetyRows.length > 0 ? "Emergency and hygiene standards tracked." : "No live safety audit rows found.",
      statusLabel: safetyRows.length > 0 ? "Stage 1 clear" : "Setup required",
      source: parentSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
    }
  ];

  const setupState: ParentDashboardSetupState = parentRow
    ? {
        status: sourceState.mode === "live" ? "live" : sourceState.mode,
        title: "Parent dashboard connected",
        message: "Live rows are available for the parent liaison view.",
        messages: sourceState.setupMessages.length > 0 ? sourceState.setupMessages : ["Live rows are available."]
      }
    : {
        status: "setup_required",
        title: "Parent dashboard setup required",
        message: "Parent liaison could not be resolved from live data.",
        messages: [
          "Create a matching row in Schooly_Master_Data_Registry / Staff_Directory.",
          "Seed Dashboard_Alerts, Attendance_Summary, and Classroom_Announcement_Sync rows."
        ]
      };

  const sourceHealth: ParentDashboardSourceReference[] = [
    parentSourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory"),
    parentSourceRef(sourceState, "masterDataRegistryUrl", "School_Profile"),
    parentSourceRef(sourceState, "masterDataRegistryUrl", "Academic_Years"),
    parentSourceRef(sourceState, "dashboardDataSourceUrl", "Attendance_Summary"),
    parentSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts"),
    parentSourceRef(sourceState, "dashboardDataSourceUrl", "Classroom_Activity"),
    parentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync"),
    parentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Sync_Log"),
    parentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Course_Map"),
    parentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Submission_Sync")
  ];

  return {
    header: {
      initials: parentName ? parentName.split(/\s+/).map((part) => part.trim()[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : "PT",
      name: parentName || "Parents Liaison",
      label: "Parent Representative",
      committeeLabel: committeeLabel || "Parent Advisory Committee",
      liaisonLabel: liaisonLabel || "Liaison Officer",
      academicSession,
      source: parentSource
    },
    kpis,
    notices,
    safetyItems,
    advisoryTickets,
    sourceHealth,
    setupState
  };
}

function buildManagerDashboard(tabs: SheetTabMap, sourceState: DashboardSourceState, options: LoadDashboardDataOptions): ManagerDashboardData {
  const staffRows = tabs.staff_directory || [];
  const schoolProfileRows = tabs.school_profile || [];
  const academicYearRows = tabs.academic_years || [];
  const dashboardMetricRows = tabs.dashboard_metrics || [];
  const plannerRows = tabs.planner_submissions || [];
  const classroomRows = tabs.classroom_activity || [];
  const assessmentTrackingRows = tabs.assessment_tracking || [];
  const evidenceGapRows = tabs.evidence_gaps || [];
  const dashboardAlertRows = tabs.dashboard_alerts || [];
  const qaChecklistRows = tabs.qa_checklist_config || [];
  const qaReviewRows = tabs.qa_review_log || [];
  const sqaaEvidenceRows = tabs.sqaa_evidence_map || [];
  const complianceReportRows = tabs.compliance_report_registry || [];
  const resultRows = tabs.result_analysis || [];
  const marksRows = tabs.marks_entry || [];
  const assessmentPlanRows = tabs.assessment_plan || [];
  const classroomCourseRows = tabs.classroom_course_map || [];
  const classroomAssignmentRows = tabs.classroom_assignment_map || [];
  const classroomSubmissionRows = tabs.classroom_submission_sync || [];
  const classroomSyncLogRows = tabs.classroom_sync_log || [];
  const strategicBudgetRows = tabs.budget_utilization || [];
  const strategicMilestoneRows = tabs.strategic_milestones || [];
  const operationalChecklistRows = tabs.operational_checklist || [];
  const classroomAnnouncementRows = tabs.classroom_announcement_sync || [];

  const managerIdentity = String(options.teacherIdentity || options.workspaceUrl || options.classroomUrl || "").trim();
  const managerRow = resolveStaffDirectoryRow(staffRows, [managerIdentity], [/school manager/i, /operations manager/i, /manager/i]);

  const schoolProfileRow = schoolProfileRows.find((row) => /active|live|current/i.test(pickFirst(row, ["status"], ""))) || schoolProfileRows[0] || {};

  const managerName = pickFirst(managerRow || {}, ["staff_name", "teacher_name", "name"], "");
  const schoolName = pickFirst(schoolProfileRow || {}, ["school_name", "institution_name", "name"], "");
  const schoolId = pickFirst(schoolProfileRow || {}, ["school_id"], "");
  const academicSession = getActiveAcademicYearLabel(tabs);
  const board = pickFirst(schoolProfileRow || {}, ["board"], "");
  const medium = pickFirst(schoolProfileRow || {}, ["medium"], "");
  const oversightLabel = schoolName ? `${schoolName} oversight` : "Operational oversight";
  const performanceLabel = [board, medium].filter(Boolean).join(" / ") || (academicSession ? `Academic year ${academicSession}` : "Live performance review");

  const managerScope = (row: SheetRow): boolean => {
    const rowSchoolId = pickFirst(row, ["school_id"], "");
    const rowAcademicYear = pickFirst(row, ["academic_year", "term_name", "session"], "");
    const schoolMatch = !schoolId || !rowSchoolId || rowSchoolId === schoolId;
    const yearMatch = !academicSession || !rowAcademicYear || rowAcademicYear === academicSession;
    return schoolMatch && yearMatch;
  };

  const liveDashboardMetrics = dashboardMetricRows.filter(managerScope);
  const livePlannerRows = plannerRows.filter(managerScope);
  const liveClassroomRows = classroomRows.filter(managerScope);
  const liveAssessmentRows = assessmentTrackingRows.filter(managerScope);
  const liveEvidenceGapRows = evidenceGapRows.filter(managerScope);
  const liveAlertRows = dashboardAlertRows.filter(managerScope);
  const liveQaChecklistRows = qaChecklistRows.filter(managerScope);
  const liveQaReviewRows = qaReviewRows.filter(managerScope);
  const liveSqaaEvidenceRows = sqaaEvidenceRows.filter(managerScope);
  const liveComplianceReportRows = complianceReportRows.filter(managerScope);
  const liveResultRows = resultRows.filter(managerScope);
  const liveMarksRows = marksRows.filter(managerScope);
  const liveCourseRows = classroomCourseRows.filter(managerScope);
  const liveAssignmentRows = classroomAssignmentRows.filter(managerScope);
  const liveSubmissionRows = classroomSubmissionRows.filter(managerScope);
  const liveSyncLogRows = classroomSyncLogRows.filter(managerScope);
  const liveBudgetRows = strategicBudgetRows.filter(managerScope);
  const liveMilestoneRows = strategicMilestoneRows.filter(managerScope);
  const liveChecklistRows = operationalChecklistRows.filter(managerScope);
  const liveAnnouncementRows = classroomAnnouncementRows.filter(managerScope);

  const findMetricRow = (...keywords: string[]) => liveDashboardMetrics.find((row) => {
    const haystack = [
      pickFirst(row, ["dashboard_role", "role", "kpi_name", "metric_name", "name", "title", "description"], ""),
      pickFirst(row, ["notes", "status"], "")
    ].join(" ").toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  }) || null;

  const metricFromRow = (row: SheetRow | null, valueKeys: string[], fallbackLabel: string) => {
    if (!row) return null;
    const label = pickFirst(row, ["kpi_name", "metric_name", "name", "label", "title"], fallbackLabel);
    const value = pickFirst(row, valueKeys, "");
    const detail = pickFirst(row, ["description", "details", "summary", "notes", "status"], "");
    const source = managerSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Metrics");
    const percent = firstNumberFromRow(row, ["percentage", "percent", "value", "score", "completion", "coverage", "rate"]) ?? 0;
    return { label, value, detail, percent, source };
  };

  const sumNumbers = (rows: SheetRow[], keys: string[]): number => rows.reduce((sum, row) => {
    const value = firstNumberFromRow(row, keys);
    return sum + (value === null ? 0 : value);
  }, 0);

  const gpaAverage = () => {
    const values = [...liveResultRows, ...liveMarksRows]
      .map((row) => firstNumberFromRow(row, ["gpa", "average_gpa", "cgpa"]))
      .filter((value): value is number => value !== null);
    if (values.length === 0) return null;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
  };

  const numericStudentStanding = () => {
    const values = [...liveResultRows, ...liveMarksRows]
      .map((row) => firstNumberFromRow(row, ["percentage", "average_marks", "score", "pass_percent", "total_marks"]))
      .filter((value): value is number => value !== null);
    if (values.length === 0) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };
  const averageGpa = gpaAverage();
  const studentStanding = numericStudentStanding();

  const plannerCompliance = livePlannerRows.length > 0
    ? Math.round((countTruthyRows(livePlannerRows, ["status", "review_status", "completion_status", "submission_status"]) / livePlannerRows.length) * 100)
    : null;
  const classroomActivityIndex = liveClassroomRows.length > 0 || liveCourseRows.length > 0
    ? Math.round((countTruthyRows([...liveClassroomRows, ...liveCourseRows, ...liveAssignmentRows, ...liveSubmissionRows, ...liveSyncLogRows], ["status", "sync_status", "publish_status", "submission_status", "completion_status"]) / Math.max(1, liveClassroomRows.length + liveCourseRows.length + liveAssignmentRows.length + liveSubmissionRows.length + liveSyncLogRows.length)) * 100)
    : null;
  const remedialOutreachSuccess = (() => {
    if (liveAssessmentRows.length > 0 || liveResultRows.length > 0) {
      const resultScore = averageFromRows(liveResultRows, ["pass_percent", "percentage", "average_marks"]);
      const assessmentScore = averageFromRows(liveAssessmentRows, ["completion", "percentage", "status_percent"]);
      const values = [resultScore, assessmentScore].filter((value) => value > 0);
      if (values.length > 0) return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    }
    if (liveEvidenceGapRows.length > 0) {
      return Math.max(0, 100 - Math.min(100, liveEvidenceGapRows.length * 10));
    }
    return null;
  })();
  const sqaaEvidenceDocumentation = (() => {
    const reportCoverage = averageFromRows(liveComplianceReportRows, ["coverage_percent"]);
    const reviewScore = averageFromRows(liveQaReviewRows, ["qa_score"]);
    const evidenceScore = averageFromRows(liveSqaaEvidenceRows, ["evidence_status"]);
    const values = [reportCoverage, reviewScore, evidenceScore].filter((value) => value > 0);
    if (values.length > 0) return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    return liveQaChecklistRows.length > 0 ? 100 : null;
  })();

  const operationalScoreComponents = [plannerCompliance, classroomActivityIndex, remedialOutreachSuccess, sqaaEvidenceDocumentation].filter((value): value is number => value !== null);
  const operationalExcellence = operationalScoreComponents.length > 0
    ? Math.round(operationalScoreComponents.reduce((sum, value) => sum + value, 0) / operationalScoreComponents.length)
    : null;

  const budgetPercent = (() => {
    if (liveBudgetRows.length === 0) return null;
    const allocated = sumNumbers(liveBudgetRows, ["allocated_amount"]);
    const utilized = sumNumbers(liveBudgetRows, ["utilized_amount"]);
    const explicitPercent = averageFromRows(liveBudgetRows, ["utilization_percent"]);
    if (allocated > 0 && utilized > 0) {
      return Math.max(0, Math.min(100, Math.round((utilized / allocated) * 100)));
    }
    return explicitPercent > 0 ? explicitPercent : null;
  })();

  const milestoneRows = [...liveMilestoneRows, ...liveChecklistRows].filter((row, index, self) => index === self.findIndex((candidate) => {
    const candidateKey = `${pickFirst(candidate, ["milestone_id", "checklist_id", "id"], "")}::${pickFirst(candidate, ["milestone_name", "check_item", "title", "notes"], "")}`;
    const rowKey = `${pickFirst(row, ["milestone_id", "checklist_id", "id"], "")}::${pickFirst(row, ["milestone_name", "check_item", "title", "notes"], "")}`;
    return candidateKey === rowKey;
  }));
  const milestoneCompleted = milestoneRows.filter((row) => normalizeManagerStatus(pickFirst(row, ["completion_status", "status", "review_status", "action_status"], "") ) === "healthy").length;

  const managerMetricRows = [
    metricFromRow(findMetricRow("operational", "excellence", "readiness"), ["value", "score", "percentage"], "Operational excellence rating"),
    metricFromRow(findMetricRow("student", "standing", "gpa", "average academic"), ["value", "gpa", "score", "percentage"], "Student standing"),
    metricFromRow(findMetricRow("budget", "utilization"), ["value", "utilization_percent", "percentage"], "Budget utilization"),
    metricFromRow(findMetricRow("milestone", "strategic"), ["value", "count", "status"], "Strategic milestones")
  ];

  const kpis: ManagerKpiMetric[] = [
    {
      id: "operational-excellence",
      label: managerMetricRows[0]?.label || "Operational excellence rating",
      value: managerMetricRows[0]?.value || (operationalExcellence !== null ? `${operationalExcellence}%` : "--"),
      detail: managerMetricRows[0]?.detail || (operationalExcellence !== null ? "Composite score from planner, classroom, evidence, and alerts." : "Seed Planner_Submissions, Classroom_Activity, Evidence_Gaps, Dashboard_Alerts, and SQAA rows."),
      status: statusFromPercent(operationalExcellence),
      source: managerMetricRows[0]?.source || managerSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Metrics")
    },
    {
      id: "student-standing",
      label: managerMetricRows[1]?.label || (averageGpa !== null ? "Average GPA" : "Student standing"),
      value: managerMetricRows[1]?.value || (averageGpa !== null ? String(averageGpa) : (studentStanding !== null ? `${studentStanding}%` : "--")),
      detail: managerMetricRows[1]?.detail || (averageGpa !== null ? "Average GPA from live result and marks rows." : (studentStanding !== null ? "Average score from result and marks registries." : "Seed Assessment / Result Registry rows.")),
      status: statusFromPercent(averageGpa !== null ? Math.round(averageGpa * 20) : studentStanding),
      source: managerMetricRows[1]?.source || managerSourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Analysis")
    },
    {
      id: "budget-utilized",
      label: managerMetricRows[2]?.label || "Budget utilized",
      value: managerMetricRows[2]?.value || (budgetPercent !== null ? `${budgetPercent}%` : "--"),
      detail: managerMetricRows[2]?.detail || (budgetPercent !== null ? "Live budget utilization from strategic operations registry." : "Budget_Utilization registry not configured."),
      status: statusFromPercent(budgetPercent),
      source: managerMetricRows[2]?.source || managerSourceRef(sourceState, "schoolyStrategicOperationsRegistryUrl", "Budget_Utilization")
    },
    {
      id: "strategic-milestones",
      label: managerMetricRows[3]?.label || "Strategic milestones met",
      value: managerMetricRows[3]?.value || (milestoneRows.length > 0 ? `${milestoneCompleted} / ${milestoneRows.length} Met` : "--"),
      detail: managerMetricRows[3]?.detail || (milestoneRows.length > 0 ? "Completed milestones from strategic operations registry." : "Strategic_Milestones and Operational_Checklist are not configured."),
      status: statusFromPercent(milestoneRows.length > 0 ? Math.round((milestoneCompleted / milestoneRows.length) * 100) : null),
      source: managerMetricRows[3]?.source || managerSourceRef(sourceState, "schoolyStrategicOperationsRegistryUrl", "Strategic_Milestones")
    }
  ];

  const operationalMetrics: ManagerOperationalMetric[] = [
    {
      id: "planner-compliance",
      label: "Teacher planner compliance ratio",
      value: plannerCompliance !== null ? `${plannerCompliance}%` : "--",
      detail: plannerCompliance !== null ? `${livePlannerRows.length} planner row${livePlannerRows.length === 1 ? "" : "s"} in scope` : "Seed Planner_Submissions rows for this manager.",
      percent: plannerCompliance ?? 0,
      status: statusFromPercent(plannerCompliance),
      source: managerSourceRef(sourceState, "dashboardDataSourceUrl", "Planner_Submissions")
    },
    {
      id: "classroom-activity",
      label: "Google Classroom activity index",
      value: classroomActivityIndex !== null ? `${classroomActivityIndex}%` : "--",
      detail: classroomActivityIndex !== null ? `${liveClassroomRows.length + liveCourseRows.length + liveAssignmentRows.length} live Classroom rows` : "Seed Classroom_Activity and Classroom_* sync rows.",
      percent: classroomActivityIndex ?? 0,
      status: statusFromPercent(classroomActivityIndex),
      source: managerSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Course_Map")
    },
    {
      id: "remedial-outreach",
      label: "Remedial class outreach success",
      value: remedialOutreachSuccess !== null ? `${remedialOutreachSuccess}%` : "--",
      detail: remedialOutreachSuccess !== null ? "Live from evidence gaps and result rows." : "Seed Evidence_Gaps, Assessment_Tracking, and Result_Analysis.",
      percent: remedialOutreachSuccess ?? 0,
      status: statusFromPercent(remedialOutreachSuccess),
      source: managerSourceRef(sourceState, "dashboardDataSourceUrl", "Evidence_Gaps")
    },
    {
      id: "sqaa-evidence",
      label: "SQAA quality evidence documentation",
      value: sqaaEvidenceDocumentation !== null ? `${sqaaEvidenceDocumentation}%` : "--",
      detail: sqaaEvidenceDocumentation !== null ? "Live from QA and compliance registries." : "Seed QA_Checklist_Config, QA_Review_Log, and SQAA_Evidence_Map.",
      percent: sqaaEvidenceDocumentation ?? 0,
      status: statusFromPercent(sqaaEvidenceDocumentation),
      source: managerSourceRef(sourceState, "qaSqaaRegistryUrl", "SQAA_Evidence_Map")
    }
  ];

  const checklistCandidates = [
    ...liveQaChecklistRows,
    ...liveQaReviewRows,
    ...liveComplianceReportRows,
    ...liveMilestoneRows,
    ...liveChecklistRows,
    ...liveAlertRows
  ];
  const complianceChecklist: ManagerComplianceChecklistItem[] = checklistCandidates
    .map((row, index) => ({
      id: pickFirst(row, ["checklist_id", "qa_review_id", "report_id", "milestone_id", "id"], `manager-check-${index + 1}`),
      title: pickFirst(row, ["check_item", "milestone_name", "framework_id", "report_period", "alert_type", "title", "name"], "Strategic review"),
      detail: pickFirst(row, ["description", "notes", "blocking_issues", "warnings", "recommendations", "message"], "Live row"),
      statusLabel: pickFirst(row, ["status", "review_status", "completion_status", "action_status"], "Open"),
      severity: normalizeManagerSeverity(pickFirst(row, ["severity", "priority", "status", "review_status"], "")),
      source: row["milestone_id"] || row["milestone_name"]
        ? managerSourceRef(sourceState, "schoolyStrategicOperationsRegistryUrl", "Strategic_Milestones")
        : row["report_id"] || row["qa_review_id"]
          ? managerSourceRef(sourceState, "qaSqaaRegistryUrl", "QA_Review_Log")
          : row["alert_type"]
            ? managerSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
            : managerSourceRef(sourceState, "qaSqaaRegistryUrl", "QA_Checklist_Config")
    }))
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id || candidate.title === item.title))
    .sort((a, b) => {
      const order = { critical: 0, high: 1, warning: 2, neutral: 3 } as const;
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 5);

  const announcements: ManagerAnnouncement[] = liveAnnouncementRows
    .map((row, index) => ({
      id: pickFirst(row, ["announcement_id", "id"], `manager-announcement-${index + 1}`),
      className: pickFirst(row, ["class", "class_name", "grade"], ""),
      section: pickFirst(row, ["section"], ""),
      subject: pickFirst(row, ["subject", "subject_name"], ""),
      title: pickFirst(row, ["announcement_title", "title", "post_title"], "Classroom announcement"),
      text: pickFirst(row, ["announcement_text", "message", "notes"], ""),
      postedAt: pickFirst(row, ["posted_at", "created_at", "updated_at"], ""),
      status: pickFirst(row, ["status"], "Posted"),
      url: pickFirst(row, ["classroom_url"], ""),
      source: managerSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
    }))
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")))
    .slice(0, 5);

  const resolvedManager = Boolean(managerRow) && sourceState.mode === "live";
  const setupState: ManagerSetupState = resolvedManager
    ? {
        status: "live",
        title: "School manager dashboard connected",
        message: "Live rows are available for this manager.",
        messages: sourceState.setupMessages.length > 0 ? sourceState.setupMessages : ["Live rows are available."]
      }
    : {
        status: "setup_required",
        title: "Manager dashboard setup required",
        message: managerRow
          ? "One or more required manager registries are still missing."
          : "Manager could not be resolved from live data.",
        messages: managerRow
          ? [
              "Seed School_Profile and Academic_Years rows.",
              "Add Dashboard_Metrics, Planner_Submissions, and Classroom_Announcement_Sync rows."
            ]
          : [
              "Create a matching Staff_Directory row with manager role or designation.",
              "Seed School_Profile and Academic_Years so the manager dashboard can scope live data."
            ]
      };

  const sourceHealth: ManagerDashboardSourceReference[] = [
    managerSourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory"),
    managerSourceRef(sourceState, "masterDataRegistryUrl", "School_Profile"),
    managerSourceRef(sourceState, "masterDataRegistryUrl", "Academic_Years"),
    managerSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Metrics"),
    managerSourceRef(sourceState, "dashboardDataSourceUrl", "Planner_Submissions"),
    managerSourceRef(sourceState, "dashboardDataSourceUrl", "Classroom_Activity"),
    managerSourceRef(sourceState, "dashboardDataSourceUrl", "Assessment_Tracking"),
    managerSourceRef(sourceState, "dashboardDataSourceUrl", "Evidence_Gaps"),
    managerSourceRef(sourceState, "qaSqaaRegistryUrl", "QA_Checklist_Config"),
    managerSourceRef(sourceState, "qaSqaaRegistryUrl", "QA_Review_Log"),
    managerSourceRef(sourceState, "qaSqaaRegistryUrl", "SQAA_Evidence_Map"),
    managerSourceRef(sourceState, "qaSqaaRegistryUrl", "Compliance_Report_Registry"),
    managerSourceRef(sourceState, "schoolyStrategicOperationsRegistryUrl", "Budget_Utilization"),
    managerSourceRef(sourceState, "schoolyStrategicOperationsRegistryUrl", "Strategic_Milestones"),
    managerSourceRef(sourceState, "schoolyStrategicOperationsRegistryUrl", "Operational_Checklist"),
    managerSourceRef(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan"),
    managerSourceRef(sourceState, "assessmentResultRegistryUrl", "Marks_Entry"),
    managerSourceRef(sourceState, "assessmentResultRegistryUrl", "Result_Analysis"),
    managerSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Course_Map"),
    managerSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Assignment_Map"),
    managerSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Submission_Sync"),
    managerSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Sync_Log"),
    managerSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
  ];

  return {
    profile: {
      initials: managerName ? managerName.split(/\s+/).map((part) => part.trim()[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : "",
      name: managerName,
      roleLabel: pickFirst(managerRow || {}, ["role", "designation"], "School Manager"),
      academicSession,
      oversightLabel,
      performanceLabel,
      source: managerSourceRef(sourceState, "masterDataRegistryUrl", "Staff_Directory")
    },
    kpis,
    operationalMetrics,
    complianceChecklist,
    announcements,
    sourceHealth,
    setupState
  };
}

function buildStudentDashboard(tabs: SheetTabMap, sourceState: DashboardSourceState, options: LoadDashboardDataOptions): StudentDashboardData {
  const studentIdentity = String(options.teacherIdentity || options.workspaceUrl || options.classroomUrl || "").trim();
  const schoolProfileRows = tabs.school_profile || [];
  const academicYearRows = tabs.academic_years || [];
  const studentDirectoryRows = tabs.student_directory || [];
  const studentEnrollmentRows = tabs.student_enrollment || [];
  const classRows = tabs.classes_sections || [];
  const subjectRows = tabs.subjects || [];
  const attendanceRows = tabs.attendance_summary || [];
  const dashboardMetricRows = tabs.dashboard_metrics || [];
  const dashboardAlertRows = tabs.dashboard_alerts || [];
  const classroomActivityRows = tabs.classroom_activity || [];
  const classroomCourseRows = tabs.classroom_course_map || [];
  const classroomAssignmentRows = tabs.classroom_assignment_map || [];
  const classroomSubmissionRows = tabs.classroom_submission_sync || [];
  const classroomSyncLogRows = tabs.classroom_sync_log || [];
  const classroomAnnouncementRows = tabs.classroom_announcement_sync || [];
  const booksRows = tabs.books_registry || [];
  const tocRows = tabs.book_toc_registry || [];

  const schoolProfileRow = schoolProfileRows.find((row) => /active|live|current/i.test(pickFirst(row, ["status"], ""))) || schoolProfileRows[0] || {};
  const studentRow = studentDirectoryRows.find((row) => rowMatchesTeacherIdentity(row, studentIdentity)) || null;
  const enrollmentRow = studentRow
    ? studentEnrollmentRows.find((row) => pickFirst(row, ["student_id"], "") === pickFirst(studentRow, ["student_id"], ""))
      || studentEnrollmentRows.find((row) => rowMatchesTeacherIdentity(row, studentIdentity))
      || null
    : studentEnrollmentRows.find((row) => rowMatchesTeacherIdentity(row, studentIdentity)) || null;

  const schoolId = pickFirst(schoolProfileRow || {}, ["school_id"], "");
  const academicSession = getActiveAcademicYearLabel(tabs);
  const studentName = pickFirst(studentRow || {}, ["student_name", "name"], "") || pickFirst(enrollmentRow || {}, ["student_name"], "") || studentIdentity;
  const studentId = pickFirst(studentRow || {}, ["student_id", "id"], "") || pickFirst(enrollmentRow || {}, ["student_id"], "");
  const classNameRaw = pickFirst(enrollmentRow || studentRow || {}, ["class", "class_name", "grade"], "");
  const sectionRaw = pickFirst(enrollmentRow || studentRow || {}, ["section"], "");
  const rollNumber = pickFirst(enrollmentRow || {}, ["roll_number"], "");
  const classDisplay = classNameRaw ? (/^class\b/i.test(classNameRaw) ? classNameRaw : `Class ${classNameRaw}`) : "Class pending";
  const sectionDisplay = sectionRaw ? `-${sectionRaw}` : "";
  const studentLabel = `${classDisplay}${sectionDisplay} Student`;
  const classToken = normalizeKey(classNameRaw).replace(/^class_?/, "");
  const sectionToken = normalizeKey(sectionRaw);
  const subjectToken = normalizeKey(pickFirst(studentRow || {}, ["subject"], ""));

  const studentScope = (row: SheetRow): boolean => {
    const rowSchoolId = pickFirst(row, ["school_id"], "");
    const rowAcademicYear = pickFirst(row, ["academic_year", "term_name", "session"], "");
    const rowClassToken = normalizeKey(pickFirst(row, ["class", "class_name", "grade"], "")).replace(/^class_?/, "");
    const rowSectionToken = normalizeKey(pickFirst(row, ["section"], ""));
    const rowSubjectToken = normalizeKey(pickFirst(row, ["subject", "subject_name"], ""));
    const schoolMatch = !schoolId || !rowSchoolId || rowSchoolId === schoolId;
    const yearMatch = !academicSession || !rowAcademicYear || rowAcademicYear === academicSession;
    const classMatch = !classToken || !rowClassToken || rowClassToken === classToken || rowClassToken.includes(classToken) || classToken.includes(rowClassToken);
    const sectionMatch = !sectionToken || !rowSectionToken || rowSectionToken === sectionToken;
    const subjectMatch = !subjectToken || !rowSubjectToken || rowSubjectToken === subjectToken;
    return schoolMatch && yearMatch && classMatch && sectionMatch && subjectMatch;
  };

  const relevantClassRows = classRows.filter(studentScope);
  const relevantSubjectRows = subjectRows.filter(studentScope);
  const relevantAttendanceRows = attendanceRows.filter(studentScope);
  const relevantAssignmentRows = classroomAssignmentRows.filter(studentScope);
  const relevantCourseRows = classroomCourseRows.filter(studentScope);
  const relevantAnnouncementRows = classroomAnnouncementRows.filter(studentScope);
  const relevantActivityRows = classroomActivityRows.filter(studentScope);
  const relevantDashboardMetrics = dashboardMetricRows.filter(studentScope);
  const relevantAlerts = dashboardAlertRows.filter(studentScope);

  const submittedAssignmentIds = new Set(
    classroomSubmissionRows
      .filter((row) => {
        const rowSchoolId = pickFirst(row, ["school_id"], "");
        const rowAcademicYear = pickFirst(row, ["academic_year", "term_name", "session"], "");
        const rowStudentId = pickFirst(row, ["student_id"], "");
        const schoolMatch = !schoolId || !rowSchoolId || rowSchoolId === schoolId;
        const yearMatch = !academicSession || !rowAcademicYear || rowAcademicYear === academicSession;
        const studentMatch = !studentId || !rowStudentId || rowStudentId === studentId;
        return schoolMatch && yearMatch && studentMatch;
      })
      .map((row) => pickFirst(row, ["classroom_assignment_id", "assignment_id", "id"], ""))
      .filter(Boolean)
  );

  const currentDayTokens = currentDayNames();
  const dayOrder = new Map([
    ["monday", 1], ["mon", 1],
    ["tuesday", 2], ["tue", 2],
    ["wednesday", 3], ["wed", 3],
    ["thursday", 4], ["thu", 4],
    ["friday", 5], ["fri", 5],
    ["saturday", 6], ["sat", 6],
    ["sunday", 7], ["sun", 7]
  ]);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const parseRowTimeRange = (row: SheetRow) => {
    const start = parseClockMinutes(pickFirst(row, ["start_time", "start", "time_start"], ""));
    const end = parseClockMinutes(pickFirst(row, ["end_time", "end", "time_end"], ""));
    return { start, end };
  };

  const timetableCandidates = [
    ...(tabs.timetable || []),
    ...relevantCourseRows,
    ...relevantActivityRows
  ].filter((row, index, self) => index === self.findIndex((candidate) => {
    const candidateKey = `${pickFirst(candidate, ["timetable_id", "course_map_id", "activity_id", "id"], "")}::${pickFirst(candidate, ["period", "title", "subject", "classroom_course_name"], "")}`;
    const rowKey = `${pickFirst(row, ["timetable_id", "course_map_id", "activity_id", "id"], "")}::${pickFirst(row, ["period", "title", "subject", "classroom_course_name"], "")}`;
    return candidateKey === rowKey;
  })).map((row) => {
    const day = pickFirst(row, ["day", "weekday"], "");
    const { start, end } = parseRowTimeRange(row);
    const matchesToday = currentDayTokens.includes(normalizeDayOfWeek(day));
    const title = pickFirst(row, ["classroom_course_name", "title", "subject", "course_name"], "Scheduled class");
    return {
      id: pickFirst(row, ["timetable_id", "course_map_id", "activity_id", "id"], `${title}-${day}-${pickFirst(row, ["period"], "")}`),
      title,
      className: pickFirst(row, ["class", "class_name", "grade"], classDisplay),
      section: pickFirst(row, ["section"], sectionRaw),
      subject: pickFirst(row, ["subject", "subject_name"], ""),
      day,
      start,
      end,
      timeLabel: [pickFirst(row, ["start_time", "start", "time_start"], ""), pickFirst(row, ["end_time", "end", "time_end"], "")].filter(Boolean).join(" - ") || pickFirst(row, ["period"], ""),
      room: pickFirst(row, ["room", "venue", "location"], ""),
      statusLabel: pickFirst(row, ["status", "sync_status", "publish_status"], matchesToday ? "Today" : "Scheduled"),
      source: studentSourceRef(sourceState, "masterDataRegistryUrl", "Timetable")
    };
  });

  const timetableByDay = timetableCandidates.filter((row) => {
    if (!row.day) return true;
    return currentDayTokens.includes(normalizeDayOfWeek(row.day));
  });
  const timetableRows = (timetableByDay.length > 0 ? timetableByDay : timetableCandidates)
    .sort((a, b) => {
      const dayDiff = (dayOrder.get(normalizeDayOfWeek(a.day)) || 99) - (dayOrder.get(normalizeDayOfWeek(b.day)) || 99);
      if (dayDiff !== 0) return dayDiff;
      const aStart = typeof a.start === "number" ? a.start : 9999;
      const bStart = typeof b.start === "number" ? b.start : 9999;
      return aStart - bStart;
    });

  let currentTimetableIndex = timetableRows.findIndex((item) => typeof item.start === "number" && typeof item.end === "number" && item.start <= nowMinutes && nowMinutes < item.end);
  if (currentTimetableIndex < 0) {
    currentTimetableIndex = timetableRows.findIndex((item) => typeof item.start === "number" && item.start > nowMinutes);
  }
  const nextTimetableIndex = currentTimetableIndex >= 0 ? currentTimetableIndex + 1 : 0;

  const timetable: StudentTimetableItem[] = timetableRows.slice(0, 4).map((item, index) => ({
    id: item.id,
    title: item.title,
    className: item.className || classDisplay,
    section: item.section || sectionRaw,
    subject: item.subject || pickFirst(relevantSubjectRows[index] || {}, ["subject", "subject_name"], "Subject"),
    timeLabel: item.timeLabel || "Scheduled",
    room: item.room || pickFirst(relevantCourseRows[index] || {}, ["room", "location", "venue"], "Live"),
    statusLabel: item.statusLabel || "Scheduled",
    highlight: index === currentTimetableIndex ? "current" : index === nextTimetableIndex ? "next" : "normal",
    actionLabel: index === currentTimetableIndex ? "Join Live Meet" : "Open class",
    actionTab: index === currentTimetableIndex ? "classroom" : "registers",
    source: item.source
  }));

  const subjectLabel = pickFirst(relevantSubjectRows[0] || {}, ["subject", "subject_name"], "") || pickFirst(relevantCourseRows[0] || {}, ["subject", "subject_name"], "");
  const pendingAssignments = relevantAssignmentRows
    .map((row, index) => {
      const assignmentId = pickFirst(row, ["assignment_map_id", "classroom_assignment_id", "id"], `task-${index + 1}`);
      const title = pickFirst(row, ["assignment_title", "title", "task_title"], "Classroom assignment");
      const subject = pickFirst(row, ["subject", "subject_name"], subjectLabel || "Classroom work");
      const dueDate = pickFirst(row, ["due_date", "planned_date", "date"], "");
      const published = /published|active|open|live/i.test(pickFirst(row, ["publish_status", "status"], ""));
      const completed = submittedAssignmentIds.has(assignmentId) || /submitted|done|complete|completed/i.test(pickFirst(row, ["submission_status", "status"], ""));
      const dueLabel = dueDate ? `Due ${formatCompactDate(dueDate)}` : (published ? "Due soon" : "Pending");
      const statusLabel = completed ? "Submitted" : (published ? "Pending" : "Draft");
      return {
        id: assignmentId,
        subject,
        title,
        detail: pickFirst(row, ["notes", "description", "summary"], completed ? "Submitted to Classroom" : "Awaiting submission"),
        dueLabel,
        actionLabel: completed ? "Submitted" : "Mark Done",
        actionTab: completed ? undefined : "classroom",
        completed,
        statusLabel,
        source: studentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Assignment_Map")
      } satisfies StudentDashboardTask;
    })
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id || candidate.title === item.title))
    .sort((a, b) => Number(a.completed) - Number(b.completed))
    .slice(0, 4);

  const alertTasks = relevantAlerts
    .map((row, index) => ({
      id: pickFirst(row, ["alert_id", "id"], `alert-${index + 1}`),
      subject: pickFirst(row, ["subject", "subject_name"], subjectLabel || "Student task"),
      title: pickFirst(row, ["title", "message", "alert", "description"], "Student reminder"),
      detail: pickFirst(row, ["notes", "description", "message"], "Open alert"),
      dueLabel: pickFirst(row, ["due_date", "target_date"], "Open"),
      actionLabel: "Review",
      actionTab: "registers",
      completed: false,
      statusLabel: pickFirst(row, ["status", "severity", "priority"], "Attention"),
      source: studentSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts")
    } satisfies StudentDashboardTask))
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id || candidate.title === item.title));

  const tasks: StudentDashboardTask[] = [
    ...pendingAssignments,
    ...alertTasks
  ].sort((a, b) => Number(a.completed) - Number(b.completed))
    .slice(0, 4);

  const attendancePercent = (() => {
    const values = relevantAttendanceRows
      .map((row) => firstNumberFromRow(row, ["attendance_percent", "attendance_rate", "percentage", "score"]))
      .filter((value): value is number => value !== null);
    if (values.length > 0) return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    const metricRow = relevantDashboardMetrics.find((row) => /attendance/i.test(pickFirst(row, ["dashboard_role", "role", "kpi_name", "metric_name", "name", "title", "description"], "")));
    if (metricRow) return firstNumberFromRow(metricRow, ["value", "percentage", "rate", "score", "completion"]);
    return null;
  })();

  const homeworkSubmissionPercent = (() => {
    const completed = pendingAssignments.filter((task) => task.completed).length;
    if (pendingAssignments.length > 0) return Math.round((completed / pendingAssignments.length) * 100);
    const submissionValues = classroomSubmissionRows
      .filter((row) => {
        const rowStudentId = pickFirst(row, ["student_id"], "");
        const rowClass = pickFirst(row, ["class", "class_name", "grade"], "");
        const rowSection = pickFirst(row, ["section"], "");
        const schoolMatch = !schoolId || !pickFirst(row, ["school_id"], "") || pickFirst(row, ["school_id"], "") === schoolId;
        const yearMatch = !academicSession || !pickFirst(row, ["academic_year", "term_name", "session"], "") || pickFirst(row, ["academic_year", "term_name", "session"], "") === academicSession;
        const studentMatch = !studentId || !rowStudentId || rowStudentId === studentId;
        const classMatch = !classToken || !normalizeKey(rowClass).replace(/^class_?/, "") || normalizeKey(rowClass).replace(/^class_?/, "") === classToken;
        const sectionMatch = !sectionToken || !normalizeKey(rowSection) || normalizeKey(rowSection) === sectionToken;
        return schoolMatch && yearMatch && studentMatch && classMatch && sectionMatch;
      })
      .map((row) => /submitted|done|complete|graded/i.test(pickFirst(row, ["submission_status", "status"], "")) ? 1 : 0);
    if (submissionValues.length > 0) return Math.round((submissionValues.reduce((sum, value) => sum + value, 0) / submissionValues.length) * 100);
    return null;
  })();

  const resourcesRows = [
    ...booksRows.filter(studentScope),
    ...tocRows.filter(studentScope)
  ];
  const resources: StudentResourceLink[] = resourcesRows
    .map((row, index) => ({
      id: pickFirst(row, ["book_id", "book_toc_id", "id"], `resource-${index + 1}`),
      label: pickFirst(row, ["book_title", "chapter_title", "title"], "Study resource"),
      detail: [pickFirst(row, ["class", "class_name", "grade"], classDisplay), pickFirst(row, ["subject", "subject_name"], subjectLabel)].filter(Boolean).join(" | ") || "Live resource row",
      actionTab: "registers",
      source: studentSourceRef(sourceState, "masterDataRegistryUrl", pickFirst(row, ["book_toc_id"], "") ? "Book_TOC_Registry" : "Books_Registry")
    }))
    .filter((item, index, self) => index === self.findIndex((candidate) => candidate.id === item.id || candidate.label === item.label))
    .slice(0, 3);

  const announcements: StudentAnnouncementItem[] = relevantAnnouncementRows
    .map((row, index) => ({
      id: pickFirst(row, ["announcement_id", "id"], `announcement-${index + 1}`),
      className: pickFirst(row, ["class", "class_name", "grade"], classDisplay),
      section: pickFirst(row, ["section"], sectionRaw),
      subject: pickFirst(row, ["subject", "subject_name"], subjectLabel),
      title: pickFirst(row, ["announcement_title", "title", "post_title"], "Classroom announcement"),
      text: pickFirst(row, ["announcement_text", "message", "notes"], ""),
      postedAt: pickFirst(row, ["posted_at", "created_at", "updated_at"], ""),
      status: pickFirst(row, ["status"], "Posted"),
      teacherName: pickFirst(row, ["teacher_name", "staff_name", "owner"], ""),
      url: pickFirst(row, ["classroom_url"], ""),
      source: studentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync")
    }))
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")))
    .slice(0, 5);

  const resolvedStudent = Boolean(studentRow || enrollmentRow) && sourceState.mode === "live";
  const setupState: StudentDashboardSetupState = resolvedStudent
    ? {
        status: "live",
        title: "Student dashboard connected",
        message: "Live rows are available for this student context.",
        messages: sourceState.setupMessages.length > 0 ? sourceState.setupMessages : ["Live rows are available."]
      }
    : {
        status: "setup_required",
        title: "Student dashboard setup required",
        message: studentRow
          ? "One or more required student registries are still missing."
          : "Student could not be resolved from live data.",
        messages: studentRow
          ? [
              "Seed Student_Enrollment and Timetable rows for the selected class.",
              "Add Classroom_Assignment_Map, Classroom_Submission_Sync, and Classroom_Announcement_Sync rows."
            ]
          : [
              "Create a matching Student_Directory row for this student name or student ID.",
              "Seed Student_Enrollment so the student dashboard can scope live data."
            ]
      };

  const sourceHealth: StudentDashboardSourceReference[] = [
    studentSourceRef(sourceState, "masterDataRegistryUrl", "Student_Directory"),
    studentSourceRef(sourceState, "masterDataRegistryUrl", "Student_Enrollment"),
    studentSourceRef(sourceState, "masterDataRegistryUrl", "Classes_Sections"),
    studentSourceRef(sourceState, "masterDataRegistryUrl", "Subjects"),
    studentSourceRef(sourceState, "masterDataRegistryUrl", "Timetable"),
    studentSourceRef(sourceState, "dashboardDataSourceUrl", "Attendance_Summary"),
    studentSourceRef(sourceState, "dashboardDataSourceUrl", "Classroom_Activity"),
    studentSourceRef(sourceState, "dashboardDataSourceUrl", "Dashboard_Alerts"),
    studentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Course_Map"),
    studentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Assignment_Map"),
    studentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Submission_Sync"),
    studentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Sync_Log"),
    studentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Announcement_Sync"),
    studentSourceRef(sourceState, "masterDataRegistryUrl", "Books_Registry"),
    studentSourceRef(sourceState, "masterDataRegistryUrl", "Book_TOC_Registry")
  ];

  return {
    header: {
      initials: studentName ? studentName.split(/\s+/).map((part) => part.trim()[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : (studentId ? studentId.slice(0, 2).toUpperCase() : "ST"),
      name: studentName,
      label: studentLabel,
      className: classDisplay,
      section: sectionRaw,
      academicSession,
      rollNumber,
      source: studentSourceRef(sourceState, "masterDataRegistryUrl", "Student_Directory")
    },
    kpis: [
      {
        id: "pending-assignments",
        label: "Active assignments",
        value: `${tasks.filter((task) => !task.completed).length} Pending`,
        detail: "Homework assignments due soon.",
        status: tasks.filter((task) => !task.completed).length > 0 ? "attention" : "healthy",
        source: studentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Assignment_Map")
      },
      {
        id: "homework-submitted",
        label: "Homework work submitted",
        value: homeworkSubmissionPercent !== null ? `${homeworkSubmissionPercent}% Done` : "--",
        detail: homeworkSubmissionPercent !== null ? "Live submission progress from Classroom sync rows." : "Submission rows are not configured.",
        status: statusFromPercent(homeworkSubmissionPercent),
        source: studentSourceRef(sourceState, "classroomSyncRegistryUrl", "Classroom_Submission_Sync")
      },
      {
        id: "study-resources",
        label: "Study files opened",
        value: `${resources.length} Resources`,
        detail: subjectLabel ? `${subjectLabel} materials tracked.` : "Live study files tracked from source rows.",
        status: resources.length > 0 ? "healthy" : "warning",
        source: studentSourceRef(sourceState, "masterDataRegistryUrl", resources.some((resource) => /book_toc_registry/i.test(resource.source.tab)) ? "Book_TOC_Registry" : "Books_Registry")
      },
      {
        id: "attendance-status",
        label: "My attendance status",
        value: attendancePercent !== null ? `${attendancePercent}% Status` : "--",
        detail: attendancePercent !== null ? "On-track with high attendance metric." : "Attendance summary rows are not configured.",
        status: statusFromPercent(attendancePercent),
        source: studentSourceRef(sourceState, "dashboardDataSourceUrl", "Attendance_Summary")
      }
    ],
    tasks,
    timetable,
    resources,
    announcements,
    sourceHealth,
    setupState
  };
}

async function resolveLiveRegistryData(options: LoadDashboardDataOptions): Promise<{ tabs: SheetTabMap; sourceState: DashboardSourceState; }> {
  const seededConfig = loadSeededRegistryConfig();
  const dashboardUrl = getConfiguredDashboardSheetUrl(options.dashboardSheetUrl || options.workspaceUrl || options.classroomUrl);
  const config: SeededRegistryConfig = { ...seededConfig, dashboardDataSourceUrl: dashboardUrl };
  const overrides = getSavedSeededRegistryOverrides();
  const fallbackWarnings: string[] = [];
  const warnings = Array.from(new Set([
    ...getDashboardSourceHealthWarnings(options.dashboardSheetUrl),
    ...getDashboardSourceHealthWarnings(dashboardUrl),
    ...Object.keys(overrides).map((key) => `Saved browser URL overrides app default for ${key}.`)
  ]));

  const readDefinition = async (definition: RegistryDefinition, url: string) => readRegistry(definition, url);
  const readDefinitionWithFallback = async (definition: RegistryDefinition) => {
    const configuredUrl = String(config[definition.key] || "").trim();
    const primary = await readDefinition(definition, configuredUrl);
    const defaultUrl = String(DEFAULT_SEEDED_REGISTRY_CONFIG[definition.key] || "").trim();

    const primaryMissingEverything = !primary.status.connected && primary.status.rowCount === 0 && primary.status.missingTabs.length >= definition.tabs.length;
    const canFallback = Boolean(defaultUrl) && defaultUrl !== configuredUrl;
    if (!primaryMissingEverything || !canFallback) {
      return primary;
    }

    const fallback = await readDefinition(definition, defaultUrl);
    const fallbackHasData = fallback.status.connected || fallback.status.rowCount > 0;
    if (!fallbackHasData) {
      return primary;
    }

    fallbackWarnings.push(`Used the seeded default URL for ${definition.label} because the saved browser override returned no live rows.`);
    return fallback;
  };

  if (!isGoogleSheetsUrl(dashboardUrl)) {
    const baseSourceState = {
      mode: "setup_required" as const,
      sourceLabel: "Setup required - no live data found",
      sourceUrl: dashboardUrl,
      lastSyncedAt: null,
      activeAcademicYearLabel: "",
      warnings: [...warnings, "Configured dashboard source is not a Google Sheets link."],
      setupMessages: ["No dashboard KPI source rows found."],
      registries: [] as DashboardRegistrySourceStatus[],
      localStorageOverrides: overrides
    };
    return {
      tabs: {},
      sourceState: {
        ...baseSourceState,
        registryHealthSummary: buildRegistryHealthSummary(options.roleView, baseSourceState, [])
      }
    };
  }

  const settled = await Promise.allSettled(
    REGISTRY_DEFINITIONS.map(async (definition) => readDefinitionWithFallback(definition))
  );
  const tabs: SheetTabMap = {};
  const registries: DashboardRegistrySourceStatus[] = [];

  settled.forEach((result, index) => {
    const definition = REGISTRY_DEFINITIONS[index];
    if (result.status === "rejected") {
      registries.push({
        key: definition.key,
        label: definition.label,
        url: config[definition.key] || "",
        connected: false,
        missingTabs: definition.tabs,
        emptyTabs: [],
        tabRowCounts: Object.fromEntries(definition.tabs.map((tab) => [tab, 0])),
        tabHeaders: Object.fromEntries(definition.tabs.map((tab) => [tab, []])),
        missingHeaders: Object.fromEntries(definition.tabs.map((tab) => [tab, findMissingRequiredHeaders(tab, [])])),
        duplicatePrimaryIds: {},
        placeholderRows: {},
        invalidDriveReferences: {},
        rowCount: 0,
        lastReadAt: null,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
      });
      return;
    }
    registries.push(result.value.status);
    Object.entries(result.value.tabs).forEach(([tabName, rows]) => addRows(tabs, tabName, rows));
  });

  const totalRows = registries.reduce((sum, registry) => sum + registry.rowCount, 0);
  const setupMessages = setupMessagesFromStatuses(registries);
  const lastReadAt = new Date().toISOString();
  const missingWarnings = registries.flatMap((registry) => [
    ...registry.missingTabs.map((tab) => `${registry.label}: missing or inaccessible tab '${tab}'.`),
    ...registry.emptyTabs.map((tab) => `${registry.label}: empty tab '${tab}'.`),
    ...(registry.error ? [`${registry.label}: ${registry.error}`] : [])
  ]);
  const activeAcademicYearLabel = getActiveAcademicYearLabel(tabs);

  if (totalRows === 0) {
    const baseSourceState = {
      mode: "setup_required" as const,
      sourceLabel: "Setup required - no live data found",
      sourceUrl: dashboardUrl,
      lastSyncedAt: null,
      activeAcademicYearLabel,
      warnings: Array.from(new Set([...warnings, ...fallbackWarnings, ...missingWarnings])),
      setupMessages,
      registries,
      localStorageOverrides: overrides
    };
    return {
      tabs: {},
      sourceState: {
        ...baseSourceState,
        registryHealthSummary: buildRegistryHealthSummary(options.roleView, baseSourceState, registries)
      }
    };
  }

  const baseSourceState = {
    mode: "live" as const,
    sourceLabel: "Live data connected",
    sourceUrl: dashboardUrl,
    lastSyncedAt: lastReadAt,
    activeAcademicYearLabel,
    warnings: Array.from(new Set([...warnings, ...fallbackWarnings, ...missingWarnings])),
    setupMessages,
    registries,
    localStorageOverrides: overrides
  };
  return {
    tabs,
    sourceState: {
      ...baseSourceState,
      registryHealthSummary: buildRegistryHealthSummary(options.roleView, baseSourceState, registries)
    }
  };
}

export async function resolvePrincipalDashboardData(options: LoadDashboardDataOptions = { roleView: "principal" }) {
  const { tabs, sourceState } = await resolveLiveRegistryData(options);
  return { data: buildPrincipalDashboard(tabs, sourceState), sourceState, blueprints: buildBlueprintForRole("principal", tabs) };
}

export async function resolveTeacherDashboardData(options: LoadDashboardDataOptions = { roleView: "teacher" }) {
  const { tabs, sourceState } = await resolveLiveRegistryData(options);
  return { data: buildTeacherDashboard(tabs, sourceState, options), sourceState, blueprints: buildBlueprintForRole("teacher", tabs) };
}

export async function resolveCoordinatorDashboardData(options: LoadDashboardDataOptions = { roleView: "coordinator" }) {
  const { tabs, sourceState } = await resolveLiveRegistryData(options);
  return { data: buildCoordinatorDashboard(tabs, sourceState, options), sourceState, blueprints: buildBlueprintForRole("coordinator", tabs) };
}

export async function resolveManagerDashboardData(options: LoadDashboardDataOptions = { roleView: "manager" }) {
  const { tabs, sourceState } = await resolveLiveRegistryData(options);
  return { data: buildManagerDashboard(tabs, sourceState, options), sourceState, blueprints: buildBlueprintForRole("manager", tabs) };
}

export async function resolveStudentDashboardData(options: LoadDashboardDataOptions = { roleView: "student" }) {
  const { tabs, sourceState } = await resolveLiveRegistryData(options);
  return { data: buildStudentDashboard(tabs, sourceState, options), sourceState, blueprints: buildBlueprintForRole("student", tabs) };
}

export async function resolveExamsDashboardData(options: LoadDashboardDataOptions = { roleView: "exams" }) {
  const { tabs, sourceState } = await resolveLiveRegistryData(options);
  return { data: buildExamsDashboard(tabs, sourceState, options), sourceState, blueprints: buildBlueprintForRole("exams", tabs) };
}

export async function resolveParentDashboardData(options: LoadDashboardDataOptions = { roleView: "parent" }) {
  const { tabs, sourceState } = await resolveLiveRegistryData(options);
  return { data: buildParentDashboard(tabs, sourceState, options), sourceState, blueprints: buildBlueprintForRole("parent", tabs) };
}

export async function resolveHodDashboardData(options: LoadDashboardDataOptions = { roleView: "hod" }) {
  const { tabs, sourceState } = await resolveLiveRegistryData(options);
  return { data: buildHodDashboard(tabs, sourceState, options), sourceState, blueprints: buildBlueprintForRole("coordinator", tabs) };
}

export async function loadDashboardData(options: LoadDashboardDataOptions) {
  const roleView = options.roleView || "all";
  const live = await resolveLiveRegistryData(options);
  const principal = buildPrincipalDashboard(live.tabs);
  const teacher = buildTeacherDashboard(live.tabs, live.sourceState, options);
  const coordinator = buildCoordinatorDashboard(live.tabs, live.sourceState, options);
  const manager = buildManagerDashboard(live.tabs, live.sourceState, options);
  const student = buildStudentDashboard(live.tabs, live.sourceState, options);
  const exams = buildExamsDashboard(live.tabs, live.sourceState, options);
  const parent = buildParentDashboard(live.tabs, live.sourceState, options);
  const hod = buildHodDashboard(live.tabs, live.sourceState, options);
  const blueprints = {
    principal: buildBlueprintForRole("principal", live.tabs),
    teacher: buildBlueprintForRole("teacher", live.tabs),
    coordinator: buildBlueprintForRole("coordinator", live.tabs),
    manager: buildBlueprintForRole("manager", live.tabs),
    hod: buildBlueprintForRole("coordinator", live.tabs),
    student: buildBlueprintForRole("student", live.tabs),
    exams: buildBlueprintForRole("exams", live.tabs),
    parent: buildBlueprintForRole("parent", live.tabs),
    admin: buildBlueprintForRole("principal", live.tabs)
  };
  const data = roleView === "teacher" ? teacher : roleView === "coordinator" ? coordinator : roleView === "manager" ? manager : roleView === "student" ? student : roleView === "exams" ? exams : roleView === "parent" ? parent : roleView === "hod" ? hod : principal;
  return { data, principal, teacher, coordinator, manager, student, exams, parent, hod, blueprints, sourceState: live.sourceState, roleView };
}
