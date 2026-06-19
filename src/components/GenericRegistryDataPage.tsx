import React, { useMemo } from "react";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import GenericEntityDetailView from "./generic/GenericEntityDetailView";
import { getRegistryCatalogEntry } from "../lib/registryCatalog";
import {
  createRegistryExplorerEntityDefinition,
  getRegistryExplorerRow,
  type RegistryExplorerRow,
} from "../lib/registryExplorerEntityDefinition";
import type { SchoolRegistryState } from "../lib/schoolRegistry";

interface GenericRegistryDataPageProps {
  registryId: string;
  currentRole: string;
  onBackToExplorer: () => void;
  schoolRegistry?: SchoolRegistryState | null;
}

type RegistryReadinessState = "Ready" | "Empty" | "Missing" | "Incomplete" | "Fallback" | "Unknown";

interface RegistryDetailSummary {
  sourceState: RegistryReadinessState;
  rowCountLabel: string;
  mandatoryFieldLabel: string;
  validationLabel: string;
  requiredCount: number;
  presentFields: string[];
  missingFields: string[];
  unknownFields: string[];
  validationMessages: string[];
  guidance?: string;
}

function normalizeKey(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function getLiveRowsForRegistry(
  row: RegistryExplorerRow,
  schoolRegistry?: SchoolRegistryState | null,
): Array<Record<string, unknown>> {
  if (!schoolRegistry) return [];

  switch (row.tabName) {
    case "School_Profile":
      return schoolRegistry.schoolProfile as unknown as Array<Record<string, unknown>>;
    case "Academic_Years":
      return schoolRegistry.academicYears as unknown as Array<Record<string, unknown>>;
    case "Classes_Sections":
      return schoolRegistry.classesSections as unknown as Array<Record<string, unknown>>;
    case "Subjects":
      return schoolRegistry.subjects as unknown as Array<Record<string, unknown>>;
    case "Staff_Directory":
      return schoolRegistry.staffDirectory as unknown as Array<Record<string, unknown>>;
    case "Teacher_Allocations":
      return schoolRegistry.teacherAllocations as unknown as Array<Record<string, unknown>>;
    case "Timetable":
      return schoolRegistry.timetable as unknown as Array<Record<string, unknown>>;
    case "Student_Directory":
      return schoolRegistry.studentDirectory as unknown as Array<Record<string, unknown>>;
    case "Student_Enrollment":
      return schoolRegistry.studentEnrollment as unknown as Array<Record<string, unknown>>;
    case "Books_Registry":
      return schoolRegistry.booksRegistry as unknown as Array<Record<string, unknown>>;
    case "Book_TOC_Registry":
      return schoolRegistry.bookTocRegistry as unknown as Array<Record<string, unknown>>;
    case "Registry_Bootstrap_Log":
      return schoolRegistry.registryBootstrapLog as unknown as Array<Record<string, unknown>>;
    case "Registry_Summary":
      return schoolRegistry.registrySummary as unknown as Array<Record<string, unknown>>;
    default:
      return [];
  }
}

function getRegistryReadiness(
  row: RegistryExplorerRow,
  liveRows: Array<Record<string, unknown>>,
  schoolRegistry?: SchoolRegistryState | null,
): RegistryReadinessState {
  if (schoolRegistry?.mode === "fallback") return "Fallback";
  if (schoolRegistry?.mode === "missing" || schoolRegistry?.mode === "error") {
    return liveRows.length > 0 ? "Ready" : "Missing";
  }

  if (liveRows.length === 0) {
    if (row.sourceState === "Missing") return "Missing";
    if (row.sourceState === "Incomplete") return "Incomplete";
    if (row.sourceState === "Fallback") return "Fallback";
    return row.sourceState === "Empty" ? "Empty" : "Unknown";
  }

  const requiredHeaders = row.requiredHeaders || [];
  if (requiredHeaders.length > 0) {
    const availableKeys = new Set(liveRows.flatMap((liveRow) => Object.keys(liveRow)).map(normalizeKey));
    const missing = requiredHeaders.filter((header) => !availableKeys.has(normalizeKey(header)));
    if (missing.length > 0) return "Incomplete";
  }

  return "Ready";
}

function buildRegistryDetailSummary(
  row: RegistryExplorerRow,
  liveRows: Array<Record<string, unknown>>,
  schoolRegistry?: SchoolRegistryState | null,
): RegistryDetailSummary {
  const requiredHeaders = row.requiredHeaders || [];
  const readiness = getRegistryReadiness(row, liveRows, schoolRegistry);
  const sourceDisplayName = row.capabilityMetadata?.displayName || row.displayName;
  const validationMessages: string[] = [];

  if (requiredHeaders.length === 0) {
    validationMessages.push("Validation metadata not available from this source yet.");
  } else if (readiness === "Missing") {
    validationMessages.push("Validation metadata not available from this source yet.");
  }

  const availableKeys = new Set(liveRows.flatMap((liveRow) => Object.keys(liveRow)).map(normalizeKey));
  const presentFields = requiredHeaders.filter((header) => availableKeys.has(normalizeKey(header)));
  const missingFields = requiredHeaders.filter((header) => !availableKeys.has(normalizeKey(header)));
  const unknownFields = readiness === "Empty" || readiness === "Unknown" ? requiredHeaders : [];

  const mandatoryFieldLabel =
    requiredHeaders.length === 0
      ? "Mandatory field metadata unavailable"
      : readiness === "Missing"
        ? "Mandatory fields defined, but live rows are not loaded."
        : readiness === "Empty"
          ? "Mandatory fields defined, but no rows are available to validate."
          : readiness === "Fallback"
            ? "Mandatory fields defined, but fallback data is in use."
              : readiness === "Incomplete"
              ? "Mandatory values missing in available rows."
              : readiness === "Ready" && missingFields.length === 0
                ? "Mandatory values available in live rows"
                : "Mandatory values missing in available rows.";

  const validationLabel =
    requiredHeaders.length > 0
      ? readiness === "Missing"
        ? "Validation metadata not available from this source yet"
        : readiness === "Incomplete"
          ? "Validation rules need review"
          : "Validation metadata available"
      : "Validation metadata not available from this source yet";

  const rowCount = liveRows.length;
  const rowCountLabel =
    readiness === "Ready"
      ? `${rowCount} ${rowCount === 1 ? "row" : "rows"}`
      : readiness === "Empty"
        ? "No rows"
        : readiness === "Missing"
          ? "Source unavailable"
          : readiness === "Fallback"
            ? "Fallback data"
            : readiness === "Incomplete"
              ? "Setup incomplete"
              : "Metadata only";

  if (readiness === "Incomplete" && missingFields.length > 0) {
    validationMessages.push(`Validation rules need review: ${missingFields.slice(0, 3).join(", ")}.`);
  } else if (readiness === "Ready" && requiredHeaders.length > 0 && missingFields.length === 0) {
    validationMessages.push("No validation issues detected from available metadata.");
  }

  let guidance: string | undefined;
  if (readiness === "Missing") {
    guidance = "Source metadata is available, but live rows are not loaded.";
  } else if (readiness === "Empty") {
    guidance = `${sourceDisplayName} is mapped, but no live rows are available.`;
  } else if (readiness === "Incomplete") {
    guidance = "Setup incomplete. Required headers are still missing in this route.";
  } else if (readiness === "Fallback") {
    guidance = "Fallback data is in use. Reconnect the live source before relying on it.";
  } else if (readiness === "Unknown") {
    guidance = "Registry metadata is available, but live rows are not loaded yet.";
  }

  return {
    sourceState: readiness,
    rowCountLabel,
    mandatoryFieldLabel,
    validationLabel,
    requiredCount: requiredHeaders.length,
    presentFields,
    missingFields,
    unknownFields,
    validationMessages,
    guidance,
  };
}

function SummaryPill({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "emerald" | "amber" | "orange" | "violet" | "blue" }) {
  const toneClass = tone === "emerald"
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : tone === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : tone === "orange"
        ? "bg-orange-50 text-orange-700 border-orange-100"
        : tone === "violet"
          ? "bg-violet-50 text-violet-700 border-violet-100"
          : tone === "blue"
            ? "bg-blue-50 text-blue-700 border-blue-100"
            : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="text-[9px] uppercase tracking-wider font-mono font-bold opacity-80">{label}</div>
      <div className="mt-0.5 text-[11px] font-semibold break-words">{value}</div>
    </div>
  );
}

