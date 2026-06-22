import React, { useMemo } from "react";
import { buildTeacherDetailsFromStaffDirectory } from "../lib/staffEntityDefinition";
import type { StaffDirectoryRow, TeacherAllocationRow } from "../lib/schoolRegistry";
import RegistryPageShell from "./RegistryPageShell";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";

interface TeachersRegistryPageProps {
  staffRows: StaffDirectoryRow[];
  teacherAllocations: TeacherAllocationRow[];
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
}

export default function TeachersRegistryPage({ staffRows, teacherAllocations, currentRole, storageContext }: TeachersRegistryPageProps) {
  const teachers = useMemo(
    () => buildTeacherDetailsFromStaffDirectory(staffRows, teacherAllocations),
    [staffRows, teacherAllocations],
  );

  return (
    <RegistryPageShell
      registryId="teachers"
      rows={teachers}
      currentRole={currentRole}
      storageContext={storageContext}
      permissionContext={{ currentRole }}
    />
  );
}
