import { StudentDetails } from "../types";
import { GenericEntityDefinition } from "./genericEntityView";

function getEnrollmentBadgeVariant(enrollmentStatus: string | undefined) {
  const status = String(enrollmentStatus || "").toLowerCase();
  if (status.includes("active") || status.includes("enrolled") || status.includes("current")) return "success";
  if (status.includes("pending") || status.includes("probation") || status.includes("watch")) return "warning";
  if (status.includes("inactive") || status.includes("withdraw") || status.includes("left")) return "danger";
  return "default";
}

export function createStudentEntityDefinition(): GenericEntityDefinition<StudentDetails> {
  return {
    entityName: "Student",
    entityNamePlural: "Students",
    description: "Live student registry rows synced from the school feed.",
    getId: (student) => student.id,
    getTitle: (student) => student.name,
    getSubtitle: (student) => student.gradeLevel,
    getSummary: (student) => student.enrollmentStatus,
    defaultDisplayMode: "table",
    defaultPageSize: 20,
    searchPlaceholder: "Search students by name, email, grade, or enrollment status",
    emptyTitle: "No student records are available.",
    emptyDescription: "The live /api/students feed did not return any rows for the selected context.",
    fields: [
      {
        key: "email",
        label: "Email",
        type: "text",
        searchable: true,
      },
      {
        key: "gradeLevel",
        label: "Grade Level",
        type: "text",
        searchable: true,
        filterable: true,
        sortable: true,
        required: true,
      },
      {
        key: "enrollmentStatus",
        label: "Enrollment Status",
        type: "badge",
        searchable: true,
        filterable: true,
        sortable: true,
        required: true,
        getBadgeVariant: (student) => getEnrollmentBadgeVariant(student.enrollmentStatus),
      },
    ],
    sections: [
      {
        id: "identity",
        title: "Identity",
        fields: ["email", "gradeLevel", "enrollmentStatus"],
      },
    ],
    getRowIssues: (student) => {
      return [];
    },
  };
}
