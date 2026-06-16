import React, { useEffect, useState } from "react";
import { ClassroomAssignment } from "../types";
import RegistryPageShell from "./RegistryPageShell";

interface ClassroomAssignmentsRegistryPageProps {
  assignments: ClassroomAssignment[];
  currentRole: string;
}

export default function ClassroomAssignmentsRegistryPage({ assignments, currentRole }: ClassroomAssignmentsRegistryPageProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<ClassroomAssignment | null>(null);
  useEffect(() => {
    if (selectedAssignment && !assignments.some((assignment) => assignment.id === selectedAssignment.id)) {
      setSelectedAssignment(null);
    }
  }, [assignments, selectedAssignment]);

  return (
    <RegistryPageShell
      registryId="assignments"
      rows={assignments}
      currentRole={currentRole}
      selectedRow={selectedAssignment}
      onSelectRow={setSelectedAssignment}
      permissionContext={{ currentRole }}
    />
  );
}
