import type { SeededRegistryConfig } from "./seededRegistryConfig";

export type RegistrySpreadsheetKey = keyof SeededRegistryConfig;

export type BootstrapEligibility = "safe_first_batch" | "selective_review" | "later_only" | "none";

export interface RegistryTabSchema {
  spreadsheetKey: RegistrySpreadsheetKey;
  spreadsheetLabel: string;
  tabName: string;
  primaryKeyColumn: string;
  requiredHeaders: string[];
  optionalHeaders: string[];
  safeBootstrapEligibility: BootstrapEligibility;
  writebackAllowed: boolean;
  operationalDataForbidden: boolean;
}

export interface RegistryWorkbookSchema {
  key: RegistrySpreadsheetKey;
  label: string;
  tabs: RegistryTabSchema[];
}

function tab(
  spreadsheetKey: RegistrySpreadsheetKey,
  spreadsheetLabel: string,
  tabName: string,
  primaryKeyColumn: string,
  requiredHeaders: string[],
  safeBootstrapEligibility: BootstrapEligibility,
  writebackAllowed: boolean,
  operationalDataForbidden: boolean,
  optionalHeaders: string[] = []
): RegistryTabSchema {
  return {
    spreadsheetKey,
    spreadsheetLabel,
    tabName,
    primaryKeyColumn,
    requiredHeaders,
    optionalHeaders,
    safeBootstrapEligibility,
    writebackAllowed,
    operationalDataForbidden
  };
}

