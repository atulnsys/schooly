import React, { useMemo, useState } from "react";
import GenericEntityPage from "./generic/GenericEntityPage";
import {
  createRegistryExplorerEntityDefinition,
  getRegistryExplorerRows,
  getRegistryExplorerSummary,
  type RegistryExplorerRow,
} from "../lib/registryExplorerEntityDefinition";

interface RegistryExplorerPageProps {
  currentRole: string;
  onOpenPageRoute: (registryId: string) => void;
  onOpenDataRoute: (registryId: string) => void;
}

export default function RegistryExplorerPage({
  currentRole,
  onOpenPageRoute,
  onOpenDataRoute,
}: RegistryExplorerPageProps) {
  const rows = useMemo(() => getRegistryExplorerRows(), []);
  const summary = useMemo(() => getRegistryExplorerSummary(rows), [rows]);
  const [selectedRow, setSelectedRow] = useState<RegistryExplorerRow | null>(null);

  const definition = useMemo(
    () => createRegistryExplorerEntityDefinition(
      (row) => onOpenPageRoute(row.registryId),
      (row) => onOpenDataRoute(row.registryId),
    ),
    [onOpenDataRoute, onOpenPageRoute],
  );

  return (
    <div id="registries-registry-page" data-testid="registries-registry-page">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
              Registry Explorer
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Showing {summary.totalEntries} explorer entries
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl">
              This view is broader than the canonical capability catalog because it also includes derived views, relationship registries, schema tabs, and embedded surfaces that still need a metadata route for inspection.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              Canonical {summary.canonicalPageEntries}
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              Derived {summary.derivedViewEntries}
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              Relationship {summary.relationshipEntries}
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
              Schema tabs {summary.registryTabEntries}
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
              Embedded {summary.embeddedSurfaceEntries}
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
              Source-unavailable {summary.sourceUnavailableEntries}
            </span>
          </div>
        </div>
      </div>

      <GenericEntityPage
        definition={definition}
        rows={rows}
        selectedRow={selectedRow}
        onSelectRow={(row) => {
          setSelectedRow(row);
        }}
        permissionContext={{ currentRole }}
        showSearch={true}
        showFilters={true}
        showSort={true}
        showDisplayModeToggle={true}
        showPagination={true}
      />
    </div>
  );
}
