import React, { useState, useEffect } from "react";
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
  CheckSquare, 
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
  Database,
  Eye,
  EyeOff,
  Key,
  AlertTriangle,
  BookOpen
} from "lucide-react";
import { 
  loadActiveMetadata, 
  compileDynamicNavigation, 
  saveActiveMetadata, 
  ExportableSchoolySchema 
} from "./lib/schemaEngine";
import { loadConnectionConfig, FALLBACK_ALERT_MESSAGES, validateSourceLink } from "./lib/dataSourceEngine";
import { initAuth, googleSignIn, getAccessToken, logout as firebaseLogout } from "./lib/firebaseAuth";
import { User as FirebaseUser } from "firebase/auth";

const IconMap: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  Command,
  Search,
  GraduationCap,
  CheckSquare,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  Database,
  BookOpen
};

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
    // Group into Daily Work (My Workspace + Teaching & Learning) & School Management (School Operations + Leadership & Governance)
    const dailyItems: typeof items = [];
    const managementItems: typeof items = [];
    const otherGroups: Record<string, typeof items> = {};

    items.forEach(item => {
      if (item.parentGroup === "My Workspace" || item.parentGroup === "Teaching & Learning") {
        dailyItems.push(item);
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
    if (dailyItems.length > 0) {
      groups.push({ label: "Daily Work", items: dailyItems });
    }
    if (managementItems.length > 0) {
      groups.push({ label: "School Management", items: managementItems });
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
    const dailyItems: typeof items = [];
    const managementItems: typeof items = [];

    items.forEach(item => {
      if (item.parentGroup === "My Workspace" || item.parentGroup === "Teaching & Learning") {
        dailyItems.push(item);
      } else if (item.parentGroup === "School Operations" || item.parentGroup === "Leadership & Governance") {
        managementItems.push(item);
      }
    });

    const countMyWorkspace = (groupMap["My Workspace"] || []).length;
    const countTeachingLearning = (groupMap["Teaching & Learning"] || []).length;
    const countSchoolOperations = (groupMap["School Operations"] || []).length;
    const countLeadershipGovernance = (groupMap["Leadership & Governance"] || []).length;

    const shouldMergeDaily = (countMyWorkspace > 0 && countTeachingLearning > 0) &&
                             (countMyWorkspace === 1 || countTeachingLearning === 1);

    const shouldMergeManagement = (countSchoolOperations > 0 && countLeadershipGovernance > 0) ||
                                  (countSchoolOperations === 1 || countLeadershipGovernance === 1);

    const groups: SidebarGroup[] = [];
    if (shouldMergeDaily) {
      if (dailyItems.length > 0) {
        groups.push({ label: "Daily Work", items: dailyItems });
      }
    } else {
      if (countMyWorkspace > 0) {
        groups.push({ label: "My Workspace", items: groupMap["My Workspace"] });
      }
      if (countTeachingLearning > 0) {
        groups.push({ label: "Teaching & Learning", items: groupMap["Teaching & Learning"] });
      }
    }

    if (shouldMergeManagement) {
      if (managementItems.length > 0) {
        groups.push({ label: "School Management", items: managementItems });
      }
    } else {
      if (countSchoolOperations > 0) {
        groups.push({ label: "School Operations", items: groupMap["School Operations"] });
      }
      if (countLeadershipGovernance > 0) {
        groups.push({ label: "Leadership & Governance", items: groupMap["Leadership & Governance"] });
      }
    }

    // Post-pass check: If any group has only 1 item, make its label null to render flat
    const processedResult: SidebarGroup[] = [];
    groups.forEach(g => {
      if (g.items.length === 1) {
        processedResult.push({ label: null, items: g.items });
      } else {
        processedResult.push(g);
      }
    });

    // Consolidate contiguous flat groups (label: null)
    const finalResult: SidebarGroup[] = [];
    let flatAccumulator: typeof items = [];
    processedResult.forEach(g => {
      if (g.label === null) {
        flatAccumulator.push(...g.items);
      } else {
        if (flatAccumulator.length > 0) {
          finalResult.push({ label: null, items: flatAccumulator });
          flatAccumulator = [];
        }
        finalResult.push(g);
      }
    });
    if (flatAccumulator.length > 0) {
      finalResult.push({ label: null, items: flatAccumulator });
    }

    return finalResult;
  }

  // Case C: Normal larger menu with no sparse groups of size 1
  const normalResult: SidebarGroup[] = [];
  if ((groupMap["My Workspace"] || []).length > 0) {
    normalResult.push({ label: "My Workspace", items: groupMap["My Workspace"] });
  }
  if ((groupMap["Teaching & Learning"] || []).length > 0) {
    normalResult.push({ label: "Teaching & Learning", items: groupMap["Teaching & Learning"] });
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
      "use AI Co-Pilot"
    ];
  }
  if (isCoordinator) {
    return [
      "review school dashboards",
      "manage department curricula",
      "track tasks and assignments",
      "oversee Classroom sync",
      "use AI Co-Pilot"
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

export default function App() {
  // Mobile UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview");

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
  const [currentUser, setCurrentUser] = useState("torres.admin@school.org");
  const [currentRole, setCurrentRole] = useState("Principal");

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

  // Concurrent Multi-Roles selection states to enable combined governance capabilities
  const [activeRoles, setActiveRoles] = useState<string[]>(["Principal"]);

  useEffect(() => {
    // Keep active roles in sync with single role switcher persona
    setActiveRoles([currentRole]);
  }, [currentRole]);

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

  // Protect route views in real-time when roles or configurations shift
  useEffect(() => {
    // Avoid running before navigation items compile
    const activeNavIds = getNavigationItems().map(item => item.id);
    if (activeNavIds.length > 0 && !activeNavIds.includes(activeTab)) {
      console.log(`[ROUTE SECURITY] Active tab "${activeTab}" is not permitted for current capabilities. Redirecting to "${activeNavIds[0]}"`);
      setActiveTab(activeNavIds[0]);
    }
  }, [activeRoles, schemaDrivenRendering, schema]);

  // Google Workspace Core URL state configuration with localStorage caching
  const [workspaceUrl, setWorkspaceUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("schooly_workspace_url");
      console.log("[DEBUG] Read local storage workspace URL:", stored);
      return stored || "https://drive.google.com/drive/folders/1D_e735SchoolyDriveRootFolder_AP_Syllabus";
    } catch (e) {
      console.warn("[DEBUG] LocalStorage read blocked by iframe sandbox restriction. Defaulting to demo coordinates.", e);
      return "https://drive.google.com/drive/folders/1D_e735SchoolyDriveRootFolder_AP_Syllabus";
    }
  });
  const [showUrlModal, setShowUrlModal] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("schooly_workspace_url");
      return !stored;
    } catch (e) {
      console.warn("[DEBUG] LocalStorage read for showUrlModal failed. Suppressing auto-modal popup.", e);
      return false; // Safely default to false so they are not locked by a popup on mount if sandbox is restricted
    }
  });
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
  
  // Real Google SSO state controllers
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);

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
      const ssoConnected = localStorage.getItem("schooly_workspace_connected") === "true";
      if (ssoConnected) {
        const token = localStorage.getItem("google_access_token") || "";
        if (token) {
          authHeader = `Bearer ${token}`;
        }
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
  const isWorkspaceMock = !validateSourceLink(workspaceUrl, "google_workspace") || (() => {
    try {
      return localStorage.getItem("schooly_workspace_connected") !== "true";
    } catch {
      return true;
    }
  })();

  console.log(`[RENDER DIAGNOSTIC] App Component Render. Active Tab: ${activeTab} | Role: ${currentRole} | User: ${currentUser} | showUrlModal: ${showUrlModal} | workspaceUrl: ${workspaceUrl}`);

  // Intialize and handle active Google login profiles
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        console.log("[FIREBASE AUTH SUCCESS] Active Google Session detected.");
        setFirebaseUser(user);
        fetchAllData();
      },
      () => {
        console.log("[FIREBASE AUTH FALLBACK] No active Google session, using simulated fallback databases.");
        setFirebaseUser(null);
        fetchAllData();
      }
    );
    return () => unsubscribe();
  }, [workspaceUrl]);

  // Re-fetch all standard school assets when personas or operators pivot
  useEffect(() => {
    console.log(`[DEBUG] Persona Shift detected. User: ${currentUser} | Role: ${currentRole}`);
    fetchAllData();
  }, [currentUser, currentRole]);

  const fetchAllData = async () => {
    console.log("[DEBUG] fetchAllData() triggered. Sending batch GET requests to REST backend...");
    try {
      const token = await getAccessToken();
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
  const handleSwitchRole = (roleName: string, emailStr: string) => {
    console.log(`[DEBUG] handleSwitchRole called. Target Persona: ${roleName} | Email: ${emailStr}`);
    setCurrentRole(roleName);
    setCurrentUser(emailStr);

    if (roleName !== "School Admin" && activeTab === "governance") {
      console.log("[DEBUG] Target role is not Admin and active tab is governance. Redirecting overview tab.");
      setActiveTab("overview");
    }

    // Dispatch logging message through backend portal
    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: emailStr,
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
    const items = compiled.map(item => ({
      id: item.id,
      name: item.label,
      icon: IconMap[item.icon] || Command,
      parentGroup: item.parentGroup,
      helperText: item.helperText
    }));

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
          <div className="px-2 bg-slate-50/50 border border-slate-100 p-2 text-left rounded-2xl" id="sandbox-preview-bar">
            <label className="text-[9px] text-slate-400 font-mono font-bold block mb-1.5 uppercase tracking-wider">
              Preview Persona View
            </label>
            <select
              value={`${currentUser}|${currentRole}`}
              onChange={(e) => {
                const [email, role] = e.target.value.split("|");
                handleSwitchRole(role, email);
              }}
              className="w-full text-[11.5px] font-semibold bg-white border border-slate-200 text-slate-700 py-2 px-2 rounded-xl cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans shadow-2xs"
            >
              {schema.roles.map(r => (
                <option key={r.roleId} value={`${r.defaultEmail || `${r.roleId}@school.org`}|${r.roleName}`}>
                  {r.roleName}
                </option>
              ))}
            </select>

            {/* Micro indication when multiple roles are actively merged (Phase 2 capability group support) */}
            {activeRoles.length > 1 && (
              <div className="mt-2 text-[9.5px] text-blue-600 font-mono bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100 uppercase font-bold leading-normal">
                Merged Capabilities: {activeRoles.length} Active Roles
              </div>
            )}

            {/* What you can do - plain language permissions (Phase 19 compliance) */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2" id="plain-permissions-sidebar-panel">
              <button
                type="button"
                onClick={() => setShowCapabilities(!showCapabilities)}
                className="w-full flex items-center justify-between text-left text-[9px] text-slate-500 font-bold uppercase tracking-wider hover:text-slate-705 transition-colors cursor-pointer"
              >
                <span className="font-sans">What you can do</span>
                <span className="font-sans text-[9px]">{showCapabilities ? '▲' : '▼'}</span>
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

                  {/* Show raw capability chips behind "Advanced access details" toggle for authorized roles/capabilities */}
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
          </div>

          {/* Nav buttons list */}
          <nav className="space-y-4" id="nav-options">
            {schemaDrivenRendering ? (
              // Role-Aware Workspace Navigation Groups (Presentation-only dynamically filtered)
              resolveSidebarGroupsForDisplay(navigationItems, activeCapabilities, activeRoles).map((group, groupIdx) => {
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
                            <span className="font-semibold">{sanitizeStudentTerminology(item.name, currentRole === "Student")}</span>
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
                {navigationItems.map(item => {
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
                        <span className="font-semibold">{sanitizeStudentTerminology(item.name, currentRole === "Student")}</span>
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
        </div>

        {/* Sidebar Footer segment */}
        <div className="pt-4 border-t border-slate-150 space-y-3 font-mono">
          {/* Google SSO Status Integrator */}
          <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-2xl font-sans text-[11px] space-y-2">
            <div className="flex items-center justify-between text-[8px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
              <span>Google Account Connection</span>
              <span className={`w-2 h-2 rounded-full ${firebaseUser ? "bg-emerald-500" : "bg-amber-400"}`}></span>
            </div>
            {firebaseUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {firebaseUser.photoURL ? (
                    <img src={firebaseUser.photoURL} alt="Google Profile" className="w-6.5 h-6.5 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-6.5 h-6.5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                      {firebaseUser.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="truncate flex-1 font-sans">
                    <div className="font-bold text-slate-700 leading-tight truncate">{firebaseUser.displayName}</div>
                    <div className="text-[9.5px] text-slate-450 leading-none truncate">{firebaseUser.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await firebaseLogout();
                    setFirebaseUser(null);
                    localStorage.setItem("schooly_workspace_connected", "false");
                    fetchAllData();
                  }}
                  className="w-full py-1.5 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 rounded-xl text-[10px] font-bold font-sans transition-all text-center cursor-pointer"
                >
                  Sign Out of Google
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 font-sans">
                <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                  Connect your Google Account to synchronize live syllabus folders and classroom courses.
                </p>
                {popupBlocked && (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[10px] leading-normal text-amber-900 space-y-1.5 animate-fade-in" id="sidebar-popup-blocked-fallback">
                    <div className="flex items-center gap-1.5 font-bold text-amber-955">
                      <svg className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Popup Window Blocked</span>
                    </div>
                    <p className="font-semibold text-amber-800">
                      The browser's sandbox blocked sign-in in this integrated frame. Open the app in a standalone window, connect there successfully, and refresh here!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        window.open(window.location.href, "_blank");
                      }}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider font-mono transition-colors cursor-pointer text-center"
                    >
                      🚀 Open App in New Tab
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoggingIn(true);
                    setPopupBlocked(false);
                    try {
                      const res = await googleSignIn();
                      if (res) {
                        setFirebaseUser(res.user);
                        localStorage.setItem("schooly_workspace_connected", "true");
                        fetchAllData();
                      }
                    } catch (e: any) {
                      console.error("[GOOGLE LOGIN FAILURE]", e);
                      const errMsg = e?.message || "";
                      if (errMsg.includes("popup-blocked") || errMsg.includes("popup") || e?.code === "auth/popup-blocked") {
                        setPopupBlocked(true);
                      }
                    } finally {
                      setIsLoggingIn(false);
                    }
                  }}
                  disabled={isLoggingIn}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-650 shadow-xs"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{isLoggingIn ? "Connecting..." : "Sign in with Google"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Operator info with lower emphasis */}
          <div className="space-y-1 text-[11px] text-slate-450">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">Operator</span>
              <span className="text-[9px] text-slate-500 font-bold px-1.5 py-0.5 bg-slate-50 border border-slate-150 rounded-md font-mono uppercase shrink-0">
                {currentRole.split(' ')[0]}
              </span>
            </div>
            <div className="font-semibold text-slate-650 truncate text-[10.5px]" title={currentUser}>{currentUser}</div>
            <div className="text-[9px] text-slate-400 italic flex items-center gap-1">
              <span>Permission Level 4</span>
              {schemaDrivenRendering && (
                <span className="text-[8.5px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded-sm border border-blue-105 font-mono">META</span>
              )}
            </div>
          </div>

          {/* Workspace URL link status info */}
          <div className="text-[10px] space-y-1.5 bg-slate-50 border border-slate-150 p-2 rounded-2xl font-sans" id="workspace-url-indicator">
            <span className="text-[8.5px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Workspace Connection Link</span>
            {workspaceUrl ? (
              <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                <Link size={11} className="shrink-0" />
                <span className="truncate max-w-[170px]" title={workspaceUrl}>{workspaceUrl}</span>
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
                    <span className="font-sans block text-left leading-normal text-slate-650">{connectionTestResult.message}</span>
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
      </aside>

      {/* Mobile menu Back Drop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/35 z-35 md:hidden"
        />
      )}

      {/* Main Content Workspace viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 overflow-x-hidden" id="viewport-workspace">
        
        {/* Dynamic Route Switch Panel */}
        {activeTab === "overview" && (
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
            firebaseUser={firebaseUser}
            workspaceUrl={workspaceUrl}
            onConfigureWorkspace={() => {
              setTempUrl(workspaceUrl);
              setTempGeminiKey(geminiApiKey);
              setShowUrlModal(true);
            }}
          />
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
                
                {/* Embedded SSO Prompter inside modal */}
                <div className="mt-3 bg-blue-50/50 border border-blue-100 p-3 rounded-xl space-y-2 text-xs font-sans">
                  <div className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Database size={13} />
                    <span>Authorize Live API Queries</span>
                  </div>
                  <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                    You must sign in with Google to grant permission to query Google Drive & Classroom streams in real-time.
                  </p>
                  
                  {firebaseUser ? (
                    <div className="flex items-center justify-between bg-white border border-slate-150 p-2 rounded-lg font-sans">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="truncate font-bold text-slate-700">{firebaseUser.displayName}</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Authorized</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {popupBlocked && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[10.5px] leading-relaxed text-amber-900 space-y-2 animate-fade-in" id="modal-popup-blocked-fallback">
                          <div className="flex items-center gap-1.5 font-bold text-amber-955">
                            <svg className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Iframe Sandbox Popup Warning</span>
                          </div>
                          <p className="font-semibold text-amber-800">
                            The browser prevents opening oauth popups within an embedded iframe workspace. Please open this applet in a separate window, log in with Google, and your active session will instantly load here.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              window.open(window.location.href, "_blank");
                            }}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider font-mono transition-colors cursor-pointer text-center"
                          >
                            🚀 Open standalone workspace
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoggingIn(true);
                          setPopupBlocked(false);
                          try {
                            const res = await googleSignIn();
                            if (res) {
                              setFirebaseUser(res.user);
                              localStorage.setItem("schooly_workspace_connected", "true");
                              fetchAllData();
                            }
                          } catch (e: any) {
                            console.error("[OAUTH SETUP ERROR]", e);
                            const errMsg = e?.message || "";
                            if (errMsg.includes("popup-blocked") || errMsg.includes("popup") || e?.code === "auth/popup-blocked") {
                              setPopupBlocked(true);
                            }
                          } finally {
                            setIsLoggingIn(false);
                          }
                        }}
                        disabled={isLoggingIn}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10.5px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5 shrink-0">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        <span>{isLoggingIn ? "Connecting..." : "Enable real-time Google SSO"}</span>
                      </button>
                    </div>
                  )}
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
                💡 Insert Demo Folder Coordinate Link
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
                    // Log the action on server
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
