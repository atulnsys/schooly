import React, { useMemo } from "react";
import type { StaffDirectoryRow } from "../lib/schoolRegistry";
import RegistryPageShell from "./RegistryPageShell";
import { isActiveValue, isTeacherStaffRow } from "../lib/liveSchoolEntityBuilders";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";
import { StandardMetricGrid } from "./common/StandardPageSurface";

interface StaffRegistryPageProps {
  staffRows: StaffDirectoryRow[];
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
  activeCapabilities?: string[];
  sourceDisplayLabel?: string | null;
  sourceLastSyncedAt?: string | null;
  sourceLastCheckedAt?: string | null;
  sourceStatus?: "not_tested" | "loading" | "refreshing" | "ready" | "empty" | "filtered_empty" | "authentication_required" | "account_mismatch" | "permission_denied" | "source_unavailable" | "stale" | "error" | null;
}

function normalizeIdentity(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getStaffIdentity(row: StaffDirectoryRow): string {
  return String(row.staff_id || row.email || row.staff_name || "").trim();
}

export default function StaffRegistryPage({ staffRows, currentRole, storageContext, activeCapabilities, sourceDisplayLabel, sourceLastSyncedAt, sourceLastCheckedAt, sourceStatus }: StaffRegistryPageProps) {
  const staffKpis = useMemo(() => {
    const uniqueRows = new Map<string, StaffDirectoryRow>();
    staffRows.forEach((row) => {
      const identity = getStaffIdentity(row);
      if (!identity) return;
      const key = normalizeIdentity(identity);
      if (!uniqueRows.has(key)) {
        uniqueRows.set(key, row);
      }
    });

    const uniqueActiveRows = Array.from(uniqueRows.values()).filter((row) => isActiveValue(row.status));
    const teachingStaff = uniqueActiveRows.filter((row) => isTeacherStaffRow(row));
    const activeDepartments = new Set(
      uniqueActiveRows
        .map((row) => normalizeIdentity(row.department))
        .filter(Boolean),
    );

    return {
      totalStaff: uniqueRows.size,
      activeStaff: uniqueActiveRows.length,
      teachingStaff: teachingStaff.length,
      nonTeachingStaff: Math.max(0, uniqueActiveRows.length - teachingStaff.length),
      departments: activeDepartments.size,
    };
  }, [staffRows]);

  const canShowStaffCounts =
    sourceStatus === "ready" ||
    sourceStatus === "empty" ||
    sourceStatus === "filtered_empty";

  return (
    <RegistryPageShell
      registryId="staff"
      rows={staffRows}
      currentRole={currentRole}
      storageContext={storageContext}
      permissionContext={{ currentRole, activeCapabilities }}
      showCapabilityMetadata={false}
      showListHeader={false}
      renderAboveList={() => (
        <StandardMetricGrid
          className="lg:grid-cols-5"
          items={[
            { label: "Total staff", value: canShowStaffCounts ? staffKpis.totalStaff : null, tone: "blue" },
            { label: "Active staff", value: canShowStaffCounts ? staffKpis.activeStaff : null, tone: "emerald" },
            { label: "Teaching staff", value: canShowStaffCounts ? staffKpis.teachingStaff : null },
            { label: "Non-teaching staff", value: canShowStaffCounts ? staffKpis.nonTeachingStaff : null, tone: "amber" },
            { label: "Departments", value: canShowStaffCounts ? staffKpis.departments : null, tone: "violet" },
          ]}
        />
      )}
      sourceDisplayLabel={sourceDisplayLabel}
      sourceLastSyncedAt={sourceLastSyncedAt}
      sourceLastCheckedAt={sourceLastCheckedAt}
      sourceStatus={sourceStatus}
    />
  );
}
