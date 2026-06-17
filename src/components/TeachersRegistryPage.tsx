import React, { useEffect, useMemo, useState } from "react";
import { TeacherDetails } from "../types";
import { buildTeacherDetailsFromStaffDirectory } from "../lib/staffEntityDefinition";
import type { StaffDirectoryRow, TeacherAllocationRow } from "../lib/schoolRegistry";
import RegistryPageShell from "./RegistryPageShell";

interface TeachersRegistryPageProps {
  staffRows: StaffDirectoryRow[];
  teacherAllocations: TeacherAllocationRow[];
  currentRole: string;
}

export default function TeachersRegistryPage({ staffRows, teacherAllocations, currentRole }: TeachersRegistryPageProps) {
  const teachers = useMemo(
    () => buildTeacherDetailsFromStaffDirectory(staffRows, teacherAllocations),
    [staffRows, teacherAllocations],
  );
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
