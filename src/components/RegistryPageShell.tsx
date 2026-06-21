import React, { useMemo } from "react";
import GenericEntityPage from "./generic/GenericEntityPage";
import type { GenericEntityDefinition, GenericEntityPermissionContext } from "../lib/genericEntityView";
import {
  getAllGenericRowIssues,
  getGenericFieldValue,
  isGenericValueEmpty,
} from "../lib/genericEntityView";
import type { SchoolRegistrySourceStatus } from "../lib/schoolRegistry";
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
  permissionContext?: GenericEntityPermissionContext;
  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
  showDisplayModeToggle?: boolean;
  showPagination?: boolean;
  showCapabilityMetadata?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  sourceDisplayLabel?: string | null;
  sourceLastSyncedAt?: string | null;
  sourceLastCheckedAt?: string | null;
  sourceStatus?: SchoolRegistrySourceStatus | null;
}

type RegistrySourceState = "Ready" | "Empty" | "Missing" | "Incomplete" | "Fallback" | "Stale" | "Unknown";

interface RegistryHeaderSummary {
  sourceState: RegistrySourceState;
  rowCountLabel: string;
  mandatoryFieldLabel: string;
  validationLabel: string;
  guidance?: string;
}

function formatRegistryTimestamp(value: string | null | undefined): string {
  if (!value) return "Not yet synced";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function renderRegistryHeader(
  entry: RegistryCatalogEntry,
  currentRole: string,
  summary: RegistryHeaderSummary,
  showCapabilityMetadata: boolean,
  sourceDisplayLabel?: string | null,
  sourceLastSyncedAt?: string | null,
  sourceLastCheckedAt?: string | null,
  sourceStatus?: SchoolRegistrySourceStatus | null,
) {
  const Icon = entry.iconComponent;
  const sourceStateClass = summary.sourceState === "Ready"
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : summary.sourceState === "Empty"
      ? "bg-slate-50 text-slate-700 border-slate-200"
      : summary.sourceState === "Missing"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : summary.sourceState === "Incomplete"
          ? "bg-orange-50 text-orange-700 border-orange-100"
          : summary.sourceState === "Fallback"
            ? "bg-violet-50 text-violet-700 border-violet-100"
            : summary.sourceState === "Stale"
              ? "bg-amber-50 text-amber-700 border-amber-100"
            : summary.sourceState === "Unknown"
              ? "bg-slate-50 text-slate-600 border-slate-200"
              : "bg-slate-50 text-slate-600 border-slate-200";
  const mandatoryStateClass = summary.mandatoryFieldLabel === "Mandatory field metadata unavailable"
    ? "bg-slate-50 text-slate-600 border-slate-200"
    : summary.mandatoryFieldLabel.startsWith("Mandatory fields defined")
      || summary.mandatoryFieldLabel.startsWith("Mandatory values missing")
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100";
  const validationStateClass = summary.validationLabel === "Validation metadata not available from this source yet"
    ? "bg-slate-50 text-slate-600 border-slate-200"
    : summary.validationLabel === "Validation metadata available"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5 min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
            {entry.navLabel}
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 min-w-0">
            <Icon size={18} className="text-blue-600 shrink-0" />
            <span className="break-words">{entry.label}</span>
          </h2>
          <p className="text-xs text-slate-600 max-w-3xl">
            {entry.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-sans font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            {summary.rowCountLabel}
          </span>
          <span className={`text-[10px] font-sans font-black px-2.5 py-1 rounded-lg border ${sourceStateClass}`}>
            {summary.sourceState}
          </span>
          <span className="text-[10px] font-sans font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
            Role: {currentRole}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-2 min-w-0">
          <p className="break-words">
            Data source: <span className="font-mono font-bold text-slate-700">{entry.sourceLabel}</span>.
            {entry.status === "deferred" ? ` ${entry.statusReason || entry.emptyStateDescription}` : " If this feed is empty, the registry will show the generic empty state instead of synthetic rows."}
          </p>
          {sourceDisplayLabel !== undefined && (
            <p className="break-words">
              Live source: <span className="font-mono font-bold text-slate-700">{sourceDisplayLabel}</span>.
            </p>
          )}
          {sourceStatus && (
            <p className="break-words">
              Current state: <span className="font-mono font-bold text-slate-700">{sourceStatus === "stale" ? "stale" : sourceStatus.replace(/_/g, " ")}</span>.
            </p>
          )}
          {(sourceDisplayLabel !== undefined || sourceLastSyncedAt !== undefined || sourceLastCheckedAt !== undefined) && (
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-black px-2 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-100">
                Last successful sync: {formatRegistryTimestamp(sourceLastSyncedAt)}
              </span>
              {sourceLastCheckedAt && (
                <span className="text-[10px] font-black px-2 py-1 rounded-lg border bg-slate-50 text-slate-600 border-slate-200">
                  Last checked: {formatRegistryTimestamp(sourceLastCheckedAt)}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${mandatoryStateClass}`}>
              {summary.mandatoryFieldLabel}
            </span>
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${validationStateClass}`}>
              {summary.validationLabel}
            </span>
          </div>
          {summary.guidance && (
            <p className="text-[10px] text-slate-500 break-words">
              {summary.guidance}
            </p>
          )}
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
      {showCapabilityMetadata && entry.capabilityMetadata && (
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

function getRegistrySourceState(entry: RegistryCatalogEntry, rowCount: number, isLoading: boolean, errorMessage: string | null, sourceStatus?: SchoolRegistrySourceStatus | null): RegistrySourceState {
  if (sourceStatus === "stale") return "Stale";
  if (sourceStatus === "refreshing" || sourceStatus === "loading") return rowCount > 0 ? "Stale" : "Unknown";
  if (sourceStatus === "authentication_required" || sourceStatus === "account_mismatch" || sourceStatus === "permission_denied" || sourceStatus === "source_unavailable") {
    return "Missing";
  }
  if (sourceStatus === "error" && rowCount > 0) return "Fallback";
  if (isLoading) return "Unknown";
  if (errorMessage) return entry.status === "deferred" ? "Missing" : "Unknown";
  if (entry.status === "deferred") return "Missing";
  if (entry.status === "active") return rowCount > 0 ? "Ready" : "Empty";
  return "Unknown";
}

function renderRegistryDetailSummary<T extends object>(row: T, definition: GenericEntityDefinition<T>) {
  const requiredFields = definition.fields.filter((field) => field.required);

  if (requiredFields.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-[11px] text-slate-600 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mandatory Fields</span>
          <span className="text-[10px] font-black px-2 py-1 rounded-lg border bg-slate-50 text-slate-600 border-slate-200">
            Mandatory field metadata unavailable
          </span>
        </div>
        <p>Mark core fields as required in the entity definition to surface mandatory-field guidance here.</p>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Validation</span>
          <span className="text-[10px] font-black px-2 py-1 rounded-lg border bg-slate-50 text-slate-600 border-slate-200">
            Validation metadata not available from this source yet
          </span>
        </div>
      </div>
    );
  }

  const presentFields = requiredFields.filter((field) => !isGenericValueEmpty(getGenericFieldValue(row, field)));
  const missingFields = requiredFields.filter((field) => isGenericValueEmpty(getGenericFieldValue(row, field)));
  const validationIssues = getAllGenericRowIssues(row, definition);
  const validationRuleCount = requiredFields.length + (definition.getRowIssues ? 1 : 0);
  const mandatoryLabel = missingFields.length === 0 ? "Mandatory values available in live rows" : "Mandatory values missing in available rows";
  const validationLabel = validationIssues.length === 0
    ? "No validation issues detected from available metadata"
    : "Validation rules need review";

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-[11px] text-slate-600 space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mandatory Fields</span>
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
            missingFields.length === 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-100"
          }`}>
            {mandatoryLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
            Required {requiredFields.length}
          </span>
          <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-emerald-100 text-emerald-700">
            Present {presentFields.length}
          </span>
          <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${
            missingFields.length > 0
              ? "bg-amber-50 border-amber-100 text-amber-700"
              : "bg-slate-50 border-slate-200 text-slate-500"
          }`}>
            Missing {missingFields.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presentFields.map((field) => (
            <span key={String(field.key)} className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {field.label}
            </span>
          ))}
          {missingFields.map((field) => (
            <span key={String(field.key)} className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              {field.label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Validation</span>
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
            validationIssues.length === 0
              ? "bg-blue-50 text-blue-700 border-blue-100"
              : "bg-amber-50 text-amber-700 border-amber-100"
          }`}>
            {validationLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
            Rules {validationRuleCount}
          </span>
          <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
            Issues {validationIssues.length}
          </span>
        </div>
        {validationIssues.length > 0 ? (
          <div className="space-y-1">
            {validationIssues.slice(0, 3).map((issue) => (
              <div key={issue.id} className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2 text-[10.5px] font-semibold text-amber-800">
                {issue.message}
              </div>
            ))}
          </div>
        ) : (
          <p>No validation issues detected from available metadata.</p>
        )}
      </div>
    </div>
  );
}

export default function RegistryPageShell<T extends object>({
  registryId,
  rows,
  currentRole,
  permissionContext,
  className = "",
  showSearch,
  showFilters,
  showSort,
  showDisplayModeToggle,
  showPagination,
  showCapabilityMetadata = true,
  isLoading = false,
  errorMessage = null,
  sourceDisplayLabel,
  sourceLastSyncedAt,
  sourceLastCheckedAt,
  sourceStatus,
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

  const requiredFieldCount = definition.fields.filter((field) => field.required).length;
  const sourceState = getRegistrySourceState(entry, rows.length, isLoading, errorMessage, sourceStatus);
  const summary: RegistryHeaderSummary = {
    sourceState,
    rowCountLabel:
      sourceState === "Ready"
        ? `${rows.length} ${rows.length === 1 ? "record" : "records"}`
        : sourceState === "Empty"
          ? "No rows"
          : sourceState === "Missing"
            ? "Source unavailable"
            : sourceState === "Fallback"
              ? "Fallback data"
            : sourceState === "Incomplete"
              ? "Setup incomplete"
              : sourceState === "Stale"
                ? "Stale data retained"
              : "Metadata only",
    mandatoryFieldLabel:
      requiredFieldCount > 0
        ? rows.length === 0
          ? "Mandatory fields defined, but no rows are available to validate."
          : "Mandatory metadata available"
        : "Mandatory field metadata unavailable",
    validationLabel:
      requiredFieldCount > 0 || Boolean(definition.getRowIssues)
        ? "Validation metadata available"
        : "Validation metadata not available from this source yet",
      guidance:
        sourceState === "Empty"
          ? `${entry.label} exists, but no rows are available yet.`
          : sourceState === "Missing"
            ? "Source metadata is available, but live rows are not loaded."
            : sourceState === "Fallback"
              ? "Fallback data is in use. Reconnect the live source when ready."
              : sourceState === "Stale"
                ? "Previously loaded rows are retained, but the latest refresh needs attention."
            : sourceState === "Incomplete"
            ? "Setup incomplete. Required headers are still missing in this route."
            : undefined,
  };

  const viewDefinition = useMemo(
    () => ({
      ...definition,
      ...(sourceState === "Empty"
        ? {
            emptyTitle: "No rows available from this registry yet.",
            emptyDescription: "This registry is mapped, but no live rows are available.",
          }
        : sourceState === "Missing"
          ? {
              emptyTitle: "Source unavailable",
              emptyDescription: "Source metadata is available, but live rows are not loaded.",
            }
          : sourceState === "Incomplete"
            ? {
                emptyTitle: "Setup incomplete",
                emptyDescription: "Required headers are defined, but live rows are not available in this route.",
              }
            : sourceState === "Fallback"
              ? {
                  emptyTitle: "Fallback data in use",
                  emptyDescription: "Reconnect the live source when ready.",
                }
              : sourceState === "Stale"
                ? {
                    emptyTitle: "Stale data retained",
                    emptyDescription: "Previously loaded rows are still visible while the latest refresh needs attention.",
                  }
              : sourceState === "Unknown"
                ? {
                    emptyTitle: "Metadata only",
                    emptyDescription: "This route exposes registry metadata until live rows are available.",
                  }
                : {}),
    }),
    [definition, sourceState],
  );

  const controls = {
    showSearch: showSearch ?? entry.controlDefaults.showSearch,
    showFilters: showFilters ?? entry.controlDefaults.showFilters,
    showSort: showSort ?? entry.controlDefaults.showSort,
    showDisplayModeToggle: showDisplayModeToggle ?? entry.controlDefaults.showDisplayModeToggle,
    showPagination: showPagination ?? entry.controlDefaults.showPagination,
  };

  return (
    <div className="space-y-6 animate-fade-in outline-none" id={`${registryId}-registry-page`} data-testid={`${registryId}-registry-page`} tabIndex={-1} aria-busy={isLoading}>
      {renderRegistryHeader(entry, currentRole, summary, showCapabilityMetadata, sourceDisplayLabel, sourceLastSyncedAt, sourceLastCheckedAt, sourceStatus)}

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-sm text-slate-600" role="status" aria-live="polite" aria-atomic="true">
          Loading {entry.label.toLowerCase()}...
        </div>
      ) : (
        <GenericEntityPage
          definition={viewDefinition}
          rows={rows}
          stateNamespace={registryId}
          permissionContext={permissionContext ?? { currentRole }}
          showSearch={controls.showSearch}
          showFilters={controls.showFilters}
          showSort={controls.showSort}
          showDisplayModeToggle={controls.showDisplayModeToggle}
          showPagination={controls.showPagination}
          renderDetailBeforeSections={(row) => renderRegistryDetailSummary(row, definition)}
          className={className}
        />
      )}
    </div>
  );
}
