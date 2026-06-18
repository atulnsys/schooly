import React, { useState, useEffect, useMemo } from "react";
import {
  WorkspaceFile,
  ClassroomCourse,
  ClassroomAssignment,
  TaskItem,
  AuditLog,
  AutomationRule,
  StudentDetails,
  TeacherDetails,
  AcademicYearConfig
} from "./types";
import DashboardOverview from "./components/DashboardOverview";
import UniversalSearch from "./components/UniversalSearch";
import ClassroomManager from "./components/ClassroomManager";
import StudentsRegistryPage from "./components/StudentsRegistryPage";
import TeachersRegistryPage from "./components/TeachersRegistryPage";
import StaffRegistryPage from "./components/StaffRegistryPage";
import ClassroomCoursesRegistryPage from "./components/ClassroomCoursesRegistryPage";
import ClassroomAssignmentsRegistryPage from "./components/ClassroomAssignmentsRegistryPage";
import AcademicResourceLibraryPage from "./components/AcademicResourceLibraryPage";
import RegistryExplorerPage from "./components/RegistryExplorerPage";
import GenericRegistryDataPage from "./components/GenericRegistryDataPage";
import TaskProductivity from "./components/TaskProductivity";
import AIAssistants from "./components/AIAssistants";
import AcademicRollover from "./components/AcademicRollover";
import SystemGovernance from "./components/SystemGovernance";
import MockDataStudio from "./components/MockDataStudio";
import LessonPlanner from "./components/LessonPlanner";
import TextbookIngestor from "./components/TextbookIngestor";
import {
  GraduationCap,
  Search,
  Sparkles,
  Command,
  ShieldAlert,
  Menu,
  X,
  Star,
  FileText,
  Clock,
  User,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Link,
  AlertCircle,
  ArrowLeft,
  Database,
  Eye,
  EyeOff,
  Key,
  AlertTriangle,
  BookOpen,
  LayoutGrid,
  Users,
  UserCheck,
  Settings,
  ChevronDown
} from "lucide-react";
import {
  loadActiveMetadata,
  compileDynamicNavigation,
  saveActiveMetadata,
  ExportableSchoolySchema
} from "./lib/schemaEngine";
import { getRegistryExplorerRow } from "./lib/registryExplorerEntityDefinition";
import { loadConnectionConfig, FALLBACK_ALERT_MESSAGES, validateSourceLink } from "./lib/dataSourceEngine";
import { DEFAULT_DASHBOARD_SHEET_URL } from "./lib/dashboardConfig";
import { loadSchoolRegistry, type SchoolRegistryState, type StaffDirectoryRow, type StudentDirectoryRow, type StudentEnrollmentRow } from "./lib/schoolRegistry";
import {
  connectGoogleWorkspaceWriteAccess,
  disconnectGoogleWorkspaceAccess,
  getGoogleWorkspaceAccessToken,
  getGoogleWorkspaceAuthState,
  GOOGLE_WORKSPACE_AUTH_STATE_CHANGED_EVENT
} from "./lib/googleWorkspaceAuth";

const IconMap: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  Command,
  Search,
  GraduationCap,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  Database,
  BookOpen,
  LayoutGrid,
  FolderOpen,
  Users,
  UserCheck,
  User,
  FileText,
  Settings
};

function normalizePersonaToken(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}
const ROLE_PERSONA_SYNONYMS: Record<string, string[]> = {
  principal: ["principal", "head", "headmaster", "head teacher", "director", "vice principal", "deputy principal"],
  teacher: ["teacher", "instructor", "facilitator", "tutor", "mentor", "class teacher"],
  coordinator: ["coordinator", "academic coordinator", "school coordinator", "examination chair", "exam chair", "curriculum coordinator"],
  hod: ["hod", "head of department", "department head"],
  admin: ["school admin", "administrator", "admin", "office admin", "operations admin"],
  manager: ["manager", "school manager", "operations manager"],
  hr: ["hr", "human resources", "hr manager", "people operations"],
  exams: ["exams", "examination", "exam", "invigilation", "exam cell"],
  parent: ["parent", "guardian", "parent representative"],
  student: ["student", "learner", "pupil"]
};

function roleMatchesStaffDirectory(roleName: string, staffRole: string, staffDepartment: string = "", staffName: string = ""): boolean {
  const role = normalizePersonaToken(roleName);
  const staff = normalizePersonaToken(staffRole);
  const department = normalizePersonaToken(staffDepartment);
  const name = normalizePersonaToken(staffName);
  if (!role) return false;

  const roleSynonyms = ROLE_PERSONA_SYNONYMS[role] || [];
  const candidates = [staff, department, name].filter(Boolean);
  if (candidates.some((value) => value.includes(role) || role.includes(value))) return true;

  return roleSynonyms.some((term) => candidates.some((value) => value.includes(term) || term.includes(value)));
}

function buildStaffPersonaOptions(staffDirectory: StaffDirectoryRow[], roleName: string) {
  return (staffDirectory || [])
    .filter((row) => {
      const status = normalizePersonaToken(row.status);
      return !status || status.includes("active") || status.includes("current") || status.includes("enabled");
    })
    .filter((row) => roleMatchesStaffDirectory(roleName, row.role, row.department, row.staff_name))
    .sort((a, b) => String(a.staff_name || a.email || a.staff_id || "").localeCompare(String(b.staff_name || b.email || b.staff_id || "")))
    .map((row) => {
      const label = [row.staff_name, row.department ? `(${row.department})` : ""]
        .filter(Boolean)
        .join(" ")
        .trim();
      return {
        value: row.email || row.staff_id || row.staff_name,
        label: label || row.staff_name || row.email || row.staff_id || "Unnamed staff",
        email: row.email || "",
        role: row.role || "",
        staffId: row.staff_id || "",
      displayLabel: row.staff_name || row.email || row.staff_id || "Unnamed staff"
      };
    })
    .filter((item) => Boolean(item.value));
}

function buildStudentPersonaOptions(studentDirectory: StudentDirectoryRow[], enrollmentRows: StudentEnrollmentRow[] = []) {
  const enrollmentByStudentId = new Map(
    (enrollmentRows || [])
      .filter((row) => Boolean(row.student_id))
      .map((row) => [String(row.student_id || "").trim().toLowerCase(), row] as const)
  );

  return (studentDirectory || [])
    .filter((row) => {
      const status = normalizePersonaToken(row.status);
      return !status || status.includes("active") || status.includes("current") || status.includes("enabled");
    })
    .sort((a, b) => String(a.student_name || a.student_id || "").localeCompare(String(b.student_name || b.student_id || "")))
    .map((row) => {
      const enrollment = enrollmentByStudentId.get(String(row.student_id || "").trim().toLowerCase());
      const className = enrollment?.class || row.class || "";
      const section = enrollment?.section || row.section || "";
      const classLabel = [className, section].filter(Boolean).join(section ? "-" : "");
      return {
        value: row.student_name || row.student_id || "Unnamed student",
        label: classLabel ? `${row.student_name || row.student_id || "Unnamed student"} (${classLabel})` : (row.student_name || row.student_id || "Unnamed student"),
        email: "",
        role: "Student",
        staffId: row.student_id || "",
        displayLabel: row.student_name || row.student_id || "Unnamed student"
      };
    })
    .filter((item) => Boolean(item.value));
}

interface SidebarGroup {
  label: string | null;
  items: Array<{
    id: string;
    name: string;
    icon: React.ComponentType<{ size: number; className?: string }>;
    parentGroup: string;
    helperText?: string;
  }>;
}

