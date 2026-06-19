export interface WorkspaceFile {
  id: string;
  name: string;
  type: 'doc' | 'sheet' | 'slide' | 'pdf' | 'email' | 'form' | 'classroom_material';
  source: 'Drive' | 'Gmail' | 'Classroom' | 'LMS' | 'SIS' | 'Shared Drive';
  path: string;
  owner: string;
  modifiedAt: string;
  medium?: string;
  className?: string;
  subjectName?: string;
  bookName?: string;
  topicName?: string;
  chapterNumber?: number;
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
  gpa?: number;
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

export type DashboardRole =
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

export interface DashboardMetric {
  label: string;
  value: string;
  source: string;
  status?: "healthy" | "warning" | "attention" | "neutral";
}

export interface DashboardPanel {
  id: string;
  title: string;
  description?: string;
  cards: DashboardCardConfig[];
}

export interface DashboardCardConfig {
  key: string;
  role: DashboardRole;
  title: string;
  details: string;
  source: string;
  emptyState: string;
  sortOrder: number;
  actionTab?: string;
  sourceBadge?: string;
}

export interface DashboardSourceHealth {
  label: string;
  url: string;
  connected: boolean;
  rowCount: number;
  lastReadAt?: string | null;
  warning?: string;
}

export interface RegistryHealthRow {
  key: string;
  label: string;
  url: string;
  connected: boolean;
  rowCount: number;
  lastReadAt?: string | null;
  warning?: string;
  error?: string;
  missingTabs: string[];
  emptyTabs: string[];
}

export interface RegistryHealthSummary {
  totalRegistries: number;
  connectedRegistries: number;
  warningRegistries: number;
  criticalRegistries: number;
  onboardingStatus: string;
  lastSyncAt?: string | null;
  nextRequiredAction: string;
  primaryIssue?: string;
  canOpenSetupCentre: boolean;
  sourceHealthRows: RegistryHealthRow[];
}

export interface DashboardEmptyState {
  title: string;
  message: string;
  actionLabel?: string;
}

export interface DashboardSetupAction {
  id: string;
  title: string;
  description: string;
  tabName: string;
  headers: string[];
}

export interface RoleDashboardData {
  role: DashboardRole;
  title: string;
  sourceRows: number;
  cards: Array<DashboardCardConfig & {
    rows: number;
    sourceRows?: number;
    percentage?: string;
    lastSyncedAt?: string | null;
  }>;
  emptyState?: DashboardEmptyState;
}

export interface AssignedClassPerformance {
  class: string;
  classPerformancePercent: number;
  classroomPostingDaysCompleted: number;
}

export interface TeacherDashboardSourceReference {
  workbook: string;
  tab: string;
  rowCount: number;
  lastSyncedAt?: string | null;
}

export interface TeacherDashboardSetupState {
  status: "live" | "setup_required" | "error";
  title: string;
  message: string;
  messages: string[];
}

export interface TeacherDashboardHeader {
  initials: string;
  name: string;
  label: string;
  subject: string;
  classes: string[];
  academicSession: string;
  staffId?: string;
  source: TeacherDashboardSourceReference;
}

export interface TeacherDashboardKpi {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: "healthy" | "warning" | "attention" | "neutral";
  source: TeacherDashboardSourceReference;
}

export interface TeacherTimetablePeriod {
  id: string;
  day: string;
  className: string;
  section: string;
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
  status: string;
  highlight: "current" | "next" | "normal";
  source: TeacherDashboardSourceReference;
}

export interface TeacherPendingTask {
  id: string;
  title: string;
  detail: string;
  sourceLabel: string;
  sourceTab: string;
  severity: "critical" | "high" | "medium" | "low";
  dueLabel: string;
  actionLabel: string;
  actionTab?: string;
  statusLabel: string;
  source: TeacherDashboardSourceReference;
}

export interface TeacherClassPerformance {
  id: string;
  className: string;
  section: string;
  subject: string;
  percent: number;
  summary: string;
  source: TeacherDashboardSourceReference;
}

export interface TeacherClassroomActivity {
  id: string;
  title: string;
  detail: string;
  tag: string;
  postedAt: string;
  source: TeacherDashboardSourceReference;
}

export interface TeacherAssessmentTrackingItem {
  id: string;
  title: string;
  className: string;
  section: string;
  subject: string;
  dueLabel: string;
  completionLabel: string;
  marksStatusLabel: string;
  analysisStatusLabel: string;
  source: TeacherDashboardSourceReference;
}

export interface TeacherAnnouncementItem {
  id: string;
  className: string;
  section: string;
  subject: string;
  title: string;
  text: string;
  postedAt: string;
  url?: string;
  status: string;
  source: TeacherDashboardSourceReference;
}

export interface TeacherDashboardQuickLink {
  label: string;
  detail: string;
  actionTab?: string;
  actionLabel: string;
  available: boolean;
}

export interface TeacherInvigilationDuty {
  id: string;
  eventType: string;
  eventName: string;
  className: string;
  section: string;
  subject: string;
  dutyDate: string;
  status: string;
}

export interface TeacherRenewalStatus {
  configured: boolean;
  title: string;
  message: string;
  nextReviewDate?: string;
  statusLabel?: string;
}

export interface TeacherDashboardData {
  header: TeacherDashboardHeader;
  kpis: TeacherDashboardKpi[];
  timetable: TeacherTimetablePeriod[];
  pendingTasks: TeacherPendingTask[];
  quickLinks: TeacherDashboardQuickLink[];
  classPerformance: TeacherClassPerformance[];
  classroomActivity: TeacherClassroomActivity[];
  assessmentTracking: TeacherAssessmentTrackingItem[];
  invigilationDuty: TeacherInvigilationDuty | null;
  renewalStatus: TeacherRenewalStatus;
  announcements: TeacherAnnouncementItem[];
  sourceHealth: TeacherDashboardSourceReference[];
  setupState: TeacherDashboardSetupState;
}

export interface ExaminationDashboardSourceReference {
  workbook: string;
  tab: string;
  rowCount: number;
  lastSyncedAt?: string | null;
}

export interface ExaminationDashboardSetupState {
  status: "live" | "setup_required" | "error";
  title: string;
  message: string;
  messages: string[];
}

export interface ExaminationDashboardHeader {
  initials: string;
  name: string;
  label: string;
  boardScope: string;
  gradeScope: string;
  academicSession: string;
  source: ExaminationDashboardSourceReference;
}

export interface ExaminationDashboardKpi {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: "healthy" | "warning" | "attention" | "neutral";
  source: ExaminationDashboardSourceReference;
}

export interface ExaminationBoardSubjectStat {
  id: string;
  board: string;
  subject: string;
  registeredCount: number;
  syllabusCompliance: number;
  mockAverage: number;
  source: ExaminationDashboardSourceReference;
}

export interface ExaminationVerificationItem {
  id: string;
  title: string;
  detail: string;
  statusLabel: string;
  actionLabel: string;
  actionTab?: string;
  source: ExaminationDashboardSourceReference;
}

export interface ExaminationAnnouncementItem {
  id: string;
  className: string;
  section: string;
  subject: string;
  title: string;
  text: string;
  postedAt: string;
  status: string;
  teacherName: string;
  url?: string;
  source: ExaminationDashboardSourceReference;
}

export interface ExaminationDashboardData {
  header: ExaminationDashboardHeader;
  kpis: ExaminationDashboardKpi[];
  boardSubjectStats: ExaminationBoardSubjectStat[];
  verificationItems: ExaminationVerificationItem[];
  announcements: ExaminationAnnouncementItem[];
  sourceHealth: ExaminationDashboardSourceReference[];
  setupState: ExaminationDashboardSetupState;
}

export interface StudentDashboardSourceReference {
  workbook: string;
  tab: string;
  rowCount: number;
  lastSyncedAt?: string | null;
}

export interface StudentDashboardSetupState {
  status: "live" | "setup_required" | "error";
  title: string;
  message: string;
  messages: string[];
}

export interface StudentDashboardHeader {
  initials: string;
  name: string;
  label: string;
  className: string;
  section: string;
  academicSession: string;
  rollNumber?: string;
  source: StudentDashboardSourceReference;
}

export interface StudentDashboardKpi {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: "healthy" | "warning" | "attention" | "neutral";
  source: StudentDashboardSourceReference;
}

export interface StudentDashboardTask {
  id: string;
  subject: string;
  title: string;
  detail: string;
  dueLabel: string;
  actionLabel: string;
  actionTab?: string;
  completed: boolean;
  statusLabel: string;
  source: StudentDashboardSourceReference;
}

export interface StudentTimetableItem {
  id: string;
  title: string;
  className: string;
  section: string;
  subject: string;
  timeLabel: string;
  room: string;
  statusLabel: string;
  highlight: "current" | "next" | "normal";
  actionLabel: string;
  actionTab?: string;
  source: StudentDashboardSourceReference;
}

export interface StudentResourceLink {
  id: string;
  label: string;
  detail: string;
  actionTab?: string;
  source: StudentDashboardSourceReference;
}

export interface StudentAnnouncementItem {
  id: string;
  className: string;
  section: string;
  subject: string;
  title: string;
  text: string;
  postedAt: string;
  status: string;
  teacherName: string;
  url?: string;
  source: StudentDashboardSourceReference;
}

export interface StudentDashboardData {
  header: StudentDashboardHeader;
  kpis: StudentDashboardKpi[];
  tasks: StudentDashboardTask[];
  timetable: StudentTimetableItem[];
  resources: StudentResourceLink[];
  announcements: StudentAnnouncementItem[];
  sourceHealth: StudentDashboardSourceReference[];
  setupState: StudentDashboardSetupState;
}

export interface ParentDashboardSourceReference {
  workbook: string;
  tab: string;
  rowCount: number;
  lastSyncedAt?: string | null;
}

export interface ParentDashboardSetupState {
  status: "live" | "setup_required" | "error";
  title: string;
  message: string;
  messages: string[];
}

export interface ParentDashboardHeader {
  initials: string;
  name: string;
  label: string;
  committeeLabel: string;
  liaisonLabel: string;
  academicSession: string;
  source: ParentDashboardSourceReference;
}

export interface ParentDashboardKpi {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: "healthy" | "warning" | "attention" | "neutral";
  source: ParentDashboardSourceReference;
}

export interface ParentDashboardNotice {
  id: string;
  className: string;
  section: string;
  title: string;
  text: string;
  postedAt: string;
  source: ParentDashboardSourceReference;
}

export interface ParentSafetyItem {
  id: string;
  label: string;
  detail: string;
  statusLabel: string;
  source: ParentDashboardSourceReference;
}

export interface ParentAdvisoryTicket {
  id: string;
  title: string;
  detail: string;
  statusLabel: string;
  dueLabel: string;
  actionLabel: string;
  actionTab?: string;
  source: ParentDashboardSourceReference;
}

export interface ParentDashboardData {
  header: ParentDashboardHeader;
  kpis: ParentDashboardKpi[];
  notices: ParentDashboardNotice[];
  safetyItems: ParentSafetyItem[];
  advisoryTickets: ParentAdvisoryTicket[];
  sourceHealth: ParentDashboardSourceReference[];
  setupState: ParentDashboardSetupState;
}

export interface CoordinatorDashboardSourceReference {
  workbook: string;
  tab: string;
  rowCount: number;
  lastSyncedAt?: string | null;
}

export interface CoordinatorSetupState {
  status: "live" | "setup_required" | "error";
  title: string;
  message: string;
  messages: string[];
}

export interface CoordinatorProfileHeader {
  initials: string;
  name: string;
  label: string;
  academicSession: string;
  scopeLabel: string;
  configuredScope: string;
  source: CoordinatorDashboardSourceReference;
}

export interface CoordinatorKpiMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: "healthy" | "warning" | "attention" | "neutral";
  source: CoordinatorDashboardSourceReference;
}

