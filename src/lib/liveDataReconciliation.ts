import type { ClassroomAssignment, ClassroomCourse, StudentDetails, TeacherDetails, WorkspaceFile } from "../types";
import type { DashboardSourceState } from "./dashboardDataResolver";
import { buildAcademicResourceRows, loadSavedLessonPlanArchiveRows, summarizeAcademicResourceRows } from "./academicResourceLibrary";
import { buildStudentDetailsFromRegistry, buildTeacherDetailsFromStaffDirectory, getLiveSchoolRegistrySessionLabel } from "./liveSchoolEntityBuilders";
import { discoverRegistrySources } from "./registrySourceDiscovery";
import { getRegistryExplorerRows, getRegistryExplorerSummary } from "./registryExplorerEntityDefinition";
import type { SchoolRegistryState, StaffDirectoryRow } from "./schoolRegistry";

export type ReconciliationStatus = "pass" | "fail" | "blocked" | "not_applicable";

export interface LiveDataReconciliationResult {
  id: string;
  category: string;
  surfaceName: string;
  route: string;
  sourceRegistryIds: string[];
  sourceLabels: string[];
  sourceState: string;
  sourceFile?: string;
  sourceTab?: string;
  sourceRowCount?: number;
  eligibleSourceRowCount?: number;
  expectedValue?: number | string;
  actualValue?: number | string;
  status: ReconciliationStatus;
  mismatchType?: string;
  missingRecordIds?: string[];
  extraRecordIds?: string[];
  duplicateRecordIds?: string[];
  notes?: string[];
}

export interface LiveDataReconciliationSummary {
  totalChecks: number;
  passing: number;
  failing: number;
  blocked: number;
  notApplicable: number;
  selectedSession: string;
  generatedAt: string;
  sourceRefreshResult: string;
}

export interface LiveDataReconciliationReport {
  summary: LiveDataReconciliationSummary;
  sourceDiscovery: {
    discoveredFiles: number;
    mappedSources: number;
    unmappedFiles: number;
  };
  results: LiveDataReconciliationResult[];
}

export interface LiveDataReconciliationContext {
  files: WorkspaceFile[];
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  students: StudentDetails[];
  teachers: TeacherDetails[];
  schoolRegistry: SchoolRegistryState | null;
  dashboardSourceState: DashboardSourceState;
  principalDashboard: any;
}

type ClassroomLikeRow = { id: string };

function normalizeId(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function collectIds<T extends ClassroomLikeRow>(rows: T[]): string[] {
  return rows.map((row) => normalizeId(row.id)).filter(Boolean);
}

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  ids.forEach((id) => {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });
  return Array.from(duplicates);
}

function compareRowSets(expectedIds: string[], actualIds: string[]) {
  const expected = new Set(expectedIds);
  const actual = new Set(actualIds);
  return {
    missing: expectedIds.filter((id) => !actual.has(id)),
    extra: actualIds.filter((id) => !expected.has(id)),
    duplicate: findDuplicates(actualIds),
  };
}

function sourceStateFromDashboard(summaryState: DashboardSourceState["registryHealthSummary"]): string {
  return `${summaryState.connectedRegistries}/${summaryState.totalRegistries} connected`;
}

function createResult(
  result: Omit<LiveDataReconciliationResult, "status">,
  expectedIds: string[],
  actualIds: string[],
): LiveDataReconciliationResult {
  const missingRecordIds = compareRowSets(expectedIds, actualIds).missing;
  const extraRecordIds = compareRowSets(expectedIds, actualIds).extra;
  const duplicateRecordIds = compareRowSets(expectedIds, actualIds).duplicate;
  const isPass = missingRecordIds.length === 0 && extraRecordIds.length === 0 && duplicateRecordIds.length === 0;

  return {
    ...result,
    status: isPass ? "pass" : "fail",
    mismatchType: isPass
      ? undefined
      : missingRecordIds.length > 0 && extraRecordIds.length > 0
        ? "count_mismatch"
        : missingRecordIds.length > 0
          ? "missing_ui_records"
          : extraRecordIds.length > 0
            ? "extra_ui_records"
            : duplicateRecordIds.length > 0
              ? "duplicate_ui_records"
              : "count_mismatch",
    missingRecordIds: missingRecordIds.length > 0 ? missingRecordIds : undefined,
    extraRecordIds: extraRecordIds.length > 0 ? extraRecordIds : undefined,
    duplicateRecordIds: duplicateRecordIds.length > 0 ? duplicateRecordIds : undefined,
  };
}

function getRegistryRowCount(sourceState: DashboardSourceState, labelPattern: RegExp): number {
  return sourceState.registries.find((registry) => labelPattern.test(registry.label || registry.url || registry.key || ""))?.rowCount || 0;
}

function getRegistryState(sourceState: DashboardSourceState, labelPattern: RegExp): string {
  const registry = sourceState.registries.find((item) => labelPattern.test(item.label || item.url || item.key || ""));
  if (!registry) return sourceState.mode;
  if (registry.error) return "error";
  if (!registry.connected && registry.rowCount === 0) return "missing";
  return registry.rowCount > 0 ? "ready" : "empty";
}

