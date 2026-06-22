import React from "react";
import type { StudentDetails } from "../types";
import RegistryPageShell from "./RegistryPageShell";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";

interface StudentsRegistryPageProps {
  students: StudentDetails[];
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
}

export default function StudentsRegistryPage({ students, currentRole, storageContext }: StudentsRegistryPageProps) {
  return (
    <RegistryPageShell
      registryId="students"
      rows={students}
      currentRole={currentRole}
      storageContext={storageContext}
      permissionContext={{ currentRole }}
    />
  );
}