export interface CoordinatorPlannerMatrixCell {
  label: string;
  status: "submitted" | "partial" | "pending" | "missing";
}

export interface CoordinatorPlannerMatrixRow {
  className: string;
  section: string;
  cells: CoordinatorPlannerMatrixCell[];
}

export interface CoordinatorSyllabusCoverage {
  id: string;
  className: string;
  section: string;
  subject: string;
  termLabel: string;
  completion: number;
  source: CoordinatorDashboardSourceReference;
}

export interface CoordinatorRemedialStudent {
  id: string;
  name: string;
  className: string;
  section: string;
  riskArea: string;
  status: string;
  owner: string;
  lastUpdated: string;
  source: CoordinatorDashboardSourceReference;
}

export interface CoordinatorClassroomActivity {
  id: string;
  className: string;
  section: string;
  title: string;
  detail: string;
  metricLabel: string;
  metricValue: string;
  postedAt: string;
  source: CoordinatorDashboardSourceReference;
}

export interface CoordinatorAssessmentTracking {
  id: string;
  title: string;
  className: string;
  section: string;
  subject: string;
  plannedDate: string;
  completionLabel: string;
  marksStatusLabel: string;
  analysisStatusLabel: string;
  completionPercent: number;
  source: CoordinatorDashboardSourceReference;
}

