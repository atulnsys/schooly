import type { TeacherDetails } from "../types";
import type { StaffDirectoryRow, TeacherAllocationRow } from "./schoolRegistry";
import type { GenericEntityDefinition, GenericEntityIssue } from "./genericEntityView";

const TEACHER_SIGNAL_TERMS = [
  "teacher",
  "teaching",
  "faculty",
  "instructor",
  "educator",
  "lecturer",
  "school teacher",
  "staff teacher",
];

function normalizeSignalValue(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function isTruthyTeacherFlag(value: unknown): boolean | null {
  const normalized = normalizeSignalValue(value);
  if (!normalized) return null;
  if (["true", "yes", "1", "y", "teacher", "teaching", "faculty"].includes(normalized)) return true;
  if (["false", "no", "0", "n", "non-teacher", "non teacher", "support"].includes(normalized)) return false;
  return null;
}

export function isTeacherStaffRow(row: StaffDirectoryRow & {
  designation?: string;
  staff_category?: string;
  primary_staff_role?: string;
  employment_type?: string;
  is_teacher?: string;
}): boolean {
  const typedRow = row as StaffDirectoryRow & {
    designation?: string;
    staff_category?: string;
    primary_staff_role?: string;
    employment_type?: string;
    is_teacher?: string;
  };
  const explicitFlag = isTruthyTeacherFlag(typedRow.is_teacher);
  if (explicitFlag !== null) return explicitFlag;

  const candidateValues = [
    typedRow.role,
    typedRow.designation,
    typedRow.staff_category,
    typedRow.primary_staff_role,
    typedRow.employment_type,
    typedRow.department,
    typedRow.staff_name,
    typedRow.email,
  ].map(normalizeSignalValue);

  return candidateValues.some((candidate) =>
    TEACHER_SIGNAL_TERMS.some((term) => candidate.includes(term)),
  );
}

function isActiveStaffRow(status: unknown): boolean {
  const normalized = normalizeSignalValue(status);
  return !normalized || normalized.includes("active") || normalized.includes("current") || normalized.includes("enabled");
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

export function buildTeacherDetailsFromStaffDirectory(
  staffRows: StaffDirectoryRow[],
  teacherAllocations: TeacherAllocationRow[] = [],
): TeacherDetails[] {
  const allocationsByEmail = new Map<string, TeacherAllocationRow[]>();

  teacherAllocations.forEach((allocation) => {
    const email = normalizeSignalValue(allocation.teacher_email);
    if (!email) return;
    const existing = allocationsByEmail.get(email) || [];
    existing.push(allocation);
    allocationsByEmail.set(email, existing);
  });

  return (staffRows || [])
    .filter((row) => isActiveStaffRow(row.status))
    .filter((row) => isTeacherStaffRow(row))
    .sort((a, b) => String(a.staff_name || a.email || a.staff_id || "").localeCompare(String(b.staff_name || b.email || b.staff_id || "")))
    .map((row) => {
      const email = String(row.email || "").trim();
      const allocationRows = allocationsByEmail.get(normalizeSignalValue(email)) || [];
      const currentCourses = Array.from(
        new Set(
          allocationRows
            .filter((allocation) => isActiveStaffRow(allocation.status))
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

function getStatusBadgeVariant(status: string | undefined) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("active") || normalized.includes("current") || normalized.includes("enabled")) return "success";
  if (normalized.includes("pending") || normalized.includes("review")) return "warning";
  if (normalized.includes("inactive") || normalized.includes("disabled") || normalized.includes("suspended")) return "danger";
  return "default";
}

export function createStaffEntityDefinition(): GenericEntityDefinition<StaffDirectoryRow> {
  return {
    entityName: "Staff Member",
    entityNamePlural: "Staff",
    description: "Live staff directory rows synced from the master registry.",
    getId: (staff) => staff.staff_id,
    getTitle: (staff) => staff.staff_name,
    getSubtitle: (staff) => staff.role,
    getSummary: (staff) => `${staff.department || "General"} - ${staff.status || "Status pending"}`,
    defaultDisplayMode: "table",
    defaultPageSize: 20,
    searchPlaceholder: "Search staff by name, role, department, or email",
    emptyTitle: "No staff records are available.",
    emptyDescription: "The live Staff_Directory feed did not return any rows for the selected context.",
    fields: [
      {
        key: "email",
        label: "Email",
        type: "text",
        searchable: true,
      },
      {
        key: "role",
        label: "Role",
        type: "text",
        searchable: true,
        filterable: true,
        sortable: true,
      },
      {
        key: "department",
        label: "Department",
        type: "text",
        searchable: true,
        filterable: true,
        sortable: true,
      },
      {
        key: "status",
        label: "Status",
        type: "badge",
        searchable: true,
        filterable: true,
        sortable: true,
        getBadgeVariant: (staff) => getStatusBadgeVariant(staff.status),
      },
    ],
    sections: [
      {
        id: "identity",
        title: "Identity",
        fields: ["email", "role", "department"],
      },
      {
        id: "status",
        title: "Status",
        fields: ["status"],
      },
    ],
    getRowIssues: (staff) => {
      const issues: GenericEntityIssue[] = [];
      if (!String(staff.status || "").trim()) {
        issues.push({
          id: `staff_status_${staff.staff_id}`,
          message: "Status is missing",
          severity: "warning" as const,
        });
      }
      return issues;
    },
  };
}