export const REGISTRY_SCHEMA: RegistryWorkbookSchema[] = [
  {
    key: "masterDataRegistryUrl",
    label: "Master Registry",
    tabs: [
      tab("masterDataRegistryUrl", "Master Registry", "School_Profile", "school_id", ["school_id", "school_name", "academic_year", "board", "medium", "principal_name", "city", "state", "country", "status"], "safe_first_batch", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Academic_Years", "academic_year_id", ["academic_year_id", "academic_year", "start_date", "end_date", "term_name", "term_start", "term_end", "status"], "safe_first_batch", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Classes_Sections", "class_section_id", ["class_section_id", "school_id", "academic_year", "class", "class_number", "section", "class_teacher_staff_id", "status"], "safe_first_batch", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Subjects", "subject_id", ["subject_id", "school_id", "academic_year", "class", "subject", "medium", "board", "is_core_subject", "status"], "safe_first_batch", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Staff_Directory", "staff_id", ["staff_id", "staff_name", "role", "email", "phone", "department", "status"], "selective_review", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Teacher_Allocations", "allocation_id", ["allocation_id", "school_id", "academic_year", "class", "section", "subject", "teacher_staff_id", "teacher_name", "allocation_type", "status"], "selective_review", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Department_Scope", "scope_id", ["scope_id", "school_id", "academic_year", "hod_staff_id", "hod_email", "department", "subject_area", "class_from", "class_to", "classes", "subjects", "active_status", "is_demo_data", "created_at", "updated_at", "notes"], "selective_review", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Coordinator_Scope", "scope_id", ["scope_id", "school_id", "academic_year", "coordinator_staff_id", "coordinator_email", "scope_name", "class_from", "class_to", "classes", "sections", "subjects", "active_status", "is_demo_data", "created_at", "updated_at", "notes"], "selective_review", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Timetable", "timetable_id", ["timetable_id", "school_id", "academic_year", "class", "section", "day", "period", "start_time", "end_time", "subject", "teacher_staff_id", "room", "status"], "later_only", false, true),
      tab("masterDataRegistryUrl", "Master Registry", "Student_Directory", "student_id", ["student_id", "admission_no", "student_name", "gender", "dob", "parent_name", "parent_phone", "status"], "none", false, true),
      tab("masterDataRegistryUrl", "Master Registry", "Student_Enrollment", "enrollment_id", ["enrollment_id", "student_id", "school_id", "academic_year", "class", "section", "roll_number", "admission_date", "status"], "none", false, true),
      tab("masterDataRegistryUrl", "Master Registry", "Books_Registry", "book_id", ["book_id", "school_id", "academic_year", "class", "subject", "medium", "board", "publisher", "book_title", "ncert_book_id", "source_url", "drive_file_id", "drive_file_url", "status"], "later_only", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Book_TOC_Registry", "book_toc_id", ["book_toc_id", "book_id", "ncert_book_id", "class", "subject", "chapter_number", "chapter_title", "page_start", "page_end", "toc_source", "source_status", "status"], "later_only", true, true),
      tab("masterDataRegistryUrl", "Master Registry", "Registry_Bootstrap_Log", "bootstrap_log_id", ["bootstrap_log_id", "registry_name", "tab_name", "bootstrap_status", "created_at", "created_by", "notes"], "none", false, true),
      tab("masterDataRegistryUrl", "Master Registry", "Registry_Summary", "registry_summary_id", ["registry_summary_id", "school_id", "school_name", "academic_year", "board", "medium", "principal_name", "class_count", "student_count", "staff_count", "book_count", "status", "notes"], "none", false, true)
    ]
  },
  {
    key: "ncertRegistryUrl",
    label: "NCERT English Medium Registry",
    tabs: [
      tab("ncertRegistryUrl", "NCERT English Medium Registry", "NCERT_Book_Registry", "ncert_book_id", ["ncert_book_id", "class", "subject", "medium", "book_title", "book_code", "official_source_url", "source_portal", "source_checked_date", "academic_year_applicable", "edition_or_version", "rationalised_content_applicable", "toc_status", "source_verification_status", "human_review_status", "notes"], "safe_first_batch", true, true),
      tab("ncertRegistryUrl", "NCERT English Medium Registry", "NCERT_Chapter_Registry", "ncert_chapter_id", ["ncert_chapter_id", "ncert_book_id", "class", "subject", "medium", "chapter_number", "chapter_title", "unit_name", "start_page", "end_page", "official_chapter_url", "qr_code_reference", "toc_source", "parsed_status", "learning_outcome_status", "source_verification_status", "human_review_status", "notes"], "safe_first_batch", true, true),
      tab("ncertRegistryUrl", "NCERT English Medium Registry", "NCERT_Registry_Source_Map", "registry_source_map_id", ["registry_source_map_id", "registry_name", "source_label", "source_type", "source_url", "tab_name", "import_status", "notes"], "later_only", false, true),
      tab("ncertRegistryUrl", "NCERT English Medium Registry", "NCERT_Registry_Audit_Log", "registry_audit_log_id", ["registry_audit_log_id", "event_type", "event_status", "event_timestamp", "actor", "target_tab", "target_row_id", "message", "notes"], "none", false, true),
      tab("ncertRegistryUrl", "NCERT English Medium Registry", "README", "row_id", ["row_id", "section", "content", "notes"], "none", false, false)
    ]
  },
  {
    key: "ncertPrivateDriveMapUrl",
    label: "NCERT Private Map",
    tabs: [
      tab("ncertPrivateDriveMapUrl", "NCERT Private Map", "NCERT_Drive_Source_Folders", "source_folder_id", ["source_folder_id", "school_id", "academic_year", "class", "section", "subject", "medium", "ncert_book_id", "book_title", "drive_folder_url", "access_status", "scan_status", "last_scanned_at", "notes"], "later_only", true, true),
      tab("ncertPrivateDriveMapUrl", "NCERT Private Map", "NCERT_Chapter_File_Map", "chapter_file_map_id", ["chapter_file_map_id", "school_id", "academic_year", "class", "section", "subject", "medium", "ncert_book_id", "ncert_chapter_id", "book_title", "chapter_number", "chapter_title", "drive_folder_url", "drive_file_id", "drive_file_url", "file_name", "file_mime_type", "match_status", "review_status", "mapped_by", "mapped_at", "notes"], "later_only", true, true)
    ]
  },
  {
    key: "lessonWorkspaceRegistryUrl",
    label: "Lesson Workspace Registry",
    tabs: [
      tab("lessonWorkspaceRegistryUrl", "Lesson Workspace Registry", "Lesson_Workspace_Registry", "lesson_workspace_id", ["lesson_workspace_id", "school_id", "academic_year", "class", "section", "subject", "medium", "book_title", "ncert_book_id", "ncert_chapter_id", "chapter_number", "chapter_title", "planned_start_date", "planned_end_date", "teacher_staff_id", "status", "qa_status", "classroom_publish_status", "drive_folder_url", "notes"], "later_only", true, true),
      tab("lessonWorkspaceRegistryUrl", "Lesson Workspace Registry", "Artifact_Registry", "artifact_id", ["artifact_id", "lesson_workspace_id", "artifact_type", "artifact_title", "drive_file_id", "drive_file_url", "format", "status", "qa_status", "created_by", "created_at", "notes"], "none", false, true),
      tab("lessonWorkspaceRegistryUrl", "Lesson Workspace Registry", "Lesson_Execution_Log", "execution_id", ["execution_id", "lesson_workspace_id", "class", "section", "subject", "date", "period", "teacher_staff_id", "execution_status", "evidence_url", "notes"], "none", false, true),
      tab("lessonWorkspaceRegistryUrl", "Lesson Workspace Registry", "Classroom_Publish_Log", "publish_id", ["publish_id", "lesson_workspace_id", "classroom_course_id", "classroom_course_name", "artifact_id", "classroom_post_id", "publish_status", "published_by", "published_at", "notes"], "none", false, true)
    ]
  },
  {
    key: "qaSqaaRegistryUrl",
    label: "QA/SQAA Registry",
    tabs: [
      tab("qaSqaaRegistryUrl", "QA/SQAA Registry", "QA_Checklist_Config", "checklist_id", ["checklist_id", "artifact_type", "check_item", "description", "severity", "required", "status"], "safe_first_batch", true, true),
      tab("qaSqaaRegistryUrl", "QA/SQAA Registry", "QA_Review_Log", "qa_review_id", ["qa_review_id", "artifact_id", "lesson_workspace_id", "review_date", "reviewer", "qa_score", "review_status", "blocking_issues", "warnings", "recommendations"], "none", false, true),
      tab("qaSqaaRegistryUrl", "QA/SQAA Registry", "SQAA_Evidence_Map", "evidence_map_id", ["evidence_map_id", "indicator_id", "lesson_workspace_id", "artifact_id", "evidence_type", "drive_file_url", "evidence_status", "reviewed_by", "review_date", "notes"], "later_only", false, true),
      tab("qaSqaaRegistryUrl", "QA/SQAA Registry", "Compliance_Report_Registry", "report_id", ["report_id", "framework_id", "report_period", "generated_on", "coverage_percent", "gap_count", "report_file_url", "status"], "none", false, true)
    ]
  },
  {
    key: "schoolyStrategicOperationsRegistryUrl",
    label: "Schooly Strategic Operations Registry",
    tabs: [
      tab("schoolyStrategicOperationsRegistryUrl", "Schooly Strategic Operations Registry", "Budget_Utilization", "budget_id", ["budget_id", "school_id", "academic_year", "budget_area", "allocated_amount", "utilized_amount", "utilization_percent", "owner_role", "owner_staff_id", "review_period", "status", "last_reviewed_at"], "later_only", false, true),
      tab("schoolyStrategicOperationsRegistryUrl", "Schooly Strategic Operations Registry", "Strategic_Milestones", "milestone_id", ["milestone_id", "school_id", "academic_year", "milestone_name", "owner_role", "owner_staff_id", "target_date", "completion_status", "status", "notes", "created_at", "updated_at"], "later_only", false, true),
      tab("schoolyStrategicOperationsRegistryUrl", "Schooly Strategic Operations Registry", "Operational_Checklist", "checklist_id", ["checklist_id", "school_id", "academic_year", "check_item", "owner_role", "owner_staff_id", "due_date", "status", "notes", "created_at", "updated_at"], "later_only", false, true)
    ]
  },
  {
    key: "hodEnrichmentOlympiadRegistryUrl",
    label: "Schooly Enrichment Olympiad Registry",
    tabs: [
      tab("hodEnrichmentOlympiadRegistryUrl", "Schooly Enrichment Olympiad Registry", "Enrichment_Programmes", "programme_id", ["programme_id", "school_id", "academic_year", "department", "subject", "class", "section", "programme_name", "teacher_staff_id", "teacher_name", "student_count", "start_date", "end_date", "status", "notes", "created_at", "updated_at"], "later_only", true, true),
      tab("hodEnrichmentOlympiadRegistryUrl", "Schooly Enrichment Olympiad Registry", "Olympiad_Registrations", "registration_id", ["registration_id", "school_id", "academic_year", "event_name", "event_type", "department", "subject", "class", "section", "student_id", "student_name", "registration_date", "event_date", "status", "notes"], "later_only", true, true),
      tab("hodEnrichmentOlympiadRegistryUrl", "Schooly Enrichment Olympiad Registry", "Enrichment_Resources", "resource_id", ["resource_id", "school_id", "academic_year", "department", "subject", "class", "resource_title", "resource_type", "drive_file_id", "drive_file_url", "teacher_staff_id", "status", "created_at", "updated_at"], "later_only", true, true),
      tab("hodEnrichmentOlympiadRegistryUrl", "Schooly Enrichment Olympiad Registry", "Enrichment_Classroom_Posts", "post_id", ["post_id", "school_id", "academic_year", "department", "subject", "class", "section", "course_id", "post_title", "post_type", "posted_at", "classroom_url", "status"], "later_only", true, true)
    ]
  },
  {
    key: "dashboardDataSourceUrl",
    label: "Dashboard Data Source",
    tabs: [
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "KPI_Definitions", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "safe_first_batch", true, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Dashboard_KPI_Source", "kpi_value_id", ["kpi_value_id", "kpi_id", "academic_year", "class", "section", "subject", "value", "as_of_date", "source_sheet", "notes"], "later_only", true, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Curriculum_Coverage", "coverage_id", ["coverage_id", "academic_year", "class", "section", "subject", "planned_chapters", "completed_chapters", "coverage_percent", "as_of_date"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Assessment_Tracking", "assessment_tracking_id", ["assessment_tracking_id", "academic_year", "class", "section", "subject", "assessment_type", "planned_count", "completed_count", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Alert_Log", "alert_id", ["alert_id", "alert_type", "severity", "message", "owner_role", "status", "created_at", "resolved_at"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Dashboard_KPI_Definitions", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Dashboard_Metrics", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Planner_Submissions", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Classroom_Activity", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Notebook_Monitoring", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Attendance_Summary", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Syllabus_Coverage", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Compliance_Evidence_Summary", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Evidence_Gaps", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Dashboard_Alerts", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true),
      tab("dashboardDataSourceUrl", "Dashboard Data Source", "Dashboard_Source_Log", "kpi_id", ["kpi_id", "dashboard_role", "kpi_name", "description", "calculation_method", "target_value", "status"], "none", false, true)
    ]
  },
  {
    key: "assessmentResultRegistryUrl",
    label: "Assessment/Result Registry",
    tabs: [
      tab("assessmentResultRegistryUrl", "Assessment/Result Registry", "Assessment_Plan", "assessment_plan_id", ["assessment_plan_id", "academic_year", "term", "class", "section", "subject", "assessment_type", "planned_date", "max_marks", "status"], "later_only", true, true),
      tab("assessmentResultRegistryUrl", "Assessment/Result Registry", "Exam_Calendar", "exam_id", ["exam_id", "academic_year", "term", "exam_name", "class", "subject", "exam_date", "start_time", "end_time", "status"], "later_only", true, true),
      tab("assessmentResultRegistryUrl", "Assessment/Result Registry", "Question_Paper_Registry", "question_paper_id", ["question_paper_id", "assessment_plan_id", "class", "subject", "paper_title", "blueprint_status", "drive_file_url", "review_status"], "none", false, true),
      tab("assessmentResultRegistryUrl", "Assessment/Result Registry", "Marks_Entry", "marks_entry_id", ["marks_entry_id", "assessment_plan_id", "student_id", "class", "section", "subject", "marks_obtained", "max_marks", "grade", "remarks", "status"], "none", false, true),
      tab("assessmentResultRegistryUrl", "Assessment/Result Registry", "Result_Processing", "result_id", ["result_id", "academic_year", "term", "class", "section", "student_id", "total_marks", "percentage", "grade", "promotion_status", "review_status"], "none", false, true),
      tab("assessmentResultRegistryUrl", "Assessment/Result Registry", "Report_Card_Registry", "report_card_id", ["report_card_id", "result_id", "student_id", "class", "section", "report_card_url", "issued_on", "issue_status"], "none", false, true),
      tab("assessmentResultRegistryUrl", "Assessment/Result Registry", "Result_Analysis", "analysis_id", ["analysis_id", "academic_year", "term", "class", "section", "subject", "average_marks", "pass_percent", "weak_chapters", "remediation_required"], "none", false, true),
      tab("assessmentResultRegistryUrl", "Assessment/Result Registry", "Invigilation_Olympiad_Duties", "duty_id", ["duty_id", "academic_year", "teacher_staff_id", "teacher_name", "event_type", "event_name", "class", "section", "subject", "duty_date", "start_time", "end_time", "room", "status", "notes", "created_at", "updated_at"], "none", false, true)
    ]
  },
  {
    key: "classroomSyncRegistryUrl",
    label: "Google Classroom Sync Registry",
    tabs: [
      tab("classroomSyncRegistryUrl", "Google Classroom Sync Registry", "Classroom_Course_Map", "course_map_id", ["course_map_id", "school_id", "academic_year", "class", "section", "subject", "teacher_staff_id", "classroom_course_id", "classroom_course_name", "sync_status", "notes"], "later_only", true, true),
      tab("classroomSyncRegistryUrl", "Google Classroom Sync Registry", "Classroom_Assignment_Map", "assignment_map_id", ["assignment_map_id", "lesson_workspace_id", "artifact_id", "classroom_course_id", "classroom_assignment_id", "assignment_title", "publish_status", "due_date", "notes"], "none", false, true),
      tab("classroomSyncRegistryUrl", "Google Classroom Sync Registry", "Classroom_Submission_Sync", "submission_sync_id", ["submission_sync_id", "classroom_assignment_id", "student_id", "submission_status", "marks", "sync_time", "notes"], "none", false, true),
      tab("classroomSyncRegistryUrl", "Google Classroom Sync Registry", "Classroom_Sync_Log", "sync_log_id", ["sync_log_id", "sync_type", "started_at", "completed_at", "status", "records_processed", "error_message", "notes"], "none", false, true),
      tab("classroomSyncRegistryUrl", "Google Classroom Sync Registry", "Classroom_Announcement_Sync", "announcement_id", ["announcement_id", "course_id", "class", "section", "subject", "teacher_staff_id", "teacher_name", "announcement_title", "announcement_text", "posted_at", "status", "classroom_url", "created_at", "updated_at"], "none", false, true)
    ]
  },
  {
    key: "teacherCpdRenewalRegistryUrl",
    label: "Teacher CPD Renewal Registry",
    tabs: [
      tab("teacherCpdRenewalRegistryUrl", "Teacher CPD Renewal Registry", "Teacher_CPD_Status", "cpd_status_id", ["cpd_status_id", "academic_year", "teacher_staff_id", "teacher_name", "department", "mandatory_hours_required", "mandatory_hours_completed", "certifications_due", "certifications_completed", "last_review_date", "next_review_date", "status", "notes"], "none", false, true),
      tab("teacherCpdRenewalRegistryUrl", "Teacher CPD Renewal Registry", "Mandatory_Training", "training_id", ["training_id", "academic_year", "teacher_staff_id", "teacher_name", "training_title", "due_date", "completion_status", "status", "notes"], "none", false, true),
      tab("teacherCpdRenewalRegistryUrl", "Teacher CPD Renewal Registry", "Certification_Renewals", "renewal_id", ["renewal_id", "academic_year", "teacher_staff_id", "teacher_name", "certification_name", "expires_on", "renewal_status", "status", "notes"], "none", false, true),
      tab("teacherCpdRenewalRegistryUrl", "Teacher CPD Renewal Registry", "Review_Action_Log", "review_action_id", ["review_action_id", "academic_year", "teacher_staff_id", "teacher_name", "action_type", "action_status", "created_at", "updated_at", "notes"], "none", false, true)
    ]
  }
];

export const REGISTRY_DEFINITIONS = REGISTRY_SCHEMA.map((workbook) => ({
  key: workbook.key,
  label: workbook.label,
  tabs: workbook.tabs.map((item) => item.tabName)
}));

export const REGISTRY_TABS_BY_NAME = REGISTRY_SCHEMA
  .flatMap((workbook) => workbook.tabs)
  .reduce((acc, item) => {
    acc[item.tabName] = item;
    return acc;
  }, {} as Record<string, RegistryTabSchema>);

export function normalizeHeaderForComparison(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function getRegistryTabSchema(tabName: string): RegistryTabSchema | undefined {
  return REGISTRY_TABS_BY_NAME[tabName];
}

export function getRequiredHeaders(tabName: string): string[] {
  return getRegistryTabSchema(tabName)?.requiredHeaders || [];
}

export function getPrimaryKeyColumn(tabName: string): string {
  return getRegistryTabSchema(tabName)?.primaryKeyColumn || getRequiredHeaders(tabName)[0] || "";
}

export function findMissingRequiredHeaders(tabName: string, actualHeaders: string[]): string[] {
  const actual = new Set(actualHeaders.map(normalizeHeaderForComparison));
  return getRequiredHeaders(tabName).filter((header) => !actual.has(normalizeHeaderForComparison(header)));
}

export function hasHeader(tabName: string, actualHeaders: string[], header: string): boolean {
  const actual = new Set(actualHeaders.map(normalizeHeaderForComparison));
  return actual.has(normalizeHeaderForComparison(header || getPrimaryKeyColumn(tabName)));
}

export function isSafeFirstBatchTab(spreadsheetLabel: string, tabName: string): boolean {
  const schema = REGISTRY_SCHEMA
    .flatMap((workbook) => workbook.tabs)
    .find((item) => item.spreadsheetLabel === spreadsheetLabel && item.tabName === tabName);
  return schema?.safeBootstrapEligibility === "safe_first_batch";
}
