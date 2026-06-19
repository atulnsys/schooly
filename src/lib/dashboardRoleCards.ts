export type DashboardRoleKey =
  | "principal"
  | "admin"
  | "coordinator"
  | "hod"
  | "teacher"
  | "manager"
  | "hr"
  | "exams"
  | "parent"
  | "student";

export type DashboardCardCountMode =
  | "registryRows"
  | "registryTabs"
  | "liveRows"
  | "blueprintRows";

export interface DashboardCardModel {
  cardKey: string;
  title: string;
  summary: string;
  topRows: number;
  totalRows: number;
  sourceTabs: string[];
  filters: Record<string, string>;
  drillThroughTarget: string;
  drillThroughLabel: string;
  emptyState: string;
}

export interface DashboardRoleCardDefinition {
  key: string;
  role: DashboardRoleKey;
  title: string;
  details: string;
  source: string;
  emptyState: string;
  sourceBadge: string;
  countMode: DashboardCardCountMode;
  registryKeys?: string[];
  tabNames?: string[];
  blueprintRole?: DashboardRoleKey;
  actionTab?: string;
  icon: string;
  sortOrder: number;
}

export function toDashboardCardModel(
  card: DashboardRoleCardDefinition,
  totalRows: number,
  role: DashboardRoleKey
): DashboardCardModel {
  return {
    cardKey: card.key,
    title: card.title,
    summary: card.details,
    topRows: Math.min(totalRows, 5),
    totalRows,
    sourceTabs: card.tabNames || [],
    filters: {
      role,
      cardKey: card.key,
      source: card.source
    },
    drillThroughTarget: `/dashboard/details/${role}/${card.key}`,
    drillThroughLabel: totalRows > 0 ? `Open details (${totalRows})` : "Open details",
    emptyState: card.emptyState
  };
}

export const DASHBOARD_ROLE_TITLES: Record<DashboardRoleKey, string> = {
  principal: "Principal Dashboard",
  admin: "School Admin Dashboard",
  coordinator: "Coordinator Dashboard",
  hod: "HOD Dashboard",
  teacher: "Teacher Dashboard",
  manager: "Manager Dashboard",
  hr: "HR Dashboard",
  exams: "Examination Dashboard",
  parent: "Parent Dashboard",
  student: "Student Dashboard"
};

