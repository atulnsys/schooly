import { ClassroomAssignment } from "../types";
import { GenericEntityDefinition } from "./genericEntityView";

interface ClassroomAssignmentEntityDefinitionOptions {
  courseName?: string;
  studentCount?: number;
}

export function createClassroomAssignmentEntityDefinition({
  courseName,
  studentCount,
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
    fields: [
      {
        key: "status",
        label: "Status",
        type: "badge",
        searchable: true,
        filterable: true,
        sortable: true,
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
      },
      {
        key: "submissionCount",
        label: "Submissions",
        type: "number",
        sortable: true,
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
    emptyTitle: "No assignments synchronized for this folder.",
    emptyDescription: "This course does not have any assignments yet.",
  };
}
