import React, { useMemo, useState } from "react";
import { StandardPageHeader } from "./common/StandardPageSurface";
import GenericEntityPage from "./generic/GenericEntityPage";
import type { GenericEntityDefinition, GenericEntityPermissionContext } from "../lib/genericEntityView";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";
import {
  getAllGenericRowIssues,
  getGenericFieldValue,
  hasGenericPermission,
  isGenericValueEmpty,
} from "../lib/genericEntityView";
import { formatSchoolyDate } from "../lib/schoolyFormatting";
import type { SchoolRegistrySourceStatus } from "../lib/schoolRegistry";
import {
  getRegistryCatalogEntry,
  type RegistryCapabilityMetadata,
  type RegistryCatalogEntry,
} from "../lib/registryCatalog";
import { Info } from "lucide-react";
import OverlaySurface from "./common/OverlaySurface";

interface RegistryPageShellProps<T extends object> {
  registryId: string;
  rows: T[];
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
  permissionContext?: GenericEntityPermissionContext;
  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
  showDisplayModeToggle?: boolean;
  showPagination?: boolean;
  showCapabilityMetadata?: boolean;
  showListHeader?: boolean;
  renderAboveList?: () => React.ReactNode;
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
  return formatSchoolyDate(value, { includeTime: true, fallback: "Not yet synced" });
}

function formatSchoolRegistrySourceStatus(status?: SchoolRegistrySourceStatus | null): string {
  if (!status) return "Unknown";
  if (status === "ready") return "Ready";
  if (status === "empty") return "Empty";
  if (status === "filtered_empty") return "Filtered empty";
  if (status === "loading") return "Loading";
  if (status === "refreshing") return "Refreshing";
  if (status === "authentication_required") return "Authentication required";
  if (status === "account_mismatch") return "Account mismatch";
  if (status === "permission_denied") return "Permission denied";
  if (status === "source_unavailable") return "Source unavailable";
  if (status === "stale") return "Stale";
  if (status === "error") return "Error";
  return status;
}

function getRegistrySurfaceMessage(entryLabel: string, sourceState: RegistrySourceState): string | null {
  if (sourceState === "Ready") return null;
  if (sourceState === "Empty") return `${entryLabel} are not available yet.`;
  if (sourceState === "Missing") return `${entryLabel} are unavailable right now.`;
  if (sourceState === "Incomplete") return `${entryLabel} setup is incomplete.`;
  if (sourceState === "Fallback") return `Showing previously loaded ${entryLabel.toLowerCase()} while the source is refreshed.`;
  if (sourceState === "Stale") return `Showing previously loaded ${entryLabel.toLowerCase()} while the latest refresh is checked.`;
  return `Status for ${entryLabel.toLowerCase()} is not available yet.`;
}

