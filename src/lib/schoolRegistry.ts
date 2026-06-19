import { compareClassLabels } from "./classSort";
import { loadSeededRegistryConfig, saveSeededRegistryConfig } from "./seededRegistryConfig";
import { readGoogleSheetTabRows } from "./googleSheetRead";

export type SchoolRegistryMode = "missing" | "live" | "error" | "fallback";

export const DEMO_SCHOOL_ID = "SCHOOLY_TEST_SCHOOL";

export function isDemoSchoolId(value: string): boolean {
  return String(value || "").trim().toUpperCase() === DEMO_SCHOOL_ID;
}

export function isDemoSchoolProfile(row: Record<string, string>): boolean {
  return isDemoSchoolId(row.school_id) || ["true", "yes", "1"].includes(String(row.is_demo_school || row.demo_school || "").trim().toLowerCase());
}

export interface SchoolRegistryConfig {
  masterDataRegistryUrl: string;
}

export interface SchoolProfileRow {
  school_id: string;
  school_name: string;
  board: string;
  city: string;
  state: string;
  academic_year: string;
  source_status: string;
}

export interface AcademicYearRow {
  academic_year: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface ClassSectionRow {
  class: string;
  section: string;
  class_section: string;
  stage: string;
  medium: string;
  academic_year: string;
  status: string;
}

export interface SubjectRow {
  subject_id: string;
  subject: string;
  class: string;
  medium: string;
  department: string;
  status: string;
}

export interface StaffDirectoryRow {
  staff_id: string;
  staff_name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  designation?: string;
  staff_category?: string;
  primary_staff_role?: string;
  employment_type?: string;
  is_teacher?: string;
}

export interface TeacherAllocationRow {
  allocation_id: string;
  teacher_email: string;
  teacher_name: string;
  class: string;
  section: string;
  subject: string;
  medium: string;
  academic_year: string;
  status: string;
}

export interface TimetableRow {
  timetable_id: string;
  teacher_email: string;
  class: string;
  section: string;
  subject: string;
  day: string;
  period: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface StudentDirectoryRow {
  student_id: string;
  student_name: string;
  class: string;
  section: string;
  status: string;
}

export interface DataSourceStatusRow {
  source_id: string;
  source_name: string;
  mode: string;
  status: string;
  last_synced_at: string;
  notes: string;
}

export interface StudentEnrollmentRow {
  enrollment_id: string;
  student_id: string;
  school_id: string;
  academic_year: string;
  class: string;
  section: string;
  roll_number: string;
  admission_date: string;
  status: string;
}

export interface BooksRegistryRow {
  book_id: string;
  school_id: string;
  academic_year: string;
  class: string;
  subject: string;
  medium: string;
  board: string;
  publisher: string;
  book_title: string;
  ncert_book_id: string;
  source_url: string;
  drive_file_id: string;
  drive_file_url: string;
  status: string;
}

export interface BookTocRegistryRow {
  book_toc_id: string;
  book_id: string;
  ncert_book_id: string;
  class: string;
  subject: string;
  chapter_number: string;
  chapter_title: string;
  page_start: string;
  page_end: string;
  toc_source: string;
  source_status: string;
  status: string;
}

export interface RegistryBootstrapLogRow {
  bootstrap_log_id: string;
  registry_name: string;
  tab_name: string;
  bootstrap_status: string;
  created_at: string;
  created_by: string;
  notes: string;
}

export interface RegistrySummaryRow {
  registry_summary_id: string;
  school_id: string;
  school_name: string;
  academic_year: string;
  board: string;
  medium: string;
  principal_name: string;
  class_count: string;
  student_count: string;
  staff_count: string;
  book_count: string;
  status: string;
  notes: string;
}

export interface SchoolRegistryState {
  mode: SchoolRegistryMode;
  sourceLabel: string;
  warnings: string[];
  loadedAt: string | null;
  config: SchoolRegistryConfig;
  schoolProfile: SchoolProfileRow[];
  academicYears: AcademicYearRow[];
  classesSections: ClassSectionRow[];
  subjects: SubjectRow[];
  staffDirectory: StaffDirectoryRow[];
  teacherAllocations: TeacherAllocationRow[];
  timetable: TimetableRow[];
  studentDirectory: StudentDirectoryRow[];
  studentEnrollment: StudentEnrollmentRow[];
  booksRegistry: BooksRegistryRow[];
  bookTocRegistry: BookTocRegistryRow[];
  registryBootstrapLog: RegistryBootstrapLogRow[];
  registrySummary: RegistrySummaryRow[];
  dataSourceStatus: DataSourceStatusRow[];
}

const MASTER_REGISTRY_TABS = [
  "School_Profile",
  "Academic_Years",
  "Classes_Sections",
  "Subjects",
  "Staff_Directory",
  "Teacher_Allocations",
  "Timetable",
  "Student_Directory",
  "Student_Enrollment",
  "Books_Registry",
  "Book_TOC_Registry",
  "Registry_Bootstrap_Log",
  "Registry_Summary"
];

function normalizeKey(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function cellToString(cell: any): string {
  if (cell == null) return "";
  if (typeof cell === "string") return cell.trim();
  if (typeof cell === "number" || typeof cell === "boolean") return String(cell);
  if (typeof cell.v !== "undefined" && cell.v != null) return String(cell.v).trim();
  if (typeof cell.f !== "undefined" && cell.f != null) return String(cell.f).trim();
  return "";
}

function looksLikeGeneratedColumnLabels(headers: string[]): boolean {
  return headers.length > 0 && headers.every((header, index) => {
    let label = "";
    let n = index + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      label = String.fromCharCode(65 + rem) + label;
      n = Math.floor((n - 1) / 26);
    }
    return header === normalizeKey(label);
  });
}

function parseGvizTable(text: string): Record<string, string>[] {
  const match = text.match(/setResponse\(([\s\S]+)\);\s*$/);
  if (!match) {
    throw new Error("Unexpected Google Sheets response format.");
  }

  const payload = JSON.parse(match[1]);
  const rawHeaders = (payload?.table?.cols || []).map((col: any, index: number) =>
    String(col.label || col.id || col.columnId || `column_${index + 1}`).trim()
  );
  const bodyRows = payload?.table?.rows || [];
  const firstRowValues = (bodyRows[0]?.c || []).map(cellToString);
  const useFirstRowAsHeaders = looksLikeGeneratedColumnLabels(rawHeaders.map(normalizeKey)) &&
    firstRowValues.some((value: string) => value.trim() !== "");
  const headers = (useFirstRowAsHeaders ? firstRowValues : rawHeaders).map((header: string, index: number) =>
    normalizeKey(header || `column_${index + 1}`)
  );

  return (useFirstRowAsHeaders ? bodyRows.slice(1) : bodyRows)
    .map((row: any) => {
      const entry: Record<string, string> = {};
      (row.c || []).forEach((cell: any, index: number) => {
        entry[headers[index] || `column_${index + 1}`] = cellToString(cell);
      });
      return entry;
    })
    .filter((row: Record<string, string>) => Object.values(row).some((value) => value.trim() !== ""));
}

async function fetchTabs(sheetUrl: string, tabNames: string[]) {
  const warnings: string[] = [];
  const tabs: Record<string, Record<string, string>[]> = {};
  const settled = await Promise.allSettled(
    tabNames.map(async (tabName) => [tabName, await readGoogleSheetTabRows(sheetUrl, tabName)] as const)
  );

  settled.forEach((result, index) => {
    const tabName = tabNames[index];
    if (result.status === "fulfilled") {
      tabs[tabName] = result.value[1].rows;
    } else {
      tabs[tabName] = [];
      warnings.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
    }
  });

  return { tabs, warnings };
}

function pick(row: Record<string, string>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (row[normalized] && row[normalized].trim()) return row[normalized].trim();
  }
  return fallback;
}

function isActive(value: string): boolean {
  const lowered = String(value || "").toLowerCase();
  return !lowered || lowered.includes("active") || lowered.includes("enabled") || lowered.includes("current");
}

function normalizeClassSection(row: Record<string, string>): ClassSectionRow {
  const className = pick(row, ["class", "class_name", "grade"], "");
  const section = pick(row, ["section"], "");
  return {
    class: className,
    section,
    class_section: pick(row, ["class_section"], section ? `${className}-${section}` : className),
    stage: pick(row, ["stage"], ""),
    medium: pick(row, ["medium", "language"], "English"),
    academic_year: pick(row, ["academic_year"], ""),
    status: pick(row, ["status"], "Active")
  };
}

function normalizeSubject(row: Record<string, string>): SubjectRow {
  return {
    subject_id: pick(row, ["subject_id", "id"], ""),
    subject: pick(row, ["subject", "subject_name"], ""),
    class: pick(row, ["class", "class_name", "grade"], ""),
    medium: pick(row, ["medium", "language"], "English"),
    department: pick(row, ["department"], ""),
    status: pick(row, ["status"], "Active")
  };
}

function normalizeStaff(row: Record<string, string>): StaffDirectoryRow {
  return {
    staff_id: pick(row, ["staff_id", "id"], ""),
    staff_name: pick(row, ["staff_name", "teacher_name", "name"], ""),
    email: pick(row, ["email", "teacher_email", "staff_email"], ""),
    role: pick(row, ["role", "designation"], ""),
    department: pick(row, ["department"], ""),
    status: pick(row, ["status"], "Active"),
    designation: pick(row, ["designation"], ""),
    staff_category: pick(row, ["staff_category", "staff_type"], ""),
    primary_staff_role: pick(row, ["primary_staff_role", "primary_role"], ""),
    employment_type: pick(row, ["employment_type"], ""),
    is_teacher: pick(row, ["is_teacher", "teacher_flag", "teacher"], "")
  };
}

function normalizeAllocation(row: Record<string, string>): TeacherAllocationRow {
  return {
    allocation_id: pick(row, ["allocation_id", "id"], ""),
    teacher_email: pick(row, ["teacher_email", "email", "staff_email"], ""),
    teacher_name: pick(row, ["teacher_name", "staff_name", "name"], ""),
    class: pick(row, ["class", "class_name", "grade"], ""),
    section: pick(row, ["section"], ""),
    subject: pick(row, ["subject", "subject_name"], ""),
    medium: pick(row, ["medium", "language"], "English"),
    academic_year: pick(row, ["academic_year"], ""),
    status: pick(row, ["status"], "Active")
  };
}

function normalizeTimetable(row: Record<string, string>): TimetableRow {
  return {
    timetable_id: pick(row, ["timetable_id", "id"], ""),
    teacher_email: pick(row, ["teacher_email", "email", "staff_email"], ""),
    class: pick(row, ["class", "class_name", "grade"], ""),
    section: pick(row, ["section"], ""),
    subject: pick(row, ["subject", "subject_name"], ""),
    day: pick(row, ["day", "weekday"], ""),
    period: pick(row, ["period"], ""),
    start_time: pick(row, ["start_time"], ""),
    end_time: pick(row, ["end_time"], ""),
    status: pick(row, ["status"], "Active")
  };
}

export function loadSchoolRegistryConfig(): SchoolRegistryConfig {
  return {
    masterDataRegistryUrl: loadSeededRegistryConfig().masterDataRegistryUrl
  };
}

export function saveSchoolRegistryConfig(config: SchoolRegistryConfig): void {
  saveSeededRegistryConfig({ masterDataRegistryUrl: config.masterDataRegistryUrl });
}

export function getClassesFromSchoolRegistry(registry: SchoolRegistryState | null): string[] {
  if (registry?.mode !== "live") return [];
  return Array.from(new Set(
    registry.classesSections
      .filter((row) => isActive(row.status))
      .map((row) => row.class)
      .filter(Boolean)
  )).sort(compareClassLabels);
}

export function getSubjectsFromSchoolRegistry(registry: SchoolRegistryState | null, className?: string): string[] {
  if (registry?.mode !== "live") return [];
  const normalizedClass = String(className || "").trim().toLowerCase();
  return Array.from(new Set(
    registry.subjects
      .filter((row) => isActive(row.status))
      .filter((row) => !normalizedClass || row.class.trim().toLowerCase() === normalizedClass || !row.class)
      .map((row) => row.subject)
      .filter(Boolean)
  )).sort();
}

export function getTeacherAllocationFromSchoolRegistry(registry: SchoolRegistryState | null, teacherEmail: string) {
  if (registry?.mode !== "live") return null;
  const email = String(teacherEmail || "").trim().toLowerCase();
  const rows = registry.teacherAllocations.filter((row) =>
    isActive(row.status) && row.teacher_email.trim().toLowerCase() === email
  );
  if (rows.length === 0) return null;
  return {
    classes: Array.from(new Set(rows.map((row) => row.class).filter(Boolean))).sort(compareClassLabels),
    subjects: Array.from(new Set(rows.map((row) => row.subject).filter(Boolean))).sort(),
    rows
  };
}

export async function loadSchoolRegistry(config = loadSchoolRegistryConfig()): Promise<SchoolRegistryState> {
  const url = config.masterDataRegistryUrl.trim();
  if (!url) {
    return {
      mode: "missing",
      sourceLabel: "Master data registry missing - live setup required",
      warnings: ["Configure Schooly_Master_Data_Registry to use live classes, subjects, staff, and teacher allocations."],
      loadedAt: null,
      config,
      schoolProfile: [],
      academicYears: [],
      classesSections: [],
      subjects: [],
      staffDirectory: [],
      teacherAllocations: [],
      timetable: [],
      studentDirectory: [],
      studentEnrollment: [],
      booksRegistry: [],
      bookTocRegistry: [],
      registryBootstrapLog: [],
      registrySummary: [],
      dataSourceStatus: []
    };
  }

  try {
    const { tabs, warnings } = await fetchTabs(url, MASTER_REGISTRY_TABS);
    const state: SchoolRegistryState = {
      mode: "live",
      sourceLabel: "Live master data registry - Google Sheets",
      warnings,
      loadedAt: new Date().toISOString(),
      config,
      schoolProfile: (tabs.School_Profile || []).map((row) => ({
        school_id: pick(row, ["school_id", "id"], ""),
        school_name: pick(row, ["school_name", "name"], ""),
        board: pick(row, ["board"], ""),
        city: pick(row, ["city"], ""),
        state: pick(row, ["state"], ""),
        academic_year: pick(row, ["academic_year"], ""),
        source_status: pick(row, ["source_status", "status"], "Active")
      })),
      academicYears: (tabs.Academic_Years || []).map((row) => ({
        academic_year: pick(row, ["academic_year"], ""),
        start_date: pick(row, ["start_date"], ""),
        end_date: pick(row, ["end_date"], ""),
        status: pick(row, ["status"], "Active")
      })),
      classesSections: (tabs.Classes_Sections || []).map(normalizeClassSection),
      subjects: (tabs.Subjects || []).map(normalizeSubject),
      staffDirectory: (tabs.Staff_Directory || []).map(normalizeStaff),
      teacherAllocations: (tabs.Teacher_Allocations || []).map(normalizeAllocation),
      timetable: (tabs.Timetable || []).map(normalizeTimetable),
      studentDirectory: (tabs.Student_Directory || []).map((row) => ({
        student_id: pick(row, ["student_id", "id"], ""),
        student_name: pick(row, ["student_name", "name"], ""),
        class: pick(row, ["class", "class_name", "grade"], ""),
        section: pick(row, ["section"], ""),
        status: pick(row, ["status"], "Active")
      })),
      studentEnrollment: (tabs.Student_Enrollment || []).map((row) => ({
        enrollment_id: pick(row, ["enrollment_id", "id"], ""),
        student_id: pick(row, ["student_id"], ""),
        school_id: pick(row, ["school_id"], ""),
        academic_year: pick(row, ["academic_year"], ""),
        class: pick(row, ["class", "class_name", "grade"], ""),
        section: pick(row, ["section"], ""),
        roll_number: pick(row, ["roll_number"], ""),
        admission_date: pick(row, ["admission_date"], ""),
        status: pick(row, ["status"], "Active")
      })),
      booksRegistry: (tabs.Books_Registry || []).map((row) => ({
        book_id: pick(row, ["book_id", "id"], ""),
        school_id: pick(row, ["school_id"], ""),
        academic_year: pick(row, ["academic_year"], ""),
        class: pick(row, ["class", "class_name", "grade"], ""),
        subject: pick(row, ["subject", "subject_name"], ""),
        medium: pick(row, ["medium", "language"], "English"),
        board: pick(row, ["board"], ""),
        publisher: pick(row, ["publisher"], ""),
        book_title: pick(row, ["book_title", "title"], ""),
        ncert_book_id: pick(row, ["ncert_book_id"], ""),
        source_url: pick(row, ["source_url"], ""),
        drive_file_id: pick(row, ["drive_file_id"], ""),
        drive_file_url: pick(row, ["drive_file_url"], ""),
        status: pick(row, ["status"], "Active")
      })),
      bookTocRegistry: (tabs.Book_TOC_Registry || []).map((row) => ({
        book_toc_id: pick(row, ["book_toc_id", "id"], ""),
        book_id: pick(row, ["book_id"], ""),
        ncert_book_id: pick(row, ["ncert_book_id"], ""),
        class: pick(row, ["class", "class_name", "grade"], ""),
        subject: pick(row, ["subject", "subject_name"], ""),
        chapter_number: pick(row, ["chapter_number"], ""),
        chapter_title: pick(row, ["chapter_title", "title"], ""),
        page_start: pick(row, ["page_start"], ""),
        page_end: pick(row, ["page_end"], ""),
        toc_source: pick(row, ["toc_source"], ""),
        source_status: pick(row, ["source_status"], ""),
        status: pick(row, ["status"], "Active")
      })),
      registryBootstrapLog: (tabs.Registry_Bootstrap_Log || []).map((row) => ({
        bootstrap_log_id: pick(row, ["bootstrap_log_id", "id"], ""),
        registry_name: pick(row, ["registry_name"], ""),
        tab_name: pick(row, ["tab_name"], ""),
        bootstrap_status: pick(row, ["bootstrap_status", "status"], ""),
        created_at: pick(row, ["created_at"], ""),
        created_by: pick(row, ["created_by"], ""),
        notes: pick(row, ["notes"], "")
      })),
      registrySummary: (tabs.Registry_Summary || []).map((row) => ({
        registry_summary_id: pick(row, ["registry_summary_id", "id"], ""),
        school_id: pick(row, ["school_id"], ""),
        school_name: pick(row, ["school_name", "name"], ""),
        academic_year: pick(row, ["academic_year"], ""),
        board: pick(row, ["board"], ""),
        medium: pick(row, ["medium", "language"], ""),
        principal_name: pick(row, ["principal_name"], ""),
        class_count: pick(row, ["class_count"], ""),
        student_count: pick(row, ["student_count"], ""),
        staff_count: pick(row, ["staff_count"], ""),
        book_count: pick(row, ["book_count"], ""),
        status: pick(row, ["status"], "Active"),
        notes: pick(row, ["notes"], "")
      })),
      dataSourceStatus: (tabs.Registry_Summary || []).map((row) => ({
        source_id: pick(row, ["source_id", "id"], ""),
        source_name: pick(row, ["source_name", "registry_name", "name"], ""),
        mode: pick(row, ["mode"], "live"),
        status: pick(row, ["status"], ""),
        last_synced_at: pick(row, ["last_synced_at", "last_synced"], ""),
        notes: pick(row, ["notes", "remarks"], "")
      }))
    };
    return state;
  } catch (error: any) {
    return {
      mode: "error",
      sourceLabel: "Master data registry fetch failed - live setup required",
      warnings: [error?.message || String(error)],
      loadedAt: null,
      config,
      schoolProfile: [],
      academicYears: [],
      classesSections: [],
      subjects: [],
      staffDirectory: [],
      teacherAllocations: [],
      timetable: [],
      studentDirectory: [],
      studentEnrollment: [],
      booksRegistry: [],
      bookTocRegistry: [],
      registryBootstrapLog: [],
      registrySummary: [],
      dataSourceStatus: []
    };
  }
}
