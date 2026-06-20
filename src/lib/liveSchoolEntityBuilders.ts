import type { TeacherDetails, StudentDetails } from "../types";
import type { SchoolRegistryState, StaffDirectoryRow, StudentDirectoryRow, StudentEnrollmentRow, TeacherAllocationRow } from "./schoolRegistry";

function normalizeToken(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function isActiveValue(value: string): boolean {
  const lowered = normalizeToken(value);
  return !lowered || lowered.includes("active") || lowered.includes("current") || lowered.includes("enabled") || lowered.includes("enrolled");
}

function isTruthyTeacherFlag(value: string): boolean | null {
  const normalized = normalizeToken(value);
  if (!normalized) return null;
  if (["true", "yes", "1", "y", "teacher", "teaching", "faculty"].includes(normalized)) return true;
  if (["false", "no", "0", "n", "non teacher", "non-teacher", "support"].includes(normalized)) return false;
  return null;
}

export function isTeacherStaffRow(
  row: StaffDirectoryRow & {
    designation?: string;
    staff_category?: string;
    primary_staff_role?: string;
    employment_type?: string;
    is_teacher?: string;
  },
): boolean {
  const explicitFlag = isTruthyTeacherFlag(row.is_teacher || "");
  if (explicitFlag !== null) return explicitFlag;

  const candidateValues = [
    row.role,
    row.designation,
    row.staff_category,
    row.primary_staff_role,
    row.employment_type,
    row.department,
    row.staff_name,
    row.email,
  ].map(normalizeToken);

  return candidateValues.some((candidate) =>
    candidate.includes("teacher")
    || candidate.includes("teaching")
    || candidate.includes("faculty")
    || candidate.includes("instructor"),
  );
}

function formatTeacherCourseLabel(allocation: TeacherAllocationRow): string {
  const classLabel = String(allocation.class || "").trim();
  const sectionLabel = String(allocation.section || "").trim();
  const subjectLabel = String(allocation.subject || "").trim();
  const mediumLabel = String(allocation.medium || "").trim();

  const classSection = [classLabel, sectionLabel].filter(Boolean).join("-");
  const headline = [classSection, subjectLabel].filter(Boolean).join(" ");
  const suffix = mediumLabel && mediumLabel.toLowerCase() !== "english" ? ` (${mediumLabel})` : "";
  return `${headline || classLabel || subjectLabel || "Assigned course"}${suffix}`.trim();
}

export function buildStudentDetailsFromRegistry(
  studentDirectory: StudentDirectoryRow[] = [],
  enrollmentRows: StudentEnrollmentRow[] = [],
): StudentDetails[] {
  const enrollmentByStudentId = new Map(
    (enrollmentRows || [])
      .filter((row) => Boolean(row.student_id))
      .map((row) => [String(row.student_id || "").trim().toLowerCase(), row] as const),
  );

  return (studentDirectory || [])
    .filter((row) => isActiveValue(row.status))
    .sort((a, b) => String(a.student_name || a.student_id || "").localeCompare(String(b.student_name || b.student_id || "")))
    .map((row) => {
      const enrollment = enrollmentByStudentId.get(String(row.student_id || "").trim().toLowerCase());
      const gradeLevel = [enrollment?.class || row.class || "", enrollment?.section || row.section || ""]
        .filter(Boolean)
        .join(enrollment?.section || row.section ? "-" : "");
      const enrollmentStatus = enrollment?.status || row.status || "Active";

      return {
        id: row.student_id || row.student_name || "student",
        name: row.student_name || row.student_id || "Unnamed student",
        email: "",
        gradeLevel: gradeLevel || row.class || "Unassigned",
        enrollmentStatus,
        gpa: undefined,
        riskFactor: undefined,
        riskScore: undefined,
      };
    });
}

export function buildTeacherDetailsFromStaffDirectory(
  staffRows: StaffDirectoryRow[] = [],
  teacherAllocations: TeacherAllocationRow[] = [],
): TeacherDetails[] {
  const allocationsByEmail = new Map<string, TeacherAllocationRow[]>();

  teacherAllocations.forEach((allocation) => {
    const email = normalizeToken(allocation.teacher_email);
    if (!email) return;
    const existing = allocationsByEmail.get(email) || [];
    existing.push(allocation);
    allocationsByEmail.set(email, existing);
  });

  return (staffRows || [])
    .filter((row) => isActiveValue(row.status))
    .filter((row) => isTeacherStaffRow(row))
    .sort((a, b) => String(a.staff_name || a.email || a.staff_id || "").localeCompare(String(b.staff_name || b.email || b.staff_id || "")))
    .map((row) => {
      const email = String(row.email || "").trim();
      const allocationRows = allocationsByEmail.get(normalizeToken(email)) || [];
      const currentCourses = Array.from(
        new Set(
          allocationRows
            .filter((allocation) => isActiveValue(allocation.status))
            .map(formatTeacherCourseLabel)
            .filter(Boolean),
        ),
      );

      return {
        id: String(row.staff_id || email || row.staff_name || "teacher"),
        name: String(row.staff_name || email || row.staff_id || "Unnamed teacher"),
        email,
        department: String(row.department || row.role || "Teaching"),
        currentCourses,
      };
    });
}

export function getLiveSchoolRegistrySessionLabel(registry: SchoolRegistryState | null | undefined): string {
  if (!registry) return "";

  const candidates = [
    ...(registry.academicYears || []),
    ...(registry.schoolProfile || []),
  ] as unknown as Array<Record<string, unknown>>;

  for (const row of candidates) {
    const label = String(row.academic_year || row.academic_years || row.term_name || row.session || row.name || "").trim();
    if (label) return label;
  }

  return "";
}
