import { TeacherDetails } from "../types";
import { GenericEntityDefinition } from "./genericEntityView";

export function createTeacherEntityDefinition(): GenericEntityDefinition<TeacherDetails> {
  return {
    entityName: "Teacher",
    entityNamePlural: "Teachers",
    description: "Live teacher registry rows synced from the school feed.",
    getId: (teacher) => teacher.id,
    getTitle: (teacher) => teacher.name,
    getSubtitle: (teacher) => teacher.department,
    getSummary: (teacher) =>
      teacher.currentCourses.length > 0
        ? `${teacher.department} · ${teacher.currentCourses.length} current courses`
        : `${teacher.department} · No active courses`,
    defaultDisplayMode: "table",
    searchPlaceholder: "Search teachers by name, email, department, or course",
    emptyTitle: "No teacher records are available.",
    emptyDescription: "The live /api/teachers feed did not return any rows for the selected context.",
    fields: [
      {
        key: "email",
        label: "Email",
        type: "text",
        searchable: true,
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
        key: "currentCourses",
        label: "Current Courses",
        type: "tags",
        searchable: true,
      },
    ],
    getRowIssues: (teacher) => {
      if (teacher.currentCourses.length > 0) return [];
      return [
        {
          id: `teacher_load_${teacher.id}`,
          message: "No active courses assigned",
          severity: "warning",
        },
      ];
    },
    sections: [
      {
        id: "identity",
        title: "Identity",
        fields: ["email", "department"],
      },
      {
        id: "teaching_load",
        title: "Teaching Load",
        fields: ["currentCourses"],
      },
    ],
  };
}
