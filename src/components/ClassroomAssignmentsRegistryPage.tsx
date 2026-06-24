import React from "react";
import type { ClassroomAssignment } from "../types";
import RegistryPageShell from "./RegistryPageShell";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";

interface ClassroomAssignmentsRegistryPageProps {
  assignments: ClassroomAssignment[];
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
  activeCapabilities?: string[];
}

export default function ClassroomAssignmentsRegistryPage({ assignments, currentRole, storageContext, activeCapabilities }: ClassroomAssignmentsRegistryPageProps) {
  return (
    <RegistryPageShell
      registryId="assignments"
      rows={assignments}
      currentRole={currentRole}
      storageContext={storageContext}
      permissionContext={{ currentRole, activeCapabilities }}
      showListHeader={false}
    />
  );
}
