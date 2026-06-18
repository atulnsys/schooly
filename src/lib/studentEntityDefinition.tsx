import { StudentDetails } from "../types";
import { GenericEntityDefinition } from "./genericEntityView";

function getEnrollmentBadgeVariant(enrollmentStatus: string | undefined) {
  const status = String(enrollmentStatus || "").toLowerCase();
  if (status.includes("active") || status.includes("enrolled") || status.includes("current")) return "success";
  if (status.includes("pending") || status.includes("probation") || status.includes("watch")) return "warning";
  if (status.includes("inactive") || status.includes("withdraw") || status.includes("left")) return "danger";
  return "default";
}

function getRiskBadgeVariant(riskFactor: StudentDetails["riskFactor"]) {
  if (riskFactor === "high") return "danger";
  if (riskFactor === "medium") return "warning";
  if (riskFactor === "low") return "success";
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
    getSummary: (student) => `${student.enrollmentStatus} • GPA ${student.gpa.toFixed(2)} • Risk ${student.riskScore ?? 0}%`,
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
        required: true,
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
      {
        key: "gpa",
        label: "GPA",
        type: "number",
        sortable: true,
        renderListValue: (student) => `GPA ${student.gpa.toFixed(2)}`,
      },
      {
        key: "riskFactor",
        label: "Risk Flag",
        type: "badge",
        filterable: true,
        sortable: true,
        getBadgeVariant: (student) => getRiskBadgeVariant(student.riskFactor),
        renderListValue: (student) => student.riskFactor ? `${student.riskFactor} risk` : "Normal",
      },
      {
        key: "riskScore",
        label: "Risk Index",
        type: "number",
        sortable: true,
        renderListValue: (student) => `${student.riskScore ?? 0}%`,
      },
    ],
    sections: [
      {
        id: "identity",
        title: "Identity",
        fields: ["email", "gradeLevel", "enrollmentStatus"],
      },
      {
        id: "performance",
        title: "Academic Snapshot",
        fields: ["gpa", "riskFactor", "riskScore"],
      },
    ],
    getRowIssues: (student) => {
      if (!student.riskScore || student.riskScore <= 30) return [];
      return [
        {
          id: `risk_${student.id}`,
          message: student.riskScore >= 70 ? "High risk pupil" : "Moderate risk pupil",
          severity: student.riskScore >= 70 ? "error" : "warning",
        },
      ];
    },
  };
}
