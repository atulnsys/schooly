import React, { useEffect, useState } from "react";
import type { StaffDirectoryRow } from "../lib/schoolRegistry";
import RegistryPageShell from "./RegistryPageShell";

interface StaffRegistryPageProps {
  staffRows: StaffDirectoryRow[];
  currentRole: string;
}

export default function StaffRegistryPage({ staffRows, currentRole }: StaffRegistryPageProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffDirectoryRow | null>(null);

  useEffect(() => {
    if (selectedStaff && !staffRows.some((row) => row.staff_id === selectedStaff.staff_id)) {
      setSelectedStaff(null);
    }
  }, [staffRows, selectedStaff]);

  return (
    <RegistryPageShell
      registryId="staff"
      rows={staffRows}
      currentRole={currentRole}
      selectedRow={selectedStaff}
      onSelectRow={setSelectedStaff}
      permissionContext={{ currentRole }}
    />
  );
}
