import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ExternalLink, Filter, Search } from "lucide-react";
import GenericEntityPage from "./generic/GenericEntityPage";
import type { GenericEntityDefinition } from "../lib/genericEntityView";
import type { GenericEntityStorageContext } from "../lib/genericEntityTableState";
import {
  buildAcademicResourceRows,
  loadSavedLessonPlanArchiveRows,
  summarizeAcademicResourceRows,
  type AcademicResourceRow,
} from "../lib/academicResourceLibrary";
import {
  buildStaffDropdownOptions,
  loadLessonPlanRegistryDropdownState,
  loadNcertDropdownState,
  type AcademicResourceDropdownSources,
  type RegistryDropdownAvailability,
  type RegistryDropdownOption,
  type RegistryDropdownState,
} from "../lib/academicResourceDropdownSources";
import type { AcademicResourceSourceFamily } from "../lib/academicResourceTypes";
import type { SchoolRegistryState } from "../lib/schoolRegistry";
import type { WorkspaceFile } from "../types";
import OverlaySurface from "./common/OverlaySurface";
import { StandardMetricGrid, StandardPageHeader } from "./common/StandardPageSurface";

interface AcademicResourceLibraryPageProps {
  files: WorkspaceFile[];
  currentRole: string;
  storageContext?: GenericEntityStorageContext | null;
  setActiveTab?: (tab: string) => void;
  schoolRegistry?: SchoolRegistryState | null;
  registryRefreshVersion?: number;
}
type ResourceStatusFilter = "all" | "linked" | "metadata" | "sourceUnavailable" | "evidenceMapped";
type ResourceSourceFilter = "all" | AcademicResourceSourceFamily;
type ResourceLinkFilter = "all" | "linked" | "missing";

interface ResourceFilterPreset {
  sourceFilter: ResourceSourceFilter;
  statusFilter: ResourceStatusFilter;
  resourceTypeFilter: string;
  categoryFilter: string;
  audienceFilter: string;
  staffFilter: string;
  classFilter: string;
  sectionFilter: string;
  subjectFilter: string;
  bookFilter: string;
  chapterFilter: string;
  lessonPlanIdFilter: string;
  sourceRegistryIdFilter: string;
  evidenceStatusFilter: string;
  sourceConfidenceFilter: string;
  driveLinkFilter: ResourceLinkFilter;
  classroomLinkFilter: ResourceLinkFilter;
}
interface FilterOption {
  value: string;
  label: string;
}

function normalizeFilterValue(value: string | undefined | null): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function matchesFilterValue(candidate: string | undefined, selected: string): boolean {
  const normalizedSelected = normalizeFilterValue(selected);
  if (!normalizedSelected) return true;

  const normalizedCandidate = normalizeFilterValue(candidate);
  if (!normalizedCandidate) return false;

  return (
    normalizedCandidate.includes(normalizedSelected) ||
    normalizedSelected.includes(normalizedCandidate)
  );
}

function matchesAnyFilterValue(candidates: Array<string | undefined>, selectedValues: Array<string | undefined>): boolean {
  const resolvedSelected = selectedValues.map((value) => String(value || "").trim()).filter(Boolean);
  if (resolvedSelected.length === 0) return true;
  return resolvedSelected.some((selected) => candidates.some((candidate) => matchesFilterValue(candidate, selected)));
}

function findRegistryOptionByValue(options: RegistryDropdownOption[], value: string): RegistryDropdownOption | null {
  const normalized = normalizeFilterValue(value);
  if (!normalized) return null;
  return options.find((option) =>
    normalizeFilterValue(option.value) === normalized ||
    normalizeFilterValue(option.label) === normalized ||
    normalizeFilterValue(option.secondaryLabel) === normalized,
  ) || null;
}

function uniqueFilterOptions(rows: AcademicResourceRow[], getValue: (row: AcademicResourceRow) => string | undefined, labelResolver?: (value: string) => string): FilterOption[] {
  const values = new Set<string>();
  const collected: FilterOption[] = [];

  rows.forEach((row) => {
    const value = String(getValue(row) || "").trim();
    if (!value) return;
    const normalized = normalizeFilterValue(value);
    if (values.has(normalized)) return;
    values.add(normalized);
    collected.push({ value, label: labelResolver?.(value) ?? value });
  });

  return collected.sort((left, right) => left.label.localeCompare(right.label));
}

function CompactSelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-semibold text-slate-700 shadow-sm focus:outline-hidden focus:border-blue-500"
      >
        <option value="all">{label}: All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompactTextFilter({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-semibold text-slate-700 shadow-sm placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
      />
    </label>
  );
}

function formatRegistryOptionLabel(option: RegistryDropdownOption): string {
  return option.secondaryLabel ? `${option.label} Â· ${option.secondaryLabel}` : option.label;
}

function ModalDropdownFilter({
  label,
  value,
  options,
  onChange,
  disabled = false,
  helperText,
  lastCheckedAt,
  lastSuccessfulSyncAt,
  sourceStatus,
}: {
  label: string;
  value: string;
  options: RegistryDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
  lastCheckedAt?: string | null;
  lastSuccessfulSyncAt?: string | null;
  sourceStatus?: RegistryDropdownAvailability;
}) {
  const lastCheckedLabel = lastCheckedAt
    ? (() => {
        const parsed = new Date(lastCheckedAt);
        return Number.isNaN(parsed.getTime()) ? String(lastCheckedAt) : parsed.toLocaleString();
      })()
    : null;
  const lastSyncedLabel = lastSuccessfulSyncAt
    ? (() => {
        const parsed = new Date(lastSuccessfulSyncAt);
        return Number.isNaN(parsed.getTime()) ? String(lastSuccessfulSyncAt) : parsed.toLocaleString();
      })()
    : null;

  return (
    <label className="space-y-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
      <span>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-semibold text-slate-700 shadow-sm focus:outline-hidden focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="all">{disabled ? helperText || `${label} unavailable` : `${label}: All`}</option>
        {options.map((option) => (
          <option key={option.stableKey} value={option.value}>
            {formatRegistryOptionLabel(option)}
          </option>
        ))}
      </select>
      {helperText && disabled && (
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">{helperText}</div>
      )}
      {(sourceStatus === "stale" || sourceStatus === "refreshing") && (
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">
          {sourceStatus === "stale"
            ? "Previous options retained after a refresh failure."
            : "Refreshing source rows while keeping the previous options available."}
        </div>
      )}
      {lastCheckedLabel && (
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Last checked {lastCheckedLabel}
        </div>
      )}
      {lastSyncedLabel && (
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
          Last successful sync {lastSyncedLabel}
        </div>
      )}
    </label>
  );
}

