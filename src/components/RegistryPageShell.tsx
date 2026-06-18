import React, { useMemo } from "react";
import GenericEntityPage from "./generic/GenericEntityPage";
import type { GenericEntityDefinition, GenericEntityPermissionContext } from "../lib/genericEntityView";
import {
  getRegistryCatalogEntry,
  type RegistryCapabilityMetadata,
  type RegistryCatalogEntry,
} from "../lib/registryCatalog";
import { Info } from "lucide-react";

interface RegistryPageShellProps<T extends object> {
  registryId: string;
  rows: T[];
  currentRole: string;
  selectedRow?: T | null;
  onSelectRow?: (row: T | null) => void;
  permissionContext?: GenericEntityPermissionContext;
  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
  showDisplayModeToggle?: boolean;
  showPagination?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
}

function renderRegistryHeader(entry: RegistryCatalogEntry, rowCount: number, currentRole: string) {
  const Icon = entry.iconComponent;
  const sourceState = entry.status === "active"
    ? (rowCount > 0 ? "Ready" : "Empty")
    : entry.status === "deferred"
      ? "Source unavailable"
      : "Unknown";
  const sourceStateClass = sourceState === "Ready"
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : sourceState === "Empty"
      ? "bg-slate-50 text-slate-700 border-slate-200"
      : sourceState === "Source unavailable"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
            {entry.navLabel}
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Icon size={18} className="text-blue-600" />
            {entry.label}
          </h2>
          <p className="text-xs text-slate-600 max-w-3xl">
            {entry.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-sans font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            {rowCount} {rowCount === 1 ? "record" : "records"}
          </span>
          <span className={`text-[10px] font-sans font-black px-2.5 py-1 rounded-lg border ${sourceStateClass}`}>
            {sourceState}
          </span>
          <span className="text-[10px] font-sans font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
            Role: {currentRole}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            Data source: <span className="font-mono font-bold text-slate-700">{entry.sourceLabel}</span>.
            {entry.status === "deferred" ? ` ${entry.statusReason || entry.emptyStateDescription}` : " If this feed is empty, the registry will show the generic empty state instead of synthetic rows."}
          </p>
          {entry.capabilityMetadata && (
            <p className="text-[10px] text-slate-500">
              {entry.capabilityMetadata.derivedFromRegistryId
                ? `Derived from ${entry.capabilityMetadata.derivedFromRegistryId}. `
                : `Canonical source: ${entry.capabilityMetadata.displayName}. `}
              {entry.capabilityMetadata.discoveryNotes}
            </p>
          )}
        </div>
      </div>
      {entry.capabilityMetadata && (
        <CapabilityMetadataStrip metadata={entry.capabilityMetadata} />
      )}
    </div>
  );
}

function MetadataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400">{label}</div>
      <div className="mt-0.5 text-[11px] font-semibold text-slate-700 break-words">{value}</div>
    </div>
  );
}

function CapabilityMetadataStrip({ metadata }: { metadata: RegistryCapabilityMetadata }) {
  const operations = metadata.supportedOperations.join(", ");
  const queryKeys = metadata.queryKeys.join(", ");

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
          Capability Metadata
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-blue-100 text-blue-700">
          {metadata.status}
        </span>
        {metadata.derivedFromRegistryId && (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-blue-100 text-blue-700">
            Derived from {metadata.derivedFromRegistryId}
          </span>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        <MetadataPill label="Capability ID" value={metadata.capabilityId} />
        <MetadataPill label="Registry ID" value={metadata.registryId} />
        <MetadataPill label="Canonical Registry" value={metadata.canonicalRegistryName} />
        <MetadataPill label="Display Name" value={metadata.displayName} />
        <MetadataPill label="Resource URI" value={metadata.resourceUri} />
        <MetadataPill label="Object Category" value={metadata.objectCategory} />
        <MetadataPill label="Source Role" value={metadata.sourceRole} />
        <MetadataPill label="Scope" value={metadata.scope} />
        <MetadataPill label="Write Policy" value={metadata.writePolicy} />
        <MetadataPill label="Supported Operations" value={operations} />
        <MetadataPill label="Query Keys" value={queryKeys} />
        {metadata.sourceSpreadsheetId && (
          <MetadataPill label="Source Spreadsheet" value={metadata.sourceSpreadsheetId} />
        )}
        {metadata.tabName && (
          <MetadataPill label="Tab Name" value={metadata.tabName} />
        )}
        <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
          <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400">Discovery Notes</div>
          <div className="mt-0.5 text-[11px] text-slate-700 leading-relaxed">{metadata.discoveryNotes}</div>
        </div>
        <MetadataPill label="Duplicate Search Policy" value={metadata.duplicateSearchPolicy} />
      </div>
    </div>
  );
}

export default function RegistryPageShell<T extends object>({
  registryId,
  rows,
  currentRole,
  selectedRow,
  onSelectRow,
  permissionContext,
  className = "",
  showSearch,
  showFilters,
  showSort,
  showDisplayModeToggle,
  showPagination,
  isLoading = false,
  errorMessage = null,
}: RegistryPageShellProps<T>) {
  const entry = useMemo(() => getRegistryCatalogEntry(registryId), [registryId]);
  const definition = useMemo(
    () => entry?.createEntityDefinition?.() as GenericEntityDefinition<T> | undefined,
    [entry],
  );

  if (!entry || !definition) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Registry "{registryId}" is not configured for the generic registry shell.
      </div>
    );
  }

  const controls = {
    showSearch: showSearch ?? entry.controlDefaults.showSearch,
    showFilters: showFilters ?? entry.controlDefaults.showFilters,
    showSort: showSort ?? entry.controlDefaults.showSort,
    showDisplayModeToggle: showDisplayModeToggle ?? entry.controlDefaults.showDisplayModeToggle,
    showPagination: showPagination ?? entry.controlDefaults.showPagination,
  };

  return (
    <div className="space-y-6 animate-fade-in" id={`${registryId}-registry-page`} data-testid={`${registryId}-registry-page`}>
      {renderRegistryHeader(entry, rows.length, currentRole)}

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-sm text-slate-600">
          Loading {entry.label.toLowerCase()}...
        </div>
      ) : (
        <GenericEntityPage
          definition={definition}
          rows={rows}
          selectedRow={selectedRow}
          onSelectRow={onSelectRow ?? undefined}
          permissionContext={permissionContext ?? { currentRole }}
          showSearch={controls.showSearch}
          showFilters={controls.showFilters}
          showSort={controls.showSort}
          showDisplayModeToggle={controls.showDisplayModeToggle}
          showPagination={controls.showPagination}
          className={className}
        />
      )}
    </div>
  );
}
