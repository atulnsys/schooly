import { ClassroomAssignment } from "../types";
import { GenericEntityDefinition } from "./genericEntityView";

interface ClassroomAssignmentEntityDefinitionOptions {
  courseName?: string;
  studentCount?: number;
  showCourseName?: boolean;
}

export function createClassroomAssignmentEntityDefinition({
  courseName,
  studentCount,
  showCourseName = false,
}: ClassroomAssignmentEntityDefinitionOptions = {}): GenericEntityDefinition<ClassroomAssignment> {
  return {
    entityName: "Assignment",
    entityNamePlural: "Assignments",
    description: courseName
      ? `Assignments for ${courseName}.`
      : "Assignments for the selected classroom.",
    getId: (assignment) => assignment.id,
    getTitle: (assignment) => assignment.title,
    getSummary: (assignment) => assignment.description,
    defaultDisplayMode: "table",
    searchPlaceholder: "Search assignments by title, status, course, or due date",
    emptyTitle: "No assignments synchronized for this folder.",
    emptyDescription: "This course does not have any assignments yet.",
    fields: [
      ...(showCourseName
        ? [
            {
              key: "courseName",
              label: "Course",
              type: "text" as const,
              searchable: true,
              filterable: true,
              sortable: true,
            },
          ]
        : []),
      {
        key: "status",
        label: "Status",
        type: "badge",
        searchable: true,
        filterable: true,
        sortable: true,
        required: true,
        getBadgeVariant: (assignment) => {
          if (assignment.status === "graded") return "success";
          if (assignment.status === "submitted") return "info";
          return "warning";
        },
      },
      {
        key: "dueDate",
        label: "Due Date",
        type: "date",
        sortable: true,
        required: true,
      },
      {
        key: "submissionCount",
        label: "Submissions",
        type: "number",
        sortable: true,
        required: true,
        renderListValue: (assignment) =>
          `${assignment.submissionCount}${studentCount ? ` / ${studentCount}` : ""}`,
      },
      {
        key: "totalPoints",
        label: "Max Grade",
        type: "number",
        sortable: true,
        renderListValue: (assignment) => {
          if (assignment.totalPoints === undefined || assignment.totalPoints === null) {
            return assignment.grade !== undefined ? `${assignment.grade} pts` : "—";
          }

          return `${assignment.grade !== undefined ? `${assignment.grade} / ` : ""}${assignment.totalPoints} pts`;
        },
      },
    ],
    sections: [
      {
        id: "identity",
        title: "Identity",
        fields: showCourseName ? ["courseName", "status"] : ["status"],
      },
      {
        id: "grading",
        title: "Grading",
        fields: ["dueDate", "submissionCount", "totalPoints"],
      },
    ],
    detail: {
      displayMode: "read-only",
      readOnlyReason: "Assignment rows are read-only snapshots from the connected classroom feed.",
    },
  };
}
