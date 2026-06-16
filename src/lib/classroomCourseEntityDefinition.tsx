import { ClassroomCourse } from "../types";
import { GenericEntityDefinition } from "./genericEntityView";

export function createClassroomCourseEntityDefinition(): GenericEntityDefinition<ClassroomCourse> {
  return {
    entityName: "Course",
    entityNamePlural: "Classroom Courses",
    description: "Select a course to view announcements, assignments, materials, and roster.",
    getId: (course) => course.id,
    getTitle: (course) => course.name,
    getSubtitle: (course) => course.section,
    defaultDisplayMode: "table",
    fields: [
      {
        key: "teacherName",
        label: "Teacher",
        type: "text",
        sortable: true,
      },
      {
        key: "studentCount",
        label: "Students",
        type: "number",
        sortable: true,
      },
    ],
  };
}
