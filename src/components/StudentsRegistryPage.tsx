import React from "react";
import type { StudentDetails } from "../types";
import RegistryPageShell from "./RegistryPageShell";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";

interface StudentsRegistryPageProps {
  students: StudentDetails[];
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
  activeCapabilities?: string[];
}

export default function StudentsRegistryPage({ students, currentRole, storageContext, activeCapabilities }: StudentsRegistryPageProps) {
  return (
    <RegistryPageShell
      registryId="students"
      rows={students}
      currentRole={currentRole}
      storageContext={storageContext}
      permissionContext={{ currentRole, activeCapabilities }}
      showListHeader={false}
    />
  );
}
