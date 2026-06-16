import React, { useEffect, useState } from "react";
import { TeacherDetails } from "../types";
import RegistryPageShell from "./RegistryPageShell";

interface TeachersRegistryPageProps {
  teachers: TeacherDetails[];
  currentRole: string;
}

export default function TeachersRegistryPage({ teachers, currentRole }: TeachersRegistryPageProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDetails | null>(null);
  useEffect(() => {
    if (selectedTeacher && !teachers.some((teacher) => teacher.id === selectedTeacher.id)) {
      setSelectedTeacher(null);
    }
  }, [teachers, selectedTeacher]);

  return (
    <RegistryPageShell
      registryId="teachers"
      rows={teachers}
      currentRole={currentRole}
      selectedRow={selectedTeacher}
      onSelectRow={setSelectedTeacher}
      permissionContext={{ currentRole }}
    />
  );
}