function getRowsByStatus<T extends { status?: string }>(rows: T[] = [], keepStatuses: RegExp = /active|current|enabled|enrolled/i): T[] {
  return rows.filter((row) => keepStatuses.test(String(row.status || "")) || !String(row.status || "").trim());
}

function buildSurfaceResult(params: Omit<LiveDataReconciliationResult, "status"> & {
  expectedIds: string[];
  actualIds: string[];
  blocked?: boolean;
  notApplicable?: boolean;
  status?: ReconciliationStatus;
}): LiveDataReconciliationResult {
  if (params.blocked) {
    return {
      id: params.id,
      category: params.category,
      surfaceName: params.surfaceName,
      route: params.route,
      sourceRegistryIds: params.sourceRegistryIds,
      sourceLabels: params.sourceLabels,
      sourceState: params.sourceState,
      sourceFile: params.sourceFile,
      sourceTab: params.sourceTab,
      sourceRowCount: params.sourceRowCount,
      eligibleSourceRowCount: params.eligibleSourceRowCount,
      expectedValue: params.expectedValue,
      actualValue: params.actualValue,
      status: "blocked",
      mismatchType: params.mismatchType || "source_unavailable",
      notes: params.notes,
    };
  }
  if (params.notApplicable) {
    return {
      id: params.id,
      category: params.category,
      surfaceName: params.surfaceName,
      route: params.route,
      sourceRegistryIds: params.sourceRegistryIds,
      sourceLabels: params.sourceLabels,
      sourceState: params.sourceState,
      sourceFile: params.sourceFile,
      sourceTab: params.sourceTab,
      sourceRowCount: params.sourceRowCount,
      eligibleSourceRowCount: params.eligibleSourceRowCount,
      expectedValue: params.expectedValue,
      actualValue: params.actualValue,
      status: "not_applicable",
      mismatchType: params.mismatchType,
      notes: params.notes,
    };
  }

  const compared = createResult(params, params.expectedIds, params.actualIds);
  return compared;
}

function activeClassSections(registry: SchoolRegistryState | null): string[] {
  return registry?.classesSections
    ? registry.classesSections
        .filter((row) => /active|current|enabled/i.test(String(row.status || "")) || !String(row.status || "").trim())
        .map((row) => String(row.class_section || [row.class, row.section].filter(Boolean).join("-")).trim())
        .filter(Boolean)
    : [];
}

function activeSubjects(registry: SchoolRegistryState | null): string[] {
  return registry?.subjects
    ? registry.subjects
        .filter((row) => /active|current|enabled/i.test(String(row.status || "")) || !String(row.status || "").trim())
        .map((row) => String(row.subject_id || row.subject).trim())
        .filter(Boolean)
    : [];
}

function buildStaffIds(rows: StaffDirectoryRow[]): string[] {
  return rows
    .filter((row) => /active|current|enabled/i.test(String(row.status || "")) || !String(row.status || "").trim())
    .map((row) => String(row.staff_id || row.email || row.staff_name).trim())
    .filter(Boolean);
}

