import React, { useMemo } from "react";
import type { StaffDirectoryRow } from "../lib/schoolRegistry";
import RegistryPageShell from "./RegistryPageShell";
import { isActiveValue, isTeacherStaffRow } from "../lib/liveSchoolEntityBuilders";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";

interface StaffRegistryPageProps {
  staffRows: StaffDirectoryRow[];
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
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

function StaffKpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">{label}</div>
      <div className="mt-1 text-xl font-black tracking-tight text-slate-950">{value}</div>
    </div>
  );
}

export default function StaffRegistryPage({ staffRows, currentRole, storageContext, sourceDisplayLabel, sourceLastSyncedAt, sourceLastCheckedAt, sourceStatus }: StaffRegistryPageProps) {
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StaffKpiCard label="Total staff" value={staffKpis.totalStaff} />
        <StaffKpiCard label="Active staff" value={staffKpis.activeStaff} />
        <StaffKpiCard label="Teaching staff" value={staffKpis.teachingStaff} />
        <StaffKpiCard label="Non-teaching staff" value={staffKpis.nonTeachingStaff} />
        <StaffKpiCard label="Departments" value={staffKpis.departments} />
      </div>

      <RegistryPageShell
      registryId="staff"
      rows={staffRows}
      currentRole={currentRole}
      storageContext={storageContext}
      permissionContext={{ currentRole }}
        showCapabilityMetadata={false}
        sourceDisplayLabel={sourceDisplayLabel}
        sourceLastSyncedAt={sourceLastSyncedAt}
        sourceLastCheckedAt={sourceLastCheckedAt}
        sourceStatus={sourceStatus}
      />
    </div>
  );
}
