import React, { useState, useEffect } from "react";
import { 
  WorkspaceFile, 
  ClassroomCourse, 
  TaskItem, 
  StudentDetails,
  TeacherPerformanceIndicator,
  MonitoringFormFeed,
  TeacherDashboardData,
  TeacherDashboardSourceReference,
  CoordinatorDashboardData,
  HodDashboardData,
  ManagerDashboardData,
  ExaminationDashboardData,
  ParentDashboardData,
  StudentDashboardData,
  StudentDashboardTask,
  StudentTimetableItem
} from "../types";
import { 
  FileText, 
  Calendar, 
  GraduationCap, 
  CheckSquare, 
  AlertTriangle, 
  Star, 
  RefreshCw, 
  ChevronRight, 
  ShieldAlert,
  ArrowUpRight,
  Database,
  Search,
  X,
  Filter,
  MoreVertical,
  BarChart2,
  Download,
  ArrowRight,
  Edit3,
  Settings,
  ChevronDown,
  Sliders,
  Bell,
  Clock,
  ExternalLink,
  BookOpen,
  Briefcase,
  Plus,
  Check,
  Send,
  UserCheck,
  Award,
  LayoutGrid,
  FolderOpen,
  Users
} from "lucide-react";

import { 
  loadActiveMetadata, 
  ExportableSchoolySchema, 
  Capability 
} from "../lib/schemaEngine";
import { loadDashboardData, DashboardSourceState, DashboardBlueprintCard, DashboardRegistrySourceStatus } from "../lib/dashboardDataResolver";
import { DEFAULT_DASHBOARD_SHEET_URL } from "../lib/dashboardConfig";
import { DASHBOARD_ROLE_TITLES, getDashboardRoleCards, toDashboardCardModel, type DashboardCardModel, type DashboardRoleKey, type DashboardRoleCardDefinition } from "../lib/dashboardRoleCards";
import { compareClassLabels, formatClassLabel } from "../lib/classSort";
import { resetSavedRegistryUrlsToDefaults } from "../lib/seededRegistryConfig";
import { BootstrapDestinationPreview, BootstrapProposedRow, bootstrapPreviewToCsv, buildRegistryBootstrapPreview } from "../lib/registryBootstrapPreview";
import { applyRegistryBootstrapWriteback, BootstrapWritebackProgress, BootstrapWritebackResult } from "../lib/registryBootstrapWriteback";
import { isSafeFirstBatchTab, normalizeHeaderForComparison } from "../lib/registrySchema";
import { clearGoogleSheetReadCache } from "../lib/googleSheetRead";
import {
  connectGoogleWorkspaceWriteAccess,
  disconnectGoogleWorkspaceAccess,
  getGoogleWorkspaceAccessToken,
  getGoogleWorkspaceAuthState,
  GOOGLE_WORKSPACE_AUTH_STATE_CHANGED_EVENT
} from "../lib/googleWorkspaceAuth";


const EMPTY_REGISTRY_HEALTH_SUMMARY = {
  totalRegistries: 0,
  connectedRegistries: 0,
  warningRegistries: 0,
  criticalRegistries: 0,
  onboardingStatus: "Setup incomplete",
  lastSyncAt: null,
  nextRequiredAction: "Open Setup Centre",
  primaryIssue: "No live data rows were found.",
  canOpenSetupCentre: true,
  sourceHealthRows: []
};

export const teacherPerformanceData: TeacherPerformanceIndicator[] = [];
export const monitoringFormsData: MonitoringFormFeed[] = [];

// Live dashboard placeholders stay empty until registry rows are available.
export const COORDINATOR_DASHBOARD_SEED = {
  remedialStudents: [],
  classroomActivity: [],
  inactiveSections: []
};

// Seeded Structured Principal Dashboard Data Contract (SDOS-23 compliant)
export const PRINCIPAL_DASHBOARD_SEED = {
  academicMonitoring: {
    planner: [],
    syllabus: [],
    assessment: [],
    summaryLabelText: {
      planner: "Weekly planner submission rate this week",
      syllabus: "Syllabus tracking progress across grade levels",
      assessment: "Term assessments and diagnostics on-time status"
    }
  },
  classroomMonitoring: {
    totalClassrooms: 0,
    postedThisWeek: 0,
    zeroActivityThisWeek: 0,
    assignmentsCreatedThisWeek: 0,
    averageSubmissionRate: 0,
    meetSessionsHeldThisWeek: 0
  },
  compliance: {
    items: []
  }
};

const EMPTY_PRINCIPAL_DASHBOARD = {
  academicMonitoring: {
    stages: [],
    syllabus: [],
    assessment: []
  },
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
  compliance: {
    categories: [],
    overall: 0
  },
  teacherPerformanceIndicators: [],
  monitoringFormsDataFeeds: [],
  alertsRequiringAttention: [],
  remedialRisk: []
};

const EMPTY_TEACHER_DASHBOARD: TeacherDashboardData = {
  header: {
    initials: "",
    name: "",
    label: "Teacher",
    subject: "",
    classes: [],
    academicSession: "",
    source: { workbook: "Master Registry", tab: "Staff_Directory", rowCount: 0, lastSyncedAt: null }
  },
  kpis: [],
  timetable: [],
  pendingTasks: [],
  quickLinks: [],
  classPerformance: [],
  classroomActivity: [],
  assessmentTracking: [],
  invigilationDuty: null,
  renewalStatus: {
    configured: false,
    title: "My renewal status",
    message: "Teacher CPD renewal registry is not configured.",
    statusLabel: "Setup incomplete"
  },
  announcements: [],
  sourceHealth: [],
  setupState: {
    status: "setup_required",
    title: "Teacher dashboard setup incomplete",
    message: "Teacher could not be resolved from live data.",
    messages: []
  }
};

const EMPTY_COORDINATOR_DASHBOARD: CoordinatorDashboardData = {
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
  plannerStatusMatrix: {
    headers: ["Class / Section", "Planner", "Notebook", "Assessment", "Classroom", "Attendance"],
    rows: []
  },
  syllabusCoverage: [],
  remedialTracking: [],
  classroomActivity: [],
  assessmentTracking: [],
  announcements: [],
  invigilationDuty: {
    configured: false,
    title: "Invigilation & olympiads",
    message: "Invigilation/Olympiad duty registry not configured.",
    statusLabel: "Setup incomplete"
  },
  renewalStatus: {
    configured: false,
    title: "Renewal / compliance status",
    message: "Teacher CPD renewal registry is not configured.",
    statusLabel: "Setup incomplete"
  },
  sourceHealth: [],
  setupState: {
    status: "setup_required",
    title: "Coordinator dashboard setup incomplete",
    message: "Coordinator could not be resolved from live data.",
    messages: []
  }
};

const EMPTY_HOD_DASHBOARD: HodDashboardData = {
  hodProfile: {
    initials: "",
    name: "",
    departmentLabel: "HOD scope not configured.",
    academicSession: "",
    subjectArea: "",
    classRange: "",
    activeTeacherCount: "0",
    source: { workbook: "Master Registry", tab: "Staff_Directory", rowCount: 0, lastSyncedAt: null }
  },
  kpis: [],
  repositoryHealthByClass: [],
  teacherActivity: [],
  assessmentTracking: [],
  enrichmentOlympiad: {
    configured: false,
    title: "Enrichment and Olympiads",
    message: "Schooly_Enrichment_Olympiad_Registry is not configured.",
    statusLabel: "Setup incomplete"
  },
  remedialStatus: [],
  announcements: [],
  complianceAlerts: [],
  sourceHealth: [],
  setupState: {
    status: "setup_required",
    title: "HOD dashboard setup incomplete",
    message: "HOD could not be resolved from live data.",
    messages: []
  }
};

const EMPTY_MANAGER_DASHBOARD: ManagerDashboardData = {
  profile: {
    initials: "",
    name: "",
    roleLabel: "School Manager",
    academicSession: "",
    oversightLabel: "Operational oversight",
    performanceLabel: "Performance review pending",
    source: { workbook: "Master Registry", tab: "Staff_Directory", rowCount: 0, lastSyncedAt: null }
  },
  kpis: [],
  operationalMetrics: [],
  complianceChecklist: [],
  announcements: [],
  sourceHealth: [],
  setupState: {
    status: "setup_required",
    title: "Manager dashboard setup required",
    message: "Manager could not be resolved from live data.",
    messages: []
  }
};

const EMPTY_STUDENT_DASHBOARD: StudentDashboardData = {
  header: {
    initials: "",
    name: "",
    label: "Student Portal",
    className: "",
    section: "",
    academicSession: "",
    source: { workbook: "Master Registry", tab: "Student_Directory", rowCount: 0, lastSyncedAt: null }
  },
  kpis: [],
  tasks: [],
  timetable: [],
  resources: [],
  announcements: [],
  sourceHealth: [],
  setupState: {
    status: "setup_required",
    title: "Student dashboard setup required",
    message: "Student could not be resolved from live data.",
    messages: []
  }
};

const EMPTY_EXAMS_DASHBOARD: ExaminationDashboardData = {
  header: {
    initials: "",
    name: "",
    label: "Examination Chair",
    boardScope: "Boards Cell",
    gradeScope: "Grade Audit Authority",
    academicSession: "",
    source: { workbook: "Assessment / Result Registry", tab: "Assessment_Plan", rowCount: 0, lastSyncedAt: null }
  },
  kpis: [],
  boardSubjectStats: [],
  verificationItems: [],
  announcements: [],
  sourceHealth: [],
  setupState: {
    status: "setup_required",
    title: "Examination chair dashboard setup required",
    message: "Examination chair could not be resolved from live data.",
    messages: []
  }
};

const EMPTY_PARENT_DASHBOARD: ParentDashboardData = {
  header: {
    initials: "",
    name: "",
    label: "Parent Representative",
    committeeLabel: "Parent Advisory Committee",
    liaisonLabel: "Liaison Officer",
    academicSession: "",
    source: { workbook: "Master Registry", tab: "Staff_Directory", rowCount: 0, lastSyncedAt: null }
  },
  kpis: [],
  notices: [],
  safetyItems: [],
  advisoryTickets: [],
  sourceHealth: [],
  setupState: {
    status: "setup_required",
    title: "Parent dashboard setup required",
    message: "Parent liaison could not be resolved from live data.",
    messages: []
  }
};

function parseDashboardDateValue(value: string): Date | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const literalMatch = raw.match(/^Date\((\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})(?:\s*,.*)?\)$/i);
  const parsed = literalMatch
    ? new Date(Number(literalMatch[1]), Number(literalMatch[2]), Number(literalMatch[3]))
    : new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDashboardDateValue(value: string): string {
  const raw = String(value || "").trim();
  const parsed = parseDashboardDateValue(raw);
  if (!parsed) return raw;
  return `${String(parsed.getDate()).padStart(2, "0")}-${parsed.toLocaleString("en-US", { month: "short" })}-${String(parsed.getFullYear()).slice(-2)}`;
}

function formatTeacherDashboardDate(value: string): string {
  return formatDashboardDateValue(value);
}
function formatTeacherDashboardDateTime(value: string): string {
  return formatDashboardDateValue(value);
}

function formatTeacherDashboardSource(source?: TeacherDashboardSourceReference | null): string {
  if (!source) return "Registry pending";
  return `From ${source.tab}`;
}

interface DashboardOverviewProps {
  files: WorkspaceFile[];
  courses: ClassroomCourse[];
  tasks: TaskItem[];
  students: StudentDetails[];
  currentUser: string;
  currentRole: string;
  onSelectFile: (file: WorkspaceFile) => void;
  onToggleFavorite: (id: string) => void;
  onToggleTab: (tab: string) => void;
  schema?: ExportableSchoolySchema;
  schemaDrivenRendering?: boolean;
  activeRoles?: string[];
  isWorkspaceMock?: boolean;
  onConfigureWorkspace?: () => void;
  onEditWorkspaceConnection?: () => void;
  isWorkspaceConnectionChecking?: boolean;
  onTestWorkspaceConnection?: (workspaceUrl: string) => void;
  onDisconnectWorkspace?: () => void;
  workspaceConnectionTestResult?: { success: boolean; message: string } | null;
  registryRefreshVersion?: number;
  workspaceUrl?: string;
  activeAcademicYearLabel?: string;
  academicYearOptions?: string[];
  onAcademicYearChange?: (academicYearLabel: string) => void;
  onOpenRegistryDataRoute?: (registryId: string) => void;
  dashboardView?: "overview" | "role-cards" | "registers" | "settings" | "data-source" | "setup" | "setup-registries" | "registry-detail";
}