function resolveSidebarGroupsForDisplay(
  items: Array<{
    id: string;
    name: string;
    icon: React.ComponentType<{ size: number; className?: string }>;
    parentGroup: string;
    helperText?: string;
  }>,
  activeCapabilities: string[],
  activeRoles: string[]
): SidebarGroup[] {
  if (items.length === 0) return [];

  // Case A: Very small menu (4 or fewer items)
  if (items.length <= 4) {
    return [{ label: null, items }];
  }

  // Check if admin-heavy (Administration or Governance in capabilities, or "School Admin" in roles)
  const isAdminHeavy = activeCapabilities.includes("Administration") ||
                       activeCapabilities.includes("Governance") ||
                       activeRoles.includes("School Admin");

  if (isAdminHeavy) {
    // Case D: Admin-heavy menu
    // Group into My Workspace, Teaching & Learning, System & Data, and School Operations.
    const myWorkspaceItems: typeof items = [];
    const teachingLearningItems: typeof items = [];
    const systemDataItems: typeof items = [];
    const managementItems: typeof items = [];
    const otherGroups: Record<string, typeof items> = {};

    items.forEach(item => {
      if (item.parentGroup === "My Workspace") {
        myWorkspaceItems.push(item);
      } else if (item.parentGroup === "Teaching & Learning") {
        teachingLearningItems.push(item);
      } else if (item.parentGroup === "System & Data") {
        systemDataItems.push(item);
      } else if (item.parentGroup === "School Operations" || item.parentGroup === "Leadership & Governance") {
        managementItems.push(item);
      } else {
        if (!otherGroups[item.parentGroup]) {
          otherGroups[item.parentGroup] = [];
        }
        otherGroups[item.parentGroup].push(item);
      }
    });

    const groups: SidebarGroup[] = [];
    if (myWorkspaceItems.length > 0) {
      groups.push({ label: "My Workspace", items: myWorkspaceItems });
    }
    if (teachingLearningItems.length > 0) {
      groups.push({ label: "Teaching & Learning", items: teachingLearningItems });
    }
    if (systemDataItems.length > 0) {
      groups.push({ label: "System & Data", items: systemDataItems });
    }
    if (managementItems.length > 0) {
      groups.push({ label: "School Operations", items: managementItems });
    }
    Object.keys(otherGroups).forEach(groupName => {
      groups.push({ label: groupName, items: otherGroups[groupName] });
    });

    return groups;
  }

  // Fallback to general grouping: standard groups
  const groupMap: Record<string, typeof items> = {};
  items.forEach(item => {
    if (!groupMap[item.parentGroup]) {
      groupMap[item.parentGroup] = [];
    }
    groupMap[item.parentGroup].push(item);
  });

  const groupNames = Object.keys(groupMap);
  const sparseGroups = groupNames.filter(name => groupMap[name].length === 1);

  // Case B: Sparse groups or merges needed
  if (sparseGroups.length > 0) {
    const countMyWorkspace = (groupMap["My Workspace"] || []).length;
    const countTeachingLearning = (groupMap["Teaching & Learning"] || []).length;
    const countSystemData = (groupMap["System & Data"] || []).length;
    const countSchoolOperations = (groupMap["School Operations"] || []).length;
    const countLeadershipGovernance = (groupMap["Leadership & Governance"] || []).length;

    const groups: SidebarGroup[] = [];
    if (countMyWorkspace > 0) {
      groups.push({ label: "My Workspace", items: groupMap["My Workspace"] });
    }
    if (countTeachingLearning > 0) {
      groups.push({ label: "Teaching & Learning", items: groupMap["Teaching & Learning"] });
    }

    if (countSystemData > 0) {
      groups.push({ label: "System & Data", items: groupMap["System & Data"] });
    }

    if (countSchoolOperations > 0) {
      groups.push({ label: "School Operations", items: groupMap["School Operations"] });
    }
    if (countLeadershipGovernance > 0) {
      groups.push({ label: "Leadership & Governance", items: groupMap["Leadership & Governance"] });
    }

    return groups;
  }

  // Case C: Normal larger menu with no sparse groups of size 1
  const normalResult: SidebarGroup[] = [];
  if ((groupMap["My Workspace"] || []).length > 0) {
    normalResult.push({ label: "My Workspace", items: groupMap["My Workspace"] });
  }
  if ((groupMap["Teaching & Learning"] || []).length > 0) {
    normalResult.push({ label: "Teaching & Learning", items: groupMap["Teaching & Learning"] });
  }
  if ((groupMap["System & Data"] || []).length > 0) {
    normalResult.push({ label: "System & Data", items: groupMap["System & Data"] });
  }
  if ((groupMap["School Operations"] || []).length > 0) {
    normalResult.push({ label: "School Operations", items: groupMap["School Operations"] });
  }
  if ((groupMap["Leadership & Governance"] || []).length > 0) {
    normalResult.push({ label: "Leadership & Governance", items: groupMap["Leadership & Governance"] });
  }

  return normalResult;
}

export function sanitizeStudentTerminology(text: string, isStudent: boolean): string {
  if (!isStudent) return text;
  return text
    .replace(/Academic Repository/gi, "Study materials")
    .replace(/School Drive Structure/gi, "Class materials")
    .replace(/Governance/gi, "Class feedback")
    .replace(/Manifest/gi, "Assignments")
    .replace(/Schema/gi, "Assessments")
    .replace(/Workflow Automation Builder/gi, "Class updates");
}

function getPlainLanguagePermissions(roles: string[]): string[] {
  const isStudent = roles.includes("Student");
  const isTeacher = roles.includes("Teacher");
  const isCoordinator = roles.includes("School Coordinator") || roles.includes("Examination Chair");
  const isAdminOrPrincipal = roles.includes("School Admin") || roles.includes("Principal");

  if (isStudent) {
    return [
      "view your learning dashboard",
      "search materials shared with you",
      "view tasks and class updates"
    ];
  }
  if (isTeacher) {
    return [
      "view your dashboard",
      "search files shared with you",
      "manage your tasks",
      "review Classroom activity",
      "use AI Assistant"
    ];
  }
  if (isCoordinator) {
    return [
      "review school dashboards",
      "manage department curricula",
      "track tasks and assignments",
      "oversee Classroom sync",
      "use AI Assistant"
    ];
  }
  if (isAdminOrPrincipal) {
    return [
      "review school dashboards",
      "manage academic-year workflows",
      "review governance and audit records",
      "check school drive structure",
      "configure roles and access"
    ];
  }
  // Default fallback for other roles (e.g., Parent Representative, Finance, HR)
  return [
    "view allocated dashboard panels",
    "search documents permitted for your role",
    "manage assigned checklist items"
  ];
}

const ROUTE_TABS = new Set([
  "overview",
  "role-cards",
  "registers",
  "settings",
  "dashboard-data-source",
  "school-setup",
  "setup-registries",
  "admin-registry-detail",
  "search",
  "classroom",
  "students",
  "registries",
  "teachers",
  "staff",
  "courses",
  "assignments",
  "tasks",
  "ai-assistant",
  "rollover",
  "governance",
  "mock_studio",
  "lesson-plans",
  "resources",
  "textbooks",
]);

interface RouteState {
  tab: string;
  registryId: string | null;
}

function getRouteStateFromPathname(pathname: string): RouteState {
  const path = String(pathname || "").replace(/^\/+/, "");
  if (!path) return { tab: "overview", registryId: null };

  const [firstSegment, ...rest] = path.split("/");
  if (firstSegment === "registers") {
    return {
      tab: "registries",
      registryId: null,
    };
  }
  if (firstSegment === "registries") {
    return {
      tab: "registries",
      registryId: rest.length > 0 ? decodeURIComponent(rest.join("/")) : null,
    };
  }

  return {
    tab: ROUTE_TABS.has(firstSegment) ? firstSegment : "overview",
    registryId: null,
  };
}

function getPathnameFromRouteState(tab: string, registryId: string | null): string {
  if (tab === "overview") return "/";
  if (tab === "registers") return "/registries";
  if (tab === "registries") {
    return registryId ? `/registries/${encodeURIComponent(registryId)}` : "/registries";
  }
  return `/${tab}`;
}

