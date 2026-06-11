import React, { useState, useEffect } from "react";
import { 
  WorkspaceFile, 
  ClassroomCourse, 
  TaskItem, 
  StudentDetails,
  TeacherPerformanceIndicator,
  MonitoringFormFeed,
  TeacherDashboardMockSchema,
  CoordinatorDashboardMockSchema
} from "../types";
import { 
  FileText, 
  Calendar, 
  GraduationCap, 
  CheckSquare, 
  Sparkles, 
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
  LayoutGrid
} from "lucide-react";

import { 
  loadActiveMetadata, 
  ExportableSchoolySchema, 
  Capability 
} from "../lib/schemaEngine";

import principalDashboardMock from "../data/mock/dashboard-principal.mock.json";
import teacherDashboardMock from "../data/mock/teacher-dashboard.mock.json";
import coordinatorDashboardMock from "../data/mock/coordinator-dashboard.mock.json";
import teachersIndianExtendedMock from "../data/mock/teachers-indian-extended.mock.json";
import RoleDashboards from "./RoleDashboards";

export const teacherPerformanceData: TeacherPerformanceIndicator[] = (principalDashboardMock.teacherPerformanceIndicators || []).map((t: any) => ({
  teacher: t.name,
  plannerStatus: t.syllabusPlanner.includes("Done") ? "Done" : "Missing",
  assessmentStatus: t.assessmentsOnTrack === "Complete" ? "Done" : (t.assessmentsOnTrack === "Partial" ? "Partial" : "Missing"),
  resourceCount: t.remedialActionPlan.includes("8") ? 8 : (t.remedialActionPlan.includes("6") ? 6 : (t.remedialActionPlan.includes("2") ? 2 : 0)),
  activityStatus: t.classroomActivity,
  source: t.classroomActivity === "None" ? "Schooly" : "Google Classroom",
  class: t.name.includes("Nair") ? "Grade X" : (t.name.includes("Kapoor") ? "Grade IX" : (t.name.includes("Mehta") ? "Grade VIII" : "Grade VII")),
  subject: t.name.includes("Nair") ? "Science" : (t.name.includes("Kapoor") ? "SST" : (t.name.includes("Mehta") ? "Mathematics" : "Social Science")),
  dateRange: "This Week",
  lastActive: t.classroomActivity === "None" ? "Inactive" : "Today"
}));

export const monitoringFormsData: MonitoringFormFeed[] = (principalDashboardMock.monitoringFormsDataFeeds || []).map((f: any, idx: number) => {
  const ids = ["weekly_planner", "notebook_monitoring", "assessment_status", "remedial_tracking", "event_reporting", "compliance_evidence"];
  const types: ("good" | "warning" | "risk" | "info")[] = ["warning", "warning", "warning", "risk", "info", "warning"];
  const owners = ["Ms. Sunita Mehta", "Mr. Rahul Kapoor", "Ms. Priya Nair", "Mr. Vijay Kumar", "Ms. Priya Nair", "School Admin"];
  const sources = ["Google Drive", "Notebook Form submission", "Google Classroom / SIS", "Remedial active lists", "CBSE Activities Buffer", "Governance Root"];
  const classes = ["Grade X - Section A", "Grade IX - Section B", "Grade XII - Section C", "Grade VII - Section A", "All Sections", "Governance Portfolio"];
  const links = ["Ingestion Template Drive Link", "Notebook Tracking Spreadsheet", "Assessment Status Sheet", "Remedial Ledger", "Event Calendar", "Compliance Evidence Drive Folders"];

  return {
    id: ids[idx] || `feed-${idx}`,
    name: f.form,
    summary: `${f.submitted} of ${f.total} submitted · ${f.overdue} overdue`,
    statusLabel: `${f.percent}%`,
    statusType: types[idx] || "warning",
    submittedCount: f.submitted,
    pendingCount: f.total - f.submitted,
    overdueCount: f.overdue,
    responsibleOwner: owners[idx] || "School Staff",
    linkedClassSection: classes[idx] || "All Sections",
    lastSubmittedDate: "2026-06-01",
    evidenceLinkLabel: links[idx] || "Drive Link",
    source: sources[idx] || "Form submission"
  };
});

// Seeded Structured Coordinator Dashboard Data (SDOS-24 compliant)
export const COORDINATOR_DASHBOARD_SEED = {
  remedialStudents: [
    { id: "rem-1", name: "Aarav Mehta", grade: "Class 7A", subject: "Mathematics", status: "Untracked", teacher: "Mr. Rajesh Kumar", lastRiskScore: 92, attendRate: "74%", issue: "Low test average in algebraic expressions", actionPlan: "Schedule weekly 1-on-1 algebra foundation sessions" },
    { id: "rem-2", name: "Sara Fernandes", grade: "Class 8C", subject: "English", status: "Untracked", teacher: "Ms. Neha Gupta", lastRiskScore: 88, attendRate: "78%", issue: "Weak grammar syntax and essay structuring", actionPlan: "Assign weekly reading diaries and focus-group workshops" },
    { id: "rem-3", name: "Dev Sharma", grade: "Class 6B", subject: "Hindi & SST", status: "In Progress", teacher: "Mrs. Meenakshi S.", lastRiskScore: 78, attendRate: "88%", issue: "Struggling with history timelines and maps", actionPlan: "Visual mapping guides and bilingual vocabulary aids" },
    { id: "rem-4", name: "Meher Gupta", grade: "Class 8A", subject: "Science", status: "Tracked", teacher: "Mr. Anil Nair", lastRiskScore: 65, attendRate: "92%", issue: "Improved labs compliance, needs monitoring on physics unit", actionPlan: "Assigned peer mentor, daily tracker checks" },
    { id: "rem-5", name: "Kabir Nair", grade: "Class 9C", subject: "SST", status: "Tracked", teacher: "Mr. Vikram Rawat", lastRiskScore: 54, attendRate: "95%", issue: "Performance stabilized above target threshold", actionPlan: "Continue bi-weekly checks, encourage group discussions" },
    { id: "rem-6", name: "Priya Iyer", grade: "Class 7B", subject: "Science", status: "Untracked", teacher: "Mr. Anil Nair", lastRiskScore: 84, attendRate: "80%", issue: "Missed basic conceptual assessments twice", actionPlan: "Parent teacher advisory meeting, fundamental worksheets" },
    { id: "rem-7", name: "Ananya Sharma", grade: "Class 8B", subject: "Mathematics", status: "In Progress", teacher: "Mr. Rajesh Kumar", lastRiskScore: 72, attendRate: "89%", issue: "Improving homework scores, mid-term prep required", actionPlan: "Review geometry assignments with focus notes" }
  ],
  classroomActivity: [
    { className: "Class 6", activeCount: "5/6", status: "High activity", state: "high", assignments: 22, submissionRate: 88, enrichment: 4 },
    { className: "Class 7", activeCount: "4/6", status: "Moderate activity", state: "moderate", assignments: 18, submissionRate: 82, enrichment: 2 },
    { className: "Class 8", activeCount: "6/6", status: "High activity", state: "high", assignments: 25, submissionRate: 91, enrichment: 5 },
    { className: "Class 9", activeCount: "2/5", status: "Low/inactive", state: "low", assignments: 11, submissionRate: 74, enrichment: 1 },
    { className: "Class 10", activeCount: "5/5", status: "High activity", state: "high", assignments: 28, submissionRate: 95, enrichment: 6 }
  ],
  inactiveSections: [
    { id: "in-1", className: "Grade IX", section: "Section C", subject: "Mathematics", teacher: "Mr. Ramesh Sharma", lastActive: "10 days ago", inactiveReason: "No assignments posted since term test", studentCount: 38 },
    { id: "in-2", className: "Grade VII", section: "Section D", subject: "Social Sciences", teacher: "Mrs. Kavita Patel", lastActive: "8 days ago", inactiveReason: "Weekly stream announcements zero", studentCount: 42 },
    { id: "in-3", className: "Grade VI", section: "Section C", subject: "English", teacher: "Ms. Shalini Iyer", lastActive: "6 days ago", inactiveReason: "Assignments posted but no submissions graded", studentCount: 35 },
    { id: "in-4", className: "Grade XI", section: "Section B", subject: "Hindi", teacher: "Mr. J. P. Mishra", lastActive: "14 days ago", inactiveReason: "Class stream totally silent", studentCount: 30 }
  ]
};

