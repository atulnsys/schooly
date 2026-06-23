import React, { useMemo } from "react";
import GenericEntityPage from "./generic/GenericEntityPage";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";
import { formatSchoolyDate } from "../lib/schoolyFormatting";
import {
  createRegistryExplorerEntityDefinition,
  getRegistryExplorerRows,
  getRegistryExplorerSummary,
} from "../lib/registryExplorerEntityDefinition";

type LiveRegisterCardSourceState = "Ready" | "Empty" | "Missing" | "Incomplete" | "Fallback" | "Stale" | "Unknown";

interface RegistryExplorerPageProps {
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
  onOpenPageRoute: (registryId: string) => void;
  onOpenDataRoute: (registryId: string) => void;
  onNavigateTab?: (tab: string) => void;
  liveRegisterCards?: Array<{
    title: string;
    count: number;
    sourceState?: LiveRegisterCardSourceState;
    detail: string;
    source: string;
    lastSyncedAt?: string | null;
    drillTarget:
      | { kind: "page"; registryId: string }
      | { kind: "data"; registryId: string }
      | { kind: "tab"; tab: string };
  }>;
}

export default function RegistryExplorerPage({
  currentRole,
  storageContext,
  onOpenPageRoute,
  onOpenDataRoute,
  onNavigateTab,
  liveRegisterCards,
}: RegistryExplorerPageProps) {
  const rows = useMemo(() => getRegistryExplorerRows(), []);
  const summary = useMemo(() => getRegistryExplorerSummary(rows), [rows]);

  const openLiveRegisterCard = (target: NonNullable<RegistryExplorerPageProps["liveRegisterCards"]>[number]["drillTarget"]) => {
    if (target.kind === "page") {
      onOpenPageRoute(target.registryId);
      return;
    }
    if (target.kind === "data") {
      onOpenDataRoute(target.registryId);
      return;
    }
    onNavigateTab?.(target.tab);
  };

  const definition = useMemo(
    () => createRegistryExplorerEntityDefinition(
      (row) => onOpenPageRoute(row.registryId),
      (row) => onOpenDataRoute(row.registryId),
    ),
    [onOpenDataRoute, onOpenPageRoute],
  );

  const sourceStateBadgeClass: Record<LiveRegisterCardSourceState, string> = {
    Ready: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Empty: "bg-slate-50 text-slate-700 border-slate-200",
    Missing: "bg-amber-50 text-amber-700 border-amber-100",
    Incomplete: "bg-orange-50 text-orange-700 border-orange-100",
    Fallback: "bg-violet-50 text-violet-700 border-violet-100",
    Stale: "bg-amber-50 text-amber-700 border-amber-100",
    Unknown: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const sourceStateLabel: Record<LiveRegisterCardSourceState, string> = {
    Ready: "Ready",
    Empty: "No rows",
    Missing: "Source unavailable",
    Incomplete: "Setup incomplete",
    Fallback: "Fallback data",
    Stale: "Stale data",
    Unknown: "Metadata only",
  };

  function formatTimestamp(value: string | null | undefined): string {
    return formatSchoolyDate(value, { includeTime: true, fallback: "Not yet synced" });
  }

  const countLabel = (count: number, state?: LiveRegisterCardSourceState) => {
    switch (state) {
      case "Empty":
        return "No rows available";
      case "Missing":
        return "Source unavailable";
      case "Incomplete":
        return "Setup incomplete";
      case "Fallback":
        return "Fallback data";
      case "Stale":
        return "Stale data";
      case "Unknown":
        return "Metadata only";
      default:
        return `${count.toLocaleString()} rows`;
    }
  };

  return (
    <div id="registries-registry-page" data-testid="registries-registry-page" tabIndex={-1} className="outline-none">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
            Registry Explorer
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">Registry Explorer</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              {summary.totalEntries} entries
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-3xl">
            Review available school registers and data sources.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">Canonical {summary.canonicalPageEntries}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">Derived {summary.derivedViewEntries}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">Relationships {summary.relationshipEntries}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">Schema tabs {summary.registryTabEntries}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">Embedded {summary.embeddedSurfaceEntries}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">Unavailable {summary.sourceUnavailableEntries}</span>
        </div>
      </div>

      {liveRegisterCards && liveRegisterCards.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
                School registers
              </div>
              <h3 className="text-base font-extrabold text-slate-900">School registers</h3>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              {liveRegisterCards.length} registers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {liveRegisterCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => openLiveRegisterCard(card.drillTarget)}
                  className="w-full text-left flex items-center justify-between gap-2 cursor-pointer"
                  title={
                    card.drillTarget.kind === "page"
                      ? `Open ${card.title} page`
                      : card.drillTarget.kind === "data"
                        ? `Open ${card.title} registry detail`
                        : `Open ${card.title} dashboard tab`
                  }
                >
                  <h4 className="text-sm font-extrabold text-slate-900">{card.title}</h4>
                  <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${sourceStateBadgeClass[card.sourceState || "Unknown"]}`}>
                    {sourceStateLabel[card.sourceState || "Unknown"]}
                  </span>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-white text-slate-600 border border-slate-200">
                    {countLabel(card.count, card.sourceState)}
                  </span>
                  {card.lastSyncedAt !== undefined && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-white text-slate-600 border border-slate-200">
                      Last synced {formatTimestamp(card.lastSyncedAt)}
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-600">{card.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <GenericEntityPage
        definition={definition}
        rows={rows}
        stateNamespace="registry-explorer"
        storageContext={storageContext}
        permissionContext={{ currentRole }}
        showSearch={true}
        showFilters={true}
        showSort={true}
        showDisplayModeToggle={true}
        showPagination={true}
        detailContext={{
          displayMode: "read-only",
          stateLabel: "Navigation catalog",
          sourceLabel: "Registry Explorer",
          readOnlyReason: "Explorer entries are read-only navigation records that open the actual registry or route.",
        }}
        backLabel="Back to Registry Explorer"
      />
    </div>
  );
}
