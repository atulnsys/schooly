import React from "react";
import type { ClassroomAssignment } from "../types";
import RegistryPageShell from "./RegistryPageShell";

interface ClassroomAssignmentsRegistryPageProps {
  assignments: ClassroomAssignment[];
  currentRole: string;
}

export default function ClassroomAssignmentsRegistryPage({ assignments, currentRole }: ClassroomAssignmentsRegistryPageProps) {
  return (
    <RegistryPageShell
      registryId="assignments"
      rows={assignments}
      currentRole={currentRole}
      permissionContext={{ currentRole }}
    />
  );
}
