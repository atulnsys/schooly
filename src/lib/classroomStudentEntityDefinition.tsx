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
    ],
    getRowIssues: () => [],
  };
}