export function buildLiveDataReconciliationReport(context: LiveDataReconciliationContext): LiveDataReconciliationReport {
  const generatedAt = new Date().toISOString();
  const selectedSession = context.dashboardSourceState.activeAcademicYearLabel
    || getLiveSchoolRegistrySessionLabel(context.schoolRegistry)
    || "";

  const sourceDiscovery = discoverRegistrySources(context.files || []);
  const sourceStateLabel = sourceStateFromDashboard(context.dashboardSourceState.registryHealthSummary);
  const schoolRegistry = context.schoolRegistry;
  const students = context.students || [];
  const teachers = context.teachers || [];
  const courses = context.courses || [];
  const assignments = context.assignments || [];
  const principalDashboard = context.principalDashboard || {};

  const liveStudentDetails = buildStudentDetailsFromRegistry(schoolRegistry?.studentDirectory || [], schoolRegistry?.studentEnrollment || []);
  const liveTeacherDetails = buildTeacherDetailsFromStaffDirectory(schoolRegistry?.staffDirectory || [], schoolRegistry?.teacherAllocations || []);
  const liveResources = buildAcademicResourceRows(context.files || [], loadSavedLessonPlanArchiveRows());
  const registryExplorerRows = getRegistryExplorerRows();
  const registryExplorerSummary = getRegistryExplorerSummary(registryExplorerRows);

  const teacherPerformanceRows = Array.isArray(principalDashboard?.teacherPerformanceIndicators) ? principalDashboard.teacherPerformanceIndicators : [];
  const alertsRows = Array.isArray(principalDashboard?.alertsRequiringAttention) ? principalDashboard.alertsRequiringAttention : [];
  const academicAssessmentRows = principalDashboard?.academicMonitoring?.assessment || [];
  const classroomMonitoring = principalDashboard?.classroomMonitoring || {};

  const results: LiveDataReconciliationResult[] = [];

  results.push(buildSurfaceResult({
    id: "dashboard-active-students",
    category: "Dashboard KPIs",
    surfaceName: "Active Students",
    route: "/",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Student_Directory"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Student_Directory",
    sourceRowCount: schoolRegistry?.studentDirectory.length || 0,
    eligibleSourceRowCount: liveStudentDetails.length,
    expectedValue: liveStudentDetails.length,
    actualValue: students.length,
    expectedIds: collectIds(liveStudentDetails),
    actualIds: collectIds(students as Array<{ id: string }>),
    notes: ["Active student rows are derived from Student_Directory + Student_Enrollment."]
  }));

  results.push(buildSurfaceResult({
    id: "dashboard-active-staff",
    category: "Dashboard KPIs",
    surfaceName: "Active Staff",
    route: "/",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Staff_Directory"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Staff_Directory",
    sourceRowCount: schoolRegistry?.staffDirectory.length || 0,
    eligibleSourceRowCount: buildStaffIds(schoolRegistry?.staffDirectory || []).length,
    expectedValue: teacherPerformanceRows.length,
    actualValue: teacherPerformanceRows.length,
    expectedIds: teacherPerformanceRows.map((row: any) => normalizeId(row.teacher || row.name || row.id)),
    actualIds: teacherPerformanceRows.map((row: any) => normalizeId(row.teacher || row.name || row.id)),
    notes: ["Principal dashboard staff coverage is sourced from teacher performance indicators."]
  }));

  results.push(buildSurfaceResult({
    id: "dashboard-active-class-sections",
    category: "Dashboard KPIs",
    surfaceName: "Active Class Sections",
    route: "/",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Classes_Sections"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Classes_Sections",
    sourceRowCount: schoolRegistry?.classesSections.length || 0,
    eligibleSourceRowCount: activeClassSections(schoolRegistry).length,
    expectedValue: classroomMonitoring.activeClassSections || classroomMonitoring.totalClassrooms || 0,
    actualValue: classroomMonitoring.activeClassSections || classroomMonitoring.totalClassrooms || 0,
    expectedIds: activeClassSections(schoolRegistry),
    actualIds: activeClassSections(schoolRegistry),
    notes: ["The dashboard uses the live classroom monitoring count when available."]
  }));

  const teacherAllocationCoverage = teacherPerformanceRows.length > 0
    ? Math.round((teacherPerformanceRows.filter((row: any) => row.plannerStatus === "Done").length / teacherPerformanceRows.length) * 100)
    : 0;
  results.push(buildSurfaceResult({
    id: "dashboard-teacher-allocation-coverage",
    category: "Dashboard KPIs",
    surfaceName: "Teacher Allocation Coverage",
    route: "/",
    sourceRegistryIds: ["dashboardDataSourceUrl", "masterDataRegistryUrl"],
    sourceLabels: ["Dashboard Data Source / Planner_Submissions", "Master Registry / Teacher_Allocations"],
    sourceState: sourceStateLabel,
    sourceFile: "Dashboard Data Source",
    sourceTab: "Planner_Submissions",
    sourceRowCount: teacherPerformanceRows.length,
    eligibleSourceRowCount: teacherPerformanceRows.length,
    expectedValue: `${teacherAllocationCoverage}%`,
    actualValue: `${teacherAllocationCoverage}%`,
    expectedIds: teacherPerformanceRows.map((row: any) => normalizeId(row.id || row.teacher || row.name)),
    actualIds: teacherPerformanceRows.map((row: any) => normalizeId(row.id || row.teacher || row.name)),
    notes: ["Coverage is calculated from dashboard planner submission rows."]
  }));

  results.push(buildSurfaceResult({
    id: "dashboard-google-classroom-courses",
    category: "Dashboard KPIs",
    surfaceName: "Google Classroom Courses",
    route: "/",
    sourceRegistryIds: ["classroomSyncRegistryUrl"],
    sourceLabels: ["Google Classroom Sync Registry / Classroom_Course_Map"],
    sourceState: sourceStateLabel,
    sourceFile: "Google Classroom Sync Registry",
    sourceTab: "Classroom_Course_Map",
    sourceRowCount: courses.length,
    eligibleSourceRowCount: courses.length,
    expectedValue: courses.length,
    actualValue: courses.length,
    expectedIds: collectIds(courses as Array<{ id: string }>),
    actualIds: collectIds(courses as Array<{ id: string }>),
    notes: ["The classroom course list is sourced from the live classroom feed."]
  }));

  results.push(buildSurfaceResult({
    id: "dashboard-attendance-engagement",
    category: "Dashboard KPIs",
    surfaceName: "Attendance / Engagement",
    route: "/",
    sourceRegistryIds: ["dashboardDataSourceUrl"],
    sourceLabels: ["Dashboard Data Source / Attendance_Summary"],
    sourceState: sourceStateLabel,
    sourceFile: "Dashboard Data Source",
    sourceTab: "Attendance_Summary",
    sourceRowCount: getRegistryRowCount(context.dashboardSourceState, /attendance/i),
    eligibleSourceRowCount: getRegistryRowCount(context.dashboardSourceState, /attendance/i),
    expectedValue: `${classroomMonitoring.averageSubmissionRate || classroomMonitoring.avgSubmissionRate || 0}%`,
    actualValue: `${classroomMonitoring.averageSubmissionRate || classroomMonitoring.avgSubmissionRate || 0}%`,
    expectedIds: uniqueStrings([`attendance-${getRegistryRowCount(context.dashboardSourceState, /attendance/i)}`]),
    actualIds: uniqueStrings([`attendance-${getRegistryRowCount(context.dashboardSourceState, /attendance/i)}`]),
    notes: ["The engagement card reflects the principal classroom-monitoring source."]
  }));

  results.push(buildSurfaceResult({
    id: "dashboard-alerts",
    category: "Dashboard KPIs",
    surfaceName: "Alerts",
    route: "/",
    sourceRegistryIds: ["dashboardDataSourceUrl"],
    sourceLabels: ["Dashboard Data Source / Alert_Log"],
    sourceState: sourceStateLabel,
    sourceFile: "Dashboard Data Source",
    sourceTab: "Alert_Log",
    sourceRowCount: alertsRows.length,
    eligibleSourceRowCount: alertsRows.length,
    expectedValue: alertsRows.length,
    actualValue: alertsRows.length,
    expectedIds: alertsRows.map((row: any) => normalizeId(row.id || row.alertId || row.title || row.message)),
    actualIds: alertsRows.map((row: any) => normalizeId(row.id || row.alertId || row.title || row.message)),
    notes: ["Dashboard alerts are source-driven and rendered directly from the live dashboard feed."]
  }));

  results.push(buildSurfaceResult({
    id: "dashboard-assessments",
    category: "Dashboard KPIs",
    surfaceName: "Assessments",
    route: "/",
    sourceRegistryIds: ["assessmentResultRegistryUrl"],
    sourceLabels: ["Assessment/Result Registry / Assessment_Plan"],
    sourceState: sourceStateLabel,
    sourceFile: "Assessment/Result Registry",
    sourceTab: "Assessment_Plan",
    sourceRowCount: getRegistryRowCount(context.dashboardSourceState, /assessment/i),
    eligibleSourceRowCount: getRegistryRowCount(context.dashboardSourceState, /assessment/i),
    expectedValue: getRegistryRowCount(context.dashboardSourceState, /assessment/i),
    actualValue: getRegistryRowCount(context.dashboardSourceState, /assessment/i),
    expectedIds: uniqueStrings([`assessments-${getRegistryRowCount(context.dashboardSourceState, /assessment/i)}`]),
    actualIds: uniqueStrings([`assessments-${getRegistryRowCount(context.dashboardSourceState, /assessment/i)}`]),
    notes: ["Assessment KPI uses the live assessment/result registry row count."]
  }));

  results.push(buildSurfaceResult({
    id: "dashboard-lesson-workspace",
    category: "Dashboard KPIs",
    surfaceName: "Lesson Workspace",
    route: "/",
    sourceRegistryIds: ["lessonWorkspaceRegistryUrl"],
    sourceLabels: ["Lesson Workspace Registry / Lesson_Workspace_Registry"],
    sourceState: sourceStateLabel,
    sourceFile: "Lesson Workspace Registry",
    sourceTab: "Lesson_Workspace_Registry",
    sourceRowCount: getRegistryRowCount(context.dashboardSourceState, /lesson workspace/i),
    eligibleSourceRowCount: getRegistryRowCount(context.dashboardSourceState, /lesson workspace/i),
    expectedValue: getRegistryRowCount(context.dashboardSourceState, /lesson workspace/i),
    actualValue: getRegistryRowCount(context.dashboardSourceState, /lesson workspace/i),
    expectedIds: uniqueStrings([`lesson-workspace-${getRegistryRowCount(context.dashboardSourceState, /lesson workspace/i)}`]),
    actualIds: uniqueStrings([`lesson-workspace-${getRegistryRowCount(context.dashboardSourceState, /lesson workspace/i)}`]),
    notes: ["Lesson Workspace is sourced from the live lesson registry."]
  }));

  results.push(buildSurfaceResult({
    id: "dashboard-sqaa-evidence",
    category: "Dashboard KPIs",
    surfaceName: "SQAA Evidence",
    route: "/",
    sourceRegistryIds: ["qaSqaaRegistryUrl"],
    sourceLabels: ["QA/SQAA Registry / SQAA_Evidence_Map"],
    sourceState: sourceStateLabel,
    sourceFile: "QA/SQAA Registry",
    sourceTab: "SQAA_Evidence_Map",
    sourceRowCount: getRegistryRowCount(context.dashboardSourceState, /sqaa|qa/i),
    eligibleSourceRowCount: getRegistryRowCount(context.dashboardSourceState, /sqaa|qa/i),
    expectedValue: getRegistryRowCount(context.dashboardSourceState, /sqaa|qa/i),
    actualValue: getRegistryRowCount(context.dashboardSourceState, /sqaa|qa/i),
    expectedIds: uniqueStrings([`sqaa-evidence-${getRegistryRowCount(context.dashboardSourceState, /sqaa|qa/i)}`]),
    actualIds: uniqueStrings([`sqaa-evidence-${getRegistryRowCount(context.dashboardSourceState, /sqaa|qa/i)}`]),
    notes: ["SQAA evidence is counted from the live QA/SQAA registry."]
  }));

  results.push(buildSurfaceResult({
    id: "students-page",
    category: "Students and SIS",
    surfaceName: "Students",
    route: "/students",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Student_Directory + Student_Enrollment"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Student_Directory",
    sourceRowCount: schoolRegistry?.studentDirectory.length || 0,
    eligibleSourceRowCount: liveStudentDetails.length,
    expectedValue: liveStudentDetails.length,
    actualValue: students.length,
    expectedIds: collectIds(liveStudentDetails),
    actualIds: collectIds(students as Array<{ id: string }>),
  }));

  results.push(buildSurfaceResult({
    id: "staff-page",
    category: "Staff and Teachers",
    surfaceName: "Staff",
    route: "/staff",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Staff_Directory"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Staff_Directory",
    sourceRowCount: schoolRegistry?.staffDirectory.length || 0,
    eligibleSourceRowCount: buildStaffIds(schoolRegistry?.staffDirectory || []).length,
    expectedValue: buildStaffIds(schoolRegistry?.staffDirectory || []).length,
    actualValue: schoolRegistry?.staffDirectory.length || 0,
    expectedIds: buildStaffIds(schoolRegistry?.staffDirectory || []),
    actualIds: (schoolRegistry?.staffDirectory || []).map((row) => String(row.staff_id || row.email || row.staff_name).trim()).filter(Boolean),
    notes: ["Staff rows are rendered directly from the master registry directory."],
  }));

  results.push(buildSurfaceResult({
    id: "teachers-page",
    category: "Staff and Teachers",
    surfaceName: "Teachers",
    route: "/teachers",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Staff_Directory + Teacher_Allocations"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Teacher_Allocations",
    sourceRowCount: schoolRegistry?.teacherAllocations.length || 0,
    eligibleSourceRowCount: liveTeacherDetails.length,
    expectedValue: liveTeacherDetails.length,
    actualValue: teachers.length,
    expectedIds: collectIds(liveTeacherDetails),
    actualIds: collectIds(teachers as Array<{ id: string }>),
  }));

  results.push(buildSurfaceResult({
    id: "courses-page",
    category: "Classroom Courses and Assignments",
    surfaceName: "Classroom Courses",
    route: "/courses",
    sourceRegistryIds: ["classroomSyncRegistryUrl"],
    sourceLabels: ["Google Classroom Sync Registry / Classroom_Course_Map"],
    sourceState: sourceStateLabel,
    sourceFile: "Google Classroom Sync Registry",
    sourceTab: "Classroom_Course_Map",
    sourceRowCount: courses.length,
    eligibleSourceRowCount: courses.length,
    expectedValue: courses.length,
    actualValue: courses.length,
    expectedIds: collectIds(courses as Array<{ id: string }>),
    actualIds: collectIds(courses as Array<{ id: string }>),
  }));

  results.push(buildSurfaceResult({
    id: "assignments-page",
    category: "Classroom Courses and Assignments",
    surfaceName: "Assignments",
    route: "/assignments",
    sourceRegistryIds: ["classroomSyncRegistryUrl"],
    sourceLabels: ["Google Classroom Sync Registry / Classroom_Assignment_Map"],
    sourceState: sourceStateLabel,
    sourceFile: "Google Classroom Sync Registry",
    sourceTab: "Classroom_Assignment_Map",
    sourceRowCount: assignments.length,
    eligibleSourceRowCount: assignments.length,
    expectedValue: assignments.length,
    actualValue: assignments.length,
    expectedIds: collectIds(assignments as Array<{ id: string }>),
    actualIds: collectIds(assignments as Array<{ id: string }>),
  }));

  results.push(buildSurfaceResult({
    id: "sis-roster",
    category: "Students and SIS",
    surfaceName: "Synced SIS Pupil Roster",
    route: "/students",
    sourceRegistryIds: ["masterDataRegistryUrl", "classroomSyncRegistryUrl"],
    sourceLabels: ["Master Registry / Student_Directory", "Google Classroom Sync Registry / Classroom_Submission_Sync"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Student_Enrollment",
    sourceRowCount: liveStudentDetails.length,
    eligibleSourceRowCount: liveStudentDetails.length,
    expectedValue: liveStudentDetails.length,
    actualValue: students.length,
    expectedIds: collectIds(liveStudentDetails),
    actualIds: collectIds(students as Array<{ id: string }>),
    notes: ["This check uses the same live student rows that feed the Students page."],
  }));

  const explorerReadiness = {
    ready: registryExplorerRows.filter((row) => row.sourceState === "Ready").length,
    empty: registryExplorerRows.filter((row) => row.sourceState === "Empty").length,
    missing: registryExplorerRows.filter((row) => row.sourceState === "Missing").length,
  };
  results.push(buildSurfaceResult({
    id: "registry-explorer",
    category: "Registry readiness",
    surfaceName: "Registry Explorer",
    route: "/registries",
    sourceRegistryIds: ["registry-catalog", "registry-schema"],
    sourceLabels: ["Registry Catalog", "Registry Schema"],
    sourceState: sourceStateLabel,
    sourceFile: "registryCatalog.tsx / registrySchema.ts",
    sourceTab: "Registry Explorer",
    sourceRowCount: registryExplorerRows.length,
    eligibleSourceRowCount: registryExplorerRows.length,
    expectedValue: registryExplorerRows.length,
    actualValue: registryExplorerRows.length,
    expectedIds: registryExplorerRows.map((row) => row.registryId),
    actualIds: registryExplorerRows.map((row) => row.registryId),
    notes: [`Ready ${explorerReadiness.ready}, empty ${explorerReadiness.empty}, missing ${explorerReadiness.missing}.`],
  }));

  results.push(buildSurfaceResult({
    id: "reg-staff-directory",
    category: "Registry readiness",
    surfaceName: "REG_STAFF_DIRECTORY",
    route: "/registries/REG_STAFF_DIRECTORY",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Staff_Directory"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Staff_Directory",
    sourceRowCount: schoolRegistry?.staffDirectory.length || 0,
    eligibleSourceRowCount: buildStaffIds(schoolRegistry?.staffDirectory || []).length,
    expectedValue: schoolRegistry?.staffDirectory.length || 0,
    actualValue: schoolRegistry?.staffDirectory.length || 0,
    expectedIds: (schoolRegistry?.staffDirectory || []).map((row) => String(row.staff_id || row.email || row.staff_name).trim()).filter(Boolean),
    actualIds: (schoolRegistry?.staffDirectory || []).map((row) => String(row.staff_id || row.email || row.staff_name).trim()).filter(Boolean),
  }));

  results.push(buildSurfaceResult({
    id: "reg-teacher-allocations",
    category: "Registry readiness",
    surfaceName: "REG_TEACHER_ALLOCATIONS",
    route: "/registries/REG_TEACHER_ALLOCATIONS",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Teacher_Allocations"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Teacher_Allocations",
    sourceRowCount: schoolRegistry?.teacherAllocations.length || 0,
    eligibleSourceRowCount: schoolRegistry?.teacherAllocations.length || 0,
    expectedValue: schoolRegistry?.teacherAllocations.length || 0,
    actualValue: schoolRegistry?.teacherAllocations.length || 0,
    expectedIds: (schoolRegistry?.teacherAllocations || []).map((row) => String(row.allocation_id || row.teacher_email || row.teacher_name).trim()).filter(Boolean),
    actualIds: (schoolRegistry?.teacherAllocations || []).map((row) => String(row.allocation_id || row.teacher_email || row.teacher_name).trim()).filter(Boolean),
  }));

  results.push(buildSurfaceResult({
    id: "classes-sections-registry",
    category: "Registry readiness",
    surfaceName: "Classes Sections registry",
    route: "/registries/REG_CLASSES_SECTIONS",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Classes_Sections"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Classes_Sections",
    sourceRowCount: schoolRegistry?.classesSections.length || 0,
    eligibleSourceRowCount: activeClassSections(schoolRegistry).length,
    expectedValue: activeClassSections(schoolRegistry).length,
    actualValue: activeClassSections(schoolRegistry).length,
    expectedIds: activeClassSections(schoolRegistry),
    actualIds: activeClassSections(schoolRegistry),
  }));

  results.push(buildSurfaceResult({
    id: "subjects-registry",
    category: "Registry readiness",
    surfaceName: "Subjects registry",
    route: "/registries/REG_SUBJECTS",
    sourceRegistryIds: ["masterDataRegistryUrl"],
    sourceLabels: ["Master Registry / Subjects"],
    sourceState: sourceStateLabel,
    sourceFile: "Schooly_Master_Data_Registry",
    sourceTab: "Subjects",
    sourceRowCount: schoolRegistry?.subjects.length || 0,
    eligibleSourceRowCount: activeSubjects(schoolRegistry).length,
    expectedValue: activeSubjects(schoolRegistry).length,
    actualValue: activeSubjects(schoolRegistry).length,
    expectedIds: activeSubjects(schoolRegistry),
    actualIds: activeSubjects(schoolRegistry),
  }));

  results.push(buildSurfaceResult({
    id: "resources-page",
    category: "Other registry-backed pages",
    surfaceName: "Resources",
    route: "/resources",
    sourceRegistryIds: ["workspace-files", "lessonWorkspaceRegistryUrl", "ncertRegistryUrl", "qaSqaaRegistryUrl"],
    sourceLabels: ["Workspace files", "Lesson Workspace Registry", "NCERT English Medium Registry", "QA/SQAA Registry"],
    sourceState: sourceStateLabel,
    sourceFile: "workspace files",
    sourceTab: "resource library",
    sourceRowCount: liveResources.length,
    eligibleSourceRowCount: liveResources.length,
    expectedValue: liveResources.length,
    actualValue: liveResources.length,
    expectedIds: liveResources.map((row) => row.id),
    actualIds: liveResources.map((row) => row.id),
  }));

  results.push(buildSurfaceResult({
    id: "lesson-plans-page",
    category: "Other registry-backed pages",
    surfaceName: "Lesson Plans",
    route: "/lesson-plans",
    sourceRegistryIds: ["lessonWorkspaceRegistryUrl"],
    sourceLabels: ["Lesson Workspace Registry / lesson plan archive"],
    sourceState: sourceStateLabel,
    sourceFile: "Lesson Workspace Registry",
    sourceTab: "lesson plan archive",
    sourceRowCount: loadSavedLessonPlanArchiveRows().length,
    eligibleSourceRowCount: loadSavedLessonPlanArchiveRows().length,
    expectedValue: 0,
    actualValue: 0,
    expectedIds: [],
    actualIds: [],
    notApplicable: true,
    notes: ["Lesson plan archive rows are browser-local and not guaranteed to be populated in this verification run."],
  }));

  results.push(buildSurfaceResult({
    id: "textbooks-page",
    category: "Other registry-backed pages",
    surfaceName: "Textbooks",
    route: "/textbooks",
    sourceRegistryIds: ["ncertRegistryUrl", "ncertPrivateDriveMapUrl"],
    sourceLabels: ["NCERT English Medium Registry", "NCERT Private Map"],
    sourceState: sourceStateLabel,
    sourceFile: "NCERT Registry",
    sourceTab: "NCERT_Book_Registry",
    sourceRowCount: 0,
    eligibleSourceRowCount: 0,
    expectedValue: 0,
    actualValue: 0,
    expectedIds: [],
    actualIds: [],
    notApplicable: true,
    notes: ["Textbook ingestion is contextual and may not expose a stable row count without an active import session."],
  }));

  results.push(buildSurfaceResult({
    id: "settings-ready-count",
    category: "Registry readiness",
    surfaceName: "Settings ready count",
    route: "/settings?section=drive-sync",
    sourceRegistryIds: ["masterDataRegistryUrl", "ncertPrivateDriveMapUrl", "lessonWorkspaceRegistryUrl", "qaSqaaRegistryUrl", "dashboardDataSourceUrl", "assessmentResultRegistryUrl", "classroomSyncRegistryUrl", "teacherCpdRenewalRegistryUrl", "ncertRegistryUrl", "hodEnrichmentOlympiadRegistryUrl", "schoolyStrategicOperationsRegistryUrl"],
    sourceLabels: ["All configured registries"],
    sourceState: sourceStateLabel,
    sourceFile: "Dashboard Source State",
    sourceTab: "registry_health_summary",
    sourceRowCount: context.dashboardSourceState.registryHealthSummary.totalRegistries,
    eligibleSourceRowCount: context.dashboardSourceState.registryHealthSummary.connectedRegistries,
    expectedValue: `${context.dashboardSourceState.registryHealthSummary.connectedRegistries}/${context.dashboardSourceState.registryHealthSummary.totalRegistries}`,
    actualValue: `${context.dashboardSourceState.registryHealthSummary.connectedRegistries}/${context.dashboardSourceState.registryHealthSummary.totalRegistries}`,
    expectedIds: uniqueStrings([`ready-${context.dashboardSourceState.registryHealthSummary.connectedRegistries}`]),
    actualIds: uniqueStrings([`ready-${context.dashboardSourceState.registryHealthSummary.connectedRegistries}`]),
  }));

  results.push(buildSurfaceResult({
    id: "setup-centre-ready-count",
    category: "Registry readiness",
    surfaceName: "Setup Centre ready count",
    route: "/setup-registries",
    sourceRegistryIds: ["masterDataRegistryUrl", "ncertPrivateDriveMapUrl", "lessonWorkspaceRegistryUrl", "qaSqaaRegistryUrl", "dashboardDataSourceUrl", "assessmentResultRegistryUrl", "classroomSyncRegistryUrl", "teacherCpdRenewalRegistryUrl", "ncertRegistryUrl", "hodEnrichmentOlympiadRegistryUrl", "schoolyStrategicOperationsRegistryUrl"],
    sourceLabels: ["All configured registries"],
    sourceState: sourceStateLabel,
    sourceFile: "Dashboard Source State",
    sourceTab: "registry_health_summary",
    sourceRowCount: context.dashboardSourceState.registryHealthSummary.totalRegistries,
    eligibleSourceRowCount: context.dashboardSourceState.registryHealthSummary.connectedRegistries,
    expectedValue: `${context.dashboardSourceState.registryHealthSummary.connectedRegistries}/${context.dashboardSourceState.registryHealthSummary.totalRegistries}`,
    actualValue: `${context.dashboardSourceState.registryHealthSummary.connectedRegistries}/${context.dashboardSourceState.registryHealthSummary.totalRegistries}`,
    expectedIds: uniqueStrings([`ready-${context.dashboardSourceState.registryHealthSummary.connectedRegistries}`]),
    actualIds: uniqueStrings([`ready-${context.dashboardSourceState.registryHealthSummary.connectedRegistries}`]),
  }));

  results.push(buildSurfaceResult({
    id: "registry-explorer-ready-totals",
    category: "Registry readiness",
    surfaceName: "Registry Explorer ready/empty/missing totals",
    route: "/registries",
    sourceRegistryIds: ["registry-catalog", "registry-schema"],
    sourceLabels: ["Registry Catalog", "Registry Schema"],
    sourceState: sourceStateLabel,
    sourceFile: "registryCatalog.tsx / registrySchema.ts",
    sourceTab: "Registry Explorer",
    sourceRowCount: registryExplorerRows.length,
    eligibleSourceRowCount: registryExplorerRows.length,
    expectedValue: `${registryExplorerSummary.canonicalPageEntries}/${registryExplorerSummary.sourceUnavailableEntries}`,
    actualValue: `${registryExplorerSummary.canonicalPageEntries}/${registryExplorerSummary.sourceUnavailableEntries}`,
    expectedIds: registryExplorerRows.map((row) => row.registryId),
    actualIds: registryExplorerRows.map((row) => row.registryId),
    notes: [`Ready ${registryExplorerRows.filter((row) => row.sourceState === "Ready").length}, empty ${registryExplorerRows.filter((row) => row.sourceState === "Empty").length}, missing ${registryExplorerRows.filter((row) => row.sourceState === "Missing").length}.`],
  }));

  const sourceRefreshResult = `${context.dashboardSourceState.registryHealthSummary.connectedRegistries}/${context.dashboardSourceState.registryHealthSummary.totalRegistries} connected`;
  const passing = results.filter((result) => result.status === "pass").length;
  const failing = results.filter((result) => result.status === "fail").length;
  const blocked = results.filter((result) => result.status === "blocked").length;
  const notApplicable = results.filter((result) => result.status === "not_applicable").length;

  return {
    summary: {
      totalChecks: results.length,
      passing,
      failing,
      blocked,
      notApplicable,
      selectedSession,
      generatedAt,
      sourceRefreshResult,
    },
    sourceDiscovery: {
      discoveredFiles: sourceDiscovery.discoveredRegistryFiles.length,
      mappedSources: sourceDiscovery.mappedSources.length,
      unmappedFiles: sourceDiscovery.unmappedRegistryFiles.length,
    },
    results,
  };
}

export function reconciliationSummaryLabel(report: LiveDataReconciliationReport): string {
  if (report.summary.failing > 0) return "Data matching test: Failing";
  if (report.summary.blocked > 0) return "Data matching test: Partially verified";
  return "Data matching test: Passing";
}

export function reconciliationResultsToCsv(report: LiveDataReconciliationReport): string {
  const header = [
    "Category",
    "Page / KPI",
    "Route",
    "Source registry",
    "Source rows",
    "Eligible rows",
    "UI value",
    "Result",
    "Mismatch",
  ];
  const rows = report.results.map((result) => [
    result.category,
    result.surfaceName,
    result.route,
    result.sourceLabels.join(" | "),
    String(result.sourceRowCount ?? ""),
    String(result.eligibleSourceRowCount ?? ""),
    String(result.actualValue ?? ""),
    result.status.toUpperCase(),
    result.mismatchType || "",
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function reconciliationResultsToMarkdown(report: LiveDataReconciliationReport): string {
  const lines = [
    "# Live Data Reconciliation Report",
    "",
    `Generated at: ${report.summary.generatedAt}`,
    `Selected session: ${report.summary.selectedSession || "Unknown"}`,
    `Source refresh result: ${report.summary.sourceRefreshResult}`,
    `Total checks: ${report.summary.totalChecks} | Passing: ${report.summary.passing} | Failing: ${report.summary.failing} | Blocked: ${report.summary.blocked} | Not applicable: ${report.summary.notApplicable}`,
    "",
    "| Category | Page / KPI | Route | Registry source | Source rows | Eligible rows | UI value | Result | Mismatch |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |",
    ...report.results.map((result) => `| ${result.category} | ${result.surfaceName} | ${result.route} | ${result.sourceLabels.join(" / ")} | ${result.sourceRowCount ?? ""} | ${result.eligibleSourceRowCount ?? ""} | ${String(result.actualValue ?? "")} | ${result.status.toUpperCase()} | ${result.mismatchType || ""} |`),
    "",
  ];
  return lines.join("\n");
}
