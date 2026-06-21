import React from "react";
import type { ClassroomCourse } from "../types";
import RegistryPageShell from "./RegistryPageShell";

interface ClassroomCoursesRegistryPageProps {
  courses: ClassroomCourse[];
  currentRole: string;
}

export default function ClassroomCoursesRegistryPage({ courses, currentRole }: ClassroomCoursesRegistryPageProps) {
  return (
    <RegistryPageShell
      registryId="courses"
      rows={courses}
      currentRole={currentRole}
      permissionContext={{ currentRole }}
    />
  );
}