export default function App() {
  // Mobile UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);

  // Active Tab
  const initialRouteState = useMemo(() => {
    if (typeof window === "undefined") {
      return { tab: "overview", registryId: null } as RouteState;
    }
    return getRouteStateFromPathname(window.location.pathname);
  }, []);
  const [activeTab, setActiveTab] = useState(initialRouteState.tab);
  const [selectedRegistryId, setSelectedRegistryId] = useState<string | null>(initialRouteState.registryId);

  // Databases States
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [students, setStudents] = useState<StudentDetails[]>([]);
  const [teachers, setTeachers] = useState<TeacherDetails[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [rolloverConfig, setRolloverConfig] = useState<AcademicYearConfig>({
    currentYear: "2025-2026",
    targetYear: "2026-2027",
    status: "idle",
    promotionCount: 0,
    archivedCoursesCount: 0,
    clonedWorkflowsCount: 0
  });

  // Current Auth session simulation (RBAC controlled)
  const [currentUser, setCurrentUser] = useState("Local Schooly operator");
  const [currentRole, setCurrentRole] = useState("Principal");
  const [schoolRegistry, setSchoolRegistry] = useState<SchoolRegistryState | null>(null);
  const [schoolRegistryLoading, setSchoolRegistryLoading] = useState(false);

  // Schema-driven active definitions states
  const [schema, setSchema] = useState<ExportableSchoolySchema>(() => loadActiveMetadata());
  const [schemaDrivenRendering, setSchemaDrivenRendering] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("schooly_schema_driven_rendering");
      return stored === "true" || stored === null; // Default to true if null/not set
    } catch {
      return true;
    }
  });
  const [sidebarConnectionDetailsOpen, setSidebarConnectionDetailsOpen] = useState(false);

  // Concurrent Multi-Roles selection states to enable combined governance capabilities
  const [activeRoles, setActiveRoles] = useState<string[]>(["Principal"]);
  const schoolRegistryAcademicYearOptions = useMemo(() => {
    const rows = (schoolRegistry?.academicYears || []) as Array<Record<string, any>>;
    return Array.from(new Set(
      rows
        .map((row) => String(row.academic_year || row.academic_years || row.term_name || row.session || row.name || "").trim())
        .filter(Boolean)
    ));
  }, [schoolRegistry]);
  const schoolRegistryAcademicYearLabel = useMemo(() => {
    const rows = [
      ...(schoolRegistry?.academicYears || []),
      ...(schoolRegistry?.schoolProfile || [])
    ] as Array<Record<string, any>>;
    for (const row of rows) {
      const label = String(row.academic_years || row.academic_year || row.term_name || row.session || row.name || "").trim();
      if (label) return label;
    }
    return "";
  }, [schoolRegistry]);
  const [selectedDashboardAcademicYearLabel, setSelectedDashboardAcademicYearLabel] = useState("");
  useEffect(() => {
    const fallbackLabel = schoolRegistryAcademicYearLabel || rolloverConfig.targetYear || rolloverConfig.currentYear || "";
    if (schoolRegistryAcademicYearOptions.length === 0) {
      if (!selectedDashboardAcademicYearLabel && fallbackLabel) {
        setSelectedDashboardAcademicYearLabel(fallbackLabel);
      }
      return;
    }
    if (!selectedDashboardAcademicYearLabel || !schoolRegistryAcademicYearOptions.includes(selectedDashboardAcademicYearLabel)) {
      setSelectedDashboardAcademicYearLabel(schoolRegistryAcademicYearLabel || schoolRegistryAcademicYearOptions[0] || fallbackLabel);
    }
  }, [schoolRegistryAcademicYearLabel, schoolRegistryAcademicYearOptions, selectedDashboardAcademicYearLabel, rolloverConfig.targetYear, rolloverConfig.currentYear]);
  const dashboardAcademicYearLabel = selectedDashboardAcademicYearLabel || schoolRegistryAcademicYearLabel || rolloverConfig.targetYear || rolloverConfig.currentYear || "";

  useEffect(() => {
    // Keep active roles in sync with single role switcher persona
    setActiveRoles([currentRole]);
  }, [currentRole]);

  useEffect(() => {
    let isMounted = true;
    setSchoolRegistryLoading(true);
    loadSchoolRegistry()
      .then((registry) => {
        if (!isMounted) return;
        setSchoolRegistry(registry);
      })
      .catch((error) => {
        console.warn("[DEBUG] Live staff directory could not be loaded.", error);
        if (!isMounted) return;
        setSchoolRegistry(null);
      })
      .finally(() => {
        if (isMounted) {
          setSchoolRegistryLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [googleWorkspaceAuthState, setGoogleWorkspaceAuthState] = useState(() => getGoogleWorkspaceAuthState());
  useEffect(() => {
    const syncAuthState = () => setGoogleWorkspaceAuthState(getGoogleWorkspaceAuthState());
    window.addEventListener(GOOGLE_WORKSPACE_AUTH_STATE_CHANGED_EVENT, syncAuthState);
    return () => window.removeEventListener(GOOGLE_WORKSPACE_AUTH_STATE_CHANGED_EVENT, syncAuthState);
  }, []);

  // Resolve combined capabilities list for UI preview
  const getCombinedCapabilities = () => {
    const caps = new Set<string>();
    activeRoles.forEach(rName => {
      const rDef = schema.roles.find(r => r.roleName === rName || r.roleId === rName.toLowerCase().replace(/\s+/g, "-"));
      if (rDef) {
        rDef.capabilities.forEach(cap => caps.add(cap));
      }
    });
    return Array.from(caps);
  };
  const activeCapabilities = getCombinedCapabilities();

  const personaOptions = useMemo(
    () => currentRole === "Student"
      ? buildStudentPersonaOptions(schoolRegistry?.studentDirectory || [], schoolRegistry?.studentEnrollment || [])
      : buildStaffPersonaOptions(schoolRegistry?.staffDirectory || [], currentRole),
    [schoolRegistry, currentRole]
  );

  useEffect(() => {
    if (personaOptions.length === 0) return;
    const selectedExists = personaOptions.some((option) =>
      [option.value, option.email, option.staffId, option.displayLabel, option.label].includes(currentUser)
    );
    if (!selectedExists || currentUser === "Local Schooly operator") {
      setCurrentUser(personaOptions[0].value);
    }
  }, [currentRole, personaOptions, currentUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const nextRoute = getRouteStateFromPathname(window.location.pathname);
      setActiveTab(nextRoute.tab);
      setSelectedRegistryId(nextRoute.registryId);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const desiredPath =
      getPathnameFromRouteState(activeTab, activeTab === "registries" ? selectedRegistryId : null) +
      (activeTab === "resources" ? window.location.search : "");
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (currentPath !== desiredPath) {
      window.history.pushState({}, "", desiredPath);
    }
  }, [activeTab, selectedRegistryId]);

  useEffect(() => {
    if (activeTab !== "registries" && selectedRegistryId) {
      setSelectedRegistryId(null);
    }
  }, [activeTab, selectedRegistryId]);

  // Protect route views in real-time when roles or configurations shift
  useEffect(() => {
    // Avoid running before navigation items compile
    const activeNavIds = getNavigationItems().map(item => item.id);
    const dashboardUtilityTabs = new Set(["dashboard-data-source", "school-setup", "setup-registries", "admin-registry-detail", "mock_studio"]);
    if (activeNavIds.length > 0 && !activeNavIds.includes(activeTab) && !dashboardUtilityTabs.has(activeTab)) {
      console.log(`[ROUTE SECURITY] Active tab "${activeTab}" is not permitted for current capabilities. Redirecting to "${activeNavIds[0]}"`);
      setActiveTab(activeNavIds[0]);
    }
  }, [activeRoles, schemaDrivenRendering, schema]);

  // Google Workspace Core URL state configuration with localStorage caching
  const [workspaceUrl, setWorkspaceUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("schooly_workspace_url");
      console.log("[DEBUG] Read local storage workspace URL:", stored);
      return stored || DEFAULT_DASHBOARD_SHEET_URL;
    } catch (e) {
      console.warn("[DEBUG] LocalStorage read blocked by iframe sandbox restriction. Defaulting to demo coordinates.", e);
      return DEFAULT_DASHBOARD_SHEET_URL;
    }
  });
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>("");
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem("schooly_gemini_api_key") || "";
    } catch (e) {
      console.warn("[DEBUG] LocalStorage read for gemini api key failed.", e);
      return "";
    }
  });
  const [tempGeminiKey, setTempGeminiKey] = useState<string>("");
  const [showKeyText, setShowKeyText] = useState<boolean>(false);

  // Google Sidebar testing state controllers
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.trim()) {
      setConnectionTestResult({
        success: false,
        message: "No URL structured. Please configure a link first."
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      let authHeader = "";
      const token = await getGoogleWorkspaceAccessToken();
      if (token) {
        authHeader = `Bearer ${token}`;
      }

      const response = await fetch("/api/workspace/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({ url: targetUrl })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      setConnectionTestResult({
        success: result.success,
        message: result.message
      });
    } catch (error: any) {
      console.error("[TEST CONNECTION ERROR]", error);
      setConnectionTestResult({
        success: false,
        message: `Network Exception: ${error?.message || "Could not query validation service."}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Document quick detail sidebar overlay
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);

  // Connection mode simulation evaluation (Phase 24 compliance sync checks)
  const isSheetWorkspace = workspaceUrl.trim().toLowerCase().startsWith("https://docs.google.com/spreadsheets/d/");
  const isWorkspaceMock = (!validateSourceLink(workspaceUrl, "google_workspace") || (() => {
    try {
      return localStorage.getItem("schooly_workspace_connected") !== "true";
    } catch {
      return true;
    }
  })()) && !isSheetWorkspace;

  console.log(`[RENDER DIAGNOSTIC] App Component Render. Active Tab: ${activeTab} | Role: ${currentRole} | User: ${currentUser} | showUrlModal: ${showUrlModal} | workspaceUrl: ${workspaceUrl}`);

  // Re-fetch all standard school assets when personas or operators pivot
  useEffect(() => {
    console.log(`[DEBUG] Persona Shift detected. User: ${currentUser} | Role: ${currentRole}`);
    fetchAllData();
  }, [currentUser, currentRole]);

  const fetchAllData = async () => {
    console.log("[DEBUG] fetchAllData() triggered. Sending batch GET requests to REST backend...");
    try {
      const token = await getGoogleWorkspaceAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (workspaceUrl) {
        headers["X-Workspace-Url"] = workspaceUrl;
      }

      const [filesRes, coursesRes, assignRes, tasksRes, stdRes, teachRes, logsRes, autoRes, configRes] = await Promise.all([
        fetch("/api/workspace/files", { headers }),
        fetch("/api/classroom/courses", { headers }),
        fetch("/api/classroom/assignments", { headers }),
        fetch("/api/tasks", { headers }),
        fetch("/api/students", { headers }),
        fetch("/api/teachers", { headers }),
        fetch("/api/audit-logs", { headers }),
        fetch("/api/automations", { headers }),
        fetch("/api/academic/rollover-config", { headers })
      ]);

      const filesData = await filesRes.json();
      const coursesData = await coursesRes.json();
      const assignmentsData = await assignRes.json();
      const tasksData = await tasksRes.json();
      const studentsData = await stdRes.json();
      const teachersData = await teachRes.json();
      const logsData = await logsRes.json();
      const automationsData = await autoRes.json();
      const configData = await configRes.json();

      console.log("[DEBUG] batch GET requests resolved successfully:", {
        filesCount: filesData.length,
        coursesCount: coursesData.length,
        tasksCount: tasksData.length,
        logsCount: logsData.length
      });

      setFiles(filesData);
      setCourses(coursesData);
      setAssignments(assignmentsData);
      setTasks(tasksData);
      setStudents(studentsData);
      setTeachers(teachersData);
      setAuditLogs(logsData);
      setAutomations(automationsData);
      setRolloverConfig(configData);
    } catch (err) {
      console.error("[DEBUG] Failed fetching standard datasets from express master routes:", err);
    }
  };

  // 1. Toggle Pinned Favorite
  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/workspace/files/${id}/toggle-favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser, role: currentRole })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed toggling favorites state", err);
    }
  };

  // 2. Update Governance tags
  const handleUpdateTags = async (id: string, tagsList: string[]) => {
    try {
      const res = await fetch(`/api/workspace/files/${id}/update-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser, role: currentRole, tags: tagsList })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed writing tags parameters to backend:", err);
    }
  };

  // 3. Add Custom tasks
  const handleAddTask = async (taskPayload: Partial<TaskItem>) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskPayload, user: currentUser, role: currentRole })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed spawning tasks metadata:", err);
    }
  };

  // 4. Modify Kanban or lists Task properties
  const handleUpdateTask = async (id: string, updatePayload: Partial<TaskItem>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatePayload, user: currentUser, role: currentRole })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed modifying task variables:", err);
    }
  };

  // 5. Delete specific task
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}?user=${encodeURIComponent(currentUser)}&role=${encodeURIComponent(currentRole)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed truncating task slots:", err);
    }
  };

  // 6. Handle custom role swaps
  const handleSwitchRole = (roleName: string, personaValue: string) => {
    console.log(`[DEBUG] handleSwitchRole called. Target Persona: ${roleName} | Selected user: ${personaValue}`);
    setCurrentRole(roleName);
    setCurrentUser(personaValue);

    if (roleName !== "School Admin" && activeTab === "governance") {
      console.log("[DEBUG] Target role is not Admin and active tab is governance. Redirecting overview tab.");
      setActiveTab("overview");
    }

    // Dispatch logging message through backend portal
    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: personaValue,
        role: roleName,
        action: "RBAC Swap",
        detail: `Swapped active workspace permissions to ${roleName} mode`,
        category: "auth",
        success: true
      })
    }).then(() => {
      console.log("[DEBUG] Audit log for RBAC Swap saved. Fetching data...");
      fetchAllData();
    });
  };

  // 7. Inject newly blueprinted NLP automations
  const handleAddAutomation = async (rulePayload: Partial<AutomationRule>) => {
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rulePayload, user: currentUser, role: currentRole })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed syncing automation blueprints:", err);
    }
  };

  // 8. Toggle active workflow triggers
  const handleToggleAutomation = async (id: string) => {
    try {
      const res = await fetch(`/api/automations/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser, role: currentRole })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed flipping automation state:", err);
    }
  };

  // 9. Execute year rollover
  const handleTriggerRollover = async (strategy: string, targetYr: string) => {
    try {
      const res = await fetch("/api/academic/trigger-rollover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: currentUser,
          role: currentRole,
          promoStrategy: strategy,
          targetYearLabel: targetYr
        })
      });
      if (res.ok) {
        // Poll database updates immediately to visually transition loaders
        setTimeout(() => {
          fetchAllData();
        }, 1250);
      }
    } catch (err) {
      console.error("Rollover wizard execution crashed", err);
    }
  };

  // Sidebar Menu Routing Array compiled dynamically through schema Engine metadata
  const getNavigationItems = () => {
    // Generate compiled routes using the active roles and selected schema representation
    const compiled = compileDynamicNavigation(activeRoles, schema, schemaDrivenRendering);

    // Resolve proper Lucide React component structures dynamically to maintain 100% type-safety & backwards compatibility
    const items = compiled
      .map(item => {
        if (item.id === "teachers" || item.id === "registers") return null;

        const normalizedParentGroup =
          item.id === "ai-assistant" || item.id === "role-cards"
            ? "My Workspace"
            : item.id === "registries"
              ? "System & Data"
              : item.id === "staff"
            ? "School Operations"
              : item.id === "courses" || item.id === "assignments" || item.id === "resources"
                ? "Teaching & Learning"
                : item.parentGroup;

        const normalizedName =
          item.id === "role-cards"
            ? "Role Dashboards"
            : item.id === "ai-assistant"
            ? "My AI Assistant"
            : item.id === "registries"
              ? "Registry Explorer"
              : item.id === "resources"
                ? "Resources"
              : item.label;

        return {
          id: item.id,
          name: normalizedName,
          icon: IconMap[item.icon] || Command,
          parentGroup: normalizedParentGroup,
          helperText: item.helperText
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        name: string;
        icon: React.ComponentType<{ size: number; className?: string }>;
        parentGroup: string;
        helperText?: string;
      }>;

    // Inject Textbook Ingestor Tab
    items.push({
      id: "textbooks",
      name: "NCERT Textbooks",
      icon: BookOpen,
      parentGroup: "Teaching & Learning",
      helperText: "Ingest & manage syllabus units"
    });

    return items;
  };

  const navigationItems = getNavigationItems();
  const primaryNavItems = [
    { id: "overview", name: "Dashboard", icon: LayoutGrid, parentGroup: "Primary" },
    { id: "search", name: "Search", icon: Search, parentGroup: "Primary" }
  ];
  const settingsNavItem = navigationItems.find((item) => item.id === "settings");
  const visibleNavigationItems = navigationItems.filter((item) => item.id !== "settings" && item.id !== "role-cards");
  const workspaceNavItems = [
    { id: "ai-assistant", name: "My AI Assistant", icon: Sparkles, parentGroup: "My Workspace" },
    ...visibleNavigationItems.filter((item) => !["overview", "search", "ai-assistant"].includes(item.id))
  ];
  const getDisplayNavName = (item: { id: string; name: string }) => {
    if (item.id === "lesson-plans") {
      return "Lessons Workspace";
    }
    if (item.id === "role-cards") {
      return "Role Dashboards";
    }
    if (item.id === "ai-assistant") {
      return "My AI Assistant";
    }
    if (item.id === "registries") {
      return "Registry Explorer";
    }
    if (item.id === "resources") {
      return "Resources";
    }
    if (item.id === "settings") {
      return "Settings";
    }
    return sanitizeStudentTerminology(item.name, currentRole === "Student");
  };
  type LiveRegisterCardSourceState = "Ready" | "Empty" | "Missing" | "Incomplete" | "Fallback" | "Unknown";
  const getRegistryCardSourceState = (count: number, sourceKind: "master" | "service"): LiveRegisterCardSourceState => {
    if (sourceKind === "master") {
      if (schoolRegistryLoading) return "Unknown";
      if (!schoolRegistry) return "Missing";
      if (schoolRegistry.mode === "error" || schoolRegistry.mode === "missing") return "Missing";
      if (schoolRegistry.mode === "fallback") return "Fallback";
      if (count === 0) return "Empty";
      return "Ready";
    }
    if (count > 0) return "Ready";
    return "Unknown";
  };

  const liveRegisterCards = useMemo(() => {
    const teacherCount = [...new Set((schoolRegistry?.teacherAllocations || []).map((allocation) => allocation.teacher_name || allocation.teacher_email).filter(Boolean))].length;
    const subjectCount = schoolRegistry?.subjects.length ?? 0;
    const classCount = schoolRegistry?.classesSections.length ?? 0;
    const studentCount = schoolRegistry?.studentDirectory.length ?? 0;
    const staffCount = schoolRegistry?.staffDirectory.length ?? 0;
    const assignmentCount = assignments.length;
    const taskCount = tasks.length;

    return [
      {
        title: "Students",
        count: studentCount,
        sourceState: getRegistryCardSourceState(studentCount, "master"),
        detail: "Open the live student registry",
        source: "Master Registry / Student_Directory",
        drillTarget: { kind: "page", registryId: "students" as const }
      },
      {
        title: "Teachers",
        count: teacherCount,
        sourceState: getRegistryCardSourceState(teacherCount, "master"),
        detail: "Open the derived teacher view",
        source: "Master Registry / Teacher_Allocations",
        drillTarget: { kind: "page", registryId: "teachers" as const }
      },
      {
        title: "Classes & Sections",
        count: classCount,
        sourceState: getRegistryCardSourceState(classCount, "master"),
        detail: "Open the classroom course page",
        source: "Master Registry / Classes_Sections",
        drillTarget: { kind: "page", registryId: "courses" as const }
      },
      {
        title: "Staff",
        count: staffCount,
        sourceState: getRegistryCardSourceState(staffCount, "master"),
        detail: "Open the canonical staff directory",
        source: "Master Registry / Staff_Directory",
        drillTarget: { kind: "page", registryId: "staff" as const }
      },
      {
        title: "Subjects",
        count: subjectCount,
        sourceState: getRegistryCardSourceState(subjectCount, "master"),
        detail: "Open the master registry subject tab",
        source: "Master Registry / Subjects",
        drillTarget: { kind: "data", registryId: "masterDataRegistryUrl__subjects" as const }
      },
      {
        title: "Assignments",
        count: assignmentCount,
        sourceState: getRegistryCardSourceState(assignmentCount, "service"),
        detail: "Open the assignment page",
        source: "Classroom / Assignment records",
        drillTarget: { kind: "page", registryId: "assignments" as const }
      },
      {
        title: "Tasks & Follow-ups",
        count: taskCount,
        sourceState: getRegistryCardSourceState(taskCount, "service"),
        detail: "Open dashboard alerts and follow-ups",
        source: "Dashboard Data Source / Alert_Log",
        drillTarget: { kind: "tab", tab: "dashboard-data-source" as const }
      }
    ];
  }, [assignments.length, courses.length, schoolRegistry, schoolRegistryLoading, students.length, tasks.length]);
  const hideRolePersonaWidget = currentRole === "Principal" || currentRole === "Manager";

  const renderDashboardWorkspace = (dashboardView?: "overview" | "role-cards" | "registers" | "settings" | "data-source" | "setup" | "setup-registries" | "registry-detail") => (
    <DashboardOverview
      files={files}
      courses={courses}
      tasks={tasks}
      students={students}
      currentUser={currentUser}
      currentRole={currentRole}
      onSelectFile={(f) => setSelectedFile(f)}
      onToggleFavorite={handleToggleFavorite}
      onToggleTab={(t) => setActiveTab(t)}
      schema={schema}
      schemaDrivenRendering={schemaDrivenRendering}
      activeRoles={activeRoles}
      isWorkspaceMock={isWorkspaceMock}
      workspaceUrl={workspaceUrl}
      activeAcademicYearLabel={dashboardAcademicYearLabel}
      academicYearOptions={schoolRegistryAcademicYearOptions}
      onAcademicYearChange={setSelectedDashboardAcademicYearLabel}
      onOpenRegistryDataRoute={openRegistryDataRoute}
      dashboardView={dashboardView}
      onConfigureWorkspace={() => {
        setTempUrl(workspaceUrl);
        setTempGeminiKey(geminiApiKey);
        setShowUrlModal(true);
      }}
    />
  );

  const openRegistryPage = (registryId: string) => {
    const row = getRegistryExplorerRow(registryId);
    const routeSegment = String(row?.pageRoute || "").replace(/^\/+/, "");
    if (!routeSegment) return;
    setSelectedRegistryId(null);
    setActiveTab(routeSegment);
    setMobileMenuOpen(false);
  };

  const openRegistryDataRoute = (registryId: string) => {
    setSelectedRegistryId(registryId);
    setActiveTab("registries");
    setMobileMenuOpen(false);
  };

  const renderRegistryDataSurface = (registryId: string) => {
    switch (registryId) {
      case "students":
        return <StudentsRegistryPage students={students} currentRole={currentRole} />;
      case "teachers":
        return (
          <TeachersRegistryPage
            staffRows={schoolRegistry?.staffDirectory || []}
            teacherAllocations={schoolRegistry?.teacherAllocations || []}
            currentRole={currentRole}
          />
        );
      case "staff":
        return <StaffRegistryPage staffRows={schoolRegistry?.staffDirectory || []} currentRole={currentRole} />;
      case "courses":
        return <ClassroomCoursesRegistryPage courses={courses} currentRole={currentRole} />;
      case "assignments":
        return <ClassroomAssignmentsRegistryPage assignments={assignments} currentRole={currentRole} />;
      default:
        return (
          <GenericRegistryDataPage
            registryId={registryId}
            currentRole={currentRole}
            onBackToExplorer={() => setSelectedRegistryId(null)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900" id="main-app-container">

      {/* Mobile Top Header bar */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40" id="mobile-top-bar">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg">
            <GraduationCap size={18} />
          </div>
          <span className="font-bold tracking-tight text-slate-900 text-sm">Schooly AI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-slate-50 rounded-md text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Workspace Left Navigation Sidebar (Desktop persistent, Mobile Slideover overlay) */}
      <aside className={`
        fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-64 p-5 flex flex-col justify-between z-55 transition-transform duration-305
        md:static md:translate-x-0 shrink-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `} id="side-navigation-panel">

        <div className="space-y-6">
          {/* Branded Title Segment */}
          <div className="hidden md:flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <GraduationCap size={18} />
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-950 text-sm block">Schooly AI</span>
              <span className="text-[10px] text-blue-600 font-bold font-mono uppercase tracking-wide px-0.5 shadow-2xs">Enterprise</span>
            </div>
          </div>

          {/* Sidenav Role Simulation Controller widget */}
          {!hideRolePersonaWidget && (
          <div className="px-2 bg-slate-50/50 border border-slate-100 p-3 text-left rounded-2xl space-y-3" id="sandbox-preview-bar">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[9px] text-slate-400 font-mono font-bold block uppercase tracking-wider">
                Role context
              </label>
              {isWorkspaceMock && (
                <span className="text-[8.5px] text-blue-600 font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                  Preview
                </span>
              )}
            </div>

            <select
              value={currentRole}
              onChange={(e) => {
                const nextRole = e.target.value;
                const nextOptions = nextRole === "Student"
                  ? buildStudentPersonaOptions(schoolRegistry?.studentDirectory || [], schoolRegistry?.studentEnrollment || [])
                  : buildStaffPersonaOptions(schoolRegistry?.staffDirectory || [], nextRole);
                const fallbackRole = schema.roles.find((r) => r.roleName === nextRole || r.roleId === nextRole.toLowerCase().replace(/\s+/g, "-"));
                handleSwitchRole(nextRole, nextOptions[0]?.value || fallbackRole?.defaultEmail || currentUser);
              }}
              className="w-full text-[11.5px] font-semibold bg-white border border-slate-200 text-slate-700 py-2 px-2 rounded-xl cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans shadow-2xs"
            >
              {schema.roles.map((r) => (
                <option key={r.roleId} value={r.roleName}>
                  {r.roleName}
                </option>
              ))}
            </select>

            {personaOptions.length > 0 ? (
              <select
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                disabled={schoolRegistryLoading}
                className="w-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 py-2 px-2 rounded-xl cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans shadow-2xs disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                title={currentRole === "Student" ? "Select the student for the current role." : "Select the staff member for the current role."}
              >
                {personaOptions.map((person) => (
                  <option key={`${person.value}-${person.email || person.staffId}`} value={person.value}>
                    {person.displayLabel}
                  </option>
                ))}
              </select>
            ) : currentRole === "Student" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-800">
                No student profile found for this role.
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-800">
                No additional profile found for this role.
              </div>
            )}

            {isWorkspaceMock && personaOptions.length > 0 && (
              <div className="text-[9px] text-slate-500 font-mono bg-white px-2 py-1.5 rounded-lg border border-slate-100">
                {currentRole === "Student"
                  ? `${personaOptions.length} student rows loaded`
                  : `${personaOptions.length} staff rows loaded`}
              </div>
            )}

            {isWorkspaceMock && activeRoles.length > 1 && (
              <div className="text-[9.5px] text-blue-600 font-mono bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100 uppercase font-bold leading-normal">
                Merged Capabilities: {activeRoles.length} Active Roles
              </div>
            )}

            {isWorkspaceMock && (
              <div className="pt-2 border-t border-slate-100 space-y-2" id="plain-permissions-sidebar-panel">
                <button
                  type="button"
                  onClick={() => setShowCapabilities(!showCapabilities)}
                  className="w-full flex items-center justify-between text-left text-[9px] text-slate-500 font-bold uppercase tracking-wider hover:text-slate-705 transition-colors cursor-pointer"
                >
                  <span className="font-sans">What you can do</span>
                  <span className="font-sans text-[9px]">{showCapabilities ? 'Hide' : 'Show'}</span>
                </button>

                {showCapabilities && (
                  <div className="space-y-2.5 pl-1.5 mt-1 transition-all">
                    <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-500 font-sans leading-tight">
                      {getPlainLanguagePermissions(activeRoles).map((perm, idx) => (
                        <li key={idx} className="capitalize">
                          {sanitizeStudentTerminology(perm, activeRoles.includes("Student"))}
                        </li>
                      ))}
                    </ul>

                    {(activeCapabilities.includes("Administration") ||
                      activeCapabilities.includes("Governance") ||
                      activeCapabilities.includes("Academic Leadership") ||
                      activeRoles.includes("School Admin")) && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 space-y-1">
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Advanced access details
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activeCapabilities.map(cap => (
                            <span
                              key={cap}
                              className="text-[8px] font-mono bg-slate-50 text-slate-500 px-1 py-0.5 rounded border border-slate-150"
                              title={`Capability string: ${cap}`}
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {primaryNavItems.length > 0 && (
            <div className="space-y-1.5" id="primary-nav-strip">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer group ${
                      activeTab === item.id
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    id={`nav-link-${item.id}`}
                  >
                    <Icon size={14} className="shrink-0 mt-0.5" />
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">{getDisplayNavName(item)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Nav buttons list */}
          <nav className="space-y-4" id="nav-options">
            {schemaDrivenRendering ? (
              // Role-Aware Workspace Navigation Groups (Presentation-only dynamically filtered)
              resolveSidebarGroupsForDisplay(workspaceNavItems, activeCapabilities, activeRoles).map((group, groupIdx) => {
                return (
                  <div key={group.label || `flat-group-${groupIdx}`} className="space-y-1 bg-transparent">
                    {group.label && (
                      <span className="text-[9px] font-bold text-slate-400 block px-2.5 uppercase tracking-wider mb-1.5 border-l-2 border-slate-200 font-mono">
                        {sanitizeStudentTerminology(group.label, currentRole === "Student")}
                      </span>
                    )}
                    {group.items.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer group ${
                            activeTab === item.id
                               ? "bg-blue-50 text-blue-700 font-bold"
                               : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                          id={`nav-link-${item.id}`}
                        >
                          <Icon size={14} className="shrink-0 mt-0.5" />
                          <div className="flex flex-col text-left">
                            <span className="font-semibold">{getDisplayNavName(item)}</span>
                            {item.helperText && (
                              <span className="text-[9.5px] font-normal leading-normal text-slate-400 group-hover:text-slate-500 transition-colors mt-0.5 font-sans">
                                {sanitizeStudentTerminology(item.helperText, currentRole === "Student")}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              // Classic single-list layout (Guarantees perfect visual backward compatibility)
              <div className="space-y-1">
                {visibleNavigationItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer group ${
                        activeTab === item.id
                           ? "bg-blue-50 text-blue-700 rounded-xl font-bold"
                           : "text-slate-500 hover:bg-slate-50 hover:text-slate-905"
                      }`}
                      id={`nav-link-${item.id}`}
                    >
                      <Icon size={16} className="shrink-0 mt-0.5" />
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">{getDisplayNavName(item)}</span>
                        {item.helperText && (
                          <span className="text-[9.5px] font-normal leading-normal text-slate-450 group-hover:text-slate-500 transition-colors mt-0.5 font-sans">
                            {sanitizeStudentTerminology(item.helperText, currentRole === "Student")}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>

          {settingsNavItem && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("settings");
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer group ${
                activeTab === "settings"
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              id="nav-link-settings"
            >
              <Settings size={14} className="shrink-0 mt-0.5" />
              <div className="flex flex-col text-left">
                <span className="font-semibold">{getDisplayNavName(settingsNavItem)}</span>
              </div>
            </button>
          )}
        </div>

        {/* Sidebar Footer segment */}
        <div className="pt-4 border-t border-slate-150 font-mono">
          <div className="rounded-2xl border border-slate-150 bg-slate-50 px-3 py-2.5 font-sans shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">Connection summary</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-700">
                    Role: {currentRole || "Not set"}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${workspaceUrl ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                    {workspaceUrl ? "Workspace connected" : "Needs setup"}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${googleWorkspaceAuthState.connected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                    {googleWorkspaceAuthState.connected ? "Sheets connected" : "Sheets not connected"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSidebarConnectionDetailsOpen((open) => !open)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-expanded={sidebarConnectionDetailsOpen}
                aria-controls="sidebar-connection-details"
              >
                <span>{sidebarConnectionDetailsOpen ? "Hide details" : "Show details"}</span>
                <ChevronDown size={11} className={`transition-transform ${sidebarConnectionDetailsOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {sidebarConnectionDetailsOpen && (
              <div id="sidebar-connection-details" className="space-y-2 border-t border-slate-200 pt-2">
                <div className="rounded-xl border border-slate-150 bg-white p-2.5 text-[10px] space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <span>Google Workspace Connection</span>
                    <span className={`w-2 h-2 rounded-full ${workspaceUrl ? "bg-emerald-500" : "bg-amber-400"}`} />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    Schooly uses the configured Workspace link for live registry checks. Google Sheets write access is managed in the onboarding wizard.
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] min-w-0">
                    <Link size={11} className="shrink-0 text-blue-600" />
                    {workspaceUrl ? (
                      <span className="min-w-0 truncate max-w-full text-slate-700 font-semibold" title={workspaceUrl}>{workspaceUrl}</span>
                    ) : (
                      <span className="text-amber-700 font-bold">No Workspace Link Configured</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                    <span className="text-[9px] uppercase font-mono font-black text-slate-400">Google Sheets write access</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${googleWorkspaceAuthState.connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {googleWorkspaceAuthState.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono space-y-0.5">
                    <div>Local Schooly role: {currentRole || "Not set"}</div>
                    <div>Google Sheets write account: {googleWorkspaceAuthState.connected ? "Connected account unavailable" : "Not connected"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUrlModal(true)}
                    className="w-full py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold font-sans transition-all text-center cursor-pointer"
                  >
                    Configure Workspace Link
                  </button>
                </div>

                <div className="rounded-xl border border-slate-150 bg-white p-2.5 text-[10px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">Local Schooly role</span>
                    <span className="text-[9px] text-slate-500 font-bold px-1.5 py-0.5 bg-slate-50 border border-slate-150 rounded-md font-mono uppercase shrink-0">
                      {(currentRole || "Not set").split(" ")[0]}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-650 truncate text-[10.5px]" title={currentUser}>Local Schooly operator</div>
                  <div className="text-[9px] text-slate-400 italic flex items-center gap-1 min-w-0">
                    <span className="min-w-0 truncate">Google Sheets write access: {googleWorkspaceAuthState.connected ? "Connected" : "Not connected"}</span>
                    {schemaDrivenRendering && (
                      <span className="shrink-0 text-[8.5px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded-sm border border-blue-105 font-mono">META</span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono break-words">Google Sheets write account: {googleWorkspaceAuthState.connected ? "Connected account unavailable" : "Not connected"}</div>
                </div>

                <div className="rounded-xl border border-slate-150 bg-white p-2.5 text-[10px] space-y-1.5" id="workspace-url-indicator">
                  <span className="text-[8.5px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Workspace Connection Link</span>
                  {workspaceUrl ? (
                    <div className="flex items-center gap-1.5 text-blue-700 font-semibold min-w-0">
                      <Link size={11} className="shrink-0" />
                      <span className="min-w-0 truncate max-w-full" title={workspaceUrl}>{workspaceUrl}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                      <AlertCircle size={11} className="shrink-0 animate-pulse" />
                      <span>No Workspace Link Configured</span>
                    </div>
                  )}

                  {workspaceUrl && (
                    <div className="pt-1.5 border-t border-slate-150/60 space-y-1.5">
                      <button
                        type="button"
                        disabled={isTestingConnection}
                        onClick={() => handleTestConnection(workspaceUrl)}
                        className={`w-full py-1 px-2 rounded-lg text-[8.5px] font-bold font-mono uppercase tracking-wider text-center cursor-pointer transition-all flex items-center justify-center gap-1 border ${
                          isTestingConnection
                            ? 'bg-slate-100 border-slate-200 text-slate-450'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-250'
                        }`}
                        id="sidebar-test-connection-btn"
                      >
                        <RefreshCw size={9} className={`${isTestingConnection ? "animate-spin text-blue-500" : "text-blue-600"}`} />
                        <span>{isTestingConnection ? "Checking Access..." : "Test Connection"}</span>
                      </button>

                      {connectionTestResult && (
                        <div className={`p-1.5 rounded-lg text-[8.5px] leading-relaxed border animate-fade-in ${
                          connectionTestResult.success
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium text-left'
                            : 'bg-amber-50/70 border-amber-200 text-amber-955 font-medium text-left'
                        }`} id="sidebar-connection-test-result">
                          <p className="font-extrabold text-[8px] uppercase tracking-wider font-mono mb-0.5 flex items-center gap-1 leading-none">
                            {connectionTestResult.success ? (
                              <>
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
                                <span className="text-emerald-700">Verified</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block"></span>
                                <span className="text-amber-700">Status Alert</span>
                              </>
                            )}
                          </p>
                          <span className="font-sans block text-left leading-normal text-slate-650 break-words">{connectionTestResult.message}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setTempUrl(workspaceUrl);
                      setTempGeminiKey(geminiApiKey);
                      setShowUrlModal(true);
                    }}
                    className="text-[9px] font-extrabold text-slate-500 hover:text-blue-600 flex items-center gap-1 pt-1.5 hover:underline transition-all cursor-pointer border-t border-slate-150/60 w-full text-left"
                  >
                    {workspaceUrl ? "Modify Connection Link" : "Configure Connection Link"}
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-100/60 pt-2 pb-0.5 font-sans font-medium">
                  <div>Deployment Version: 1.0.4</div>
                  <div>Status: Sys OK</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile menu Back Drop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/35 z-35 md:hidden"
        />
      )}

      {/* Main Content Workspace viewport */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full space-y-6 overflow-x-hidden" id="viewport-workspace">
        <div className="mx-auto w-full max-w-[1440px] space-y-6">

        {/* Dynamic Route Switch Panel */}
        {activeTab === "overview" && (
          renderDashboardWorkspace("overview")
        )}

        {activeTab === "role-cards" && (
          renderDashboardWorkspace("role-cards")
        )}

        {activeTab === "settings" && (
          renderDashboardWorkspace("settings")
        )}

        {activeTab === "dashboard-data-source" && (
          renderDashboardWorkspace("data-source")
        )}

        {activeTab === "school-setup" && (
          renderDashboardWorkspace("setup")
        )}

        {activeTab === "setup-registries" && (
          renderDashboardWorkspace("setup-registries")
        )}

        {activeTab === "admin-registry-detail" && (
          renderDashboardWorkspace("registry-detail")
        )}

        {(activeTab === "registries" || activeTab === "registers") && !selectedRegistryId && (
          <RegistryExplorerPage
            currentRole={currentRole}
            onOpenPageRoute={openRegistryPage}
            onOpenDataRoute={openRegistryDataRoute}
            onNavigateTab={setActiveTab}
            liveRegisterCards={liveRegisterCards}
          />
        )}

        {activeTab === "registries" && selectedRegistryId && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={() => setSelectedRegistryId(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft size={12} /> Back to Registries
              </button>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
                  Universal Registry Route
                </div>
                <h2 className="text-sm font-extrabold text-slate-900 truncate">
                  {getRegistryExplorerRow(selectedRegistryId)?.displayName || selectedRegistryId}
                </h2>
                <p className="text-[11px] text-slate-500">
                  /registries/{selectedRegistryId}
                </p>
              </div>
            </div>
            {renderRegistryDataSurface(selectedRegistryId)}
          </div>
        )}

        {activeTab === "search" && (
          <UniversalSearch
            files={files}
            onToggleFavorite={handleToggleFavorite}
            onUpdateTags={handleUpdateTags}
            currentUser={currentUser}
            currentRole={currentRole}
            onRefreshData={fetchAllData}
          />
        )}

        {activeTab === "classroom" && (
          <ClassroomManager
            courses={courses}
            assignments={assignments}
            students={students}
            teachers={teachers}
            onOpenStudents={() => setActiveTab("students")}
          />
        )}

        {activeTab === "students" && (
          <StudentsRegistryPage
            students={students}
            currentRole={currentRole}
          />
        )}

        {activeTab === "teachers" && (
          <TeachersRegistryPage
            staffRows={schoolRegistry?.staffDirectory || []}
            teacherAllocations={schoolRegistry?.teacherAllocations || []}
            currentRole={currentRole}
          />
        )}

        {activeTab === "staff" && (
          <StaffRegistryPage
            staffRows={schoolRegistry?.staffDirectory || []}
            currentRole={currentRole}
          />
        )}

        {activeTab === "courses" && (
          <ClassroomCoursesRegistryPage
            courses={courses}
            currentRole={currentRole}
          />
        )}

        {activeTab === "assignments" && (
          <ClassroomAssignmentsRegistryPage
            assignments={assignments}
            currentRole={currentRole}
          />
        )}

        {activeTab === "tasks" && (
          <TaskProductivity
            tasks={tasks}
            files={files}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            currentUser={currentUser}
            currentRole={currentRole}
          />
        )}

        {activeTab === "ai-assistant" && (
          <AIAssistants
            automations={automations}
            onToggleAutomation={handleToggleAutomation}
            onAddAutomation={handleAddAutomation}
            currentUser={currentUser}
            currentRole={currentRole}
            files={files}
            activeCapabilities={activeCapabilities}
          />
        )}

        {activeTab === "rollover" && (
          <AcademicRollover
            rolloverConfig={rolloverConfig}
            onTriggerRollover={handleTriggerRollover}
            currentUser={currentUser}
            currentRole={currentRole}
          />
        )}

        {activeTab === "governance" && (
          <SystemGovernance
            auditLogs={auditLogs}
            currentUser={currentUser}
            currentRole={currentRole}
            onSwitchRole={handleSwitchRole}
            schema={schema}
            schemaDrivenRendering={schemaDrivenRendering}
            onToggleSchemaDriven={(val) => {
              setSchemaDrivenRendering(val);
              try {
                localStorage.setItem("schooly_schema_driven_rendering", val ? "true" : "false");
              } catch (e) {
                console.warn("[PERSISTENCE] Blocked writing renderer flag:", e);
              }
            }}
            onUpdateSchema={(newSchema) => {
              setSchema(newSchema);
              saveActiveMetadata(newSchema);
            }}
            activeRoles={activeRoles}
            onChangeActiveRoles={(roles) => {
              setActiveRoles(roles);
              // Set the single role preview text to match primary if needed
              if (roles.length > 0 && !roles.includes(currentRole)) {
                setCurrentRole(roles[0]);
              }
            }}
          />
        )}

        {activeTab === "mock_studio" && (
          <MockDataStudio />
        )}

        {activeTab === "lesson-plans" && (
          <LessonPlanner
            files={files}
            courses={courses}
            currentUser={currentUser}
            currentRole={currentRole}
            onRefreshData={fetchAllData}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "resources" && (
          <AcademicResourceLibraryPage
            files={files}
            currentRole={currentRole}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "textbooks" && (
          <TextbookIngestor
            files={files}
            courses={courses}
            currentUser={currentUser}
            currentRole={currentRole}
            isWorkspaceMock={isWorkspaceMock}
            onRefreshData={fetchAllData}
            setActiveTab={setActiveTab}
          />
        )}

        </div>
      </main>

      {/* Globally absolute Document Preview Slideover / Modal Overlay for easy quick actions */}
      {selectedFile && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40" id="global-preview-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-200 relative space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">

            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-md cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm max-w-xs truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono block uppercase">
                  {selectedFile.source} Repository Document
                </span>
              </div>
            </div>

            {/* Quick Content summary */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold font-mono uppercase block">Direct Abstract Outline</span>
              <p className="text-xs text-slate-600 leading-relaxed font-sans bg-slate-50 p-4 rounded-xl border border-slate-100 italic select-text">
                "{selectedFile.contentSum}"
              </p>
            </div>

            {/* Detailed metadata */}
            <div className="grid grid-cols-2 gap-y-2 border-t border-slate-100 pt-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><User size={12} /> Owner</span>
              <span className="text-right font-bold text-slate-700 truncate">{selectedFile.owner}</span>

              <span className="flex items-center gap-1.5"><Clock size={12} /> Modified</span>
              <span className="text-right font-bold text-slate-700">{new Date(selectedFile.modifiedAt).toLocaleString()}</span>

              <span className="flex items-center gap-1.5"><FolderOpen size={12} /> Path</span>
              <span className="text-right font-bold text-slate-700 truncate">{selectedFile.path}</span>
            </div>

            {/* Action controls */}
            <div className="pt-4 border-t border-slate-150 flex gap-2">
              <button
                onClick={() => {
                  handleToggleFavorite(selectedFile.id);
                  // update visual copy
                  selectedFile.isFavorite = !selectedFile.isFavorite;
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  selectedFile.isFavorite
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Star size={12} className={selectedFile.isFavorite ? "fill-amber-500 text-amber-500" : ""} />
                {selectedFile.isFavorite ? "Favorite File" : "Mark Favorite"}
              </button>

              <button
                onClick={() => {
                  setSelectedFile(null);
                  setActiveTab("search");
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Open in Search Q&A <ExternalLink size={12} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Google Workspace URL Setup Overlay Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40" id="workspace-url-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 relative space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl mt-0.5 shrink-0">
                <Database size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Google Workspace Connection Link
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">
                  Provide a valid Google Drive Folder, Shared Folder, or Domain Root URL to establish synchronous indexing coordinates. Copilot planners require Workspace mapping indexes to compile curriculums.
                </p>
                <div className="mt-3 bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2 text-xs font-sans">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Database size={13} />
                    <span>Workspace link only</span>
                  </div>
                  <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                    Schooly uses the configured Workspace URL for connection checks. Google Sheets write access is managed separately in the onboarding wizard.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5 font-bold uppercase tracking-wider">
                  ENTER DRIVE OR WORKSPACE DIRECTORY URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 font-sans"
                    id="setup-workspace-url-input"
                  />
                </div>
              </div>

              {/* Quick Preset helper button */}
              <button
                type="button"
                onClick={() => setTempUrl("https://drive.google.com/drive/folders/1D_e735SchoolyDriveRootFolder_AP_Syllabus")}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all block text-left"
              >
                Insert Demo Folder Coordinate Link
              </button>

              <div className="pt-3 border-t border-slate-100">
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5 font-bold uppercase tracking-wider">
                  GEMINI API KEY (OPTIONAL)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKeyText ? "text" : "password"}
                    placeholder="AI Studio Developer Key (AI_...)"
                    value={tempGeminiKey}
                    onChange={(e) => setTempGeminiKey(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 font-mono"
                    id="setup-gemini-key-input"
                  />
                  <span className="absolute left-3 text-slate-400">
                    <Key size={14} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showKeyText ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-450 mt-1.5 font-sans leading-relaxed">
                  Provide your own API Key to run requests using your personal developer quota if the global backend key is unconfigured.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[9.5px] text-slate-450 mt-1.5 font-sans leading-relaxed">
                  Google Sheets write access is managed in the School Setup Onboarding Wizard and stays separate from the Workspace URL.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-150 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  console.log("[DEBUG] Workspace URL Modal skipped/cancelled. Setting default/fallback URL.");
                  setShowUrlModal(false);
                  if (!workspaceUrl) {
                    setWorkspaceUrl("https://drive.google.com/drive/folders/1D_e735SchoolyDriveRootFolder_AP_Syllabus");
                  }
                }}
                className="flex-1 py-2 px-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Skip / Setup Later
              </button>

              <button
                type="button"
                onClick={() => {
                  if (tempUrl.trim()) {
                    try {
                      localStorage.setItem("schooly_workspace_url", tempUrl.trim());
                      localStorage.setItem("schooly_workspace_connected", "true");
                      if (tempGeminiKey.trim()) {
                        localStorage.setItem("schooly_gemini_api_key", tempGeminiKey.trim());
                      } else {
                        localStorage.removeItem("schooly_gemini_api_key");
                      }
                      console.log("[DEBUG] Persisted new workspace URL and key parameters in localStorage.");
                    } catch (e) {
                      console.warn("[DEBUG] LocalStorage writing blocked by sandbox restrictions. Fallback to session state.", e);
                    }
                    setWorkspaceUrl(tempUrl.trim());
                    setGeminiApiKey(tempGeminiKey.trim());
                    setShowUrlModal(false);
                    fetch("/api/audit-logs", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user: currentUser,
                        role: currentRole,
                        action: "Workspace Connector Linked",
                        detail: `Workspace mapped to: ${tempUrl.trim()}${tempGeminiKey.trim() ? " (with dynamic developer key override)" : ""}`,
                        category: "auth",
                        success: true
                      })
                    }).then(() => {
                      console.log("[DEBUG] Audit log for workspace link post resolved. Refreshing datasets...");
                      fetchAllData();
                    });
                  }
                }}
                disabled={!tempUrl.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                Associate Workspace Coordinates
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