function getResourceFilterPresetFromLocation(): ResourceFilterPreset {
  if (typeof window === "undefined") {
    return {
      sourceFilter: "all",
      statusFilter: "all",
      resourceTypeFilter: "all",
      categoryFilter: "all",
      audienceFilter: "all",
      staffFilter: "",
      classFilter: "all",
      sectionFilter: "all",
      subjectFilter: "all",
      bookFilter: "all",
      chapterFilter: "all",
      lessonPlanIdFilter: "",
      sourceRegistryIdFilter: "",
      evidenceStatusFilter: "all",
      sourceConfidenceFilter: "all",
      driveLinkFilter: "all",
      classroomLinkFilter: "all",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const sourceParam = params.get("source");
  const statusParam = params.get("status");
  const resourceTypeParam = params.get("resourceType") || params.get("type");
  const categoryParam = params.get("category");
  const audienceParam = params.get("audience");
  const staffParam = params.get("staff");
  const classParam = params.get("class");
  const sectionParam = params.get("section");
  const subjectParam = params.get("subject");
  const bookParam = params.get("book");
  const chapterParam = params.get("chapter");
  const lessonPlanIdParam = params.get("lessonPlanId");
  const sourceRegistryIdParam = params.get("sourceRegistryId");
  const evidenceStatusParam = params.get("evidenceStatus");
  const sourceConfidenceParam = params.get("sourceConfidence");
  const driveLinkParam = params.get("driveLink");
  const classroomLinkParam = params.get("classroomLink");

  const sourceFilterMap: Record<string, AcademicResourceSourceFamily> = {
    "lesson-plans": "LessonPlanner",
    textbooks: "TextbookIngestor",
    classroom: "Google Classroom",
    drive: "Google Drive",
    registry: "Registry Explorer",
    unknown: "unknown",
  };

  const sourceFilter = sourceParam && sourceFilterMap[sourceParam.toLowerCase()]
    ? sourceFilterMap[sourceParam.toLowerCase()]
    : "all";

  const statusFilter =
    statusParam === "linked" ||
    statusParam === "metadata" ||
    statusParam === "sourceUnavailable" ||
    statusParam === "evidenceMapped"
      ? (statusParam as ResourceStatusFilter)
      : "all";

  return {
    sourceFilter,
    statusFilter,
    resourceTypeFilter: resourceTypeParam || "all",
    categoryFilter: categoryParam || "all",
    audienceFilter: audienceParam || "all",
    staffFilter: staffParam || "",
    classFilter: classParam || "all",
    sectionFilter: sectionParam || "all",
    subjectFilter: subjectParam || "all",
    bookFilter: bookParam || "all",
    chapterFilter: chapterParam || "all",
    lessonPlanIdFilter: lessonPlanIdParam || "",
    sourceRegistryIdFilter: sourceRegistryIdParam || "",
    evidenceStatusFilter: evidenceStatusParam || "all",
    sourceConfidenceFilter: sourceConfidenceParam || "all",
    driveLinkFilter: driveLinkParam === "linked" || driveLinkParam === "missing" ? (driveLinkParam as ResourceLinkFilter) : "all",
    classroomLinkFilter: classroomLinkParam === "linked" || classroomLinkParam === "missing" ? (classroomLinkParam as ResourceLinkFilter) : "all",
  };
}

function writeResourceFilterPresetToLocation(preset: ResourceFilterPreset) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const setOrDelete = (key: string, value: string) => {
    if (!value || value === "all") {
      params.delete(key);
      return;
    }
    params.set(key, value);
  };

  setOrDelete("source", preset.sourceFilter === "all" ? "" : preset.sourceFilter);
  setOrDelete("status", preset.statusFilter === "all" ? "" : preset.statusFilter);
  setOrDelete("resourceType", preset.resourceTypeFilter === "all" ? "" : preset.resourceTypeFilter);
  setOrDelete("category", preset.categoryFilter === "all" ? "" : preset.categoryFilter);
  setOrDelete("audience", preset.audienceFilter === "all" ? "" : preset.audienceFilter);
  setOrDelete("staff", preset.staffFilter);
  setOrDelete("class", preset.classFilter === "all" ? "" : preset.classFilter);
  setOrDelete("section", preset.sectionFilter === "all" ? "" : preset.sectionFilter);
  setOrDelete("subject", preset.subjectFilter === "all" ? "" : preset.subjectFilter);
  setOrDelete("book", preset.bookFilter === "all" ? "" : preset.bookFilter);
  setOrDelete("chapter", preset.chapterFilter === "all" ? "" : preset.chapterFilter);
  setOrDelete("lessonPlanId", preset.lessonPlanIdFilter);
  setOrDelete("sourceRegistryId", preset.sourceRegistryIdFilter);
  setOrDelete("evidenceStatus", preset.evidenceStatusFilter === "all" ? "" : preset.evidenceStatusFilter);
  setOrDelete("sourceConfidence", preset.sourceConfidenceFilter === "all" ? "" : preset.sourceConfidenceFilter);
  setOrDelete("driveLink", preset.driveLinkFilter === "all" ? "" : preset.driveLinkFilter);
  setOrDelete("classroomLink", preset.classroomLinkFilter === "all" ? "" : preset.classroomLinkFilter);

  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
  window.history.pushState({}, "", nextUrl);
}

const SOURCE_FAMILY_LABELS: Record<AcademicResourceSourceFamily, string> = {
  LessonPlanner: "Lesson Workspace",
  TextbookIngestor: "Textbook / NCERT",
  "Google Drive": "Workspace File",
  "Google Classroom": "Google Classroom",
  "Registry Explorer": "Registry Metadata",
  unknown: "Unknown / Source unavailable",
};

const STATUS_FILTER_LABELS: Record<ResourceStatusFilter, string> = {
  all: "All items",
  linked: "Drive linked",
  metadata: "Metadata only",
  sourceUnavailable: "Source unavailable",
  evidenceMapped: "Evidence mapped",
};

function countEvidenceSignals(row: AcademicResourceRow): number {
  return row.sqaaTags.length + row.cbseTags.length + row.ncertTags.length + row.evidenceTags.length;
}

function buildResourceStatusFilter(row: AcademicResourceRow): ResourceStatusFilter[] {
  const filters: ResourceStatusFilter[] = [];

  if (row.status === "Linked") filters.push("linked");
  if (row.isMetadataOnly) filters.push("metadata");
  if (row.sourceUnavailable || !row.sourceAvailable) filters.push("sourceUnavailable");
  if (countEvidenceSignals(row) > 0) filters.push("evidenceMapped");

  return filters;
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10.5px] font-semibold transition-colors cursor-pointer ${
        active
          ? "border-blue-300 bg-blue-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

const ACADEMIC_RESOURCE_DEFINITION: GenericEntityDefinition<AcademicResourceRow> = {
  entityName: "resource",
  entityNamePlural: "Academic Resources",
  description:
    "Read-only evidence map for lesson-linked workspace files and saved lesson-plan archive rows.",
  getId: (row) => row.id,
  getTitle: (row) => row.title,
  getSubtitle: (row) =>
    [row.resourceTypeLabel, row.sourceLabel, row.status]
      .filter(Boolean)
      .join(" / "),
  getSummary: (row) => row.description,
  searchPlaceholder: "Search resources, types, class, subject, tags, evidence codes, or source notes...",
  emptyTitle: "No academic resources matched the current filters.",
  emptyDescription:
    "This read-only library only surfaces existing workspace files and saved lesson-plan archive rows. Clear filters or broaden the query context to widen the view.",
  defaultDisplayMode: "table",
  defaultPageSize: 10,
  defaultSort: { fieldKey: "updatedAt", direction: "desc" },
  getRowIssues: (row) => {
    const issues = [];

    if (row.sourceUnavailable) {
      issues.push({
        id: `source-unavailable-${row.id}`,
        message: "No live Drive or Classroom link is available for this record.",
        severity: "warning" as const,
      });
    } else if (row.isMetadataOnly) {
      issues.push({
        id: `metadata-only-${row.id}`,
        message: "This record is surfaced from metadata only and does not include a live file link.",
        severity: "info" as const,
      });
    }

    if (row.evidenceOriented && countEvidenceSignals(row) === 0) {
      issues.push({
        id: `evidence-missing-${row.id}`,
        message: "Evidence tags are not available from this source yet.",
        severity: "warning" as const,
      });
    }

    return issues;
  },
  fields: [
    {
      key: "resourceTypeLabel",
      label: "Type",
      type: "badge",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "category",
      label: "Category",
      type: "badge",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "audience",
      label: "Audience",
      type: "badge",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      type: "badge",
      listVisible: true,
      detailVisible: true,
      sortable: true,
      getBadgeVariant: (row) => {
        if (row.status === "Linked") return "success";
        if (row.status === "Source unavailable") return "danger";
        if (row.status === "Metadata only") return "warning";
        if (String(row.status).startsWith("Review:")) return "info";
        return "default";
      },
    },
    {
      key: "sourceFamily",
      label: "Source Family",
      type: "badge",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
      getBadgeVariant: (row) => {
        if (row.sourceFamily === "LessonPlanner") return "info";
        if (row.sourceFamily === "TextbookIngestor") return "warning";
        if (row.sourceFamily === "Registry Explorer") return "success";
        if (row.sourceFamily === "Google Classroom") return "info";
        return "default";
      },
      renderListValue: (row) => SOURCE_FAMILY_LABELS[row.sourceFamily],
      renderDetailValue: (row) => SOURCE_FAMILY_LABELS[row.sourceFamily],
    },
    {
      key: "source",
      label: "Source",
      type: "text",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "sourceLabel",
      label: "Source Context",
      type: "badge",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      sortable: true,
      renderListValue: (row) => row.sourceLabel,
      renderDetailValue: (row) => row.sourceLabel,
    },
    {
      key: "className",
      label: "Class",
      type: "text",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "section",
      label: "Section",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "subject",
      label: "Subject",
      type: "text",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "bookName",
      label: "Book",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "chapter",
      label: "Chapter / Topic",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "updatedAt",
      label: "Modified",
      type: "date",
      listVisible: true,
      detailVisible: true,
      sortable: true,
    },
    {
      key: "owner",
      label: "Owner",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      sortable: true,
    },
    {
      key: "sharingRule",
      label: "Sharing",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "sourceRoute",
      label: "Source Route",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
    },
    {
      key: "sourceRegistryId",
      label: "Source Registry",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
    },
    {
      key: "sourceRecordId",
      label: "Source Record ID",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
    },
    {
      key: "sourceAvailable",
      label: "Source Available",
      type: "boolean",
      listVisible: false,
      detailVisible: true,
      filterable: true,
    },
    {
      key: "sourceConfidence",
      label: "Source Confidence",
      type: "badge",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      renderDetailValue: (row) => row.sourceConfidence,
      getBadgeVariant: (row) => {
        if (row.sourceConfidence === "high") return "success";
        if (row.sourceConfidence === "medium") return "warning";
        return "danger";
      },
    },
    {
      key: "sourceNotes",
      label: "Source Notes",
      type: "longText",
      listVisible: false,
      detailVisible: true,
      searchable: true,
    },
    {
      key: "lessonPlanTitle",
      label: "Lesson Plan",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
    },
    {
      key: "lessonPlanId",
      label: "Lesson Plan ID",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
    },
    {
      key: "tags",
      label: "Tags",
      type: "tags",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      getFilterValues: (row) => row.tags,
    },
    {
      key: "sqaaTags",
      label: "SQAA Tags",
      type: "tags",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      getFilterValues: (row) => row.sqaaTags,
    },
    {
      key: "cbseTags",
      label: "CBSE Tags",
      type: "tags",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      getFilterValues: (row) => row.cbseTags,
    },
    {
      key: "ncertTags",
      label: "NCERT Tags",
      type: "tags",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      getFilterValues: (row) => row.ncertTags,
    },
    {
      key: "evidenceType",
      label: "Evidence Type",
      type: "badge",
      listVisible: false,
      detailVisible: true,
      renderDetailValue: (row) => row.evidenceType,
    },
    {
      key: "evidenceStatus",
      label: "Evidence Status",
      type: "badge",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      renderDetailValue: (row) => row.evidenceStatus,
      getBadgeVariant: (row) => {
        if (row.evidenceStatus === "mapped") return "success";
        if (row.evidenceStatus === "review only") return "warning";
        return "danger";
      },
    },
    {
      key: "evidenceUrl",
      label: "Evidence Link",
      type: "link",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "evidenceTags",
      label: "Evidence Tags",
      type: "tags",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      filterable: true,
      getFilterValues: (row) => row.evidenceTags,
    },
    {
      key: "evidenceNotes",
      label: "Evidence Notes",
      type: "longText",
      listVisible: false,
      detailVisible: true,
      searchable: true,
    },
    {
      key: "driveUrl",
      label: "Drive Link",
      type: "link",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "classroomUrl",
      label: "Classroom Link",
      type: "link",
      listVisible: false,
      detailVisible: true,
    },
  ],
  sections: [
    {
      id: "resource-summary",
      title: "Resource Summary",
      description: "Type, source, and status for the selected resource.",
      fields: ["resourceTypeLabel", "category", "status", "sourceFamily", "sourceLabel", "sourceAvailable", "sourceConfidence", "source", "sourceRoute", "sourceRegistryId", "sourceRecordId"],
    },
    {
      id: "lesson-context",
      title: "Academic Context",
      description: "Class, subject, chapter, and source linkage from the academic workspace.",
      fields: ["className", "section", "subject", "bookName", "chapter", "lessonPlanTitle", "lessonPlanId", "updatedAt"],
    },
    {
      id: "source-notes",
      title: "Source Notes",
      description: "Ownership, sharing, and location metadata that already exists in the workspace.",
      fields: ["owner", "sharingRule", "sourceNotes", "tags", "driveUrl", "classroomUrl"],
    },
    {
      id: "evidence-map",
      title: "Evidence Map",
      description: "SQAA, CBSE, NCERT, and mapping tags surfaced from the underlying source.",
      fields: ["evidenceType", "evidenceStatus", "evidenceUrl", "sqaaTags", "cbseTags", "ncertTags", "evidenceTags", "evidenceNotes"],
    },
  ],
  actions: [
    {
      id: "open-source-surface",
      label: "Open source surface",
      placement: "detail",
      variant: "secondary",
      icon: <Search size={12} />,
      getHref: (row) => row.sourceRoute,
      target: "_self",
      hidden: (row) => !row.sourceRoute,
    },
    {
      id: "open-drive",
      label: "Open in Drive",
      placement: "detail",
      variant: "primary",
      icon: <ExternalLink size={12} />,
      getHref: (row) => row.driveUrl,
      target: "_blank",
      hidden: (row) => !row.driveUrl,
    },
    {
      id: "open-classroom",
      label: "Open in Classroom",
      placement: "detail",
      variant: "secondary",
      icon: <ExternalLink size={12} />,
      getHref: (row) => row.classroomUrl,
      target: "_blank",
      hidden: (row) => !row.classroomUrl,
    },
  ],
  detail: {
    displayMode: "read-only",
    readOnlyReason: "This evidence library is read-only and preserves the original source records.",
    externalLinks: [
      {
        label: "Open source route",
        getHref: (row) => row.sourceRoute || undefined,
        target: "_self",
        variant: "primary",
        description: "Open the original source route for this resource.",
      },
    ],
  },
};

export default function AcademicResourceLibraryPage({
  files,
  currentRole,
  storageContext,
  setActiveTab,
  schoolRegistry = null,
  registryRefreshVersion = 0,
}: AcademicResourceLibraryPageProps) {
  const initialFilterPreset = useMemo(() => getResourceFilterPresetFromLocation(), []);
  const savedLessonPlanArchiveRows = useMemo(() => loadSavedLessonPlanArchiveRows(), []);
  const resourceRows = useMemo(
    () => buildAcademicResourceRows(files, savedLessonPlanArchiveRows),
    [files, savedLessonPlanArchiveRows],
  );

  const [sourceFilter, setSourceFilter] = useState<ResourceSourceFilter>(initialFilterPreset.sourceFilter);
  const [statusFilter, setStatusFilter] = useState<ResourceStatusFilter>(initialFilterPreset.statusFilter);
  const [resourceTypeFilter, setResourceTypeFilter] = useState(initialFilterPreset.resourceTypeFilter);
  const [categoryFilter, setCategoryFilter] = useState(initialFilterPreset.categoryFilter);
  const [audienceFilter, setAudienceFilter] = useState(initialFilterPreset.audienceFilter);
  const [staffFilter, setStaffFilter] = useState(initialFilterPreset.staffFilter);
  const [classFilter, setClassFilter] = useState(initialFilterPreset.classFilter);
  const [sectionFilter, setSectionFilter] = useState(initialFilterPreset.sectionFilter);
  const [subjectFilter, setSubjectFilter] = useState(initialFilterPreset.subjectFilter);
  const [bookFilter, setBookFilter] = useState(initialFilterPreset.bookFilter);
  const [chapterFilter, setChapterFilter] = useState(initialFilterPreset.chapterFilter);
  const [lessonPlanIdFilter, setLessonPlanIdFilter] = useState(initialFilterPreset.lessonPlanIdFilter);
  const [sourceRegistryIdFilter, setSourceRegistryIdFilter] = useState(initialFilterPreset.sourceRegistryIdFilter);
  const [evidenceStatusFilter, setEvidenceStatusFilter] = useState(initialFilterPreset.evidenceStatusFilter);
  const [sourceConfidenceFilter, setSourceConfidenceFilter] = useState(initialFilterPreset.sourceConfidenceFilter);
  const [driveLinkFilter, setDriveLinkFilter] = useState<ResourceLinkFilter>(initialFilterPreset.driveLinkFilter);
  const [classroomLinkFilter, setClassroomLinkFilter] = useState<ResourceLinkFilter>(initialFilterPreset.classroomLinkFilter);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<ResourceFilterPreset & { staffFilter: string }>(() => ({ ...initialFilterPreset }));
  const filterModalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownSourcesRef = useRef<AcademicResourceDropdownSources>({
    lessonPlanRegistry: { availability: "loading", lastCheckedAt: null, lastSuccessfulSyncAt: null, isRefreshing: true, loadedAt: null, message: "Loading...", options: [] },
    ncertTextbooks: { availability: "loading", lastCheckedAt: null, lastSuccessfulSyncAt: null, isRefreshing: true, loadedAt: null, message: "Loading...", options: [] },
    ncertChapters: { availability: "loading", lastCheckedAt: null, lastSuccessfulSyncAt: null, isRefreshing: true, loadedAt: null, message: "Loading...", options: [] },
  });
  const [dropdownSources, setDropdownSources] = useState<AcademicResourceDropdownSources>({
    ...dropdownSourcesRef.current,
  });

  const rowsAfterSourceFilter = useMemo(() => {
    return resourceRows.filter((row) => sourceFilter === "all" || row.sourceFamily === sourceFilter);
  }, [resourceRows, sourceFilter]);

  const rowsAfterStatusFilter = useMemo(() => {
    return rowsAfterSourceFilter.filter((row) => {
      if (statusFilter === "all") {
        return true;
      }

      return buildResourceStatusFilter(row).includes(statusFilter);
    });
  }, [rowsAfterSourceFilter, statusFilter]);

  const staffRegistrySource = useMemo(() => buildStaffDropdownOptions(schoolRegistry), [schoolRegistry]);
  const staffOptions = useMemo(() => staffRegistrySource.options, [staffRegistrySource.options]);
  const bookOptions = useMemo(() => dropdownSources.ncertTextbooks.options, [dropdownSources.ncertTextbooks.options]);
  const chapterOptions = useMemo(() => dropdownSources.ncertChapters.options, [dropdownSources.ncertChapters.options]);
  const lessonPlanOptions = useMemo(() => dropdownSources.lessonPlanRegistry.options, [dropdownSources.lessonPlanRegistry.options]);

  useEffect(() => {
    dropdownSourcesRef.current = dropdownSources;
  }, [dropdownSources]);

  const filteredRows = useMemo(() => {
    const selectedLessonPlanOption = findRegistryOptionByValue(lessonPlanOptions, lessonPlanIdFilter);
    const selectedStaffOption = findRegistryOptionByValue(staffOptions, staffFilter);
    const selectedBookOption = findRegistryOptionByValue(bookOptions, bookFilter);
    const selectedChapterOption = findRegistryOptionByValue(chapterOptions, chapterFilter);

    return rowsAfterStatusFilter.filter((row) => {
      if (resourceTypeFilter !== "all" && !matchesFilterValue(row.resourceTypeId, resourceTypeFilter) && !matchesFilterValue(row.resourceTypeLabel, resourceTypeFilter)) {
        return false;
      }

      if (categoryFilter !== "all" && !matchesFilterValue(row.category, categoryFilter)) {
        return false;
      }

      if (audienceFilter !== "all" && !matchesFilterValue(row.audience, audienceFilter)) {
        return false;
      }

      if (classFilter !== "all" && !matchesFilterValue(row.className, classFilter)) {
        return false;
      }

      if (sectionFilter !== "all" && !matchesFilterValue(row.section, sectionFilter)) {
        return false;
      }

      if (subjectFilter !== "all" && !matchesFilterValue(row.subject, subjectFilter)) {
        return false;
      }

      if (staffFilter && !matchesAnyFilterValue([row.owner, row.sourceNotes, row.sourceRecordId], [selectedStaffOption?.value, selectedStaffOption?.label, selectedStaffOption?.secondaryLabel, staffFilter])) {
        return false;
      }

      if (bookFilter !== "all" && !matchesAnyFilterValue([row.bookName, row.sourceRegistryId, row.sourceRecordId], [selectedBookOption?.value, selectedBookOption?.label, selectedBookOption?.secondaryLabel, bookFilter])) {
        return false;
      }

      if (chapterFilter !== "all" && !matchesAnyFilterValue([row.chapter, row.sourceRegistryId, row.sourceRecordId], [selectedChapterOption?.value, selectedChapterOption?.label, selectedChapterOption?.secondaryLabel, chapterFilter])) {
        return false;
      }

      if (lessonPlanIdFilter && !matchesAnyFilterValue([row.lessonPlanId, row.sourceRecordId, row.sourceRegistryId], [selectedLessonPlanOption?.value, selectedLessonPlanOption?.label, selectedLessonPlanOption?.secondaryLabel, lessonPlanIdFilter])) {
        return false;
      }

      if (sourceRegistryIdFilter && !matchesFilterValue(row.sourceRegistryId, sourceRegistryIdFilter)) {
        return false;
      }

      if (evidenceStatusFilter !== "all" && !matchesFilterValue(row.evidenceStatus, evidenceStatusFilter)) {
        return false;
      }

      if (sourceConfidenceFilter !== "all" && !matchesFilterValue(row.sourceConfidence, sourceConfidenceFilter)) {
        return false;
      }

      if (driveLinkFilter === "linked" && !row.driveUrl) {
        return false;
      }

      if (driveLinkFilter === "missing" && row.driveUrl) {
        return false;
      }

      if (classroomLinkFilter === "linked" && !row.classroomUrl) {
        return false;
      }

      if (classroomLinkFilter === "missing" && row.classroomUrl) {
        return false;
      }

      return true;
    });
  }, [
    rowsAfterStatusFilter,
    resourceTypeFilter,
    categoryFilter,
    audienceFilter,
    staffFilter,
    classFilter,
    sectionFilter,
    subjectFilter,
    bookFilter,
    chapterFilter,
    lessonPlanIdFilter,
    lessonPlanOptions,
    staffOptions,
    bookOptions,
    chapterOptions,
    sourceRegistryIdFilter,
    evidenceStatusFilter,
    sourceConfidenceFilter,
    driveLinkFilter,
    classroomLinkFilter,
  ]);

  const summary = useMemo(() => summarizeAcademicResourceRows(resourceRows), [resourceRows]);
  const filteredSummary = useMemo(() => summarizeAcademicResourceRows(filteredRows), [filteredRows]);

  const permissionContext = useMemo(
    () => ({ currentRole }),
    [currentRole],
  );

  useEffect(() => {
    let cancelled = false;
    const previousSources = dropdownSourcesRef.current;
    void Promise.all([
      loadLessonPlanRegistryDropdownState(previousSources.lessonPlanRegistry),
      loadNcertDropdownState({
        textbooks: previousSources.ncertTextbooks,
        chapters: previousSources.ncertChapters,
      }),
    ]).then(([lessonPlanRegistry, ncertDropdowns]) => {
      if (cancelled) return;
      setDropdownSources({
        lessonPlanRegistry,
        ncertTextbooks: ncertDropdowns.textbooks,
        ncertChapters: ncertDropdowns.chapters,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [registryRefreshVersion]);

  const resourceTypeOptions = useMemo(
    () => uniqueFilterOptions(resourceRows, (row) => row.resourceTypeId, (value) => {
      const match = resourceRows.find((row) => row.resourceTypeId === value);
      return match?.resourceTypeLabel || value;
    }),
    [resourceRows],
  );
  const categoryOptions = useMemo(() => uniqueFilterOptions(resourceRows, (row) => row.category), [resourceRows]);
  const audienceOptions = useMemo(() => uniqueFilterOptions(resourceRows, (row) => row.audience), [resourceRows]);
  const classOptions = useMemo(() => uniqueFilterOptions(resourceRows, (row) => row.className), [resourceRows]);
  const sectionOptions = useMemo(() => uniqueFilterOptions(resourceRows, (row) => row.section), [resourceRows]);
  const subjectOptions = useMemo(() => uniqueFilterOptions(resourceRows, (row) => row.subject), [resourceRows]);
  const lessonPlanAvailability = dropdownSources.lessonPlanRegistry.availability;
  const ncertTextbookAvailability = dropdownSources.ncertTextbooks.availability;
  const ncertChapterAvailability = dropdownSources.ncertChapters.availability;
  const staffRegistryAvailability = staffRegistrySource.availability;
  const filteredChapterOptions = useMemo(
    () => {
      if (bookFilter === "all") return chapterOptions;
      const selectedBook = normalizeFilterValue(bookFilter);
      return chapterOptions.filter((option) => {
        const sourceBook = normalizeFilterValue(option.secondaryLabel);
        return sourceBook === selectedBook || sourceBook.includes(selectedBook) || selectedBook.includes(sourceBook);
      });
    },
    [bookFilter, chapterOptions],
  );
  const draftChapterOptions = useMemo(
    () => {
      if (filterDraft.bookFilter === "all") return chapterOptions;
      const selectedBook = normalizeFilterValue(filterDraft.bookFilter);
      return chapterOptions.filter((option) => {
        const sourceBook = normalizeFilterValue(option.secondaryLabel);
        return sourceBook === selectedBook || sourceBook.includes(selectedBook) || selectedBook.includes(sourceBook);
      });
    },
    [chapterOptions, filterDraft.bookFilter],
  );
  const sourceRegistryIdOptions = useMemo(() => uniqueFilterOptions(resourceRows, (row) => row.sourceRegistryId), [resourceRows]);

  const sourceFamilyCounts = useMemo(() => {
    const counts: Record<ResourceSourceFilter, number> = {
      all: resourceRows.length,
      LessonPlanner: 0,
      TextbookIngestor: 0,
      "Google Drive": 0,
      "Google Classroom": 0,
      "Registry Explorer": 0,
      unknown: 0,
    };

    resourceRows.forEach((row) => {
      counts[row.sourceFamily] += 1;
    });

    return counts;
  }, [resourceRows]);

  const statusCounts = useMemo(() => {
    const counts: Record<ResourceStatusFilter, number> = {
      all: rowsAfterSourceFilter.length,
      linked: 0,
      metadata: 0,
      sourceUnavailable: 0,
      evidenceMapped: 0,
    };

    rowsAfterSourceFilter.forEach((row) => {
      buildResourceStatusFilter(row).forEach((status) => {
        counts[status] += 1;
      });
    });

    return counts;
  }, [rowsAfterSourceFilter]);

  const activeFilterCount = [
    sourceFilter !== "all",
    statusFilter !== "all",
    resourceTypeFilter !== "all",
    categoryFilter !== "all",
    audienceFilter !== "all",
    Boolean(staffFilter.trim()),
    classFilter !== "all",
    sectionFilter !== "all",
    subjectFilter !== "all",
    bookFilter !== "all",
    chapterFilter !== "all",
    Boolean(lessonPlanIdFilter.trim()),
    Boolean(sourceRegistryIdFilter.trim()),
    evidenceStatusFilter !== "all",
    sourceConfidenceFilter !== "all",
    driveLinkFilter !== "all",
    classroomLinkFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const resetResourceFilters = () => {
    const resetPreset: ResourceFilterPreset = {
      sourceFilter: "all",
      statusFilter: "all",
      resourceTypeFilter: "all",
      categoryFilter: "all",
      audienceFilter: "all",
      staffFilter: "",
      classFilter: "all",
      sectionFilter: "all",
      subjectFilter: "all",
      bookFilter: "all",
      chapterFilter: "all",
      lessonPlanIdFilter: "",
      sourceRegistryIdFilter: "",
      evidenceStatusFilter: "all",
      sourceConfidenceFilter: "all",
      driveLinkFilter: "all",
      classroomLinkFilter: "all",
    };
    setSourceFilter(resetPreset.sourceFilter);
    setStatusFilter(resetPreset.statusFilter);
    setResourceTypeFilter(resetPreset.resourceTypeFilter);
    setCategoryFilter(resetPreset.categoryFilter);
    setAudienceFilter(resetPreset.audienceFilter);
    setStaffFilter(resetPreset.staffFilter);
    setClassFilter(resetPreset.classFilter);
    setSectionFilter(resetPreset.sectionFilter);
    setSubjectFilter(resetPreset.subjectFilter);
    setBookFilter(resetPreset.bookFilter);
    setChapterFilter(resetPreset.chapterFilter);
    setLessonPlanIdFilter(resetPreset.lessonPlanIdFilter);
    setSourceRegistryIdFilter(resetPreset.sourceRegistryIdFilter);
    setEvidenceStatusFilter(resetPreset.evidenceStatusFilter);
    setSourceConfidenceFilter(resetPreset.sourceConfidenceFilter);
    setDriveLinkFilter(resetPreset.driveLinkFilter);
    setClassroomLinkFilter(resetPreset.classroomLinkFilter);
    setFilterDraft({ ...resetPreset });
    writeResourceFilterPresetToLocation(resetPreset);
  };

  const getCurrentFilterSnapshot = (): ResourceFilterPreset => ({
    sourceFilter,
    statusFilter,
    resourceTypeFilter,
    categoryFilter,
    audienceFilter,
    staffFilter,
    classFilter,
    sectionFilter,
    subjectFilter,
    bookFilter,
    chapterFilter,
    lessonPlanIdFilter,
    sourceRegistryIdFilter,
    evidenceStatusFilter,
    sourceConfidenceFilter,
    driveLinkFilter,
    classroomLinkFilter,
  });

  const openFilterModal = () => {
    setFilterDraft(getCurrentFilterSnapshot());
    setFilterModalOpen(true);
  };

  const closeFilterModal = () => {
    setFilterModalOpen(false);
  };

  const applyFilterDraft = () => {
    setSourceFilter(filterDraft.sourceFilter);
    setStatusFilter(filterDraft.statusFilter);
    setResourceTypeFilter(filterDraft.resourceTypeFilter);
    setCategoryFilter(filterDraft.categoryFilter);
    setAudienceFilter(filterDraft.audienceFilter);
    setStaffFilter(filterDraft.staffFilter);
    setClassFilter(filterDraft.classFilter);
    setSectionFilter(filterDraft.sectionFilter);
    setSubjectFilter(filterDraft.subjectFilter);
    setBookFilter(filterDraft.bookFilter);
    setChapterFilter(filterDraft.chapterFilter);
    setLessonPlanIdFilter(filterDraft.lessonPlanIdFilter);
    setSourceRegistryIdFilter(filterDraft.sourceRegistryIdFilter);
    setEvidenceStatusFilter(filterDraft.evidenceStatusFilter);
    setSourceConfidenceFilter(filterDraft.sourceConfidenceFilter);
    setDriveLinkFilter(filterDraft.driveLinkFilter);
    setClassroomLinkFilter(filterDraft.classroomLinkFilter);
    writeResourceFilterPresetToLocation(filterDraft);
    setFilterModalOpen(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const preset = getResourceFilterPresetFromLocation();
      setSourceFilter(preset.sourceFilter);
      setStatusFilter(preset.statusFilter);
      setResourceTypeFilter(preset.resourceTypeFilter);
      setCategoryFilter(preset.categoryFilter);
      setAudienceFilter(preset.audienceFilter);
      setStaffFilter(preset.staffFilter);
      setClassFilter(preset.classFilter);
      setSectionFilter(preset.sectionFilter);
      setSubjectFilter(preset.subjectFilter);
      setBookFilter(preset.bookFilter);
      setChapterFilter(preset.chapterFilter);
      setLessonPlanIdFilter(preset.lessonPlanIdFilter);
      setSourceRegistryIdFilter(preset.sourceRegistryIdFilter);
      setEvidenceStatusFilter(preset.evidenceStatusFilter);
      setSourceConfidenceFilter(preset.sourceConfidenceFilter);
      setDriveLinkFilter(preset.driveLinkFilter);
      setClassroomLinkFilter(preset.classroomLinkFilter);
      setFilterDraft({ ...preset });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const clearFilterDraft = () => {
    setFilterDraft({
      sourceFilter: "all",
      statusFilter: "all",
      resourceTypeFilter: "all",
      categoryFilter: "all",
      audienceFilter: "all",
      staffFilter: "",
      classFilter: "all",
      sectionFilter: "all",
      subjectFilter: "all",
      bookFilter: "all",
      chapterFilter: "all",
      lessonPlanIdFilter: "",
      sourceRegistryIdFilter: "",
      evidenceStatusFilter: "all",
      sourceConfidenceFilter: "all",
      driveLinkFilter: "all",
      classroomLinkFilter: "all",
    });
  };

  const renderDetailBeforeSections = (row: AcademicResourceRow) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[10.5px] leading-relaxed text-slate-600 space-y-2">
      <div className="font-bold text-slate-900">Source note</div>
      <p>
        This record is derived from existing workspace metadata and stays read-only in the resource library.
        It does not write back to Drive, Classroom, Sheets, or the registry catalog.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
          Source label: {row.sourceLabel}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
          Source family: {SOURCE_FAMILY_LABELS[row.sourceFamily]}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
          Status: {row.status}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
          Confidence: {row.sourceConfidence}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
          Evidence signals: {countEvidenceSignals(row)}
        </span>
      </div>
    </div>
  );

  const renderDetailAfterSections = (row: AcademicResourceRow) => (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10.5px] leading-relaxed text-slate-600 space-y-2">
      <div className="font-bold text-slate-900">Evidence snapshot</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-white border border-blue-100 px-2 py-1.5">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">SQAA</div>
          <div className="font-semibold text-slate-900">{row.sqaaTags.length}</div>
        </div>
        <div className="rounded-lg bg-white border border-blue-100 px-2 py-1.5">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">CBSE</div>
          <div className="font-semibold text-slate-900">{row.cbseTags.length}</div>
        </div>
        <div className="rounded-lg bg-white border border-blue-100 px-2 py-1.5">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">NCERT</div>
          <div className="font-semibold text-slate-900">{row.ncertTags.length}</div>
        </div>
        <div className="rounded-lg bg-white border border-blue-100 px-2 py-1.5">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Mapping</div>
          <div className="font-semibold text-slate-900">{row.evidenceTags.length}</div>
        </div>
      </div>
      <p>
        These tags are inferred from existing metadata only. Use the detail actions to open the source surface,
        Drive file, or Classroom copy when those links are available.
      </p>
      <p className="text-[10px] text-slate-500">
        {row.evidenceNotes}
      </p>
    </div>
  );

  return (
    <div className="space-y-4" id="academic-resource-library-page">
      <StandardPageHeader
        eyebrow="Academic Resource Library"
        title="Lesson-linked resources and evidence mapping"
        description="Browse read-only academic resources derived from existing Workspace files and archived lesson-plan rows. This surface keeps the lesson-planning and NCERT workspaces intact while exposing source notes, evidence tags, and safe drill-throughs."
        badges={(
          <>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Read-only surface</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Evidence mapped from existing metadata</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Safe drill-through only</span>
          </>
        )}
        actions={setActiveTab && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("lesson-plans")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-[10.5px] font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 cursor-pointer"
            >
              <BookOpen size={12} />
              Open Lesson Plans
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("textbooks")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-[10.5px] font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 cursor-pointer"
            >
              <BookOpen size={12} />
              Open Textbooks
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-[10.5px] font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 cursor-pointer"
            >
              <Search size={12} />
              Open Search
            </button>
          </>
        )}
      />

      <StandardMetricGrid
        items={[
          {
            label: "Visible resources",
            value: filteredSummary.totalResources,
            description: `Showing ${filteredSummary.totalResources} of ${summary.totalResources} workspace-backed items.`,
            tone: "blue",
          },
          {
            label: "Resource types represented",
            value: filteredSummary.resourceTypesRepresented,
            description: "Distinct lesson, assessment, communication, and evidence types currently visible.",
          },
          {
            label: "Drive linked",
            value: filteredSummary.driveLinkedResources,
            description: "Resources with a live Workspace or Drive link available.",
            tone: "emerald",
          },
          {
            label: "Classroom linked",
            value: filteredSummary.classroomLinkedResources,
            description: "Resources that still point at a Classroom-backed copy or surface.",
            tone: "violet",
          },
          {
            label: "Evidence mapped",
            value: filteredSummary.evidenceMappedResources,
            description: "Rows with SQAA, CBSE, NCERT, or mapping tags detected.",
            tone: "emerald",
          },
          {
            label: "Source unavailable",
            value: filteredSummary.sourceUnavailableResources,
            description: "Rows without a live Drive or Classroom link.",
            tone: "amber",
          },
          {
            label: "Low-confidence / inferred",
            value: filteredSummary.lowConfidenceMappings,
            description: "Rows inferred from metadata rather than live source links.",
            tone: "amber",
          },
        ]}
        className="xl:grid-cols-4"
      />

      {resourceRows.length > 0 && filteredRows.length === 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-900 shadow-sm">
          No academic resources matched the current filters or query context. Clear the filters above or search with a broader term to widen the view.
        </div>
      )}

      <GenericEntityPage
        definition={ACADEMIC_RESOURCE_DEFINITION}
        rows={filteredRows}
        stateNamespace="academic-resources"
        storageContext={storageContext}
        permissionContext={permissionContext}
        showListHeader={false}
        backLabel="Back to Resources"
        detailContext={{
          displayMode: "read-only",
          stateLabel: "Evidence map",
          sourceLabel: "Academic resources",
          readOnlyReason: "This library is a read-only evidence map that preserves the original workspace and lesson-plan sources.",
        }}
        renderDetailBeforeSections={renderDetailBeforeSections}
        renderDetailAfterSections={renderDetailAfterSections}
        renderToolbarActions={() => (
          <button
            type="button"
            ref={filterModalTriggerRef}
            onClick={openFilterModal}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10.5px] font-bold transition-colors cursor-pointer ${
              hasActiveFilters
                ? "border-blue-200 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            aria-label="Filter Academic Resources"
            aria-haspopup="dialog"
            aria-expanded={filterModalOpen}
            aria-controls="resource-filter-modal"
            title="Filter Academic Resources"
          >
            <Filter size={12} />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
        showSearch
        showFilters={false}
        showSort
        showDisplayModeToggle
        showPagination
        className="items-start"
      />

      {filterModalOpen && (
        <OverlaySurface
          open={filterModalOpen}
          onClose={closeFilterModal}
          overlayId="resource-filter-modal"
          title="Filter Academic Resources"
          description="Adjust filters without changing the live list until you apply them. Registry-backed dropdowns stay tied to their canonical sources."
          closeLabel="Close filter dialog"
          returnFocusRef={filterModalTriggerRef}
          maxWidthClassName="max-w-5xl"
          bodyClassName="px-5 py-4 space-y-5"
          footerClassName="px-5 py-4"
          header={(
            <div className="space-y-1 border-b border-slate-200 px-0 pb-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Academic Resource Filters</div>
              <h3 id="resource-filter-modal-title" className="text-lg font-black tracking-tight text-slate-950">
                Filter Academic Resources
              </h3>
              <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
                Adjust filters without changing the live list until you apply them. Registry-backed dropdowns stay tied to their canonical sources.
              </p>
            </div>
          )}
          body={(
            <div className="space-y-5">
              <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Source and status</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <CompactSelectFilter label="Source family" value={filterDraft.sourceFilter} options={(Object.keys(SOURCE_FAMILY_LABELS) as AcademicResourceSourceFamily[]).map((family) => ({ value: family, label: SOURCE_FAMILY_LABELS[family] }))} onChange={(value) => setFilterDraft((current) => ({ ...current, sourceFilter: value as ResourceSourceFilter }))} />
                  <CompactSelectFilter label="Status" value={filterDraft.statusFilter} options={(Object.keys(STATUS_FILTER_LABELS) as ResourceStatusFilter[]).map((status) => ({ value: status, label: STATUS_FILTER_LABELS[status] }))} onChange={(value) => setFilterDraft((current) => ({ ...current, statusFilter: value as ResourceStatusFilter }))} />
                  <CompactSelectFilter label="Resource type" value={filterDraft.resourceTypeFilter} options={resourceTypeOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, resourceTypeFilter: value }))} />
                  <CompactSelectFilter label="Category" value={filterDraft.categoryFilter} options={categoryOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, categoryFilter: value }))} />
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Academic context</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <CompactSelectFilter label="Class" value={filterDraft.classFilter} options={classOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, classFilter: value }))} />
                  <CompactSelectFilter label="Section" value={filterDraft.sectionFilter} options={sectionOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, sectionFilter: value }))} />
                  <CompactSelectFilter label="Subject" value={filterDraft.subjectFilter} options={subjectOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, subjectFilter: value }))} />
                  <ModalDropdownFilter label="Lesson Plan Registry" value={filterDraft.lessonPlanIdFilter || "all"} options={lessonPlanOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, lessonPlanIdFilter: value === "all" ? "" : value }))} disabled={lessonPlanAvailability === "loading" || lessonPlanAvailability === "authentication_required" || lessonPlanAvailability === "account_mismatch" || lessonPlanAvailability === "source_unavailable" || lessonPlanAvailability === "error" || (lessonPlanAvailability === "empty" && lessonPlanOptions.length === 0)} helperText={lessonPlanAvailability === "empty" ? "No lesson workspace rows found" : lessonPlanAvailability === "loading" ? "Loading lesson workspace rows..." : lessonPlanAvailability === "stale" ? "Previous lesson workspace options retained after a refresh failure." : lessonPlanAvailability === "ready" ? undefined : "Lesson Plan Registry unavailable"} sourceStatus={lessonPlanAvailability} lastCheckedAt={dropdownSources.lessonPlanRegistry.lastCheckedAt} lastSuccessfulSyncAt={dropdownSources.lessonPlanRegistry.lastSuccessfulSyncAt} />
                  <ModalDropdownFilter label="NCERT Textbook" value={filterDraft.bookFilter} options={bookOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, bookFilter: value }))} disabled={ncertTextbookAvailability === "loading" || ncertTextbookAvailability === "authentication_required" || ncertTextbookAvailability === "account_mismatch" || ncertTextbookAvailability === "source_unavailable" || ncertTextbookAvailability === "error" || (ncertTextbookAvailability === "empty" && bookOptions.length === 0)} helperText={ncertTextbookAvailability === "empty" ? "No NCERT textbooks found" : ncertTextbookAvailability === "loading" ? "Loading NCERT registry..." : ncertTextbookAvailability === "stale" ? "Previous NCERT options retained after a refresh failure." : ncertTextbookAvailability === "ready" ? undefined : "NCERT Registry unavailable"} sourceStatus={ncertTextbookAvailability} lastCheckedAt={dropdownSources.ncertTextbooks.lastCheckedAt} lastSuccessfulSyncAt={dropdownSources.ncertTextbooks.lastSuccessfulSyncAt} />
                  <ModalDropdownFilter label="NCERT Chapter" value={filterDraft.chapterFilter} options={draftChapterOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, chapterFilter: value }))} disabled={ncertChapterAvailability === "loading" || ncertChapterAvailability === "authentication_required" || ncertChapterAvailability === "account_mismatch" || ncertChapterAvailability === "source_unavailable" || ncertChapterAvailability === "error" || (ncertChapterAvailability === "empty" && draftChapterOptions.length === 0)} helperText={ncertChapterAvailability === "empty" ? "No NCERT chapters found" : ncertChapterAvailability === "loading" ? "Loading NCERT registry..." : ncertChapterAvailability === "stale" ? "Previous NCERT options retained after a refresh failure." : ncertChapterAvailability === "ready" ? undefined : "NCERT Registry unavailable"} sourceStatus={ncertChapterAvailability} lastCheckedAt={dropdownSources.ncertChapters.lastCheckedAt} lastSuccessfulSyncAt={dropdownSources.ncertChapters.lastSuccessfulSyncAt} />
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">People and ownership</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <ModalDropdownFilter label="Staff" value={filterDraft.staffFilter || "all"} options={staffOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, staffFilter: value === "all" ? "" : value }))} disabled={staffRegistryAvailability === "loading" || staffRegistryAvailability === "authentication_required" || staffRegistryAvailability === "account_mismatch" || staffRegistryAvailability === "source_unavailable" || staffRegistryAvailability === "error" || (staffRegistryAvailability === "empty" && staffOptions.length === 0)} helperText={staffRegistryAvailability === "empty" ? "No active staff rows found" : staffRegistryAvailability === "loading" ? "Loading staff directory..." : staffRegistryAvailability === "stale" ? "Previous staff options retained after a refresh failure." : staffRegistryAvailability === "ready" ? undefined : "Staff Directory unavailable"} sourceStatus={staffRegistryAvailability} lastCheckedAt={staffRegistrySource.lastCheckedAt} lastSuccessfulSyncAt={staffRegistrySource.lastSuccessfulSyncAt} />
                  <CompactSelectFilter label="Audience" value={filterDraft.audienceFilter} options={audienceOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, audienceFilter: value }))} />
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Source and evidence</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <CompactSelectFilter label="Source registry" value={filterDraft.sourceRegistryIdFilter || "all"} options={sourceRegistryIdOptions} onChange={(value) => setFilterDraft((current) => ({ ...current, sourceRegistryIdFilter: value === "all" ? "" : value }))} />
                  <CompactSelectFilter label="Evidence status" value={filterDraft.evidenceStatusFilter} options={[{ value: "mapped", label: "Mapped" }, { value: "review only", label: "Review only" }, { value: "unavailable", label: "Unavailable" }]} onChange={(value) => setFilterDraft((current) => ({ ...current, evidenceStatusFilter: value }))} />
                  <CompactSelectFilter label="Source confidence" value={filterDraft.sourceConfidenceFilter} options={[{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} onChange={(value) => setFilterDraft((current) => ({ ...current, sourceConfidenceFilter: value }))} />
                  <CompactSelectFilter label="Drive link" value={filterDraft.driveLinkFilter} options={[{ value: "linked", label: "Linked" }, { value: "missing", label: "Missing" }]} onChange={(value) => setFilterDraft((current) => ({ ...current, driveLinkFilter: value as ResourceLinkFilter }))} />
                  <CompactSelectFilter label="Classroom link" value={filterDraft.classroomLinkFilter} options={[{ value: "linked", label: "Linked" }, { value: "missing", label: "Missing" }]} onChange={(value) => setFilterDraft((current) => ({ ...current, classroomLinkFilter: value as ResourceLinkFilter }))} />
                </div>
              </section>
            </div>
          )}
          footer={(
            <>
              <div className="text-[10.5px] leading-relaxed text-slate-500">
                {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}.` : "No active filters."}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={clearFilterDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={closeFilterModal}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyFilterDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </>
          )}
        />
      )}
    </div>
  );
}