export interface CoordinatorAnnouncement {
  id: string;
  className: string;
  section: string;
  subject: string;
  title: string;
  text: string;
  postedAt: string;
  status: string;
  url?: string;
  source: CoordinatorDashboardSourceReference;
}

export interface CoordinatorDutyStatus {
  configured: boolean;
  title: string;
  message: string;
  statusLabel: string;
}

export interface CoordinatorRenewalStatus {
  configured: boolean;
  title: string;
  message: string;
  nextReviewDate?: string;
  statusLabel?: string;
}

export interface CoordinatorDashboardData {
  coordinatorProfile: CoordinatorProfileHeader;
  kpis: CoordinatorKpiMetric[];
  plannerStatusMatrix: {
    headers: string[];
    rows: CoordinatorPlannerMatrixRow[];
  };
  syllabusCoverage: CoordinatorSyllabusCoverage[];
  remedialTracking: CoordinatorRemedialStudent[];
  classroomActivity: CoordinatorClassroomActivity[];
  assessmentTracking: CoordinatorAssessmentTracking[];
  announcements: CoordinatorAnnouncement[];
  invigilationDuty: CoordinatorDutyStatus;
  renewalStatus: CoordinatorRenewalStatus;
  sourceHealth: CoordinatorDashboardSourceReference[];
  setupState: CoordinatorSetupState;
}

