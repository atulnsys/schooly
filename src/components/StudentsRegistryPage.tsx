import React from "react";
import type { StudentDetails } from "../types";
import RegistryPageShell from "./RegistryPageShell";

interface StudentsRegistryPageProps {
  students: StudentDetails[];
  currentRole: string;
}

export default function StudentsRegistryPage({ students, currentRole }: StudentsRegistryPageProps) {
  return (
    <RegistryPageShell
      registryId="students"
      rows={students}
      currentRole={currentRole}
      permissionContext={{ currentRole }}
    />
  );
}
