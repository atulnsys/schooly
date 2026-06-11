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