export interface HodDashboardSourceReference {
  workbook: string;
  tab: string;
  rowCount: number;
  lastSyncedAt?: string | null;
}

export interface HodSetupState {
  status: "live" | "setup_required" | "error";
  title: string;
  message: string;
  messages: string[];
}

export interface HodProfileHeader {
  initials: string;
  name: string;
  departmentLabel: string;
  academicSession: string;
  subjectArea: string;
  classRange: string;
  activeTeacherCount: string;
  source: HodDashboardSourceReference;
}

export interface HodKpiMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: "healthy" | "warning" | "attention" | "neutral";
  source: HodDashboardSourceReference;
}

export interface HodRepositoryHealthByClass {
  id: string;
  className: string;
  completion: number;
  label: string;
  source: HodDashboardSourceReference;
}

export interface HodTeacherActivityRow {
  id: string;
  teacherName: string;
  plannerStatus: string;
  uploads: string;
  questionBank: string;
  classroomStatus: string;
  complianceAlert: string;
  source: HodDashboardSourceReference;
}

export interface HodAssessmentTracking {
  id: string;
  title: string;
  dueLabel: string;
  resultsLabel: string;
  departmentAverageLabel: string;
  belowThresholdLabel: string;
  source: HodDashboardSourceReference;
}

export interface HodEnrichmentOlympiadStatus {
  configured: boolean;
  title: string;
  message: string;
  statusLabel: string;
}

export interface HodRemedialStatus {
  id: string;
  label: string;
  value: string;
  source: HodDashboardSourceReference;
}

export interface HodComplianceAlert {
  id: string;
  teacherName: string;
  alertType: string;
  severity: string;
  message: string;
  source: HodDashboardSourceReference;
}

export interface HodDashboardData {
  hodProfile: HodProfileHeader;
  kpis: HodKpiMetric[];
  repositoryHealthByClass: HodRepositoryHealthByClass[];
  teacherActivity: HodTeacherActivityRow[];
  assessmentTracking: HodAssessmentTracking[];
  enrichmentOlympiad: HodEnrichmentOlympiadStatus;
  remedialStatus: HodRemedialStatus[];
  announcements: TeacherAnnouncementItem[];
  complianceAlerts: HodComplianceAlert[];
  sourceHealth: HodDashboardSourceReference[];
  setupState: HodSetupState;
}

export interface ManagerDashboardSourceReference {
  workbook: string;
  tab: string;
  rowCount: number;
  lastSyncedAt?: string | null;
}

export interface ManagerSetupState {
  status: "live" | "setup_required" | "error";
  title: string;
  message: string;
  messages: string[];
}

