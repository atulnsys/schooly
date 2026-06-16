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
    getSummary: (course) => `${course.teacherName} · ${course.studentCount} students`,
    defaultDisplayMode: "table",
    searchPlaceholder: "Search courses by name, teacher, or section",
    emptyTitle: "No classroom courses are available.",
    emptyDescription: "The live /api/classroom/courses feed did not return any rows for the selected context.",
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
    sections: [
      {
        id: "identity",
        title: "Identity",
        fields: ["teacherName"],
      },
      {
        id: "enrollment",
        title: "Enrollment",
        fields: ["studentCount"],
      },
    ],
  };
}