function RegistryDetailFallback({
  row,
  currentRole,
  schoolRegistry,
  onBackToExplorer,
}: {
  row: NonNullable<ReturnType<typeof getRegistryExplorerRow>>;
  currentRole: string;
  schoolRegistry?: SchoolRegistryState | null;
  onBackToExplorer: () => void;
}) {
  const sourceDisplayName = row.capabilityMetadata?.displayName || row.displayName;
  const definition = useMemo(() => {
    const baseDefinition = createRegistryExplorerEntityDefinition();
    return {
      ...baseDefinition,
      actions: [],
    };
  }, []);

  const liveRows = useMemo(() => getLiveRowsForRegistry(row, schoolRegistry), [row, schoolRegistry]);
  const detailSummary = useMemo(() => buildRegistryDetailSummary(row, liveRows, schoolRegistry), [liveRows, row, schoolRegistry]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <button
              type="button"
              onClick={onBackToExplorer}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft size={12} /> Back to Registries
            </button>
            <div className="pt-1">
              <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
                Universal Registry Route
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 break-words">
                {sourceDisplayName}
              </h2>
              <p className="text-[11px] text-slate-500 break-words">
                Registry ID: {row.registryId} | /registries/{row.registryId}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              Role: {currentRole}
            </span>
            {row.pageRoute && (
              <a
                href={row.pageRoute}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                Open first-class page <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SummaryPill label="Rows" value={detailSummary.rowCountLabel} tone={detailSummary.sourceState === "Ready" ? "blue" : detailSummary.sourceState === "Empty" ? "slate" : detailSummary.sourceState === "Missing" ? "amber" : detailSummary.sourceState === "Incomplete" ? "orange" : detailSummary.sourceState === "Fallback" ? "violet" : "slate"} />
          <SummaryPill label="Source state" value={detailSummary.sourceState} tone={detailSummary.sourceState === "Ready" ? "emerald" : detailSummary.sourceState === "Empty" ? "slate" : detailSummary.sourceState === "Missing" ? "amber" : detailSummary.sourceState === "Incomplete" ? "orange" : detailSummary.sourceState === "Fallback" ? "violet" : "slate"} />
          <SummaryPill label="Mandatory fields" value={detailSummary.mandatoryFieldLabel} tone={detailSummary.mandatoryFieldLabel === "Mandatory values available in live rows" ? "emerald" : detailSummary.mandatoryFieldLabel === "Mandatory field metadata unavailable" ? "slate" : "amber"} />
          <SummaryPill label="Validation" value={detailSummary.validationLabel} tone={detailSummary.validationLabel === "Validation metadata available" ? "blue" : "slate"} />
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              This route exposes the registry metadata directly. Live row rendering stays on the existing first-class page when one is already available.
            </p>
            {detailSummary.guidance && <p>{detailSummary.guidance}</p>}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-[11px] text-slate-600 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mandatory Fields</span>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                detailSummary.mandatoryFieldLabel === "Mandatory values available in live rows"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : detailSummary.mandatoryFieldLabel === "Mandatory field metadata unavailable"
                    ? "bg-slate-50 text-slate-600 border-slate-200"
                    : "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                {detailSummary.mandatoryFieldLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                Required {detailSummary.requiredCount}
              </span>
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-emerald-100 text-emerald-700">
                Present {detailSummary.presentFields.length}
              </span>
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-amber-100 text-amber-700">
                Missing {detailSummary.missingFields.length}
              </span>
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-500">
                Unknown {detailSummary.unknownFields.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {detailSummary.presentFields.map((field) => (
                <span key={`present-${field}`} className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {field}
                </span>
              ))}
              {detailSummary.missingFields.map((field) => (
                <span key={`missing-${field}`} className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                  {field}
                </span>
              ))}
              {detailSummary.unknownFields.map((field) => (
                <span key={`unknown-${field}`} className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                  {field}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-[11px] text-slate-600 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Validation</span>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                detailSummary.validationLabel === "Validation metadata available"
                  ? "bg-blue-50 text-blue-700 border-blue-100"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}>
                {detailSummary.validationLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                Rules {detailSummary.requiredCount}
              </span>
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                Warnings {detailSummary.validationMessages.length}
              </span>
            </div>
            {detailSummary.validationMessages.length > 0 ? (
              <div className="space-y-1">
            {detailSummary.validationMessages.map((message) => (
                <div key={message} className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2 text-[10.5px] font-semibold text-amber-800">
                  {message}
                </div>
              ))}
            </div>
          ) : (
              <p>No validation issues detected from available metadata.</p>
            )}
          </div>
        </div>
      </div>

      <GenericEntityDetailView
        definition={definition}
        row={row}
        onClearSelection={onBackToExplorer}
      />
    </div>
  );
}

export default function GenericRegistryDataPage({
  registryId,
  currentRole,
  onBackToExplorer,
  schoolRegistry,
}: GenericRegistryDataPageProps) {
  const row = useMemo(() => getRegistryExplorerRow(registryId), [registryId]);
  const catalogEntry = useMemo(() => getRegistryCatalogEntry(registryId), [registryId]);

  if (catalogEntry?.createEntityDefinition && catalogEntry.firstClassPageEnabled) {
    return null;
  }

  if (!row) {
    const sourceLabel = catalogEntry?.capabilityMetadata?.displayName || registryId;
    return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-1.5">
      <div className="font-extrabold">{sourceLabel} source is unavailable</div>
      <div>
          Use the first-class page when available. This registry detail route remains read-only.
        </div>
        <div className="text-[11px] text-amber-700">
          If this registry exists in the master capability catalog, it still needs source mapping before live rows can render here.
        </div>
      </div>
    );
  }

  return <RegistryDetailFallback row={row} currentRole={currentRole} schoolRegistry={schoolRegistry} onBackToExplorer={onBackToExplorer} />;
}
