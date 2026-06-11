export interface WorkspaceFile {
  id: string;
  name: string;
  type: 'doc' | 'sheet' | 'slide' | 'pdf' | 'email' | 'form' | 'classroom_material';
  source: 'Drive' | 'Gmail' | 'Classroom' | 'LMS' | 'SIS' | 'Shared Drive';
  path: string;
  owner: string;
  modifiedAt: string;
  sharingRule: 'Private' | 'Domain Shared' | 'Public' | 'Department Only';
  isFavorite: boolean;
  tags: string[];
  size: string;
  contentSum: string;
  webViewLink?: string;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section: string;
  teacherName: string;
  studentCount: number;
  announcements: string[];
  materials: { name: string; url: string }[];
}

export interface ClassroomAssignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  dueDate: string;
  totalPoints: number;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
  submissionCount: number;
  description: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  fileId?: string;
  fileTitle?: string;
  dueDate: string;
  assignedTo: string;
  scope?: 'individual' | 'team' | 'department' | 'school';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  detail: string;
  category: 'auth' | 'search' | 'file_access' | 'task' | 'rollover' | 'automation';
  success: boolean;
}

export interface AutomationRule {
  id: string;
  title: string;
  triggerType: 'file_created' | 'assignment_overdue' | 'class_rollover' | 'task_escalation';
  triggerDesc: string;
  actionType: 'email_notify' | 'create_task' | 'alert_slack';
  actionDesc: string;
  isActive: boolean;
  lastTriggered?: string;
}

export interface TeacherDetails {
  id: string;
  name: string;
  email: string;
  department: string;
  currentCourses: string[];
}

export interface StudentDetails {
  id: string;
  name: string;
  email: string;
  gradeLevel: string;
  enrollmentStatus: string;
  riskFactor?: 'high' | 'medium' | 'low';
  riskScore?: number; // 0 - 100
  gpa: number;
}

export interface AcademicYearConfig {
  currentYear: string;
  targetYear: string;
  status: 'idle' | 'in_progress' | 'completed';
  promotionCount: number;
  archivedCoursesCount: number;
  clonedWorkflowsCount: number;
  completedAt?: string;
}

export interface SchoolDriveManifest {
  schemaId?: string;
  schemaVersion?: string;
  schoolName?: string;
  schoolCode?: string;
  curriculum?: string;
  configSource?: string;
  rootPath: string;
  academicYear: string;
  createdTimestamp: string;
  academicRepositoryRoot: string;
  governanceRoot: string;
  classroomTemplatesRoot: string;
  formsIntakeRoot: string;
  orgStructureRoot: string;
  institutionalIdentities?: {
    academicRepository: string;
    governance: string;
    classroomAdmin: string;
  };
  serviceAccounts: string[];
  departmentGroups: string[];
  teacherGroups: string[];
  standardClassroomTopics: string[];
  repositoryStages: string[];
  repositoryClasses: Record<string, string[]>;
  repositorySections: string[];
  repositorySubjects: Record<string, string[]>;
  subjectArtifactFolders: string[];
  governanceFolders?: string[];
  formsIntakeCategories?: string[];
  dashboardModules?: string[];
  pathSafetyMode?: string;
}

export interface TeacherPerformanceIndicator {
  teacher: string;
  plannerStatus: "Done" | "Partial" | "Missing";
  assessmentStatus: "Done" | "Partial" | "Missing";
  resourceCount: number;
  activityStatus: "Active" | "Low" | "Inactive";
  source?: "Google Drive" | "Google Classroom" | "Schooly";
  class?: string;
  subject?: string;
  dateRange?: string;
  lastActive?: string;
}

export interface MonitoringFormFeed {
  id: string;
  name: string;
  summary: string;
  statusLabel: string;
  statusType: "good" | "warning" | "risk" | "info";
  submittedCount?: number;
  pendingCount?: number;
  overdueCount?: number;
  responsibleOwner?: string;
  linkedClassSection?: string;
  lastSubmittedDate?: string;
  evidenceLinkLabel?: string;
  source?: string;
}

export interface PrincipalAcademicLevel {
  level: string;
  percentage: number;
  status?: "healthy" | "watch" | "critical";
}

export interface PrincipalComplianceItem {
  label: string;
  percentage: number;
  status?: "healthy" | "watch" | "critical";
}

export interface PrincipalDashboardData {
  academicMonitoring: {
    levels: PrincipalAcademicLevel[];
    summaryLabel: string;
  };
  classroomMonitoring: {
    totalClassrooms: number;
    postedThisWeek: number;
    zeroActivityThisWeek: number;
    assignmentsCreatedThisWeek: number;
    averageSubmissionRate: number;
    meetSessionsHeldThisWeek: number;
  };
  compliance: {
    items: PrincipalComplianceItem[];
    overallPercentage: number;
  };
}

export interface AssignedClassPerformance {
  class: string;
  classPerformancePercent: number;
  classroomPostingDaysCompleted: number;
}

export interface TeacherDashboardMockSchema {
  teacherId: string;
  teacherName: string;
  subject: string;
  assessmentName: string;
  schoolSubjectAverage: number;
  teacherAverage: number;
  classroomPostingDaysExpected: number;
  attentionThresholds: {
    performanceWarning: number;
    postingPerfect: number;
    postingWarning: number;
    postingCritical: number;
  };
  assignedClasses: AssignedClassPerformance[];
}

export interface CoordinatorProfile {
  initials: string;
  name: string;
  title: string;
  subtitle: string;
  dateValue: string;
}

export interface CoordinatorKpi {
  id: string;
  title: string;
  value: string;
  subtext: string;
  status: "success" | "warning" | "attention" | string;
}

export interface PlannerStatusRow {
  class: string;
  six: string;
  seven: string;
  eight: string;
  assess: string;
  nb: string;
}

export interface SyllabusCoverageRow {
  class: string;
  coverage: number;
}

export interface AssessmentCompletionRow {
  subject: string;
  completion: number;
}

export interface CoordinatorDashboardMockSchema {
  coordinatorProfile: CoordinatorProfile;
  kpis: CoordinatorKpi[];
  plannerStatusMatrix: {
    headers: string[];
    rows: PlannerStatusRow[];
  };
  syllabusCoverage: SyllabusCoverageRow[];
  assessmentCompletion: AssessmentCompletionRow[];
}




