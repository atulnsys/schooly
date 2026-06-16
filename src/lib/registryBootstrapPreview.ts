import { WorkspaceFile } from "../types";
import { compareClassLabels } from "./classSort";
import { DashboardSourceState, DashboardRegistrySourceStatus } from "./dashboardDataResolver";
import { getPrimaryKeyColumn } from "./registrySchema";
import { SeededRegistryConfig } from "./seededRegistryConfig";

export type BootstrapSeverity = "blocker" | "warning" | "info";
export type BootstrapConfidence = "high" | "medium" | "low";
export type BootstrapClassification = "can_auto_prepare" | "requires_human_review" | "requires_external_connection" | "cannot_infer";

export interface BootstrapProposedRow {
  id: string;
  spreadsheet: string;
  tab: string;
  primaryKeyColumn: string;
  primaryKeyValue: string;
  row: Record<string, string>;
  source: string;
  reason: string;
  confidence: BootstrapConfidence;
  reviewRequired: boolean;
  classification: BootstrapClassification;
  severity: BootstrapSeverity;
  warnings: string[];
  skippedBecauseKeyExists: boolean;
}

export interface BootstrapDestinationPreview {
  spreadsheet: string;
  tab: string;
  primaryKeyColumn: string;
  proposedRowCount: number;
  skippedExistingCount: number;
  warnings: string[];
  rows: BootstrapProposedRow[];
}

export interface BootstrapRejectedInferenceCandidate {
  sourcePath: string;
  rejectedValue: string;
  field: "class" | "section" | "subject" | "row";
  reason: string;
  suggestedAction: string;
}

export interface BootstrapHealthItem {
  spreadsheet: string;
  url: string;
  tab: string;
  rowCount: number;
  missingTab: boolean;
  emptyTab: boolean;
  missingHeaders: string[];
  duplicatePrimaryIds: string[];
  placeholderRows: number;
  invalidDriveReferences: string[];
}

export interface RegistryBootstrapPreview {
  generatedAt: string;
  mode: "preview_only";
  summary: {
    proposedRows: number;
    blockers: number;
    warnings: number;
    skippedExistingRows: number;
    rejectedInferenceCandidates: number;
  };
  health: BootstrapHealthItem[];
  destinations: BootstrapDestinationPreview[];
  rejectedInferenceCandidates: BootstrapRejectedInferenceCandidate[];
  blockers: string[];
  warnings: string[];
  classifications: Record<BootstrapClassification, number>;
  localStorageOverrides: Partial<Record<keyof SeededRegistryConfig, string>>;
}

const CONFIGURED_ACADEMIC_YEAR = "2026-27";
const CONFIGURED_CLASSES = [
  "Class I", "Class II", "Class III", "Class IV", "Class V", "Class VI",
  "Class VII", "Class VIII", "Class IX", "Class X", "Class XI", "Class XII"
];
const CONFIGURED_SECTIONS = ["A", "B"];
const CANONICAL_SUBJECTS = [
  "English",
  "Hindi",
  "Mathematics",
  "Science",
  "Social Science",
  "Computer Science",
  "Computer Applications",
  "Environmental Studies",
  "Art Education",
  "Physical Education",
  "Physics",
  "Chemistry",
  "Biology",
  "Accountancy",
  "Business Studies",
  "Economics"
];
const DEFAULT_CLASS_SUBJECTS = [
  "English",
  "Hindi",
  "Mathematics",
  "Science",
  "Social Science",
  "Environmental Studies",
  "Art Education",
  "Physical Education"
];
const SENIOR_SECONDARY_SUBJECTS = [
  "English",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "Accountancy",
  "Business Studies"
];

const DEFAULT_QA_CHECKLIST_ROWS = [
  ["qa_config.lesson_workspace_review", "Lesson workspace review", "Draft setup row - pending school review"],
  ["qa_config.artifact_metadata_review", "Artifact metadata review", "Draft setup row - pending school review"],
  ["qa_config.sqaa_mapping_review", "SQAA mapping review", "Draft setup row - pending school review"]
];

