import React, { useEffect, useState } from "react";
import { ClassroomCourse } from "../types";
import RegistryPageShell from "./RegistryPageShell";

interface ClassroomCoursesRegistryPageProps {
  courses: ClassroomCourse[];
  currentRole: string;
}

export default function ClassroomCoursesRegistryPage({ courses, currentRole }: ClassroomCoursesRegistryPageProps) {
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null);
  useEffect(() => {
    if (selectedCourse && !courses.some((course) => course.id === selectedCourse.id)) {
      setSelectedCourse(null);
    }
  }, [courses, selectedCourse]);

  return (
    <RegistryPageShell
      registryId="courses"
      rows={courses}
      currentRole={currentRole}
      selectedRow={selectedCourse}
      onSelectRow={setSelectedCourse}
      permissionContext={{ currentRole }}
    />
  );
}
