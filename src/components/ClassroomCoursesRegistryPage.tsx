import React from "react";
import type { ClassroomCourse } from "../types";
import RegistryPageShell from "./RegistryPageShell";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";

interface ClassroomCoursesRegistryPageProps {
  courses: ClassroomCourse[];
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
}

export default function ClassroomCoursesRegistryPage({ courses, currentRole, storageContext }: ClassroomCoursesRegistryPageProps) {
  return (
    <RegistryPageShell
      registryId="courses"
      rows={courses}
      currentRole={currentRole}
      storageContext={storageContext}
      permissionContext={{ currentRole }}
    />
  );
}