export interface ManagerProfileHeader {
  initials: string;
  name: string;
  roleLabel: string;
  academicSession: string;
  oversightLabel: string;
  performanceLabel: string;
  source: ManagerDashboardSourceReference;
}

export interface ManagerKpiMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: "healthy" | "warning" | "attention" | "neutral";
  source: ManagerDashboardSourceReference;
}

export interface ManagerOperationalMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  percent: number;
  status: "healthy" | "warning" | "attention" | "neutral";
  source: ManagerDashboardSourceReference;
}

export interface ManagerComplianceChecklistItem {
  id: string;
  title: string;
  detail: string;
  statusLabel: string;
  severity: "critical" | "high" | "warning" | "neutral";
  source: ManagerDashboardSourceReference;
}

export interface ManagerAnnouncement {
  id: string;
  className: string;
  section: string;
  subject: string;
  title: string;
  text: string;
  postedAt: string;
  status: string;
  url?: string;
  source: ManagerDashboardSourceReference;
}

export interface ManagerDashboardData {
  profile: ManagerProfileHeader;
  kpis: ManagerKpiMetric[];
  operationalMetrics: ManagerOperationalMetric[];
  complianceChecklist: ManagerComplianceChecklistItem[];
  announcements: ManagerAnnouncement[];
  sourceHealth: ManagerDashboardSourceReference[];
  setupState: ManagerSetupState;
}

export interface TextbookSource {
  id: string;
  tenantId?: string;
  provider: string; // 'NCERTEbooksProvider' | 'UploadedPdfTextbookProvider' | 'UploadedImageTocProvider' | 'ManualChapterListProvider' | 'MockTextbookSourceProvider'
  sourceType: string; // 'web_link' | 'pdf' | 'toc_image' | 'chapter_image' | 'manual' | 'mock'
  sourceUrl?: string;
  uploadedFileId?: string;
  originalFileName?: string;
  classId: string; // e.g. "Class VI-VIII" or class selection
  subjectId: string;
  academicYear: string;
  medium?: string; // 'en' | 'hi'
  bookName: string;
  bookCode?: string;
  sourceStatus: 'pending' | 'processing' | 'completed' | 'failed';
  copyrightNote?: string;
  importedBy?: string;
  importedAt?: string;
  lastCheckedAt?: string;
  metadataJson?: string;
}

export interface TextbookBook {
  id: string;
  tenantId?: string;
  classId: string;
  subjectId: string;
  academicYear: string;
  medium?: string;
  bookName: string;
  bookType: 'textbook' | 'supplementary' | 'workbook' | 'rationalised';
  sourceId: string;
  ncertBookCode?: string;
  cbseSubjectCode?: string;
  status: 'draft' | 'verified';
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TextbookChapter {
  id: string;
  tenantId?: string;
  bookId: string;
  chapterNumber: number;
  chapterCode: string;
  chapterName: string;
  unitName?: string;
  pageStart?: number;
  pageEnd?: number;
  sourceTocText?: string;
  detectedConfidence: number; // 0.0 - 1.0
  verificationStatus: 'pending' | 'verified';
  teacherEditedName?: string;
  artifactGenerationStatus: 'idle' | 'pending' | 'completed' | 'failed';
  sqaaEvidenceTags?: string[];
  cbseOutcomeTags?: string[];
  ncertOutcomeTags?: string[];
  nepTags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TextbookImportJob {
  id: string;
  tenantId?: string;
  sourceId: string;
  importType: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progressPercent: number;
  currentStep: string;
  extractedBookName?: string;
  extractedChaptersCount: number;
  warningCount: number;
  errorCount: number;
  errorsJson?: string;
  startedBy?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TextbookExtractedPage {
  id: string;
  tenantId?: string;
  sourceId: string;
  bookId?: string;
  chapterId?: string;
  pageNumber: number;
  pageImageFileId?: string;
  extractedText: string;
  extractionMethod: 'searchable_pdf' | 'ocr_tesseract' | 'gemini_multimodal' | 'manual';
  confidenceScore: number;
  createdAt?: string;
}

export interface TextbookTocReview {
  id: string;
  tenantId?: string;
  sourceId: string;
  bookId: string;
  rawExtractedToc: string;
  normalizedTocJson: string; // stringified JSON array
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
}