export default function DashboardOverview({
  files,
  courses,
  tasks,
  students,
  currentUser,
  currentRole,
  onSelectFile,
  onToggleFavorite,
  onToggleTab,
  schema,
  schemaDrivenRendering = false,
  activeRoles = ["School Admin"],
  isWorkspaceMock = false,
  onConfigureWorkspace,
  onEditWorkspaceConnection,
  isWorkspaceConnectionChecking = false,
  onTestWorkspaceConnection,
  onDisconnectWorkspace,
  workspaceConnectionTestResult,
  registryRefreshVersion = 0,
  workspaceUrl,
  activeAcademicYearLabel = "",
  academicYearOptions = [],
  onAcademicYearChange,
  onOpenRegistryDataRoute,
  dashboardView = "overview"
}: DashboardOverviewProps) {
  // Widget capability & role verification helper (Phase 4 dynamic permission binding)
  const isWidgetAuthorized = (widgetId: string): boolean => {
    if (!schemaDrivenRendering || !schema) return true;
    
    const widgetDef = schema.widgets.find(w => w.id === widgetId);
    if (!widgetDef) return true;
    if (!widgetDef.defaultVisible) return false;
    
    const combinedCapabilities = new Set<string>();
    activeRoles.forEach(r => {
      const rDef = schema.roles.find(role => role.roleName === r || role.roleId === r);
      if (rDef) {
        rDef.capabilities.forEach(cap => combinedCapabilities.add(cap));
      }
    });

    if (widgetDef.permissions?.capabilities) {
      if (combinedCapabilities.has("Administration") || combinedCapabilities.has("Governance")) {
        return true;
      }
      return widgetDef.permissions.capabilities.some(cap => combinedCapabilities.has(cap));
    }
    return true;
  };
  const [productivityTip, setProductivityTip] = useState<string>("Use the AI Assistant to map active guidelines against core study areas or draft student rosters.");

  // Google Drive connection status tester states
  const [testingDriveConnection, setTestingDriveConnection] = useState(false);
  const [driveConnectionResult, setDriveConnectionResult] = useState<{
    success: boolean;
    timestamp: string;
    message: string;
    retrievedCount: number;
    filesList: string[];
  } | null>(null);

  const handleVerifyDriveConnection = async () => {
    setTestingDriveConnection(true);
    setDriveConnectionResult(null);
    try {
      // Small artificial delay for premium professional handshake feedback
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const driveFiles = files.filter(f => f.source === "Drive" || f.source === "Shared Drive" || f.tags.includes("Synced") || f.tags.includes("Live"));
      const isConnected = Boolean(workspaceUrl && workspaceUrl.trim());
      
      setDriveConnectionResult({
        success: isConnected,
        timestamp: new Date().toLocaleTimeString(),
        message: isConnected 
          ? `Workspace link connected: ${workspaceUrl || "Default Root Google Drive"}.`
          : `Workspace link is not configured. Configure it to authorize live workspace index queries.`,
        retrievedCount: driveFiles.length,
        filesList: driveFiles.slice(0, 4).map(f => f.name)
      });
    } catch (e: any) {
      setDriveConnectionResult({
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        message: `Handshake verification failed: ${e?.message || "Internal Access Timeout Exception"}`,
        retrievedCount: 0,
        filesList: []
      });
    } finally {
      setTestingDriveConnection(false);
    }
  };

  // Drill-through states
  const [activeDrill, setActiveDrill] = useState<null | "documents" | "classroom" | "tasks" | "risks">(null);
  const [inspectedRecord, setInspectedRecord] = useState<{
    title: string;
    type: string;
    data: Record<string, any>;
  } | null>(null);
  const [drillSearch, setDrillSearch] = useState("");
  const [drillPriority, setDrillPriority] = useState<string>("all");
  const [drillRisk, setDrillRisk] = useState<string>("all");

  // KPI Overrides and customized state parameters
  const [cardDataOverrides, setCardDataOverrides] = useState({
    documents: { title: "School Files", customCount: "", sourceLabel: "Drive / Gmail" },
    classroom: { title: "Google Classroom", customCount: "", sourceLabel: "LMS streams" },
    tasks: { title: "Pending Work", customCount: "", sourceLabel: "Critical" },
    risks: { title: "Student Records Alerts", customCount: "", sourceLabel: "Registry stats" }
  });

  // KPI Chart Visualisation presets ("standard" | "percentage" | "trend")
  const [cardChartTypes, setCardChartTypes] = useState({
    documents: "standard",
    classroom: "standard",
    tasks: "standard",
    risks: "standard"
  });

  // 3-dot dropdown indicator
  const [openDropdown, setOpenDropdown] = useState<null | "documents" | "classroom" | "tasks" | "risks">(null);

  // Principal-only performance and forms states
  const [showTeacherReportsModal, setShowTeacherReportsModal] = useState(false);
  const [selectedFormDetail, setSelectedFormDetail] = useState<any | null>(null);
  const [coordinatorSearch, setCoordinatorSearch] = useState("");
  const [coordinatorStatusFilter, setCoordinatorStatusFilter] = useState("all");
  const [coordinatorClassFilter, setCoordinatorClassFilter] = useState("all");

  // principal widgets states (SDOS-23)
  const [principalSandboxState, setPrincipalSandboxState] = useState<"active" | "loading" | "empty" | "partial_permission" | "not_connected" | "error">("active");
  const [academicTab, setAcademicTab] = useState<"planner" | "syllabus" | "assessment">("planner");
  const [healthyThreshold, setHealthyThreshold] = useState<number>(85);
  const [watchThreshold, setWatchThreshold] = useState<number>(70);
  
  // Weights for Compliance overall rating calculation
  const [committeeWeight, setCommitteeWeight] = useState<number>(20);
  const [safetyWeight, setSafetyWeight] = useState<number>(20);
  const [formsWeight, setFormsWeight] = useState<number>(20);
  const [cpdWeight, setCpdWeight] = useState<number>(20);
  const [sqaaWeight, setSqaaWeight] = useState<number>(20);

  // Configuration drawer state states
  const [showAcademicConfig, setShowAcademicConfig] = useState<boolean>(false);
  const [showComplianceConfig, setShowComplianceConfig] = useState<boolean>(false);
  const [selectedRoleCardModel, setSelectedRoleCardModel] = useState<DashboardCardModel | null>(null);
  const renderClassLabel = (value: string) => formatClassLabel(value) || value;

  // In-page drill-down lists state toggles
  const [selectedAcademicLevelDrill, setSelectedAcademicLevelDrill] = useState<string | null>(null);
  const [selectedClassroomMetricDrill, setSelectedClassroomMetricDrill] = useState<string | null>(null);
  const [selectedComplianceItemDrill, setSelectedComplianceItemDrill] = useState<string | null>(null);

  // Helpers to check connection of Course to Workspace Files
  const hasCoursePlanner = React.useCallback((course: ClassroomCourse, filesList: WorkspaceFile[]) => {
    const courseKeywords = [
      course.name.toLowerCase(),
      course.section.replaceAll(/\s+/g, "").toLowerCase(),
      course.teacherName.toLowerCase().split(" ").pop() || ""
    ];
    return filesList.some(f => {
      const isPlanner = f.name.toLowerCase().includes("planner") || 
        (f.tags && f.tags.some(t => t.toLowerCase().includes("planner") || t.toLowerCase().includes("planning")));
      if (!isPlanner) return false;
      const content = (f.name + " " + f.path + " " + f.owner + " " + (f.contentSum || "")).toLowerCase();
      return courseKeywords.some(kw => kw && content.includes(kw));
    });
  }, []);

  const hasCourseAssessment = React.useCallback((course: ClassroomCourse, filesList: WorkspaceFile[]) => {
    const courseKeywords = [
      course.name.toLowerCase(),
      course.section.replaceAll(/\s+/g, "").toLowerCase(),
      course.teacherName.toLowerCase().split(" ").pop() || ""
    ];
    return filesList.some(f => {
      const isAssessment = f.name.toLowerCase().includes("assessment") || 
        f.name.toLowerCase().includes("rubric") || 
        f.name.toLowerCase().includes("exam") || 
        f.name.toLowerCase().includes("quiz") || 
        f.name.toLowerCase().includes("test") ||
        (f.tags && f.tags.some(t => t.toLowerCase().includes("exam") || t.toLowerCase().includes("assessment")));
      if (!isAssessment) return false;
      const content = (f.name + " " + f.path + " " + f.owner + " " + (f.contentSum || "")).toLowerCase();
      return courseKeywords.some(kw => kw && content.includes(kw));
    });
  }, []);

  const hasCourseNotebook = React.useCallback((course: ClassroomCourse, filesList: WorkspaceFile[]) => {
    const courseKeywords = [
      course.name.toLowerCase(),
      course.section.replaceAll(/\s+/g, "").toLowerCase(),
      course.teacherName.toLowerCase().split(" ").pop() || ""
    ];
    return filesList.some(f => {
      const isNotebook = f.name.toLowerCase().includes("notebook") || 
        f.name.toLowerCase().includes("correction") || 
        (f.tags && f.tags.some(t => t.toLowerCase().includes("notebook") || t.toLowerCase().includes("correction")));
      if (!isNotebook) return false;
      const content = (f.name + " " + f.path + " " + f.owner + " " + (f.contentSum || "")).toLowerCase();
      return courseKeywords.some(kw => kw && content.includes(kw));
    });
  }, []);

  const getCourseAcademicLevel = React.useCallback((courseName: string): string => {
    const name = courseName.toLowerCase();
    if (name.includes("grade i") || name.includes("grade v") || name.includes("primary")) {
      if (name.includes("grade ix") || name.includes("grade x") || name.includes("grade xi") || name.includes("grade xii")) {
        // secondary logic
      } else {
        return "Primary";
      }
    }
    if (name.includes("grade vi") || name.includes("grade vii") || name.includes("grade viii") || name.includes("middle")) {
      return "Middle";
    }
    if (name.includes("grade ix") || name.includes("grade x") || name.includes("secondary")) {
      if (name.includes("sr") || name.includes("senior") || name.includes("xi") || name.includes("xii")) {
        return "Sr Secondary";
      }
      return "Secondary";
    }
    if (name.includes("grade xi") || name.includes("grade xii") || name.includes("senior secondary") || name.includes("sr secondary") || name.includes("honors") || name.includes("ap english")) {
      return "Sr Secondary";
    }
    return "Middle";
  }, []);

  const dynamicGlanceCalculations = React.useMemo(() => {
    const totalClassroomsCount = courses.length;
    
    // Check planners
    const coursesWithPlanner = courses.filter(c => hasCoursePlanner(c, files));
    const plannersCount = coursesWithPlanner.length;
    const overduePlannersCount = Math.max(0, totalClassroomsCount - plannersCount);
    
    // Assessments
    const coursesWithAssessment = courses.filter(c => hasCourseAssessment(c, files));
    const assessmentCount = coursesWithAssessment.length;
    const assessmentPercent = totalClassroomsCount > 0 ? Math.round((assessmentCount / totalClassroomsCount) * 100) : 80;
    
    // Compliance
    const complianceFilesList = files.filter(f => 
      f.path.toLowerCase().includes("governance") || 
      f.name.toLowerCase().includes("compliance") || 
      f.name.toLowerCase().includes("audit") || 
      (f.tags && f.tags.some(t => t.toLowerCase().includes("compliance") || t.toLowerCase().includes("auditing") || t.toLowerCase().includes("safety") || t.toLowerCase().includes("committee")))
    );
    const complianceScoreValue = Math.min(100, Math.round(60 + (complianceFilesList.length * 10)));
    
    // Notebooks
    const coursesWithNotebook = courses.filter(c => hasCourseNotebook(c, files));
    const notebookCount = coursesWithNotebook.length;
    const pendingNotebooksReview = Math.max(0, totalClassroomsCount - notebookCount);

    return {
      totalClassroomsCount,
      plannersCount,
      overduePlannersCount,
      assessmentCount,
      assessmentPercent,
      complianceScoreValue,
      notebookCount,
      pendingNotebooksReview
    };
  }, [files, courses, hasCoursePlanner, hasCourseAssessment, hasCourseNotebook]);
  
  // Detailed report filtering states
  const [reportFilters, setReportFilters] = useState({
    teacher: "all",
    className: "all",
    subject: "all",
    dateRange: "all",
    plannerStatus: "all",
    assessmentStatus: "all",
    resourceStatus: "all",
    activityLevel: "all"
  });

  // Coordinator-specific states (SDOS-24)
  const [remedialSearch, setRemedialSearch] = useState("");
  const [remedialStatusFilter, setRemedialStatusFilter] = useState("all");
  const [selectedRemedialStudent, setSelectedRemedialStudent] = useState<any | null>(null);
  const [showFullRemedialModal, setShowFullRemedialModal] = useState(false);
  const [showInactiveSectionsModal, setShowInactiveSectionsModal] = useState(false);

  // --- Principal-specific states (SDOS-23) ---
  const [principalDashboard, setPrincipalDashboard] = useState<any>(EMPTY_PRINCIPAL_DASHBOARD);
  const [teacherDashboard, setTeacherDashboard] = useState<TeacherDashboardData>(EMPTY_TEACHER_DASHBOARD);
  const [coordinatorDashboard, setCoordinatorDashboard] = useState<CoordinatorDashboardData>(EMPTY_COORDINATOR_DASHBOARD);
  const [hodDashboard, setHodDashboard] = useState<HodDashboardData>(EMPTY_HOD_DASHBOARD);
  const [managerDashboard, setManagerDashboard] = useState<ManagerDashboardData>(EMPTY_MANAGER_DASHBOARD);
  const [examsDashboard, setExamsDashboard] = useState<ExaminationDashboardData>(EMPTY_EXAMS_DASHBOARD);
  const [parentDashboard, setParentDashboard] = useState<ParentDashboardData>(EMPTY_PARENT_DASHBOARD);
  const [studentDashboard, setStudentDashboard] = useState<StudentDashboardData>(EMPTY_STUDENT_DASHBOARD);
  const [liveDashboardBlueprints, setLiveDashboardBlueprints] = useState<Record<string, { cards: DashboardBlueprintCard[]; rows: any[] }> | null>(null);
  const [dashboardSourceState, setDashboardSourceState] = useState<DashboardSourceState>({
    mode: "setup_required",
    sourceLabel: "Setup incomplete - no live data found",
    sourceUrl: DEFAULT_DASHBOARD_SHEET_URL,
    lastSyncedAt: null,
    warnings: [],
    setupMessages: ["No live data rows were found."],
    registries: [],
    registryHealthSummary: EMPTY_REGISTRY_HEALTH_SUMMARY,
    localStorageOverrides: {}
  });
  const [bootstrapRegistryFilter, setBootstrapRegistryFilter] = useState("all");
  const [bootstrapTabFilter, setBootstrapTabFilter] = useState("all");
  const [bootstrapSeverityFilter, setBootstrapSeverityFilter] = useState("all");
  const [expandedBootstrapDestinations, setExpandedBootstrapDestinations] = useState<Record<string, boolean>>({});
  const [selectedBootstrapGroups, setSelectedBootstrapGroups] = useState<Record<string, boolean>>({});
  const [bootstrapApprovalChecked, setBootstrapApprovalChecked] = useState(false);
  const [bootstrapWriteInProgress, setBootstrapWriteInProgress] = useState(false);
  const [bootstrapWriteResult, setBootstrapWriteResult] = useState<BootstrapWritebackResult | null>(null);
  const [bootstrapWriteError, setBootstrapWriteError] = useState("");
  const [bootstrapWriteProgress, setBootstrapWriteProgress] = useState<BootstrapWritebackProgress | null>(null);
  const [editedBootstrapRows, setEditedBootstrapRows] = useState<Record<string, Record<string, string>>>({});
  const [bootstrapWizardStep, setBootstrapWizardStep] = useState(0);
  const [expandedTechnicalRows, setExpandedTechnicalRows] = useState<Record<string, boolean>>({});
  const [liveDataRefreshState, setLiveDataRefreshState] = useState<"idle" | "refreshing" | "ready" | "error">("idle");
  const [googleWorkspaceAuthState, setGoogleWorkspaceAuthState] = useState(() => getGoogleWorkspaceAuthState());
  useEffect(() => {
    const syncAuthState = () => {
      clearGoogleSheetReadCache();
      setGoogleWorkspaceAuthState(getGoogleWorkspaceAuthState());
    };
    window.addEventListener(GOOGLE_WORKSPACE_AUTH_STATE_CHANGED_EVENT, syncAuthState);
    syncAuthState();
    return () => window.removeEventListener(GOOGLE_WORKSPACE_AUTH_STATE_CHANGED_EVENT, syncAuthState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrateDashboardData = async () => {
      clearGoogleSheetReadCache();
      setLiveDataRefreshState("refreshing");
      try {
        const dashboardRoleView = currentRole.toLowerCase().includes("teacher")
          ? "teacher"
          : currentRole.toLowerCase().includes("hod")
            ? "hod"
          : isExamsRole()
            ? "exams"
          : isParentRole()
            ? "parent"
          : currentRole.toLowerCase().includes("coordinator")
            ? "coordinator"
            : isStudentRole()
              ? "student"
            : isManagerRole()
              ? "manager"
              : "principal";
        const result: any = await loadDashboardData({
          roleView: dashboardRoleView,
          dashboardSheetUrl: workspaceUrl,
          workspaceUrl,
          classroomUrl: "",
          teacherIdentity: currentUser
        });

        if (cancelled) return;

        setPrincipalDashboard(result.principal || EMPTY_PRINCIPAL_DASHBOARD);
        setTeacherDashboard(result.teacher || EMPTY_TEACHER_DASHBOARD);
        setCoordinatorDashboard(result.coordinator || EMPTY_COORDINATOR_DASHBOARD);
        setManagerDashboard(result.manager || EMPTY_MANAGER_DASHBOARD);
        setExamsDashboard(result.exams || EMPTY_EXAMS_DASHBOARD);
        setParentDashboard(result.parent || EMPTY_PARENT_DASHBOARD);
        setStudentDashboard(result.student || EMPTY_STUDENT_DASHBOARD);
        setHodDashboard(result.hod || EMPTY_HOD_DASHBOARD);
        setLiveDashboardBlueprints(result.blueprints || null);
        setDashboardSourceState(result.sourceState);
        setLiveDataRefreshState("ready");
      } catch (error: any) {
        if (cancelled) return;
        setPrincipalDashboard(EMPTY_PRINCIPAL_DASHBOARD);
        setTeacherDashboard(EMPTY_TEACHER_DASHBOARD);
        setCoordinatorDashboard(EMPTY_COORDINATOR_DASHBOARD);
        setManagerDashboard(EMPTY_MANAGER_DASHBOARD);
        setExamsDashboard(EMPTY_EXAMS_DASHBOARD);
        setParentDashboard(EMPTY_PARENT_DASHBOARD);
        setStudentDashboard(EMPTY_STUDENT_DASHBOARD);
        setHodDashboard(EMPTY_HOD_DASHBOARD);
        setLiveDashboardBlueprints(null);
        setDashboardSourceState({
          mode: "error",
          sourceLabel: "Live data read failed",
          sourceUrl: DEFAULT_DASHBOARD_SHEET_URL,
          lastSyncedAt: null,
          warnings: [error?.message || "Unable to resolve dashboard data."],
          setupMessages: ["Unable to read the configured live data sheets."],
          registries: [],
          registryHealthSummary: EMPTY_REGISTRY_HEALTH_SUMMARY,
          localStorageOverrides: {}
        });
        setLiveDataRefreshState("error");
      }
    };

    hydrateDashboardData();

    return () => {
      cancelled = true;
    };
  }, [workspaceUrl, currentUser, currentRole, googleWorkspaceAuthState.connected, googleWorkspaceAuthState.errorMessage, registryRefreshVersion]);

  useEffect(() => {
    if (!workspaceConnectionTestResult && !isWorkspaceConnectionChecking && liveDataRefreshState === "idle") return;
    window.requestAnimationFrame(() => {
      const resultPanel = document.getElementById("drive-sync-result-panel") as HTMLElement | null;
      if (!resultPanel) return;
      resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      resultPanel.focus({ preventScroll: true });
    });
  }, [workspaceConnectionTestResult, isWorkspaceConnectionChecking, liveDataRefreshState]);

  // --- Shadow static state properties with dynamic computed values inside the component scope ---
  const teacherPerformanceData = React.useMemo<TeacherPerformanceIndicator[]>(() => {
    return (principalDashboard?.teacherPerformanceIndicators || []).map((t: any, idx: number) => ({
      teacher: t.name || `Teacher ${idx + 1}`,
      plannerStatus: t.syllabusPlanner === "Done" || t.syllabusPlanner === "Partial" || t.syllabusPlanner === "Missing"
        ? t.syllabusPlanner
        : "Missing",
      assessmentStatus: t.assessmentsOnTrack === "Done" || t.assessmentsOnTrack === "Partial" || t.assessmentsOnTrack === "Missing"
        ? t.assessmentsOnTrack
        : "Missing",
      resourceCount: Number(t.resourceCount ?? 0),
      activityStatus: t.classroomActivity === "Active" || t.classroomActivity === "Low" || t.classroomActivity === "Inactive"
        ? t.classroomActivity
        : "Inactive",
      source: t.source === "Google Drive" || t.source === "Google Classroom" || t.source === "Schooly"
        ? t.source
        : "Schooly",
      class: t.class || "",
      subject: t.subject || "",
      dateRange: t.dateRange || "",
      lastActive: t.lastActive || ""
    }));
  }, [principalDashboard]);

  const monitoringFormsData = React.useMemo<MonitoringFormFeed[]>(() => {
    return (principalDashboard?.monitoringFormsDataFeeds || []).map((f: any, idx: number) => {
      const submitted = Number(f.submitted ?? f.submittedCount ?? 0);
      const total = Number(f.total ?? 0);
      const overdue = Number(f.overdue ?? f.overdueCount ?? 0);
      const percent = Number(f.percent ?? Number(f.statusLabel?.replace(/[%]/g, "") || 0));
      const statusType: MonitoringFormFeed["statusType"] = overdue > 0
        ? "risk"
        : percent >= 80
          ? "good"
          : percent >= 50
            ? "warning"
            : "info";

      return {
        id: f.id || `feed-${idx}`,
        name: f.form || f.name || `Feed ${idx + 1}`,
        summary: f.summary || `${submitted} of ${total} submitted${overdue ? ` | ${overdue} overdue` : ""}`,
        statusLabel: f.statusLabel || `${percent}%`,
        statusType,
        submittedCount: submitted,
        pendingCount: Math.max(0, total - submitted),
        overdueCount: overdue,
        responsibleOwner: f.responsibleOwner || "",
        linkedClassSection: f.linkedClassSection || "",
        lastSubmittedDate: f.lastSubmittedDate || "",
        evidenceLinkLabel: f.evidenceLinkLabel || "",
        source: f.source || ""
      };
    });
  }, [principalDashboard]);

  const PRINCIPAL_DASHBOARD_SEED = React.useMemo(() => {
    return {
      academicMonitoring: {
        planner: (principalDashboard?.academicMonitoring?.stages || []).map((s: any) => ({
          level: s.stage,
          percentage: s.plannerRate
        })),
        syllabus: (principalDashboard?.academicMonitoring?.syllabus || []).map((s: any) => ({
          level: s.level,
          percentage: s.percentage
        })),
        assessment: (principalDashboard?.academicMonitoring?.assessment || []).map((s: any) => ({
          level: s.level,
          percentage: s.percentage
        })),
        summaryLabelText: {
          planner: "Weekly planner submission rate this week",
          syllabus: "Syllabus tracking progress across grade levels",
          assessment: "Term assessments and diagnostics on-time status"
        }
      },
      classroomMonitoring: {
        totalClassrooms: principalDashboard?.classroomMonitoring?.totalClassrooms || 0,
        postedThisWeek: principalDashboard?.classroomMonitoring?.postedThisWeek || 0,
        zeroActivityThisWeek: principalDashboard?.classroomMonitoring?.zeroActivityThisWeek || 0,
        assignmentsCreatedThisWeek: principalDashboard?.classroomMonitoring?.assignmentsCreatedThisWeek || 0,
        averageSubmissionRate: principalDashboard?.classroomMonitoring?.averageSubmissionRate || principalDashboard?.classroomMonitoring?.avgSubmissionRate || 0,
        meetSessionsHeldThisWeek: principalDashboard?.classroomMonitoring?.meetSessionsHeldThisWeek || principalDashboard?.classroomMonitoring?.meetSessionsHeld || 0
      },
      compliance: {
        items: (principalDashboard?.compliance?.categories || []).map((cat: any) => {
          const keys: Record<string, string> = {
            "Committee records": "committee",
            "Safety records": "safety",
            "Mandatory forms": "forms",
            "Staff CPD records": "cpd",
            "SQAA evidence": "sqaa"
          };
          const owners: Record<string, string> = {
            "Committee records": "Principal",
            "Safety records": "Estate Manager",
            "Mandatory forms": "Registrar",
            "Staff CPD records": "Academic Coordinator",
            "SQAA evidence": "Internal Quality Liaison"
          };
          const Folders: Record<string, string> = {
            "Committee records": "SDOS-Drive/Committee-Minutes",
            "Safety records": "SDOS-Drive/Infrastructure-Safety",
            "Mandatory forms": "SDOS-Drive/Ingestion-Forms",
            "Staff CPD records": "SDOS-Drive/Professional-Dev",
            "SQAA evidence": "SDOS-Drive/Quality-Assessment"
          };

          return {
            label: cat.name,
            percentage: cat.score,
            key: keys[cat.name] || "other",
            owner: owners[cat.name] || "Staff",
            dueDate: "2026-06-15",
            hasEvidence: cat.score >= 70,
            evidenceFolder: Folders[cat.name] || "SDOS-Drive/Other"
          };
        })
      }
    };
  }, [principalDashboard]);

  const [activeTeacherNotificationOpen, setActiveTeacherNotificationOpen] = useState(false);
  const [showPlannerForm, setShowPlannerForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showGradingInterface, setShowGradingInterface] = useState(false);
  const [showResourceUploadForm, setShowResourceUploadForm] = useState(false);
  
  // Forms & Interactive workflows state
  const [selectedGradingAssignment, setSelectedGradingAssignment] = useState<string>("");
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingSuccessMsg, setGradingSuccessMsg] = useState("");
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [leaveStart, setLeaveStart] = useState("2026-06-05");
  const [leaveEnd, setLeaveEnd] = useState("2026-06-06");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState("");
  
  const [plannerClass, setPlannerClass] = useState("");
  const [plannerWeek, setPlannerWeek] = useState("");
  const [plannerSyllabusCovered, setPlannerSyllabusCovered] = useState("");
  const [plannerSuccessMsg, setPlannerSuccessMsg] = useState("");

  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceClass, setResourceClass] = useState("");
  const [resourceSuccessMsg, setResourceSuccessMsg] = useState("");
  const [resourceUploadCount, setResourceUploadCount] = useState(0);
  const [plannerStatusValue, setPlannerStatusValue] = useState<"Posted" | "Missing" | "Partial">("Missing");
  const [teachingTimetable, setTeachingTimetable] = useState<any[]>([]);
  const [teachingTasks, setTeachingTasks] = useState<any[]>([]);

  const [activeCallSim, setActiveCallSim] = useState(false);

  // HOD Dashboard state hooks
  const [hodDepartment, setHodDepartment] = useState<string>("Mathematics");
  const [hodAcademicYear, setHodAcademicYear] = useState<string>("2026-27");
  const [hodClassRange, setHodClassRange] = useState<string>("Class 6-12");
  const [hodPeriod, setHodPeriod] = useState<string>("UT3");
  const [hodDate, setHodDate] = useState<string>("Mon 25 May 2026");
  const [showHODGapDrilldown, setShowHODGapDrilldown] = useState<boolean>(false);
  const [selectedHODTeacher, setSelectedHODTeacher] = useState<any | null>(null);
  const [showHODChasePendingModal, setShowHODChasePendingModal] = useState<boolean>(false);
  const [showPrincipalChasePendingModal, setShowPrincipalChasePendingModal] = useState<boolean>(false);
  const [showCoordinatorChasePendingModal, setShowCoordinatorChasePendingModal] = useState<boolean>(false);
  const [showTeacherChasePendingModal, setShowTeacherChasePendingModal] = useState<boolean>(false);

  // Interactive stats and list states for newly introduced dashboards (School Admin, Manager, HR, Exams, Parent, Student)
  const [studentCheckedTasks, setStudentCheckedTasks] = useState<string[]>([]);
  const [parentAdvisoryTickets, setParentAdvisoryTickets] = useState<any[]>([]);
  const [parentNewTicketSubject, setParentNewTicketSubject] = useState<string>("");
  const [activeAdminSyncCount, setActiveAdminSyncCount] = useState<number>(0);
  const [hrLeaveReview, setHrLeaveReview] = useState<any[]>([]);
  const [studentTasksList, setStudentTasksList] = useState<StudentDashboardTask[]>([]);

  // Get logged-in teacher details dynamically (SDOS-25)
  const getActiveTeacherProfile = () => ({
    name: "",
    initials: "TR",
    subject: "Teacher",
    classes: "No live teacher allocation rows found",
    classTeacher: "",
    session: "Live data"
  });

  const teacherProfile = getActiveTeacherProfile();

  useEffect(() => {
    setTeachingTimetable([]);
    setTeachingTasks([]);
    setResourceUploadCount(0);
  }, [currentUser, currentRole]);

  useEffect(() => {
    setStudentTasksList(studentDashboard.tasks || []);
    setStudentCheckedTasks((studentDashboard.tasks || []).filter((task) => task.completed).map((task) => task.id));
  }, [studentDashboard.tasks]);

  const formatAcademicSessionLabel = (value: string) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "Session not configured";
    const normalized = trimmed.replace(/(\d)\s*-\s*(\d)/g, "$1\u2013$2");
    const prefixed = /^session\b/i.test(normalized) ? normalized : `Session ${normalized}`;
    return prefixed.replace(/(\d{4})\u2013(\d{2,4})/, (_match, start, end) => `${start}\u2013${String(end).slice(-2)}`);
  };

  const getHeroTitle = () => {
    if (isPrincipalRole()) return "Principal\u2019s Dashboard";
    if (isTeacherRole()) return "Teacher\u2019s Dashboard";
    if (isCoordinatorRole()) return "Coordinator\u2019s Dashboard";
    if (isHodRole()) return "HOD Dashboard";
    if (isManagerRole()) return "Manager Dashboard";
    if (isExamsRole()) return "Exams Dashboard";
    if (isParentRole()) return "Parent Dashboard";
    if (isStudentRole()) return "Student Dashboard";
    if (isAdminRole()) return "School Admin Dashboard";
    return `${currentRole || "User"} Dashboard`;
  };

  const getHeroSessionLabel = () => formatAcademicSessionLabel(activeAcademicYearLabel || dashboardSourceState.activeAcademicYearLabel || "");

  const getHeroAlertCount = () => {
    if (isPrincipalRole()) return (principalDashboard?.alertsRequiringAttention || []).length;
    if (isTeacherRole()) return (teacherDashboard?.pendingTasks || []).length;
    if (isCoordinatorRole()) return (coordinatorDashboard?.remedialTracking || []).length;
    if (isHodRole()) return (hodDashboard?.complianceAlerts || []).length;
    if (isManagerRole()) {
      const checklist = managerDashboard?.complianceChecklist || [];
      return checklist.filter((item) => /critical|high|warning/i.test(item.severity) || !/resolved|approved|complete|done/i.test(item.statusLabel)).length || checklist.length;
    }
    if (isExamsRole()) {
      const items = examsDashboard?.verificationItems || [];
      return items.filter((item) => !/verified|approved|locked|final|done|complete/i.test(item.statusLabel)).length || items.length;
    }
    if (isParentRole()) {
      const tickets = parentDashboard?.advisoryTickets || [];
      return tickets.filter((ticket) => !/resolved|closed|done|complete/i.test(ticket.statusLabel) && !/resolved/i.test(ticket.actionLabel)).length || tickets.length;
    }
    if (isStudentRole()) return (studentDashboard?.tasks || []).filter((task) => !task.completed).length;
    if (isAdminRole()) {
      const summary = dashboardSourceState.registryHealthSummary || EMPTY_REGISTRY_HEALTH_SUMMARY;
      return summary.warningRegistries + summary.criticalRegistries;
    }
    return 0;
  };

  const DASHBOARD_ROW_LIMIT = 5;

  const renderWelcomeHeader = () => {
    let accentBgColor = "bg-blue-600";
    let avatarBg = "bg-blue-50 border-blue-100 text-blue-600";
    let initials = "U";

    if (isHodRole()) {
      accentBgColor = "bg-blue-600";
      avatarBg = "bg-blue-50 border-blue-250 text-blue-700";
      initials = hodDashboard?.hodProfile?.initials || "HOD";
    } else if (isTeacherRole()) {
      accentBgColor = "bg-indigo-650";
      avatarBg = "bg-indigo-50 border-indigo-200 text-indigo-700";
      initials = teacherProfile.initials || "TR";
    } else if (isCoordinatorRole()) {
      accentBgColor = "bg-teal-650";
      avatarBg = "bg-teal-50 border-teal-200 text-teal-850";
      initials = coordinatorDashboard?.coordinatorProfile?.initials || "MC";
    } else if (isExamsRole()) {
      accentBgColor = "bg-violet-650";
      avatarBg = "bg-violet-50 border-violet-200 text-violet-850";
      initials = examsDashboard?.header?.initials || "EC";
    } else if (isPrincipalRole()) {
      accentBgColor = "bg-amber-550";
      avatarBg = "bg-amber-50 border-amber-200 text-amber-700";
      initials = "PR";
    } else if (isAdminRole()) {
      accentBgColor = "bg-red-550";
      avatarBg = "bg-red-50 border-red-200 text-red-700";
      initials = "SA";
    } else if (isManagerRole()) {
      accentBgColor = "bg-blue-650";
      avatarBg = "bg-blue-50 border-blue-200 text-blue-700";
      initials = managerDashboard?.profile?.initials || "MG";
    } else if (isHrRole()) {
      accentBgColor = "bg-rose-550";
      avatarBg = "bg-rose-50 border-rose-200 text-rose-700";
      initials = "HR";
    } else if (isParentRole()) {
      accentBgColor = "bg-emerald-550";
      avatarBg = "bg-emerald-50 border-emerald-200 text-emerald-700";
      initials = parentDashboard?.header?.initials || "PT";
    } else if (isStudentRole()) {
      accentBgColor = "bg-cyan-550";
      avatarBg = "bg-cyan-50 border-cyan-200 text-cyan-800";
      initials = studentDashboard?.header?.initials || "ST";
    } else {
      accentBgColor = "bg-slate-400";
      avatarBg = "bg-slate-50 border-slate-200 text-slate-600";
      initials = currentRole ? currentRole.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2) : "UR";
    }

    const heroTitle = getHeroTitle();
    const heroSessionLabel = getHeroSessionLabel();
    const heroAlertCount = getHeroAlertCount();
    const hasAcademicYearOptions = academicYearOptions.length > 0;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm relative overflow-hidden" id="dashboard-hero">
        <div className={`absolute top-0 left-0 w-2 h-full ${accentBgColor} rounded-l-2xl`}></div>
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <div className={`w-12 h-12 rounded-full border-2 ${avatarBg} flex items-center justify-center font-bold text-base shadow-sm font-sans shrink-0 select-none`}>
              {initials}
            </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between flex-1 min-w-0">
                        <h1 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg sm:text-xl font-black tracking-tight text-slate-900 font-sans leading-tight">
              <span className="truncate">{heroTitle}</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              {hasAcademicYearOptions ? (
                <label className="relative inline-flex items-center">
                  <span className="sr-only">Academic year</span>
                  <select
                    value={activeAcademicYearLabel || academicYearOptions[0] || ""}
                    onChange={(event) => onAcademicYearChange?.(event.target.value)}
                    className="appearance-none rounded-full border border-slate-200 bg-slate-50 pl-3 pr-8 py-1 text-sm sm:text-base font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    {academicYearOptions.map((option) => (
                      <option key={option} value={option}>
                        {formatAcademicSessionLabel(option)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2.5 text-slate-400" />
                </label>
              ) : (
                <span className="text-sm sm:text-base font-semibold text-slate-600">{heroSessionLabel}</span>
              )}
            </h1>
            <div className="flex justify-start lg:justify-end">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider border ${heroAlertCount > 0 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                Alerts ({heroAlertCount})
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setTeachingTimetable([]);
    setTeachingTasks([]);
    setResourceUploadCount(0);
    setPlannerStatusValue("Missing");
  }, [currentUser]);

  const isPrincipalOrAdmin = (): boolean => {
    return currentRole === "Principal" || currentRole === "School Admin" || activeRoles?.includes("Principal") || activeRoles?.includes("School Admin");
  };

  const isPrincipalRole = (): boolean => {
    return currentRole === "Principal" || activeRoles?.includes("Principal");
  };

  const isAdminRole = (): boolean => {
    return currentRole === "School Admin" || activeRoles?.includes("School Admin");
  };

  const isCoordinatorRole = (): boolean => {
    return currentRole === "School Coordinator" || activeRoles?.includes("School Coordinator");
  };

  const isExamsRole = (): boolean => {
    return currentRole === "Examination Chair" || activeRoles?.includes("Examination Chair");
  };

  const isManagerRole = (): boolean => {
    return currentRole === "Manager" || activeRoles?.includes("Manager");
  };

  const isHrRole = (): boolean => {
    return currentRole === "HR" || activeRoles?.includes("HR");
  };

  const isParentRole = (): boolean => {
    return currentRole === "Parent Representative" || activeRoles?.includes("Parent Representative");
  };

  const isStudentRole = (): boolean => {
    return currentRole === "Student" || activeRoles?.includes("Student");
  };

  const isTeacherRole = (): boolean => {
    return currentRole === "Teacher" || activeRoles?.includes("Teacher");
  };

  const isHodRole = (): boolean => {
    return currentRole === "Head of Department (HOD)" || currentRole?.includes("HOD") || activeRoles?.includes("Head of Department (HOD)") || activeRoles?.includes("HOD");
  };

  const computeHODKPIs = () => {
    const dept = hodDepartment;
    const year = hodAcademicYear;
    const classes = hodClassRange;
    const period = hodPeriod;

    let repoResources = 147;
    let chaptersResourced = 68;
    let qbQuestions = 312;
    let deptAvg = 72;
    let schoolAvg = 68;

    if (dept === "Mathematics") {
      repoResources = year === "2026-27" ? 147 : 132;
      chaptersResourced = year === "2026-27" ? 68 : 62;
      qbQuestions = year === "2026-27" ? 312 : 280;

      if (period === "UT3") { deptAvg = 72; schoolAvg = 68; }
      else if (period === "UT1") { deptAvg = 75; schoolAvg = 71; }
      else if (period === "UT2") { deptAvg = 70; schoolAvg = 67; }
      else if (period === "Term 1") { deptAvg = 68; schoolAvg = 65; }
      else if (period === "Term 2") { deptAvg = 74; schoolAvg = 70; }

      if (classes === "Class 6-8") {
        repoResources = Math.round(repoResources * 0.51);
        chaptersResourced = Math.min(100, chaptersResourced + 4);
        qbQuestions = Math.round(qbQuestions * 0.48);
      } else if (classes === "Class 9-12") {
        repoResources = Math.round(repoResources * 0.49);
        chaptersResourced = Math.max(0, chaptersResourced - 4);
        qbQuestions = Math.round(qbQuestions * 0.52);
      }
    } else if (dept === "Science") {
      repoResources = year === "2026-27" ? 121 : 115;
      chaptersResourced = year === "2026-27" ? 74 : 70;
      qbQuestions = year === "2026-27" ? 280 : 255;

      if (period === "UT3") { deptAvg = 76; schoolAvg = 72; }
      else if (period === "UT1") { deptAvg = 78; schoolAvg = 74; }
      else if (period === "UT2") { deptAvg = 74; schoolAvg = 71; }
      else if (period === "Term 1") { deptAvg = 71; schoolAvg = 68; }
      else if (period === "Term 2") { deptAvg = 77; schoolAvg = 73; }

      if (classes === "Class 6-8") {
        repoResources = Math.round(repoResources * 0.49);
        chaptersResourced = Math.min(100, chaptersResourced + 3);
        qbQuestions = Math.round(qbQuestions * 0.46);
      } else if (classes === "Class 9-12") {
        repoResources = Math.round(repoResources * 0.51);
        chaptersResourced = Math.max(0, chaptersResourced - 3);
        qbQuestions = Math.round(qbQuestions * 0.54);
      }
    } else {
      repoResources = year === "2026-27" ? 98 : 90;
      chaptersResourced = year === "2026-27" ? 81 : 77;
      qbQuestions = year === "2026-27" ? 195 : 180;

      if (period === "UT3") { deptAvg = 80; schoolAvg = 76; }
      else if (period === "UT1") { deptAvg = 82; schoolAvg = 78; }
      else if (period === "UT2") { deptAvg = 79; schoolAvg = 75; }
      else if (period === "Term 1") { deptAvg = 76; schoolAvg = 73; }
      else if (period === "Term 2") { deptAvg = 83; schoolAvg = 79; }

      if (classes === "Class 6-8") {
        repoResources = Math.round(repoResources * 0.52);
        chaptersResourced = Math.min(100, chaptersResourced + 2);
        qbQuestions = Math.round(qbQuestions * 0.50);
      } else if (classes === "Class 9-12") {
        repoResources = Math.round(repoResources * 0.48);
        chaptersResourced = Math.max(0, chaptersResourced - 2);
        qbQuestions = Math.round(qbQuestions * 0.50);
      }
    }

    return { repoResources, chaptersResourced, qbQuestions, deptAvg, schoolAvg };
  };

  const getRepositoryHealthData = () => {
    const dept = hodDepartment;
    const year = hodAcademicYear;

    const baseData: Record<string, { className: string; completion: number }[]> = {
      Mathematics: [
        { className: "Class VI", completion: 90 },
        { className: "Class VII", completion: 85 },
        { className: "Class VIII", completion: 78 },
        { className: "Class IX", completion: 72 },
        { className: "Class X", completion: 88 },
        { className: "Class XI", completion: 61 },
        { className: "Class XII", completion: 80 },
      ],
      Science: [
        { className: "Class VI", completion: 85 },
        { className: "Class VII", completion: 80 },
        { className: "Class VIII", completion: 72 },
        { className: "Class IX", completion: 68 },
        { className: "Class X", completion: 85 },
        { className: "Class XI", completion: 65 },
        { className: "Class XII", completion: 78 },
      ],
      English: [
        { className: "Class VI", completion: 95 },
        { className: "Class VII", completion: 92 },
        { className: "Class VIII", completion: 85 },
        { className: "Class IX", completion: 88 },
        { className: "Class X", completion: 91 },
        { className: "Class XI", completion: 76 },
        { className: "Class XII", completion: 84 },
      ]
    };

    let rows = baseData[dept] || baseData["Mathematics"];

    if (year === "2025-26") {
      rows = rows.map(r => ({ ...r, completion: Math.max(40, r.completion - 5) }));
    }

    if (hodClassRange === "Class 6-8") {
      return rows.filter(r => ["Class 6", "Class 7", "Class 8"].includes(r.className));
    } else if (hodClassRange === "Class 9-12") {
      return rows.filter(r => ["Class 9", "Class 10", "Class 11", "Class 12"].includes(r.className));
    }
    return rows;
  };

  const getLowestTeacher = (teachersList: any[]) => {
    const missing = teachersList.find(t => t.planner === "Missing");
    if (missing) return missing;
    return [...teachersList].sort((a, b) => (a.uploads + a.qb) - (b.uploads + b.qb))[0];
  };

  const logAction = (user: string, role: string, action: string, detail: string, category: string) => {
    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: user || "unknown",
        role: role || "unknown",
        action,
        detail,
        category,
        success: true
      })
    }).then(() => {
      console.log(`[DEBUG] Logged teacher action: ${action} - ${detail}`);
    }).catch(err => {
      console.error("[DEBUG] Error logging teacher action:", err);
    });
  };

  const isAuthorizedRole = (): boolean => {
    if (currentRole === "Principal" || currentRole === "School Admin" || activeRoles?.includes("Principal") || activeRoles?.includes("School Admin")) {
      return true;
    }
    if (schema) {
      const combinedCapabilities = new Set<string>();
      activeRoles?.forEach(r => {
        const rDef = schema.roles.find(role => role.roleName === r || role.roleId === r);
        if (rDef) {
          rDef.capabilities.forEach(cap => combinedCapabilities.add(cap));
        }
      });
      if (combinedCapabilities.has("Administration") || combinedCapabilities.has("Governance") || combinedCapabilities.has("Academic Leadership")) {
        return true;
      }
    }
    return false;
  };

  const getBadgeStyles = (status: string): string => {
    if (status === "Done" || status === "Active") {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
    if (status === "Partial" || status === "Low" || status === "Pending") {
      return "bg-amber-50 text-amber-700 border-amber-100";
    }
    if (status === "Missing" || status === "Inactive") {
      return "bg-rose-50 text-rose-700 border-rose-100";
    }
    return "bg-blue-50 text-blue-700 border-blue-100";
  };

  // Card parameter editing states
  const [editingCardId, setEditingCardId] = useState<null | "documents" | "classroom" | "tasks" | "risks">(null);
  const [tempEditTitle, setTempEditTitle] = useState("");
  const [tempEditCount, setTempEditCount] = useState("");
  const [tempEditSource, setTempEditSource] = useState("");

  const handleOpenEditModal = (cardId: "documents" | "classroom" | "tasks" | "risks") => {
    setEditingCardId(cardId);
    setTempEditTitle(cardDataOverrides[cardId].title);
    setTempEditCount(cardDataOverrides[cardId].customCount);
    setTempEditSource(cardDataOverrides[cardId].sourceLabel);
  };

  const handleSaveEditModal = () => {
    if (editingCardId) {
      setCardDataOverrides({
        ...cardDataOverrides,
        [editingCardId]: {
          title: tempEditTitle,
          customCount: tempEditCount,
          sourceLabel: tempEditSource
        }
      });
      setEditingCardId(null);
    }
  };

  const handleChangeChartType = (cardId: "documents" | "classroom" | "tasks" | "risks") => {
    const nextType = cardChartTypes[cardId] === "standard" 
      ? "percentage" 
      : cardChartTypes[cardId] === "percentage" 
        ? "trend" 
        : "standard";
    setCardChartTypes({
      ...cardChartTypes,
      [cardId]: nextType
    });
  };

  const handleExportCSV = (cardId: "documents" | "classroom" | "tasks" | "risks") => {
    let csvContent = "";
    let fileName = `${cardId}_export.csv`;
    
    if (cardId === "documents") {
      csvContent = "ID,Name,Source,Path,Owner,Modified At,Size,Access Rule,Tags,Summary\n" +
        files.map(f => `"${f.id}","${f.name.replace(/"/g, '""')}","${f.source}","${f.path.replace(/"/g, '""')}","${f.owner}","${f.modifiedAt}","${f.size}","${f.sharingRule}","${f.tags.join(';') || ""}","${f.contentSum.replace(/"/g, '""')}"`).join("\n");
    } else if (cardId === "classroom") {
      csvContent = "Course ID,Class Name,Section,Teacher Name,Pupils Count,Announcements\n" +
        courses.map(c => `"${c.id}","${c.name.replace(/"/g, '""')}","${c.section.replace(/"/g, '""')}","${c.teacherName.replace(/"/g, '""')}",${c.studentCount},"${c.announcements.join('; ').replace(/"/g, '""')}"`).join("\n");
    } else if (cardId === "tasks") {
      csvContent = "Task ID,Checklist Work,Detail Description,Priority,Status,Due Date,Operator Assignee\n" +
        tasks.map(t => `"${t.id}","${t.title.replace(/"/g, '""')}","${t.description.replace(/"/g, '""')}","${t.priority}","${t.status}","${t.dueDate}","${t.assignedTo.replace(/"/g, '""')}"`).join("\n");
    } else {
      csvContent = "Student ID,Profile Name,Email,Grade Level,Status,GPA,Risk Index Score,Risk Band\n" +
        students.map(s => `"${s.id}","${s.name.replace(/"/g, '""')}","${s.email}","${s.gradeLevel}","${s.enrollmentStatus}",${s.gpa},${s.riskScore || 0}%,"${s.riskFactor || 'low'}"`).join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPNG = (cardId: "documents" | "classroom" | "tasks" | "risks") => {
    const cardData = cardDataOverrides[cardId];
    const currentVal = cardData.customCount !== "" 
      ? cardData.customCount 
      : (cardId === "documents" ? `${files.length} Files` :
         cardId === "classroom" ? `${courses.length} Active` :
         cardId === "tasks" ? `${tasks.filter(t => t.status !== "done").length} Pending` :
         `${students.filter(s => s.riskFactor === "high").length} Risks`);

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background Gradient 
    const grad = ctx.createLinearGradient(0, 0, 0, 360);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 360);

    // Frame Border
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 592, 352);

    // Header Strip
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(8, 8, 584, 50);

    // Header Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillText("SCHOOLY AI - EXECUTIVE KPI METRIC EXPORT", 30, 38);

    // Accent line
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(8, 58, 584, 4);

    // Card Details Drawing
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText(cardData.title.toUpperCase(), 40, 110);

    // Value
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 42px Inter, sans-serif";
    ctx.fillText(currentVal, 40, 175);

    // Subtitle
    ctx.fillStyle = "#475569";
    ctx.font = "normal 14px Inter, sans-serif";
    ctx.fillText(`Registry Scope: ${cardData.sourceLabel} - Live Database Synchronization`, 40, 220);

    // Separator line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 250);
    ctx.lineTo(560, 250);
    ctx.stroke();

    // Footer
    ctx.fillStyle = "#64748b";
    ctx.font = "italic 11px Inter, sans-serif";
    ctx.fillText(`Export Date: ${new Date().toLocaleString()}`, 40, 285);
    ctx.fillText(`Access Role: ${currentRole}`, 40, 305);

    // Download Trigger
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `schooly_ai_${cardId}_metric.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSectionState = (
    section: "academic" | "classroom" | "compliance",
    children: React.ReactNode
  ) => {
    if (principalSandboxState === "loading") {
      return (
        <div className="min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-3 animate-pulse">
          <RefreshCw className="text-blue-500 animate-spin" size={28} />
          <span className="text-xs text-slate-500 font-medium">
            {section === "academic" ? "Loading academic monitoring data..." :
             section === "classroom" ? "Loading classroom statistics..." :
             "Loading school audit records..."}
          </span>
        </div>
      );
    }

    if (principalSandboxState === "empty") {
      return (
        <div className="min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
          <div className="p-2.5 rounded-full bg-slate-100 text-slate-400 inline-block mx-auto mb-1">
            <FileText size={20} />
          </div>
          <span className="text-xs text-slate-650 font-bold block">
            {section === "academic" ? "No planner submissions found for this week." :
             section === "classroom" ? "No active classrooms found." :
             "No compliance categories configured."}
          </span>
          <span className="text-[10px] text-slate-400 max-w-xs leading-normal block">
            Verify filters or click simulation toggle to restore normal system feeds.
          </span>
        </div>
      );
    }

    if (principalSandboxState === "partial_permission") {
      return (
        <div className="min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
          <div className="p-2.5 rounded-full bg-rose-50 text-rose-500 inline-block mx-auto mb-1">
            <ShieldAlert size={20} />
          </div>
          <span className="text-xs text-rose-700 font-bold block">Personnel Lock</span>
          <span className="text-[10px] text-rose-600/80 max-w-[200px] leading-relaxed block">
            Some data is hidden because your account does not have access.
          </span>
        </div>
      );
    }

    if (principalSandboxState === "not_connected") {
      return (
        <div className="min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
          <div className="p-2.5 bg-amber-50 text-amber-500 rounded-full inline-block mx-auto mb-1">
            <GraduationCap size={20} />
          </div>
          <span className="text-xs text-amber-800 font-bold block">LMS Disconnected</span>
          <span className="text-[10px] text-amber-600 max-w-[190px] leading-relaxed block mb-2">
            Connect Google Classroom to view classroom activity.
          </span>
          <button 
            type="button"
            onClick={() => setPrincipalSandboxState("active")}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs"
          >
            Connect Stream
          </button>
        </div>
      );
    }

    if (principalSandboxState === "error") {
      return (
        <div className="min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
          <div className="p-2.5 bg-red-50 text-red-500 rounded-full inline-block mx-auto mb-1">
            <AlertTriangle size={20} />
          </div>
          <span className="text-xs text-red-800 font-bold block">Retrieval Failure</span>
          <span className="text-[10px] text-red-500 max-w-[180px] leading-relaxed block">
            Could not load monitoring data. Try again or contact your Schooly administrator.
          </span>
        </div>
      );
    }

    return children;
  };

  const renderCardContent = (cardId: "documents" | "classroom" | "tasks" | "risks", currentVal: string, sourceLabel: string) => {
    const chartType = cardChartTypes[cardId];
    
    if (chartType === "percentage") {
      let pct = 75;
      let trackColor = "bg-blue-600";
      if (cardId === "documents") { pct = 68; trackColor = "bg-blue-600"; }
      else if (cardId === "classroom") { pct = 85; trackColor = "bg-amber-500"; }
      else if (cardId === "tasks") { pct = 45; trackColor = "bg-rose-500"; }
      else if (cardId === "risks") { pct = 22; trackColor = "bg-rose-700"; }

      return (
        <div className="space-y-1.5 w-full pr-1">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-slate-800 tracking-tight">{currentVal}</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${trackColor}`} style={{ width: `${pct}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>{sourceLabel}</span>
            <span className="text-slate-500">Normal Track</span>
          </p>
        </div>
      );
    }

    if (chartType === "trend") {
      let signTrend = "+4.2%";
      let trendColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
      if (cardId === "documents") { signTrend = "+12.4%"; trendColor = "text-emerald-700 bg-emerald-50 border-emerald-100"; }
      else if (cardId === "classroom") { signTrend = "Steady"; trendColor = "text-blue-700 bg-blue-50 border-blue-100"; }
      else if (cardId === "tasks") { signTrend = "-8.3%"; trendColor = "text-amber-700 bg-amber-50 border-amber-100"; }
      else if (cardId === "risks") { signTrend = "+1.4% change"; trendColor = "text-rose-700 bg-rose-50 border-rose-100"; }

      return (
        <div className="space-y-1.5 w-full pr-1">
          <div className="flex items-center gap-1.5 justify-between">
            <span className="text-2xl font-bold text-slate-800 tracking-tight">{currentVal}</span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${trendColor}`}>
              {signTrend}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-slate-400 font-mono">{sourceLabel}</p>
            <svg className="w-14 h-4 text-emerald-500 shrink-0" viewBox="0 0 40 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M0,8 L8,6 L16,8 L24,2 L32,3 L40,1" />
            </svg>
          </div>
        </div>
      );
    }

    // Default / Standard
    return (
      <div className="space-y-1">
        <div className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-1">
          <span>{currentVal}</span>
          <ArrowUpRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 opacity-60 group-hover:opacity-100" />
        </div>
        <p className="text-xs text-slate-500 font-mono">{sourceLabel}</p>
      </div>
    );
  };

  // Statistics
  const docCount = files.length;
  const courseCount = courses.length;
  const pendingTasks = tasks.filter(t => t.status !== "done").length;
  const criticalTasks = tasks.filter(t => t.priority === "critical").length;
  
  const highRiskStudents = students.filter(s => s.riskFactor === "high").length;
  const mediumRiskStudents = students.filter(s => s.riskFactor === "medium").length;
  const normalStudents = students.filter(s => s.riskFactor === "low").length;

  const favoriteFiles = files.filter(f => f.isFavorite);

  // Dynamic Compliance Indicators & Weighted Rating Calculations (SDOS-23)
  const complianceItemsWithStatus = PRINCIPAL_DASHBOARD_SEED.compliance.items.map(item => {
    const percentage = item.percentage;
    const status: "healthy" | "watch" | "critical" = 
      percentage >= healthyThreshold ? "healthy" : 
      percentage >= watchThreshold ? "watch" : "critical";
    return { ...item, status };
  });

  const getComplianceWeight = (key: string) => {
    if (key === "committee") return committeeWeight;
    if (key === "safety") return safetyWeight;
    if (key === "forms") return formsWeight;
    if (key === "cpd") return cpdWeight;
    if (key === "sqaa") return sqaaWeight;
    return 20;
  };

  const totalComplianceWeights = committeeWeight + safetyWeight + formsWeight + cpdWeight + sqaaWeight;
  const calculatedOverallCompliance = totalComplianceWeights === 0 ? 0 : Math.round(
    complianceItemsWithStatus.reduce((acc, item) => acc + (item.percentage * getComplianceWeight(item.key)), 0) / 
    totalComplianceWeights
  );

  const hasSavedRegistryOverrides = Object.keys(dashboardSourceState.localStorageOverrides || {}).length > 0;
  const registryHealthSummary = dashboardSourceState.registryHealthSummary || EMPTY_REGISTRY_HEALTH_SUMMARY;
  const openSetupCentre = () => onToggleTab("setup-registries");

  const handleResetRegistryUrls = () => {
    resetSavedRegistryUrlsToDefaults();
    window.location.reload();
  };

  const renderDashboardSourcePanel = () => {
    const summaryRows = registryHealthSummary.sourceHealthRows.slice(0, DASHBOARD_ROW_LIMIT);
    return (
      <div className="setup-card-shell bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="dashboard-live-registry-source-status">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Registry readiness</div>
            <h2 className="text-base font-extrabold text-slate-900">{dashboardSourceState.sourceLabel}</h2>
            <div className="text-xs text-slate-500 break-words">
              {registryHealthSummary.connectedRegistries}/{registryHealthSummary.totalRegistries} registry sources ready
            </div>
            <div className="text-xs text-slate-500">
              Last successful read: {dashboardSourceState.lastSyncedAt ? new Date(dashboardSourceState.lastSyncedAt).toLocaleString() : "No successful live read yet"}
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetRegistryUrls}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={14} />
            Reset saved registry URLs
          </button>
        </div>

        {hasSavedRegistryOverrides && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-semibold">
            Saved browser registry URLs are overriding one or more app defaults. Use reset to clear only Schooly registry/source URL keys.
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-500 font-black">Registry status</div>
              <h3 className="text-sm font-extrabold text-slate-900">Connection state and next action</h3>
            </div>
            <span className="text-[10px] font-sans font-black rounded-full bg-white text-slate-700 border border-slate-200 px-2 py-1">
              {registryHealthSummary.connectedRegistries}/{registryHealthSummary.totalRegistries} connected
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 text-[11px]">
            <div className="rounded-xl border border-white bg-white p-3">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-black">Warnings</div>
              <div className="mt-1 text-sm font-extrabold text-amber-700">{registryHealthSummary.warningRegistries}</div>
            </div>
            <div className="rounded-xl border border-white bg-white p-3">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-black">Critical</div>
              <div className="mt-1 text-sm font-extrabold text-rose-700">{registryHealthSummary.criticalRegistries}</div>
            </div>
            <div className="rounded-xl border border-white bg-white p-3">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-black">Onboarding</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">{registryHealthSummary.onboardingStatus}</div>
            </div>
            <div className="rounded-xl border border-white bg-white p-3">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-black">Next action</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">{registryHealthSummary.nextRequiredAction}</div>
            </div>
          </div>

          <div className="space-y-2 pb-2">
            {summaryRows.map((registry) => {
              const registryState = getRegistrySourceState(registry.key);
              const statusLabel = registryState === "missing"
                ? "Source unavailable"
                : registryState === "incomplete"
                  ? "Setup incomplete"
                  : registryState === "fallback"
                    ? "Fallback data"
                    : registry.connected
                      ? "Connected"
                      : "Not connected";
              const countLabel = registryState === "missing"
                ? "Source unavailable"
                : registryState === "incomplete"
                  ? "Setup incomplete"
                  : registryState === "fallback"
                    ? "Fallback data"
                    : `${registry.rowCount} rows`;

              return (
                <div key={registry.key} className="setup-card-row rounded-xl border border-white bg-white px-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs font-extrabold text-slate-900 truncate">{registry.label}</div>
                    <div className="text-[10px] text-slate-500 break-words leading-snug">{registry.error ? "Source unavailable" : "Live source"}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                    <span className={`rounded-full px-2 py-1 ${registryState === "ready" || registryState === "empty" ? "bg-emerald-50 text-emerald-700" : registryState === "missing" || registryState === "incomplete" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-700"}`}>
                      {statusLabel}
                    </span>
                    <span className="rounded-full px-2 py-1 bg-slate-50 text-slate-700 border border-slate-200">
                      {countLabel}
                    </span>
                    {registry.url && canViewRegistrySheetLinks && (
                      <button
                        type="button"
                        onClick={() => openRegistrySheetLink(registry.url, "view")}
                        className="rounded-full border border-blue-200 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 hover:bg-blue-50"
                      >
                        Open Sheet
                      </button>
                    )}
                  </div>
                  {registry.warning ? (
                    <div className="text-[10px] font-semibold text-amber-700 break-words lg:max-w-[45%]">
                      {registry.warning}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {registryHealthSummary.primaryIssue !== "All registry connections are healthy." && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            {registryHealthSummary.primaryIssue}
          </div>
        )}
      </div>
    );
  };

  const bootstrapPreview = React.useMemo(() => buildRegistryBootstrapPreview(dashboardSourceState, files), [dashboardSourceState, files]);
  const getBootstrapDestinationId = React.useCallback((destination: Pick<BootstrapDestinationPreview, "spreadsheet" | "tab" | "primaryKeyColumn">) =>
    `${destination.spreadsheet}::${destination.tab}::${destination.primaryKeyColumn}`, []);
  const isSafeFirstBatchBootstrapGroup = React.useCallback((destination: Pick<BootstrapDestinationPreview, "spreadsheet" | "tab">) => {
    return isSafeFirstBatchTab(destination.spreadsheet, destination.tab);
  }, []);
  const selectedBootstrapDestinations = React.useMemo(() =>
    bootstrapPreview.destinations.filter((destination) =>
      isSafeFirstBatchBootstrapGroup(destination) &&
      selectedBootstrapGroups[getBootstrapDestinationId(destination)] &&
      destination.rows.some((row) => !row.skippedBecauseKeyExists)
    ), [bootstrapPreview.destinations, getBootstrapDestinationId, isSafeFirstBatchBootstrapGroup, selectedBootstrapGroups]);
  const editableBootstrapFieldsByTab: Record<string, string[]> = {
    School_Profile: ["school_name", "board", "medium", "academic_year", "principal_name", "city", "state", "country"],
    Academic_Years: ["academic_year", "start_date", "end_date", "term_name", "term_start", "term_end", "status"],
    Classes_Sections: ["class_teacher_staff_id", "status"],
    Subjects: ["is_core_subject", "status"],
    QA_Checklist_Config: ["severity", "required", "status"],
    KPI_Definitions: ["dashboard_role", "target_value", "status"]
  };
  const fieldLabelByName: Record<string, string> = {
    school_name: "School Name",
    board: "Board",
    medium: "Medium",
    academic_year: "Academic Year",
    principal_name: "Principal Name",
    city: "City",
    state: "State",
    country: "Country",
    start_date: "Start Date",
    end_date: "End Date",
    term_name: "Term Name",
    term_start: "Term Start",
    term_end: "Term End",
    status: "Status",
    class_teacher_staff_id: "Class Teacher Staff ID",
    is_core_subject: "Core Subject",
    severity: "Severity",
    required: "Required",
    dashboard_role: "Dashboard Role",
    target_value: "Target Value"
  };
  const friendlyFieldLabel = (field: string) => fieldLabelByName[field] || field.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const isCoreIdentityField = (tab: string, field: string) =>
    (tab === "School_Profile" && ["school_name", "board", "academic_year"].includes(field)) ||
    (tab === "Academic_Years" && field === "academic_year");
  const getReviewedBootstrapRow = React.useCallback((row: BootstrapProposedRow) => ({
    ...row,
    row: {
      ...row.row,
      ...(editedBootstrapRows[row.id] || {})
    }
  }), [editedBootstrapRows]);
  const selectedReviewedBootstrapDestinations = React.useMemo(() =>
    selectedBootstrapDestinations.map((destination) => ({
      ...destination,
      rows: destination.rows.map(getReviewedBootstrapRow)
    })), [getReviewedBootstrapRow, selectedBootstrapDestinations]);
  const selectedBootstrapSummary = React.useMemo(() => ({
    groups: selectedReviewedBootstrapDestinations.length,
    rowsToCreate: selectedReviewedBootstrapDestinations.reduce((sum, destination) => sum + destination.rows.filter((row) => !row.skippedBecauseKeyExists).length, 0),
    skippedRows: selectedReviewedBootstrapDestinations.reduce((sum, destination) => sum + destination.skippedExistingCount, 0),
    reviewRows: selectedReviewedBootstrapDestinations.reduce((sum, destination) => sum + destination.rows.filter((row) => row.reviewRequired && !row.skippedBecauseKeyExists).length, 0),
    tabs: selectedReviewedBootstrapDestinations.map((destination) => `${destination.spreadsheet} / ${destination.tab}`)
  }), [selectedReviewedBootstrapDestinations]);
  const selectedBootstrapHeaderIssues = React.useMemo(() => {
    return selectedReviewedBootstrapDestinations.flatMap((destination) => {
      const registry = dashboardSourceState.registries.find((item) => item.label === destination.spreadsheet);
      const headers = registry?.tabHeaders?.[destination.tab] || [];
      const normalizedHeaders = new Set(headers.map(normalizeHeaderForComparison));
      const missingHeaders = registry?.missingHeaders?.[destination.tab] || [];
      const missingPrimaryKey = !normalizedHeaders.has(normalizeHeaderForComparison(destination.primaryKeyColumn));
      const issues = [
        ...missingHeaders.map((header) => `${destination.spreadsheet} / ${destination.tab}: missing ${header}`),
        ...(missingPrimaryKey ? [`${destination.spreadsheet} / ${destination.tab}: missing primary key ${destination.primaryKeyColumn}`] : [])
      ];
      return Array.from(new Set(issues));
    });
  }, [dashboardSourceState.registries, selectedReviewedBootstrapDestinations]);
  const isCorePlaceholderValue = React.useCallback((value: string) => {
    const normalized = String(value || "").trim().toLowerCase();
    return !normalized || normalized === "review required" || normalized === "setup required" || normalized === "draft - setup required";
  }, []);
  const selectedBootstrapPlaceholderIssues = React.useMemo(() => {
    const coreFields: Record<string, string[]> = {
      School_Profile: ["school_name", "board", "academic_year"],
      Academic_Years: ["academic_year"]
    };
    return selectedReviewedBootstrapDestinations.flatMap((destination) =>
      destination.rows.flatMap((row) =>
        (coreFields[destination.tab] || [])
          .filter((field) => isCorePlaceholderValue(row.row[field]))
          .map((field) => `${destination.spreadsheet} / ${destination.tab} / ${row.primaryKeyValue}: resolve ${field}`)
      )
    );
  }, [isCorePlaceholderValue, selectedReviewedBootstrapDestinations]);
  useEffect(() => {
    const defaults: Record<string, boolean> = {};
    bootstrapPreview.destinations.forEach((destination) => {
      defaults[getBootstrapDestinationId(destination)] = isSafeFirstBatchBootstrapGroup(destination);
    });
    setSelectedBootstrapGroups(defaults);
    setBootstrapApprovalChecked(false);
  }, [bootstrapPreview.generatedAt, bootstrapPreview.destinations, getBootstrapDestinationId, isSafeFirstBatchBootstrapGroup]);
  const bootstrapRegistryOptions = Array.from(new Set(bootstrapPreview.destinations.map((destination) => destination.spreadsheet))).sort();
  const bootstrapTabOptions = Array.from(new Set(bootstrapPreview.destinations.map((destination) => destination.tab))).sort();
  const visibleBootstrapDestinations = bootstrapPreview.destinations
    .map((destination) => ({
      ...destination,
      rows: destination.rows.filter((row) =>
        (bootstrapRegistryFilter === "all" || row.spreadsheet === bootstrapRegistryFilter) &&
        (bootstrapTabFilter === "all" || row.tab === bootstrapTabFilter) &&
        (bootstrapSeverityFilter === "all" || row.severity === bootstrapSeverityFilter)
      )
    }))
    .filter((destination) => destination.rows.length > 0);
  const safeFoundationDestinations = bootstrapPreview.destinations.filter(isSafeFirstBatchBootstrapGroup);
  const selectableSafeFoundationDestinations = safeFoundationDestinations.filter((destination) =>
    destination.rows.some((row) => !row.skippedBecauseKeyExists)
  );
  const showAdminSetupDetails = isPrincipalRole() || isAdminRole() || isManagerRole();
  const foundationHasLiveRegistryRows = ["Master Registry", "QA/SQAA Registry", "Dashboard Data Source"].every((label) =>
    (dashboardSourceState.registries.find((registry) => registry.label === label)?.rowCount || 0) > 0
  );
  const safeFoundationSetupComplete = foundationHasLiveRegistryRows || (selectableSafeFoundationDestinations.length === 0 && safeFoundationDestinations.length > 0);
  const deferredBootstrapDestinations = bootstrapPreview.destinations.filter((destination) => !isSafeFirstBatchBootstrapGroup(destination));
  const wizardVisibleBootstrapDestinations = (bootstrapWizardStep === 4 ? deferredBootstrapDestinations : safeFoundationDestinations)
    .map((destination) => ({
      ...destination,
      rows: destination.rows.filter((row) =>
        (bootstrapRegistryFilter === "all" || row.spreadsheet === bootstrapRegistryFilter) &&
        (bootstrapTabFilter === "all" || row.tab === bootstrapTabFilter) &&
        (bootstrapSeverityFilter === "all" || row.severity === bootstrapSeverityFilter)
      )
    }))
    .filter((destination) => destination.rows.length > 0);
  const safeFoundationHeaderIssues = safeFoundationDestinations.flatMap((destination) => {
    const registry = dashboardSourceState.registries.find((item) => item.label === destination.spreadsheet);
    return [
      ...(registry?.missingTabs.includes(destination.tab) ? [`${destination.spreadsheet} / ${destination.tab}: missing tab`] : []),
      ...((registry?.missingHeaders?.[destination.tab] || []).map((header) => `${destination.spreadsheet} / ${destination.tab}: missing ${header}`))
    ];
  });
  const canContinueBootstrapWizard = (step: number) => {
    if (step === 0) return true;
    if (step === 1) return true;
    if (step === 2) return selectedBootstrapPlaceholderIssues.length === 0;
    if (step === 3) return selectedBootstrapDestinations.length > 0 || selectableSafeFoundationDestinations.length === 0;
    if (step === 4) return true;
    if (step === 5) return selectedBootstrapSummary.rowsToCreate === 0 || bootstrapWriteResult !== null;
    return false;
  };
  const bootstrapWizardContinueReason = (step: number) => {
    if (step === 2 && selectedBootstrapPlaceholderIssues.length > 0) {
      return "Resolve the required school identity fields before continuing.";
    }
    if (step === 3 && selectedBootstrapDestinations.length === 0 && selectableSafeFoundationDestinations.length > 0) {
      return "Select at least one safe foundation group before continuing.";
    }
    if (step === 5 && selectedBootstrapSummary.rowsToCreate > 0 && !bootstrapWriteResult) {
      return "Run Apply Safe Foundation Setup before continuing.";
    }
    if (step === 6) {
      return "Completion is the final step.";
    }
    return "Continue keeps the current review state intact.";
  };
  const bootstrapWizardSteps = [
    { title: "Registry Connection Check", mode: "Read-only" },
    { title: "Registry Health Check", mode: "Read-only" },
    { title: "School Identity Review", mode: "Read-only" },
    { title: "Safe Foundation Data", mode: "Read-only" },
    { title: "Deferred Setup Items", mode: "Read-only" },
    { title: "Approval and Apply", mode: "Approval required" },
    { title: "Completion", mode: "Read-only" }
  ];

  const copyBootstrapPreview = async (format: "json" | "csv") => {
    const payload = format === "json" ? JSON.stringify(bootstrapPreview, null, 2) : bootstrapPreviewToCsv(bootstrapPreview);
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = payload;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const refreshDashboardAfterBootstrapWrite = async () => {
    clearGoogleSheetReadCache();
    setLiveDataRefreshState("refreshing");
    const result: any = await loadDashboardData({
      roleView: "all",
      dashboardSheetUrl: workspaceUrl,
      workspaceUrl,
      classroomUrl: ""
    });
    setPrincipalDashboard(result.principal || EMPTY_PRINCIPAL_DASHBOARD);
    setTeacherDashboard(result.teacher || EMPTY_TEACHER_DASHBOARD);
    setCoordinatorDashboard(result.coordinator || EMPTY_COORDINATOR_DASHBOARD);
    setManagerDashboard(result.manager || EMPTY_MANAGER_DASHBOARD);
    setExamsDashboard(result.exams || EMPTY_EXAMS_DASHBOARD);
    setParentDashboard(result.parent || EMPTY_PARENT_DASHBOARD);
    setLiveDashboardBlueprints(result.blueprints || null);
    setDashboardSourceState(result.sourceState);
    setLiveDataRefreshState("ready");
  };
  const currentDashboardView = dashboardView;

  const handleConnectGoogleWorkspaceWriteAccess = async () => {
    setBootstrapWriteError("");
    try {
      await connectGoogleWorkspaceWriteAccess();
      setGoogleWorkspaceAuthState(getGoogleWorkspaceAuthState());
    } catch (error: any) {
      setGoogleWorkspaceAuthState(getGoogleWorkspaceAuthState());
      setBootstrapWriteError(error?.message || "Google Sheets write access could not be established.");
    }
  };

  const handleDisconnectGoogleWorkspaceWriteAccess = () => {
    disconnectGoogleWorkspaceAccess();
    setGoogleWorkspaceAuthState(getGoogleWorkspaceAuthState());
    setBootstrapWriteError("");
  };

  const bootstrapWizardContentRef = React.useRef<HTMLDivElement | null>(null);

  const revealBootstrapWizardContent = () => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      bootstrapWizardContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      bootstrapWizardContentRef.current?.focus({ preventScroll: true });
    });
  };

  const handleBootstrapWizardStepSelect = (step: number) => {
    setBootstrapWizardStep(step);
    revealBootstrapWizardContent();
  };

  const handleBootstrapWizardStepMove = (step: number) => {
    setBootstrapWizardStep(step);
    revealBootstrapWizardContent();
  };

  const applySelectedBootstrapRows = async () => {
    if (
      selectedBootstrapDestinations.length === 0 ||
      selectedBootstrapHeaderIssues.length > 0 ||
      selectedBootstrapPlaceholderIssues.length > 0 ||
      !bootstrapApprovalChecked ||
      !googleWorkspaceAuthState.connected ||
      bootstrapWriteInProgress
    ) return;
    setBootstrapWriteInProgress(true);
    setBootstrapWriteError("");
    setBootstrapWriteResult(null);
    setBootstrapWriteProgress({
      phase: "preparing",
      message: "Starting safe foundation setup. Schooly is preparing the selected rows for Google Sheets.",
      groupTotal: selectedReviewedBootstrapDestinations.length
    });
    try {
      const accessToken = getGoogleWorkspaceAccessToken();
      if (!accessToken) {
        setGoogleWorkspaceAuthState(getGoogleWorkspaceAuthState());
        throw new Error("Connect Google Sheets Write Access before applying setup rows.");
      }
      const result = await applyRegistryBootstrapWriteback({
        sourceState: dashboardSourceState,
        destinations: selectedReviewedBootstrapDestinations,
        approvedBy: currentUser || "Schooly user",
        accessToken,
        onProgress: setBootstrapWriteProgress
      });
      setBootstrapWriteResult(result);
      setBootstrapWriteProgress({
        phase: "complete",
        message: "Rows written. Schooly is refreshing the live data dashboard.",
        groupTotal: selectedReviewedBootstrapDestinations.length,
        created: result.totalCreated,
        skipped: result.totalSkipped
      });
      await refreshDashboardAfterBootstrapWrite();
      setBootstrapApprovalChecked(false);
      setBootstrapWizardStep(6);
    } catch (error: any) {
      setBootstrapWriteProgress(null);
      setBootstrapWriteError(error?.message || "Approved bootstrap writeback failed.");
    } finally {
      setBootstrapWriteInProgress(false);
    }
  };

  const renderRegistryBootstrapPreview = () => (
    <div
      tabIndex={-1}
      className="setup-card-shell bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 outline-none"
      id="registry-bootstrap-preview"
    >
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h2 className="text-lg font-extrabold text-slate-900">School Setup Onboarding Wizard</h2>
          <p className="text-sm text-slate-600">
            {safeFoundationSetupComplete
              ? "Foundation setup is complete. Next, map NCERT textbooks and chapters."
              : "Review and initialize safe foundation registry data."}
          </p>
          {showAdminSetupDetails && (
            <p className="text-[11px] text-slate-500 font-mono">Generated: {new Date(bootstrapPreview.generatedAt).toLocaleString()}</p>
          )}
        </div>
        {showAdminSetupDetails && (
        <div className="flex flex-wrap gap-2 items-start">
          <button type="button" onClick={() => copyBootstrapPreview("json")} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-700 hover:bg-slate-100">Copy JSON</button>
          <button type="button" onClick={() => copyBootstrapPreview("csv")} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-700 hover:bg-slate-100">Copy CSV</button>
        </div>
        )}
      </div>

      {hasSavedRegistryOverrides && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-semibold">
          Browser-saved registry URLs are overriding app defaults. Use "Reset saved registry URLs" above before approving future writeback.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="rounded-xl border border-blue-200 bg-white p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className={`inline-flex px-2 py-1 rounded-lg text-[10px] uppercase font-mono font-black ${bootstrapWizardStep === 5 ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}>
              {bootstrapWizardSteps[bootstrapWizardStep]?.mode}
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-2">Step {bootstrapWizardStep + 1}: {bootstrapWizardSteps[bootstrapWizardStep]?.title}</h3>
            <p className="text-xs text-slate-600 mt-1">
              {safeFoundationSetupComplete
                ? "Safe foundation setup is complete. The next useful step is NCERT textbook and chapter mapping."
                : "This wizard writes only approved foundation setup rows. Textbooks, lesson workspaces, Classroom, assessments, and SQAA evidence come later."}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="text-[11px] font-bold text-slate-600">
              {safeFoundationSetupComplete ? "Ready for textbook setup" : "Ready for guided setup"}
            </div>
            {safeFoundationSetupComplete && (
              <button
                type="button"
                onClick={() => onToggleTab("textbooks")}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 inline-flex items-center justify-center gap-2"
              >
                Continue to NCERT Textbooks <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <div>
            <div className="text-[10px] uppercase font-mono text-blue-600 font-black">Current step</div>
            <h3 className="text-sm font-extrabold text-slate-900">Step {bootstrapWizardStep + 1}: {bootstrapWizardSteps[bootstrapWizardStep]?.title}</h3>
            <p className="text-xs text-slate-600 mt-1">
              {bootstrapWizardStep === 0
                ? "Check the current workspace and registry connection state before you move on."
                : bootstrapWizardStep === 1
                  ? "Review live registry health before continuing."
                  : bootstrapWizardStep === 2
                    ? "Review School Profile and Academic Year fields."
                    : bootstrapWizardStep === 3
                      ? "Select the first safe foundation rows to write."
                      : bootstrapWizardStep === 4
                        ? "Deferred items stay read-only in this pass."
                        : bootstrapWizardStep === 5
                          ? "Approve and connect Google Sheets write access before applying setup."
                          : "Review completion and continue to NCERT Textbooks."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {bootstrapWizardStep === 0 && onConfigureWorkspace && (
              <button type="button" onClick={onConfigureWorkspace} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-blue-700">
                Open Drive Sync Settings <ArrowRight size={14} />
              </button>
            )}
            {bootstrapWizardStep === 3 && selectableSafeFoundationDestinations.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBootstrapGroups((current) => ({
                    ...current,
                    ...Object.fromEntries(selectableSafeFoundationDestinations.map((destination) => [getBootstrapDestinationId(destination), true]))
                  }));
                  setBootstrapApprovalChecked(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-800 hover:bg-amber-100"
              >
                Select available safe foundation groups
              </button>
            )}
            {bootstrapWizardStep === 5 && (
              <>
                <button type="button" onClick={handleConnectGoogleWorkspaceWriteAccess} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-blue-700">
                  Connect Google Sheets Write Access
                </button>
                <button
                  type="button"
                  onClick={applySelectedBootstrapRows}
                  disabled={selectedBootstrapSummary.rowsToCreate === 0 || selectedBootstrapHeaderIssues.length > 0 || selectedBootstrapPlaceholderIssues.length > 0 || !bootstrapApprovalChecked || !googleWorkspaceAuthState.connected || bootstrapWriteInProgress}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${selectedBootstrapSummary.rowsToCreate > 0 && selectedBootstrapHeaderIssues.length === 0 && selectedBootstrapPlaceholderIssues.length === 0 && bootstrapApprovalChecked && googleWorkspaceAuthState.connected && !bootstrapWriteInProgress ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                >
                  {bootstrapWriteInProgress ? "Applying selected rows..." : "Apply Safe Foundation Setup"}
                </button>
              </>
            )}
            {bootstrapWizardStep === 6 && (
              <button
                type="button"
                onClick={() => onToggleTab("textbooks")}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-blue-700"
              >
                Continue to NCERT Textbooks <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="setup-card-footer flex items-center justify-between gap-3 flex-wrap border-t border-slate-200">
          <button
            type="button"
            onClick={() => handleBootstrapWizardStepMove(Math.max(0, bootstrapWizardStep - 1))}
            disabled={bootstrapWizardStep === 0}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold ${bootstrapWizardStep === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"}`}
          >
            Back
          </button>
          <div className="flex-1 min-w-0 text-center text-[11px] font-bold text-slate-600 px-2">
            {bootstrapWizardContinueReason(bootstrapWizardStep)}
          </div>
          <button
            type="button"
            onClick={() => handleBootstrapWizardStepMove(Math.min(bootstrapWizardSteps.length - 1, bootstrapWizardStep + 1))}
            disabled={bootstrapWizardStep >= bootstrapWizardSteps.length - 1 || !canContinueBootstrapWizard(bootstrapWizardStep)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold ${bootstrapWizardStep < bootstrapWizardSteps.length - 1 && canContinueBootstrapWizard(bootstrapWizardStep) ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
            Continue
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {bootstrapWizardSteps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => handleBootstrapWizardStepSelect(index)}
              className={`text-left rounded-xl border px-3 py-2 ${bootstrapWizardStep === index ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-100"}`}
            >
              <div className="text-[10px] uppercase font-mono font-black text-slate-400">Step {index + 1}</div>
              <div className="text-xs font-extrabold text-slate-900">{step.title}</div>
              <div className={`text-[10px] font-mono font-black mt-1 ${step.mode === "Approval required" ? "text-rose-600" : step.mode === "Deferred setup" ? "text-amber-600" : "text-blue-600"}`}>{step.mode}</div>
            </button>
          ))}
        </div>
      </div>
      <div ref={bootstrapWizardContentRef} tabIndex={-1} className="space-y-4 outline-none">

      {showAdminSetupDetails && bootstrapWizardStep >= 3 && (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Proposed rows</div><div className="text-xl font-black text-slate-900">{bootstrapPreview.summary.proposedRows}</div></div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3"><div className="text-[10px] uppercase font-mono text-rose-500 font-black">Blockers</div><div className="text-xl font-black text-rose-700">{bootstrapPreview.summary.blockers}</div></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="text-[10px] uppercase font-mono text-amber-600 font-black">Warnings</div><div className="text-xl font-black text-amber-700">{bootstrapPreview.summary.warnings}</div></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Skipped existing</div><div className="text-xl font-black text-slate-900">{bootstrapPreview.summary.skippedExistingRows}</div></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Rejected inference</div><div className="text-xl font-black text-slate-900">{bootstrapPreview.summary.rejectedInferenceCandidates}</div></div>
      </div>
      )}

      {showAdminSetupDetails && bootstrapWizardStep >= 3 && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3"><div className="text-[10px] uppercase font-mono text-blue-500 font-black">Can auto prepare</div><div className="text-lg font-black text-blue-700">{bootstrapPreview.classifications.can_auto_prepare}</div></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="text-[10px] uppercase font-mono text-amber-600 font-black">Needs review</div><div className="text-lg font-black text-amber-700">{bootstrapPreview.classifications.requires_human_review}</div></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] uppercase font-mono text-slate-500 font-black">External connection</div><div className="text-lg font-black text-slate-700">{bootstrapPreview.classifications.requires_external_connection}</div></div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3"><div className="text-[10px] uppercase font-mono text-rose-500 font-black">Cannot infer</div><div className="text-lg font-black text-rose-700">{bootstrapPreview.classifications.cannot_infer}</div></div>
      </div>
      )}

      {bootstrapWizardStep === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase font-mono text-blue-600 font-black">Read-only</div>
            <h3 className="text-base font-extrabold text-slate-900">Registry Connection Check</h3>
            <p className="text-sm text-slate-600 mt-1">This step shows the current workspace and registry connection state before any setup changes are reviewed.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-black">Workspace</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {dashboardSourceState.mode === "live" ? "Connected" : "Setup incomplete"}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{dashboardSourceState.sourceLabel}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-black">Registries</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">{registryHealthSummary.connectedRegistries}/{registryHealthSummary.totalRegistries} ready</div>
              <div className="mt-1 text-[11px] text-slate-500">Next action: {registryHealthSummary.nextRequiredAction}</div>
            </div>
          </div>
          {hasSavedRegistryOverrides && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-semibold">
              Browser-saved registry URLs are overriding app defaults.
              <button type="button" onClick={handleResetRegistryUrls} className="ml-2 underline font-black">Reset saved registry URLs to defaults</button>
            </div>
          )}
          {showAdminSetupDetails ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {dashboardSourceState.registries.map((registry) => (
              <div key={registry.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-slate-900">{registry.label}</div>
                  <span className={`text-[10px] font-sans font-black px-2 py-0.5 rounded-full ${registry.error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{registry.error ? "Read failed" : "Readable"}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Source connected</div>
                {registry.error && <div className="text-[11px] text-rose-700 mt-1">{registry.error}</div>}
              </div>
            ))}
          </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
              {onConfigureWorkspace ? (
                <button
                  type="button"
                  onClick={onConfigureWorkspace}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-blue-700"
                >
                  Open Drive Sync Settings
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-400 cursor-not-allowed"
                >
                  Drive Sync Settings Unavailable
                </button>
              )}
          </div>
        </div>
      )}

      {!showAdminSetupDetails && bootstrapWizardStep === 1 && (
        <div className={`rounded-xl border p-4 space-y-3 ${safeFoundationHeaderIssues.length === 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <div className={`text-[10px] uppercase font-mono font-black ${safeFoundationHeaderIssues.length === 0 ? "text-emerald-700" : "text-amber-700"}`}>Registry health</div>
          <h3 className="text-sm font-extrabold text-slate-900">
            {safeFoundationHeaderIssues.length === 0 ? "Live registry readiness looks healthy" : "Live registry readiness needs review"}
          </h3>
          <p className="text-sm text-slate-700">
            {registryHealthSummary.connectedRegistries}/{registryHealthSummary.totalRegistries} registries are available. Warnings: {registryHealthSummary.warningRegistries}. Critical: {registryHealthSummary.criticalRegistries}. Next action: {registryHealthSummary.nextRequiredAction}.
          </p>
          {safeFoundationHeaderIssues.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800">
              {safeFoundationHeaderIssues.slice(0, 3).join("; ")}
            </div>
          )}
        </div>
      )}

      {showAdminSetupDetails && bootstrapWizardStep === 1 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
          <div className="text-xs font-black text-rose-800 mb-2">Blockers</div>
          {bootstrapPreview.blockers.length > 0 ? bootstrapPreview.blockers.slice(0, 8).map((item) => <div key={item} className="text-[11px] text-rose-700 leading-relaxed">{item}</div>) : <div className="text-[11px] text-rose-700">No blockers detected.</div>}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs font-black text-amber-800 mb-2">Warnings</div>
          {bootstrapPreview.warnings.length > 0 ? bootstrapPreview.warnings.slice(0, 8).map((item) => <div key={item} className="text-[11px] text-amber-700 leading-relaxed">{item}</div>) : <div className="text-[11px] text-amber-700">No warnings detected.</div>}
        </div>
      </div>
      )}

      {showAdminSetupDetails && bootstrapWizardStep === 1 && bootstrapPreview.rejectedInferenceCandidates.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-3">
          <div>
            <div className="text-[10px] uppercase font-mono text-amber-600 font-black">Rejected inference candidates</div>
            <div className="text-xs text-amber-800">These values were not used for setup proposals because they did not pass class/subject validation.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] min-w-[760px]">
              <thead className="text-amber-700 uppercase font-mono border-b border-amber-200"><tr><th className="py-2">Source path</th><th>Field</th><th>Rejected value</th><th>Reason</th><th>Suggested action</th></tr></thead>
              <tbody className="divide-y divide-amber-100">
                {bootstrapPreview.rejectedInferenceCandidates.slice(0, 25).map((item) => (
                  <tr key={`${item.sourcePath}-${item.field}-${item.rejectedValue}`}>
                    <td className="py-2 text-slate-700 max-w-xs truncate" title={item.sourcePath}>{item.sourcePath}</td>
                    <td className="font-mono text-slate-600">{item.field}</td>
                    <td className="font-bold text-amber-900 max-w-xs truncate" title={item.rejectedValue}>{item.rejectedValue}</td>
                    <td className="text-amber-800">{item.reason}</td>
                    <td className="text-slate-600">{item.suggestedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bootstrapWizardStep === 2 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div>
            <div className="text-[10px] uppercase font-mono text-blue-600 font-black">Review required</div>
            <h3 className="text-sm font-extrabold text-slate-900">School Identity Review</h3>
            <p className="text-xs text-slate-600 mt-1">Edit only the school and academic-year fields needed to initialize the foundation safely. Placeholders disappear when you click into a field.</p>
          </div>
          {selectedReviewedBootstrapDestinations.filter((destination) => ["School_Profile", "Academic_Years"].includes(destination.tab)).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedReviewedBootstrapDestinations
                .filter((destination) => ["School_Profile", "Academic_Years"].includes(destination.tab))
                .map((destination) => {
                  const editableFields = editableBootstrapFieldsByTab[destination.tab] || [];
                  return (
                    <div key={`identity-${getBootstrapDestinationId(destination)}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-black text-slate-800">{destination.spreadsheet} / {destination.tab}</div>
                          <div className="text-[11px] text-slate-500">Complete the core identity fields for this setup tab.</div>
                        </div>
                        <span className={`text-[10px] font-sans font-black px-2 py-1 rounded-full ${selectedBootstrapPlaceholderIssues.some((issue) => issue.includes(`${destination.spreadsheet} / ${destination.tab}`)) ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {selectedBootstrapPlaceholderIssues.some((issue) => issue.includes(`${destination.spreadsheet} / ${destination.tab}`)) ? "Needs review" : "Ready"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {destination.rows.filter((row) => !row.skippedBecauseKeyExists).map((row) => (
                          <div key={`identity-row-${row.id}`} className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
                            <div className="text-[10px] uppercase font-mono font-black text-slate-400">Row {row.primaryKeyValue}</div>
                            <div className="grid grid-cols-1 gap-3">
                              {editableFields.map((field) => {
                                const rawValue = row.row[field] || "";
                                const unresolved = isCoreIdentityField(destination.tab, field) && isCorePlaceholderValue(rawValue);
                                const placeholderText = unresolved ? `Enter ${friendlyFieldLabel(field)}` : friendlyFieldLabel(field);
                                return (
                                  <label key={`${row.id}-${field}`} className="block space-y-1">
                                    <span className="text-[10px] uppercase font-mono font-black text-slate-500">{friendlyFieldLabel(field)}</span>
                                    <input
                                      value={unresolved ? "" : rawValue}
                                      placeholder={placeholderText}
                                      onChange={(event) => {
                                        const value = event.target.value;
                                        setEditedBootstrapRows((current) => ({
                                          ...current,
                                          [row.id]: {
                                            ...(current[row.id] || {}),
                                            [field]: value
                                          }
                                        }));
                                        setBootstrapApprovalChecked(false);
                                      }}
                                      className={`w-full rounded-xl border px-3 py-2 text-sm bg-white text-slate-800 ${unresolved ? "border-rose-300" : "border-slate-200"}`}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                            {selectedBootstrapPlaceholderIssues.filter((issue) => issue.includes(`${destination.spreadsheet} / ${destination.tab} / ${row.primaryKeyValue}`)).map((issue) => (
                              <div key={issue} className="text-[11px] text-rose-700 font-semibold">{issue}</div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">Select School_Profile and Academic_Years safe foundation rows to review identity fields.</div>
          )}
        </div>
      )}

      {showAdminSetupDetails && bootstrapWizardStep === 1 && (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400 font-black">Registry Health</div>
            <div className="text-xs text-slate-600">Tabs, headers, row counts, duplicates, placeholders, and Drive reference checks.</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] min-w-[820px]">
            <thead className="text-slate-400 uppercase font-mono border-b border-slate-200"><tr><th className="py-2">Registry</th><th>Tab</th><th>Rows</th><th>Missing headers</th><th>Duplicates</th><th>Placeholders</th><th>Invalid Drive refs</th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {bootstrapPreview.health.map((item) => (
                <tr key={`${item.spreadsheet}-${item.tab}`}>
                  <td className="py-2 font-bold text-slate-700">{item.spreadsheet}</td>
                  <td className="font-mono text-slate-600">{item.tab}{item.missingTab ? " (missing)" : item.emptyTab ? " (empty)" : ""}</td>
                  <td>{item.rowCount}</td>
                  <td className="text-rose-700">{item.missingHeaders.join(", ") || "-"}</td>
                  <td className="text-rose-700">{item.duplicatePrimaryIds.join(", ") || "-"}</td>
                  <td>{item.placeholderRows || "-"}</td>
                  <td className="text-rose-700">{item.invalidDriveReferences.join(", ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {!showAdminSetupDetails && bootstrapWizardStep === 5 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase font-mono text-amber-700 font-black">Admin action</div>
            <h3 className="text-sm font-extrabold text-slate-900">Approval is handled by the school admin team</h3>
            <p className="text-sm text-slate-700 mt-1">
              Only approved foundation setup rows can be written here. Existing rows are preserved, and no operational teaching data is invented.
            </p>
          </div>
          {safeFoundationSetupComplete && (
            <button
              type="button"
              onClick={() => onToggleTab("textbooks")}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 inline-flex items-center justify-center gap-2"
            >
              Continue to NCERT Textbooks <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {showAdminSetupDetails && bootstrapWizardStep === 5 && (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase font-mono text-blue-600 font-black">Approval required</div>
            <h3 className="text-sm font-extrabold text-slate-900">Selected safe foundation rows only</h3>
            <p className="text-xs text-slate-600 mt-1">Existing rows will not be overwritten. Rows will be appended only if primary keys do not already exist. No operational data will be invented.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            <div className="rounded-lg border border-blue-200 bg-white px-3 py-2"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Groups</div><div className="text-lg font-black text-slate-900">{selectedBootstrapSummary.groups}</div></div>
            <div className="rounded-lg border border-blue-200 bg-white px-3 py-2"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Rows to create</div><div className="text-lg font-black text-slate-900">{selectedBootstrapSummary.rowsToCreate}</div></div>
            <div className="rounded-lg border border-blue-200 bg-white px-3 py-2"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Skipped</div><div className="text-lg font-black text-slate-900">{selectedBootstrapSummary.skippedRows}</div></div>
            <div className="rounded-lg border border-blue-200 bg-white px-3 py-2"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Needs review</div><div className="text-lg font-black text-amber-700">{selectedBootstrapSummary.reviewRows}</div></div>
          </div>
        </div>
        <div className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-[11px] text-slate-600">
          <span className="font-black text-slate-800">Registries/tabs selected:</span> {selectedBootstrapSummary.tabs.length > 0 ? selectedBootstrapSummary.tabs.join("; ") : "None selected."}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] uppercase font-mono text-blue-600 font-black">Google Sheets write access</div>
              <h4 className="text-sm font-extrabold text-slate-900">Connect Google Sheets Write Access</h4>
              <p className="text-xs text-slate-600 mt-1">This is separate from the Workspace URL. It authorizes approved registry writes to Google Sheets only.</p>
            </div>
            <div className="text-right text-[10px] font-mono space-y-1">
              <div>Current app origin: {googleWorkspaceAuthState.currentOrigin || "Unavailable"}</div>
              <div>OAuth Client ID: {googleWorkspaceAuthState.clientIdConfigured ? "Configured" : "Missing"}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="uppercase font-black text-slate-400">Write access</div>
              <div className={`font-bold ${googleWorkspaceAuthState.connected ? "text-emerald-700" : "text-amber-700"}`}>{googleWorkspaceAuthState.connected ? "Connected" : "Not connected"}</div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="uppercase font-black text-slate-400">Required scope</div>
              <div className="font-bold text-slate-700 break-all">{googleWorkspaceAuthState.requiredScope}</div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="uppercase font-black text-slate-400">Connected account</div>
              <div className="font-bold text-slate-700">{googleWorkspaceAuthState.connected ? "unavailable" : "Not connected"}</div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="uppercase font-black text-slate-400">Token expiry</div>
              <div className="font-bold text-slate-700">{googleWorkspaceAuthState.expiresInSecondsRemaining === null ? "Not connected" : `${googleWorkspaceAuthState.expiresInSecondsRemaining}s remaining`}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConnectGoogleWorkspaceWriteAccess}
              className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700"
            >
              Connect Google Sheets Write Access
            </button>
            <button
              type="button"
              onClick={handleDisconnectGoogleWorkspaceWriteAccess}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 hover:bg-slate-100"
            >
              Disconnect Write Access
            </button>
          </div>
          {!googleWorkspaceAuthState.clientIdConfigured && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              Google OAuth client ID is not configured.
            </div>
          )}
          {googleWorkspaceAuthState.errorMessage && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {googleWorkspaceAuthState.errorMessage}
              <div className="mt-1 text-[10px] font-mono text-rose-600">Current origin: {googleWorkspaceAuthState.currentOrigin || "Unavailable"}</div>
            </div>
          )}
        </div>
        {selectedBootstrapHeaderIssues.length > 0 && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            Fix selected header issues before writeback: {selectedBootstrapHeaderIssues.join("; ")}
          </div>
        )}
        {selectedBootstrapPlaceholderIssues.length > 0 && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            Core identity placeholders must be resolved before writeback: {selectedBootstrapPlaceholderIssues.join("; ")}
          </div>
        )}
        {selectedBootstrapSummary.rowsToCreate === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-800 space-y-2">
            <div className="font-black">
              {selectableSafeFoundationDestinations.length > 0
                ? "No safe foundation groups are currently selected."
                : "No safe foundation rows are available to apply."}
            </div>
            <div>
              {selectableSafeFoundationDestinations.length > 0
                ? "Go back to Step 4 and select the safe foundation groups, or use the button below to select all available safe foundation groups."
                : "This usually means the safe foundation rows have already been written or there are no missing setup rows left in the selected safe tabs. Continue to Books and NCERT Mapping for the next setup phase."}
            </div>
            {selectableSafeFoundationDestinations.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBootstrapGroups((current) => ({
                    ...current,
                    ...Object.fromEntries(selectableSafeFoundationDestinations.map((destination) => [getBootstrapDestinationId(destination), true]))
                  }));
                  setBootstrapApprovalChecked(false);
                }}
                className="inline-flex rounded-lg border border-amber-300 bg-white px-3 py-2 text-[11px] font-extrabold text-amber-800 hover:bg-amber-100"
              >
                Select available safe foundation groups
              </button>
            )}
            {selectableSafeFoundationDestinations.length === 0 && (
              <button
                type="button"
                onClick={() => onToggleTab("textbooks")}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
              >
                Continue to NCERT Textbooks <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}
        <label className="flex items-start gap-2 text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={bootstrapApprovalChecked}
            onChange={(event) => setBootstrapApprovalChecked(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          <span>I approve writing the selected safe foundation rows to Google Sheets.</span>
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={applySelectedBootstrapRows}
            disabled={selectedBootstrapSummary.rowsToCreate === 0 || selectedBootstrapHeaderIssues.length > 0 || selectedBootstrapPlaceholderIssues.length > 0 || !bootstrapApprovalChecked || !googleWorkspaceAuthState.connected || bootstrapWriteInProgress}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold ${selectedBootstrapSummary.rowsToCreate > 0 && selectedBootstrapHeaderIssues.length === 0 && selectedBootstrapPlaceholderIssues.length === 0 && bootstrapApprovalChecked && googleWorkspaceAuthState.connected && !bootstrapWriteInProgress ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
            {bootstrapWriteInProgress ? "Applying selected rows..." : "Apply Safe Foundation Setup"}
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase">
            <span className="px-2 py-1 rounded-lg bg-white text-blue-700 border border-blue-200">No overwrite</span>
            <span className="px-2 py-1 rounded-lg bg-white text-slate-700 border border-slate-200">No operational data</span>
            <span className="px-2 py-1 rounded-lg bg-white text-rose-700 border border-rose-200">Approval required</span>
          </div>
        </div>
        {(bootstrapWriteInProgress || bootstrapWriteProgress) && (
          <div className={`rounded-lg border px-3 py-3 text-xs font-semibold space-y-2 ${
            bootstrapWriteProgress?.phase === "group_error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : bootstrapWriteProgress?.phase === "complete"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
          }`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[10px] uppercase font-mono font-black opacity-75">
                  {bootstrapWriteInProgress ? "Applying safe foundation setup" : "Latest writeback status"}
                </div>
                <div className="text-sm font-extrabold">{bootstrapWriteProgress?.message || "Preparing writeback."}</div>
              </div>
              {bootstrapWriteProgress?.groupIndex && bootstrapWriteProgress?.groupTotal && (
                <div className="rounded-full bg-white/80 border border-current/15 px-3 py-1 text-[10px] font-mono font-black">
                  Group {bootstrapWriteProgress.groupIndex} of {bootstrapWriteProgress.groupTotal}
                </div>
              )}
            </div>
            {bootstrapWriteProgress?.spreadsheet && bootstrapWriteProgress?.tab && (
              <div className="rounded-md bg-white/80 border border-current/10 px-2 py-1 font-mono text-[10px]">
                Current target: {bootstrapWriteProgress.spreadsheet} / {bootstrapWriteProgress.tab}
              </div>
            )}
            {bootstrapWriteInProgress && (
              <div className="text-[11px] leading-relaxed">
                Please keep this tab open. Google Sheets may take a little while while Schooly checks headers, appends missing rows, writes the audit log, and refreshes live data counts.
              </div>
            )}
            {bootstrapWriteProgress?.error && (
              <div className="rounded-md bg-white/80 border border-rose-200 px-2 py-1 text-rose-700">
                {bootstrapWriteProgress.error}
              </div>
            )}
          </div>
        )}
        {!googleWorkspaceAuthState.connected && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Connect Google Sheets Write Access before applying setup rows.
          </div>
        )}
        {bootstrapWriteError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{bootstrapWriteError}</div>}
        {bootstrapWriteResult && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 space-y-1">
            <div className="font-black">Writeback complete: {bootstrapWriteResult.totalCreated} created, {bootstrapWriteResult.totalSkipped} skipped.</div>
            {bootstrapWriteResult.errors.length > 0 && <div className="text-rose-700 font-semibold">Errors: {bootstrapWriteResult.errors.join(" ")}</div>}
          </div>
        )}
      </div>
      )}

      {!showAdminSetupDetails && (bootstrapWizardStep === 3 || bootstrapWizardStep === 4) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase font-mono font-black text-blue-700">{bootstrapWizardStep === 4 ? "Next phase" : "Foundation setup"}</div>
            <h3 className="text-sm font-extrabold text-slate-900">
              {safeFoundationSetupComplete ? "Foundation setup is ready" : "School admin setup is in progress"}
            </h3>
            <p className="text-sm text-slate-700 mt-1">
              {safeFoundationSetupComplete
                ? "Teachers can continue once books and chapters are mapped in the NCERT Textbooks area."
                : "A school administrator reviews and applies foundation rows here. No marks, attendance, or classroom activity is created by this wizard."}
            </p>
          </div>
          {safeFoundationSetupComplete && (
            <button
              type="button"
              onClick={() => onToggleTab("textbooks")}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 inline-flex items-center justify-center gap-2"
            >
              Continue to NCERT Textbooks <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {showAdminSetupDetails && (bootstrapWizardStep === 3 || bootstrapWizardStep === 4) && (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className={`text-[10px] uppercase font-mono font-black ${bootstrapWizardStep === 4 ? "text-amber-600" : "text-blue-600"}`}>{bootstrapWizardStep === 4 ? "Deferred setup" : "Safe foundation setup"}</div>
            <div className="text-xs text-slate-600">{bootstrapWizardStep === 4 ? "Future setup items are shown read-only and cannot be applied from the foundation wizard." : "This step writes setup/configuration rows only. Existing rows will not be overwritten."}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={bootstrapRegistryFilter} onChange={(event) => setBootstrapRegistryFilter(event.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"><option value="all">All registries</option>{bootstrapRegistryOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
            <select value={bootstrapTabFilter} onChange={(event) => setBootstrapTabFilter(event.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"><option value="all">All tabs</option>{bootstrapTabOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
            <select value={bootstrapSeverityFilter} onChange={(event) => setBootstrapSeverityFilter(event.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"><option value="all">All severities</option><option value="blocker">Blockers</option><option value="warning">Warnings</option><option value="info">Info</option></select>
          </div>
        </div>

        {bootstrapWizardStep === 4 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 font-semibold">
            Deferred groups require NCERT book confirmation, Drive folder URL confirmation, Classroom course IDs, assessment calendar details, or real evidence/artifact data.
          </div>
        )}

        {wizardVisibleBootstrapDestinations.length > 0 ? wizardVisibleBootstrapDestinations.map((destination) => {
          const destinationId = getBootstrapDestinationId(destination);
          const expanded = expandedBootstrapDestinations[destinationId] || false;
          const isDeferred = bootstrapWizardStep === 4;
          const selected = !isDeferred && Boolean(selectedBootstrapGroups[destinationId]);
          const destinationConfidence = Array.from(new Set(destination.rows.map((row) => row.confidence))).join(", ");
          const destinationSources = Array.from(new Set(destination.rows.map((row) => row.source))).slice(0, 3).join("; ");
          const reviewRequiredCount = destination.rows.filter((row) => row.reviewRequired && !row.skippedBecauseKeyExists).length;
          return (
            <div key={destinationId} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button type="button" onClick={() => setExpandedBootstrapDestinations((current) => ({ ...current, [destinationId]: !expanded }))} className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left bg-slate-50 hover:bg-slate-100">
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={isDeferred}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      if (isDeferred) return;
                      const checked = event.target.checked;
                      setSelectedBootstrapGroups((current) => ({ ...current, [destinationId]: checked }));
                      setBootstrapApprovalChecked(false);
                    }}
                    className={`mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 ${isDeferred ? "cursor-not-allowed opacity-50" : ""}`}
                    aria-label={`Select ${destination.spreadsheet} ${destination.tab}`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900">{destination.spreadsheet} / {destination.tab}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Primary key: {destination.primaryKeyColumn}  |  Rows to create: {destination.proposedRowCount}  |  Skipped existing: {destination.skippedExistingCount}</div>
                    <div className="text-[11px] text-slate-600 mt-1">Validation: {destinationConfidence || "-"}  |  Review required: {reviewRequiredCount}  |  Source: {destinationSources || "-"}</div>
                    {destination.warnings.length > 0 && <div className="text-[11px] text-amber-700 mt-1">Warnings: {destination.warnings.slice(0, 3).join("; ")}</div>}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] uppercase font-sans font-black px-2 py-0.5 rounded-full ${expanded ? "bg-slate-200 text-slate-700" : "bg-blue-50 text-blue-700"}`}>
                        {expanded ? "Hide technical rows" : "Review rows"}
                      </span>
                      {isDeferred && <span className="text-[10px] uppercase font-mono font-black text-amber-600">Deferred - cannot be applied in first foundation setup</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className={`text-slate-400 transition-transform shrink-0 mt-1 ${expanded ? "rotate-90" : ""}`} />
              </button>
              {expanded && (
                <div className="border-t border-slate-100">
                  <div className="px-4 pt-3 text-[10px] uppercase font-mono font-black text-slate-400">Technical rows</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] min-w-[760px]">
                      <thead className="text-slate-400 uppercase font-mono border-b border-slate-100"><tr><th className="px-4 py-2">Key</th><th>Severity</th><th>Confidence</th><th>Review</th><th>Source</th><th>Reason</th><th>Warnings</th><th>Preview row</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {destination.rows.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-2 font-mono text-slate-700">{row.primaryKeyValue}</td>
                            <td><span className={`px-2 py-0.5 rounded-full font-bold ${row.severity === "blocker" ? "bg-rose-50 text-rose-700" : row.severity === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{row.severity}</span></td>
                            <td className="font-bold text-slate-600">{row.confidence}</td>
                            <td className={row.reviewRequired ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>{row.reviewRequired ? "Required" : "No"}</td>
                            <td className="text-slate-600">{row.source}</td>
                            <td className="text-slate-600 max-w-xs">{row.reason}</td>
                            <td className="text-amber-700">{row.warnings.join("; ") || "-"}</td>
                            <td className="font-mono text-slate-500 max-w-md truncate" title={JSON.stringify(row.row)}>{JSON.stringify(row.row)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">No proposed rows match the current filters.</div>
        )}
      </div>
      )}

      {bootstrapWizardStep === 6 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase font-mono text-emerald-700 font-black">Read-only</div>
            <h3 className="text-sm font-extrabold text-slate-900">Completion</h3>
            <p className="text-xs text-slate-700 mt-1">
              {safeFoundationSetupComplete
                ? "Foundation setup is ready. Continue to NCERT textbooks, books, and chapter mapping."
                : "After apply, Schooly re-reads the live registries and shows write results by registry and tab."}
            </p>
          </div>
          {bootstrapWriteResult ? (
            <div className="space-y-3">
              <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                bootstrapWriteResult.errors.length > 0
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-white text-emerald-800"
              }`}>
                {bootstrapWriteResult.errors.length > 0
                  ? "Writeback finished with errors. Review the registry/tab table below before retrying."
                  : "Safe foundation setup applied successfully. Schooly appended missing rows, preserved existing rows, and refreshed live data counts."}
              </div>
              <div className="rounded-lg border border-blue-200 bg-white px-3 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-mono text-blue-600 font-black">Next step</div>
                  <div className="text-sm font-extrabold text-slate-900">Continue to NCERT Textbooks</div>
                  <div className="text-xs text-slate-600 mt-1">Map books, chapter files, and the lesson-planning source for teachers.</div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleTab("textbooks")}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 inline-flex items-center justify-center gap-2"
                >
                  Open NCERT Textbooks <ArrowRight size={14} />
                </button>
              </div>
              {showAdminSetupDetails && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Created</div><div className="text-lg font-black text-emerald-700">{bootstrapWriteResult.totalCreated}</div></div>
                <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Skipped</div><div className="text-lg font-black text-slate-900">{bootstrapWriteResult.totalSkipped}</div></div>
                <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2"><div className="text-[10px] uppercase font-mono text-slate-400 font-black">Errors</div><div className="text-lg font-black text-rose-700">{bootstrapWriteResult.errors.length}</div></div>
              </div>
              )}
              {showAdminSetupDetails && (
              <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white">
                <table className="w-full text-left text-[11px] min-w-[720px]">
                  <thead className="text-slate-400 uppercase font-mono border-b border-emerald-100"><tr><th className="px-3 py-2">Registry</th><th>Tab</th><th>Created</th><th>Skipped</th><th>Errors</th></tr></thead>
                  <tbody className="divide-y divide-emerald-100">
                    {bootstrapWriteResult.groups.map((group) => (
                      <tr key={group.groupId}>
                        <td className="px-3 py-2 font-bold text-slate-700">{group.spreadsheet}</td>
                        <td className="font-mono text-slate-600">{group.tab}</td>
                        <td>{group.created}</td>
                        <td>{group.skipped}</td>
                        <td className="text-rose-700">{group.errors.join("; ") || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
              {showAdminSetupDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {dashboardSourceState.registries.map((registry) => (
                  <div key={`completion-${registry.key}`} className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase font-mono text-slate-400 font-black">{registry.label}</div>
                    <div className="text-sm font-black text-slate-900">{registry.rowCount} live rows</div>
                  </div>
                ))}
              </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700 space-y-3">
              <div>
                {safeFoundationSetupComplete
                  ? "Foundation setup rows already exist. Continue to NCERT Textbooks for the next setup phase."
                  : "No writeback has been run in this session. Complete Step 6 after reviewing and approving safe foundation rows."}
              </div>
              {safeFoundationSetupComplete && (
                <button
                  type="button"
                  onClick={() => onToggleTab("textbooks")}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 inline-flex items-center justify-center gap-2"
                >
                  Continue to NCERT Textbooks <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
  const registryByKey = new Map<string, DashboardRegistrySourceStatus>((dashboardSourceState.registries || []).map((registry) => [registry.key, registry]));
  const getTabRowCount = (key: string, tabName: string) => {
    const registry = registryByKey.get(key as any);
    return registry?.tabRowCounts?.[tabName] || 0;
  };
  const getRegistryUrl = (key: string) => registryByKey.get(key as any)?.url || "";
  const getRegistryRowCount = (key: string) => registryByKey.get(key as any)?.rowCount || 0;
  type CompactSourceState = "ready" | "empty" | "missing" | "incomplete" | "fallback" | "unknown";
  const getRegistrySourceState = (key: string): CompactSourceState => {
    const registry = registryByKey.get(key as any);
    if (!registry) return "unknown";
    if (registry.error || !registry.connected || registry.missingTabs.length > 0) return "missing";
    if (Object.values(registry.missingHeaders).some((items) => items.length > 0)) return "incomplete";
    if (Object.values(registry.placeholderRows).some((count) => count > 0)) return "fallback";
    if (registry.rowCount === 0 || registry.emptyTabs.length > 0) return "empty";
    return "ready";
  };
  const formatSourceAwareValue = (value: string | number, state: CompactSourceState) => {
    if (state === "missing") return "Source unavailable";
    if (state === "incomplete") return "Setup incomplete";
    if (state === "fallback") return "Fallback data";
    if (state === "unknown") return "Metadata only";
    return value;
  };
  const canViewRegistrySheetLinks = googleWorkspaceAuthState.connected || isPrincipalRole() || isAdminRole() || isCoordinatorRole() || isHodRole() || isManagerRole() || isHrRole() || isExamsRole() || isTeacherRole();
  const canEditRegistrySheetLinks = googleWorkspaceAuthState.connected && (isPrincipalRole() || isAdminRole() || isCoordinatorRole() || isHodRole() || isManagerRole() || isHrRole() || isExamsRole());
  const openRegistrySheetLink = (url: string, mode: "view" | "edit") => {
    if (!url || (!canViewRegistrySheetLinks && mode === "view") || (!canEditRegistrySheetLinks && mode === "edit")) return;
    const trimmed = url.trim();
    const targetUrl = mode === "view"
      ? trimmed.replace(/\/edit(\?.*)?$/, "/view$1")
      : trimmed;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };
  const openRegistryExplorer = () => onToggleTab("registries");
  const openRegistryDataRoute = (registryId: string) => {
    if (onOpenRegistryDataRoute) {
      onOpenRegistryDataRoute(registryId);
      return;
    }
    onToggleTab("registries");
  };
  const countTabs = (items: Array<[string, string]>) =>
    items.reduce((sum, [key, tabName]) => sum + getTabRowCount(key, tabName), 0);
  const liveSectionCards = [
    {
      title: "Class Sections",
      source: "Master Registry / Classes_Sections",
      sourceUrl: getRegistryUrl("masterDataRegistryUrl"),
      rows: getTabRowCount("masterDataRegistryUrl", "Classes_Sections"),
      empty: "No rows available from Classes_Sections yet.",
      registryKey: "masterDataRegistryUrl",
      actionTab: "courses"
    },
    {
      title: "Teacher Allocations",
      source: "Master Registry / Teacher_Allocations",
      sourceUrl: getRegistryUrl("masterDataRegistryUrl"),
      rows: getTabRowCount("masterDataRegistryUrl", "Teacher_Allocations"),
      empty: "No rows available from Teacher_Allocations yet.",
      registryKey: "masterDataRegistryUrl",
      actionRegistryId: "REG_TEACHER_ALLOCATIONS"
    },
    {
      title: "Lesson Workspace",
      source: "Lesson Workspace Registry / Lesson_Workspace_Registry",
      sourceUrl: getRegistryUrl("lessonWorkspaceRegistryUrl"),
      rows: getTabRowCount("lessonWorkspaceRegistryUrl", "Lesson_Workspace_Registry"),
      empty: "No rows available from Lesson_Workspace_Registry yet.",
      registryKey: "lessonWorkspaceRegistryUrl",
      actionRegistryId: "lessonWorkspaceRegistryUrl__lesson-workspace-registry"
    },
    {
      title: "Alerts",
      source: "Dashboard Data Source / Alert_Log",
      sourceUrl: getRegistryUrl("dashboardDataSourceUrl"),
      rows: getTabRowCount("dashboardDataSourceUrl", "Alert_Log"),
      empty: "No rows available from Alert_Log yet.",
      registryKey: "dashboardDataSourceUrl",
      actionRegistryId: "dashboardDataSourceUrl__alert-log"
    },
    {
      title: "SQAA Evidence",
      source: "QA/SQAA Registry / SQAA_Evidence_Map",
      sourceUrl: getRegistryUrl("qaSqaaRegistryUrl"),
      rows: getTabRowCount("qaSqaaRegistryUrl", "SQAA_Evidence_Map"),
      empty: "No rows available from SQAA_Evidence_Map yet.",
      registryKey: "qaSqaaRegistryUrl",
      actionRegistryId: "qaSqaaRegistryUrl__sqaa-evidence-map"
    },
    {
      title: "Assessments",
      source: "Assessment/Result Registry",
      sourceUrl: getRegistryUrl("assessmentResultRegistryUrl"),
      rows: registryByKey.get("assessmentResultRegistryUrl" as any)?.rowCount || 0,
      empty: "No rows available from the assessment source yet.",
      registryKey: "assessmentResultRegistryUrl",
      actionRegistryId: "assessmentResultRegistryUrl__result-processing"
    },
    {
      title: "Classroom Sync",
      source: "Google Classroom Sync Registry",
      sourceUrl: getRegistryUrl("classroomSyncRegistryUrl"),
      rows: registryByKey.get("classroomSyncRegistryUrl" as any)?.rowCount || 0,
      empty: "No rows available from Classroom sync yet.",
      registryKey: "classroomSyncRegistryUrl"
    }
  ];

  const dashboardRoleKey: DashboardRoleKey = isPrincipalRole()
    ? "principal"
    : isAdminRole()
      ? "admin"
      : isCoordinatorRole()
        ? "coordinator"
        : isHodRole()
          ? "hod"
          : isTeacherRole()
            ? "teacher"
            : isManagerRole()
              ? "manager"
              : isHrRole()
                ? "hr"
                : isExamsRole()
                  ? "exams"
                  : isParentRole()
                    ? "parent"
                    : isStudentRole()
                      ? "student"
                      : "manager";

  const roleDashboardTitle = DASHBOARD_ROLE_TITLES[dashboardRoleKey] || "Role Dashboard";

  const dashboardCardIconMap: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
    AlertTriangle,
    Award,
    BarChart2,
    Bell,
    Briefcase,
    BookOpen,
    Calendar,
    Check,
    CheckSquare,
    Clock,
    Database,
    FileText,
    FolderOpen,
    LayoutGrid,
    Send,
    Settings,
    ShieldAlert,
    Star,
    UserCheck,
    Users
  };

  const getRegistryRowCountSafe = (registryKey: string) => registryByKey.get(registryKey as any)?.rowCount || 0;
  const getTabRowCountSafe = (registryKey: string, tabName: string) => registryByKey.get(registryKey as any)?.tabRowCounts?.[tabName] || 0;

  const resolveCardRows = (card: DashboardRoleCardDefinition): number => {
    if (card.countMode === "liveRows") {
      return (dashboardSourceState.registries || []).reduce((sum, registry) => sum + registry.rowCount, 0);
    }

    if (card.countMode === "blueprintRows") {
      return liveDashboardBlueprints?.[card.blueprintRole || dashboardRoleKey]?.rows?.length || 0;
    }

    if ((card.registryKeys || []).length === 0) {
      return 0;
    }

    if ((card.tabNames || []).length > 0 && (card.registryKeys || []).length === 1) {
      const registryKey = card.registryKeys![0];
      return card.tabNames!.reduce((sum, tabName) => sum + getTabRowCountSafe(registryKey, tabName), 0);
    }

    return (card.registryKeys || []).reduce((sum, registryKey) => sum + getRegistryRowCountSafe(registryKey), 0);
  };

  const roleDashboardCards = getDashboardRoleCards(dashboardRoleKey)
    .map((card) => {
      const rows = resolveCardRows(card);
      return {
        ...card,
        rows,
        model: toDashboardCardModel(card, rows, dashboardRoleKey),
        icon: dashboardCardIconMap[card.icon] || Database
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const roleDashboardSourceRows = roleDashboardCards.reduce((sum, card) => sum + card.rows, 0);
  const renderRoleSpecificDashboardCards = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="role-specific-dashboard-cards">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Role Dashboard</div>
          <h2 className="text-base font-extrabold text-slate-900">{roleDashboardTitle}</h2>
          <p className="text-xs text-slate-600 mt-1">
            Cards are role-specific, compact, and driven by the live data catalog.
          </p>
        </div>
        <span className={`text-[10px] font-sans font-black px-2 py-1 rounded-lg ${roleDashboardSourceRows > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {roleDashboardSourceRows > 0 ? `${roleDashboardSourceRows} source rows` : "Setup incomplete"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {roleDashboardCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setSelectedRoleCardModel(card.model)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-left hover:border-blue-200 hover:bg-white transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <div className="rounded-lg border border-slate-200 bg-white p-2 shrink-0">
                  {React.createElement(card.icon, { size: 18, className: "text-slate-700" })}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900">{card.model.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">{card.rows > 0 ? card.model.summary : card.model.emptyState}</p>
                </div>
              </div>
              <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full shrink-0 ${card.rows > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {card.rows > 0 ? `${card.rows} rows` : "No rows"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono font-bold">
              <span className="text-blue-700">Source: {card.source}</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">{card.sourceBadge}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-extrabold">
              <span className="text-slate-600">{card.model.drillThroughLabel}</span>
              <ArrowRight size={12} className="text-blue-600" />
            </div>
          </button>
        ))}
      </div>

      {selectedRoleCardModel && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Drill-through</div>
              <h3 className="text-sm font-extrabold text-slate-900">{selectedRoleCardModel.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{selectedRoleCardModel.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRoleCardModel(null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Top rows</div>
              <div className="mt-1 text-sm font-bold text-slate-900">{selectedRoleCardModel.topRows}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Total rows</div>
              <div className="mt-1 text-sm font-bold text-slate-900">{selectedRoleCardModel.totalRows}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Target</div>
              <div className="mt-1 text-[11px] font-bold text-blue-700 break-all">{selectedRoleCardModel.drillThroughTarget}</div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
            <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Applied filters</div>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-slate-700 font-mono">{JSON.stringify(selectedRoleCardModel.filters, null, 2)}</pre>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
            {selectedRoleCardModel.emptyState}
          </div>
        </div>
      )}
    </div>
  );

  const renderRegistersHub = () => {
    const teacherCount = [...new Set((courses || []).map((course) => course.teacherName).filter(Boolean))].length;
    const registerCards = [
      { title: "Students", count: students.length, detail: "Open the live student registry", source: "Master Registry / Student_Directory", drillTab: "students" },
      { title: "Teachers", count: teacherCount, detail: "Open the derived teacher view", source: "Master Registry / Teacher_Allocations", drillTab: "teachers" },
      { title: "Classes & Sections", count: courses.length, detail: "Open the classroom course page", source: "Master Registry / Classes_Sections", drillTab: "courses" },
      { title: "Staff", count: getTabRowCount("masterDataRegistryUrl", "Staff_Directory"), detail: "Open the canonical staff directory", source: "Master Registry / Staff_Directory", drillTab: "staff" },
      { title: "Subjects", count: [...new Set((courses || []).map((course) => course.name).filter(Boolean))].length, detail: "Open the master registry subject tab", source: "Master Registry / Subjects", actionRegistryId: "masterDataRegistryUrl__subjects" },
      { title: "Attendance", count: dashboardSourceState.registries?.find((registry) => /attendance/i.test(registry.label || registry.url || registry.key || ""))?.rowCount || 0, detail: "Open the attendance summary registry", source: "Attendance Registry / Attendance_Summary", actionRegistryId: "dashboardDataSourceUrl__attendance_summary" },
      { title: "Assessments", count: dashboardSourceState.registries?.find((registry) => /assessment/i.test(registry.label || registry.url || registry.key || ""))?.rowCount || 0, detail: "Open the assessment/result registry", source: "Assessment/Result Registry", actionRegistryId: "assessmentResultRegistryUrl__result-processing" },
      { title: "Tasks & Follow-ups", count: tasks.length, detail: "Open dashboard alerts and follow-ups", source: "Dashboard Data Source / Alert_Log", drillTab: "dashboard-data-source" }
    ];

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 outline-none" id="registers-hub" tabIndex={-1}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Registers</div>
            <h2 className="text-base font-extrabold text-slate-900">Live school registers</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Keep live records here instead of mock summaries. Common practice is to centralize students, teachers, classes & sections, staff, subjects, attendance, assessments, and timetables in one register area.
            </p>
          </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-sans font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">
            {students.length + teacherCount + courses.length + tasks.length} live rows
          </span>
            <button
              type="button"
              onClick={openRegistryExplorer}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[10px] font-extrabold text-blue-700 hover:bg-blue-50 cursor-pointer"
            >
              Open Registry Explorer
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {registerCards.map((card) => (
            <div key={card.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <button
                type="button"
                onClick={() => card.actionRegistryId ? openRegistryDataRoute(card.actionRegistryId) : onToggleTab(card.drillTab)}
                className="w-full text-left flex items-center justify-between gap-2 cursor-pointer"
                title={card.actionRegistryId ? `Open ${card.title} registry detail` : `Open ${card.title} page`}
              >
                <h3 className="text-sm font-extrabold text-slate-900">{card.title}</h3>
                <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full ${card.count > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {card.count > 0 ? `${card.count} rows` : "No rows"}
                </span>
              </button>
              <div className="text-xs font-semibold text-slate-600">{card.detail}</div>
              <div className="text-[10px] font-mono font-bold text-blue-700">Source: {card.source}</div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => card.actionRegistryId ? openRegistryDataRoute(card.actionRegistryId) : onToggleTab(card.drillTab)}
                  className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-[10px] font-extrabold text-blue-700 hover:bg-blue-50"
                >
                  {card.actionRegistryId ? "Open Registry" : "Open Tab"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSettingsHub = () => {
    const registryReadyCount = dashboardSourceState.registryHealthSummary.connectedRegistries;
    const registryTotalCount = dashboardSourceState.registryHealthSummary.totalRegistries;
    const driveStatusLabel = isWorkspaceConnectionChecking
      ? "Checking"
      : workspaceConnectionTestResult?.success
        ? "Connected"
        : !workspaceUrl?.trim()
          ? "Not connected"
          : workspaceConnectionTestResult
            ? (() => {
                const lowered = workspaceConnectionTestResult.message.toLowerCase();
                if (lowered.includes("permission") || lowered.includes("origin") || lowered.includes("unauthor") || lowered.includes("auth") || lowered.includes("required")) {
                  return "Access required";
                }
                return "Connection error";
              })()
            : "Status unavailable";
    const registryReadinessLabel = dashboardSourceState.mode === "live"
      ? `${registryReadyCount} of ${registryTotalCount} registry sources ready.`
      : dashboardSourceState.mode === "setup_required"
        ? `Registry setup is incomplete: ${registryReadyCount} of ${registryTotalCount} sources are ready.`
        : "Registry data could not be loaded. Review the source mappings and permissions.";
    const dashboardRefreshLabel = liveDataRefreshState === "refreshing"
      ? "Refreshing registry data..."
      : dashboardSourceState.mode === "live"
        ? "Dashboard data: Refreshed."
        : dashboardSourceState.mode === "setup_required"
          ? "Dashboard data: Refreshed from available sources."
          : "Dashboard refresh could not complete.";
    const resultAction = liveDataRefreshState === "refreshing"
      ? "Checking"
      : workspaceConnectionTestResult?.success
        ? dashboardSourceState.mode === "live" || dashboardSourceState.mode === "setup_required"
          ? "Open Setup Centre"
          : "Review Registry Issues"
        : workspaceConnectionTestResult
          ? "Reconnect Workspace"
          : "Open Setup Centre";

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 outline-none" id="settings-hub" tabIndex={-1}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Settings</div>
            <h2 className="text-base font-extrabold text-slate-900">Configuration and source controls</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Keep configuration separate from working registers. The detailed setup cards now live in the dedicated Setup & Registries page.
            </p>
          </div>
          {isWorkspaceMock && (
            <span className="text-[10px] font-sans font-black px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
              Workspace preview
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Drive Sync</div>
              <h3 className="text-sm font-extrabold text-slate-900">Configure the Google Drive folder used for Schooly registries and supporting files.</h3>
              <p className="text-xs text-slate-600 mt-1">School Registry Folder</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4" id="drive-sync-settings-card" tabIndex={-1}>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-black">School Registry Folder</div>
                <h4 className="text-sm font-extrabold text-slate-900">Google Drive folder containing the school registries and supporting files.</h4>
                <p className="text-xs text-slate-600 mt-1">Use the configured folder or folder ID below. The full value is only shown in this Settings surface.</p>
              </div>
              <span className={`text-[10px] font-sans font-black px-2 py-1 rounded-full border ${driveStatusLabel === "Connected" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : driveStatusLabel === "Access required" || driveStatusLabel === "Connection error" ? "bg-rose-50 text-rose-700 border-rose-200" : driveStatusLabel === "Checking" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {driveStatusLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
              <div className="space-y-1 min-w-0">
                <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-black">Drive Folder URL / ID</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 truncate" title={workspaceUrl || "Not connected"}>
                  {workspaceUrl || "Not connected"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <button
                  type="button"
                  onClick={onEditWorkspaceConnection}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                >
                  Edit URL
                </button>
                <button
                  type="button"
                  onClick={onDisconnectWorkspace}
                  disabled={!workspaceUrl?.trim()}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-extrabold ${workspaceUrl?.trim() ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                >
                  Disconnect
                </button>
                {onTestWorkspaceConnection && (
                  <button
                    type="button"
                    onClick={() => onTestWorkspaceConnection(workspaceUrl || "")}
                    disabled={!workspaceUrl?.trim() || isWorkspaceConnectionChecking}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-extrabold ${workspaceUrl?.trim() ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50" : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                  >
                    {isWorkspaceConnectionChecking ? "Checking" : "Test Connection"}
                  </button>
                )}
              </div>
            </div>
            {(workspaceConnectionTestResult || isWorkspaceConnectionChecking) && (
              <div
                id="drive-sync-result-panel"
                tabIndex={-1}
                role={workspaceConnectionTestResult?.success === false ? "alert" : "status"}
                aria-live={workspaceConnectionTestResult?.success === false ? "assertive" : "polite"}
                aria-atomic="true"
                className={`rounded-xl border px-3 py-3 text-[11px] font-semibold space-y-1.5 whitespace-pre-line break-words scroll-mt-24 ${isWorkspaceConnectionChecking ? "border-blue-200 bg-blue-50 text-blue-800" : workspaceConnectionTestResult?.success === false ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
              >
                <div>{isWorkspaceConnectionChecking ? "Checking connection..." : workspaceConnectionTestResult?.message || "Connection status unavailable."}</div>
                <div className="text-[10px] font-bold text-slate-700">Drive folder: {driveStatusLabel}</div>
                <div className="text-[10px] font-bold text-slate-700">Registry readiness: {registryReadinessLabel}</div>
                <div className="text-[10px] font-bold text-slate-700">{dashboardRefreshLabel}</div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (workspaceConnectionTestResult?.success) {
                        onToggleTab("setup-registries");
                        return;
                      }
                      if (workspaceConnectionTestResult) {
                        onEditWorkspaceConnection?.();
                        return;
                      }
                      onToggleTab("setup-registries");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/70 bg-white px-3 py-1.5 text-[10px] font-extrabold text-slate-700 hover:bg-slate-50"
                  >
                    {resultAction}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Registry Health</div>
                <h3 className="text-sm font-extrabold text-slate-900">Setup and sync status</h3>
              </div>
              <span className="text-[10px] font-sans font-black px-2 py-1 rounded-lg bg-white text-slate-700 border border-slate-200">
                {registryHealthSummary.connectedRegistries}/{registryHealthSummary.totalRegistries} connected
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
              <span className="rounded-full border border-white bg-white px-2.5 py-1 text-slate-700">Warnings {registryHealthSummary.warningRegistries}</span>
              <span className="rounded-full border border-white bg-white px-2.5 py-1 text-slate-700">Critical {registryHealthSummary.criticalRegistries}</span>
              <span className="rounded-full border border-white bg-white px-2.5 py-1 text-slate-700">{registryHealthSummary.onboardingStatus}</span>
            </div>
            <p className="text-xs text-slate-600">{registryHealthSummary.primaryIssue}</p>
            <button
              type="button"
              onClick={openSetupCentre}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
            >
              Open Setup Centre
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Open the Setup Centre</h3>
              <p className="text-xs text-slate-600 mt-1">
                Use this page for registry connections, onboarding, registry overview, and repair actions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onToggleTab("setup-registries")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
              >
                Open Setup Centre <ArrowRight size={12} />
              </button>
              <button
                type="button"
                onClick={() => onToggleTab("overview")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSetupAndRegistriesPage = () => (
    <div className="space-y-6 mt-2 animate-fade-in outline-none" id="setup-and-registries-page" tabIndex={-1}>
      <div className="setup-card-shell bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Data Setup Centre</div>
            <h2 className="text-lg font-extrabold text-slate-900">Connect and review the school&apos;s live registries.</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Use this page for registry connections, readiness checks, catalog details, and repair actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onToggleTab("overview")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              onClick={() => onToggleTab("settings")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-blue-700"
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {renderDashboardSourcePanel()}
        {renderRegistryBootstrapPreview()}
        {renderRegistryDetailPanel()}
      </div>
    </div>
  );

  const renderTeacherDashboard = () => {
    const header = teacherDashboard.header;
    const isSetupState = teacherDashboard.setupState.status !== "live" || !header.name;
    const currentHighlight = teacherDashboard.timetable.find((item) => item.highlight === "current") || teacherDashboard.timetable.find((item) => item.highlight === "next");

    return (
      <div className="space-y-6" id="teacher-dashboard-root">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-xl shrink-0">
                {header.initials || "T"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                    Teacher Dashboard
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isSetupState ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {isSetupState ? "Setup incomplete" : "Live data"}
                  </span>
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 truncate">{header.name || "Teacher dashboard setup required"}</h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                  <span className="truncate">{header.label || "Teacher"}</span>
                  <span className="truncate">{header.subject || "Subject pending"}</span>
                  <span className="truncate">
                    {header.classes.length > 0
                      ? header.classes.map((className) => formatClassLabel(className) || className).join(", ")
                      : "Classes pending"}
                  </span>
                  <span className="truncate">{header.academicSession || "Academic session pending"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Staff ID: {header.staffId || "Pending"}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Source: {header.source.workbook} / {header.source.tab}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Rows: {header.source.rowCount}</span>
          </div>
        </div>

        {isSetupState && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-amber-900">{teacherDashboard.setupState.title}</h3>
                <p className="text-xs text-amber-800 mt-1">{teacherDashboard.setupState.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {teacherDashboard.setupState.messages.map((message) => (
                    <span key={message} className="inline-flex rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold text-amber-800">
                      {message}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Required Registries</div>
              <h3 className="text-sm font-extrabold text-slate-900">Live source map for this teacher view</h3>
            </div>
            <span className="text-[10px] font-sans font-black rounded-full bg-slate-100 text-slate-700 px-2 py-1">{teacherDashboard.sourceHealth.length} linked</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {teacherDashboard.sourceHealth.map((source) => (
              <span
                key={`${source.workbook}-${source.tab}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700"
                title={`${formatTeacherDashboardSource(source)} | ${source.rowCount} rows`}
              >
                <span className="truncate">{formatTeacherDashboardSource(source)}</span>
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-500">{source.rowCount}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {teacherDashboard.kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-slate-500 truncate">{kpi.label}</div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${kpi.status === "healthy" ? "bg-emerald-50 text-emerald-700" : kpi.status === "warning" ? "bg-amber-50 text-amber-700" : kpi.status === "attention" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{formatTeacherDashboardSource(kpi.source)}</span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{kpi.value}</div>
              <div className="mt-1 text-xs text-slate-600 truncate">{kpi.detail}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Today&apos;s Timetable</div>
                <h3 className="text-sm font-extrabold text-slate-900">Today&apos;s timetable</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-blue-50 text-blue-700 px-2 py-1">{currentHighlight ? currentHighlight.highlight.toUpperCase() : "SETUP"}</span>
            </div>
            <div className="mt-4 space-y-2">
              {teacherDashboard.timetable.length > 0 ? teacherDashboard.timetable.slice(0, DASHBOARD_ROW_LIMIT).map((period) => (
                <div key={period.id} className={`rounded-xl border p-3 flex items-start justify-between gap-3 ${period.highlight === "current" ? "border-blue-200 bg-blue-50/60" : period.highlight === "next" ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">{period.day}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">{renderClassLabel(period.className)}{period.section ? `-${period.section}` : ""}</span>
                      <span className={`rounded-full border px-2 py-0.5 ${period.highlight === "current" ? "border-blue-200 bg-blue-50 text-blue-700" : period.highlight === "next" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}>{period.highlight === "current" ? "Now" : period.highlight === "next" ? "Next" : "Planned"}</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 truncate">{period.subject || "Subject pending"}</div>
                    <div className="mt-0.5 text-xs text-slate-600 truncate">{period.startTime || "-"} - {period.endTime || "-"} {period.room ? `| ${period.room}` : ""}</div>
                    <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(period.source)}</div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-500 shrink-0">{period.status || "Scheduled"}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Timetable not configured for this teacher. Add rows in Schooly_Master_Data_Registry / Timetable.</div>
              )}
            </div>
            {teacherDashboard.timetable.length > DASHBOARD_ROW_LIMIT && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onToggleTab("classroom")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                >
                  View All ({teacherDashboard.timetable.length})
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Pending Tasks</div>
                <h3 className="text-sm font-extrabold text-slate-900">Pending tasks / action queue</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-rose-50 text-rose-700 px-2 py-1">{teacherDashboard.pendingTasks.length} open</span>
            </div>
            <div className="mt-4 space-y-2">
              {teacherDashboard.pendingTasks.length > 0 ? teacherDashboard.pendingTasks.slice(0, DASHBOARD_ROW_LIMIT).map((task) => (
                <div key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{task.title}</div>
                      <div className="mt-1 text-xs text-slate-600 truncate">{task.detail || task.sourceLabel}</div>
                    </div>
                    <span className={`text-[10px] font-sans font-black rounded-full px-2 py-0.5 shrink-0 ${task.severity === "critical" ? "bg-rose-50 text-rose-700" : task.severity === "high" ? "bg-amber-50 text-amber-700" : task.severity === "medium" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{task.statusLabel}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{task.sourceLabel} / {task.dueLabel}</span>
                    <button type="button" onClick={() => task.actionTab ? onToggleTab(task.actionTab) : undefined} disabled={!task.actionTab} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${task.actionTab ? "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50" : "border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                      {task.actionLabel}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No open tasks were found. Seed Dashboard Data Source / Dashboard_Alerts, Planner_Submissions, Classroom_Assignment_Map, Marks_Entry, Lesson_Workspace_Registry, or Classroom_Publish_Log.</div>
              )}
            </div>
            {teacherDashboard.pendingTasks.length > DASHBOARD_ROW_LIMIT && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onToggleTab("tasks")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] font-extrabold text-rose-700 hover:bg-rose-50"
                >
                  View All ({teacherDashboard.pendingTasks.length})
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {teacherDashboard.quickLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => link.actionTab ? onToggleTab(link.actionTab) : undefined}
                disabled={!link.available}
                className={`flex min-w-[180px] flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left ${link.available ? "border-slate-200 bg-slate-50 hover:bg-white" : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{link.label}</div>
                  <div className="text-[11px] text-slate-600 truncate">{link.detail}</div>
                </div>
                <span className="text-[10px] font-sans font-bold rounded-full border border-slate-200 bg-white px-2 py-1">{link.actionLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">My Class Performance</div>
                <h3 className="text-sm font-extrabold text-slate-900">My class performance</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-blue-50 text-blue-700 px-2 py-1">{teacherDashboard.classPerformance.length} classes</span>
            </div>
            <div className="mt-4 space-y-3">
              {teacherDashboard.classPerformance.length > 0 ? teacherDashboard.classPerformance.slice(0, DASHBOARD_ROW_LIMIT).map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate">{renderClassLabel(item.className)}{item.section ? `-${item.section}` : ""} | {item.subject}</span>
                    <span>{item.percent}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, item.percent))}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 truncate">{item.summary}</div>
                  <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(item.source)}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No assessment results found. Seed Assessment / Result Registry / Result_Analysis or Marks_Entry.</div>
              )}
            </div>
            {teacherDashboard.classPerformance.length > DASHBOARD_ROW_LIMIT && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onToggleTab("registries")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                >
                  View All ({teacherDashboard.classPerformance.length})
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">My Classroom Posts / Themes</div>
                <h3 className="text-sm font-extrabold text-slate-900">My classroom posts / themes</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-cyan-50 text-cyan-700 px-2 py-1">{teacherDashboard.classroomActivity.length} posts</span>
            </div>
            <div className="mt-4 space-y-2">
              {teacherDashboard.classroomActivity.length > 0 ? teacherDashboard.classroomActivity.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-sans font-black rounded-full border border-blue-200 bg-white px-2 py-0.5 text-blue-700 truncate">{item.tag}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{item.postedAt ? formatTeacherDashboardDateTime(item.postedAt) : "Live"}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 truncate">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-600 line-clamp-2">{item.detail || "Live classroom activity"}</div>
                  <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(item.source)}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No classroom activity rows were found. Seed Google Classroom Sync Registry / Classroom_Announcement_Sync or Dashboard Data Source / Classroom_Activity.</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Assessment Tracking</div>
                <h3 className="text-sm font-extrabold text-slate-900">My assessment tracking</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">{teacherDashboard.assessmentTracking.length} items</span>
            </div>
            <div className="mt-4 space-y-2">
              {teacherDashboard.assessmentTracking.length > 0 ? teacherDashboard.assessmentTracking.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-600 mt-1 truncate">{renderClassLabel(item.className)}{item.section ? `-${item.section}` : ""} | {item.subject}</div>
                    </div>
                    <span className="text-[10px] font-sans font-black rounded-full border border-slate-200 bg-white px-2 py-0.5">{item.dueLabel}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5">{item.completionLabel}</span>
                    <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">{item.marksStatusLabel}</span>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">{item.analysisStatusLabel}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(item.source)}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No assessment rows found. Seed Assessment / Result Registry / Assessment_Plan, Marks_Entry, Result_Analysis, or Question_Paper_Registry.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Invigilation & Olympiads</div>
                <h3 className="text-sm font-extrabold text-slate-900">My invigilation & olympiads</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-slate-100 text-slate-700 px-2 py-1">{teacherDashboard.invigilationDuty ? "1 live duty" : "Setup incomplete"}</span>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {teacherDashboard.invigilationDuty ? (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-slate-900 truncate">{teacherDashboard.invigilationDuty.eventName}</div>
                  <div className="text-xs text-slate-600">{teacherDashboard.invigilationDuty.eventType} | {renderClassLabel(teacherDashboard.invigilationDuty.className)}{teacherDashboard.invigilationDuty.section ? `-${teacherDashboard.invigilationDuty.section}` : ""} | {teacherDashboard.invigilationDuty.subject}</div>
                  <div className="text-[11px] font-mono text-slate-500">{formatTeacherDashboardDate(teacherDashboard.invigilationDuty.dutyDate)} | {teacherDashboard.invigilationDuty.status}</div>
                  <div className="text-[10px] font-mono font-bold text-slate-500">Source: Assessment / Result Registry / Invigilation_Olympiad_Duties</div>
                </div>
              ) : (
                <div className="text-sm font-semibold text-amber-800">Invigilation/Olympiad duty registry not configured. Add Assessment / Result Registry / Invigilation_Olympiad_Duties.</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Renewal Status</div>
                <h3 className="text-sm font-extrabold text-slate-900">My renewal status</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-slate-100 text-slate-700 px-2 py-1">{teacherDashboard.renewalStatus.statusLabel || "Setup incomplete"}</span>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="font-semibold text-slate-900">{teacherDashboard.renewalStatus.title}</div>
              <div className="mt-1 text-slate-600">{teacherDashboard.renewalStatus.message}</div>
              {teacherDashboard.renewalStatus.nextReviewDate ? (
                <div className="mt-2 text-[11px] font-mono text-slate-500">Next review: {formatTeacherDashboardDate(teacherDashboard.renewalStatus.nextReviewDate)}</div>
              ) : null}
              <div className="mt-2 text-[10px] font-mono font-bold text-slate-500">Source: Schooly_Teacher_CPD_Renewal_Registry / Teacher_CPD_Status</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Recent Classroom Announcements</div>
                <h3 className="text-sm font-extrabold text-slate-900">Recent classroom announcements</h3>
              </div>
              <button type="button" onClick={() => onToggleTab("classroom")} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50">
                Track class updates
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {teacherDashboard.announcements.length > 0 ? teacherDashboard.announcements.slice(0, 5).map((announcement) => (
                <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold text-blue-700">{renderClassLabel(announcement.className)}{announcement.section ? `-${announcement.section}` : ""}</span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.subject || "General"}</span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.status}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 truncate">{announcement.title}</div>
                  <div className="mt-1 text-xs text-slate-600 line-clamp-2">{announcement.text}</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="font-mono">{announcement.postedAt ? formatTeacherDashboardDateTime(announcement.postedAt) : "Live"}</span>
                    {announcement.url ? <span className="truncate max-w-[50%]">Classroom link available</span> : <span>Announcement details pending</span>}
                  </div>
                  <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(announcement.source)}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No classroom announcement rows were found. Add Google Classroom Sync Registry / Classroom_Announcement_Sync.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderManagerDashboard = () => {
    const profile = managerDashboard.profile;
    const isSetupState = managerDashboard.setupState.status !== "live" || !profile.name;
    const metricTone = (status: string) => {
      if (status === "healthy") return "border-emerald-200 bg-emerald-50 text-emerald-700";
      if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
      if (status === "attention") return "border-rose-200 bg-rose-50 text-rose-700";
      return "border-slate-200 bg-slate-50 text-slate-600";
    };
    const checklistTone = (severity: string) => {
      if (severity === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
      if (severity === "high") return "border-amber-200 bg-amber-50 text-amber-700";
      if (severity === "warning") return "border-blue-200 bg-blue-50 text-blue-700";
      return "border-slate-200 bg-slate-50 text-slate-600";
    };

    return (
      <div className="space-y-6" id="manager-dashboard-root">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 rounded-full border border-slate-200 bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-xl shrink-0">
                {profile.initials || "MG"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                    {profile.roleLabel || "School Manager"}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isSetupState ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {isSetupState ? "Setup incomplete" : "Live data"}
                  </span>
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 truncate">
                  Welcome back, {profile.name || "Manager dashboard setup required"}
                </h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                  <span className="truncate">{profile.oversightLabel || "Operational oversight"}</span>
                  <span className="truncate">{profile.performanceLabel || "Performance review pending"}</span>
                  <span className="truncate">{profile.academicSession ? `Session ${profile.academicSession}` : "Academic year pending"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Source: {formatTeacherDashboardSource(profile.source)}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Session: {profile.academicSession || "Pending"}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Oversight: {profile.oversightLabel || "Pending"}</span>
          </div>
        </div>

        {isSetupState && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-amber-900">{managerDashboard.setupState.title}</h3>
                <p className="text-xs text-amber-800 mt-1">{managerDashboard.setupState.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {managerDashboard.setupState.messages.map((message) => (
                    <span key={message} className="inline-flex rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold text-amber-800">
                      {message}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {managerDashboard.kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-slate-500 truncate">{kpi.label}</div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${metricTone(kpi.status)}`}>
                  {formatTeacherDashboardSource(kpi.source)}
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{kpi.value}</div>
              <div className="mt-1 text-xs text-slate-600 truncate">{kpi.detail}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Strategic Operational Metrics</div>
                <h3 className="text-sm font-extrabold text-slate-900">Strategic operational metrics and performance chart</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-blue-50 text-blue-700 px-2 py-1">{managerDashboard.operationalMetrics.length} metrics</span>
            </div>
            <div className="mt-4 space-y-3">
              {managerDashboard.operationalMetrics.length > 0 ? managerDashboard.operationalMetrics.map((metric) => (
                <div key={metric.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{metric.label}</div>
                      <div className="mt-1 text-[11px] text-slate-600 truncate">{metric.detail}</div>
                    </div>
                    <span className={`text-[10px] font-sans font-black rounded-full px-2 py-0.5 shrink-0 ${metricTone(metric.status)}`}>
                      {metric.value}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${metric.status === "healthy" ? "bg-emerald-500" : metric.status === "warning" ? "bg-amber-500" : metric.status === "attention" ? "bg-rose-500" : "bg-slate-400"}`} style={{ width: `${Math.max(0, Math.min(100, metric.percent))}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-mono font-bold text-slate-500">
                    <span>Source: {formatTeacherDashboardSource(metric.source)}</span>
                    <span>{metric.percent > 0 ? `${metric.percent}%` : "Setup incomplete"}</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  No live operational metrics were found. Seed Dashboard_Metrics, Planner_Submissions, Classroom_Activity, Evidence_Gaps, or SQAA evidence rows.
                </div>
              )}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onToggleTab("registry-detail")}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700"
              >
                Open source detail
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Strategic Milestones</div>
                <h3 className="text-sm font-extrabold text-slate-900">Strategic milestones and compliance checklist</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-slate-100 text-slate-700 px-2 py-1">{managerDashboard.complianceChecklist.length} items</span>
            </div>
            <div className="mt-4 space-y-2">
              {managerDashboard.complianceChecklist.length > 0 ? managerDashboard.complianceChecklist.map((item) => (
                <div key={item.id} className={`rounded-xl border p-3 ${checklistTone(item.severity)}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {item.severity === "critical" || item.severity === "high" ? <AlertTriangle size={15} className="text-current" /> : <Check size={15} className="text-current" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-600 truncate">{item.detail}</div>
                    </div>
                    <span className="text-[10px] font-sans font-black rounded-full border border-current/20 bg-white/75 px-2 py-0.5 shrink-0">
                      {item.statusLabel}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(item.source)}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  Strategic_Milestones, Operational_Checklist, and QA checklist rows are not configured yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Recent Classroom Announcements</div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent classroom announcements</h3>
            </div>
            <button type="button" onClick={() => onToggleTab("registry-detail")} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50">
              Track class sync
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {managerDashboard.announcements.length > 0 ? managerDashboard.announcements.slice(0, 5).map((announcement) => (
              <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold text-blue-700">{renderClassLabel(announcement.className)}{announcement.section ? `-${announcement.section}` : ""}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.subject || "General"}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.status}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 truncate">{announcement.title}</div>
                <div className="mt-1 text-xs text-slate-600 line-clamp-2">{announcement.text}</div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-mono">{announcement.postedAt ? formatTeacherDashboardDateTime(announcement.postedAt) : "Live"}</span>
                  {announcement.url ? (
                    <button
                      type="button"
                      onClick={() => window.open(announcement.url, "_blank", "noopener,noreferrer")}
                      className="text-[10px] font-black text-blue-700 hover:underline bg-transparent border-none cursor-pointer p-0"
                    >
                      Open announcement
                    </button>
                  ) : (
                    <span>Update details pending</span>
                  )}
                </div>
                <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(announcement.source)}</div>
              </div>
            )) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No classroom announcement rows were found. Seed Classroom_Announcement_Sync in the Classroom Sync Registry.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStudentDashboard = () => {
    const profile = studentDashboard.header;
    const isSetupState = studentDashboard.setupState.status !== "live" || !profile.name;
    const taskTone = (task: StudentDashboardTask) => {
      if (task.completed) return "border-emerald-200 bg-emerald-50 text-emerald-700";
      if ((task.statusLabel || "").toLowerCase().includes("overdue")) return "border-rose-200 bg-rose-50 text-rose-700";
      if ((task.statusLabel || "").toLowerCase().includes("pending")) return "border-amber-200 bg-amber-50 text-amber-700";
      return "border-slate-200 bg-slate-50 text-slate-600";
    };
    const kpiTone = (status: string) => {
      if (status === "healthy") return "border-emerald-200 bg-emerald-50 text-emerald-700";
      if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
      if (status === "attention") return "border-rose-200 bg-rose-50 text-rose-700";
      return "border-slate-200 bg-slate-50 text-slate-600";
    };
    const timetableTone = (highlight: StudentTimetableItem["highlight"]) => {
      if (highlight === "current") return "border-emerald-200 bg-emerald-50/80";
      if (highlight === "next") return "border-blue-200 bg-blue-50/70";
      return "border-slate-200 bg-slate-50";
    };
    const taskRows = studentTasksList.length > 0 ? studentTasksList : studentDashboard.tasks;
    const visibleTimetable = studentDashboard.timetable.length > 0 ? studentDashboard.timetable.slice(0, 4) : [];
    const visibleAnnouncements = studentDashboard.announcements.length > 0 ? studentDashboard.announcements.slice(0, 5) : [];
    const quickResources = studentDashboard.resources.slice(0, 2);
    const sourceRowCount = studentDashboard.sourceHealth.reduce((sum, item) => sum + item.rowCount, 0);
    const footerNoteText = studentDashboard.tasks.find((task) => task.detail)?.detail || studentDashboard.announcements[0]?.text || "Use the classroom tab to review live assignment and timetable rows.";

    const toggleTask = (taskId: string) => {
      setStudentCheckedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
    };

    return (
      <div className="space-y-6" id="student-dashboard-root">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 rounded-full border border-slate-200 bg-gradient-to-br from-cyan-600 to-blue-500 text-white flex items-center justify-center font-black text-xl shrink-0">
                {profile.initials || "ST"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-700">
                    {profile.label || "Student Portal"}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isSetupState ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {isSetupState ? "Setup incomplete" : "Live data"}
                  </span>
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 truncate">
                  Welcome back, {profile.name || "Student dashboard setup required"}
                </h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                  <span className="truncate">{formatClassLabel(profile.className) || profile.className || "Class pending"}{profile.section ? `-${profile.section}` : ""} Student</span>
                  <span className="truncate">{profile.academicSession ? `Session ${profile.academicSession}` : "Academic year pending"}</span>
                  {profile.rollNumber ? <span className="truncate">Roll {profile.rollNumber}</span> : null}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Source: {formatTeacherDashboardSource(profile.source)}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Rows: {profile.source.rowCount}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Session: {profile.academicSession || "Pending"}</span>
          </div>
        </div>

        {isSetupState && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-amber-900">{studentDashboard.setupState.title}</h3>
                <p className="text-xs text-amber-800 mt-1">{studentDashboard.setupState.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {studentDashboard.setupState.messages.map((message) => (
                    <span key={message} className="inline-flex rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold text-amber-800">
                      {message}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {studentDashboard.kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-slate-500 truncate">{kpi.label}</div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${kpiTone(kpi.status)}`}>
                  {formatTeacherDashboardSource(kpi.source)}
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{kpi.value}</div>
              <div className="mt-1 text-xs text-slate-600 truncate">{kpi.detail}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Personal Tasks</div>
                <h3 className="text-sm font-extrabold text-slate-900">Personal tasks and Google Classroom assignments checklist</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-blue-50 text-blue-700 px-2 py-1">{taskRows.filter((task) => !task.completed).length} open</span>
            </div>
            <div className="mt-4 space-y-2">
              {taskRows.length > 0 ? taskRows.slice(0, 4).map((task) => {
                const checked = task.completed || studentCheckedTasks.includes(task.id);
                return (
                  <div key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 truncate">{task.subject || "Student work"}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${taskTone(task)}`}>{task.statusLabel}</span>
                        </div>
                        <div className={`mt-2 text-sm font-bold truncate ${checked ? "text-slate-500 line-through" : "text-slate-900"}`}>{task.title}</div>
                        <div className="mt-1 text-xs text-slate-600 truncate">{task.detail || task.dueLabel}</div>
                        <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Due: {task.dueLabel} | Source: {formatTeacherDashboardSource(task.source)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold border shrink-0 ${checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-white text-blue-700 hover:bg-blue-50"}`}
                      >
                        {checked ? "Submitted" : task.actionLabel}
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No live student task rows were found. Seed Classroom_Assignment_Map, Classroom_Submission_Sync, or Dashboard_Alerts.</div>
              )}
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {studentDashboard.setupState.status === "live" ? footerNoteText : studentDashboard.setupState.message}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Active Timetable</div>
                <h3 className="text-sm font-extrabold text-slate-900">My Grade timetable and daily schedule</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">{visibleTimetable.length > 0 ? `${visibleTimetable.length} periods` : "Setup incomplete"}</span>
            </div>
            <div className="mt-4 space-y-2">
              {visibleTimetable.length > 0 ? visibleTimetable.map((item) => (
                <div key={item.id} className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${timetableTone(item.highlight)}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">{renderClassLabel(item.className)}{item.section ? `-${item.section}` : ""}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">{item.timeLabel || "Scheduled"}</span>
                      <span className={`rounded-full border px-2 py-0.5 ${item.highlight === "current" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : item.highlight === "next" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"}`}>
                        {item.highlight === "current" ? "Now" : item.highlight === "next" ? "Next" : item.statusLabel || "Planned"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 truncate">{item.title}</div>
                    <div className="mt-0.5 text-xs text-slate-600 truncate">{item.subject || "Subject pending"}{item.room ? ` | ${item.room}` : ""}</div>
                    <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(item.source)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.actionTab ? onToggleTab(item.actionTab) : undefined}
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold border shrink-0 ${item.highlight === "current" ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    {item.actionLabel}
                  </button>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Timetable not configured for this student. Add live rows in Schooly_Master_Data_Registry / Timetable.</div>
              )}
            </div>
            {quickResources.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-bold text-slate-800">Study Files Quick Access Folder:</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quickResources.map((resource) => (
                    <button
                      key={resource.id}
                      type="button"
                      onClick={() => resource.actionTab ? onToggleTab(resource.actionTab) : undefined}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <BookOpen size={11} className="text-blue-600" />
                      <span className="truncate">{resource.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Recent Classroom Announcements</div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent classroom announcements</h3>
            </div>
            <button type="button" onClick={() => onToggleTab("classroom")} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50">
              Track class syllabus
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {visibleAnnouncements.length > 0 ? visibleAnnouncements.map((announcement) => (
              <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-200 bg-white px-2 py-0.5 text-[10px] font-bold text-cyan-700">{renderClassLabel(announcement.className)}{announcement.section ? `-${announcement.section}` : ""}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.subject || "General"}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.status}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 truncate">{announcement.title}</div>
                <div className="mt-1 text-xs text-slate-600 line-clamp-2">{announcement.text}</div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-mono">{announcement.postedAt ? formatTeacherDashboardDateTime(announcement.postedAt) : "Live"}</span>
                  <span className="truncate max-w-[55%]">{announcement.teacherName || "Teacher name pending"}</span>
                </div>
                <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(announcement.source)}</div>
              </div>
            )) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No classroom announcement rows were found. Add Classroom_Announcement_Sync or Classroom_Activity rows.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCoordinatorDashboard = () => {
    const profile = coordinatorDashboard.coordinatorProfile;
    const isSetupState = coordinatorDashboard.setupState.status !== "live" || !profile.name;
    const statusBadge = (status: string) => {
      const token = status.toLowerCase();
      if (token.includes("submitted") || token.includes("live") || token.includes("complete")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
      if (token.includes("partial") || token.includes("review")) return "bg-amber-50 text-amber-700 border-amber-200";
      if (token.includes("pending")) return "bg-blue-50 text-blue-700 border-blue-200";
      return "bg-slate-100 text-slate-600 border-slate-200";
    };
    const statusClass = (value: string) => statusBadge(value);
    const filteredRemedial = coordinatorDashboard.remedialTracking.filter((item) => {
      const matchesSearch = !coordinatorSearch ||
        [item.name, item.className, item.section, item.riskArea, item.owner, item.status].some((value) => String(value || "").toLowerCase().includes(coordinatorSearch.toLowerCase()));
      const matchesStatus = coordinatorStatusFilter === "all" || String(item.status || "").toLowerCase().includes(coordinatorStatusFilter.toLowerCase());
      const classLabel = item.section ? `${item.className}-${item.section}` : item.className;
      const matchesClass = coordinatorClassFilter === "all" || classLabel === coordinatorClassFilter;
      return matchesSearch && matchesStatus && matchesClass;
    });
    const uniqueCoordinatorClasses = Array.from(new Set(coordinatorDashboard.plannerStatusMatrix.rows.map((row) => row.section ? `${row.className}-${row.section}` : row.className).filter(Boolean))) as string[];
    uniqueCoordinatorClasses.sort(compareClassLabels);
    const activeClasses = coordinatorDashboard.plannerStatusMatrix.rows.length;

    return (
      <div className="space-y-6" id="coordinator-dashboard-root">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-600 to-cyan-500 text-white flex items-center justify-center font-black text-xl shrink-0">
                {profile.initials || "MC"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-700">
                    Coordinator Dashboard
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isSetupState ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {isSetupState ? "Setup incomplete" : "Live data"}
                  </span>
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 truncate">{profile.name || "Coordinator dashboard setup required"}</h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                  <span className="truncate">{profile.label || "Academic Coordinator"}</span>
                  <span className="truncate">{profile.academicSession ? `Session ${profile.academicSession}` : "Academic session pending"}</span>
                  <span className="truncate">{profile.configuredScope || "Coordinator scope not configured."}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Source: {formatTeacherDashboardSource(profile.source)}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Rows: {profile.source.rowCount}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Academic year: {profile.academicSession || "Pending"}</span>
          </div>
        </div>

        {isSetupState && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-amber-900">{examsDashboard.setupState.title}</h3>
                <p className="text-xs text-amber-800 mt-1">{examsDashboard.setupState.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {examsDashboard.setupState.messages.map((message) => (
                    <span key={message} className="inline-flex rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold text-amber-800">
                      {message}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {examsDashboard.kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-slate-500 truncate">{kpi.label}</div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${kpi.status === "healthy" ? "bg-emerald-50 text-emerald-700" : kpi.status === "warning" ? "bg-amber-50 text-amber-700" : kpi.status === "attention" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{formatTeacherDashboardSource(kpi.source)}</span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{kpi.value}</div>
              <div className="mt-1 text-xs text-slate-600 truncate">{kpi.detail}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-violet-600">AP &amp; CBSE Boards Preparation Analytics Grid</div>
                <h3 className="text-sm font-extrabold text-slate-900">Board subject stats</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-violet-50 text-violet-700 px-2 py-1">Subject stats</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              {examsDashboard.boardSubjectStats.length > 0 ? (
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
                      <th className="py-2 pr-3">Board</th>
                      <th className="py-2 pr-3">Subject</th>
                      <th className="py-2 pr-3">Registered no</th>
                      <th className="py-2 pr-3">Syllabus complete</th>
                      <th className="py-2 pr-3">Mock average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examsDashboard.boardSubjectStats.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="py-3 pr-3 font-semibold text-slate-800 truncate">{row.board}</td>
                        <td className="py-3 pr-3 font-semibold text-slate-800 truncate">{row.subject}</td>
                        <td className="py-3 pr-3 font-sans font-bold text-slate-600">{row.registeredCount}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-28 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, row.syllabusCompliance))}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700">{row.syllabusCompliance}% (Audited)</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 font-sans font-bold text-slate-700">{row.mockAverage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No board subject stats found. Seed Assessment_Plan, Result_Analysis, Marks_Entry, or Question_Paper_Registry.</div>
              )}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onToggleTab("registries")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-violet-700"
              >
                Export Board Registration Ledgers
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-violet-600">Draft Exam Verification &amp; Question Paper Review</div>
                <h3 className="text-sm font-extrabold text-slate-900">Draft exam verification &amp; question paper review</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">Auditing</span>
            </div>
            <div className="mt-4 space-y-2">
              {examsDashboard.verificationItems.length > 0 ? examsDashboard.verificationItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-600 line-clamp-2">{item.detail}</div>
                    </div>
                    <span className={`text-[10px] font-sans font-black rounded-full px-2 py-0.5 shrink-0 border ${statusClass(item.statusLabel)}`}>{item.statusLabel || "Review"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(item.source)}</span>
                    <button
                      type="button"
                      onClick={() => item.actionTab ? onToggleTab(item.actionTab) : undefined}
                      disabled={!item.actionTab}
                      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${item.actionTab ? "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50" : "border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No draft paper rows found. Seed Question_Paper_Registry or Assessment_Plan.</div>
              )}
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Notice: Approved mid-term papers should be digitally hashed and locked before signing.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono font-black text-violet-600">Recent Classroom Announcements</div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent classroom announcements</h3>
            </div>
            <button type="button" onClick={() => onToggleTab("registries")} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-2 text-[11px] font-extrabold text-violet-700 hover:bg-violet-50">
              Track Class Syllabi
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {examsDashboard.announcements.length > 0 ? examsDashboard.announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-700">{renderClassLabel(announcement.className)}{announcement.section ? `-${announcement.section}` : ""}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.subject || "General"}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.status}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 truncate">{announcement.title}</div>
                <div className="mt-1 text-xs text-slate-600 line-clamp-2">{announcement.text || "Announcement details pending"}</div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-mono">{announcement.postedAt ? formatTeacherDashboardDateTime(announcement.postedAt) : "Live"}</span>
                  <span className="truncate max-w-[45%]">{announcement.teacherName || "Teacher name pending"}</span>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No announcements this week. Seed Classroom_Announcement_Sync or Classroom_Activity.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderExamsDashboard = renderCoordinatorDashboard;

  const renderParentDashboard = () => {
    const header = parentDashboard.header;
    const isSetupState = parentDashboard.setupState.status !== "live" || !header.name;

    const ticketTone = (value: string) => {
      const token = String(value || "").toLowerCase();
      if (/(resolved|closed|done|complete|cleared)/.test(token)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
      if (/(open|new|pending|review|active)/.test(token)) return "bg-amber-50 text-amber-700 border-amber-200";
      return "bg-slate-100 text-slate-600 border-slate-200";
    };

    return (
      <div className="space-y-6" id="parent-dashboard-root">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center font-black text-xl shrink-0">
                {header.initials || "PT"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Parent Representative
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isSetupState ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {isSetupState ? "Setup incomplete" : "Live data"}
                  </span>
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 truncate">{header.name || "Parents liaison"}</h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                  <span className="truncate">{header.committeeLabel || "Parent Advisory Committee"}</span>
                  <span className="truncate">{header.liaisonLabel || "Liaison Officer"}</span>
                  <span className="truncate">{header.academicSession || "Academic session pending"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Source: {formatTeacherDashboardSource(header.source)}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Rows: {header.source.rowCount}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Session: {header.academicSession || "Pending"}</span>
          </div>
        </div>

        {isSetupState && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-amber-900">{parentDashboard.setupState.title}</h3>
                <p className="text-xs text-amber-800 mt-1">{parentDashboard.setupState.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {parentDashboard.setupState.messages.map((message) => (
                    <span key={message} className="inline-flex rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold text-amber-800">
                      {message}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {parentDashboard.kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-slate-500 truncate">{kpi.label}</div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${kpi.status === "healthy" ? "bg-emerald-50 text-emerald-700" : kpi.status === "warning" ? "bg-amber-50 text-amber-700" : kpi.status === "attention" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{formatTeacherDashboardSource(kpi.source)}</span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{kpi.value}</div>
              <div className="mt-1 text-xs text-slate-600 truncate">{kpi.detail}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-emerald-600">Parent Portal &amp; Principal&apos;s Announcements Notice Board</div>
                <h3 className="text-sm font-extrabold text-slate-900">Parent portal notice board</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">Latest updates</span>
            </div>
            <div className="mt-4 space-y-2">
              {parentDashboard.notices.length > 0 ? parentDashboard.notices.map((notice) => (
                <div key={notice.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700">{renderClassLabel(notice.className)}{notice.section ? `-${notice.section}` : ""}</span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{notice.title}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 truncate">{notice.text}</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="font-mono">{notice.postedAt ? formatTeacherDashboardDateTime(notice.postedAt) : "Live"}</span>
                    <span className="truncate">{formatTeacherDashboardSource(notice.source)}</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No announcements this week. Seed Classroom_Announcement_Sync or Classroom_Activity.</div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wider font-mono font-black text-slate-500">File advisory ticket to executive committee</div>
              <div className="mt-2 flex gap-2">
                <input
                  disabled
                  placeholder="Enter issue (e.g. feedback regarding bus fleet timings...)"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-extrabold text-slate-500 cursor-not-allowed"
                >
                  Submit Ticket
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {parentDashboard.advisoryTickets.length > 0 ? parentDashboard.advisoryTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{ticket.title}</div>
                        <div className="mt-1 text-xs text-slate-600 truncate">{ticket.detail}</div>
                      </div>
                      <span className={`text-[10px] font-sans font-black rounded-full px-2 py-0.5 shrink-0 border ${ticketTone(ticket.statusLabel)}`}>{ticket.statusLabel}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500">{ticket.dueLabel}</span>
                      <button
                        type="button"
                        onClick={() => ticket.actionTab ? onToggleTab(ticket.actionTab) : undefined}
                        disabled={!ticket.actionTab}
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${ticket.actionTab ? "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50" : "border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                      >
                        {ticket.actionLabel}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No advisory ticket rows found. Seed Dashboard_Alerts for live parent support items.</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-emerald-600">Safety Records &amp; Pupil Transport Updates</div>
                <h3 className="text-sm font-extrabold text-slate-900">Safety records and transport updates</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">Audited</span>
            </div>
            <div className="mt-4 space-y-2">
              {parentDashboard.safetyItems.length > 0 ? parentDashboard.safetyItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-500 truncate">{item.label}</div>
                      <div className="mt-1 text-sm font-bold text-slate-900 truncate">{item.detail}</div>
                    </div>
                    <span className="text-[10px] font-sans font-black rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-emerald-700 shrink-0">{item.statusLabel}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(item.source)}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No safety rows found. Seed Dashboard_Alerts or Classroom_Sync_Log.</div>
              )}
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold text-slate-800">Emergency Advisory Helpline: +91 999 000 1122</div>
              <div className="mt-1 text-xs text-slate-600">Transport desk updates are pushed instantly to parent portal nodes.</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHodDashboard = () => {
    const profile = hodDashboard.hodProfile;
    const isSetupState = hodDashboard.setupState.status !== "live" || !profile.name;
    const statusBadge = (status: string) => {
      const token = status.toLowerCase();
      if (token.includes("done") || token.includes("live") || token.includes("active") || token.includes("complete")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
      if (token.includes("partial") || token.includes("review") || token.includes("watch")) return "bg-amber-50 text-amber-700 border-amber-200";
      if (token.includes("missing") || token.includes("low") || token.includes("critical")) return "bg-rose-50 text-rose-700 border-rose-200";
      return "bg-slate-100 text-slate-600 border-slate-200";
    };
    const sourceBadge = (source: { workbook: string; tab: string; rowCount: number }) => (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-mono font-black text-slate-700">
        <span className="truncate max-w-[180px]">{source.workbook} / {source.tab}</span>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-sans text-slate-500">{source.rowCount}</span>
      </span>
    );

    const repositoryRows = [...hodDashboard.repositoryHealthByClass].sort((a, b) => compareClassLabels(a.className, b.className));
    const visibleRepositoryRows = repositoryRows.slice(0, DASHBOARD_ROW_LIMIT);
    const teacherRows = hodDashboard.teacherActivity;
    const visibleTeacherRows = teacherRows.slice(0, DASHBOARD_ROW_LIMIT);
    const assessmentRows = hodDashboard.assessmentTracking;
    const visibleAssessmentRows = assessmentRows.slice(0, DASHBOARD_ROW_LIMIT);
    const visibleAnnouncements = hodDashboard.announcements.slice(0, DASHBOARD_ROW_LIMIT);

    return (
      <div className="space-y-6" id="hod-dashboard-root">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 rounded-full border border-blue-200 bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xl shrink-0">
                {profile.initials || "HOD"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                    HOD Dashboard
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isSetupState ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {isSetupState ? "Setup incomplete" : "Live data"}
                  </span>
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 truncate">{profile.name || "HOD dashboard setup required"}</h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                  <span className="truncate">{profile.departmentLabel || "HOD scope not configured."}</span>
                  <span className="truncate">{profile.academicSession ? `Session ${profile.academicSession}` : "Academic year pending"}</span>
                  <span className="truncate">{profile.subjectArea || "Subject area pending"}</span>
                  <span className="truncate">{profile.classRange || "Class range pending"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Source: {formatTeacherDashboardSource(profile.source)}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Active teachers: {profile.activeTeacherCount || "0"}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">Scope: {profile.classRange || "Pending"}</span>
          </div>
        </div>

        {isSetupState && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-amber-900">{hodDashboard.setupState.title}</h3>
                <p className="text-xs text-amber-800 mt-1">{hodDashboard.setupState.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hodDashboard.setupState.messages.map((message) => (
                    <span key={message} className="inline-flex rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold text-amber-800">
                      {message}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {hodDashboard.kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-slate-500 truncate">{kpi.label}</div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${kpi.status === "healthy" ? "bg-emerald-50 text-emerald-700" : kpi.status === "warning" ? "bg-amber-50 text-amber-700" : kpi.status === "attention" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{formatTeacherDashboardSource(kpi.source)}</span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{kpi.value}</div>
              <div className="mt-1 text-xs text-slate-600 truncate">{kpi.detail}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Repository Health</div>
                <h3 className="text-sm font-extrabold text-slate-900">Repository Health - By Class</h3>
              </div>
              <button type="button" onClick={() => onToggleTab("registries")} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50">
                Fix gaps
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {visibleRepositoryRows.length > 0 ? visibleRepositoryRows.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate">{renderClassLabel(item.className)}</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-sans font-black text-slate-700">{item.completion}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${item.completion >= 80 ? "bg-emerald-500" : item.completion >= 70 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.max(0, Math.min(100, item.completion))}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 truncate">{item.label}</div>
                  <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(item.source)}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Chapter source not configured.</div>
              )}
            </div>
            {repositoryRows.length > DASHBOARD_ROW_LIMIT && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onToggleTab("registries")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                >
                  View All ({repositoryRows.length})
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Teacher Activity</div>
                <h3 className="text-sm font-extrabold text-slate-900">Teacher Activity - This Week</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-cyan-50 text-cyan-700 px-2 py-1">{teacherRows.length} teachers</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              {visibleTeacherRows.length > 0 ? (
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
                      <th className="py-2 pr-3">Teacher</th>
                      <th className="py-2 pr-3">Planner</th>
                      <th className="py-2 pr-3">Uploads</th>
                      <th className="py-2 pr-3">QB</th>
                      <th className="py-2 pr-3">Classroom</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleTeacherRows.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 align-top">
                        <td className="py-3 pr-3 font-semibold text-slate-800 truncate" title={item.teacherName}>{item.teacherName}</td>
                        <td className="py-3 pr-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${statusBadge(item.plannerStatus)}`}>{item.plannerStatus}</span></td>
                        <td className="py-3 pr-3"><span className="text-[10px] font-sans font-black rounded-full border border-slate-200 bg-white px-2 py-0.5">{item.uploads}</span></td>
                        <td className="py-3 pr-3"><span className="text-[10px] font-sans font-black rounded-full border border-slate-200 bg-white px-2 py-0.5">{item.questionBank}</span></td>
                        <td className="py-3 pr-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${statusBadge(item.classroomStatus)}`}>{item.classroomStatus}</span>
                            <span className="text-[10px] text-slate-500 truncate" title={item.complianceAlert}>{item.complianceAlert}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No teacher activity rows found for this week.</div>
              )}
            </div>
            {teacherRows.length > DASHBOARD_ROW_LIMIT && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onToggleTab("role-cards")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                >
                  View All ({teacherRows.length})
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
            {hodDashboard.complianceAlerts.length > 0 ? (
              <div className="mt-4 space-y-2">
                {hodDashboard.complianceAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-slate-900 truncate">{alert.teacherName}</div>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${statusBadge(alert.severity)}`}>{alert.severity}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-700">{alert.alertType}: {alert.message}</div>
                    <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(alert.source)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">No follow-up alerts.</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Assessment Tracking</div>
                <h3 className="text-sm font-extrabold text-slate-900">Assessment Tracking</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">{assessmentRows.length} items</span>
            </div>
            <div className="mt-4 space-y-2">
              {visibleAssessmentRows.length > 0 ? visibleAssessmentRows.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-600 mt-1 truncate">{item.dueLabel}</div>
                    </div>
                    <span className="text-[10px] font-sans font-black rounded-full border border-slate-200 bg-white px-2 py-0.5">{item.resultsLabel}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5">{item.departmentAverageLabel}</span>
                    <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-0.5">{item.belowThresholdLabel}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(item.source)}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No assessment data exists for this department.</div>
              )}
            </div>
            {assessmentRows.length > DASHBOARD_ROW_LIMIT && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onToggleTab("registries")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                >
                  View All ({assessmentRows.length})
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
            <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => onToggleTab("registries")} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700">
                Chase pending <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Enrichment</div>
                <h3 className="text-sm font-extrabold text-slate-900">Enrichment and Olympiads</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-purple-50 text-purple-700 px-2 py-1">{hodDashboard.enrichmentOlympiad.statusLabel}</span>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900">{hodDashboard.enrichmentOlympiad.title}</div>
              <div className="mt-1 text-slate-600 text-sm">{hodDashboard.enrichmentOlympiad.message}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Remedial Status</div>
                <h3 className="text-sm font-extrabold text-slate-900">Remedial Status</h3>
              </div>
              <span className="text-[10px] font-sans font-black rounded-full bg-rose-50 text-rose-700 px-2 py-1">{hodDashboard.remedialStatus.length} metrics</span>
            </div>
            <div className="mt-4 space-y-2">
              {hodDashboard.remedialStatus.length > 0 ? hodDashboard.remedialStatus.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 truncate">{item.label}</span>
                  <span className="text-[10px] font-sans font-black rounded-full border border-slate-200 bg-white px-2 py-0.5">{item.value}</span>
                </div>
              )) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No remedial records found for this department.</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono font-black text-blue-600">Recent Classroom Announcements</div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent classroom announcements</h3>
            </div>
            <button type="button" onClick={() => onToggleTab("classroom")} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50">
              Track class updates
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {visibleAnnouncements.length > 0 ? visibleAnnouncements.map((announcement) => (
              <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold text-blue-700">{renderClassLabel(announcement.className)}{announcement.section ? `-${announcement.section}` : ""}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.subject || "General"}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">{announcement.status}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 truncate">{announcement.title}</div>
                <div className="mt-1 text-xs text-slate-600 line-clamp-2">{announcement.text}</div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-mono">{announcement.postedAt ? formatTeacherDashboardDateTime(announcement.postedAt) : "Live"}</span>
                  {announcement.url ? <span className="truncate max-w-[50%]">Classroom link available</span> : <span>Announcement details pending</span>}
                </div>
                <div className="mt-1 text-[10px] font-mono font-bold text-slate-500 truncate">Source: {formatTeacherDashboardSource(announcement.source)}</div>
              </div>
            )) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No classroom announcement rows found.</div>
            )}
          </div>
          {hodDashboard.announcements.length > DASHBOARD_ROW_LIMIT && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => onToggleTab("classroom")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
              >
                View All ({hodDashboard.announcements.length})
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRegistryDetailPanel = () => (
    <div className="setup-card-shell bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="dashboard-live-only-overview">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Admin Registry Detail</div>
                <h2 className="text-base font-extrabold text-slate-900">Registry-derived overview</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold uppercase">
                  {(() => {
                    const totalRows = (dashboardSourceState.registries || []).reduce((sum, registry) => sum + registry.rowCount, 0);
                    return totalRows > 0 ? `${totalRows} live rows` : "Source unavailable";
                  })()}
                </span>
                <button
                  type="button"
                  onClick={openRegistryExplorer}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[10px] font-extrabold text-blue-700 hover:bg-blue-50 cursor-pointer"
                >
                  Open Registry Explorer
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {liveSectionCards.map((card) => (
          <div key={card.source} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">{card.title}</h3>
              <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full ${card.rows > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {card.rows > 0 ? `${card.rows} rows` : "No rows available"}
              </span>
            </div>
            <div className="text-[10px] text-blue-700 font-mono font-bold">{card.source.replace(" / ", " - ")}</div>
            <div className="setup-card-footer flex flex-wrap gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => card.actionRegistryId ? openRegistryDataRoute(card.actionRegistryId) : onToggleTab(card.actionTab || "admin-registry-detail")}
                className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-[10px] font-extrabold text-blue-700 hover:bg-blue-50"
              >
                {card.actionRegistryId ? "Open Registry" : card.actionTab ? "Open Tab" : "Open Source"}
              </button>
              {card.sourceUrl && canViewRegistrySheetLinks && (
                <button
                  type="button"
                  onClick={() => openRegistrySheetLink(card.sourceUrl, "view")}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  Open Sheet
                </button>
              )}
              {card.sourceUrl && canEditRegistrySheetLinks && (
                <button
                  type="button"
                  onClick={() => openRegistrySheetLink(card.sourceUrl, "edit")}
                  className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white text-[10px] font-extrabold text-emerald-700 hover:bg-emerald-50"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrincipalDashboardSectionsLegacy = () => {
    if (!isPrincipalRole()) {
      return null;
    }

    const classroomSourceState = getRegistrySourceState("classroomSyncRegistryUrl");
    const masterSourceState = getRegistrySourceState("masterDataRegistryUrl");

    const classroomAnnouncements = [...courses]
      .sort((left, right) => compareClassLabels(
        left.section ? `${renderClassLabel(left.name)}-${left.section}` : renderClassLabel(left.name),
        right.section ? `${renderClassLabel(right.name)}-${right.section}` : renderClassLabel(right.name)
      ))
      .slice(0, 5)
      .map((course) => ({
        id: course.id,
        title: `${course.name} - ${course.section}`,
        subtitle: course.announcements?.[0] || "No announcement added yet.",
        meta: `${course.teacherName}  |  ${course.studentCount} students`
      }));

    const enrichmentCount = courses.filter((course) => (course.announcements || []).length > 0).length;
    const remedialCount = selectedRemedialStudent ? 1 : highRiskStudents;
    const legacyClassroomMetricRows = [
      ["Active Class Sections", formatSourceAwareValue(principalDashboard?.classroomMonitoring?.activeClassSections || principalDashboard?.classroomMonitoring?.totalClassrooms || 0, masterSourceState)],
      ["Google Classroom Courses", formatSourceAwareValue(principalDashboard?.classroomMonitoring?.googleClassroomCourseCount || courses.length, classroomSourceState)],
      ["Monitored Classrooms", formatSourceAwareValue(principalDashboard?.classroomMonitoring?.monitoredClassroomsCount || courses.filter((course) => (course.announcements?.length || 0) > 0 || (course.materials?.length || 0) > 0).length, classroomSourceState)],
      ["Posted this week", formatSourceAwareValue(principalDashboard?.classroomMonitoring?.postedThisWeek || 0, classroomSourceState)],
      ["Assignments created", formatSourceAwareValue(principalDashboard?.classroomMonitoring?.assignmentsCreatedThisWeek || 0, classroomSourceState)],
      ["Submission rate", formatSourceAwareValue(`${principalDashboard?.classroomMonitoring?.averageSubmissionRate || principalDashboard?.classroomMonitoring?.avgSubmissionRate || 0}%`, classroomSourceState)],
      ["Meet sessions", formatSourceAwareValue(principalDashboard?.classroomMonitoring?.meetSessionsHeldThisWeek || 0, classroomSourceState)]
    ];

    return (
      <div className="space-y-6 mt-2 animate-fade-in" id="principal-specific-dashboard-zones">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="school-at-a-glance-card">
          <div className="flex items-center gap-2">
            <LayoutGrid className="text-blue-600" size={18} />
            <h2 className="text-base font-extrabold text-slate-905 font-sans tracking-tight">School at a Glance</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" id="school-glance-grid">
            {[
              { label: "Classrooms Active", value: `${courses.length} Active`, note: "Synced with LMS" },
              { label: "Planners Submitted", value: `${dynamicGlanceCalculations.plannersCount} / ${dynamicGlanceCalculations.totalClassroomsCount}`, note: `${dynamicGlanceCalculations.overduePlannersCount} overdue this week` },
              { label: "Assessments on Track", value: `${dynamicGlanceCalculations.assessmentPercent}%`, note: "On-track activity index" },
              { label: "Compliance Score", value: `${dynamicGlanceCalculations.complianceScoreValue}%`, note: "CBSE aligned audits" },
              { label: "Notebook Monitoring", value: `${dynamicGlanceCalculations.notebookCount} / ${dynamicGlanceCalculations.totalClassroomsCount}`, note: `${dynamicGlanceCalculations.pendingNotebooksReview} pending review` },
              { label: "High-Risk Pupils", value: `${highRiskStudents} Flagged`, note: "Requires critical action" }
            ].map((item, idx) => (
              <div
                key={item.label}
                className="w-full h-full flex flex-col justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-100 rounded-xl space-y-1 transition-all cursor-pointer hover:border-blue-200 hover:shadow-xs group"
                onClick={() => {
                  if (idx === 0) setSelectedClassroomMetricDrill("total");
                  if (idx === 1 || idx === 2) setSelectedAcademicLevelDrill("All Levels");
                  if (idx === 3) setSelectedComplianceItemDrill("all");
                  if (idx === 4) setSelectedClassroomMetricDrill("submissions");
                  if (idx === 5) setSelectedClassroomMetricDrill("risk");
                }}
              >
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">{item.label}</span>
                  <div className={`text-xl font-black group-hover:text-blue-600 transition-colors ${idx === 3 ? "text-emerald-700 group-hover:text-emerald-800" : idx === 5 ? "text-rose-600 group-hover:text-rose-700" : "text-slate-800"}`}>
                    {item.value}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium font-sans">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="principal-alerts-compliance-container">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="principal-alerts-section">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                  <h2 className="text-md font-bold text-slate-900 font-sans tracking-tight truncate">Alerts Requiring Attention</h2>
                </div>
                {(principalDashboard?.alertsRequiringAttention?.length || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => onToggleTab("dashboard-data-source")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50 shrink-0"
                  >
                    View All ({principalDashboard?.alertsRequiringAttention?.length || 0})
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { level: "critical", msg: "Missing Weekly Planners detected for Mr. Vijay Kumar (Grade VII History).", time: "1 hour ago" },
                  { level: "high", msg: `SIS Risk Flag: ${highRiskStudents} of ${students.length} pupils mapped to high attendance/grade risk tier; ${mediumRiskStudents} warning, ${normalStudents} normal standing.`, time: "Just now" },
                  { level: "warning", msg: `AI Suggestion: ${productivityTip}`, time: "Just now" },
                  { level: "warning", msg: "Compliance Evidence Form buffer requires outstanding files to clear statutory audits.", time: "1 day ago" }
                ].map((alert, aIdx) => (
                  <div key={aIdx} className={`p-3 border rounded-xl flex items-start gap-2.5 text-xs text-slate-700 ${
                    alert.level === "critical" ? "bg-rose-50/40 border-rose-100 text-rose-950" :
                    alert.level === "high" ? "bg-amber-50/40 border-amber-100 text-amber-955" :
                    "bg-blue-50/40 border-blue-105 text-blue-950"
                  }`}>
                    <div className="mt-0.5">
                      {alert.level === "critical" && <ShieldAlert size={14} className="text-rose-600" />}
                      {alert.level === "high" && <AlertTriangle size={14} className="text-amber-600" />}
                      {alert.level === "warning" && <AlertTriangle size={14} className="text-blue-600" />}
                    </div>
                    <div className="flex-1 select-all font-sans min-w-0">
                      <span className="font-semibold block truncate leading-normal" title={alert.msg}>{alert.msg}</span>
                      <span className="text-[10px] text-slate-400 font-mono select-none">{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden relative" id="compliance-monitoring-card">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 select-none">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">Compliance Monitoring</h3>
                  <p className="text-[10px] uppercase font-mono font-bold text-emerald-700">
                    Overall Score: {principalSandboxState === "active" ? `${calculatedOverallCompliance}%` : " - "}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComplianceConfig(!showComplianceConfig)}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    showComplianceConfig ? "bg-blue-50 text-blue-650" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                  title="Configure Weights"
                >
                  <Sliders size={15} />
                </button>
              </div>

              {showComplianceConfig && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-2.5 animate-fade-in select-none max-h-[220px] overflow-y-auto scrollbar-thin">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-1.5 mb-1">
                    <span className="font-bold text-slate-800">Assign Scoring Weights</span>
                    <span className="text-[10px] text-blue-600 font-mono font-bold uppercase block tracking-wider">Weighted calculations</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      ["Committee", committeeWeight, setCommitteeWeight],
                      ["Safety", safetyWeight, setSafetyWeight],
                      ["Forms", formsWeight, setFormsWeight],
                      ["Staff CPD", cpdWeight, setCpdWeight],
                      ["SQAA Evidence", sqaaWeight, setSqaaWeight]
                    ].map(([label, value, setter]) => (
                      <div key={String(label)} className="flex justify-between items-center font-sans">
                        <span>{label}:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={value as number}
                          onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Math.max(0, Number(e.target.value)))}
                          className="w-12 px-1 py-0.5 text-center font-bold border rounded-lg bg-white font-mono"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-150 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowComplianceConfig(false)}
                      className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {renderSectionState("compliance", (
                <div className="space-y-4">
                  {complianceItemsWithStatus.map((item, idx) => {
                    const markerColorClass =
                      item.status === "healthy" ? "bg-emerald-500" :
                      item.status === "watch" ? "bg-amber-500" : "bg-rose-500";
                    const textBadgeClass =
                      item.status === "healthy" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      item.status === "watch" ? "bg-amber-50 text-amber-705 border-amber-100" : "bg-rose-50 text-rose-700 border-rose-100";
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedComplianceItemDrill(item.key)}
                        className="flex items-center justify-between p-1.5 rounded-lg cursor-pointer hover:bg-slate-50 group border border-transparent hover:border-slate-100 transition-all"
                      >
                        <div className="flex items-center gap-2.5 bg-transparent min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${markerColorClass}`}></span>
                          <span className="text-xs text-slate-805 font-medium block truncate group-hover:text-blue-650 transition-colors font-sans" title={item.label}>
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-block px-1.5 py-0.5 rounded-md text-[8.5px] font-bold border capitalize leading-none font-sans ${textBadgeClass}`}>
                            {item.status}
                          </span>
                          <span className="font-sans text-xs font-bold text-slate-700 shrink-0">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 mt-4 select-none flex items-center justify-between gap-2">
              {complianceItemsWithStatus.length > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleTab("dashboard-data-source")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                >
                  View All ({complianceItemsWithStatus.length})
                  <ChevronRight size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedComplianceItemDrill("gaps")}
                className="py-2 px-3 bg-slate-905 hover:bg-slate-805 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                View Gaps
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6" id="principal-three-widgets">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden col-span-1 relative" id="academic-monitoring-card">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 select-none">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">Academic Monitoring</h3>
                    <p className="text-[10px] uppercase font-mono font-bold text-slate-400">
                      {PRINCIPAL_DASHBOARD_SEED.academicMonitoring.summaryLabelText[academicTab]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAcademicConfig(!showAcademicConfig)}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${showAcademicConfig ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}
                    title="Configure Thresholds"
                  >
                    <Settings size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {(["planner", "syllabus", "assessment"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setAcademicTab(tab)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${academicTab === tab ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-500"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {showAcademicConfig && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-2.5 animate-fade-in select-none">
                    <div className="text-[10px] uppercase font-mono font-black text-slate-400">Thresholds</div>
                    <div className="flex items-center justify-between">
                      <span>Healthy</span>
                      <input value={healthyThreshold} onChange={(e) => setHealthyThreshold(Number(e.target.value))} type="number" className="w-16 px-2 py-1 rounded-lg border border-slate-200" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Watch</span>
                      <input value={watchThreshold} onChange={(e) => setWatchThreshold(Number(e.target.value))} type="number" className="w-16 px-2 py-1 rounded-lg border border-slate-200" />
                    </div>
                  </div>
                )}

                {renderSectionState("academic", (
                  <div className="max-h-[250px] space-y-3 overflow-y-auto pr-2">
                    {PRINCIPAL_DASHBOARD_SEED.academicMonitoring[academicTab].map((item: any, idx: number) => (
                      <div key={`${academicTab}-${idx}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span className="font-extrabold text-slate-705 font-sans">{item.level}</span>
                          <span className="font-sans text-slate-700">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500 ease-out bg-blue-500" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              {PRINCIPAL_DASHBOARD_SEED.academicMonitoring[academicTab].length > 0 && (
                <div className="pt-3 border-t border-slate-100 mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onToggleTab("dashboard-data-source")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                  >
                    View All ({PRINCIPAL_DASHBOARD_SEED.academicMonitoring[academicTab].length})
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden col-span-1 relative" id="classroom-monitoring-card">
              <div>
                <div className="pb-3 border-b border-slate-100 mb-4 select-none">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">Classroom Monitoring</h3>
                  <p className="text-[10px] uppercase font-mono font-bold text-slate-400">Coaching & LMS streams</p>
                </div>

                {renderSectionState("classroom", (
                  <div className="space-y-3.5 select-none">
                    {legacyClassroomMetricRows.map(([label, value]) => (
                      <div key={String(label)} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all">
                        <span className="text-xs text-slate-600 font-medium font-sans">{label}</span>
                        <span className="px-2 py-0.5 font-bold tabular-nums text-xs bg-slate-100 border border-slate-200 text-slate-705 rounded-full shrink-0">{value as string | number}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-100 mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onToggleTab("dashboard-data-source")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                  >
                    View All ({legacyClassroomMetricRows.length})
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="principal-feeds-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="teacher-performance-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-md font-bold text-slate-900 tracking-tight">Teacher Performance Indicators</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[340px]">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-450 font-mono tracking-wider font-extrabold uppercase">
                      <th className="py-2.5">Teacher</th>
                      <th className="py-2.5">Planner</th>
                      <th className="py-2.5">Assess</th>
                      <th className="py-2.5 text-center">Resources</th>
                      <th className="py-2.5 text-right">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-105 font-medium text-slate-705">
                    {teacherPerformanceData.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pr-2 max-w-36 font-semibold text-slate-800">
                          <div className="truncate">{row.teacher}</div>
                          <div className="text-[10px] text-slate-500 truncate">{[row.class, row.subject].filter(Boolean).join(" · ") || row.dateRange || row.source || "Source unavailable"}</div>
                        </td>
                        <td className="py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.plannerStatus)}`}>{row.plannerStatus}</span></td>
                        <td className="py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.assessmentStatus)}`}>{row.assessmentStatus}</span></td>
                        <td className="py-3.5 text-center text-[11px] text-slate-500 tabular-nums">{row.resourceCount} files</td>
                        <td className="py-3.5 text-right"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.activityStatus)}`}>{row.activityStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTeacherReportsModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                id="btn-teacher-full-report"
              >
                View All <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="monitoring-forms-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-md font-bold text-slate-900 tracking-tight">Monitoring Forms  -  Data Feeds</h2>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {monitoringFormsData.map((form) => (
                  <div
                    key={form.id}
                    onClick={() => setSelectedFormDetail(form)}
                    className="p-3 border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 rounded-xl cursor-pointer flex items-center justify-between transition-all group animate-fade-in"
                    id={`form-feed-row-${form.id}`}
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-4">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        form.statusType === "good" ? "bg-emerald-50 text-emerald-650" :
                        form.statusType === "warning" ? "bg-amber-50 text-amber-650" :
                        form.statusType === "risk" ? "bg-rose-50 text-rose-650" :
                        "bg-blue-50 text-blue-650"
                      }`}>
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-blue-650 transition-colors">{form.name}</span>
                        <span className="text-[11px] text-slate-500 block truncate leading-normal">{form.summary}</span>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                          {form.responsibleOwner && <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">{form.responsibleOwner}</span>}
                          {form.linkedClassSection && <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">{renderClassLabel(form.linkedClassSection)}</span>}
                          {form.lastSubmittedDate && <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">{form.lastSubmittedDate}</span>}
                          {form.evidenceLinkLabel && <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">{form.evidenceLinkLabel}</span>}
                          {form.source && <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">{form.source}</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      form.statusType === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                      form.statusType === "warning" ? "bg-amber-50 text-amber-705 border-amber-150" :
                      form.statusType === "risk" ? "bg-rose-50 text-rose-700 border-rose-150" :
                      "bg-blue-50 text-blue-700 border-blue-150"
                    }`}>
                      {form.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="principal-dashboard-additions-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="principal-assessment-tracking-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-indigo-600 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">School Assessment Tracking</h3>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">UT4 Cycle</span>
              </div>
                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Assessment rows submitted</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-150 tabular-nums">{principalDashboard?.academicMonitoring?.assessment?.length || 0} rows</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Academic year</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-bold border bg-amber-50 text-amber-800 border-amber-200">{activeAcademicYearLabel || dashboardSourceState.activeAcademicYearLabel || "Pending"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Coverage trend</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold tabular-nums text-slate-800 bg-slate-100">{dynamicGlanceCalculations.assessmentPercent}%</span>
                  </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium font-sans text-xs">Below 40% students</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-150">{highRiskStudents} students</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
              <button type="button" onClick={() => setShowPrincipalChasePendingModal(true)} className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors">
                Chase pending <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="principal-enrichment-olympiads-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-indigo-600 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">School Enrichment & Olympiads</h3>
                </div>
                <span className="text-[10px] font-mono text-purple-600 font-bold px-1.5 py-0.5 bg-purple-50 rounded">Talent Pool</span>
              </div>
              <div className="space-y-3 my-2">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium font-sans text-xs">Olympiad registrations</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-sans">{students.length} students</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium font-sans text-xs">Enrichment posts  -  Classroom</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-sans">{enrichmentCount} active classes</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium font-sans text-xs">Resources in Enrichment folder</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-sans">{courses.reduce((sum, course) => sum + (course.announcements?.length || 0), 0)} notes</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium font-sans text-xs">Students in enrichment programme</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-sans">{students.length - highRiskStudents}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="principal-remedial-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">School Remedial Stats</h3>
                </div>
                <span className="text-[10px] font-mono text-rose-600 font-bold px-1.5 py-0.5 bg-rose-50 rounded">Support Review</span>
              </div>
              <div className="space-y-3 my-2">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium font-sans text-xs">Students flagged</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-rose-50 text-rose-700 border-rose-150 font-sans">{remedialCount}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium font-sans text-xs">In progress</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-amber-50 text-amber-700 border-amber-150 font-sans">{mediumRiskStudents}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium font-sans text-xs">Tracked</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-sans">{normalStudents}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
              <button type="button" onClick={() => setShowFullRemedialModal(true)} className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors">
                Full remedial report <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="classroom-stream-card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <GraduationCap size={18} />
              </span>
              Recent Classroom Announcements
            </h3>
            <button
              onClick={() => onToggleTab("classroom")}
              className="text-xs text-blue-600 font-bold hover:text-blue-750 flex items-center gap-1 cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:shadow-2xs transition-all duration-200"
            >
              Track Class Syllabi <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3 mt-4">
            {classroomAnnouncements.map((course) => (
              <div
                key={course.id}
                className="p-4 bg-white border border-slate-100 border-l-4 border-l-indigo-500 rounded-xl space-y-2 hover:bg-slate-50/50 hover:shadow-2xs transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {course.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{course.meta}</span>
                </div>
                <p className="text-sm text-slate-700">{course.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPrincipalDashboardSections = () => {
    if (!isPrincipalRole()) {
      return null;
    }

    const liveAlerts = (principalDashboard?.alertsRequiringAttention || []) as Array<{
      severity?: string;
      title?: string;
      text?: string;
      message?: string;
      statusLabel?: string;
      source?: any;
      sourceLabel?: string;
      classLabel?: string;
      sectionLabel?: string;
      subjectLabel?: string;
      dueLabel?: string;
    }>;
    const liveRemedialRows = (principalDashboard?.remedialRisk || []) as Array<Record<string, any>>;
    const visibleLiveAlerts = liveAlerts.slice(0, DASHBOARD_ROW_LIMIT);
    const visibleRemedialRows = liveRemedialRows.slice(0, DASHBOARD_ROW_LIMIT);
    const classroomSourceState = getRegistrySourceState("classroomSyncRegistryUrl");
    const masterSourceState = getRegistrySourceState("masterDataRegistryUrl");
    const dashboardDataSourceState = getRegistrySourceState("dashboardDataSourceUrl");
    const activeClassSections = principalDashboard?.classroomMonitoring?.activeClassSections || principalDashboard?.classroomMonitoring?.totalClassrooms || 0;
    const googleClassroomCourses = principalDashboard?.classroomMonitoring?.googleClassroomCourseCount || courses.length;
    const monitoredClassrooms = principalDashboard?.classroomMonitoring?.monitoredClassroomsCount || courses.filter((course) => (course.announcements?.length || 0) > 0 || (course.materials?.length || 0) > 0).length;
    const teacherAllocationCoverage = teacherPerformanceData.length > 0
      ? Math.round((teacherPerformanceData.filter((row) => row.plannerStatus === "Done").length / teacherPerformanceData.length) * 100)
      : 0;
    const glanceCards: Array<{
      label: string;
      value: string | number;
      note: string;
      actionTab?: string;
      actionRegistryId?: string;
    }> = [
      { label: "Active Students", value: formatSourceAwareValue(students.length, masterSourceState), note: "Live enrollment rows", actionTab: "students" },
      { label: "Active Staff", value: formatSourceAwareValue(teacherPerformanceData.length, masterSourceState), note: "Live allocation rows", actionTab: "staff" },
      { label: "Active Class Sections", value: formatSourceAwareValue(activeClassSections, masterSourceState), note: "From Classes_Sections", actionTab: "courses" },
      { label: "Teacher Allocation Coverage", value: formatSourceAwareValue(`${teacherAllocationCoverage}%`, dashboardDataSourceState), note: "Planner rows completed", actionRegistryId: "REG_TEACHER_ALLOCATIONS" },
      { label: "Google Classroom Courses", value: formatSourceAwareValue(googleClassroomCourses, classroomSourceState), note: "Live Classroom course map", actionTab: "courses" },
      { label: "Attendance / Engagement", value: formatSourceAwareValue(`${principalDashboard?.classroomMonitoring?.averageSubmissionRate || principalDashboard?.classroomMonitoring?.avgSubmissionRate || 0}%`, classroomSourceState), note: `${monitoredClassrooms} monitored classrooms` }
    ];
    const principalClassroomMetricRows = [
      { label: "Total Classrooms", value: formatSourceAwareValue(principalDashboard?.classroomMonitoring?.totalClassrooms || 0, classroomSourceState), actionTab: "courses" },
      { label: "Posted this week", value: formatSourceAwareValue(`${principalDashboard?.classroomMonitoring?.postedThisWeek || 0} / ${principalDashboard?.classroomMonitoring?.totalClassrooms || 0}`, classroomSourceState) },
      { label: "Zero Activity", value: formatSourceAwareValue(`${principalDashboard?.classroomMonitoring?.zeroActivityThisWeek || 0} classrooms`, classroomSourceState) },
      { label: "Assignments", value: formatSourceAwareValue(`${principalDashboard?.classroomMonitoring?.assignmentsCreatedThisWeek || 0} this week`, classroomSourceState), actionTab: "assignments" },
      { label: "Submission rate", value: formatSourceAwareValue(`${principalDashboard?.classroomMonitoring?.averageSubmissionRate || principalDashboard?.classroomMonitoring?.avgSubmissionRate || 0}%`, classroomSourceState) },
      { label: "Meet sessions", value: formatSourceAwareValue(`${principalDashboard?.classroomMonitoring?.meetSessionsHeldThisWeek || 0} held`, classroomSourceState) }
    ];

    return (
      <div className="space-y-6 mt-2 animate-fade-in" id="principal-specific-dashboard-zones">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="school-at-a-glance-card">
          <div className="flex items-center gap-2">
            <LayoutGrid className="text-blue-600" size={18} />
            <h2 className="text-base font-extrabold text-slate-905 font-sans tracking-tight">School at a Glance</h2>
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
            id="school-glance-grid"
          >
            {glanceCards.map((item) => {
              const hasAction = Boolean(item.actionTab || item.actionRegistryId);
              const CardTag = hasAction ? "button" : "div";
              const cardProps = hasAction
                ? {
                    type: "button" as const,
                    onClick: () => item.actionRegistryId
                      ? openRegistryDataRoute(item.actionRegistryId)
                      : onToggleTab(item.actionTab!),
                    title: item.actionRegistryId
                      ? `Open ${item.label} registry`
                      : `Open ${item.label}`,
                    className: "w-full h-full flex flex-col justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-100 rounded-xl space-y-1 transition-all cursor-pointer hover:border-blue-200 hover:shadow-xs group text-left",
                  }
                : {
                    className: "w-full h-full flex flex-col justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-100 rounded-xl space-y-1 transition-all cursor-default hover:border-blue-200 hover:shadow-xs group",
                  };

              return (
                <CardTag
                  key={item.label}
                  {...cardProps}
                >
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">{item.label}</span>
                    <div className="text-xl font-black tabular-nums text-slate-800 group-hover:text-blue-600 transition-colors">
                      {item.value}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium font-sans">{item.note}</div>
                </CardTag>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="principal-alerts-compliance-container">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="principal-alerts-section">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="text-rose-600 shrink-0" size={20} />
                  <h2 className="text-md font-bold text-slate-900 font-sans tracking-tight truncate">Alerts Requiring Attention</h2>
                </div>
                {liveAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onToggleTab("dashboard-data-source")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] font-extrabold text-rose-700 hover:bg-rose-50 shrink-0"
                  >
                    View All ({liveAlerts.length})
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {visibleLiveAlerts.length > 0 ? visibleLiveAlerts.map((alert, aIdx) => {
                  const title = alert.title || alert.text || alert.message || "Alert requires attention";
                  const subtitle = alert.message || alert.text || alert.statusLabel || "";
                  const sourceLabel = typeof alert.source === "string"
                    ? alert.source
                    : alert.source && typeof alert.source === "object"
                      ? [alert.source.workbook, alert.source.tab].filter(Boolean).join(" / ") || alert.sourceLabel || "Dashboard Alerts"
                      : alert.sourceLabel || "Dashboard Alerts";
                  return (
                    <div key={aIdx} className="p-3 border rounded-xl flex items-start gap-2.5 text-xs text-slate-700 bg-blue-50/40 border-blue-100 text-blue-950">
                      <div className="mt-0.5">
                        {(alert.severity || "").toLowerCase().includes("critical") && <ShieldAlert size={14} className="text-rose-600" />}
                        {(alert.severity || "").toLowerCase().includes("high") && <AlertTriangle size={14} className="text-amber-600" />}
                        {!(alert.severity || "").toLowerCase().includes("critical") && !(alert.severity || "").toLowerCase().includes("high") && <AlertTriangle size={14} className="text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0 font-sans space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold block truncate leading-normal" title={title}>{title}</span>
                          {alert.statusLabel && (
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                              {alert.statusLabel}
                            </span>
                          )}
                        </div>
                        {subtitle && <div className="text-[11px] text-slate-600 line-clamp-2">{subtitle}</div>}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">{sourceLabel}</span>
                          {alert.classLabel && <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">{renderClassLabel(alert.classLabel)}{alert.sectionLabel ? `-${alert.sectionLabel}` : ""}</span>}
                          {alert.subjectLabel && <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">{alert.subjectLabel}</span>}
                          {alert.dueLabel && <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">{formatDashboardDateValue(alert.dueLabel)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    No alert rows found in the dashboard source.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden relative" id="compliance-monitoring-card">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 select-none">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">Compliance Monitoring</h3>
                  <p className="text-[10px] uppercase font-mono font-bold text-emerald-700">Overall Score: {calculatedOverallCompliance}%</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComplianceConfig(!showComplianceConfig)}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    showComplianceConfig ? "bg-blue-50 text-blue-650" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                  title="Configure Weights"
                >
                  <Sliders size={15} />
                </button>
              </div>

              {showComplianceConfig && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-2.5 animate-fade-in select-none max-h-[220px] overflow-y-auto scrollbar-thin">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-1.5 mb-1">
                    <span className="font-bold text-slate-800">Assign Scoring Weights</span>
                    <span className="text-[10px] text-blue-600 font-mono font-bold uppercase block tracking-wider">Weighted calculations</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      ["Committee", committeeWeight, setCommitteeWeight],
                      ["Safety", safetyWeight, setSafetyWeight],
                      ["Forms", formsWeight, setFormsWeight],
                      ["Staff CPD", cpdWeight, setCpdWeight],
                      ["SQAA Evidence", sqaaWeight, setSqaaWeight]
                    ].map(([label, value, setter]) => (
                      <div key={String(label)} className="flex justify-between items-center font-sans">
                        <span>{label}:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={value as number}
                          onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Math.max(0, Number(e.target.value)))}
                          className="w-12 px-1 py-0.5 text-center font-bold border rounded-lg bg-white font-mono"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-150 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowComplianceConfig(false)}
                      className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {renderSectionState("compliance", (
                <div className="space-y-4">
                  {complianceItemsWithStatus.length > 0 ? complianceItemsWithStatus.map((item, idx) => {
                    const markerColorClass =
                      item.status === "healthy" ? "bg-emerald-500" :
                      item.status === "watch" ? "bg-amber-500" : "bg-rose-500";
                    const textBadgeClass =
                      item.status === "healthy" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      item.status === "watch" ? "bg-amber-50 text-amber-705 border-amber-100" : "bg-rose-50 text-rose-700 border-rose-100";
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedComplianceItemDrill(item.key)}
                        className="flex items-center justify-between p-1.5 rounded-lg cursor-pointer hover:bg-slate-50 group border border-transparent hover:border-slate-100 transition-all"
                      >
                        <div className="flex items-center gap-2.5 bg-transparent min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${markerColorClass}`}></span>
                          <span className="text-xs text-slate-805 font-medium block truncate group-hover:text-blue-650 transition-colors font-sans" title={item.label}>
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-block px-1.5 py-0.5 rounded-md text-[8.5px] font-bold border capitalize leading-none font-sans ${textBadgeClass}`}>
                            {item.status}
                          </span>
                          <span className="font-sans text-xs font-bold text-slate-700 shrink-0">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    No compliance rows found in the dashboard source.
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 mt-4 select-none flex items-center justify-between gap-2">
              {complianceItemsWithStatus.length > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleTab("dashboard-data-source")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                >
                  View All ({complianceItemsWithStatus.length})
                  <ChevronRight size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedComplianceItemDrill("gaps")}
                className="py-2 px-3 bg-slate-905 hover:bg-slate-805 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                View Gaps
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6" id="principal-three-widgets">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden col-span-1 relative" id="academic-monitoring-card">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 select-none">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">Academic Monitoring</h3>
                    <p className="text-[10px] uppercase font-mono font-bold text-slate-400">
                      {PRINCIPAL_DASHBOARD_SEED.academicMonitoring.summaryLabelText[academicTab]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAcademicConfig(!showAcademicConfig)}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${showAcademicConfig ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}
                    title="Configure Thresholds"
                  >
                    <Settings size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {(["planner", "syllabus", "assessment"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setAcademicTab(tab)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${academicTab === tab ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-500"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {showAcademicConfig && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-2.5 animate-fade-in select-none">
                    <div className="text-[10px] uppercase font-mono font-black text-slate-400">Thresholds</div>
                    <div className="flex items-center justify-between">
                      <span>Healthy</span>
                      <input value={healthyThreshold} onChange={(e) => setHealthyThreshold(Number(e.target.value))} type="number" className="w-16 px-2 py-1 rounded-lg border border-slate-200" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Watch</span>
                      <input value={watchThreshold} onChange={(e) => setWatchThreshold(Number(e.target.value))} type="number" className="w-16 px-2 py-1 rounded-lg border border-slate-200" />
                    </div>
                  </div>
                )}

                {renderSectionState("academic", (
                  <div className="max-h-[250px] space-y-3 overflow-y-auto pr-2">
                    {PRINCIPAL_DASHBOARD_SEED.academicMonitoring[academicTab].length > 0 ? PRINCIPAL_DASHBOARD_SEED.academicMonitoring[academicTab].map((item: any, idx: number) => (
                      <div key={`${academicTab}-${idx}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span className="font-extrabold text-slate-705 font-sans">{item.level}</span>
                          <span className="font-sans text-slate-700">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500 ease-out bg-blue-500" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                        No academic monitoring rows found in the dashboard source.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden col-span-1 relative" id="classroom-monitoring-card">
              <div>
                <div className="pb-3 border-b border-slate-100 mb-4 select-none">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">Classroom Monitoring</h3>
                  <p className="text-[10px] uppercase font-mono font-bold text-slate-400">Coaching & LMS streams</p>
                </div>

                {renderSectionState("classroom", (
                  <div className="space-y-3.5 select-none">
                    {principalClassroomMetricRows.map((metric) => {
                      const RowTag = metric.actionTab ? "button" : "div";
                      const rowProps = metric.actionTab
                        ? {
                            type: "button" as const,
                            onClick: () => onToggleTab(metric.actionTab!),
                            className: "w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all text-left",
                          }
                        : {
                            className: "w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-default transition-all text-left",
                          };

                      return (
                        <RowTag key={metric.label} {...rowProps}>
                          <span className="text-xs text-slate-600 font-medium font-sans">{metric.label}</span>
                          <span className="px-2 py-0.5 font-bold font-sans text-xs bg-slate-100 border border-slate-200 text-slate-705 rounded-full shrink-0">{metric.value as string | number}</span>
                        </RowTag>
                      );
                    })}
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-100 mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onToggleTab("dashboard-data-source")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                  >
                    View All ({principalClassroomMetricRows.length})
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="principal-feeds-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="teacher-performance-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-md font-bold text-slate-900 tracking-tight">Teacher Performance Indicators</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[340px]">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-450 font-mono tracking-wider font-extrabold uppercase">
                      <th className="py-2.5">Teacher</th>
                      <th className="py-2.5">Planner</th>
                      <th className="py-2.5">Assess</th>
                      <th className="py-2.5 text-center">Resources</th>
                      <th className="py-2.5 text-right">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-105 font-medium text-slate-705">
                    {teacherPerformanceData.length > 0 ? teacherPerformanceData.slice(0, DASHBOARD_ROW_LIMIT).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pr-2 truncate max-w-28 font-semibold text-slate-800">{row.teacher}</td>
                        <td className="py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.plannerStatus)}`}>{row.plannerStatus}</span></td>
                        <td className="py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.assessmentStatus)}`}>{row.assessmentStatus}</span></td>
                        <td className="py-3.5 text-center font-sans text-[11px] text-slate-500">{row.resourceCount} files</td>
                        <td className="py-3.5 text-right"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.activityStatus)}`}>{row.activityStatus}</span></td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="py-4 text-slate-600" colSpan={5}>No teacher performance rows found in the dashboard source.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {teacherPerformanceData.length > 0 && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTeacherReportsModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                  >
                    View All ({teacherPerformanceData.length})
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="monitoring-forms-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-md font-bold text-slate-900 tracking-tight">Monitoring Forms  -  Data Feeds</h2>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {monitoringFormsData.length > 0 ? monitoringFormsData.slice(0, DASHBOARD_ROW_LIMIT).map((form) => (
                  <div
                    key={form.id}
                    onClick={() => setSelectedFormDetail(form)}
                    className="p-3 border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 rounded-xl cursor-pointer flex items-center justify-between transition-all group animate-fade-in"
                    id={`form-feed-row-${form.id}`}
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-4">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        form.statusType === "good" ? "bg-emerald-50 text-emerald-650" :
                        form.statusType === "warning" ? "bg-amber-50 text-amber-650" :
                        form.statusType === "risk" ? "bg-rose-50 text-rose-650" :
                        "bg-blue-50 text-blue-650"
                      }`}>
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-blue-650 transition-colors">{form.name}</span>
                        <span className="text-[11px] text-slate-500 block truncate leading-normal">{form.summary}</span>
                      </div>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      form.statusType === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                      form.statusType === "warning" ? "bg-amber-50 text-amber-705 border-amber-150" :
                      form.statusType === "risk" ? "bg-rose-50 text-rose-700 border-rose-150" :
                      "bg-blue-50 text-blue-700 border-blue-150"
                    }`}>
                      {form.statusLabel}
                    </span>
                  </div>
                  )) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    No monitoring form rows found in the dashboard source.
                  </div>
                )}
              </div>
              {monitoringFormsData.length > DASHBOARD_ROW_LIMIT && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onToggleTab("dashboard-data-source")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                  >
                    View All ({monitoringFormsData.length})
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6" id="principal-live-latest-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden" id="principal-remedial-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans truncate">Remedial Follow-up Feed</h3>
                </div>
                {liveRemedialRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onToggleTab("dashboard-data-source")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50 shrink-0"
                  >
                    View All ({liveRemedialRows.length})
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {visibleRemedialRows.length > 0 ? visibleRemedialRows.map((row, index) => (
                  <button
                    key={`remedial-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedRemedialStudent(row);
                      setShowFullRemedialModal(true);
                    }}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-start justify-between gap-3 text-left hover:bg-slate-100/70 hover:border-slate-200 transition-all cursor-pointer w-full"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {String(row.student_name || row.name || row.title || row.label || [row.class, row.section, row.subject, row.risk_area].filter(Boolean).join(" · ") || row.sourceLabel || "Remedial follow-up")}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {String(row.reason || row.notes || row.severity || row.risk || row.intervention_status || row.status || "").trim()}
                      </div>
                    </div>
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                      {String(row.status || row.intervention_status || row.severity || "Open")}
                    </span>
                  </button>
                )) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    No remedial rows found in the dashboard source.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const clearDashboardDetailState = () => {
    setSelectedAcademicLevelDrill(null);
    setSelectedClassroomMetricDrill(null);
    setSelectedComplianceItemDrill(null);
    setSelectedFormDetail(null);
    setShowTeacherReportsModal(false);
    setShowFullRemedialModal(false);
    setSelectedRemedialStudent(null);
  };

  const renderDetailOverlay = () => {
    const shell = (title: string, subtitle: string, body: React.ReactNode) => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Dashboard detail</div>
              <h3 className="text-base font-extrabold text-slate-900 truncate">{title}</h3>
              <p className="text-xs text-slate-600 mt-1">{subtitle}</p>
            </div>
            <button type="button" onClick={clearDashboardDetailState} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{body}</div>
          <div className="border-t border-slate-100 px-5 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                clearDashboardDetailState();
                onToggleTab("overview");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
            >
              Back to Dashboard
            </button>
            <button type="button" onClick={clearDashboardDetailState} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-100">
              Close
            </button>
          </div>
        </div>
      </div>
    );

    if (selectedFormDetail) {
      return shell(
        selectedFormDetail.name || "Monitoring Form Detail",
        selectedFormDetail.summary || selectedFormDetail.statusLabel || "Form row details",
        (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                ["Status", selectedFormDetail.statusLabel || selectedFormDetail.statusType || "Pending"],
                ["Owner", selectedFormDetail.responsibleOwner || "Not set"],
                ["Class", selectedFormDetail.linkedClassSection ? renderClassLabel(selectedFormDetail.linkedClassSection) : "Not set"],
                ["Last submitted", selectedFormDetail.lastSubmittedDate || "Not set"],
                ["Evidence", selectedFormDetail.evidenceLinkLabel || "Not linked"],
                ["Source", selectedFormDetail.source || "Dashboard Data Source"]
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
                  <div className="mt-1 font-semibold text-slate-900">{String(value)}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              {selectedFormDetail.summary || "No additional monitoring form detail is available."}
            </div>
          </div>
        )
      );
    }

    if (showTeacherReportsModal) {
      return shell(
        "Teacher Performance Indicators",
        `${teacherPerformanceData.length} row${teacherPerformanceData.length === 1 ? "" : "s"} in this report`,
        (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-150 text-slate-450 font-mono tracking-wider font-extrabold uppercase">
                  <th className="py-2.5">Teacher</th>
                  <th className="py-2.5">Planner</th>
                  <th className="py-2.5">Assess</th>
                  <th className="py-2.5 text-center">Resources</th>
                  <th className="py-2.5 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 font-medium text-slate-705">
                {teacherPerformanceData.length > 0 ? teacherPerformanceData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 pr-2 truncate max-w-28 font-semibold text-slate-800">{row.teacher}</td>
                    <td className="py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.plannerStatus)}`}>{row.plannerStatus}</span></td>
                    <td className="py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.assessmentStatus)}`}>{row.assessmentStatus}</span></td>
                    <td className="py-3.5 text-center font-sans text-[11px] text-slate-500">{row.resourceCount} files</td>
                    <td className="py-3.5 text-right"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.activityStatus)}`}>{row.activityStatus}</span></td>
                  </tr>
                )) : (
                  <tr>
                    <td className="py-4 text-slate-600" colSpan={5}>No teacher performance rows found in the dashboard source.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      );
    }

    if (showFullRemedialModal) {
      const remedialRows = (principalDashboard?.remedialRisk || []) as Array<Record<string, any>>;
      const detail = selectedRemedialStudent || remedialRows[0] || null;
      return shell(
        detail ? String(detail.student_name || detail.name || detail.title || detail.label || [detail.class, detail.section, detail.subject, detail.risk_area].filter(Boolean).join(" · ") || "Remedial follow-up feed") : "Remedial follow-up feed",
        detail ? String(detail.reason || detail.notes || detail.severity || detail.risk || detail.intervention_status || detail.status || detail.sourceLabel || "No additional note") : "No remedial row selected",
        (
          <div className="space-y-4">
            {detail ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  ["Student", detail.student_name || detail.name || "Not named"],
                  ["Status", detail.status || detail.intervention_status || detail.severity || "Open"],
                  ["Class", detail.class || "Not set"],
                  ["Section", detail.section || "Not set"],
                  ["Subject", detail.subject || "Not set"],
                  ["Risk area", detail.risk_area || "Not set"]
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
                    <div className="mt-1 font-semibold text-slate-900">{String(value)}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              {String(detail?.reason || detail?.notes || detail?.severity || detail?.risk || detail?.intervention_status || detail?.status || "No remedial details available.")}
            </div>
            <div className="space-y-3">
              {remedialRows.map((row, idx) => (
                <div key={`remedial-detail-${idx}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="font-semibold text-slate-900 text-sm truncate">{String(row.student_name || row.name || row.title || row.label || [row.class, row.section, row.subject, row.risk_area].filter(Boolean).join(" · ") || row.sourceLabel || `Remedial follow-up ${idx + 1}`)}</div>
                  <div className="text-[11px] text-slate-600 mt-1">{String(row.reason || row.notes || row.severity || row.risk || row.intervention_status || row.status || "No additional note")}</div>
                </div>
              ))}
            </div>
          </div>
        )
      );
    }

    if (selectedComplianceItemDrill) {
      const selectedItem = complianceItemsWithStatus.find((item) => item.key === selectedComplianceItemDrill);
      return shell(
        selectedItem ? `${selectedItem.label} detail` : "Compliance Monitoring",
        selectedItem ? `${selectedItem.percentage}% current coverage` : `${complianceItemsWithStatus.length} compliance rows`,
        (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {complianceItemsWithStatus.map((item) => (
                <div key={item.key} className={`rounded-xl border p-3 ${selectedItem?.key === item.key ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="font-semibold text-slate-900">{item.label}</div>
                  <div className="mt-1 text-[11px] text-slate-600 capitalize">{item.status}</div>
                  <div className="mt-1 font-bold text-slate-800">{item.percentage}%</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              {selectedItem ? selectedItem.label : "Compliance rows can be opened from this panel or from the dashboard cards."}
            </div>
          </div>
        )
      );
    }

    if (selectedClassroomMetricDrill) {
      const classroomRows = [
        ["Total Classrooms", principalDashboard?.classroomMonitoring?.totalClassrooms || 0],
        ["Posted this week", principalDashboard?.classroomMonitoring?.postedThisWeek || 0],
        ["Zero Activity", principalDashboard?.classroomMonitoring?.zeroActivityThisWeek || 0],
        ["Assignments created", principalDashboard?.classroomMonitoring?.assignmentsCreatedThisWeek || 0],
        ["Submission rate", `${principalDashboard?.classroomMonitoring?.averageSubmissionRate || principalDashboard?.classroomMonitoring?.avgSubmissionRate || 0}%`],
        ["Meet sessions", principalDashboard?.classroomMonitoring?.meetSessionsHeldThisWeek || 0]
      ];
      return shell(
        "Classroom Monitoring",
        `${selectedClassroomMetricDrill} drill-down`,
        (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {classroomRows.map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
                <div className="mt-1 font-semibold text-slate-900">{String(value)}</div>
              </div>
            ))}
          </div>
        )
      );
    }

    if (selectedAcademicLevelDrill) {
      const academicRows = PRINCIPAL_DASHBOARD_SEED.academicMonitoring[academicTab] || [];
      return shell(
        "Academic Monitoring",
        `${selectedAcademicLevelDrill} drill-down`,
        (
          <div className="space-y-3">
            {academicRows.map((item: any, idx: number) => (
              <div key={`academic-detail-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900">{item.level}</span>
                  <span className="font-bold text-slate-700">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )
      );
    }

    return null;
  };

  return (
    <div className="space-y-6" id="dashboard-cockpit">
      <style>{`
        #dashboard-cockpit .rounded-2xl.border.border-slate-200.bg-white.p-4.shadow-sm,
        #dashboard-cockpit .rounded-2xl.border.border-slate-200.bg-white.p-5.shadow-sm,
        #dashboard-cockpit .rounded-2xl.border.border-slate-200.bg-white.p-6.shadow-sm {
          max-height: 360px !important;
          overflow: hidden !important;
          padding-bottom: 1.5rem !important;
        }
      `}</style>
      {renderWelcomeHeader()}
      {currentDashboardView === "overview" && isTeacherRole() && renderTeacherDashboard()}
      {currentDashboardView === "overview" && isHodRole() && renderHodDashboard()}
      {currentDashboardView === "overview" && isManagerRole() && renderManagerDashboard()}
      {currentDashboardView === "overview" && isStudentRole() && renderStudentDashboard()}
      {currentDashboardView === "overview" && isExamsRole() && renderExamsDashboard()}
      {currentDashboardView === "overview" && isParentRole() && renderParentDashboard()}
      {currentDashboardView === "overview" && isCoordinatorRole() && renderCoordinatorDashboard()}
      {currentDashboardView === "overview" && !isTeacherRole() && !isCoordinatorRole() && !isHodRole() && !isManagerRole() && !isStudentRole() && !isExamsRole() && !isParentRole() && renderPrincipalDashboardSections()}
      {currentDashboardView === "overview" && !isPrincipalRole() && !isTeacherRole() && !isCoordinatorRole() && !isHodRole() && !isManagerRole() && !isStudentRole() && !isExamsRole() && !isParentRole() && renderRoleSpecificDashboardCards()}
      {currentDashboardView === "role-cards" && renderRoleSpecificDashboardCards()}
      {currentDashboardView === "registers" && renderRegistersHub()}
      {currentDashboardView === "setup-registries" && renderSetupAndRegistriesPage()}
      {currentDashboardView === "settings" && renderSettingsHub()}
      {currentDashboardView === "data-source" && renderDashboardSourcePanel()}
      {currentDashboardView === "setup" && renderRegistryBootstrapPreview()}
      {currentDashboardView === "registry-detail" && renderRegistryDetailPanel()}
      {renderDetailOverlay()}
    </div>
  );

}