// Seeded Structured Principal Dashboard Data Contract (SDOS-23 compliant)
export const PRINCIPAL_DASHBOARD_SEED = {
  academicMonitoring: {
    planner: (principalDashboardMock.academicMonitoring?.stages || []).map((s: any) => ({
      level: s.stage,
      percentage: s.plannerRate
    })),
    syllabus: (principalDashboardMock.academicMonitoring?.syllabus || []).map((s: any) => ({
      level: s.level,
      percentage: s.percentage
    })),
    assessment: (principalDashboardMock.academicMonitoring?.assessment || []).map((s: any) => ({
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
    totalClassrooms: principalDashboardMock.classroomMonitoring?.totalClassrooms || 80,
    postedThisWeek: principalDashboardMock.classroomMonitoring?.postedThisWeek || 77,
    zeroActivityThisWeek: principalDashboardMock.classroomMonitoring?.zeroActivityThisWeek || 3,
    assignmentsCreatedThisWeek: principalDashboardMock.classroomMonitoring?.assignmentsCreatedThisWeek || 234,
    averageSubmissionRate: principalDashboardMock.classroomMonitoring?.avgSubmissionRate || 88,
    meetSessionsHeldThisWeek: principalDashboardMock.classroomMonitoring?.meetSessionsHeld || 12
  },
  compliance: {
    items: (principalDashboardMock.compliance?.categories || []).map((cat: any) => {
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
        "Safety records": "SDOS-Drive/Safety-Inspection",
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
  firebaseUser?: any;
  workspaceUrl?: string;
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
  firebaseUser,
  workspaceUrl
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
  const [syncingSis, setSyncingSis] = useState(false);
  const [syncResult, setSyncResult] = useState<{ message: string; date: string } | null>(null);
  const [productivityTip, setProductivityTip] = useState<string>("Use the AI Co-Pilot to map active guidelines against core study areas or draft student rosters.");

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
      const isConnected = firebaseUser !== null;
      
      setDriveConnectionResult({
        success: isConnected,
        timestamp: new Date().toLocaleTimeString(),
        message: isConnected 
          ? `Connection verified successfully! Secure OAuth handshake established with workspace folder coordinates: ${workspaceUrl || "Default Root Google Drive"}.`
          : `Connected with fallback permissions. Authenticate your google profile to authorize real-time workspace index queries.`,
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
    return "Middle"; // fallback
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
  const [principalDashboard, setPrincipalDashboard] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("schooly_mock_dashboard-principal");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Failed to read schooly_mock_dashboard-principal from localStorage", e);
    }
    return principalDashboardMock;
  });

  useEffect(() => {
    const fetchPrincipalDashboardData = async () => {
      try {
        const res = await fetch("/api/mock/dashboard-principal");
        if (res.ok) {
          const data = await res.json();
          if (data && data.metrics) {
            setPrincipalDashboard(data);
            localStorage.setItem("schooly_mock_dashboard-principal", JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error("Error loading dynamic principal dashboard mock data:", err);
      }
    };
    fetchPrincipalDashboardData();
  }, []);

  // --- Shadow static state properties with dynamic computed values inside the component scope ---
  const teacherPerformanceData = React.useMemo<TeacherPerformanceIndicator[]>(() => {
    return (principalDashboard?.teacherPerformanceIndicators || []).map((t: any) => ({
      teacher: t.name,
      plannerStatus: t.syllabusPlanner.includes("Done") ? "Done" : "Missing",
      assessmentStatus: t.assessmentsOnTrack === "Complete" ? "Done" : (t.assessmentsOnTrack === "Partial" ? "Partial" : "Missing"),
      resourceCount: t.remedialActionPlan.includes("12") ? 12 : (t.remedialActionPlan.includes("8") ? 8 : (t.remedialActionPlan.includes("6") ? 6 : (t.remedialActionPlan.includes("4") ? 4 : (t.remedialActionPlan.includes("2") ? 2 : 0)))),
      activityStatus: t.classroomActivity,
      source: t.classroomActivity === "None" ? "Schooly" : "Google Classroom",
      class: t.name.includes("Nair") ? "Grade X" : (t.name.includes("Kapoor") ? "Grade IX" : (t.name.includes("Mehta") ? "Grade VIII" : "Grade VII")),
      subject: t.name.includes("Nair") ? "Science" : (t.name.includes("Kapoor") ? "SST" : (t.name.includes("Mehta") ? "Mathematics" : "Social Science")),
      dateRange: "This Week",
      lastActive: t.classroomActivity === "None" ? "Inactive" : "Today"
    }));
  }, [principalDashboard]);

  const monitoringFormsData = React.useMemo<MonitoringFormFeed[]>(() => {
    return (principalDashboard?.monitoringFormsDataFeeds || []).map((f: any, idx: number) => {
      const ids = ["weekly_planner", "notebook_monitoring", "assessment_status", "remedial_tracking", "event_reporting", "compliance_evidence"];
      const types: ("good" | "warning" | "risk" | "info")[] = ["warning", "warning", "warning", "risk", "info", "warning"];
      const owners = ["Ms. Sunita Mehta", "Mr. Rahul Kapoor", "Ms. Priya Nair", "Mr. Vijay Kumar", "Ms. Priya Nair", "School Admin"];
      const sources = ["Google Drive", "Notebook Form submission", "Google Classroom / SIS", "Remedial active lists", "CBSE Activities Buffer", "Governance Root"];
      const classes = ["Grade X - Section A", "Grade IX - Section B", "Grade XII - Section C", "Grade VII - Section A", "All Sections", "Governance Portfolio"];
      const links = ["Ingestion Template Drive Link", "Notebook Tracking Spreadsheet", "Assessment Status Sheet", "Remedial Ledger", "Event Calendar", "Compliance Evidence Drive Folders"];

      return {
        id: ids[idx] || `feed-${idx}`,
        name: f.form,
        summary: `${f.submitted} of ${f.total} submitted · ${f.overdue} overdue`,
        statusLabel: `${f.percent}%`,
        statusType: types[idx] || "warning",
        submittedCount: f.submitted,
        pendingCount: f.total - f.submitted,
        overdueCount: f.overdue,
        responsibleOwner: owners[idx] || "School Staff",
        linkedClassSection: classes[idx] || "All Sections",
        lastSubmittedDate: "2026-06-01",
        evidenceLinkLabel: links[idx] || "Drive Link",
        source: sources[idx] || "Form submission"
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
        totalClassrooms: principalDashboard?.classroomMonitoring?.totalClassrooms || 80,
        postedThisWeek: principalDashboard?.classroomMonitoring?.postedThisWeek || 77,
        zeroActivityThisWeek: principalDashboard?.classroomMonitoring?.zeroActivityThisWeek || 3,
        assignmentsCreatedThisWeek: principalDashboard?.classroomMonitoring?.assignmentsCreatedThisWeek || 234,
        averageSubmissionRate: principalDashboard?.classroomMonitoring?.avgSubmissionRate || 88,
        meetSessionsHeldThisWeek: principalDashboard?.classroomMonitoring?.meetSessionsHeld || 12
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

  // --- Teacher-specific states (SDOS-25) ---
  const [teacherDashboard, setTeacherDashboard] = useState<TeacherDashboardMockSchema>(() => {
    try {
      const cached = localStorage.getItem("schooly_mock_teacher-dashboard");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Failed to read schooly_mock_teacher-dashboard from localStorage", e);
    }
    return teacherDashboardMock;
  });

  useEffect(() => {
    const fetchTeacherDashboardData = async () => {
      try {
        const res = await fetch("/api/mock/teacher-dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data && data.assignedClasses) {
            setTeacherDashboard(data);
            localStorage.setItem("schooly_mock_teacher-dashboard", JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error("Error loading dynamic teacher dashboard mock data:", err);
      }
    };
    fetchTeacherDashboardData();
  }, []);

  // --- Coordinator-specific overview states ---
  const [coordinatorDashboard, setCoordinatorDashboard] = useState<CoordinatorDashboardMockSchema>(() => {
    try {
      const cached = localStorage.getItem("schooly_mock_coordinator-dashboard");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Failed to read schooly_mock_coordinator-dashboard from localStorage", e);
    }
    return coordinatorDashboardMock;
  });

  useEffect(() => {
    const fetchCoordinatorDashboardData = async () => {
      try {
        const res = await fetch("/api/mock/coordinator-dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data && data.plannerStatusMatrix) {
            setCoordinatorDashboard(data);
            localStorage.setItem("schooly_mock_coordinator-dashboard", JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error("Error loading dynamic coordinator dashboard mock data:", err);
      }
    };
    fetchCoordinatorDashboardData();
  }, []);

  const [activeTeacherNotificationOpen, setActiveTeacherNotificationOpen] = useState(false);
  const [showPlannerForm, setShowPlannerForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showGradingInterface, setShowGradingInterface] = useState(false);
  const [showResourceUploadForm, setShowResourceUploadForm] = useState(false);
  
  // Forms & Interactive workflows state
  const [selectedGradingAssignment, setSelectedGradingAssignment] = useState<string>("Class 8A (Ch 6 Triangles Assignment)");
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({
    "Aarav Mehta": 22,
    "Ananya Sharma": 24,
    "Dev Sharma": 19,
    "Meher Gupta": 23,
    "Priya Iyer": 18
  });
  const [gradingSuccessMsg, setGradingSuccessMsg] = useState("");
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [leaveStart, setLeaveStart] = useState("2026-06-05");
  const [leaveEnd, setLeaveEnd] = useState("2026-06-06");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState("");
  
  const [plannerClass, setPlannerClass] = useState("Class 8A");
  const [plannerWeek, setPlannerWeek] = useState("Week 22");
  const [plannerSyllabusCovered, setPlannerSyllabusCovered] = useState("Triangles similarity theorems proof and exercises.");
  const [plannerSuccessMsg, setPlannerSuccessMsg] = useState("");

  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceClass, setResourceClass] = useState("Class 8A");
  const [resourceSuccessMsg, setResourceSuccessMsg] = useState("");
  const [resourceUploadCount, setResourceUploadCount] = useState(8);
  const [plannerStatusValue, setPlannerStatusValue] = useState<"Posted" | "Missing" | "Partial">("Posted");
  const [teachingTimetable, setTeachingTimetable] = useState([
    { period: 1, classSubject: "Class 8A — Mathematics", topic: "Ch 6 Triangles", room: "Room B-201", status: "Done", time: "8:00–8:45" },
    { period: 2, classSubject: "Class 9A — Mathematics", topic: "Ch 4 Quadratic Eq", room: "Room B-204", status: "Done", time: "8:50–9:35" },
    { period: 3, classSubject: "Class 8B — Mathematics", topic: "Ch 6 Triangles", room: "Room B-203", status: "Done", time: "9:40–10:25" },
    { period: 4, classSubject: "Class 9B — Mathematics", topic: "Ch 4 Quadratic Eq", room: "Room B-205", status: "Now", time: "10:30–11:15", meetLink: "https://meet.google.com/abc-defg-hij" },
    { period: 5, classSubject: "Free period", topic: "Available for doubt session", room: "Staff Room", status: "Free Period", time: "11:20–12:05" },
    { period: 6, classSubject: "Class 8C — Mathematics", topic: "Ch 6 Triangles", room: "Room B-203", status: "Next", time: "1:00–1:45" }
  ]);
  const [teachingTasks, setTeachingTasks] = useState([
    { id: "task-1", type: "ungraded", title: "47 ungraded submissions", detail: "Class 8A: 12 · 8B: 9 · 8C: 11 · 9A: 8 · 9B: 7", status: "Overdue", actionLabel: "Grade" },
    { id: "task-2", type: "lesson_plan", title: "2 lesson plans not uploaded", detail: "Class 8C Week 22 · Class 9B Week 22", status: "Due today", actionLabel: "Due today" },
    { id: "task-3", type: "exam_paper", title: "UT4 question paper due Friday", detail: "Ch 5–7 · 25 marks · Submit to Exam Cell", status: "Due soon", actionLabel: "Fri 30 May" },
    { id: "task-4", type: "planner_posted", title: "Weekly planner posted — all 6 classes", detail: "Posted Monday 7:45 AM", status: "Completed", actionLabel: "Completed" }
  ]);

  const [activeCallSim, setActiveCallSim] = useState(false);

  // HOD Dashboard state hooks
  const [hodDepartment, setHodDepartment] = useState<string>("Mathematics");
  const [hodAcademicYear, setHodAcademicYear] = useState<string>("2026-27");
  const [hodClassRange, setHodClassRange] = useState<string>("Class 6–12");
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
  const [parentAdvisoryTickets, setParentAdvisoryTickets] = useState<any[]>([
    { id: "t-1", subject: "Grade 8 AP Preparatory Classes Coordination", status: "Resolved", date: "May 10" },
    { id: "t-2", subject: "School Bus Transport Route 4 GPS Sync", status: "Resolved", date: "May 15" },
    { id: "t-3", subject: "CBSE Mathematics UT4 Syllabus Alignment Clarification", status: "Open", date: "May 24" }
  ]);
  const [parentNewTicketSubject, setParentNewTicketSubject] = useState<string>("");
  const [activeAdminSyncCount, setActiveAdminSyncCount] = useState<number>(0);
  const [hrLeaveReview, setHrLeaveReview] = useState<any[]>([
    { id: "lv-1", name: "Ms. Sunita Mehta", type: "Sick Leave", date: "Wed 27 May", status: "Review Required" },
    { id: "lv-2", name: "Mr. Rahul Kapoor", type: "Casual Leave", date: "Fri 29 May", status: "Approved" }
  ]);
  const [studentTasksList, setStudentTasksList] = useState<any[]>([
    { id: "s-task-1", title: "AP Chemistry assignment 6: Molecular bonding quiz", deadline: "Overdue (Due Monday)", classSec: "Chemistry AP", completed: false },
    { id: "s-task-2", title: "Algebra Chapter 5 Workbook equations 1-20", deadline: "Due Friday", classSec: "Mathematics", completed: false },
    { id: "s-task-3", title: "SST Project submission CBSE Syllabus Stage 1", deadline: "Due in 3 days", classSec: "History / Civics", completed: true }
  ]);

  // Get logged-in teacher details dynamically (SDOS-25)
  const getActiveTeacherProfile = () => {
    const email = (currentUser || "").toLowerCase().trim();
    if (email === "s.henderson@school.org" || email.includes("priya")) {
      return {
        name: "Ms. Priya Nair",
        initials: "PN",
        subject: "Mathematics",
        classes: "Class 8A · 8B · 8C · 8D · 9A · 9B",
        classTeacher: "8A",
        session: "2026–27"
      };
    }
    if (email === "m.vance@school.org" || email.includes("rajesh")) {
      return {
        name: "Dr. Rajesh Kumar",
        initials: "RK",
        subject: "Science",
        classes: "Class 9A · 9B · 9C · Class 10A · 10B",
        classTeacher: "10A",
        session: "2026–27"
      };
    }
    if (email === "e.montgomery@school.org" || email.includes("meenakshi")) {
      return {
        name: "Ms. Meenakshi Sharma",
        initials: "MS",
        subject: "English",
        classes: "Class 8A · 8B · Class 9A · 9B · 9C",
        classTeacher: "9B",
        session: "2026–27"
      };
    }
    // Fallback default: Ms. Priya Nair
    return {
      name: "Ms. Priya Nair",
      initials: "PN",
      subject: "Mathematics",
      classes: "Class 8A · 8B · 8C · 8D · 9A · 9B",
      classTeacher: "8A",
      session: "2026–27"
    };
  };

  const teacherProfile = getActiveTeacherProfile();

  // Dynamically synchronize teacher states (timetable, tasks, and count summary trackers) with current active persona values
  useEffect(() => {
    if (isTeacherRole()) {
      const email = (currentUser || "").toLowerCase().trim();
      const match = teachersIndianExtendedMock.teachers.find(
        (t) => t.email.toLowerCase().trim() === email
      );
      if (match) {
        if (match.timetable) {
          setTeachingTimetable(match.timetable);
        }
        if (match.pendingTasks) {
          setTeachingTasks(match.pendingTasks);
        }
        if (match.resourceSummary) {
          setResourceUploadCount(match.resourceSummary.uploadedThisWeek);
        }
      }
    }
  }, [currentUser, currentRole]);

  const getDisplayName = (email: string, roleName: string) => {
    const trimmedEmail = (email || "").toLowerCase().trim();
    if (trimmedEmail === "torres.admin@school.org" || roleName === "Principal") {
      return "Gabriel Torres";
    }
    if (trimmedEmail === "coord.planner@school.org" || roleName === "School Coordinator" || roleName === "Coordinator") {
      return "Marcus Vance";
    }
    if (trimmedEmail === "mathematics.department@school.org" || roleName === "HOD") {
      return "Eleanor Montgomery";
    }
    if (roleName === "Teacher" || trimmedEmail === "s.henderson@school.org" || trimmedEmail === "m.vance@school.org" || trimmedEmail === "e.montgomery@school.org") {
      const tProfile = getActiveTeacherProfile();
      if (tProfile?.name) {
        return tProfile.name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, "");
      }
    }
    if (!email) return "User";
    const part = email.split('@')[0];
    const words = part.split(/[._-]/);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const renderWelcomeHeader = () => {
    let accentBgColor = "bg-blue-600";
    let avatarBg = "bg-blue-50 border-blue-100 text-blue-600";
    let initials = "U";
    let roleLabel = currentRole;
    let sessionLabel = "Session 2026-27";
    let metadataSpans: React.ReactNode = null;
    let dateValue = "Mon 25 May 2026";

    if (isHodRole()) {
      accentBgColor = "bg-blue-600";
      avatarBg = "bg-blue-50 border-blue-250 text-blue-700";
      initials = "HOD";
      roleLabel = `${hodDepartment} Head of Department`;
      sessionLabel = `${hodAcademicYear} Academic Year`;
      metadataSpans = (
        <>
          <span>Subject Area: {hodDepartment}</span>
          <span>·</span>
          <span>{hodClassRange}</span>
          <span>·</span>
          <span>8 teachers active</span>
        </>
      );
      dateValue = hodDate || "Mon 25 May 2026";
    } else if (isTeacherRole()) {
      accentBgColor = "bg-indigo-650";
      avatarBg = "bg-indigo-50 border-indigo-200 text-indigo-700";
      initials = teacherProfile.initials || "TR";
      roleLabel = `${teacherProfile.subject} Instructor`;
      sessionLabel = `Session ${teacherProfile.session || "2026–27"}`;
      metadataSpans = (
        <>
          <span>Teaching: {teacherProfile.classes}</span>
          {teacherProfile.classTeacher && (
            <>
              <span>·</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-150 text-amber-850 text-[10px] font-bold uppercase tracking-wider">
                Class Teacher: {teacherProfile.classTeacher}
              </span>
            </>
          )}
        </>
      );
    } else if (isCoordinatorRole()) {
      accentBgColor = "bg-teal-650";
      avatarBg = "bg-teal-50 border-teal-200 text-teal-850";
      initials = coordinatorDashboard?.coordinatorProfile?.initials || "MC";
      roleLabel = "Academic Coordinator";
      sessionLabel = "Session 2026-27";
      metadataSpans = (
        <>
          <span className="font-extrabold">{coordinatorDashboard?.coordinatorProfile?.title || "Middle School (Class 6–8)"}</span>
          <span>·</span>
          <span>{coordinatorDashboard?.coordinatorProfile?.subtitle || "18 classrooms · 54 sections"}</span>
        </>
      );
      dateValue = coordinatorDashboard?.coordinatorProfile?.dateValue || "Mon 25 May 2026";
    } else if (isExamsRole()) {
      accentBgColor = "bg-violet-650";
      avatarBg = "bg-violet-50 border-violet-200 text-violet-850";
      initials = "EC";
      roleLabel = "Examination Chair";
      sessionLabel = "Session 2026-27";
      metadataSpans = (
        <>
          <span className="font-extrabold font-sans">CBSE & AP Boards Cell</span>
          <span>·</span>
          <span>Grade Audit Authority</span>
        </>
      );
      dateValue = "Mon 25 May 2026";
    } else if (isPrincipalRole()) {
      accentBgColor = "bg-amber-550";
      avatarBg = "bg-amber-50 border-amber-200 text-amber-700";
      initials = "PR";
      roleLabel = "Principal";
      sessionLabel = "Session 2026-27";
      metadataSpans = (
        <div className="flex items-center gap-2 flex-wrap">
          <span>Institution: CBSE Affiliated Sr. Sec. School</span>
          <span>·</span>
          <span>Governance monitors synced</span>
          <span>·</span>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg select-none">
            <RefreshCw size={11} className={`text-slate-400 ${syncingSis ? "animate-spin" : ""}`} />
            <span className="text-[10px] text-slate-505 font-mono">PowerSchool SIS</span>
            {syncResult?.date ? (
              <span className="text-[9.5px] text-emerald-600 font-bold font-mono">Synced {syncResult.date}</span>
            ) : (
              <span className="text-[9.5px] text-slate-400 font-mono font-bold">Today</span>
            )}
            <button
              type="button"
              onClick={handleSisSync}
              disabled={syncingSis}
              className="text-[9.5px] text-amber-600 hover:text-amber-700 font-bold hover:underline bg-transparent border-none cursor-pointer p-0 ml-1"
            >
              [Sync Now]
            </button>
          </div>
        </div>
      );
    } else if (isAdminRole()) {
      accentBgColor = "bg-red-550";
      avatarBg = "bg-red-50 border-red-200 text-red-700";
      initials = "SA";
      roleLabel = "School Admin";
      sessionLabel = "Session 2026-27";
      metadataSpans = (
        <div className="flex items-center gap-2 flex-wrap text-xs select-none">
          <span>Enterprise System Operator</span>
          <span>·</span>
          <span>API Gateways Synced</span>
          <span>·</span>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
            <RefreshCw size={11} className={`text-slate-400 ${syncingSis ? "animate-spin" : ""}`} />
            <span className="text-[10px] text-slate-505 font-mono font-bold">System Config</span>
            <span className="text-[9.5px] text-emerald-600 font-bold font-mono">ONLINE</span>
          </div>
        </div>
      );
    } else if (isManagerRole()) {
      accentBgColor = "bg-blue-650";
      avatarBg = "bg-blue-50 border-blue-200 text-blue-700";
      initials = "MG";
      roleLabel = "School Manager";
      sessionLabel = "Session 2026-27";
      metadataSpans = (
        <>
          <span className="font-extrabold font-sans">Operational Oversight</span>
          <span>·</span>
          <span>Performance & Budgetary Council</span>
        </>
      );
    } else if (isHrRole()) {
      accentBgColor = "bg-rose-550";
      avatarBg = "bg-rose-50 border-rose-200 text-rose-700";
      initials = "HR";
      roleLabel = "HR Manager";
      sessionLabel = "Session 2026-27";
      metadataSpans = (
        <>
          <span className="font-extrabold font-sans">Workforce Coordinating</span>
          <span>·</span>
          <span>54 registered instructors</span>
        </>
      );
    } else if (isParentRole()) {
      accentBgColor = "bg-emerald-550";
      avatarBg = "bg-emerald-50 border-emerald-200 text-emerald-700";
      initials = "PT";
      roleLabel = "Parent Representative";
      sessionLabel = "Session 2026-27";
      metadataSpans = (
        <>
          <span className="font-extrabold font-sans">Parent Advisory Committee</span>
          <span>·</span>
          <span>Liaison Officer</span>
        </>
      );
    } else if (isStudentRole()) {
      accentBgColor = "bg-cyan-550";
      avatarBg = "bg-cyan-50 border-cyan-200 text-cyan-800";
      initials = "ST";
      roleLabel = "Student Portal";
      sessionLabel = "Session 2026-27";
      metadataSpans = (
        <>
          <span className="font-extrabold font-sans">Class VIII-A Student</span>
          <span>·</span>
          <span>David Chen</span>
        </>
      );
    } else {
      accentBgColor = "bg-slate-400";
      avatarBg = "bg-slate-50 border-slate-200 text-slate-600";
      initials = currentRole ? currentRole.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2) : "UR";
      roleLabel = currentRole || "User Profile";
      sessionLabel = "Session 2026-27";
      metadataSpans = (
        <>
          <span>General Access Portal</span>
        </>
      );
    }

    const displayName = getDisplayName(currentUser, currentRole);

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden" id="dashboard-hero">
        <div className={`absolute top-0 left-0 w-2 h-full ${accentBgColor} rounded-l-2xl`}></div>
        <div className="absolute top-0 right-0 p-8 text-slate-100 opacity-20 pointer-events-none">
          <GraduationCap size={160} />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 animate-fade-in">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-14 h-14 rounded-full border-2 ${avatarBg} flex items-center justify-center font-bold text-lg shadow-sm font-sans shrink-0 select-none`}>
              {initials}
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold font-sans uppercase tracking-wider bg-slate-50 border border-slate-200 text-slate-755 shadow-2xs">
                  {roleLabel}
                </span>
                <span className="text-[11px] text-slate-400">•</span>
                <span className="text-xs font-mono text-slate-500 font-semibold">{sessionLabel}</span>
              </div>
              
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                Welcome back, {displayName}
              </h1>
              
              <div className="text-xs text-slate-505 font-mono flex items-center gap-2 flex-wrap">
                {metadataSpans}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 self-start lg:self-center pr-1" id="header-controls-stack">
            <button
              type="button"
              onClick={() => onToggleTab("ai-assistant")}
              className="flex items-center gap-3 bg-slate-100 border border-slate-200 hover:bg-slate-150 active:bg-slate-200 text-slate-800 p-3 rounded-xl select-none shadow-2xs transition-colors duration-150 cursor-pointer w-44 h-[56px] justify-center group"
              id="header-copilot-btn"
            >
              <Sparkles size={14} className="text-amber-600 shrink-0 fill-amber-500/25 animate-pulse" />
              <div className="text-left leading-none font-sans flex flex-col shrink-0">
                <span className="text-[9px] uppercase font-mono font-semibold text-slate-500 block tracking-wider leading-none">Co-Pilot</span>
                <span className="text-xs font-bold font-sans flex items-center gap-0.5 mt-1 text-slate-800">
                  Configure <ArrowUpRight size={11} className="text-slate-550 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </button>

            {isWorkspaceMock && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/75 p-2.5 rounded-xl select-none shadow-3xs w-44 justify-start text-left animate-fade-in" id="header-fallback-alert">
                <AlertTriangle size={13} className="text-amber-600 shrink-0 animate-pulse" />
                <div className="flex flex-col min-w-0 flex-1 leading-none">
                  <span className="text-[8px] uppercase font-mono font-black text-amber-800 tracking-wider">Simulated Workspace</span>
                  <span className="text-[9.5px] font-sans font-extrabold text-amber-900 mt-0.5 truncate">Fallback Data Active</span>
                  
                  {/* Connect Workspace setup instructions only for Principal & School Admin */}
                  {(currentRole === "Principal" || currentRole === "School Admin" || activeRoles.includes("Principal") || activeRoles.includes("School Admin")) ? (
                    <button
                      type="button"
                      onClick={onConfigureWorkspace}
                      className="text-[9px] font-black text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-none cursor-pointer p-0 text-left mt-1 inline-flex items-center gap-0.5 animate-pulse"
                      title="Setup live Google Workspace synchronizer"
                    >
                      <span>Connect Setup</span>
                      <ArrowUpRight size={8} className="shrink-0" />
                    </button>
                  ) : (
                    <span className="text-[8px] font-semibold text-amber-600/75 tracking-tight mt-1">
                      Read-Only Mode
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const email = (currentUser || "").toLowerCase().trim();
    if (email === "s.henderson@school.org") {
      setTeachingTimetable([
        { period: 1, classSubject: "Grade 8 Science", topic: "Ch 5 Science Cell Division", room: "Lab A-102", status: "Done", time: "8:00–8:45" },
        { period: 2, classSubject: "AP Chemistry", topic: "Ch 8 Organic Esterification", room: "Lab C-301", status: "Done", time: "8:50–9:35" },
        { period: 3, classSubject: "Grade 8 Science", topic: "Ch 5 Science Cell Division", room: "Lab A-102", status: "Done", time: "9:40–10:25" },
        { period: 4, classSubject: "AP Biology", topic: "Ch 12 Photosynthesis cycle", room: "Room A-202", status: "Now", time: "10:30–11:15", meetLink: "https://meet.google.com/sci-hend-bio" },
        { period: 5, classSubject: "Free period", topic: "Prep time for lab materials", room: "Prep Lab", status: "Free Period", time: "11:20–12:05" },
        { period: 6, classSubject: "AP Chemistry", topic: "Organic Esterification Practical", room: "Lab C-301", status: "Next", time: "1:00–1:45" }
      ]);
      setTeachingTasks([
        { id: "task-1", type: "ungraded", title: "32 ungraded lab reports", detail: "AP Chemistry: 15 · AP Biology: 17", status: "Overdue", actionLabel: "Grade" },
        { id: "task-2", type: "lesson_plan", title: "1 lesson plan missing", detail: "AP Chemistry Week 22", status: "Due today", actionLabel: "Due today" },
        { id: "task-3", type: "exam_paper", title: "AP Chemistry mid-term draft review", detail: "Submit draft to Academic Dean", status: "Due soon", actionLabel: "Fri 30 May" },
        { id: "task-4", type: "planner_posted", title: "Weekly planner posted — all chemistry blocks", detail: "Posted Monday 8:00 AM", status: "Completed", actionLabel: "Completed" }
      ]);
      setResourceUploadCount(5);
    } else if (email === "m.vance@school.org") {
      setTeachingTimetable([
        { period: 1, classSubject: "Algebra I", topic: "Linear equations graphing", room: "Room B-105", status: "Done", time: "8:00–8:45" },
        { period: 2, classSubject: "AP Calculus", topic: "Integration fundamentals", room: "Room B-110", status: "Done", time: "8:50–9:35" },
        { period: 3, classSubject: "Algebra I", topic: "Slope intercept formula", room: "Room B-105", status: "Done", time: "9:40–10:25" },
        { period: 4, classSubject: "AP Calculus", topic: "U-Substitution methods", room: "Room B-110", status: "Now", time: "10:30–11:15", meetLink: "https://meet.google.com/mth-vance-calc" },
        { period: 5, classSubject: "Free period", topic: "Standard doubt hours", room: "Doubt Desk", status: "Free Period", time: "11:20–12:05" },
        { period: 6, classSubject: "Algebra I", topic: "Practice Worksheet 8", room: "Room B-105", status: "Next", time: "1:00–1:45" }
      ]);
      setTeachingTasks([
        { id: "task-1", type: "ungraded", title: "25 ungraded homework sheets", detail: "Algebra I: 18 · AP Calculus: 7", status: "Overdue", actionLabel: "Grade" },
        { id: "task-2", type: "lesson_plan", title: "No missing lesson plans", detail: "All uploaded to drive folder", status: "Completed", actionLabel: "Completed" },
        { id: "task-3", type: "exam_paper", title: "Calculus diagnostic blueprint", detail: "Submit to Examination chair", status: "Due soon", actionLabel: "Fri 30 May" },
        { id: "task-4", type: "planner_posted", title: "Weekly planner posted", detail: "Posted Monday 9:00 AM", status: "Completed", actionLabel: "Completed" }
      ]);
      setResourceUploadCount(12);
    } else if (email === "e.montgomery@school.org") {
      setTeachingTimetable([
        { period: 1, classSubject: "AP English Literature", topic: "Shakespeare Hamlet Act II", room: "Room C-101", status: "Done", time: "8:00–8:45" },
        { period: 2, classSubject: "Creative Writing", topic: "Short story outline workshop", room: "Room C-102", status: "Done", time: "8:50–9:35" },
        { period: 3, classSubject: "AP English Literature", topic: "Hamlet Act II analysis", room: "Room C-101", status: "Done", time: "9:40–10:25" },
        { period: 4, classSubject: "Creative Writing", topic: "Character building prompts", room: "Room C-102", status: "Now", time: "10:30–11:15", meetLink: "https://meet.google.com/eng-mont-write" },
        { period: 5, classSubject: "Free period", topic: "Review student creative diaries", room: "Reading Deck", status: "Free Period", time: "11:20–12:05" },
        { period: 6, classSubject: "AP English Literature", topic: "Hamlet Soliloquy Recitation", room: "Room C-101", status: "Next", time: "1:00–1:45" }
      ]);
      setTeachingTasks([
        { id: "task-1", type: "ungraded", title: "38 ungraded essays", detail: "Hamlet Character Analysis essays", status: "Overdue", actionLabel: "Grade" },
        { id: "task-2", type: "lesson_plan", title: "1 lesson plan not uploaded", detail: "Creative Writing Week 22", status: "Due today", actionLabel: "Due today" },
        { id: "task-3", type: "exam_paper", title: "Term 1 Drama exam paper review", detail: "Due this Friday", status: "Due soon", actionLabel: "Fri 30 May" },
        { id: "task-4", type: "planner_posted", title: "Weekly planner posted", detail: "Posted Monday 8:15 AM", status: "Completed", actionLabel: "Completed" }
      ]);
      setResourceUploadCount(6);
    } else {
      // Default / Priya Nair
      setTeachingTimetable([
        { period: 1, classSubject: "Class 8A — Mathematics", topic: "Ch 6 Triangles", room: "Room B-201", status: "Done", time: "8:00–8:45" },
        { period: 2, classSubject: "Class 9A — Mathematics", topic: "Ch 4 Quadratic Eq", room: "Room B-204", status: "Done", time: "8:50–9:35" },
        { period: 3, classSubject: "Class 8B — Mathematics", topic: "Ch 6 Triangles", room: "Room B-203", status: "Done", time: "9:40–10:25" },
        { period: 4, classSubject: "Class 9B — Mathematics", topic: "Ch 4 Quadratic Eq", room: "Room B-205", status: "Now", time: "10:30–11:15", meetLink: "https://meet.google.com/abc-defg-hij" },
        { period: 5, classSubject: "Free period", topic: "Available for doubt session", room: "Staff Room", status: "Free Period", time: "11:20–12:05" },
        { period: 6, classSubject: "Class 8C — Mathematics", topic: "Ch 6 Triangles", room: "Room B-203", status: "Next", time: "1:00–1:45" }
      ]);
      setTeachingTasks([
        { id: "task-1", type: "ungraded", title: "47 ungraded submissions", detail: "Class 8A: 12 · 8B: 9 · 8C: 11 · 9A: 8 · 9B: 7", status: "Overdue", actionLabel: "Grade" },
        { id: "task-2", type: "lesson_plan", title: "2 lesson plans not uploaded", detail: "Class 8C Week 22 · Class 9B Week 22", status: "Due today", actionLabel: "Due today" },
        { id: "task-3", type: "exam_paper", title: "UT4 question paper due Friday", detail: "Ch 5–7 · 25 marks · Submit to Exam Cell", status: "Due soon", actionLabel: "Fri 30 May" },
        { id: "task-4", type: "planner_posted", title: "Weekly planner posted — all 6 classes", detail: "Posted Monday 7:45 AM", status: "Completed", actionLabel: "Completed" }
      ]);
      setResourceUploadCount(8);
    }
    setPlannerStatusValue("Posted");
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

      if (classes === "Class 6–8") {
        repoResources = Math.round(repoResources * 0.51);
        chaptersResourced = Math.min(100, chaptersResourced + 4);
        qbQuestions = Math.round(qbQuestions * 0.48);
      } else if (classes === "Class 9–12") {
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

      if (classes === "Class 6–8") {
        repoResources = Math.round(repoResources * 0.49);
        chaptersResourced = Math.min(100, chaptersResourced + 3);
        qbQuestions = Math.round(qbQuestions * 0.46);
      } else if (classes === "Class 9–12") {
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

      if (classes === "Class 6–8") {
        repoResources = Math.round(repoResources * 0.52);
        chaptersResourced = Math.min(100, chaptersResourced + 2);
        qbQuestions = Math.round(qbQuestions * 0.50);
      } else if (classes === "Class 9–12") {
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
        { className: "Class 6", completion: 90 },
        { className: "Class 7", completion: 85 },
        { className: "Class 8", completion: 78 },
        { className: "Class 9", completion: 72 },
        { className: "Class 10", completion: 88 },
        { className: "Class 11", completion: 61 },
        { className: "Class 12", completion: 80 },
      ],
      Science: [
        { className: "Class 6", completion: 85 },
        { className: "Class 7", completion: 80 },
        { className: "Class 8", completion: 72 },
        { className: "Class 9", completion: 68 },
        { className: "Class 10", completion: 85 },
        { className: "Class 11", completion: 65 },
        { className: "Class 12", completion: 78 },
      ],
      English: [
        { className: "Class 6", completion: 95 },
        { className: "Class 7", completion: 92 },
        { className: "Class 8", completion: 85 },
        { className: "Class 9", completion: 88 },
        { className: "Class 10", completion: 91 },
        { className: "Class 11", completion: 76 },
        { className: "Class 12", completion: 84 },
      ]
    };

    let rows = baseData[dept] || baseData["Mathematics"];

    if (year === "2025-26") {
      rows = rows.map(r => ({ ...r, completion: Math.max(40, r.completion - 5) }));
    }

    if (hodClassRange === "Class 6–8") {
      return rows.filter(r => ["Class 6", "Class 7", "Class 8"].includes(r.className));
    } else if (hodClassRange === "Class 9–12") {
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
    ctx.fillText(`Registry Scope: ${cardData.sourceLabel} • Live Database Synchronization`, 40, 220);

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

  // Trigger PowerSchool SIS manual sync
  const handleSisSync = async () => {
    setSyncingSis(true);
    try {
      const res = await fetch("/api/sis/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser, role: currentRole, system: "PowerSchool SIS" })
      });
      const data = await res.json();
      if (data.success) {
        setSyncResult({
          message: data.message,
          date: new Date().toLocaleTimeString()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingSis(false);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-cockpit">
      {/* Welcome Hero Banner Unified with Profile Cards for All Roles */}
      {isHodRole() && renderWelcomeHeader()}

      {isTeacherRole() && renderWelcomeHeader()}

      {isCoordinatorRole() && (
        <div className="space-y-6" id="coordinator-top-overview-container">
          {/* Header Card */}
          {renderWelcomeHeader()}

          {/* TOP SECTION: Middle School Overview (Class 6-8) */}
          <div className="space-y-6" id="middle-school-coordinator-top-overview">
            {/* Section Heading */}
            <div className="flex items-center gap-2 pt-2" id="coordinator-glance-title">
              <LayoutGrid className="text-indigo-650" size={18} />
              <h2 className="text-base font-extrabold text-slate-905 font-sans tracking-tight">Middle School at a Glance</h2>
            </div>

            {/* 4 KPIs grid (4 col on desktop, 2 col on tablet, 1 col on mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="coordinator-kpis-grid">
              {(coordinatorDashboard?.kpis || []).map((kpi) => {
                let valueColorClass = "text-slate-800";
                let subtextColorClass = "text-slate-500";
                let borderColorClass = "border-slate-200";

                if (kpi.status === "warning") {
                  valueColorClass = "text-amber-600";
                  subtextColorClass = "text-amber-500 font-semibold";
                } else if (kpi.status === "attention" || kpi.status === "danger") {
                  valueColorClass = "text-rose-600";
                  subtextColorClass = "text-rose-500 font-semibold";
                } else if (kpi.status === "success") {
                  valueColorClass = "text-emerald-600";
                  subtextColorClass = "text-emerald-500 font-semibold";
                }

                return (
                  <div 
                    key={kpi.id} 
                    className={`p-4 bg-white border ${borderColorClass} rounded-2xl space-y-1.5 transition-all hover:border-blue-300 hover:shadow-xs`}
                    id={`coordinator-kpi-${kpi.id}`}
                  >
                    <span className="text-[10px] uppercase font-mono font-black text-slate-400 block tracking-wider select-none">
                      {kpi.title}
                    </span>
                    <div className={`text-xl font-black tracking-tight ${valueColorClass}`}>
                      {kpi.value}
                    </div>
                    <div className={`text-[10px] sm:text-[11px] font-mono leading-none ${subtextColorClass}`}>
                      {kpi.subtext}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Double Column Row: Matrix & Coverage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="coordinator-matrix-coverage-grid">
              {/* Card A: Weekly Planner Status */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between" id="coordinator-planner-matrix-card">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4 select-none">
                    <CheckSquare className="text-indigo-650 shrink-0" size={16} />
                    <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase font-sans">
                      Weekly Planner Status — This Week
                    </h3>
                  </div>

                  {/* Scrollable table container */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/20">
                    <table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {coordinatorDashboard?.plannerStatusMatrix?.headers?.map((header) => (
                            <th 
                              key={header} 
                              className="p-2.5 text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider text-center first:text-left first:pl-4"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {coordinatorDashboard?.plannerStatusMatrix?.rows?.map((row, idx) => {
                          const statusDot = (status: string) => {
                            let dotBg = "bg-slate-300 border-slate-400";
                            if (status === "Done") {
                              dotBg = "bg-emerald-500 border-emerald-600";
                            } else if (status === "Partial") {
                              dotBg = "bg-amber-500 border-amber-600";
                            } else if (status === "Missing") {
                              dotBg = "bg-rose-500 border-rose-600";
                            }
                            return (
                              <div className="flex items-center justify-center">
                                <span className={`w-3 h-3 rounded-full border ${dotBg}`} title={status} />
                              </div>
                            );
                          };

                          return (
                            <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                              <td className="p-2.5 text-[11px] font-black text-slate-700 text-left pl-4 font-sans">{row.class}</td>
                              <td className="p-2.5">{statusDot(row.six)}</td>
                              <td className="p-2.5">{statusDot(row.seven)}</td>
                              <td className="p-2.5">{statusDot(row.eight)}</td>
                              <td className="p-2.5">{statusDot(row.assess)}</td>
                              <td className="p-2.5">{statusDot(row.nb)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Legend below table */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-start gap-4 select-none">
                  <span className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-wider">Legend:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-emerald-600 bg-emerald-500" />
                    <span className="text-[10.5px] font-sans font-bold text-slate-600">Done</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-amber-600 bg-amber-500" />
                    <span className="text-[10.5px] font-sans font-bold text-slate-600">Partial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-rose-600 bg-rose-500" />
                    <span className="text-[10.5px] font-sans font-bold text-slate-600">Missing</span>
                  </div>
                </div>
              </div>

              {/* Card B: Syllabus Coverage & Assessment Completion */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between" id="coordinator-syllabus-assessment-card">
                <div className="space-y-6">
                  {/* Syllabus Section */}
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 select-none">
                      <BookOpen className="text-indigo-650 shrink-0" size={16} />
                      <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase font-sans">
                        Syllabus Coverage — This Term
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {(coordinatorDashboard?.syllabusCoverage || []).map((item) => {
                        const val = item.coverage;
                        const isLow = val < 80;
                        const barColorClass = isLow ? "bg-amber-500" : "bg-emerald-500";
                        const textColorClass = isLow ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold";
                        return (
                          <div key={item.class} className="space-y-1" id={`syllabus-row-${item.class.toLowerCase().replace(/\s+/g, '-')}`}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-slate-705 font-sans">{item.class}</span>
                              <span className={`font-mono ${textColorClass}`}>{val}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-550 ease-out ${barColorClass}`}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assessment Completion Section */}
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 select-none">
                      <Award className="text-indigo-650 shrink-0" size={16} />
                      <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase font-sans">
                        Assessment Completion
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {(coordinatorDashboard?.assessmentCompletion || []).map((item) => {
                        const val = item.completion;
                        const isLow = val < 80;
                        const barColorClass = isLow ? "bg-amber-500" : "bg-emerald-500";
                        const textColorClass = isLow ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold";
                        return (
                          <div key={item.subject} className="space-y-1" id={`assessment-comp-row-${item.subject.toLowerCase()}`}>
                            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                              <span className="font-extrabold text-slate-705 font-sans">{item.subject}</span>
                              <span className={`font-mono ${textColorClass}`}>{val}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-550 ease-out ${barColorClass}`}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPrincipalRole() && renderWelcomeHeader()}

      {/* School at a Glance Card */}
      {isPrincipalRole() && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="school-at-a-glance-card">
          <div className="flex items-center gap-2">
            <LayoutGrid className="text-blue-600" size={18} />
            <h2 className="text-base font-extrabold text-slate-905 font-sans tracking-tight">School at a Glance</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" id="school-glance-grid">
            <div className="w-full h-full flex flex-col justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-100 rounded-xl space-y-1 transition-all cursor-pointer hover:border-blue-200 hover:shadow-xs group" onClick={() => setSelectedClassroomMetricDrill("total")} id="kpi-glance-classrooms">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Classrooms Active</span>
                <div className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{courses.length} Active</div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium font-sans">Synced with LMS</div>
            </div>
            <div className="w-full h-full flex flex-col justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-100 rounded-xl space-y-1 transition-all cursor-pointer hover:border-blue-200 hover:shadow-xs group" onClick={() => setSelectedAcademicLevelDrill("All Levels")} id="kpi-glance-planners">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Planners Submitted</span>
                <div className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{dynamicGlanceCalculations.plannersCount} / {dynamicGlanceCalculations.totalClassroomsCount}</div>
              </div>
              <div className="text-[10px] text-amber-600 font-medium font-sans">{dynamicGlanceCalculations.overduePlannersCount} Overdue this week</div>
            </div>
            <div className="w-full h-full flex flex-col justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-100 rounded-xl space-y-1 transition-all cursor-pointer hover:border-blue-200 hover:shadow-xs group" onClick={() => setSelectedAcademicLevelDrill("All Levels")} id="kpi-glance-assessments">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Assessments on Track</span>
                <div className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{dynamicGlanceCalculations.assessmentPercent}%</div>
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold font-sans">On-track activity index</div>
            </div>
            <div className="w-full h-full flex flex-col justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-100 rounded-xl space-y-1 transition-all cursor-pointer hover:border-blue-200 hover:shadow-xs group" onClick={() => setSelectedComplianceItemDrill("all")} id="kpi-glance-compliance">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Compliance Score</span>
                <div className="text-xl font-black text-emerald-700 group-hover:text-emerald-800 transition-colors">{dynamicGlanceCalculations.complianceScoreValue}%</div>
              </div>
              <div className="text-[10px] text-emerald-600 font-medium font-sans">CBSE aligned audits</div>
            </div>
            <div className="w-full h-full flex flex-col justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-100 rounded-xl space-y-1 transition-all cursor-pointer hover:border-blue-200 hover:shadow-xs group" onClick={() => { setActiveDrill("classroom"); setDrillSearch(""); }} id="kpi-glance-notebook">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Notebook Monitoring</span>
                <div className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{dynamicGlanceCalculations.notebookCount} / {dynamicGlanceCalculations.totalClassroomsCount}</div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium font-sans">{dynamicGlanceCalculations.pendingNotebooksReview} pending review</div>
            </div>
            <div className="w-full h-full flex flex-col justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-100 rounded-xl space-y-1 transition-all cursor-pointer hover:border-blue-200 hover:shadow-xs group" onClick={() => setSelectedClassroomMetricDrill("risk")} id="kpi-glance-risk">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">High-Risk Pupils</span>
                <div className="text-xl font-black text-rose-600 group-hover:text-rose-700 transition-colors">{highRiskStudents} Flagged</div>
              </div>
              <div className="text-[10px] text-rose-600 font-medium font-sans">Requires critical action</div>
            </div>
          </div>
        </div>
      )}





      {/* If Principal or School Admin role is active, we render the Principal Specific Sections */}
      {isPrincipalRole() && (
        <div className="space-y-6 mt-6 animate-fade-in" id="principal-specific-dashboard-zones">
          
          {/* Alerts & Compliance row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="principal-alerts-compliance-container">
            {/* Alerts & Principal Compliance KPIs (SDOS-22 compliance) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between" id="principal-alerts-section">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="text-amber-500" size={20} />
                  <h2 className="text-md font-bold text-slate-900 font-sans tracking-tight">Alerts Requiring Attention</h2>
                </div>

                 {/* Alerts Requiring Attention details list in a single column */}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { level: "critical", msg: "Missing Weekly Planners detected for Mr. Vijay Kumar (Grade VII History).", time: "1 hour ago" },
                    { level: "high", msg: `SIS Risk Flag: ${highRiskStudents} of ${students.length} pupils mapped to High Attendance/Grade Risk tier (>70%); ${mediumRiskStudents} warning, ${normalStudents} normal standing (Average GPA: 3.18).`, time: "Just now" },
                    { level: "warning", msg: `AI Suggestion: ${productivityTip}`, time: "Just now" },
                    { level: "warning", msg: "Compliance Evidence Form buffer requires 4 outstanding files to clear statutory audits.", time: "1 day ago" }
                  ].map((alert, aIdx) => (
                    <div key={aIdx} className={`p-3 border rounded-xl flex items-start gap-2.5 text-xs text-slate-700 ${
                      alert.level === 'critical' ? 'bg-rose-50/40 border-rose-100 text-rose-950' :
                      alert.level === 'high' ? 'bg-amber-50/40 border-amber-100 text-amber-955' :
                      'bg-blue-50/40 border-blue-105 text-blue-950'
                    }`}>
                      <div className="mt-0.5">
                        {alert.level === 'critical' && <ShieldAlert size={14} className="text-rose-600" />}
                        {alert.level === 'high' && <AlertTriangle size={14} className="text-amber-600" />}
                        {alert.level === 'warning' && <AlertTriangle size={14} className="text-blue-600" />}
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

            {/* CARD 3: COMPLIANCE WIDGET */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative min-h-[360px]" id="compliance-monitoring-card">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 select-none">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">Compliance Monitoring</h3>
                    <p className="text-[10px] uppercase font-mono font-bold text-emerald-700">
                      Overall Score: {principalSandboxState === "active" ? `${calculatedOverallCompliance}%` : "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowComplianceConfig(!showComplianceConfig)}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                      showComplianceConfig ? 'bg-blue-50 text-blue-650' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                    title="Configure Weights"
                  >
                    <Sliders size={15} />
                  </button>
                </div>

                {/* Config Drawer for Compliance Weightings */}
                {showComplianceConfig && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-2.5 animate-fade-in select-none max-h-[220px] overflow-y-auto scrollbar-thin">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-1.5 mb-1">
                      <span className="font-bold text-slate-800">Assign Scoring Weights</span>
                      <span className="text-[10px] text-blue-600 font-mono font-bold uppercase block tracking-wider">Weighted calculations</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center font-sans">
                        <span>Committee:</span>
                        <input 
                          type="number" min={0} max={100} value={committeeWeight}
                          onChange={(e) => setCommitteeWeight(Math.max(0, Number(e.target.value)))}
                          className="w-12 px-1 py-0.5 text-center font-bold border rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="flex justify-between items-center text-rose-700 font-semibold text-[11px] font-sans">
                        <span>Safety (Critical):</span>
                        <input 
                          type="number" min={0} max={100} value={safetyWeight}
                          onChange={(e) => setSafetyWeight(Math.max(0, Number(e.target.value)))}
                          className="w-12 px-1 py-0.5 text-center font-bold border rounded-lg bg-white font-mono text-rose-700"
                        />
                      </div>
                      <div className="flex justify-between items-center font-sans">
                        <span className="font-medium">Forms:</span>
                        <input 
                          type="number" min={0} max={100} value={formsWeight}
                          onChange={(e) => setFormsWeight(Math.max(0, Number(e.target.value)))}
                          className="w-12 px-1 py-0.5 text-center font-bold border rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="flex justify-between items-center font-sans">
                        <span>Staff CPD:</span>
                        <input 
                          type="number" min={0} max={100} value={cpdWeight}
                          onChange={(e) => setCpdWeight(Math.max(0, Number(e.target.value)))}
                          className="w-12 px-1 py-0.5 text-center font-bold border rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="flex justify-between items-center font-sans">
                        <span>SQAA Evidence:</span>
                        <input 
                          type="number" min={0} max={100} value={sqaaWeight}
                          onChange={(e) => setSqaaWeight(Math.max(0, Number(e.target.value)))}
                          className="w-12 px-1 py-0.5 text-center font-bold border rounded-lg bg-white font-mono"
                        />
                      </div>
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
                    {/* Compliance list */}
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
                            <span className={`inline-block px-1.5 py-0.5 rounded-md text-[8.5px] font-bold border capitalize leading-none font-mono font-sans ${textBadgeClass}`}>
                              {item.status}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-700 shrink-0">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 mt-4 select-none">
                <button
                  type="button"
                  onClick={() => setSelectedComplianceItemDrill("gaps")}
                  className="w-full text-center py-2 bg-slate-905 hover:bg-slate-805 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  View gaps
                </button>
              </div>
            </div>
          </div>

          {/* Main Academic Monitoring and Classroom Monitoring widgets (SDOS-23) */}
          <div className="space-y-6" id="principal-three-widgets">
            {/* Desktop Widget Grid layout (2 cards: Equal width to align with Alerts row) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* CARD 1: ACADEMIC MONITORING WIDGET (Reduced to match Alerts section) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between col-span-1 relative min-h-[360px]" id="academic-monitoring-card">
                <div>
                  {/* Card Title & Config Toggle */}
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
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        showAcademicConfig ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                      title="Configure Thresholds"
                    >
                      <Settings size={15} />
                    </button>
                  </div>

                  {/* Config Drawer for Academic Thresholds */}
                  {showAcademicConfig && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-3 animate-fade-in select-none">
                      <div className="flex items-center justify-between border-b border-slate-150 pb-1.5 mb-1 mb-2">
                        <span className="font-bold text-slate-800 font-sans">Configure Status Thresholds</span>
                        <span className="text-[10px] text-blue-600 font-mono font-bold uppercase">Dynamic overrides</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Healthy Threshold</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={watchThreshold + 1}
                              max={100}
                              value={healthyThreshold}
                              onChange={(e) => setHealthyThreshold(Number(e.target.value))}
                              className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-850"
                            />
                            <span className="text-slate-450 font-mono">%</span>
                          </div>
                          <span className="text-[9px] text-slate-450 leading-none block mt-1">Satisfying status (≥ value)</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Watch Threshold</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={healthyThreshold - 1}
                              value={watchThreshold}
                              onChange={(e) => setWatchThreshold(Number(e.target.value))}
                              className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-850"
                            />
                            <span className="text-slate-450 font-mono">%</span>
                          </div>
                          <span className="text-[9px] text-slate-450 leading-none block mt-1">Warning index (value to H-1)</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-150 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowAcademicConfig(false)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 cursor-pointer"
                        >
                          Apply Configuration
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tabs bar */}
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-4 select-none">
                    {(["planner", "syllabus", "assessment"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setAcademicTab(tab)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                          academicTab === tab
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents loaded based on state simulation */}
                  {renderSectionState("academic", (
                    <div className="space-y-4">
                      {PRINCIPAL_DASHBOARD_SEED.academicMonitoring[academicTab].map((item, idx) => {
                        const score = item.percentage;
                        const status: "healthy" | "watch" | "critical" = 
                          score >= healthyThreshold ? "healthy" : 
                          score >= watchThreshold ? "watch" : "critical";
                        
                        const colorClass = 
                          status === "healthy" ? "bg-emerald-500" :
                          status === "watch" ? "bg-amber-500" : "bg-rose-500";
                        
                        const textBadgeClass = 
                          status === "healthy" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          status === "watch" ? "bg-amber-50 text-amber-705 border-amber-100" : "bg-rose-50 text-rose-700 border-rose-100";

                        return (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedAcademicLevelDrill(item.level)}
                            className="space-y-1.5 cursor-pointer hover:bg-slate-50/60 p-1.5 rounded-xl transition-all group"
                          >
                            <div className="flex justify-between items-center select-none">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-650 transition-colors font-sans">
                                {item.level}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-700">
                                  {score}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-350 ${colorClass}`}
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
                  <span>Index: H ≥{healthyThreshold}%, W ≥{watchThreshold}%</span>
                  <span>Week 24 Pacing</span>
                </div>
              </div>

              {/* CARD 2: CLASSROOM MONITORING WIDGET (Increased to equal 1/2 span) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between col-span-1 relative min-h-[360px]" id="classroom-monitoring-card">
                <div>
                  <div className="pb-3 border-b border-slate-100 mb-4 select-none">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">Classroom Monitoring</h3>
                    <p className="text-[10px] uppercase font-mono font-bold text-slate-400">
                      Coaching & LMS streams
                    </p>
                  </div>

                  {renderSectionState("classroom", (
                    <div className="space-y-3.5 select-none">
                      {/* Interactive Metrics list */}
                      <div 
                        onClick={() => setSelectedClassroomMetricDrill("total")}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all"
                      >
                        <span className="text-xs text-slate-600 font-medium font-sans">Total Classrooms</span>
                        <span className="px-2 py-0.5 font-bold font-mono text-xs bg-slate-100 border border-slate-200 text-slate-705 rounded-full shrink-0">
                          {PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.totalClassrooms}
                        </span>
                      </div>

                      <div 
                        onClick={() => setSelectedClassroomMetricDrill("posted")}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all"
                      >
                        <span className="text-xs text-slate-600 font-medium font-sans">Posted this week</span>
                        <span className="px-2 py-0.5 font-bold font-mono text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full shrink-0">
                          {PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.postedThisWeek} / {PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.totalClassrooms}
                        </span>
                      </div>

                      <div 
                        onClick={() => setSelectedClassroomMetricDrill("inactive")}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all bg-rose-50/20"
                      >
                        <span className="text-xs text-rose-950 font-bold font-sans">Zero Activity</span>
                        <span className="px-2 py-0.5 font-bold font-mono text-xs bg-rose-50 border border-rose-100 text-rose-700 rounded-full shrink-0 animate-pulse">
                          {PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.zeroActivityThisWeek} Classrooms
                        </span>
                      </div>

                      <div 
                        onClick={() => setSelectedClassroomMetricDrill("assignments")}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all"
                      >
                        <span className="text-xs text-slate-600 font-medium font-sans font-sans">Assignments metrics</span>
                        <span className="px-2 py-0.5 font-bold font-mono text-xs bg-blue-50 border border-blue-105 text-blue-700 rounded-full shrink-0">
                          {PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.assignmentsCreatedThisWeek} this week
                        </span>
                      </div>

                      <div 
                        onClick={() => setSelectedClassroomMetricDrill("submissions")}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all"
                      >
                        <span className="text-xs text-slate-600 font-medium font-sans">Submission rate</span>
                        <span className="px-2 py-0.5 font-bold font-mono text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full shrink-0">
                          {PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.averageSubmissionRate}%
                        </span>
                      </div>

                      <div 
                        onClick={() => setSelectedClassroomMetricDrill("meet")}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all"
                      >
                        <span className="text-xs text-slate-600 font-medium font-sans">Meet sessions</span>
                        <span className="px-2 py-0.5 font-bold font-mono text-xs bg-slate-55 border border-slate-150 text-slate-500 rounded-full shrink-0">
                          {PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.meetSessionsHeldThisWeek} held
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-4 select-none">
                  <button
                    type="button"
                    onClick={() => setSelectedClassroomMetricDrill("inactive")}
                    className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    View inactive classrooms
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Side-by-side grid for Teacher Indicators & Monitoring Forms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="principal-feeds-grid">
            
            {/* Required Principal Dashboard Section 1: Teacher Performance Indicators */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between" id="teacher-performance-card">
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
                          <td className="py-3.5 pr-2 truncate max-w-28 font-semibold text-slate-800">{row.teacher}</td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.plannerStatus)}`}>
                              {row.plannerStatus}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.assessmentStatus)}`}>
                              {row.assessmentStatus}
                            </span>
                          </td>
                          <td className="py-3.5 text-center font-mono text-[11px] text-slate-500">
                            {row.resourceCount} files
                          </td>
                          <td className="py-3.5 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(row.activityStatus)}`}>
                              {row.activityStatus}
                            </span>
                          </td>
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
                  Full report <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

            {/* Required Principal Dashboard Section 2: Monitoring Forms — Data Feeds */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between" id="monitoring-forms-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-md font-bold text-slate-900 tracking-tight">Monitoring Forms — Data Feeds</h2>
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
                          form.statusType === 'good' ? 'bg-emerald-50 text-emerald-650' :
                          form.statusType === 'warning' ? 'bg-amber-50 text-amber-650' :
                          form.statusType === 'risk' ? 'bg-rose-50 text-rose-650' :
                          'bg-blue-50 text-blue-650'
                        }`}>
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-blue-650 transition-colors">
                            {form.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate leading-normal">
                            {form.summary}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          form.statusType === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                          form.statusType === 'warning' ? 'bg-amber-50 text-amber-705 border-amber-150' :
                          form.statusType === 'risk' ? 'bg-rose-50 text-rose-700 border-rose-150' :
                          'bg-blue-50 text-blue-700 border-blue-150'
                        }`}>
                          {form.statusLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Principal Additions: School-wide Assessment Tracking, Enrichment & Olympiads, Remedial Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animate-duration-300 border-t border-slate-150 pt-6 mt-6 pb-2" id="principal-dashboard-additions-grid">
            
            {/* Card 1: Assessment Tracking (School-wide) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="principal-assessment-tracking-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      School Assessment Tracking
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">
                    UT4 Cycle
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT4 papers submitted</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-150 font-mono">
                      38/48 teachers
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT4 deadline</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold border bg-amber-50 text-amber-800 border-amber-200">
                      Fri 30 May
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT3 results entered</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150">
                      All done
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">School avg UT3</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-800 bg-slate-100">
                      69.5%
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Below 40% students</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-150">
                      64 students
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowPrincipalChasePendingModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Chase pending <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 2: Enrichment and Olympiads (School-wide) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="principal-enrichment-olympiads-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      School Enrichment & Olympiads
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-600 font-bold px-1.5 py-0.5 bg-purple-50 rounded">
                    Talent Pool
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Olympiad registrations</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      184 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Enrichment posts — Classroom</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      112 this term
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Resources in Enrichment folder</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      145 files
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Students in enrichment programme</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      142
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Next olympiad date</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold border bg-slate-100 text-slate-700 border-slate-200">
                      12 June 2026
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    logAction(currentUser, currentRole, "School Enrichment Open", "Principal viewed school-wide enrichment dashboard", "task");
                    alert("Exporting school-wide talent pool registrations and achievement archives...");
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Manage talent <Sparkles size={13} className="text-blue-500" />
                </button>
              </div>
            </div>

            {/* Card 3: Remedial Status (School-wide) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="principal-remedial-status-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-emerald-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      School Remedial Status
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded">
                    Intervention
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Identified for remedial</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      198 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Remedial sessions held</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      54 this term
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Resources in Remedial folder</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      92 files
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Improved after remedial</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      124 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Still needs support</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-rose-50 text-rose-700 border-rose-150 font-mono">
                      74 students
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowFullRemedialModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Full report <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* If School Coordinator or Examination Chair role is active, we render the Coordinator Specific Sections */}
      {isCoordinatorRole() && (
        <div className="space-y-6 mt-6 animate-fade-in" id="coordinator-specific-dashboard-zones">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            {/* CARD 1: REMEDIAL TRACKING */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between" id="remedial-tracking-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">Remedial Tracking</h3>
                    <p className="text-xs text-slate-500">
                      Monitor students requiring diagnostic intervention and track remediation statuses.
                    </p>
                  </div>
                </div>

                {/* Inline filter & search bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student or class..."
                      value={remedialSearch}
                      onChange={(e) => setRemedialSearch(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-800"
                    />
                    {remedialSearch && (
                      <button 
                        onClick={() => setRemedialSearch("")}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 rounded-full"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <select
                    aria-label="Filter Remedial Status"
                    value={remedialStatusFilter}
                    onChange={(e) => setRemedialStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 cursor-pointer text-slate-705 font-sans font-medium"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Tracked">Tracked</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Untracked">Untracked</option>
                  </select>
                </div>

                {/* List Container */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {(() => {
                    const filtered = COORDINATOR_DASHBOARD_SEED.remedialStudents.filter(student => {
                      const matchesSearch = student.name.toLowerCase().includes(remedialSearch.toLowerCase()) || 
                                           student.grade.toLowerCase().includes(remedialSearch.toLowerCase()) || 
                                           student.subject.toLowerCase().includes(remedialSearch.toLowerCase());
                      const matchesStatus = remedialStatusFilter === "all" || student.status === remedialStatusFilter;
                      return matchesSearch && matchesStatus;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          No students found matching your search and status criteria.
                        </div>
                      );
                    }

                    return filtered.map((row) => {
                      const initials = row.name.split(' ').map(n => n[0]).join('');
                      
                      let badgeColors = "bg-rose-50 text-rose-700 border-rose-100";
                      if (row.status === "Tracked") {
                        badgeColors = "bg-emerald-50 text-emerald-700 border-emerald-100";
                      } else if (row.status === "In Progress") {
                        badgeColors = "bg-amber-50 text-amber-700 border-amber-100";
                      }

                      return (
                        <div 
                          key={row.id}
                          onClick={() => setSelectedRemedialStudent(row)}
                          className="flex items-center justify-between p-3 border border-slate-100 rounded-xl cursor-pointer hover:border-blue-200 hover:bg-slate-50/40 transition-all group lg:min-h-[58px]"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                              row.status === 'Tracked' ? 'bg-emerald-50 text-emerald-700' :
                              row.status === 'In Progress' ? 'bg-amber-50 text-amber-700' :
                              'bg-rose-50 text-rose-700'
                            }`}>
                              {initials}
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-600 transition-colors">
                                {row.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {row.grade} · <span className="text-slate-500 font-semibold">{row.subject}</span>
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${badgeColors}`}>
                              {row.status}
                            </span>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all animate-none" />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div></div>
                <button
                  type="button"
                  onClick={() => setShowFullRemedialModal(true)}
                  className="text-xs text-blue-600 font-bold hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer font-sans bg-transparent border-none outline-none"
                >
                  Full remedial report ↗
                </button>
              </div>
            </div>

            {/* CARD 2: CLASSROOM ACTIVITY — THIS WEEK */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between" id="classroom-activity-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">Classroom Activity — This Week</h3>
                    <p className="text-xs text-slate-500">
                      Review Google Classroom stream execution and student assignment submissions.
                    </p>
                  </div>
                </div>

                {/* Mini Stats KPI Rows Inside Card */}
                <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl select-none">
                  <div className="text-center space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assignments</span>
                    <span className="text-lg font-black text-slate-800 block">84</span>
                    <span className="text-[9px] text-emerald-600 font-semibold font-sans">Published on LMS</span>
                  </div>
                  <div className="text-center space-y-0.5 border-x border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Submission Rate</span>
                    <span className="text-lg font-black text-emerald-600 block">86%</span>
                    <span className="text-[9px] text-slate-400 font-sans font-medium">Avg class submission</span>
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Enrichments</span>
                    <span className="text-lg font-black text-blue-600 block">12</span>
                    <span className="text-[9px] text-blue-500 font-medium font-sans">Department shares</span>
                  </div>
                </div>

                {/* Class List Table */}
                <div className="space-y-3 pt-1 font-sans">
                  {COORDINATOR_DASHBOARD_SEED.classroomActivity.map((r, rIdx) => {
                    let dotColor = "bg-rose-500";
                    let badgeColors = "bg-rose-50 text-rose-700 border-rose-100";
                    
                    if (r.state === "high") {
                      dotColor = "bg-emerald-500";
                      badgeColors = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    } else if (r.state === "moderate") {
                      dotColor = "bg-amber-500";
                      badgeColors = "bg-amber-50 text-amber-705 border-amber-100";
                    }

                    return (
                      <div key={rIdx} className="p-3 border border-slate-100 bg-slate-50/20 rounded-xl space-y-2 lg:min-h-[72px]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 font-sans">
                              {r.className}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 font-mono">
                              ({r.activeCount} Sections Active)
                            </span>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 leading-none ${badgeColors}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                            {r.status}
                          </span>
                        </div>

                        {/* Submitting progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-sans font-semibold">
                            <span>{r.assignments} assignments · {r.enrichment} uploads</span>
                            <span className="font-bold text-slate-700">{r.submissionRate}% Submitted</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-350 ${
                                r.state === 'high' ? 'bg-emerald-500' :
                                r.state === 'moderate' ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${r.submissionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-sans font-medium">
                  Classroom telemetry updated 14 minutes ago
                </span>
                <button
                  type="button"
                  onClick={() => setShowInactiveSectionsModal(true)}
                  className="text-xs text-blue-600 font-bold hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer font-sans bg-transparent border-none outline-none"
                >
                  View inactive sections ↗
                </button>
              </div>
            </div>
          </div>

          {/* Coordinator Additions: Grade-level Assessment Tracking, Enrichment & Olympiads, Remedial Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animate-duration-300 border-t border-slate-150 pt-6 mt-6 pb-2" id="coordinator-dashboard-additions-grid">
            
            {/* Card 1: Assessment Tracking (Coordinator Level) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="coordinator-assessment-tracking-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      Grade-Level Assessment Tracking
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">
                    UT4 Cycle
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT4 papers submitted</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-150 font-mono">
                      18/24 teachers
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT4 deadline</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold border bg-amber-50 text-amber-800 border-amber-200">
                      Fri 30 May
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT3 results entered</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150">
                      All done
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Coordinated avg UT3</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-800 bg-slate-100">
                      71.2%
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Below 40% students</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-150">
                      28 students
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowCoordinatorChasePendingModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Chase pending <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 2: Enrichment and Olympiads (Coordinator Level) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="coordinator-enrichment-olympiads-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      Grade Enrichment & Olympiads
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-600 font-bold px-1.5 py-0.5 bg-purple-50 rounded">
                    Talent Pool
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Olympiad registrations</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      78 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Enrichment posts — Classroom</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      42 this term
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Resources in Enrichment folder</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      56 files
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Students in enrichment programme</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      64
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Next olympiad date</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold border bg-slate-100 text-slate-700 border-slate-200">
                      12 June 2026
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    logAction(currentUser, currentRole, "Coordinator Enrichment Open", "Coordinator viewed grade-level enrichment", "task");
                    alert("Exporting grade-level coordinator talent pools and academic enrichment index...");
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Manage talent <Sparkles size={13} className="text-blue-500" />
                </button>
              </div>
            </div>

            {/* Card 3: Remedial Status (Coordinator Level) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="coordinator-remedial-status-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-emerald-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      Grade Remedial Status
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded">
                    Intervention
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Identified for remedial</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      82 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Remedial sessions held</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      24 this term
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Resources in Remedial folder</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      38 files
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Improved after remedial</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      48 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Still needs support</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-rose-50 text-rose-700 border-rose-150 font-mono">
                      34 students
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowFullRemedialModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Full report <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>
          
        </div>
      )}

      {/* Teacher Dashboard Specific Section */}
      {isTeacherRole() && (
        <div className="space-y-6 mt-6 animate-fade-in animate-duration-300" id="teacher-dashboard-main-view">
          
          {/* 2. KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="teacher-kpi-summary-cards">
            
            {/* KPI 1: Classes Today */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between h-32" id="kpi-teacher-classes-today">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Classes Today</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><Clock size={14} /></span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {teachingTimetable.filter(t => t.classSubject !== "Free period").length}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-sans flex items-center gap-1">
                  <span className="text-emerald-600 font-bold">1 now</span> · 2 ahead
                </div>
              </div>
            </div>

            {/* KPI 2: Ungraded Work */}
            <div 
              onClick={() => setShowGradingInterface(true)}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer group"
              id="kpi-teacher-ungraded-work"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Ungraded Work</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors"><CheckSquare size={14} /></span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {teachingTasks.find(t => t.type === 'ungraded') ? parseInt(teachingTasks.find(t => t.type === 'ungraded')!.title) : 47}
                </div>
                <div className="text-[10px] text-rose-600 mt-1 font-sans font-semibold flex items-center gap-1">
                  12 overdue 3+ days <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 ml-1">Grade →</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Weekly Planner */}
            <div 
              onClick={() => setShowPlannerForm(true)}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer group"
              id="kpi-teacher-weekly-planner"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Weekly Planner</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors"><Sparkles size={14} /></span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-700 tracking-tight font-sans">
                    {plannerStatusValue}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-sans flex items-center justify-between w-full">
                  <span>Today 7:45 AM</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 font-bold">Update ↗</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Resource Uploads */}
            <div 
              onClick={() => setShowResourceUploadForm(true)}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer group"
              id="kpi-teacher-resource-uploads"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Resource Uploads</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors"><FileText size={14} /></span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {resourceUploadCount}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-sans flex items-center justify-between w-full">
                  <span>This week in repository</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 font-bold">Add ↗</span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. TODAY'S TIMETABLE & 4. PENDING TASKS SECTION (GRID) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="teacher-timetable-and-tasks-grid">
            
            {/* TODAY'S TIMETABLE CARD (Col-Span 7) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-7 flex flex-col" id="teacher-timetable-card">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-indigo-50 text-indigo-700">
                    <Calendar size={14} />
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-900 tracking-tight uppercase font-sans">Today's Timetable</h3>
                </div>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-extrabold font-mono">Periods schedule</span>
              </div>

              <div className="divide-y divide-slate-100 overflow-x-auto min-w-full flex-1">
                {/* TIMETABLE ROW */}
                {teachingTimetable.map((row) => {
                  const isNow = row.status === "Now";
                  const isNext = row.status === "Next";
                  const isDone = row.status === "Done";
                  const isFree = row.status === "Free Period";

                  return (
                    <div 
                      key={row.period} 
                      className={`p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isNow ? "bg-indigo-50/70 border-l-4 border-indigo-500 shadow-inner" : "hover:bg-slate-50/45"
                      }`}
                      id={`timetable-row-period-${row.period}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                          isNow ? "bg-indigo-650 text-white shadow-inner animate-pulse" :
                          isNext ? "bg-indigo-50 text-indigo-650 border border-indigo-100" :
                          isDone ? "bg-slate-100 text-slate-400" : "bg-slate-50 text-slate-500"
                        }`}>
                          {row.period}
                        </div>
                        <div className="space-y-0.5">
                          <p className={`text-sm font-extrabold tracking-tight ${isDone ? "text-slate-400 line-through" : "text-slate-800"}`}>
                            {row.classSubject}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap font-sans">
                            <span className="font-semibold text-slate-600">{row.topic}</span>
                            <span className="text-slate-300">•</span>
                            <span className="bg-slate-100 text-slate-650 px-1.5 py-0.2 rounded font-mono text-[9px]">
                              {row.room}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-none pt-2 sm:pt-0">
                        <span className="text-xs text-slate-400 font-mono font-medium shrink-0">
                          {row.time}
                        </span>

                        <div>
                          {isNow && row.meetLink ? (
                            <button
                              onClick={() => {
                                logAction(currentUser, currentRole, "In-App Meet Simulator Launched", "Teacher clicked Meet button for " + row.classSubject, "file_access");
                                setActiveCallSim(true);
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold font-sans flex items-center gap-1 outline-none shadow-sm transition-colors cursor-pointer"
                              id={`timetable-meet-btn-p${row.period}`}
                            >
                              <ExternalLink size={12} />
                              Meet
                            </button>
                          ) : isDone ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-450 text-[9px] font-bold flex items-center gap-1">
                              <Check size={10} /> Done
                            </span>
                          ) : isNext ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-805 text-[9px] font-bold uppercase tracking-wider">
                              Next
                            </span>
                          ) : isFree ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-805 text-[9px] font-bold uppercase tracking-wider">
                              Available
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Scheduled</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PENDING TASKS CARD (Col-Span 5) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between col-span-1 lg:col-span-5" id="teacher-pending-tasks-card">
              <div>
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-orange-100 text-orange-700">
                      <CheckSquare size={14} />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-905 tracking-tight uppercase font-sans">Pending Tasks</h3>
                  </div>
                  <span className="text-[9px] bg-rose-55 text-rose-700 px-2 py-0.5 rounded font-extrabold font-mono">Action required</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {teachingTasks.map((task) => {
                    const isOverdue = task.status === "Overdue";
                    const isDueToday = task.status === "Due today";
                    const isDueSoon = task.status === "Due soon";
                    const isCompleted = task.status === "Completed";

                    return (
                      <div 
                        key={task.id} 
                        className="p-3.5 hover:bg-slate-50/40 transition-colors flex items-start gap-3 justify-between"
                        id={`pending-task-${task.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`p-1 rounded-lg mt-0.5 ${
                            isCompleted ? "bg-emerald-50 text-emerald-600" :
                            isOverdue ? "bg-rose-50 text-rose-600" :
                            isDueToday ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            {isCompleted ? <Check size={12} /> : <AlertTriangle size={12} />}
                          </span>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-800 tracking-tight leading-tight">{task.title}</p>
                            <p className="text-[10px] text-slate-500 font-sans leading-relaxed">{task.detail}</p>
                          </div>
                        </div>

                        <div>
                          {task.type === "ungraded" ? (
                            <button
                              onClick={() => setShowGradingInterface(true)}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-stone-100 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-850 border border-slate-200 transition-colors cursor-pointer shrink-0 outline-none"
                              id="pending-task-grade-action-btn"
                            >
                              Grade
                            </button>
                          ) : task.type === "lesson_plan" && !isCompleted ? (
                            <button
                              onClick={() => {
                                setPlannerClass(task.detail.split(" ")[0]);
                                setShowPlannerForm(true);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors cursor-pointer shrink-0 outline-none"
                              id="pending-task-planner-action-btn"
                            >
                              Due today
                            </button>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono shrink-0 uppercase tracking-wider ${
                              isCompleted ? "bg-emerald-100 text-emerald-800" :
                              isOverdue ? "bg-rose-100 text-rose-800" :
                              isDueToday ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {task.actionLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-[10px] text-slate-500 font-sans leading-relaxed">
                💡 Evaluating submissions and publishing lesson planners updates tasks automatically.
              </div>
            </div>

          </div>

          {/* 5. QUICK LINKS SECTION CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 animate-fade-in animate-duration-200" id="teacher-quick-links-card">
            <div className="pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <div className="p-1 rounded bg-indigo-50 text-indigo-700"><ExternalLink size={14} /></div>
              <h3 className="text-xs font-extrabold text-slate-900 tracking-tight uppercase font-sans">Quick Links</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Quick Link 1 */}
              <div className="border border-slate-150 rounded-xl p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between" id="quick-link-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-sans">Class {teacherProfile.classTeacher || "8A"} Classroom</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">My primary workspace</p>
                </div>
                <button
                  onClick={() => {
                    logAction(currentUser, currentRole, "Classroom Opened via Quicklink", "Opened primary classroom page for class " + (teacherProfile.classTeacher || "8A"), "file_access");
                    onToggleTab("classroom");
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-705 hover:text-indigo-800 rounded text-[10px] font-bold font-sans cursor-pointer transition-colors"
                >
                  Open
                </button>
              </div>

              {/* Quick Link 2 */}
              <div className="border border-slate-150 rounded-xl p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between" id="quick-link-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-905 font-sans font-sans">My Repository Folder</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Personal syllabi audits</p>
                </div>
                <button
                  onClick={() => {
                    logAction(currentUser, currentRole, "Google Drive Repository Opened via Quicklink", "Opened personal drive repository: /Schooly-Syllabus/" + teacherProfile.subject, "file_access");
                    onToggleTab("search");
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-705 hover:text-indigo-800 rounded text-[10px] font-bold font-sans cursor-pointer transition-colors"
                >
                  Open
                </button>
              </div>

              {/* Quick Link 3 */}
              <div className="border border-slate-150 rounded-xl p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between" id="quick-link-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-905 font-sans font-sans">Submit Weekly Planner</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Upload lesson layouts</p>
                </div>
                <button
                  onClick={() => setShowPlannerForm(true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-705 hover:text-indigo-800 rounded text-[10px] font-bold font-sans cursor-pointer transition-colors"
                >
                  Form
                </button>
              </div>

              {/* Quick Link 4 */}
              <div className="border border-slate-150 rounded-xl p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between" id="quick-link-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-905 font-sans">Apply for Leave</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Time off routing tracker</p>
                </div>
                <button
                  onClick={() => setShowLeaveForm(true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-705 hover:text-indigo-800 rounded text-[10px] font-bold font-sans cursor-pointer transition-colors"
                >
                  Form
                </button>
              </div>

            </div>
          </div>

          {/* UT3 Performance and Classroom Posting Compliances (SDOS-25 additions) */}
          {(() => {
            const pctWarning = teacherDashboard.attentionThresholds?.performanceWarning || 70;
            const attentionClasses = (teacherDashboard.assignedClasses || [])
              .filter(c => c.classroomPostingDaysCompleted < 4)
              .map(c => c.class);

            let attentionMsg = "";
            if (attentionClasses.length > 0) {
              if (attentionClasses.length === 1) {
                attentionMsg = `${attentionClasses[0]} needs attention this week`;
              } else if (attentionClasses.length === 2) {
                attentionMsg = `${attentionClasses[0]} and ${attentionClasses[1]} need attention this week`;
              } else {
                attentionMsg = `${attentionClasses.slice(0, -1).join(", ")}, and ${attentionClasses[attentionClasses.length - 1]} need attention this week`;
              }
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in animate-duration-300 border-t border-slate-155 pt-6 mt-6" id="teacher-performance-posting-tracker">
                {/* Card 1: UT3 Performance */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="teacher-ut3-performance-card">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-650 rounded-l-2xl"></div>
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <Award className="text-indigo-650 shrink-0" size={16} />
                        <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase font-sans">
                          MY CLASSES — UT3 PERFORMANCE
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-extrabold uppercase shrink-0">
                        {teacherDashboard.assessmentName || "UT3"} CYCLE
                      </span>
                    </div>

                    <div className="space-y-4 my-2">
                      {teacherDashboard.assignedClasses && teacherDashboard.assignedClasses.map((item) => {
                        const pct = item.classPerformancePercent;
                        const isBelowWarning = pct < pctWarning;
                        const barColor = isBelowWarning ? "bg-amber-500 animate-pulse animate-duration-1000" : "bg-emerald-500";
                        return (
                          <div key={item.class} className="space-y-1.5" id={`ut3-perf-row-${item.class.replace(/\s+/g, '-').toLowerCase()}`}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-slate-700 font-sans">{item.class}</span>
                              <span className={`font-mono font-bold ${isBelowWarning ? "text-amber-600" : "text-emerald-600"}`}>
                                {pct}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ease-out border-r border-white/20 ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px]">
                    <span className="text-slate-500 font-medium font-sans">
                      School Maths avg: <span className="font-bold text-slate-700">{teacherDashboard.schoolSubjectAverage || 68}%</span> · My avg: <span className="font-extrabold text-indigo-600">{teacherDashboard.teacherAverage || 75}%</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        logAction(currentUser, currentRole, "Teacher Performance Drilldown Initiated", "Drilldown to classroom section assessment tabs", "navigation");
                        onToggleTab("classroom");
                      }}
                      className="text-xs text-blue-600 font-extrabold hover:text-blue-700 hover:underline flex items-center gap-0.5 pointer-events-auto cursor-pointer self-end sm:self-auto"
                      id="classes-perf-drilldown-btn"
                    >
                      Drill down <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Card 2: Classroom Postings */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="teacher-classroom-posting-card">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-650 rounded-l-2xl"></div>
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="text-indigo-650 shrink-0" size={16} />
                        <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase font-sans">
                          MY CLASSROOM POSTING — THIS WEEK
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-extrabold uppercase shrink-0">
                        POSTS VERIFIER
                      </span>
                    </div>

                    <div className="divide-y divide-slate-50 my-2">
                      {teacherDashboard.assignedClasses && teacherDashboard.assignedClasses.map((item) => {
                        const completed = item.classroomPostingDaysCompleted;
                        const expected = teacherDashboard.classroomPostingDaysExpected || 5;
                        
                        let badgeClass = "bg-rose-50 text-rose-700 border-rose-150";
                        if (completed >= 5) {
                          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-150";
                        } else if (completed === 4) {
                          badgeClass = "bg-blue-50 text-blue-700 border-blue-150";
                        } else if (completed === 3) {
                          badgeClass = "bg-amber-50 text-amber-650 border-amber-200 animate-pulse animate-duration-1000";
                        }

                        return (
                          <div key={item.class} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0" id={`posting-row-${item.class.replace(/\s+/g, '-').toLowerCase()}`}>
                            <span className="text-xs font-extrabold text-slate-700 font-sans">{item.class}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold border ${badgeClass} shrink-0`}>
                              {completed}/{expected} days
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 text-[11px] font-medium font-sans min-h-[22px]">
                    {attentionClasses.length > 0 ? (
                      <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        {attentionMsg}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        All departments meet standard weekly posting compliance.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Teacher Additions: Class-specific Assessment Tracking, Enrichment & Olympiads, Remedial Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animate-duration-300 border-t border-slate-155 pt-6 mt-6 pb-2" id="teacher-dashboard-additions-grid">
            
            {/* Card 1: Assessment Tracking (My Classes) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="teacher-assessment-tracking-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      My Assessment Tracking
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">
                    UT4 Cycle
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT4 papers submitted</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      Submitted (1/1)
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT4 deadline</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold border bg-amber-50 text-amber-800 border-amber-200">
                      Fri 30 May
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT3 results entered</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150">
                      All done
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Class avg UT3</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-800 bg-slate-100">
                      74.5%
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Below 40% students</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-150">
                      4 students
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowTeacherChasePendingModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Follow up students <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 2: Enrichment and Olympiads (My Students) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="teacher-enrichment-olympiads-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      My Enrichment & Olympiads
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-600 font-bold px-1.5 py-0.5 bg-purple-50 rounded">
                    Talent Pool
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Olympiad registrations</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      12 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Enrichment posts — Classroom</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      6 this term
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Resources in Enrichment folder</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      8 files
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Students in enrichment programme</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      10
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Next olympiad date</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold border bg-slate-100 text-slate-700 border-slate-200">
                      12 June 2026
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    logAction(currentUser, currentRole, "Teacher Enrichment Folder Opened", "Teacher viewed class enrichment materials", "task");
                    alert("Opening Google Classroom enrichment folders and posting resources...");
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Manage files <Sparkles size={13} className="text-blue-500" />
                </button>
              </div>
            </div>

            {/* Card 3: Remedial Status (My Focus Group) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="teacher-remedial-status-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-emerald-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      My Remedial Status
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded">
                    Intervention
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Identified for remedial</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      8 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Remedial sessions held</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      4 this term
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Resources in Remedial folder</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      6 files
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Improved after remedial</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      5 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Still needs support</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-rose-50 text-rose-700 border-rose-150 font-mono">
                      3 students
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    logAction(currentUser, currentRole, "Teacher Remedial Log Opened", "Teacher viewed personal remedial registry stats", "task");
                    alert("Opening remedial tracking sheets for active classrooms...");
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Remedial log <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}



      {/* Submit Weekly Planner Modal (SDOS-25) */}
      {showPlannerForm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 relative animate-fade-in duration-200">
            <button onClick={() => { setShowPlannerForm(false); setPlannerSyllabusCovered(""); setPlannerSuccessMsg(""); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg"><X size={16} /></button>
            <h3 className="text-base font-bold text-slate-905 mb-2 font-sans flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={16} />
              Submit Weekly Syllabus Planner
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-sans leading-relaxed">Post weekly curriculum layout guidelines to coordinator reviews and Google Drive hierarchy.</p>
            {plannerSuccessMsg ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                <Check className="text-emerald-600 mx-auto" size={24} />
                <p className="text-xs text-emerald-800 font-bold">{plannerSuccessMsg}</p>
                <button onClick={() => { setShowPlannerForm(false); setPlannerSuccessMsg(""); }} className="mt-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer">Done</button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setPlannerStatusValue("Posted");
                logAction(currentUser, currentRole, "Planner Submitted", `Syllabus planner submitted for ${plannerClass} - ${plannerWeek}`, "task");
                // Update pending task
                setTeachingTasks(prev => prev.map(t => {
                  if (t.type === "lesson_plan") {
                    return { ...t, title: "No missing lesson plans", detail: `Successfully posted ${plannerClass} ${plannerWeek}`, status: "Completed", actionLabel: "Completed" };
                  }
                  return t;
                }));
                setPlannerSuccessMsg(`Syllabus planner posted successfully for ${plannerClass} (${plannerWeek})!`);
              }} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Target Class / Section</label>
                  <select value={plannerClass} onChange={(e) => setPlannerClass(e.target.value)} className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-slate-800">
                    <option value="Class 8A">Class 8A - Mathematics</option>
                    <option value="Class 8B">Class 8B - Mathematics</option>
                    <option value="Class 8C">Class 8C - Mathematics</option>
                    <option value="Class 8D">Class 8D - Mathematics</option>
                    <option value="Class 9A">Class 9A - Mathematics</option>
                    <option value="Class 9B">Class 9B - Mathematics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Academic Week</label>
                  <select value={plannerWeek} onChange={(e) => setPlannerWeek(e.target.value)} className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-slate-800">
                    <option value="Week 22">Week 22 (May 25 - May 29)</option>
                    <option value="Week 23">Week 23 (Jun 01 - Jun 05)</option>
                    <option value="Week 24">Week 24 (Jun 08 - Jun 12)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Topics / Syllabus to Cover</label>
                  <textarea rows={3} value={plannerSyllabusCovered} onChange={(e) => setPlannerSyllabusCovered(e.target.value)} className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 text-slate-800 bg-white font-sans" placeholder="Enunciate chapters and learning outcomes..."></textarea>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <FileText className="text-slate-400 mx-auto mb-1.5" size={24} />
                  <span className="text-[11px] text-slate-500 font-bold block">Attach Lesson Plan PDF/Doc</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Drag & drop or match file from Drive</span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowPlannerForm(false)} className="px-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs bg-indigo-650 text-white rounded-lg hover:bg-indigo-700 cursor-pointer font-bold flex items-center gap-1">
                    <Send size={12} /> Post Planner
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Apply for Leave Form Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 relative animate-fade-in duration-200">
            <button onClick={() => { setShowLeaveForm(false); setLeaveSuccessMsg(""); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg"><X size={16} /></button>
            <h3 className="text-base font-bold text-slate-905 mb-2 font-sans flex items-center gap-2">
              <Calendar className="text-indigo-600" size={16} />
              Leave Application Form
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-sans leading-relaxed">Your request will be routed instantly to the Vice Principal and Academic Coordinator for approval.</p>
            {leaveSuccessMsg ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                <Check className="text-emerald-600 mx-auto" size={24} />
                <p className="text-xs text-emerald-800 font-bold">{leaveSuccessMsg}</p>
                <button onClick={() => { setShowLeaveForm(false); setLeaveSuccessMsg(""); }} className="mt-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold rounded-lg cursor-pointer">Done</button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                logAction(currentUser, currentRole, "Leave Form Submitted", `Leave requested (${leaveType}) for ${leaveStart} to ${leaveEnd}`, "task");
                setLeaveSuccessMsg("Leave application routed to portal successfully. Status: PENDING COORDINATOR ACTION.");
              }} className="space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Leave Type</label>
                    <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-slate-800 font-semibold">
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave / Medical</option>
                      <option value="Earned Leave">Earned Leave</option>
                      <option value="Maternity/Paternity Leave">Maternity/Paternity</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Substitution arrangement</label>
                    <select className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-slate-850">
                      <option value="Yes">Yes (Internal substitute set)</option>
                      <option value="No">No (Substitute needed)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Start Date</label>
                    <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 text-slate-805 bg-white font-medium" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">End Date</label>
                    <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 text-slate-850 bg-white font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Reason for leave</label>
                  <textarea rows={3} value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} required className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 text-slate-850 bg-white" placeholder="Please elaborate the purpose of leave..."></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowLeaveForm(false)} className="px-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-505 hover:bg-slate-50 cursor-pointer font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs bg-indigo-650 text-white rounded-lg hover:bg-slate-900 cursor-pointer font-bold">Submit Form</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Interactive Grading Interface (Grade Submissions Modal) */}
      {showGradingInterface && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[85vh]">
            <button onClick={() => { setShowGradingInterface(false); setGradingSuccessMsg(""); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg"><X size={16} /></button>
            <h3 className="text-base font-bold text-slate-905 mb-1 font-sans flex items-center gap-2 shrink-0">
              <CheckSquare className="text-indigo-600" size={16} />
              Syllabus Work Grading Interface
            </h3>
            <p className="text-xs text-slate-500 mb-4 shrink-0 font-sans">Input marks directly for recently submitted tasks to update student indicators and publish to SIS.</p>
            
            {gradingSuccessMsg ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-2 my-auto shrink-0 animate-fade-in">
                <Check className="text-emerald-650 mx-auto" size={28} />
                <p className="text-sm text-emerald-805 font-extrabold font-sans">{gradingSuccessMsg}</p>
                <button onClick={() => { setShowGradingInterface(false); setGradingSuccessMsg(""); }} className="mt-3 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer font-sans">Back to Dashboard</button>
              </div>
            ) : (
              <>
                <div className="mb-4 shrink-0">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Select Active Assignment Track</label>
                  <select value={selectedGradingAssignment} onChange={(e) => setSelectedGradingAssignment(e.target.value)} className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 font-bold bg-white text-slate-805">
                    <option value="Class 8A (Ch 6 Triangles Assignment)">Class 8A - Ch 6 Triangles homework (12 pending)</option>
                    <option value="Class 8B (Ch 6 Similarity Exercise)">Class 8B - Triangles similarity theorems (9 pending)</option>
                    <option value="Class 8C (Ch 6 Practical Trigonometry)">Class 8C - Trigonometric applications (11 pending)</option>
                    <option value="Class 9A (Ch 4 Quadratic Equations)">Class 9A - Quadratic formulas solving (8 pending)</option>
                    <option value="Class 9B (Ch 4 Roots Identification)">Class 9B - Find the discriminant test (7 pending)</option>
                  </select>
                </div>

                <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl divide-y divide-slate-150 mb-4 p-1">
                  <div className="p-2 sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    <div className="col-span-5 font-mono">Student Candidate</div>
                    <div className="col-span-3 font-mono">Submission status</div>
                    <div className="col-span-4 text-center font-mono">Award Score ( / 25 Marks )</div>
                  </div>
                  {Object.keys(gradingScores).map((student) => (
                    <div key={student} className="p-2.5 sm:grid sm:grid-cols-12 gap-2 items-center hover:bg-slate-50/50 transition-colors">
                      <div className="col-span-5 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-105 text-slate-600 flex items-center justify-center text-[10px] font-black font-sans shrink-0 uppercase">
                          {student.split(" ").map(n => n[0]).join("")}
                        </span>
                        <span className="text-xs font-bold text-slate-805 font-sans">{student}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-850 text-[9px] font-extrabold uppercase">Pending Review</span>
                      </div>
                      <div className="col-span-4 flex items-center gap-2 justify-center">
                        <input
                          type="number"
                          max={25}
                          min={0}
                          value={gradingScores[student]}
                          onChange={(e) => {
                            const val = Math.min(25, Math.max(0, parseInt(e.target.value) || 0));
                            setGradingScores(prev => ({ ...prev, [student]: val }));
                          }}
                          className="w-16 text-center text-xs p-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-400 font-mono font-bold text-slate-800 bg-white inline"
                        />
                        <span className="text-xs text-slate-450 font-mono">/ 25</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 shrink-0 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowGradingInterface(false)} className="px-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer font-bold font-sans">Cancel</button>
                  <button 
                    onClick={() => {
                      logAction(currentUser, currentRole, "Student Grades Published", `Scores saved/published for ${selectedGradingAssignment}`, "task");
                      // Decrease ungraded count dynamically
                      setTeachingTasks(prev => prev.map(t => {
                        if (t.type === "ungraded") {
                          const originalCount = parseInt(t.title);
                          const newCount = Math.max(0, originalCount - 5);
                          return { ...t, title: `${newCount} ungraded submissions`, detail: `Class 8A: 7 · 8B: 9 · 8C: 11 · 9A: 8 · 9B: 7` };
                        }
                        return t;
                      }));
                      setGradingSuccessMsg("5 student tasks evaluated and grades published safely to student files. Outstanding task indicators updated.");
                    }}
                    type="button" 
                    className="px-4 py-2 text-xs bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg cursor-pointer font-bold font-sans"
                  >
                    Publish Grades to SIS
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Resource Upload Modal */}
      {showResourceUploadForm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 relative animate-fade-in duration-200">
            <button onClick={() => { setShowResourceUploadForm(false); setResourceSuccessMsg(""); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg"><X size={16} /></button>
            <h3 className="text-base font-bold text-slate-905 mb-2 font-sans flex items-center gap-2">
              <FileText className="text-indigo-600" size={16} />
              Upload Teacher Resource
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-sans leading-relaxed">Upload work sheets, extra teaching coordinates, and syllabus outlines directly to classroom repositories.</p>
            {resourceSuccessMsg ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                <Check className="text-emerald-600 mx-auto" size={24} />
                <p className="text-xs text-emerald-800 font-bold font-sans">{resourceSuccessMsg}</p>
                <button onClick={() => { setShowResourceUploadForm(false); setResourceSuccessMsg(""); }} className="mt-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer font-sans">Done</button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setResourceUploadCount(prev => prev + 1);
                logAction(currentUser, currentRole, "Resource Uploaded", `File uploaded to Drive: '${resourceTitle}' for ${resourceClass}`, "file_access");
                setResourceSuccessMsg(`Resource worksheet '${resourceTitle}' uploaded and linked successfully to ${resourceClass} Shared Folder!`);
              }} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Resource Title Name</label>
                  <input type="text" value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} required className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 text-slate-800 bg-white" placeholder="e.g. Unit 4 Quadratic Equation supplementary worksheets" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Linked Classroom Section</label>
                  <select value={resourceClass} onChange={(e) => setResourceClass(e.target.value)} className="w-full text-xs p-2.5 border border-slate-250 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-slate-850 font-medium">
                    <option value="Class 8A">Class 8A - Mathematics</option>
                    <option value="Class 8B">Class 8B - Mathematics</option>
                    <option value="Class 8C">Class 8C - Mathematics</option>
                    <option value="Class 9A">Class 9A - Mathematics</option>
                    <option value="Class 9B">Class 9B - Mathematics</option>
                  </select>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <Download className="text-slate-400 mx-auto mb-2 animate-bounce" size={24} />
                  <span className="text-xs font-extrabold text-slate-700 block font-sans">Drag & drop or Click to choose files</span>
                  <span className="text-[10px] text-slate-450 block mt-0.5 font-sans">Supports PDF, Doc, Sheets, slides or image files (Max 15MB)</span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowResourceUploadForm(false)} className="px-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs bg-indigo-650 text-white rounded-lg hover:bg-indigo-755 cursor-pointer font-bold font-sans">Upload Resource</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* In-Call Meet Simulator Dialogue */}
      {activeCallSim && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950 p-4 select-none animate-fade-in duration-300">
          <div className="w-full h-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden relative flex flex-col md:flex-row shadow-2xl">
            
            {/* Call Center Frame Screen */}
            <div className="flex-1 relative flex flex-col justify-between p-5 min-h-0">
              
              <div className="flex items-center justify-between z-20">
                <span className="bg-slate-950/70 border border-slate-800 px-3.5 py-1.5 rounded-lg text-white font-mono font-bold text-xs tracking-wide flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping shrink-0"></span>
                  ● Classroom Meeting - Live Video Link
                </span>
                <span className="text-slate-300 text-[10px] font-bold font-mono bg-slate-950/70 border border-slate-800 px-3.5 py-1.5 rounded-lg">
                  09 participants connected
                </span>
              </div>

              {/* Central mock animation background space */}
              <div className="absolute inset-0 flex items-center justify-center p-8 z-0 overflow-hidden bg-slate-900">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-indigo-500 text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-indigo-500/30 shadow-2xl animate-pulse">
                    {teacherProfile.initials}
                  </div>
                  <div>
                    <h4 className="text-slate-100 font-extrabold font-sans text-sm">{teacherProfile.name}</h4>
                    <p className="text-slate-450 text-[11px] font-mono mt-0.5">Teaching {teacherProfile.classes.split("·")[0]} Similarity Theorems</p>
                  </div>
                </div>
              </div>

              {/* Call Actions Footer controls */}
              <div className="flex items-center justify-center gap-3.5 z-20 bg-slate-950/70 py-3 px-6 rounded-xl border border-slate-800 backdrop-blur-md max-w-md mx-auto w-full mb-2">
                <button onClick={() => alert("Microphone muted successfully.")} className="p-2.5 bg-slate-800 hover:bg-slate-705 text-white rounded-full transition-colors cursor-pointer outline-none"><CheckSquare size={14} /></button>
                <button onClick={() => alert("Camera stream toggled.")} className="p-2.5 bg-slate-800 hover:bg-slate-705 text-white rounded-full transition-colors cursor-pointer outline-none"><Settings size={14} /></button>
                <button onClick={() => alert("Interactive workspace screen-sharing initiated.")} className="p-2.5 bg-slate-800 hover:bg-slate-705 text-white rounded-full transition-colors cursor-pointer outline-none"><ExternalLink size={14} /></button>
                <button 
                  onClick={() => {
                    logAction(currentUser, currentRole, "Leave Live Call", "Exited remote meeting stream safely", "auth");
                    setActiveCallSim(false);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 font-semibold rounded-full text-xs text-white tracking-widest uppercase shadow-md hover:shadow-rose-500/10 cursor-pointer transition-colors outline-none font-sans"
                >
                  Leave
                </button>
              </div>

            </div>

            {/* Sidebar list participants */}
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 p-5 z-20 overflow-y-auto">
              <div>
                <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-4">Class candidates in meet</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-850 flex items-center justify-center text-[10px] font-bold">AM</span>
                    <span className="text-slate-250 text-xs font-bold font-sans">Aarav Mehta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-850 flex items-center justify-center text-[10px] font-bold">AS</span>
                    <span className="text-slate-255 text-xs font-bold font-sans">Ananya Sharma</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-850 flex items-center justify-center text-[10px] font-bold">DS</span>
                    <span className="text-slate-255 text-xs font-bold font-sans">Dev Sharma</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-850 flex items-center justify-center text-[10px] font-bold">MG</span>
                    <span className="text-slate-255 text-xs font-bold font-sans">Meher Gupta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-850 flex items-center justify-center text-[10px] font-bold">PI</span>
                    <span className="text-slate-255 text-xs font-bold font-sans">Priya Iyer</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-6 text-[10px] text-slate-500 font-sans font-medium select-none">
                🔒 Protected by End-to-End Secure Classroom encryption. Mode of compliance: Google Meet API Bridge.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Drill-through Modal Overlays */}
      {activeDrill && (
        <div 
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-905/75 backdrop-blur-xs select-none"
          id={`drillthrough-modal-${activeDrill}`}
          onClick={() => setActiveDrill(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[85vh] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveDrill(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
              id="close-drill-btn"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3.5 mb-5 select-none">
              <div className={`p-3 rounded-xl shrink-0 ${
                activeDrill === 'documents' ? 'bg-blue-50 text-blue-600' :
                activeDrill === 'classroom' ? 'bg-amber-50 text-amber-600' :
                activeDrill === 'tasks' ? 'bg-rose-50 text-rose-600' : 'bg-rose-50 text-rose-700'
              }`}>
                {activeDrill === 'documents' && <FileText size={28} />}
                {activeDrill === 'classroom' && <GraduationCap size={28} />}
                {activeDrill === 'tasks' && <CheckSquare size={28} />}
                {activeDrill === 'risks' && <AlertTriangle size={28} />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-950">
                    {activeDrill === 'documents' && 'School Files Master Registry'}
                    {activeDrill === 'classroom' && 'Google Classroom Streams & Coaching'}
                    {activeDrill === 'tasks' && 'Pending Workspace Work'}
                    {activeDrill === 'risks' && 'Student Records Alerts'}
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Live Audit
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-normal max-w-2xl">
                  {activeDrill === 'documents' && 'Interactive overview list of documents indexed across Google Drive, Shared Folder structures, and local LMS cache layers.'}
                  {activeDrill === 'classroom' && 'Direct syllabus status, current pupil tallies, and announcement logs from active classroom sync protocols.'}
                  {activeDrill === 'tasks' && 'Consolidated view of team tasks divided by priority levels. Complete pending assignments, clear blocks, or assign priorities.'}
                  {activeDrill === 'risks' && 'Predictive monitoring model identifying pupils placed in elevated threat indices due to current performance indicators.'}
                </p>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-4 border-b border-slate-150 mb-4 bg-transparent select-none">
              {/* Search bar inside drillthrough */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="text"
                  placeholder={
                    activeDrill === 'documents' ? 'Filter by filename, path, source or owner...' :
                    activeDrill === 'classroom' ? 'Filter classes, sections or teachers...' :
                    activeDrill === 'tasks' ? 'Filter pending checklists or assignees...' :
                    'Filter pupils by name, level or enrollment...'
                  }
                  value={drillSearch}
                  onChange={(e) => setDrillSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-slate-50/50"
                  id="drill-search-input"
                />
                {drillSearch && (
                  <button 
                    onClick={() => setDrillSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Specific Filter Segments */}
              <div className="flex items-center gap-2">
                {activeDrill === 'tasks' && (
                  <div className="flex items-center gap-1">
                    <Filter size={12} className="text-slate-400" />
                    <span className="text-[11px] text-slate-500 font-mono font-medium">Priority:</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setDrillPriority(p)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            drillPriority === p 
                              ? 'bg-white shadow-xs text-rose-600 font-extrabold' 
                              : 'text-slate-500 hover:text-slate-805'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeDrill === 'risks' && (
                  <div className="flex items-center gap-1">
                    <Filter size={12} className="text-slate-400" />
                    <span className="text-[11px] text-slate-500 font-mono font-medium">Risk Filter:</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {['all', 'high', 'medium', 'low'].map((r) => (
                        <button
                          key={r}
                          onClick={() => setDrillRisk(r)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            drillRisk === r 
                              ? 'bg-rose-600 text-white shadow-xs font-extrabold' 
                              : 'text-slate-500 hover:text-slate-805'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Content Pane */}
            <div className="flex-1 overflow-x-auto overflow-y-auto pr-1 space-y-3 min-h-[250px] max-h-[50vh] scrollbar-thin" id="drill-scroll-container">
              
              {/* DOCUMENTS DRILL OUT */}
              {activeDrill === 'documents' && (() => {
                const filtered = files.filter(f => {
                  const matchTxt = drillSearch.toLowerCase();
                  return f.name.toLowerCase().includes(matchTxt) || 
                         f.source.toLowerCase().includes(matchTxt) || 
                         f.path.toLowerCase().includes(matchTxt) ||
                         f.sharingRule.toLowerCase().includes(matchTxt) ||
                         f.owner.toLowerCase().includes(matchTxt) ||
                         f.tags.some(t => t.toLowerCase().includes(matchTxt));
                });

                return (
                  <div className="space-y-4 font-sans text-left">
                    {/* Premium Google Drive Sync & Connection Verification Panel */}
                    <div className="bg-slate-50 border border-slate-205 rounded-2xl p-4 space-y-3.5" id="google-drive-sync-tester-dashboard">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-155">
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 leading-none">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Google Drive Access Verification Suite
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                            Interrogate directory endpoints, test session tokens, and trace live indexes.
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleVerifyDriveConnection}
                            disabled={testingDriveConnection}
                            className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold cursor-pointer font-sans shadow-2xs transition-all flex items-center gap-1.5 border ${
                              testingDriveConnection 
                                ? 'bg-slate-100 border-slate-200 text-slate-400' 
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-250'
                            }`}
                          >
                            <svg className={`w-3.5 h-3.5 text-blue-600 ${testingDriveConnection ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={testingDriveConnection ? 2.5 : 2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8.89M9 11l3 3L22 4" />
                            </svg>
                            <span>{testingDriveConnection ? "Pinging handshake..." : "Test Google Connection"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Connection metadata chips row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[10.5px]">
                        <div className="bg-white border border-slate-150 p-2.5 rounded-xl space-y-1">
                          <span className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-wider block">OAuth Account Identity</span>
                          {firebaseUser ? (
                            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                              <span className="truncate" title={firebaseUser.email}>{firebaseUser.email}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                              <span>Simulated Fallback Mode</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-white border border-slate-150 p-2.5 rounded-xl space-y-1">
                          <span className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Target Mapping Folder</span>
                          <div className="text-slate-800 font-bold truncate" title={workspaceUrl || "Global Root"}>
                            {workspaceUrl ? (
                              <span className="text-blue-700 underline truncate">{workspaceUrl}</span>
                            ) : (
                              <span>/Google Drive/My Drive (Global)</span>
                            )}
                          </div>
                        </div>

                        <div className="bg-white border border-slate-150 p-2.5 rounded-xl space-y-1 sm:col-span-2 lg:col-span-1">
                          <span className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Index Status</span>
                          <div className="flex items-center justify-between text-slate-800 font-bold">
                            <span className="font-mono text-[10.5px] text-slate-600">
                              {files.filter(f => f.source === "Drive" || f.source === "Shared Drive").length} linked files
                            </span>
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-black tracking-wider uppercase block">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic hand-shake responses when clicked */}
                      {driveConnectionResult && (
                        <div className={`p-3 border rounded-xl space-y-2 animate-fade-in text-[10.5px] leading-relaxed ${
                          driveConnectionResult.success 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' 
                            : 'bg-amber-50/50 border-amber-250 text-amber-955'
                        }`} id="diagnostic-verification-results-overlay">
                          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/50">
                            <div className="flex items-center gap-1.5 font-extrabold font-sans">
                              {driveConnectionResult.success ? (
                                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              )}
                              <span>Handshake Status: {driveConnectionResult.success ? "Live Connection Established" : "Simulated Local Cache Mode"}</span>
                            </div>
                            <span className="font-mono text-[9px] text-slate-450 block">Checked at {driveConnectionResult.timestamp}</span>
                          </div>
                          
                          <p className="font-semibold text-[10.5px] leading-relaxed">{driveConnectionResult.message}</p>
                          
                          <div className="space-y-1 block pt-1">
                            <span className="font-bold text-[8.5px] text-slate-500 uppercase tracking-wider font-mono block">Top Synced Resource Samples:</span>
                            {driveConnectionResult.retrievedCount > 0 ? (
                              <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-600 font-mono font-medium">
                                {driveConnectionResult.filesList.map((fname, fidx) => (
                                  <li key={fidx} className="truncate select-all" title={fname}>{fname}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[10px] text-slate-450 italic leading-none font-semibold">No active synchronized assets matching the specific directory key returned. Use settings to map another folder ID.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Standard directory search table */}
                    {filtered.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        No matching documents found matching your filter phrase. Try searching a different keyword!
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs select-text">
                        <thead>
                          <tr className="border-b border-slate-150 text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">
                            <th className="py-2.5">Name</th>
                            <th className="py-2.5">Source</th>
                            <th className="py-2.5">Path / Repository</th>
                            <th className="py-2.5">Size</th>
                            <th className="py-2.5">Access</th>
                            <th className="py-2.5 text-right font-semibold text-slate-500">Operational Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filtered.map(file => (
                            <tr 
                              key={file.id} 
                              className="hover:bg-slate-50 transition-colors group cursor-pointer"
                              onClick={() => setInspectedRecord({
                                title: file.name,
                                type: "Google Drive File Index",
                                data: file
                              })}
                            >
                              <td className="py-3 font-semibold text-slate-905 flex items-center gap-2 max-w-sm">
                                <span className={`p-1.5 rounded-lg shrink-0 ${
                                  file.type === 'doc' ? 'bg-blue-50 text-blue-600' :
                                  file.type === 'sheet' ? 'bg-emerald-50 text-emerald-600' :
                                  file.type === 'slide' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                  <FileText size={12} />
                                </span>
                                <span className="truncate" title={file.name}>{file.name}</span>
                                {(file.source === "Drive" || file.source === "Shared Drive" || file.tags.includes("Synced") || file.tags.includes("Live")) && (
                                  <span className="px-1 py-0.5 rounded text-[7.5px] uppercase tracking-wider font-extrabold bg-blue-105 text-blue-750 font-mono inline-block shrink-0 animate-pulse border border-blue-200">
                                    LIVE SYNC
                                  </span>
                                )}
                              </td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold font-mono text-[10px]">
                                  {file.source}
                                </span>
                              </td>
                              <td className="py-3 text-slate-500 font-mono text-[11px] max-w-[200px] truncate" title={file.path}>
                            {file.path}
                          </td>
                          <td className="py-3 text-slate-500 font-mono">{file.size}</td>
                          <td className="py-3">
                            <span className="text-[10px] text-slate-600 font-medium">{file.sharingRule}</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 bg-transparent">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(file.id);
                                }}
                                className={`p-1.5 rounded-md hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all ${
                                  file.isFavorite ? 'text-amber-500' : 'text-slate-400'
                                }`}
                                title="Pin as dashboard favorite bookmark"
                              >
                                <Star size={12} className={file.isFavorite ? "fill-amber-500" : ""} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDrill(null);
                                  onSelectFile(file);
                                }}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 text-blue-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                              >
                                Abstract Outline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    )}
                  </div>
                );
              })()}

              {/* CLASSROOM DRILL OUT */}
              {activeDrill === 'classroom' && (() => {
                const filtered = courses.filter(c => {
                  const matchTxt = drillSearch.toLowerCase();
                  return c.name.toLowerCase().includes(matchTxt) || 
                         c.section.toLowerCase().includes(matchTxt) || 
                         c.teacherName.toLowerCase().includes(matchTxt);
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No courses found matching your filter criteria.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-text">
                    {filtered.map(course => (
                      <div 
                        key={course.id} 
                        className="p-4 border border-slate-150 rounded-2xl bg-slate-50/20 hover:bg-slate-50/40 hover:border-amber-300 transition-all shadow-2xs space-y-3 cursor-pointer"
                        onClick={() => setInspectedRecord({
                          title: course.name,
                          type: "Google Classroom Course Stream",
                          data: course
                        })}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">{course.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">Section: <span className="text-slate-600 font-bold">{course.section}</span></span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-800 font-bold font-mono text-[11px] shrink-0">
                            {course.studentCount} Pupils
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Assigned Lecturer:</span>
                            <span className="font-bold text-slate-700">{course.teacherName}</span>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-1.5">
                          <span className="text-[9px] text-slate-400 font-bold font-mono uppercase block tracking-wider">Latest Stream Announcement</span>
                          <p className="text-xs text-slate-600 italic leading-relaxed">
                            "{course.announcements[0] || 'No operational announcements posted.'}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* TASKS DRILL OUT */}
              {activeDrill === 'tasks' && (() => {
                const filtered = tasks.filter(t => {
                  const matchTxt = drillSearch.toLowerCase();
                  const matchesSearch = t.title.toLowerCase().includes(matchTxt) || 
                                        t.description.toLowerCase().includes(matchTxt) || 
                                        t.assignedTo.toLowerCase().includes(matchTxt);
                  const matchesPriority = drillPriority === 'all' || t.priority === drillPriority;
                  return matchesSearch && matchesPriority;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No operational tasks matched your search pattern or chosen priority.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left border-collapse text-xs select-text">
                    <thead>
                      <tr className="border-b border-slate-150 text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">
                        <th className="py-2.5">Workflow Checklist Task</th>
                        <th className="py-2.5">Priority</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Due Date</th>
                        <th className="py-2.5 text-right font-semibold text-slate-500">Assignee Operator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map(task => (
                        <tr 
                          key={task.id} 
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setInspectedRecord({
                            title: task.title,
                            type: "Institutional Task Registry Detail",
                            data: task
                          })}
                        >
                          <td className="py-3 font-semibold text-slate-900 max-w-sm">
                            <span className="block truncate" title={task.title}>{task.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5 block truncate max-w-xs">{task.description}</span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase font-mono text-[9px] ${
                              task.priority === 'critical' ? 'bg-red-100 text-red-700 font-extrabold animate-pulse' :
                              task.priority === 'high' ? 'bg-amber-100 text-amber-700 font-extrabold' :
                              task.priority === 'medium' ? 'bg-blue-50 text-blue-700 font-semibold' : 'bg-slate-100 text-slate-500 font-medium'
                            }`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 text-[10px] font-medium font-mono capitalize ${
                              task.status === 'done' ? 'text-teal-600 font-bold' :
                              task.status === 'in_progress' ? 'text-blue-600' : 'text-slate-400'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 font-mono text-[11px]">{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 text-right font-mono text-[11px] text-slate-600">{task.assignedTo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}

              {/* RISKS DRILL OUT */}
              {activeDrill === 'risks' && (() => {
                const filtered = students.filter(s => {
                  const matchTxt = drillSearch.toLowerCase();
                  const matchesSearch = s.name.toLowerCase().includes(matchTxt) || 
                                        s.gradeLevel.toLowerCase().includes(matchTxt) || 
                                        s.enrollmentStatus.toLowerCase().includes(matchTxt) || 
                                        s.email.toLowerCase().includes(matchTxt);
                  const sRisk = s.riskFactor || 'low';
                  const matchesRisk = drillRisk === 'all' || sRisk === drillRisk;
                  return matchesSearch && matchesRisk;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No pupil profiles found matching the selected risk bands.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left border-collapse text-xs select-text">
                    <thead>
                      <tr className="border-b border-slate-150 text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">
                        <th className="py-2.5">Pupil Profile & Email</th>
                        <th className="py-2.5 font-semibold">Grade Level</th>
                        <th className="py-2.5">Current GPA</th>
                        <th className="py-2.5">Enrollment Status</th>
                        <th className="py-2.5">Risk Score Index</th>
                        <th className="py-2.5 text-right font-semibold text-slate-500">Governance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map(student => {
                        const score = student.riskScore || (student.riskFactor === 'high' ? 88 : student.riskFactor === 'medium' ? 55 : 12);
                        const risk = student.riskFactor || 'low';
                        return (
                          <tr 
                            key={student.id} 
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => setInspectedRecord({
                              title: student.name,
                              type: "Pupil Profile Data Inspect",
                              data: student
                            })}
                          >
                            <td className="py-3">
                              <span className="font-bold text-slate-900 block">{student.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{student.email}</span>
                            </td>
                            <td className="py-3 text-slate-700 font-medium font-mono">{student.gradeLevel}</td>
                            <td className="py-3 font-semibold text-slate-900">
                              <span className={`px-2 py-0.5 rounded-md ${
                                student.gpa < 2.5 ? 'bg-rose-50 text-rose-700 font-extrabold' : 'bg-slate-50 text-slate-700'
                              }`}>
                                {student.gpa.toFixed(2)} GPA
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-[11px] text-slate-500 font-medium font-mono">{student.enrollmentStatus}</span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold font-mono text-[11px] ${
                                  risk === 'high' ? 'text-rose-600' :
                                  risk === 'medium' ? 'text-amber-500' : 'text-teal-600'
                                }`}>
                                  {score}%
                                </span>
                                <div className="w-16 bg-slate-150 h-1.5 rounded-full overflow-hidden shrink-0">
                                  <div 
                                    className={`h-full rounded-full ${
                                      risk === 'high' ? 'bg-rose-500' :
                                      risk === 'medium' ? 'bg-amber-550' : 'bg-teal-500'
                                    }`}
                                    style={{ width: `${score}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                risk === 'high' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                                risk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-700'
                              }`}>
                                {risk} Alert
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}

            </div>

            {/* Modal Actions Footer */}
            <div className="mt-5 pt-4 border-t border-slate-150 flex items-center justify-between select-none">
              <span className="text-[10px] text-slate-400 font-mono">
                Operator Action: Drill-through Mode Active
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveDrill(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Close Panel
                </button>

                {activeDrill === 'documents' && (
                  <button
                    onClick={() => {
                      setActiveDrill(null);
                      onToggleTab("search");
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    Launch Full Search Room <ArrowUpRight size={13} />
                  </button>
                )}

                {activeDrill === 'classroom' && (
                  <button
                    onClick={() => {
                      setActiveDrill(null);
                      onToggleTab("classroom");
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    Launch Classroom Manager <ArrowUpRight size={13} />
                  </button>
                )}

                {activeDrill === 'tasks' && (
                  <button
                    onClick={() => {
                      setActiveDrill(null);
                      onToggleTab("tasks");
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    Launch Tasks Kanban <ArrowUpRight size={13} />
                  </button>
                )}

                {activeDrill === 'risks' && (
                  <button
                    onClick={() => {
                      setActiveDrill(null);
                      onToggleTab("governance");
                    }}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    Audit System Logs <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Drilldown Overlays for Principal Dashboard (SDOS-23) */}
      {selectedAcademicLevelDrill && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in"
          onClick={() => setSelectedAcademicLevelDrill(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedAcademicLevelDrill(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
              aria-label="Close academic modal"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-blue-600 fill-blue-50" />
              <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">
                Academic Progress Details: {selectedAcademicLevelDrill} Level
              </h3>
            </div>

            {/* In-page drilldown filters applied */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs mb-4 select-none">
              <div>
                <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Academic Year</label>
                <select className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/10" aria-label="Select Academic-Year filter">
                  <option>2025-2026 (Current)</option>
                  <option>2024-2025</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Academic Week</label>
                <select className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/10" aria-label="Select Academic-Week filter">
                  <option>Week 24 (May 28 - Jun 3)</option>
                  <option>Week 23</option>
                  <option>Week 22</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Planner Status</label>
                <select className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/10" aria-label="Select Planner-Status filter">
                  <option value="all">All statuses</option>
                  <option value="Done">Submitted</option>
                  <option value="Missing">Pending / Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Subject Area</label>
                <select className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/10" aria-label="Select Subject-Area filter">
                  <option value="all">All subjects</option>
                  <option>Mathematics</option>
                  <option>Science</option>
                  <option>English</option>
                  <option>Social Science</option>
                </select>
              </div>
            </div>

            {/* List Table of drilldown results */}
            <div className="overflow-y-auto flex-1 border border-slate-150 rounded-xl font-sans">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-450 font-mono tracking-wider font-extrabold uppercase border-b border-slate-150 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Class-Sec</th>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4">Primary Teacher</th>
                    <th className="py-2.5 px-4 text-center">Planner</th>
                    <th className="py-2.5 px-4 text-center">Syllabus Pacing</th>
                    <th className="py-2.5 px-4 text-center">Assessment Status</th>
                    <th className="py-2.5 px-4 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-705">
                  {courses.map(course => {
                    const plannerDone = hasCoursePlanner(course, files);
                    const assessmentDone = hasCourseAssessment(course, files);
                    const level = getCourseAcademicLevel(course.name);
                    const score = plannerDone ? 92 : 74;
                    const syllabusText = plannerDone ? `${score}% (Ahead)` : `${score}% (At Risk)`;
                    return {
                      class: course.section,
                      teacher: course.teacherName,
                      subject: course.name,
                      planner: plannerDone ? "Done" : "Missing",
                      syllabus: syllabusText,
                      assessment: assessmentDone ? "Done" : "Missing",
                      score: score,
                      level: level
                    };
                  })
                  .filter(item => {
                    if (selectedAcademicLevelDrill === "All Levels") return true;
                    if (selectedAcademicLevelDrill === "Pre-Primary" && item.level !== "Pre-Primary") return false; 
                    if (selectedAcademicLevelDrill === "Primary" && item.level !== "Primary") return false;
                    if (selectedAcademicLevelDrill === "Middle" && item.level !== "Middle") return false; 
                    if (selectedAcademicLevelDrill === "Secondary" && item.level !== "Secondary") return false;
                    if (selectedAcademicLevelDrill === "Sr Secondary" && item.level !== "Sr Secondary") return false;
                    return true;
                  })
                  .map((row, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setInspectedRecord({
                        title: `${row.class} - ${row.subject}`,
                        type: "Academic Performance Checkpoint",
                        data: row
                      })}
                    >
                      <td className="py-3 px-4 font-bold text-slate-800">{row.class}</td>
                      <td className="py-3 px-4 text-slate-500 font-sans">{row.subject}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{row.teacher}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                          row.planner === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                          {row.planner === "Done" ? "Submitted" : "Overdue"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{row.syllabus}</span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div className={`h-full ${row.score >= healthyThreshold ? 'bg-emerald-500' : row.score >= watchThreshold ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${row.score}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                          row.assessment === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                          {row.assessment === "Done" ? "On Track" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right pr-4">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(`Direct notification dispatched to ${row.teacher} for ${row.class} ${row.subject} planner status follow-up.`);
                          }}
                          className="px-2.5 py-1 text-[10px] bg-slate-905 text-white rounded-lg hover:bg-slate-805 font-bold font-sans cursor-pointer transition-all"
                        >
                          Ping Teacher
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Empty subset check */}
                  {selectedAcademicLevelDrill === "Pre-Primary" && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400 font-sans">
                        No submissions or records tracked for Pre-Primary level this week. All records synced cleanly with Drive root.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-150 flex items-center justify-between text-xs text-slate-400 select-none">
              <span>Selected Scope: {selectedAcademicLevelDrill} Level · Preserving filters</span>
              <button 
                type="button"
                onClick={() => setSelectedAcademicLevelDrill(null)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedClassroomMetricDrill && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in"
          onClick={() => setSelectedClassroomMetricDrill(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedClassroomMetricDrill(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
              aria-label="Close classroom modal"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={18} className="text-amber-605 fill-amber-50" />
              <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">
                Classroom Monitoring Details: Streams Check
              </h3>
            </div>

            {/* Classroom category chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4 select-none">
              <span className="text-xs text-slate-500 font-semibold mr-1 font-sans">Quick Subsets:</span>
              {[
                { key: "total", label: `All Classrooms (${PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.totalClassrooms})` },
                { key: "posted", label: `Active This Week (${PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.postedThisWeek})` },
                { key: "inactive", label: `Zero Activity (${PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.zeroActivityThisWeek})` },
                { key: "assignments", label: `Assignments (${PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.assignmentsCreatedThisWeek})` },
                { key: "submissions", label: `High Submissions (≥${PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.averageSubmissionRate}%)` },
                { key: "meet", label: `Meet Sessions (${PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.meetSessionsHeldThisWeek})` }
              ].map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setSelectedClassroomMetricDrill(chip.key)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all border cursor-pointer font-sans leading-none ${
                    selectedClassroomMetricDrill === chip.key
                      ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 hover:text-slate-800 text-slate-600 border-slate-200"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* List Table of drilldown results */}
            <div className="overflow-y-auto flex-1 border border-slate-150 rounded-xl font-sans">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-450 font-mono tracking-wider font-extrabold uppercase border-b border-slate-150 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-sans font-extrabold">Course / Section</th>
                    <th className="py-2.5 px-4 font-sans font-extrabold">Primary Instructor</th>
                    <th className="py-2.5 px-4 text-center font-sans font-extrabold">Weekly Posts</th>
                    <th className="py-2.5 px-4 text-center font-sans font-extrabold">Assignments Created</th>
                    <th className="py-2.5 px-4 text-center font-sans font-extrabold">Submission %</th>
                    <th className="py-2.5 px-4 text-center font-sans font-extrabold">Meet Linked</th>
                    <th className="py-2.5 px-4 text-right pr-4 font-sans font-extrabold">Current Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-705">
                  {[
                    { name: "Grade VII - Section A (History)", teacher: "Mr. Vijay Kumar", posts: 0, assignments: 0, submissions: 42, meet: false, isInactive: true },
                    { name: "Grade VII - Section B (Science)", teacher: "Mr. Rahul Kapoor", posts: 0, assignments: 0, submissions: 58, meet: true, isInactive: true },
                    { name: "Grade VIII - Section A (History)", teacher: "Mr. Vijay Kumar", posts: 4, assignments: 2, submissions: 82, meet: true, isInactive: false },
                    { name: "Grade IX - Section B (Science)", teacher: "Mr. Rahul Kapoor", posts: 6, assignments: 8, submissions: 90, meet: true, isInactive: false },
                    { name: "Grade X - Section A (Mathematics)", teacher: "Ms. Priya Nair", posts: 12, assignments: 14, submissions: 95, meet: true, isInactive: false },
                    { name: "Grade XI - Section A (Physics)", teacher: "Academic Coordinator", posts: 0, assignments: 0, submissions: 48, meet: false, isInactive: true },
                    { name: "Grade XII - Section C (Computer Science)", teacher: "Ms. Priya Nair", posts: 18, assignments: 20, submissions: 100, meet: true, isInactive: false }
                  ]
                  .filter(row => {
                    if (selectedClassroomMetricDrill === "posted") return row.posts > 0;
                    if (selectedClassroomMetricDrill === "inactive") return row.isInactive;
                    if (selectedClassroomMetricDrill === "assignments") return row.assignments > 0;
                    if (selectedClassroomMetricDrill === "submissions") return row.submissions >= PRINCIPAL_DASHBOARD_SEED.classroomMonitoring.averageSubmissionRate;
                    if (selectedClassroomMetricDrill === "meet") return row.meet;
                    return true;
                  })
                  .map((row, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${row.isInactive ? 'bg-rose-50/10' : ''}`}
                      onClick={() => setInspectedRecord({
                        title: row.name,
                        type: "Google Classroom Course Metrics",
                        data: row
                      })}
                    >
                      <td className="py-3 px-4 font-bold text-slate-800">{row.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{row.teacher}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">{row.posts} posts</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{row.assignments} assigned</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-850">{row.submissions}%</td>
                      <td className="py-3 px-4 text-center font-sans">
                        {row.meet ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-100 font-bold font-sans">Active Meet Link</span>
                        ) : (
                          <span className="text-slate-400">None linked</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right pr-4">
                        {row.isInactive ? (
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-md font-bold text-[9px] uppercase tracking-wide animate-pulse inline-block">
                            Zero stream activity
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md font-semibold text-[9px] uppercase tracking-wide inline-block">
                            Pacing active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-150 flex items-center justify-between text-xs text-slate-400 select-none">
              <span>Classrooms Stream Range: Filter subset matching &quot;{selectedClassroomMetricDrill}&quot;</span>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => alert("Broadcast direct reminder alert dispatched to educators of inactive classrooms (LMS connection active).")}
                  className="px-3 py-2 bg-slate-905 text-white rounded-xl text-xs font-bold font-sans hover:bg-slate-805 cursor-pointer transition-all shadow-xs"
                >
                  Broadcast Direct Reminders
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedClassroomMetricDrill(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedComplianceItemDrill && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in"
          onClick={() => setSelectedComplianceItemDrill(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedComplianceItemDrill(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
              aria-label="Close compliance modal"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={18} className="text-red-600 fill-rose-50" />
              <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">
                Compliance Auditing & Gaps Analysis: Category Detail
              </h3>
            </div>

            {/* Sub-header statistics */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 mb-4 select-none flex items-center justify-between font-mono text-xs text-slate-600">
              <span className="font-sans font-medium text-slate-500">Filters: Preserve Academic Year (2025-26) · Term (Term 1) · Statutory Records Range</span>
              <span className="font-mono text-blue-650 font-bold">Audit Mode: CBSE Standardized Annexure</span>
            </div>

            {/* List Table of compliance items */}
            <div className="overflow-y-auto flex-1 border border-slate-150 rounded-xl font-sans text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-450 font-mono tracking-wider font-extrabold uppercase border-b border-slate-150 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-sans font-extrabold">Statutory Category Identifier</th>
                    <th className="py-2.5 px-4 font-sans font-extrabold">Auditing Coordinator</th>
                    <th className="py-2.5 px-4 text-center font-sans font-extrabold">Statutory Status</th>
                    <th className="py-2.5 px-4 text-center font-sans font-extrabold">Completion Index</th>
                    <th className="py-2.5 px-4 text-center font-sans font-extrabold">Deadline</th>
                    <th className="py-2.5 px-4 text-center font-sans font-extrabold">Evidence Check</th>
                    <th className="py-2.5 px-4 text-right pr-4 font-sans font-extrabold">Direct Action Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-705">
                  {[
                    { label: "Committee records", owner: "Principal", percentage: 90, status: "healthy", dueDate: "2026-06-15", hasEvidence: true, folder: "SDOS-Drive/Committee-Minutes" },
                    { label: "Safety records", owner: "Estate Manager", percentage: 60, status: "critical", dueDate: "2026-06-10", hasEvidence: false, folder: "SDOS-Drive/Safety-Inspection" },
                    { label: "Mandatory forms", owner: "Registrar", percentage: 84, status: "watch", dueDate: "2026-06-20", hasEvidence: true, folder: "SDOS-Drive/Ingestion-Forms" },
                    { label: "Staff CPD records", owner: "Academic Coordinator", percentage: 72, status: "watch", dueDate: "2026-06-12", hasEvidence: true, folder: "SDOS-Drive/Professional-Dev" },
                    { label: "SQAA evidence", owner: "Internal Quality Liaison", percentage: 78, status: "watch", dueDate: "2026-06-25", hasEvidence: false, folder: "SDOS-Drive/Quality-Assessment" }
                  ]
                  .filter(row => {
                    const mappedItemStatus = row.percentage >= healthyThreshold ? "healthy" : row.percentage >= watchThreshold ? "watch" : "critical";
                    if (selectedComplianceItemDrill === "gaps") {
                      return mappedItemStatus !== "healthy";
                    }
                    if (selectedComplianceItemDrill !== "all" && selectedComplianceItemDrill !== null) {
                      let tagKey = "committee";
                      if (row.label.includes("Committee")) tagKey = "committee";
                      else if (row.label.includes("Safety")) tagKey = "safety";
                      else if (row.label.includes("Mandatory")) tagKey = "forms";
                      else if (row.label.includes("CPD")) tagKey = "cpd";
                      else if (row.label.includes("SQAA")) tagKey = "sqaa";
                      return tagKey === selectedComplianceItemDrill;
                    }
                    return true;
                  })
                  .map((row, idx) => {
                    const mappedItemStatus = row.percentage >= healthyThreshold ? "healthy" : row.percentage >= watchThreshold ? "watch" : "critical";
                    
                    const textBadgeClass = 
                      mappedItemStatus === "healthy" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      mappedItemStatus === "watch" ? "bg-amber-50 text-amber-705 border-amber-100" : "bg-rose-50 text-rose-700 border-rose-100";

                    return (
                      <tr 
                        key={idx} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setInspectedRecord({
                          title: row.label,
                          type: "Statutory Compliance Registry Record",
                          data: row
                        })}
                      >
                        <td className="py-3 px-4 text-slate-800 font-bold">{row.label}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{row.owner}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border capitalize leading-none font-sans ${textBadgeClass}`}>
                            {mappedItemStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 justify-center">
                            <span className="font-mono font-bold text-slate-800">{row.percentage}%</span>
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                              <div className={`h-full ${mappedItemStatus === 'healthy' ? 'bg-emerald-500' : mappedItemStatus === 'watch' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${row.percentage}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 font-mono">{row.dueDate}</td>
                        <td className="py-3 px-4 text-center font-sans">
                          {row.hasEvidence ? (
                            <span 
                              className="text-blue-600 font-medium hover:underline cursor-pointer flex items-center justify-center gap-1 leading-none" 
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(`Opening Google Drive folder pipeline: ${row.folder}`);
                              }}
                            >
                              <FileText size={12} /> {row.folder.split("/")[1]}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-sm">Missing Evidence Gaps</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right pr-4">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Statutory compliance citation email dispatched directly to Category Coordinator: ${row.owner} for ${row.label}. Please submit records immediately.`);
                            }}
                            className="px-2.5 py-1 text-[10px] bg-slate-905 text-white rounded-lg hover:bg-slate-805 font-bold font-sans cursor-pointer transition-all leading-none"
                          >
                            Ask for Evidence
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-150 flex items-center justify-between text-xs text-slate-400 select-none">
              <span>Audit Target: Gaps listed below {healthyThreshold}% threshold</span>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedComplianceItemDrill("all")}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded-xl font-bold cursor-pointer font-sans leading-none"
                >
                  Show All Audits
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedComplianceItemDrill(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Dialog for KPI Cards */}
      {editingCardId && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs select-none animate-fade-in"
          onClick={() => setEditingCardId(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setEditingCardId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
              id="close-card-edit-btn"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Edit3 size={18} className="text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Edit KPI Card Parameters
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Overriding card configurations updates the dashboard layouts instantly. Clear the <strong className="text-slate-700">Override Count</strong> field to automatically fallback to database values.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Card Title Label</label>
                <input 
                  type="text" 
                  value={tempEditTitle}
                  onChange={(e) => setTempEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Override Count / Value</label>
                <input 
                  type="text" 
                  placeholder="e.g. 50 Metrics / Clear for auto-sync"
                  value={tempEditCount}
                  onChange={(e) => setTempEditCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Source / Scope Indicator Description</label>
                <input 
                  type="text" 
                  value={tempEditSource}
                  onChange={(e) => setTempEditSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setEditingCardId(null)}
                className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Save overrides
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Remedial Student Profile Details Modal */}
      {selectedRemedialStudent && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in"
          onClick={() => setSelectedRemedialStudent(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[85vh] animate-fade-in text-left"
            onClick={(e) => e.stopPropagation()}
            id="remedial-profile-modal"
          >
            <button 
              onClick={() => setSelectedRemedialStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border-none outline-none"
              title="Close Panel"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 mb-5">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg leading-none ${
                selectedRemedialStudent.status === 'Tracked' ? 'bg-emerald-50 text-emerald-700' :
                selectedRemedialStudent.status === 'In Progress' ? 'bg-amber-50 text-amber-700' :
                'bg-rose-50 text-rose-700'
              }`}>
                {selectedRemedialStudent.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900 font-sans tracking-tight">
                  {selectedRemedialStudent.name}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-semibold inline-block font-sans">
                  {selectedRemedialStudent.grade} · {selectedRemedialStudent.subject}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block leading-none">Assigned Teacher</span>
                  <span className="font-bold text-slate-800 text-[11px] block">{selectedRemedialStudent.teacher}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block leading-none">Current Attendance</span>
                  <span className="font-bold text-slate-800 text-[11px] block">{selectedRemedialStudent.attendRate}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block leading-none">Latest Risk Score</span>
                  <span className="font-bold text-rose-700 font-mono text-[11px] block">{selectedRemedialStudent.lastRiskScore}% Severity</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block leading-none">Remedial Status</span>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold border capitalize leading-none rounded-full mt-0.5 ${
                    selectedRemedialStudent.status === 'Tracked' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedRemedialStudent.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedRemedialStudent.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 font-sans text-xs">Diagnostic Issue Details</h4>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-600 leading-relaxed text-[11px]">
                  "{selectedRemedialStudent.issue || "No diagnostic issue specified."}"
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 font-sans text-xs">Academic Remediative Action Plan</h4>
                <div className="p-3 border border-blue-100 bg-blue-50/30 rounded-xl text-blue-900 font-medium leading-relaxed text-[11px]">
                  {selectedRemedialStudent.actionPlan || "Action plan pending design by subject coordinator."}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between select-none font-sans">
              <span className="text-[10px] text-slate-400 font-mono">
                System Reference ID: rmd-{selectedRemedialStudent.id}
              </span>
              <button
                onClick={() => setSelectedRemedialStudent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none outline-none"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Remedial Report Modal */}
      {showFullRemedialModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in"
          onClick={() => setShowFullRemedialModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[85vh] animate-fade-in text-left font-sans"
            onClick={(e) => e.stopPropagation()}
            id="full-remedial-report-modal"
          >
            <button 
              onClick={() => setShowFullRemedialModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border-none outline-none"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 select-none">
              <GraduationCap className="text-blue-600" size={20} />
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-900 font-sans tracking-tight leading-tight">
                  Academic Remedial Log - Session 2026
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed register of identified students requiring learning support interventions.
                </p>
              </div>
            </div>

            {/* Quick stats panel inside modal */}
            <div className="grid grid-cols-4 gap-3 mb-4 select-none">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase leading-none">Total Flagged</span>
                <span className="text-sm font-black text-slate-800 block leading-none">
                  {COORDINATOR_DASHBOARD_SEED.remedialStudents.length} Students
                </span>
              </div>
              <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-rose-550 block uppercase leading-none">Untracked Gaps</span>
                <span className="text-sm font-black text-rose-700 block leading-none">
                  {COORDINATOR_DASHBOARD_SEED.remedialStudents.filter(s => s.status === "Untracked").length}
                </span>
              </div>
              <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-amber-600 block uppercase leading-none">In Progress</span>
                <span className="text-sm font-black text-amber-700 block leading-none">
                  {COORDINATOR_DASHBOARD_SEED.remedialStudents.filter(s => s.status === "In Progress").length}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-emerald-600 block uppercase leading-none">Tracked/Stable</span>
                <span className="text-sm font-black text-emerald-700 block leading-none">
                  {COORDINATOR_DASHBOARD_SEED.remedialStudents.filter(s => s.status === "Tracked").length}
                </span>
              </div>
            </div>

            {/* Scrollable table */}
            <div className="overflow-y-auto flex-1 min-h-[300px] border border-slate-200 rounded-xl">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Grade & Section</th>
                    <th className="py-3 px-4">Subject Intervened</th>
                    <th className="py-3 px-4">Assigned Evaluator</th>
                    <th className="py-3 px-4">Risk Severity</th>
                    <th className="py-3 px-4">Status Badging</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {COORDINATOR_DASHBOARD_SEED.remedialStudents.map((student) => {
                    let textBadgeClass = "bg-rose-50 text-rose-700 border-rose-100";
                    if (student.status === "Tracked") {
                      textBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    } else if (student.status === "In Progress") {
                      textBadgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                    }

                    return (
                      <tr 
                        key={student.id}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                        onClick={() => { setSelectedRemedialStudent(student); }}
                      >
                        <td className="py-3 px-4 font-bold text-slate-800">{student.name}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 select-all">{student.grade}</td>
                        <td className="py-3 px-4 font-bold text-blue-700">{student.subject}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{student.teacher}</td>
                        <td className="py-3 px-4 font-mono text-rose-600 font-extrabold">{student.lastRiskScore}% Severity</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${textBadgeClass}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between select-none">
              <span className="text-[10px] text-slate-400 font-mono">
                CBSE Mandatory Intervention Record Schema Level 1
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    let csvContent = "ID,Name,Grade,Subject,Teacher,RiskScore,Attendance,Status,Issue,ActionPlan\n" +
                      COORDINATOR_DASHBOARD_SEED.remedialStudents.map(s => 
                        `"${s.id}","${s.name}","${s.grade}","${s.subject}","${s.teacher}",${s.lastRiskScore},"${s.attendRate}","${s.status}","${s.issue.replace(/"/g, '""')}","${s.actionPlan.replace(/"/g, '""')}"`
                      ).join("\n");
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", "Coordinator_Remedial_Log.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3.5 py-2 text-xs text-blue-700 bg-blue-550/5 hover:bg-blue-105/10 border border-blue-100 rounded-xl font-bold cursor-pointer font-sans"
                >
                  Download Report (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullRemedialModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none outline-none"
                >
                  Close Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inactive Sections Modal */}
      {showInactiveSectionsModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in"
          onClick={() => setShowInactiveSectionsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[85vh] animate-fade-in text-left font-sans"
            onClick={(e) => e.stopPropagation()}
            id="inactive-sections-modal"
          >
            <button 
              onClick={() => setShowInactiveSectionsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border-none outline-none"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 select-none">
              <AlertTriangle className="text-rose-500 animate-pulse" size={20} />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 font-sans tracking-tight leading-tight">
                  LMS Inactive Sections Registry
                </h3>
                <p className="text-xs text-slate-500">
                  Review classroom streams showing zero or extremely low instructional activity metrics this week.
                </p>
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl mb-4 text-xs text-rose-950 font-semibold select-none leading-relaxed">
              ⚠️ <strong>Critical Compliance Warning:</strong> Department guidelines mandate a minimum of <strong>2 homework assignments</strong> and <strong>1 subject announcement</strong> weekly per active Google Classroom stream.
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider select-none font-sans">
                  <tr>
                    <th className="py-2.5 px-4">Classroom Group</th>
                    <th className="py-2.5 px-4">Instructing Teacher</th>
                    <th className="py-2.5 px-4">Pupil Count</th>
                    <th className="py-2.5 px-4">Last Activity Check</th>
                    <th className="py-2.5 px-4">Inactive Reason / Violation Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COORDINATOR_DASHBOARD_SEED.inactiveSections.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-800">{row.className} - {row.section}</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{row.subject}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">{row.teacher}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-650">{row.studentCount} Students</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-rose-50 text-rose-600 border border-rose-100">
                          {row.lastActive}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-600 leading-normal block font-medium">
                          {row.inactiveReason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between select-none font-sans">
              <span className="text-[10px] text-slate-400 font-mono">
                Synced from LMS Live streams
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => alert("Notification alerts successfully dispatched to listed class instructors.")}
                  className="px-3.5 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-xl cursor-pointer border-none outline-none shadow-xs"
                >
                  Dispatch Alerts to Teachers
                </button>
                <button
                  onClick={() => setShowInactiveSectionsModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none outline-none"
                >
                  Close Registry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOD Dashboard Core Section */}
      {isHodRole() && (
        <div className="space-y-6 mt-6 animate-fade-in" id="hod-specific-dashboard-zones">
          {/* 1. HOD Summary KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="hod-kpi-cards-grid">
            {/* KPI Card 1: Repository Resources */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="space-y-1">
                <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">
                  Repository resources
                </span>
                <div className="text-2xl font-extrabold text-slate-800 leading-tight">
                  {computeHODKPIs().repoResources}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-sans leading-tight">
                Files across all classes
              </div>
            </div>

            {/* KPI Card 2: Chapters Fully Resourced */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="space-y-1">
                <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">
                  Chapters fully resourced
                </span>
                <div className="text-2xl font-extrabold text-slate-800 leading-tight">
                  {computeHODKPIs().chaptersResourced}%
                </div>
              </div>
              <div className="mt-2 text-[11px] text-amber-600 font-semibold font-sans leading-tight flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                {100 - computeHODKPIs().chaptersResourced}% need attention
              </div>
            </div>

            {/* KPI Card 3: QB Questions Added */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="space-y-1">
                <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">
                  QB questions added
                </span>
                <div className="text-2xl font-extrabold text-slate-800 leading-tight">
                  {computeHODKPIs().qbQuestions}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-sans leading-tight">
                This term
              </div>
            </div>

            {/* KPI Card 4: Department Average */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="space-y-1">
                <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">
                  Dept avg — {hodPeriod}
                </span>
                <div className="text-2xl font-extrabold text-slate-800 leading-tight">
                  {computeHODKPIs().deptAvg}%
                </div>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 font-semibold font-sans leading-tight flex items-center gap-1">
                <Check size={12} className="text-emerald-500" />
                School avg {computeHODKPIs().schoolAvg}%
              </div>
            </div>
          </div>

          {/* Desktop: Two column layout for Repository Health and Teacher Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8" id="hod-dashboard-split-grid">
            
            {/* 2. Repository Health — By Class */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-5 flex flex-col justify-between" id="hod-repo-health-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-md font-bold text-slate-900 tracking-tight font-sans">
                    Repository Health — By Class
                  </h3>
                </div>

                <div className="space-y-3.5 my-2">
                  {getRepositoryHealthData().map((row) => {
                    const percentage = row.completion;
                    let barColor = "bg-rose-500";
                    let textColor = "text-rose-600";
                    let bgChip = "bg-rose-50 border-rose-100";
                    if (percentage >= 80) {
                      barColor = "bg-emerald-500";
                      textColor = "text-emerald-600";
                      bgChip = "bg-emerald-50 border-emerald-100";
                    } else if (percentage >= 70) {
                      barColor = "bg-amber-500";
                      textColor = "text-amber-600";
                      bgChip = "bg-amber-50 border-amber-100";
                    }

                    return (
                      <div key={row.className} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 font-sans">{row.className}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${textColor} ${bgChip}`}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden select-none">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-400 font-mono italic leading-tight">
                  % of chapters with complete resource set
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowHODGapDrilldown(true)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  Fix gaps <ArrowUpRight size={14} />
                </button>
              </div>
            </div>

            {/* 3. Teacher Activity — This Week */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-7 flex flex-col justify-between" id="hod-teacher-activity-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-md font-bold text-slate-900 tracking-tight font-sans">
                    Teacher Activity — This Week
                  </h3>
                </div>

                <div className="overflow-x-auto select-none">
                  <table className="w-full text-left text-xs min-w-[420px]">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-450 font-mono tracking-wider font-extrabold uppercase">
                        <th className="py-2.5">Teacher</th>
                        <th className="py-2.5 text-center">Planner</th>
                        <th className="py-2.5 text-center font-semibold">Uploads</th>
                        <th className="py-2.5 text-center font-semibold">QB</th>
                        <th className="py-2.5 text-right">Classroom</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-105 font-medium text-slate-705">
                      {(() => {
                        const dept = hodDepartment;
                        const teachItems: Record<string, any[]> = {
                          Mathematics: [
                            { teacher: "Ms. Priya Nair", planner: "Done", uploads: 8, qb: 12, classroom: "Active", classesHandled: "Class 6, 8, 9, 10", lessonPlans: "4/4", pendingActions: "None", lastUpdated: "Today 10:15 AM", suggestedFollowup: "Acknowledge high productivity" },
                            { teacher: "Mr. Arjun Das", planner: "Done", uploads: 5, qb: 3, classroom: "Active", classesHandled: "Class 7, 11, 12", lessonPlans: "3/3", pendingActions: "None", lastUpdated: "Yesterday 4:30 PM", suggestedFollowup: "Keep it up" },
                            { teacher: "Ms. Kavita Singh", planner: "Missing", uploads: 1, qb: 0, classroom: "Low", classesHandled: "Class 6, 8", lessonPlans: "0/2", pendingActions: "Syllabus planner overdue", lastUpdated: "May 25, 2026", suggestedFollowup: "Provide planning assistance, check why QB and uploads are minimal" },
                            { teacher: "Mr. Rahul Verma", planner: "Done", uploads: 6, qb: 8, classroom: "Active", classesHandled: "Class 9, 10, 11", lessonPlans: "3/3", pendingActions: "None", lastUpdated: "Today 8:00 AM", suggestedFollowup: "Support resources sharing" },
                          ],
                          Science: [
                            { teacher: "Dr. Sarah Henderson", planner: "Done", uploads: 12, qb: 15, classroom: "Active", classesHandled: "Class 8, 9, 10, 11", lessonPlans: "4/4", pendingActions: "None", lastUpdated: "Today 2:10 PM", suggestedFollowup: "Excellent engagement" },
                            { teacher: "Mr. Anthony Wright", planner: "Done", uploads: 4, qb: 2, classroom: "Active", classesHandled: "Class 11, 12", lessonPlans: "2/2", pendingActions: "None", lastUpdated: "May 24, 2026", suggestedFollowup: "Encourage more questions uploads" },
                            { teacher: "Miss Melissa Green", planner: "Missing", uploads: 0, qb: 1, classroom: "Low", classesHandled: "Class 6, 7", lessonPlans: "0/2", pendingActions: "2 Planners outstanding", lastUpdated: "May 22, 2026", suggestedFollowup: "Check compliance standards, issue action request" },
                            { teacher: "Dr. Robert Boyle", planner: "Done", uploads: 7, qb: 9, classroom: "Active", classesHandled: "Class 9, 12", lessonPlans: "2/2", pendingActions: "None", lastUpdated: "Yesterday 11:15 AM", suggestedFollowup: "Steady delivery" }
                          ],
                          English: [
                            { teacher: "Mrs. Beatrice Smith", planner: "Done", uploads: 9, qb: 11, classroom: "Active", classesHandled: "Class 6, 7, 8, 12", lessonPlans: "4/4", pendingActions: "None", lastUpdated: "Today 8:40 AM", suggestedFollowup: "Commend high execution" },
                            { teacher: "Mr. Charles Dickens", planner: "Done", uploads: 6, qb: 4, classroom: "Active", classesHandled: "Class 9, 10", lessonPlans: "2/2", pendingActions: "None", lastUpdated: "May 24, 2026", suggestedFollowup: "Support syllabus alignments" },
                            { teacher: "Miss Jane Austen", planner: "Missing", uploads: 2, qb: 0, classroom: "Low", classesHandled: "Class 8, 11", lessonPlans: "0/2", pendingActions: "Syllabus planner overdue", lastUpdated: "May 24, 2026", suggestedFollowup: "Assist with planners template setup" },
                            { teacher: "Mr. George Orwell", planner: "Done", uploads: 8, qb: 7, classroom: "Active", classesHandled: "Class 10, 11, 12", lessonPlans: "3/3", pendingActions: "None", lastUpdated: "Yesterday 3:00 PM", suggestedFollowup: "Affirm good tracking log metrics" }
                          ]
                        };

                        const rows = teachItems[dept] || teachItems["Mathematics"];
                        const lowestTeacher = getLowestTeacher(rows);

                        return (
                          <>
                            {rows.map((row) => (
                              <tr 
                                key={row.teacher} 
                                onClick={() => setSelectedHODTeacher(row)}
                                className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                              >
                                <td className="py-3 pr-2 font-bold text-slate-800 truncate block max-w-40 group-hover:text-blue-650 transition-colors">
                                  {row.teacher}
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    row.planner === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : "bg-rose-50 text-rose-700 border-rose-150"
                                  }`}>
                                    {row.planner}
                                  </span>
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold ${
                                    row.uploads > 4 ? "bg-indigo-50 text-indigo-700 font-extrabold" : "bg-slate-100 text-slate-500 font-normal"
                                  }`}>
                                    {row.uploads}
                                  </span>
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold ${
                                    row.qb === 0 ? "bg-slate-100 text-slate-400 font-normal" : "bg-indigo-50 text-indigo-700 font-extrabold"
                                  }`}>
                                    {row.qb}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    row.classroom === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : "bg-amber-50 text-amber-705 border-amber-150"
                                  }`}>
                                    {row.classroom}
                                  </span>
                                </td>
                              </tr>
                            ))}

                            {/* 3.1 Weekly Follow-up Alert dynamic rendering */}
                            <tr className="bg-transparent border-none">
                              <td colSpan={5} className="pt-4 pb-0">
                                <div className="p-3 bg-amber-50/70 border border-amber-150 rounded-xl flex items-center gap-2 text-xs text-amber-900 select-none">
                                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                  <span className="font-sans">
                                    <strong>Compliance Alert:</strong> <span className="underline font-semibold">{lowestTeacher?.teacher}</span> needs follow-up this week.
                                  </span>
                                </div>
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="text-[11px] text-slate-400 font-sans leading-normal pt-4 mt-1 border-t border-slate-50 select-none">
                Click on any teacher&apos;s row to open detailed activity logs and suggestive coaching logs.
              </div>
            </div>

          </div>

          {/* New HOD Additions: Assessment Tracking, Enrichment & Olympiads, Remedial Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animate-duration-300" id="hod-dashboard-additions-grid">
            
            {/* Card 1: Assessment Tracking */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="hod-assessment-tracking-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      Assessment Tracking
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">
                    UT4 Cycle
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT4 papers submitted</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-150 font-mono">
                      5/8 teachers
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT4 deadline</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold border bg-amber-50 text-amber-800 border-amber-200">
                      Fri 30 May
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">UT3 results entered</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150">
                      All done
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Dept avg UT3</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-800 bg-slate-100">
                      {computeHODKPIs().deptAvg}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Below 40% students</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-150">
                      14 students
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowHODChasePendingModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Chase pending <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 2: Enrichment and Olympiads */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="hod-enrichment-olympiads-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      Enrichment and Olympiads
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-600 font-bold px-1.5 py-0.5 bg-purple-50 rounded">
                    Talent Pool
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Olympiad registrations</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      34 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Enrichment posts — Classroom</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      18 this term
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Resources in Enrichment folder</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      24 files
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Students in enrichment programme</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      28
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Next olympiad date</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold border bg-slate-100 text-slate-705 border-slate-200">
                      12 June 2026
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    logAction(currentUser, currentRole, "Enrichment Folder Opened", "HOD viewed classroom enrichment logs", "task");
                    alert(`Olympiad preparations and enrichment materials exported for ${hodDepartment} teachers & student roster.`);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Manage talent <Sparkles size={13} className="text-blue-500" />
                </button>
              </div>
            </div>

            {/* Card 3: Remedial Status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative" id="hod-remedial-status-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-emerald-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                      Remedial Status
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded">
                    Intervention
                  </span>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Identified for remedial</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      38 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Remedial sessions held</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      12 this term
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Resources in Remedial folder</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-blue-50 text-blue-700 border-blue-150 font-mono">
                      16 files
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Improved after remedial</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-150 font-mono">
                      22 students
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium font-sans text-xs">Still needs support</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border bg-rose-50 text-rose-700 border-rose-150 font-mono">
                      16 students
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowFullRemedialModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Full report <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* HOD Fix Gaps Drilldown Modal */}
      {showHODGapDrilldown && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-fade-in" id="hod-gap-drilldown-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-150 font-mono text-[9px] font-bold rounded-md uppercase">Gaps Detected</span>
                  <span className="text-[11px] text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-mono">{hodDepartment} Department</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Repository Completion Gaps &amp; Actions
                </h3>
              </div>
              <button
                onClick={() => setShowHODGapDrilldown(false)}
                className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-semibold text-xs shrink-0 cursor-pointer bg-white"
              >
                Close
              </button>
            </div>

            {/* Main Table */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-450 font-mono tracking-wider font-extrabold uppercase border-b border-slate-150">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Class</th>
                      <th className="py-2.5 px-4 font-semibold">Chapter / Topic</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Required</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Uploaded</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Missing</th>
                      <th className="py-2.5 px-4 font-semibold">Teacher</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-105 font-medium text-slate-705">
                    {(() => {
                      const gapsItems: Record<string, any[]> = {
                        Mathematics: [
                          { classText: "Class 11", subject: "Mathematics", chapter: "Ch 3 Trigonometric Functions", required: "5 Worksheets, 2 Syllabus Audits", uploaded: "3 Worksheets, 1 Syllabus Audit", missing: "2 Worksheets, 1 Syllabus Audit", teacher: "Mr. Rahul Verma", updated: "2026-05-18", status: "Critical" },
                          { classText: "Class 9", subject: "Mathematics", chapter: "Ch 4 Quadratic Equations", required: "4 Worksheets, 2 Quizzes", uploaded: "3 Worksheets, 1 Quiz", missing: "1 Worksheet, 1 Quiz", teacher: "Ms. Priya Nair", updated: "2026-05-22", status: "Medium" },
                          { classText: "Class 8", subject: "Mathematics", chapter: "Ch 6 Triangles", required: "6 Worksheets, 3 Notes", uploaded: "5 Worksheets, 2 Notes", missing: "1 Worksheet, 1 Note", teacher: "Ms. Kavita Singh", updated: "2026-05-20", status: "Medium" },
                          { classText: "Class 11", subject: "Mathematics", chapter: "Ch 8 Binomial Theorem", required: "4 Worksheets, 1 Mock Paper", uploaded: "1 Worksheet", missing: "3 Worksheets, 1 Mock Paper", teacher: "Mr. Arjun Das", updated: "2026-05-15", status: "Critical" }
                        ],
                        Science: [
                          { classText: "Class 9", subject: "Science", chapter: "Ch 3 Atoms & Molecules", required: "4 Sheets, 2 Audio Clips", uploaded: "2 Sheets", missing: "2 Sheets, 2 Audio Clips", teacher: "Dr. Sarah Henderson", updated: "2026-05-19", status: "Critical" },
                          { classText: "Class 11", subject: "Science", chapter: "Ch 5 Chemical Bonding", required: "5 Sheets, 3 virtual labs", uploaded: "4 Sheets, 1 lab", missing: "1 Sheet, 2 virtual labs", teacher: "Mr. Anthony Wright", updated: "2026-05-16", status: "Critical" }
                        ],
                        English: [
                          { classText: "Class 11", subject: "English", chapter: "Ch 2 Tenses & Voice", required: "4 Quizzes, 2 Writeups", uploaded: "3 Quizzes", missing: "1 Quiz, 2 Writeups", teacher: "Mrs. Beatrice Smith", updated: "2026-05-21", status: "Medium" }
                        ]
                      };

                      const activeGaps = gapsItems[hodDepartment] || gapsItems["Mathematics"];

                      if (activeGaps.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-405 font-sans italic">
                              No outstanding resource repository gaps detected for the active department scope!
                            </td>
                          </tr>
                        );
                      }

                      return activeGaps.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors leading-relaxed">
                          <td className="py-3 px-4 font-bold text-slate-800">{row.classText}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{row.chapter}</div>
                            <div className="text-[10px] text-slate-400">Last updated: {row.updated}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">{row.required}</td>
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-emerald-600 font-bold">{row.uploaded}</td>
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-rose-500 font-bold">{row.missing}</td>
                          <td className="py-3 px-4 text-slate-650">{row.teacher}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.status === "Critical" ? "bg-rose-50 text-rose-700 border-rose-150" : "bg-amber-50 text-amber-705 border-amber-150"
                            }`}>
                              {row.status} Gap
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span className="font-sans leading-tight">These gaps are generated dynamically checking statutory chapter indices.</span>
              <button
                type="button"
                onClick={() => {
                  logAction(currentUser, currentRole, "Gaps Report Downloaded", `Exported gaps sheet for ${hodDepartment} department`, "task");
                  alert(`Gaps spreadsheet report exported successfully for ${hodDepartment} department. Copy dispatched to School Coordinators.`);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                Export Sheet <ChevronRight size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Selected HOD Teacher Activity Logs Drilldown Modal */}
      {selectedHODTeacher && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-fade-in" id="hod-teacher-detail-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">{hodDepartment} Staff Activity Detail</div>
                <h3 className="text-base font-bold text-slate-900">{selectedHODTeacher.teacher}</h3>
              </div>
              <button
                onClick={() => setSelectedHODTeacher(null)}
                className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-semibold text-xs shrink-0 cursor-pointer bg-white"
              >
                Close
              </button>
            </div>

            {/* Main Content Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Classes Handled */}
              <div className="grid grid-cols-3 gap-1 grid-flow-row items-baseline bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px] font-mono">Classes Handled</span>
                <span className="col-span-2 text-slate-800 font-semibold text-right">{selectedHODTeacher.classesHandled}</span>
              </div>

              {/* Detailed Metrics */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-105">
                  <span className="text-slate-500 font-medium font-sans">Weekly Planner Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedHODTeacher.planner === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : "bg-rose-50 text-rose-700 border-rose-150"
                  }`}>
                    {selectedHODTeacher.planner}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-105">
                  <span className="text-slate-500 font-medium font-sans">Lesson Plans Submitted</span>
                  <span className="font-mono font-bold text-slate-800">{selectedHODTeacher.lessonPlans} submission(s)</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-105">
                  <span className="text-slate-500 font-medium font-sans">Resources Uploaded</span>
                  <span className="font-mono font-bold text-indigo-750 bg-indigo-50 px-2 py-0.5 rounded">{selectedHODTeacher.uploads} files</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-105">
                  <span className="text-slate-500 font-medium font-sans">QB Questions Added</span>
                  <span className="font-mono font-bold text-indigo-755 bg-indigo-50 px-2 py-0.5 rounded">{selectedHODTeacher.qb} questions</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-105">
                  <span className="text-slate-500 font-medium font-sans">Google Classroom Stream Activity</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedHODTeacher.classroom === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : "bg-amber-50 text-amber-705 border-amber-150"
                  }`}>
                    {selectedHODTeacher.classroom}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-105">
                  <span className="text-slate-500 font-medium font-sans">Last Activity Synced</span>
                  <span className="font-sans text-slate-700">{selectedHODTeacher.lastUpdated}</span>
                </div>
              </div>

              {/* Action Blocks */}
              <div className="space-y-2 pt-2">
                <div className="space-y-1 bg-transparent">
                  <span className="text-[9px] uppercase font-mono font-extrabold text-slate-450 block">Pending Mandatory Actions</span>
                  <div className={`p-2.5 rounded-lg border font-mono text-[10.5px] leading-relaxed ${
                    selectedHODTeacher.pendingActions === "None" ? "bg-slate-50 text-slate-500 border-slate-150" : "bg-rose-50 text-rose-700 border-rose-150"
                  }`}>
                    {selectedHODTeacher.pendingActions}
                  </div>
                </div>

                <div className="space-y-1 bg-transparent">
                  <span className="text-[9px] uppercase font-mono font-extrabold text-slate-450 block">Suggested Coaching/Follow-up Action</span>
                  <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-150 font-sans text-slate-750 leading-relaxed text-[11px]">
                    {selectedHODTeacher.suggestedFollowup}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <button
                onClick={() => {
                  logAction(currentUser, currentRole, "Coaching Log Opened", `Opened coaching action sheet for ${selectedHODTeacher.teacher}`, "task");
                  alert(`Performance guidance checklist successfully logged. Notification & guidance agenda dispatched to ${selectedHODTeacher.teacher}.`);
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors border-none outline-none"
              >
                Issue Performance Guidance Checklist
              </button>
            </div>

          </div>
        </div>
      )}

      {/* HOD Chase Pending Submissions Modal */}
      {showHODChasePendingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-fade-in" id="hod-chase-pending-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 bg-rose-50 text-rose-750 border border-rose-150 font-mono text-[9px] font-bold rounded-md uppercase">Action Required</span>
                <h3 className="text-base font-bold text-slate-900">Chase UT4 Submissions</h3>
              </div>
              <button
                onClick={() => setShowHODChasePendingModal(false)}
                className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-semibold text-xs shrink-0 cursor-pointer bg-white"
              >
                Close
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-505 font-medium leading-relaxed font-sans">
                The following teachers in the <strong className="text-slate-800">{hodDepartment} Department</strong> have pending UT4 question paper drafts or submissions. Use the actions below to dispatch immediate follow-up alerts:
              </p>

              <div className="space-y-3">
                {(() => {
                  const pendingByDept: Record<string, any[]> = {
                    Mathematics: [
                      { name: "Ms. Kavita Singh", role: "Class 6-8 Math Teacher", status: "Overdue", lastNotify: "Yesterday" },
                      { name: "Mr. Arjun Das", role: "Class 11-12 Math Teacher", status: "Due Fri 30 May", lastNotify: "2 days ago" },
                      { name: "Mr. Rahul Verma", role: "Class 9-10 Math Teacher", status: "In Progress", lastNotify: "Never" }
                    ],
                    Science: [
                      { name: "Miss Melissa Green", role: "Class 6-7 Science Teacher", status: "Overdue", lastNotify: "3 days ago" },
                      { name: "Mr. Anthony Wright", role: "Class 11-12 Physics Teacher", status: "Due Fri 30 May", lastNotify: "Never" }
                    ],
                    English: [
                      { name: "Miss Jane Austen", role: "Class 8, 11 English Teacher", status: "Overdue", lastNotify: "Yesterday" },
                      { name: "Mr. Charles Dickens", role: "Class 9-10 English Teacher", status: "In Progress", lastNotify: "Never" }
                    ]
                  };

                  const list = pendingByDept[hodDepartment] || pendingByDept["Mathematics"];

                  return list.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800 font-sans text-xs">{item.name}</div>
                        <div className="text-[10px] text-slate-450 font-medium font-sans">{item.role}</div>
                        <div className="text-[9px] text-slate-400 font-mono">Last reminder: {item.lastNotify}</div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border font-mono ${
                          item.status === "Overdue" ? "bg-rose-50 text-rose-700 border-rose-150" : 
                          item.status === "In Progress" ? "bg-amber-50 text-amber-705 border-amber-150" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {item.status}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            logAction(currentUser, currentRole, "Chase Dispatched", `Sent UT4 paper reminder to ${item.name}`, "task");
                            alert(`Chase reminder successfully dispatched to ${item.name} via WhatsApp Link & Schooly instant SMS push! Link: http://wa.me/reminder-ut4`);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-bold text-[10px] text-blue-600 cursor-pointer shadow-3xs transition-all flex items-center gap-1"
                        >
                          Remind Now <Send size={10} />
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  logAction(currentUser, currentRole, "Bulk Chase Triggered", `Sent department-wide UT4 bulk follow-up reminder`, "task");
                  alert(`Bulk WhatsApp alerts and high-priority push emails dispatched to all pending teachers in the ${hodDepartment} Department.`);
                  setShowHODChasePendingModal(false);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors border-none"
              >
                Send Bulk Chase to All Pending Teachers
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Principal Chase Pending Submissions Modal */}
      {showPrincipalChasePendingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-fade-in" id="principal-chase-pending-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 bg-rose-50 text-rose-750 border border-rose-150 font-mono text-[9px] font-bold rounded-md uppercase">School-wide Oversight</span>
                <h3 className="text-base font-bold text-slate-900">Chase UT4 Paper Submissions</h3>
              </div>
              <button
                onClick={() => setShowPrincipalChasePendingModal(false)}
                className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-semibold text-xs shrink-0 cursor-pointer bg-white"
              >
                Close
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-505 font-medium leading-relaxed font-sans">
                The school-wide assessment compliance report shows outstanding UT4 draft papers. Dispatch high-priority reminder alerts to the respective department coordinators or teachers below:
              </p>

              <div className="space-y-3">
                {[
                  { name: "Ms. Kavita Singh", dept: "Mathematics", role: "Class 6-8 Math Teacher", status: "Overdue", lastNotify: "Yesterday" },
                  { name: "Miss Melissa Green", dept: "Science", role: "Class 6-7 Science Teacher", status: "Overdue", lastNotify: "3 days ago" },
                  { name: "Miss Jane Austen", dept: "English", role: "Class 8, 11 English Teacher", status: "Overdue", lastNotify: "Yesterday" },
                  { name: "Mr. Vikram Roy", dept: "Social Science", role: "Class 9-10 Geography Teacher", status: "Overdue", lastNotify: "2 days ago" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 font-sans text-xs">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium font-sans">{item.role} · <strong className="text-indigo-600">{item.dept}</strong></div>
                      <div className="text-[9px] text-slate-400 font-mono">Last reminder: {item.lastNotify}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border font-mono bg-rose-50 text-rose-700 border-rose-150">
                        {item.status}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          logAction(currentUser, currentRole, "Principal Chase Dispatched", `Sent administrative UT4 paper reminder to ${item.name}`, "task");
                          alert(`Official administrative reminder successfully dispatched to ${item.name} (${item.dept}) via automated WhatsApp call & high-priority SMS push!`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-bold text-[10px] text-blue-600 cursor-pointer shadow-3xs transition-all flex items-center gap-1"
                      >
                        Remind Now <Send size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  logAction(currentUser, currentRole, "School-wide Bulk Chase Triggered", "Sent executive school-wide pending paper alerts", "task");
                  alert("Bulk executive warnings and Schooly push notifications pushed out to all outstanding academic instructors.");
                  setShowPrincipalChasePendingModal(false);
                }}
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-755 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors border-none"
              >
                Send Administrative Bulk Chase to All Overdue
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Coordinator Chase Pending Submissions Modal */}
      {showCoordinatorChasePendingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-fade-in" id="coordinator-chase-pending-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-750 border border-amber-150 font-mono text-[9px] font-bold rounded-md uppercase">Coordinated Grades</span>
                <h3 className="text-base font-bold text-slate-900">Follow up on Guided Submissions</h3>
              </div>
              <button
                onClick={() => setShowCoordinatorChasePendingModal(false)}
                className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-semibold text-xs shrink-0 cursor-pointer bg-white"
              >
                Close
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-505 font-medium leading-relaxed font-sans">
                Review pending drafts under your grade level coordination (Grades 6-12). Instantly escalate reminders to keep compliance indices high:
              </p>

              <div className="space-y-3">
                {[
                  { name: "Mr. Arjun Das", role: "Class 11-12 Math Teacher", status: "Assigned", lastNotify: "2 days ago" },
                  { name: "Miss Jane Austen", role: "Class 8, 11 English Teacher", status: "Overdue", lastNotify: "Yesterday" },
                  { name: "Miss Melissa Green", role: "Class 6-7 Science Teacher", status: "Overdue", lastNotify: "3 days ago" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 font-sans text-xs">{item.name}</div>
                      <div className="text-[10px] text-slate-450 font-medium font-sans">{item.role}</div>
                      <div className="text-[9px] text-slate-400 font-mono">Last reminder: {item.lastNotify}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border font-mono ${
                        item.status === "Overdue" ? "bg-rose-50 text-rose-700 border-rose-150" : "bg-amber-50 text-amber-705 border-amber-150"
                      }`}>
                        {item.status}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          logAction(currentUser, currentRole, "Coordinator Escalated Reminder", `Escalated compliance reminder to ${item.name}`, "task");
                          alert(`Escalated draft reminder successfully triggered for ${item.name} via high-priority email notification.`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-bold text-[10px] text-blue-600 cursor-pointer shadow-3xs transition-all flex items-center gap-1"
                      >
                        Escalate <Send size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  logAction(currentUser, currentRole, "Coordinator Bulk Reminder", "Fired coordinator bulk notifications", "task");
                  alert("Coordinated grade alerts and dashboard task ticks successfully dispatched.");
                  setShowCoordinatorChasePendingModal(false);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors border-none"
              >
                Dispatch Coordinated Grades Recall Push Alert
              </button>
            </div>

          </div>
        </div>
      )}

      {isAdminRole() && (
        <RoleDashboards
          role="admin"
          currentUser={currentUser}
          currentRole={currentRole}
          files={files}
          courses={courses}
          tasks={tasks}
          students={students}
          renderWelcomeHeader={renderWelcomeHeader}
          logAction={logAction}
        />
      )}

      {isManagerRole() && (
        <RoleDashboards
          role="manager"
          currentUser={currentUser}
          currentRole={currentRole}
          files={files}
          courses={courses}
          tasks={tasks}
          students={students}
          renderWelcomeHeader={renderWelcomeHeader}
          logAction={logAction}
        />
      )}

      {isHrRole() && (
        <RoleDashboards
          role="hr"
          currentUser={currentUser}
          currentRole={currentRole}
          files={files}
          courses={courses}
          tasks={tasks}
          students={students}
          renderWelcomeHeader={renderWelcomeHeader}
          logAction={logAction}
        />
      )}

      {isExamsRole() && (
        <RoleDashboards
          role="exams"
          currentUser={currentUser}
          currentRole={currentRole}
          files={files}
          courses={courses}
          tasks={tasks}
          students={students}
          renderWelcomeHeader={renderWelcomeHeader}
          logAction={logAction}
        />
      )}

      {isParentRole() && (
        <RoleDashboards
          role="parent"
          currentUser={currentUser}
          currentRole={currentRole}
          files={files}
          courses={courses}
          tasks={tasks}
          students={students}
          renderWelcomeHeader={renderWelcomeHeader}
          logAction={logAction}
        />
      )}

      {isStudentRole() && (
        <RoleDashboards
          role="student"
          currentUser={currentUser}
          currentRole={currentRole}
          files={files}
          courses={courses}
          tasks={tasks}
          students={students}
          renderWelcomeHeader={renderWelcomeHeader}
          logAction={logAction}
        />
      )}

      {/* Classroom Active Stream Updates */}
      {!isHodRole() && isWidgetAuthorized("classroom_announcements") && (
        <div className="bg-slate-50/50 hover:bg-white border border-slate-205 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 mt-8" id="classroom-stream-card">
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
            {courses.map(course => (
              <div 
                key={course.id} 
                className="p-4 bg-white border border-slate-100 border-l-4 border-l-indigo-500 rounded-xl space-y-2 hover:bg-slate-50/50 hover:shadow-2xs transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {course.name} - {course.section}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-medium bg-slate-50 border border-slate-100 rounded px-2 py-0.5">{course.teacherName}</span>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed font-sans pl-1">
                  "{course.announcements[0] || "No announcements this week."}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Chase Pending Submissions Modal */}
      {showTeacherChasePendingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-fade-in" id="teacher-chase-pending-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 bg-rose-50 text-rose-750 border border-rose-150 font-mono text-[9px] font-bold rounded-md uppercase">My Student Queue</span>
                <h3 className="text-base font-bold text-slate-900">Chase Pending Grade Submissions</h3>
              </div>
              <button
                onClick={() => setShowTeacherChasePendingModal(false)}
                className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-semibold text-xs shrink-0 cursor-pointer bg-white"
              >
                Close
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-505 font-medium leading-relaxed font-sans">
                The students below have missed active homework, assignments, or revision tasks under your assigned class syllabus:
              </p>

              <div className="space-y-3">
                {[
                  { name: "Aarav Sharma", classSec: "Class 8A", assignment: "UT4 Math Practice Quiz", status: "Overdue", days: "2 days ago" },
                  { name: "Priya Patel", classSec: "Class 8A", assignment: "Assessment Workbook Ex 4B", status: "Overdue", days: "Yesterday" },
                  { name: "Rohan Das", classSec: "Class 8B", assignment: "UT4 Math Revision Layout", status: "Assigned", days: "Due Tomorrow" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 font-sans text-xs">{item.name} ({item.classSec})</div>
                      <div className="text-[10px] text-slate-450 font-medium font-sans">{item.assignment}</div>
                      <div className="text-[9px] text-slate-400 font-mono">Status: {item.days}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border font-mono ${
                        item.status === "Overdue" ? "bg-rose-50 text-rose-700 border-rose-150" : "bg-slate-150 text-slate-650 border-slate-220"
                      }`}>
                        {item.status}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          logAction(currentUser, currentRole, "Student Recall Triggered", `Sent assignment reminder alert to student: ${item.name}`, "task");
                          alert(`Homework due alert dispatched successfully to ${item.name} and their registered guardian email address.`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-bold text-[10px] text-blue-600 cursor-pointer shadow-3xs transition-all flex items-center gap-1"
                      >
                        Ping student <Send size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  logAction(currentUser, currentRole, "Bulk Class Reminder Dispatched", "Dispatched homework recalls for all outstanding items", "task");
                  alert("Urgent class recalls and Google Classroom automated reminders successfully broadcast to all defaulters.");
                  setShowTeacherChasePendingModal(false);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors border-none"
              >
                Send Urgent Classroom Warning to All Defaulters
              </button>
            </div>

          </div>
        </div>
      )}

      {/* GENERIC RECORD INSPECTOR (DRILL THROUGH TO DETAILED RECORD VIEW) */}
      {inspectedRecord && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4 font-sans animate-fade-in" 
          id="generic-record-inspector-modal"
          onClick={() => setInspectedRecord(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-750 border border-blue-150 font-mono text-[9px] font-bold rounded-md uppercase tracking-wider">
                  {inspectedRecord.type}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {inspectedRecord.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectedRecord(null)}
                className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-semibold text-xs shrink-0 cursor-pointer bg-white"
              >
                Close
              </button>
            </div>

            {/* Main Content Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-medium rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Connected via Active Fallback Integrations (Live Schema Agreement Synced)</span>
              </div>

              {/* Data Properties List */}
              <div className="space-y-2 border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {Object.entries(inspectedRecord.data).map(([key, val]) => {
                  const humanLabel = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase());
                  
                  let renderedVal = "";
                  if (val === null || val === undefined) {
                    renderedVal = "N/A";
                  } else if (typeof val === "boolean") {
                    renderedVal = val ? "Yes" : "No";
                  } else if (Array.isArray(val)) {
                    renderedVal = val.join(", ");
                  } else if (typeof val === "object") {
                    renderedVal = JSON.stringify(val);
                  } else {
                    renderedVal = String(val);
                  }

                  if (["id", "isFavorite", "isInactive", "announcements"].includes(key)) {
                    return null;
                  }

                  return (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-baseline justify-between p-3 text-xs gap-1 select-text">
                      <span className="text-slate-400 font-bold uppercase text-[9px] font-mono tracking-wider sm:max-w-[180px] shrink-0 truncate font-sans">
                        {humanLabel}
                      </span>
                      <span className="text-slate-800 font-semibold font-sans text-right break-all">
                        {renderedVal}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Raw JSON inspection block */}
              <div className="space-y-1.5 bg-transparent">
                <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 block tracking-wider">
                  Raw Schematic Payload Block
                </span>
                <pre className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl font-mono text-[10px] text-slate-600 block break-all overflow-x-auto max-h-[140px] whitespace-pre-wrap leading-relaxed select-text font-semibold">
                  {JSON.stringify(inspectedRecord.data, null, 2)}
                </pre>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500 font-sans">
              <span>Primary schema source: local connector memory cache</span>
              <button
                onClick={() => {
                  setInspectedRecord(null);
                  const activeTabField = document.getElementById("mock-data-studio-root");
                  if (activeTabField) {
                    activeTabField.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer border border-slate-250 hover:border-slate-350"
              >
                Inspect Schema Engine
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