const DEFAULT_KPI_ROWS = [
  ["kpi.classes_sections_count", "Class sections count", "Master Registry / Classes_Sections"],
  ["kpi.teacher_allocations_count", "Teacher allocations count", "Master Registry / Teacher_Allocations"],
  ["kpi.lesson_workspace_count", "Lesson workspace count", "Lesson Workspace Registry / Lesson_Workspace_Registry"],
  ["kpi.classroom_sync_count", "Classroom sync count", "Google Classroom Sync Registry"]
];
const CLASS_ROMAN_BY_NUMBER: Record<string, string> = {
  "1": "I",
  "2": "II",
  "3": "III",
  "4": "IV",
  "5": "V",
  "6": "VI",
  "7": "VII",
  "8": "VIII",
  "9": "IX",
  "10": "X",
  "11": "XI",
  "12": "XII"
};
const CANONICAL_SUBJECT_BY_KEY = new Map(CANONICAL_SUBJECTS.map((subject) => [normalizeSubjectKey(subject), subject]));

function normalizeToken(value: string): string {
  return String(value || "").trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeSubjectKey(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalizeClassName(value: string): string | null {
  const cleaned = String(value || "").trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  const match = cleaned.match(/\b(?:class|grade)\s*([0-9]{1,2}|i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\b/i);
  if (!match) return null;
  const raw = match[1].toUpperCase();
  const roman = CLASS_ROMAN_BY_NUMBER[raw] || raw;
  return CONFIGURED_CLASSES.includes(`Class ${roman}`) ? `Class ${roman}` : null;
}

function canonicalizeSubject(value: string): string | null {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  if (/\.(pdf|docx?|pptx?|xlsx?)\b/i.test(trimmed)) return null;
  if (/[\\/]/.test(trimmed) || trimmed.includes("&")) return null;
  if (trimmed.length > 40 || /\b(remedial|handout|worksheet|plan|comprehension|chapter|lesson|notes|rubric)\b/i.test(trimmed)) return null;
  return CANONICAL_SUBJECT_BY_KEY.get(normalizeSubjectKey(trimmed)) || null;
}

function isFileLikeSegment(segment: string, fileName?: string): boolean {
  const cleaned = String(segment || "").trim();
  if (!cleaned) return false;
  return cleaned === fileName || /\.[a-z0-9]{2,5}$/i.test(cleaned);
}

function inferClassFromFolders(segments: string[]): string | null {
  for (const segment of segments) {
    const canonical = canonicalizeClassName(segment);
    if (canonical) return canonical;
  }
  return null;
}

function inferSubjectFromFolders(segments: string[]): string | null {
  for (const segment of segments) {
    const canonical = canonicalizeSubject(segment);
    if (canonical) return canonical;
  }
  return null;
}

function validateSetupRow(row: BootstrapProposedRow): BootstrapRejectedInferenceCandidate | null {
  const classValue = row.row.class;
  const subjectValue = row.row.subject;
  const sectionValue = row.row.section;
  const path = row.source;
  if (classValue && canonicalizeClassName(classValue) !== classValue) {
    return { sourcePath: path, rejectedValue: classValue, field: "class", reason: "class must use canonical Class I-XII format", suggestedAction: "map this row to a canonical class such as Class IX" };
  }
  if (subjectValue && canonicalizeSubject(subjectValue) !== subjectValue) {
    return { sourcePath: path, rejectedValue: subjectValue, field: "subject", reason: "subject must be a canonical subject and cannot be a file/document title", suggestedAction: "map this file under an existing subject folder" };
  }
  if (sectionValue && sectionValue !== "Setup Required" && !/^[A-Z]$/.test(sectionValue)) {
    return { sourcePath: path, rejectedValue: sectionValue, field: "section", reason: "section must be a single letter or explicitly Setup Required", suggestedAction: "use a reviewed section such as A, B, or Setup Required" };
  }
  if (Object.entries(row.row).some(([key, value]) => /class|subject/i.test(key) && /\.(pdf|docx?|pptx?)\b/i.test(String(value)))) {
    return { sourcePath: path, rejectedValue: JSON.stringify(row.row), field: "row", reason: "row contains a file name in class/subject fields", suggestedAction: "separate document files from class/subject setup rows" };
  }
  return null;
}

function statusFor(sourceState: DashboardSourceState, key: keyof SeededRegistryConfig): DashboardRegistrySourceStatus | undefined {
  return sourceState.registries.find((registry) => registry.key === key);
}

function tabHasRows(sourceState: DashboardSourceState, key: keyof SeededRegistryConfig, tab: string): boolean {
  return (statusFor(sourceState, key)?.tabRowCounts?.[tab] || 0) > 0;
}

function primaryKeyFor(tab: string): string {
  return getPrimaryKeyColumn(tab);
}

function inferDriveRows(files: WorkspaceFile[]) {
  const classes = new Set<string>();
  const subjects = new Set<string>();
  const classSubjects = new Map<string, { className: string; subject: string; source: string }>();
  const rejected: BootstrapRejectedInferenceCandidate[] = [];

  files
    .filter((file) => file.source === "Drive" || file.source === "Shared Drive")
    .forEach((file) => {
      const rawSegments = String(file.path || file.name || "").split(/[\\/]/).map((part) => part.trim()).filter(Boolean);
      const folderSegments = rawSegments.filter((segment, index) => index < rawSegments.length - 1 || !isFileLikeSegment(segment, file.name));
      const fileSegment = rawSegments.length > 0 ? rawSegments[rawSegments.length - 1] : file.name;
      const className = inferClassFromFolders(folderSegments);
      const subject = inferSubjectFromFolders(folderSegments);

      if (!subject && isFileLikeSegment(fileSegment, file.name) && /english|hindi|math|mathematics|science|social|economics|physics|chemistry|biology|computer/i.test(fileSegment)) {
        rejected.push({
          sourcePath: file.path || file.name,
          rejectedValue: fileSegment,
          field: "subject",
          reason: "file name cannot be used as subject",
          suggestedAction: "map this file under an existing subject folder"
        });
      }
      if (file.className && canonicalizeClassName(file.className) !== className) {
        rejected.push({
          sourcePath: file.path || file.name,
          rejectedValue: file.className,
          field: "class",
          reason: "file metadata class is not canonical or is not backed by a folder segment",
          suggestedAction: "place the file under a canonical class folder such as Class IX"
        });
      }
      if (file.subjectName && canonicalizeSubject(file.subjectName) !== subject) {
        rejected.push({
          sourcePath: file.path || file.name,
          rejectedValue: file.subjectName,
          field: "subject",
          reason: "file metadata subject is not trusted unless it matches a known subject folder segment",
          suggestedAction: "map this file under an existing subject folder"
        });
      }
      if (className) classes.add(className);
      if (subject) subjects.add(subject);
      if (className && subject) {
        const key = `${className}::${subject}`;
        classSubjects.set(key, { className, subject, source: file.path || file.name });
      }
    });

  return {
    classes: Array.from(classes).sort(compareClassLabels),
    subjects: Array.from(subjects).sort(),
    classSubjects: Array.from(classSubjects.values()).sort((a, b) => compareClassLabels(a.className, b.className) || a.subject.localeCompare(b.subject)),
    rejected
  };
}

export function getConfiguredBootstrapDefaults() {
  return {
    academicYear: CONFIGURED_ACADEMIC_YEAR,
    classes: CONFIGURED_CLASSES,
    sections: CONFIGURED_SECTIONS,
    defaultClassSubjects: DEFAULT_CLASS_SUBJECTS,
    seniorSecondarySubjects: SENIOR_SECONDARY_SUBJECTS,
    qaChecklistRows: DEFAULT_QA_CHECKLIST_ROWS,
    kpiRows: DEFAULT_KPI_ROWS
  };
}

function configuredClassSubjects() {
  return CONFIGURED_CLASSES.flatMap((className) => {
    const roman = className.replace(/^Class\s+/i, "");
    const subjects = ["XI", "XII"].includes(roman) ? SENIOR_SECONDARY_SUBJECTS : DEFAULT_CLASS_SUBJECTS;
    return subjects.map((subject) => ({ className, subject, source: "configured school setup" }));
  });
}

function makeRow(input: Omit<BootstrapProposedRow, "id" | "skippedBecauseKeyExists"> & { skippedBecauseKeyExists?: boolean }): BootstrapProposedRow {
  return {
    ...input,
    id: `${input.spreadsheet}:${input.tab}:${input.primaryKeyValue}`,
    skippedBecauseKeyExists: input.skippedBecauseKeyExists || false
  };
}

function destinationKey(row: BootstrapProposedRow): string {
  return `${row.spreadsheet}::${row.tab}::${row.primaryKeyColumn}`;
}

function groupDestinations(rows: BootstrapProposedRow[]): BootstrapDestinationPreview[] {
  const groups = new Map<string, BootstrapDestinationPreview>();
  rows.forEach((row) => {
    const key = destinationKey(row);
    if (!groups.has(key)) {
      groups.set(key, {
        spreadsheet: row.spreadsheet,
        tab: row.tab,
        primaryKeyColumn: row.primaryKeyColumn,
        proposedRowCount: 0,
        skippedExistingCount: 0,
        warnings: [],
        rows: []
      });
    }
    const group = groups.get(key)!;
    group.rows.push(row);
    if (row.skippedBecauseKeyExists) group.skippedExistingCount += 1;
    else group.proposedRowCount += 1;
    group.warnings.push(...row.warnings);
  });
  return Array.from(groups.values()).map((group) => ({
    ...group,
    warnings: Array.from(new Set(group.warnings))
  }));
}

function buildHealth(sourceState: DashboardSourceState): BootstrapHealthItem[] {
  return sourceState.registries.flatMap((registry) =>
    Object.keys(registry.tabRowCounts || {}).map((tab) => ({
      spreadsheet: registry.label,
      url: registry.url,
      tab,
      rowCount: registry.tabRowCounts[tab] || 0,
      missingTab: registry.missingTabs.includes(tab),
      emptyTab: registry.emptyTabs.includes(tab),
      missingHeaders: registry.missingHeaders[tab] || [],
      duplicatePrimaryIds: registry.duplicatePrimaryIds[tab] || [],
      placeholderRows: registry.placeholderRows[tab] || 0,
      invalidDriveReferences: registry.invalidDriveReferences[tab] || []
    }))
  );
}

export function buildRegistryBootstrapPreview(sourceState: DashboardSourceState, files: WorkspaceFile[]): RegistryBootstrapPreview {
  const drive = inferDriveRows(files);
  const classSubjects = drive.classSubjects.length > 0 ? drive.classSubjects : configuredClassSubjects();
  const rows: BootstrapProposedRow[] = [];
  const rejectedInferenceCandidates: BootstrapRejectedInferenceCandidate[] = [...drive.rejected];
  const sourceWarnings: string[] = [];

  if (files.filter((file) => file.source === "Drive" || file.source === "Shared Drive").length === 0) {
    sourceWarnings.push("Drive folder index unavailable in browser; using configured setup defaults only.");
  }

  if (!tabHasRows(sourceState, "masterDataRegistryUrl", "School_Profile")) {
    rows.push(makeRow({
      spreadsheet: "Master Registry",
      tab: "School_Profile",
      primaryKeyColumn: primaryKeyFor("School_Profile"),
      primaryKeyValue: "schooly_school_profile_draft",
      row: {
        school_id: "schooly_school_profile_draft",
        school_name: "Schooly Test School",
        board: "CBSE",
        medium: "English",
        academic_year: CONFIGURED_ACADEMIC_YEAR,
        principal_name: "Review Later",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
        status: "Active"
      },
      source: "configured school setup",
      reason: "School profile tab is empty; one setup row is required before dashboards can identify the institution context.",
      confidence: "medium",
      reviewRequired: true,
      classification: "requires_human_review",
      severity: "warning",
      warnings: ["Principal name is marked Review Later and can be edited before writeback."]
    }));
  }

  if (!tabHasRows(sourceState, "masterDataRegistryUrl", "Academic_Years")) {
    rows.push(makeRow({
      spreadsheet: "Master Registry",
      tab: "Academic_Years",
      primaryKeyColumn: primaryKeyFor("Academic_Years"),
      primaryKeyValue: `ay_${normalizeToken(CONFIGURED_ACADEMIC_YEAR)}`,
      row: {
        academic_year_id: `ay_${normalizeToken(CONFIGURED_ACADEMIC_YEAR)}`,
        academic_year: CONFIGURED_ACADEMIC_YEAR,
        start_date: "2026-04-01",
        end_date: "2027-03-31",
        term_name: "Full Year",
        term_start: "2026-04-01",
        term_end: "2027-03-31",
        status: "Active",
        notes: "Configured from approved onboarding defaults"
      },
      source: "configured school setup",
      reason: "Academic year registry is empty; the configured Schooly setup year can safely create a draft year row.",
      confidence: "high",
      reviewRequired: false,
      classification: "can_auto_prepare",
      severity: "info",
      warnings: []
    }));
  }

  if (!tabHasRows(sourceState, "masterDataRegistryUrl", "Classes_Sections")) {
    const classes = drive.classes.length > 0 ? drive.classes : CONFIGURED_CLASSES;
    classes.forEach((className) => {
      CONFIGURED_SECTIONS.forEach((section) => {
        rows.push(makeRow({
          spreadsheet: "Master Registry",
          tab: "Classes_Sections",
          primaryKeyColumn: primaryKeyFor("Classes_Sections"),
          primaryKeyValue: `${normalizeToken(className)}_${section}`,
          row: {
            class_section_id: `${normalizeToken(className)}_${section}`,
            school_id: "schooly_school_profile_draft",
            class: className,
            class_number: className.replace(/^Class\s+/i, ""),
            section,
            academic_year: CONFIGURED_ACADEMIC_YEAR,
            class_teacher_staff_id: "Setup Required",
            status: "Draft - Setup Required"
          },
          source: drive.classes.length > 0 ? "Google Drive folder structure" : "configured school setup",
          reason: "Classes_Sections is empty; configured classes and sections can prepare draft setup rows.",
          confidence: drive.classes.length > 0 ? "high" : "medium",
          reviewRequired: true,
          classification: drive.classes.length > 0 ? "can_auto_prepare" : "requires_human_review",
          severity: "warning",
          warnings: drive.classes.length > 0 ? [] : ["Class/section model is from configured defaults and needs review."]
        }));
      });
    });
  }

  if (!tabHasRows(sourceState, "masterDataRegistryUrl", "Subjects")) {
    classSubjects.forEach(({ className, subject, source }) => {
      rows.push(makeRow({
        spreadsheet: "Master Registry",
        tab: "Subjects",
        primaryKeyColumn: primaryKeyFor("Subjects"),
        primaryKeyValue: `subject_${normalizeToken(className)}_${normalizeToken(subject)}`,
        row: {
          subject_id: `subject_${normalizeToken(className)}_${normalizeToken(subject)}`,
          school_id: "schooly_school_profile_draft",
          academic_year: CONFIGURED_ACADEMIC_YEAR,
          class: className,
          subject,
          medium: "English",
          board: "CBSE",
          is_core_subject: "Review Required",
          status: "Draft - Setup Required"
        },
        source,
        reason: "Subjects is empty; class-subject setup rows can be prepared from configured model or Drive paths.",
        confidence: source === "configured school setup" ? "medium" : "high",
        reviewRequired: true,
        classification: source === "configured school setup" ? "requires_human_review" : "can_auto_prepare",
        severity: "warning",
        warnings: source === "configured school setup" ? ["Subject model requires school review before writeback."] : []
      }));
    });
  }

  if (!tabHasRows(sourceState, "masterDataRegistryUrl", "Books_Registry")) {
    classSubjects.forEach(({ className, subject, source }) => {
      rows.push(makeRow({
        spreadsheet: "Master Registry",
        tab: "Books_Registry",
        primaryKeyColumn: primaryKeyFor("Books_Registry"),
        primaryKeyValue: `book_${normalizeToken(className)}_${normalizeToken(subject)}_draft`,
        row: {
          book_id: `book_${normalizeToken(className)}_${normalizeToken(subject)}_draft`,
          school_id: "schooly_school_profile_draft",
          academic_year: CONFIGURED_ACADEMIC_YEAR,
          class: className,
          subject,
          medium: "English",
          board: "CBSE",
          publisher: "NCERT",
          book_title: "Setup Required",
          status: "Draft - pending NCERT/private-map review"
        },
        source,
        reason: "Books_Registry is empty; class and subject are known, but book title/ID must be reviewed.",
        confidence: "low",
        reviewRequired: true,
        classification: "requires_human_review",
        severity: "warning",
        warnings: ["Book title is not invented; marked Setup Required."]
      }));
    });
  }

  if (!tabHasRows(sourceState, "ncertPrivateDriveMapUrl", "NCERT_Drive_Source_Folders")) {
    classSubjects.forEach(({ className, subject, source }) => {
      rows.push(makeRow({
        spreadsheet: "NCERT Private Map",
        tab: "NCERT_Drive_Source_Folders",
        primaryKeyColumn: primaryKeyFor("NCERT_Drive_Source_Folders"),
        primaryKeyValue: `ncert_src_${normalizeToken(className)}_${normalizeToken(subject)}_draft`,
        row: {
          source_folder_id: `ncert_src_${normalizeToken(className)}_${normalizeToken(subject)}_draft`,
          school_id: "schooly_school_profile_draft",
          academic_year: CONFIGURED_ACADEMIC_YEAR,
          class: className,
          section: "Setup Required",
          subject,
          medium: "English",
          ncert_book_id: "Setup Required",
          book_title: "Setup Required",
          drive_folder_url: "Setup Required",
          access_status: "Setup Required",
          scan_status: "Pending",
          review_status: "Draft - pending NCERT book/folder review"
        },
        source,
        reason: "NCERT private map is empty; class/subject source folder mapping can be drafted but book and folder URL require review.",
        confidence: "low",
        reviewRequired: true,
        classification: "requires_human_review",
        severity: "warning",
        warnings: ["NCERT book ID and Drive folder URL are not invented; marked Setup Required."]
      }));
    });
  }

  if (!tabHasRows(sourceState, "lessonWorkspaceRegistryUrl", "Lesson_Workspace_Registry")) {
    classSubjects.forEach(({ className, subject, source }) => {
      rows.push(makeRow({
        spreadsheet: "Lesson Workspace Registry",
        tab: "Lesson_Workspace_Registry",
        primaryKeyColumn: primaryKeyFor("Lesson_Workspace_Registry"),
        primaryKeyValue: `lesson_ws_${normalizeToken(className)}_${normalizeToken(subject)}_draft`,
        row: {
          lesson_workspace_id: `lesson_ws_${normalizeToken(className)}_${normalizeToken(subject)}_draft`,
          school_id: "schooly_school_profile_draft",
          academic_year: CONFIGURED_ACADEMIC_YEAR,
          class: className,
          section: "Setup Required",
          subject,
          medium: "English",
          book_title: "Setup Required",
          review_status: "Draft - Setup Required"
        },
        source,
        reason: "Lesson workspace registry is empty; class/subject setup rows can be prepared as draft workspaces.",
        confidence: source === "configured school setup" ? "medium" : "high",
        reviewRequired: true,
        classification: "can_auto_prepare",
        severity: "info",
        warnings: []
      }));
    });
  }

  if (!tabHasRows(sourceState, "qaSqaaRegistryUrl", "QA_Checklist_Config")) {
    DEFAULT_QA_CHECKLIST_ROWS.forEach(([id, item, notes]) => {
      rows.push(makeRow({
        spreadsheet: "QA/SQAA Registry",
        tab: "QA_Checklist_Config",
        primaryKeyColumn: primaryKeyFor("QA_Checklist_Config"),
        primaryKeyValue: id,
        row: { checklist_id: id, artifact_type: "Review Required", check_item: item, description: notes, severity: "Review Required", required: "TRUE", status: "Draft" },
        source: "schema default",
        reason: "QA checklist configuration is empty; default checklist definitions are safe setup/configuration rows.",
        confidence: "high",
        reviewRequired: false,
        classification: "can_auto_prepare",
        severity: "info",
        warnings: []
      }));
    });
  }

  if (!tabHasRows(sourceState, "dashboardDataSourceUrl", "KPI_Definitions")) {
    DEFAULT_KPI_ROWS.forEach(([id, name, source]) => {
      rows.push(makeRow({
        spreadsheet: "Dashboard Data Source",
        tab: "KPI_Definitions",
        primaryKeyColumn: primaryKeyFor("KPI_Definitions"),
        primaryKeyValue: id,
        row: { kpi_id: id, dashboard_role: "all", kpi_name: name, description: source, calculation_method: "live registry row count", target_value: "Review Required", status: "Draft - definition only" },
        source: "schema default",
        reason: "KPI definition tab is empty; KPI definitions describe dashboard configuration, not operational results.",
        confidence: "high",
        reviewRequired: false,
        classification: "can_auto_prepare",
        severity: "info",
        warnings: []
      }));
    });
  }

  if (!tabHasRows(sourceState, "dashboardDataSourceUrl", "Dashboard_KPI_Source")) {
    sourceState.registries.forEach((registry) => {
      Object.entries(registry.tabRowCounts || {}).forEach(([tab, count]) => {
        if (count <= 0) return;
        rows.push(makeRow({
          spreadsheet: "Dashboard Data Source",
          tab: "Dashboard_KPI_Source",
          primaryKeyColumn: primaryKeyFor("Dashboard_KPI_Source"),
          primaryKeyValue: `computed_${normalizeToken(registry.label)}_${normalizeToken(tab)}`,
          row: {
            kpi_value_id: `computed_${normalizeToken(registry.label)}_${normalizeToken(tab)}`,
            kpi_id: `kpi.${normalizeToken(tab).toLowerCase()}_count`,
            academic_year: CONFIGURED_ACADEMIC_YEAR,
            source_registry: registry.label,
            source_tab: tab,
            value: String(count),
            source_sheet: `${registry.label} / ${tab}`,
            status: "Draft - computed from live registry row count"
          },
          source: `${registry.label} / ${tab}`,
          reason: "Dashboard KPI source is empty; this row only maps a KPI to a live registry row count and does not invent operational values.",
          confidence: "high",
          reviewRequired: true,
          classification: "can_auto_prepare",
          severity: "info",
          warnings: []
        }));
      });
    });
  }

  if (!tabHasRows(sourceState, "classroomSyncRegistryUrl", "Classroom_Course_Map")) {
    classSubjects.slice(0, 80).forEach(({ className, subject, source }) => {
      CONFIGURED_SECTIONS.forEach((section) => {
        rows.push(makeRow({
          spreadsheet: "Google Classroom Sync Registry",
          tab: "Classroom_Course_Map",
          primaryKeyColumn: primaryKeyFor("Classroom_Course_Map"),
          primaryKeyValue: `course_map_${normalizeToken(className)}_${section}_${normalizeToken(subject)}_draft`,
          row: {
            course_map_id: `course_map_${normalizeToken(className)}_${section}_${normalizeToken(subject)}_draft`,
            school_id: "schooly_school_profile_draft",
            academic_year: CONFIGURED_ACADEMIC_YEAR,
            class: className,
            section,
            subject,
            teacher_staff_id: "Setup Required",
            classroom_course_id: "Setup Required",
            sync_status: "Draft - requires Classroom course ID review",
            status: "Draft - requires Classroom course ID review"
          },
          source,
          reason: "Class/section/subject can be inferred, but Classroom course IDs are not invented.",
          confidence: source === "configured school setup" ? "medium" : "high",
          reviewRequired: true,
          classification: "requires_human_review",
          severity: "warning",
          warnings: ["Classroom course ID must be reviewed before writeback."]
        }));
      });
    });
  }

  if (!tabHasRows(sourceState, "assessmentResultRegistryUrl", "Assessment_Plan") && classSubjects.length > 0) {
    classSubjects.forEach(({ className, subject, source }) => {
      rows.push(makeRow({
        spreadsheet: "Assessment/Result Registry",
        tab: "Assessment_Plan",
        primaryKeyColumn: primaryKeyFor("Assessment_Plan"),
        primaryKeyValue: `assessment_plan_${normalizeToken(className)}_${normalizeToken(subject)}_draft`,
        row: {
          assessment_plan_id: `assessment_plan_${normalizeToken(className)}_${normalizeToken(subject)}_draft`,
          academic_year: CONFIGURED_ACADEMIC_YEAR,
          term: "Setup Required",
          class: className,
          section: "Setup Required",
          subject,
          assessment_type: "Setup Required",
          status: "Draft - Setup Required"
        },
        source,
        reason: "Class/subject setup exists; assessment plan can be drafted but exam/calendar details remain setup-required.",
        confidence: source === "configured school setup" ? "medium" : "high",
        reviewRequired: true,
        classification: "requires_human_review",
        severity: "warning",
        warnings: ["Calendar/exam details are not invented; marked Setup Required."]
      }));
    });
  }

  const validatedRows = rows.filter((row) => {
    const rejection = validateSetupRow(row);
    if (rejection) {
      rejectedInferenceCandidates.push(rejection);
      return false;
    }
    return true;
  });
  const health = buildHealth(sourceState);
  const proposedDestinationTabs = new Set(validatedRows.map((row) => `${row.spreadsheet} / ${row.tab}`));
  const blockers = health.flatMap((item) => [
    ...(item.missingTab && !proposedDestinationTabs.has(`${item.spreadsheet} / ${item.tab}`) ? [`${item.spreadsheet} / ${item.tab}: required tab missing or inaccessible.`] : []),
    ...item.missingHeaders.map((header) => `${item.spreadsheet} / ${item.tab}: missing header ${header}.`),
    ...item.duplicatePrimaryIds.map((id) => `${item.spreadsheet} / ${item.tab}: duplicate primary ID ${id}.`),
    ...item.invalidDriveReferences.map((ref) => `${item.spreadsheet} / ${item.tab}: invalid Drive reference ${ref}.`)
  ]);
  const warnings = [
    ...sourceWarnings,
    ...health.filter((item) => item.emptyTab).map((item) =>
      proposedDestinationTabs.has(`${item.spreadsheet} / ${item.tab}`)
        ? `${item.spreadsheet} / ${item.tab}: empty setup tab can_auto_prepare or requires_human_review.`
        : `${item.spreadsheet} / ${item.tab}: tab has no data rows and cannot_infer from current sources.`
    ),
    ...health.filter((item) => item.placeholderRows > 0).map((item) => `${item.spreadsheet} / ${item.tab}: ${item.placeholderRows} placeholder/demo row(s) detected.`),
    ...validatedRows.flatMap((row) => row.warnings)
  ];
  const classifications = validatedRows.reduce((acc, row) => {
    acc[row.classification] = (acc[row.classification] || 0) + 1;
    return acc;
  }, {
    can_auto_prepare: 0,
    requires_human_review: 0,
    requires_external_connection: 0,
    cannot_infer: blockers.length
  } as Record<BootstrapClassification, number>);

  return {
    generatedAt: new Date().toISOString(),
    mode: "preview_only",
    summary: {
      proposedRows: validatedRows.filter((row) => !row.skippedBecauseKeyExists).length,
      blockers: blockers.length,
      warnings: warnings.length,
      skippedExistingRows: validatedRows.filter((row) => row.skippedBecauseKeyExists).length,
      rejectedInferenceCandidates: rejectedInferenceCandidates.length
    },
    health,
    destinations: groupDestinations(validatedRows),
    rejectedInferenceCandidates: Array.from(new Map(rejectedInferenceCandidates.map((item) => [`${item.sourcePath}::${item.field}::${item.rejectedValue}`, item])).values()),
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
    classifications,
    localStorageOverrides: sourceState.localStorageOverrides
  };
}

export function bootstrapPreviewToCsv(preview: RegistryBootstrapPreview): string {
  const headers = ["spreadsheet", "tab", "primaryKeyColumn", "primaryKeyValue", "severity", "skippedBecauseKeyExists", "source", "rowJson", "warnings"];
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = preview.destinations.flatMap((destination) => destination.rows).map((row) => [
    row.spreadsheet,
    row.tab,
    row.primaryKeyColumn,
    row.primaryKeyValue,
    row.severity,
    row.skippedBecauseKeyExists,
    row.source,
    JSON.stringify(row.row),
    row.warnings.join("; ")
  ]);
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}
