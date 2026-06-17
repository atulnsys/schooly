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
  onNavigateTab?: (tab: string) => void;
  liveRegisterCards?: Array<{
    title: string;
    count: number;
    detail: string;
    source: string;
    drillTab: string;
  }>;
}

export default function RegistryExplorerPage({
  currentRole,
  onOpenPageRoute,
  onOpenDataRoute,
  onNavigateTab,
  liveRegisterCards,
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

      {liveRegisterCards && liveRegisterCards.length > 0 && (
        <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
                Live school registers
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Registry KPI cards moved here</h3>
              <p className="text-xs text-slate-600 max-w-3xl">
                Registry Explorer is now the main system and data entry point. The live register summaries stay visible here instead of taking up a separate sidebar section.
              </p>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white text-blue-700 border border-blue-100">
              {liveRegisterCards.length} live summaries
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {liveRegisterCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.(card.drillTab)}
                  className="w-full text-left flex items-center justify-between gap-2 cursor-pointer"
                >
                  <h4 className="text-sm font-extrabold text-slate-900">{card.title}</h4>
                  <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {card.count.toLocaleString()} rows
                  </span>
                </button>
                <div className="text-xs font-semibold text-slate-600">{card.detail}</div>
                <div className="text-[10px] font-mono font-bold text-blue-700">Source: {card.source}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