export const DASHBOARD_ROLE_CARD_CONFIGS: DashboardRoleCardDefinition[] = [
  { key: "principal-readiness", role: "principal", title: "Overall School Readiness", details: "Live registry and sync coverage.", source: "Google Sheets", emptyState: "No live registry rows found.", sourceBadge: "Google Sheets", countMode: "liveRows", icon: "ShieldAlert", sortOrder: 1 },
  { key: "principal-pacing", role: "principal", title: "Weekly Pacing Compliance", details: "Syllabus pacing and chapter progress.", source: "Dashboard Data Source", emptyState: "No pacing data found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Syllabus_Coverage"], icon: "BarChart2", sortOrder: 2 },
  { key: "principal-escalations", role: "principal", title: "Pending Escalations", details: "Open alerts and follow-ups.", source: "Dashboard Data Source", emptyState: "No open alerts found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Alert_Log"], icon: "Bell", sortOrder: 3 },
  { key: "principal-staff", role: "principal", title: "Registered Staff", details: "Active staff in the master registry.", source: "Master Registry", emptyState: "No staff rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["masterDataRegistryUrl"], tabNames: ["Staff_Directory"], icon: "UserCheck", sortOrder: 4 },
  { key: "principal-teacher-matrix", role: "principal", title: "Teacher Performance Matrix", details: "Teacher allocations, activity, and completion.", source: "Master Registry", emptyState: "No teacher matrix rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["masterDataRegistryUrl", "dashboardDataSourceUrl"], tabNames: ["Teacher_Allocations", "Classroom_Activity", "Assessment_Tracking"], icon: "LayoutGrid", sortOrder: 5 },
  { key: "principal-student-risk", role: "principal", title: "Student Risk Register", details: "Risk and remedial rows requiring attention.", source: "Assessment / Result Registry", emptyState: "No student risk rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl", "dashboardDataSourceUrl"], tabNames: ["Result_Analysis", "Alert_Log"], icon: "AlertTriangle", sortOrder: 6 },
  { key: "principal-sqaa", role: "principal", title: "SQAA / Safety Compliance", details: "Evidence and compliance checks.", source: "QA/SQAA Registry", emptyState: "No SQAA rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["qaSqaaRegistryUrl"], tabNames: ["SQAA_Evidence_Map", "Compliance_Report_Registry"], icon: "ShieldAlert", sortOrder: 7 },

  { key: "admin-connectors", role: "admin", title: "API / Connector Status", details: "Connected registries and read health.", source: "Registry Source", emptyState: "No connected registries found.", sourceBadge: "Source Health", countMode: "liveRows", icon: "Database", sortOrder: 1 },
  { key: "admin-health", role: "admin", title: "Registry Health", details: "Readable registry tabs and row counts.", source: "Registry Source", emptyState: "No registry health rows found.", sourceBadge: "Source Health", countMode: "liveRows", icon: "ShieldAlert", sortOrder: 2 },
  { key: "admin-drive", role: "admin", title: "Drive File Coverage", details: "Mapped Drive files and folders.", source: "Drive Registry", emptyState: "No Drive files mapped yet.", sourceBadge: "Drive Registry", countMode: "registryRows", registryKeys: ["ncertPrivateDriveMapUrl", "lessonWorkspaceRegistryUrl"], tabNames: ["NCERT_Drive_Source_Folders", "NCERT_Chapter_File_Map", "Artifact_Registry"], icon: "FolderOpen", sortOrder: 3 },
  { key: "admin-governance", role: "admin", title: "Active Governance / SQAA Rules", details: "Governance and evidence rules.", source: "QA/SQAA Registry", emptyState: "No governance rules found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["qaSqaaRegistryUrl"], tabNames: ["QA_Checklist_Config", "QA_Review_Log", "SQAA_Evidence_Map"], icon: "ShieldAlert", sortOrder: 4 },
  { key: "admin-alerts", role: "admin", title: "Sync Issues / Alerts", details: "Open sync and integration alerts.", source: "Dashboard Data Source", emptyState: "No alerts found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl", "classroomSyncRegistryUrl"], tabNames: ["Alert_Log", "Dashboard_Alerts", "Classroom_Sync_Log"], icon: "Bell", sortOrder: 5 },

  { key: "coordinator-students", role: "coordinator", title: "Active Students by Class Range", details: "Current class and section scope.", source: "Master Registry", emptyState: "No student rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["masterDataRegistryUrl"], tabNames: ["Student_Directory", "Classes_Sections"], icon: "Users", sortOrder: 1 },
  { key: "coordinator-lessons", role: "coordinator", title: "Lessons / Planners Mapped", details: "Lesson workspace and planner rows.", source: "Lesson Workspace Registry", emptyState: "No lesson rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["lessonWorkspaceRegistryUrl", "dashboardDataSourceUrl"], tabNames: ["Lesson_Workspace_Registry", "Planner_Submissions"], icon: "BookOpen", sortOrder: 2 },
  { key: "coordinator-exceptions", role: "coordinator", title: "Pacing Audit Exceptions", details: "Coverage gaps needing review.", source: "Dashboard Data Source", emptyState: "No pacing exceptions found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Curriculum_Coverage", "Evidence_Gaps"], icon: "AlertTriangle", sortOrder: 3 },
  { key: "coordinator-drive", role: "coordinator", title: "Drive Folder Coverage", details: "Mapped chapter and lesson folders.", source: "Drive Registry", emptyState: "No Drive folder coverage found.", sourceBadge: "Drive Registry", countMode: "registryRows", registryKeys: ["ncertPrivateDriveMapUrl", "lessonWorkspaceRegistryUrl"], tabNames: ["NCERT_Drive_Source_Folders", "NCERT_Chapter_File_Map", "Artifact_Registry"], icon: "FolderOpen", sortOrder: 4 },
  { key: "coordinator-weekly", role: "coordinator", title: "Weekly Planner Audit", details: "Submitted planners and classroom sync.", source: "Dashboard Data Source", emptyState: "No planner audit rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl", "classroomSyncRegistryUrl"], tabNames: ["Planner_Submissions", "Classroom_Activity", "Dashboard_Alerts"], icon: "Calendar", sortOrder: 5 },
  { key: "coordinator-activities", role: "coordinator", title: "Upcoming Academic Activities", details: "Scheduled events and subject actions.", source: "Dashboard Data Source", emptyState: "No upcoming academic activity rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Dashboard_Metrics", "Dashboard_Alerts"], icon: "Clock", sortOrder: 6 },

  { key: "hod-resources", role: "hod", title: "Department Repository Resources", details: "Department artifacts and reusable materials.", source: "Lesson Workspace Registry", emptyState: "No department resources found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["lessonWorkspaceRegistryUrl"], tabNames: ["Artifact_Registry", "Lesson_Workspace_Registry"], icon: "Database", sortOrder: 1 },
  { key: "hod-chapters", role: "hod", title: "Chapters Fully Resourced", details: "Covered chapters and mapped files.", source: "NCERT Private Map", emptyState: "No chapter coverage found.", sourceBadge: "Drive Registry", countMode: "registryRows", registryKeys: ["ncertPrivateDriveMapUrl"], tabNames: ["NCERT_Chapter_File_Map"], icon: "BookOpen", sortOrder: 2 },
  { key: "hod-question-banks", role: "hod", title: "Question Bank Coverage", details: "Verified assessment bank rows.", source: "Assessment / Result Registry", emptyState: "No question bank rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl"], tabNames: ["Question_Paper_Registry"], icon: "CheckSquare", sortOrder: 3 },
  { key: "hod-average", role: "hod", title: "Department Assessment Average", details: "Average assessment performance.", source: "Assessment / Result Registry", emptyState: "No assessment average rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl"], tabNames: ["Result_Analysis"], icon: "BarChart2", sortOrder: 4 },
  { key: "hod-syllabus", role: "hod", title: "Teacher Syllabus Compliance", details: "Coverage and pacing by teacher.", source: "Dashboard Data Source", emptyState: "No syllabus compliance rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl", "lessonWorkspaceRegistryUrl"], tabNames: ["Syllabus_Coverage", "Lesson_Execution_Log"], icon: "Check", sortOrder: 5 },
  { key: "hod-gaps", role: "hod", title: "Resource Gaps by Class", details: "Missing files and unresolved coverage.", source: "Dashboard Data Source", emptyState: "No resource gaps found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl", "ncertPrivateDriveMapUrl"], tabNames: ["Evidence_Gaps", "NCERT_Chapter_File_Map"], icon: "AlertTriangle", sortOrder: 6 },

  { key: "teacher-classes", role: "teacher", title: "Classes Today", details: "Today's timetable and lesson load.", source: "Master Registry", emptyState: "No class schedule found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["masterDataRegistryUrl"], tabNames: ["Timetable", "Teacher_Allocations"], icon: "Calendar", sortOrder: 1 },
  { key: "teacher-syllabus", role: "teacher", title: "Syllabus Progress", details: "Assigned class pacing status.", source: "Lesson Workspace Registry", emptyState: "No pacing rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["lessonWorkspaceRegistryUrl", "dashboardDataSourceUrl"], tabNames: ["Lesson_Workspace_Registry", "Syllabus_Coverage"], icon: "BarChart2", sortOrder: 2 },
  { key: "teacher-tasks", role: "teacher", title: "Pending Student Tasks", details: "Open tasks and submissions.", source: "Classroom Sync Registry", emptyState: "No pending tasks found.", sourceBadge: "Classroom Sync", countMode: "registryRows", registryKeys: ["classroomSyncRegistryUrl", "dashboardDataSourceUrl"], tabNames: ["Classroom_Assignment_Map", "Classroom_Submission_Sync", "Assessment_Tracking"], icon: "CheckSquare", sortOrder: 3 },
  { key: "teacher-drive", role: "teacher", title: "Folder Assets Synced", details: "Mapped chapter and lesson files.", source: "Drive Registry", emptyState: "No folder assets mapped yet.", sourceBadge: "Drive Registry", countMode: "registryRows", registryKeys: ["ncertPrivateDriveMapUrl", "lessonWorkspaceRegistryUrl"], tabNames: ["NCERT_Chapter_File_Map", "Artifact_Registry"], icon: "FolderOpen", sortOrder: 4 },
  { key: "teacher-agenda", role: "teacher", title: "Today's Teaching Agenda", details: "Today's classes, chapters, and tasks.", source: "Dashboard Data Source", emptyState: "No teaching agenda rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl", "classroomSyncRegistryUrl"], tabNames: ["Dashboard_Metrics", "Classroom_Activity"], icon: "Clock", sortOrder: 5 },
  { key: "teacher-board", role: "teacher", title: "Curriculum / Pacing Board", details: "Coverage, planner, and evidence board.", source: "Dashboard Data Source", emptyState: "No curriculum board rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl", "lessonWorkspaceRegistryUrl"], tabNames: ["Curriculum_Coverage", "Planner_Submissions", "Lesson_Execution_Log"], icon: "LayoutGrid", sortOrder: 6 },

  { key: "manager-ops", role: "manager", title: "Operations Readiness", details: "School-wide registry readiness.", source: "Master Registry", emptyState: "No operations rows found.", sourceBadge: "Google Sheets", countMode: "liveRows", icon: "Briefcase", sortOrder: 1 },
  { key: "manager-compliance", role: "manager", title: "Compliance Readiness", details: "SQAA and governance rows.", source: "QA/SQAA Registry", emptyState: "No compliance rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["qaSqaaRegistryUrl"], tabNames: ["Compliance_Report_Registry", "SQAA_Evidence_Map", "QA_Review_Log"], icon: "ShieldAlert", sortOrder: 2 },
  { key: "manager-assessments", role: "manager", title: "Assessment Operations", details: "Assessment and results readiness.", source: "Assessment / Result Registry", emptyState: "No assessment rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl"], tabNames: ["Assessment_Plan", "Result_Processing", "Result_Analysis"], icon: "Award", sortOrder: 3 },
  { key: "manager-classroom", role: "manager", title: "Classroom Operations", details: "Classroom sync readiness.", source: "Classroom Sync Registry", emptyState: "No Classroom rows found.", sourceBadge: "Classroom Sync", countMode: "registryRows", registryKeys: ["classroomSyncRegistryUrl"], tabNames: ["Classroom_Course_Map", "Classroom_Sync_Log"], icon: "LayoutGrid", sortOrder: 4 },

  { key: "hr-workforce", role: "hr", title: "Registered Workforce", details: "Active staff directory rows.", source: "Master Registry", emptyState: "No workforce rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["masterDataRegistryUrl"], tabNames: ["Staff_Directory", "Teacher_Allocations"], icon: "UserCheck", sortOrder: 1 },
  { key: "hr-leaves", role: "hr", title: "Approved Leaves", details: "Approved leave and dispatch rows.", source: "CPD / Leave Registry", emptyState: "No approved leave rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Alert_Log"], icon: "Calendar", sortOrder: 2 },
  { key: "hr-cpd", role: "hr", title: "CPD Compliance", details: "Training progress and targets.", source: "CPD / Leave Registry", emptyState: "No CPD rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Dashboard_Metrics", "Compliance_Evidence_Summary"], icon: "Check", sortOrder: 3 },
  { key: "hr-substitution", role: "hr", title: "Substitution / Dispatch Pending", details: "Open substitution and dispatch work.", source: "CPD / Leave Registry", emptyState: "No substitution rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Alert_Log", "Evidence_Gaps"], icon: "Briefcase", sortOrder: 4 },
  { key: "hr-warnings", role: "hr", title: "Missing Reviews / Training Warnings", details: "Pending HR reviews and warnings.", source: "QA/SQAA Registry", emptyState: "No HR warnings found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["qaSqaaRegistryUrl"], tabNames: ["QA_Review_Log", "Compliance_Report_Registry"], icon: "AlertTriangle", sortOrder: 5 },

  { key: "exams-candidates", role: "exams", title: "Board Candidates", details: "Board candidate and result rows.", source: "Assessment / Result Registry", emptyState: "No board candidates found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl"], tabNames: ["Result_Processing", "Report_Card_Registry"], icon: "Award", sortOrder: 1 },
  { key: "exams-assessments", role: "exams", title: "Scheduled Assessments", details: "Assessment plan and exam calendar rows.", source: "Assessment / Result Registry", emptyState: "No scheduled assessments found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl"], tabNames: ["Assessment_Plan", "Exam_Calendar"], icon: "Calendar", sortOrder: 2 },
  { key: "exams-question-banks", role: "exams", title: "Question Banks Verified", details: "Verified question and paper rows.", source: "Assessment / Result Registry", emptyState: "No verified question banks found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl"], tabNames: ["Question_Paper_Registry"], icon: "CheckSquare", sortOrder: 3 },
  { key: "exams-average", role: "exams", title: "Average School Score", details: "Result averages and analysis.", source: "Assessment / Result Registry", emptyState: "No school score rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl"], tabNames: ["Result_Analysis", "Result_Processing"], icon: "BarChart2", sortOrder: 4 },
  { key: "exams-board-grid", role: "exams", title: "Board Preparation Grid", details: "Board scheduling and review grid.", source: "Assessment / Result Registry", emptyState: "No board grid rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl"], tabNames: ["Assessment_Plan", "Marks_Entry", "Result_Processing"], icon: "LayoutGrid", sortOrder: 5 },
  { key: "exams-review-queue", role: "exams", title: "Draft Paper Review Queue", details: "Open paper and review rows.", source: "Assessment / Result Registry", emptyState: "No paper review rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["assessmentResultRegistryUrl"], tabNames: ["Question_Paper_Registry", "Result_Analysis"], icon: "FileText", sortOrder: 6 },

  { key: "parent-attendance", role: "parent", title: "Student Attendance / Engagement", details: "Attendance and engagement rows.", source: "Attendance Registry", emptyState: "No attendance rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Attendance_Summary", "Classroom_Activity"], icon: "Check", sortOrder: 1 },
  { key: "parent-tickets", role: "parent", title: "Advisory Tickets", details: "Open support and advisory tickets.", source: "Support Registry", emptyState: "No advisory tickets found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Alert_Log", "Dashboard_Alerts"], icon: "AlertTriangle", sortOrder: 2 },
  { key: "parent-events", role: "parent", title: "Upcoming Events / Notices", details: "Announcements and school notices.", source: "Dashboard Data Source", emptyState: "No upcoming notices found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Dashboard_Alerts", "Dashboard_Metrics"], icon: "Bell", sortOrder: 3 },
  { key: "parent-transport", role: "parent", title: "Transport Status", details: "Linked transport status only.", source: "Transport Registry", emptyState: "Transport data not connected.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Alert_Log"], icon: "Database", sortOrder: 4 },
  { key: "parent-announcements", role: "parent", title: "Announcements", details: "Class updates and notices.", source: "Classroom Sync", emptyState: "No announcements found.", sourceBadge: "Classroom Sync", countMode: "registryRows", registryKeys: ["classroomSyncRegistryUrl"], tabNames: ["Classroom_Activity", "Classroom_Assignment_Map"], icon: "LayoutGrid", sortOrder: 5 },
  { key: "parent-support", role: "parent", title: "Safety / Support Updates", details: "Open safety and support updates.", source: "Support Registry", emptyState: "No support updates found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Alert_Log", "Evidence_Gaps"], icon: "ShieldAlert", sortOrder: 6 },

  { key: "student-assignments", role: "student", title: "Active Assignments", details: "Current classroom assignment rows.", source: "Classroom Sync", emptyState: "No assignments found.", sourceBadge: "Classroom Sync", countMode: "registryRows", registryKeys: ["classroomSyncRegistryUrl"], tabNames: ["Classroom_Assignment_Map"], icon: "CheckSquare", sortOrder: 1 },
  { key: "student-attendance", role: "student", title: "Term Attendance", details: "Attendance and engagement rows.", source: "Attendance Registry", emptyState: "No attendance rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Attendance_Summary"], icon: "Check", sortOrder: 2 },
  { key: "student-courses", role: "student", title: "Registered Courses", details: "Current classes and timetable.", source: "Master Registry", emptyState: "No registered courses found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["masterDataRegistryUrl"], tabNames: ["Classes_Sections", "Timetable"], icon: "GraduationCap", sortOrder: 3 },
  { key: "student-activities", role: "student", title: "Extracurricular / Activity Points", details: "Activity and participation rows.", source: "Dashboard Data Source", emptyState: "No activity rows found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Dashboard_Metrics", "Dashboard_Alerts"], icon: "Star", sortOrder: 4 },
  { key: "student-tasks", role: "student", title: "Personal Tasks", details: "Open student follow-ups.", source: "Support Registry", emptyState: "No personal tasks found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["dashboardDataSourceUrl"], tabNames: ["Alert_Log", "Dashboard_Alerts"], icon: "Clock", sortOrder: 5 },
  { key: "student-schedule", role: "student", title: "Daily Schedule", details: "Today's timetable and schedule.", source: "Timetable Registry", emptyState: "No daily schedule found.", sourceBadge: "Google Sheets", countMode: "registryRows", registryKeys: ["masterDataRegistryUrl"], tabNames: ["Timetable"], icon: "Calendar", sortOrder: 6 }
];

export function getDashboardRoleCards(role: DashboardRoleKey): DashboardRoleCardDefinition[] {
  return DASHBOARD_ROLE_CARD_CONFIGS
    .filter((card) => card.role === role)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
