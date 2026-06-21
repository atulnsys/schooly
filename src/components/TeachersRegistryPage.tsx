import React, { useMemo } from "react";
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

  return (
    <RegistryPageShell
      registryId="teachers"
      rows={teachers}
      currentRole={currentRole}
      permissionContext={{ currentRole }}
    />
  );
}
