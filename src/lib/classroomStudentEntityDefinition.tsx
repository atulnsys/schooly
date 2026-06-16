import { StudentDetails } from "../types";
import { GenericEntityDefinition } from "./genericEntityView";

export function createClassroomStudentEntityDefinition(): GenericEntityDefinition<StudentDetails> {
  return {
    entityName: "Pupil",
    entityNamePlural: "Student Risk Cards",
    description: "Students currently synced to the selected classroom course.",
    getId: (student) => student.id,
    getTitle: (student) => student.name,
    getSubtitle: (student) => student.gradeLevel,
    defaultDisplayMode: "cards",
    fields: [
      {
        key: "email",
        label: "Email",
        type: "text",
        searchable: true,
      },
      {
        key: "enrollmentStatus",
        label: "Enrollment",
        type: "text",
      },
      {
        key: "gpa",
        label: "GPA",
        type: "number",
        sortable: true,
        renderListValue: (student) => `GPA ${student.gpa.toFixed(2)}`,
      },
      {
        key: "riskScore",
        label: "Risk Index",
        type: "number",
        sortable: true,
        renderListValue: (student) => `${student.riskScore ?? 0}%`,
      },
      {
        key: "riskFactor",
        label: "Risk Flag",
        type: "badge",
        getBadgeVariant: (student) => {
          if (student.riskFactor === "high") return "danger";
          if (student.riskFactor === "medium") return "warning";
          if (student.riskFactor === "low") return "success";
          return "default";
        },
        renderListValue: (student) => student.riskFactor ? `${student.riskFactor} Flag` : "Normal",
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