function renderRegistryHeader(
  entry: RegistryCatalogEntry,
  summary: RegistryHeaderSummary,
  canOpenInfoPanel: boolean,
  onOpenInfoPanel?: () => void,
) {
  return (
    <div className="space-y-3">
      <StandardPageHeader
        title={entry.label}
        description={entry.description}
        actions={canOpenInfoPanel && onOpenInfoPanel ? (
          <button
            type="button"
            onClick={onOpenInfoPanel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[10.5px] font-black uppercase tracking-wider text-blue-700 hover:bg-blue-50"
            aria-label={`Open ${entry.label} information`}
            aria-haspopup="dialog"
          >
            <Info size={12} />
            Info
          </button>
        ) : undefined}
      />

      {summary.sourceState !== "Ready" && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold">{getRegistrySurfaceMessage(entry.label, summary.sourceState)}</span>
        </div>
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
          Capability metadata
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
          <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400">Discovery notes</div>
          <div className="mt-0.5 text-[11px] text-slate-700 leading-relaxed">{metadata.discoveryNotes}</div>
        </div>
        <MetadataPill label="Duplicate search policy" value={metadata.duplicateSearchPolicy} />
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
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mandatory fields</span>
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
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mandatory fields</span>
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
  storageContext,
  permissionContext,
  className = "",
  showSearch,
  showFilters,
  showSort,
  showDisplayModeToggle,
  showPagination,
  showCapabilityMetadata = true,
  showListHeader = true,
  renderAboveList,
  isLoading = false,
  errorMessage = null,
  sourceDisplayLabel,
  sourceLastSyncedAt,
  sourceLastCheckedAt,
  sourceStatus,
}: RegistryPageShellProps<T>) {
  const entry = useMemo(() => getRegistryCatalogEntry(registryId), [registryId]);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
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
  const effectivePermissionContext = permissionContext ?? { currentRole };
  const canOpenInfoPanel = hasGenericPermission(
    { roles: entry.allowedRoles, capabilities: entry.allowedCapabilities },
    effectivePermissionContext,
  );
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

  const detailContext = {
    displayMode:
      sourceState === "Missing" || sourceState === "Incomplete"
        ? "unavailable"
        : sourceState === "Fallback" || sourceState === "Stale"
          ? "restricted"
          : "read-only",
    stateLabel: summary.sourceState,
    sourceLabel: sourceDisplayLabel ?? entry.sourceLabel,
    sourceStatusLabel: sourceStatus ? formatSchoolRegistrySourceStatus(sourceStatus) : summary.sourceState,
    sourceLastSyncedAt,
    sourceLastCheckedAt,
    readOnlyReason:
      getRegistrySurfaceMessage(entry.label, sourceState) ||
      `${entry.label} rows are read-only snapshots in this view.`,
  } satisfies {
    displayMode?: "read-only" | "editable" | "restricted" | "unavailable";
    stateLabel?: string | null;
    sourceLabel?: string | null;
    sourceStatusLabel?: string | null;
    sourceLastSyncedAt?: string | null;
    sourceLastCheckedAt?: string | null;
    readOnlyReason?: string | null;
  };

  return (
    <div className="space-y-6 animate-fade-in outline-none" id={`${registryId}-registry-page`} data-testid={`${registryId}-registry-page`} tabIndex={-1} aria-busy={isLoading}>
      {renderRegistryHeader(
        entry,
        summary,
        canOpenInfoPanel,
        canOpenInfoPanel ? () => setInfoPanelOpen(true) : undefined,
      )}

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
        <>
          {renderAboveList?.()}
          <GenericEntityPage
            definition={viewDefinition}
            rows={rows}
            stateNamespace={registryId}
            storageContext={storageContext}
            permissionContext={effectivePermissionContext}
            showSearch={controls.showSearch}
            showFilters={controls.showFilters}
            showSort={controls.showSort}
            showDisplayModeToggle={controls.showDisplayModeToggle}
            showPagination={controls.showPagination}
            showListHeader={showListHeader}
            renderDetailBeforeSections={(row) => renderRegistryDetailSummary(row, definition)}
            detailContext={detailContext}
            className={className}
          />
        </>
      )}

      <OverlaySurface
        open={infoPanelOpen}
        onClose={() => setInfoPanelOpen(false)}
        title={`${entry.label} information`}
        description="Registry status, validation, and capability metadata."
        maxWidthClassName="max-w-4xl"
        bodyClassName="px-5 py-5 space-y-4"
        body={(
          <>
            <InfoSection
              title="Source and connection"
              items={[
                { label: "Source label", value: sourceDisplayLabel ?? entry.sourceLabel },
                { label: "Connection status", value: formatSchoolRegistrySourceStatus(sourceStatus) },
                { label: "Source availability", value: summary.sourceState },
                { label: "Source type", value: entry.navLabel },
                { label: "Configured scope", value: entry.capabilityMetadata?.scope },
                { label: "Last successful sync", value: sourceLastSyncedAt ? formatRegistryTimestamp(sourceLastSyncedAt) : null },
                { label: "Last checked", value: sourceLastCheckedAt ? formatRegistryTimestamp(sourceLastCheckedAt) : null },
              ]}
            />

            <InfoSection
              title="Freshness"
              items={[
                { label: "Current state", value: summary.sourceState },
                { label: "Freshness note", value: summary.guidance },
              ]}
            />

            <InfoSection
              title="Validation"
              items={[
                { label: "Mandatory fields", value: summary.mandatoryFieldLabel },
                { label: "Validation metadata", value: summary.validationLabel },
              ]}
            />

            <InfoSection
              title="Access and permissions"
              items={[
                { label: "Current role", value: currentRole },
                { label: "Read-only reason", value: detailContext.readOnlyReason },
              ]}
            />

            <InfoSection
              title="Diagnostics and recovery"
              items={[
                { label: "Current state", value: summary.sourceState },
              ]}
            >
              {showCapabilityMetadata && entry.capabilityMetadata && (
                <CapabilityMetadataStrip metadata={entry.capabilityMetadata} />
              )}
            </InfoSection>
          </>
        )}
      />
    </div>
  );
}

function InfoSection({
  title,
  items,
  children,
}: {
  title: string;
  items?: Array<{ label: string; value: string | null | undefined }>;
  children?: React.ReactNode;
}) {
  const visibleItems = (items || []).filter((item) => item.value !== null && item.value !== undefined && String(item.value).trim() !== "");
  if (visibleItems.length === 0 && !children) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</div>
      {visibleItems.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {visibleItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">{item.label}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-700 break-words">{item.value}</div>
            </div>
          ))}
        </div>
      )}
      {children}
    </section>
  );
}
