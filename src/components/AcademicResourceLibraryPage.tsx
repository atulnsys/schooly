import React, { useMemo, useState } from "react";
import { BookOpen, ExternalLink, Filter, LibraryBig, Search } from "lucide-react";
import GenericEntityPage from "./generic/GenericEntityPage";
import type { GenericEntityDefinition } from "../lib/genericEntityView";
import {
  buildAcademicResourceRows,
  loadSavedLessonPlanArchiveRows,
  summarizeAcademicResourceRows,
  type AcademicResourceRow,
} from "../lib/academicResourceLibrary";
import type { AcademicResourceSourceFamily } from "../lib/academicResourceTypes";
import type { WorkspaceFile } from "../types";

interface AcademicResourceLibraryPageProps {
  files: WorkspaceFile[];
  currentRole: string;
  setActiveTab?: (tab: string) => void;
}

type ResourceStatusFilter = "all" | "linked" | "metadata" | "sourceUnavailable" | "evidenceMapped";
type ResourceSourceFilter = "all" | AcademicResourceSourceFamily;

function getResourceFilterPresetFromLocation(): {
  sourceFilter: ResourceSourceFilter;
  statusFilter: ResourceStatusFilter;
} {
  if (typeof window === "undefined") {
    return { sourceFilter: "all", statusFilter: "all" };
  }

  const params = new URLSearchParams(window.location.search);
  const sourceParam = params.get("source");
  const statusParam = params.get("status");

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

  return { sourceFilter, statusFilter };
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

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white/80 p-3 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-[10.5px] leading-relaxed text-slate-500">{description}</div>
    </div>
  );
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
  searchPlaceholder: "Search resources, tags, evidence codes, or source notes...",
  emptyTitle: "No academic resources matched the current filters.",
  emptyDescription:
    "This read-only library only surfaces existing workspace files and saved lesson-plan archive rows. Clear filters to broaden the view.",
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
    },
    {
      key: "sourceRecordId",
      label: "Source Record ID",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
    },
    {
      key: "sourceAvailable",
      label: "Source Available",
      type: "boolean",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "sourceConfidence",
      label: "Source Confidence",
      type: "badge",
      listVisible: false,
      detailVisible: true,
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
    },
    {
      key: "lessonPlanTitle",
      label: "Lesson Plan",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
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
      fields: ["className", "subject", "chapter", "lessonPlanTitle", "updatedAt"],
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
};

export default function AcademicResourceLibraryPage({
  files,
  currentRole,
  setActiveTab,
}: AcademicResourceLibraryPageProps) {
  const initialFilterPreset = useMemo(() => getResourceFilterPresetFromLocation(), []);
  const savedLessonPlanArchiveRows = useMemo(() => loadSavedLessonPlanArchiveRows(), []);
  const resourceRows = useMemo(
    () => buildAcademicResourceRows(files, savedLessonPlanArchiveRows),
    [files, savedLessonPlanArchiveRows],
  );

  const [sourceFilter, setSourceFilter] = useState<ResourceSourceFilter>(initialFilterPreset.sourceFilter);
  const [statusFilter, setStatusFilter] = useState<ResourceStatusFilter>(initialFilterPreset.statusFilter);

  const rowsAfterSourceFilter = useMemo(() => {
    return resourceRows.filter((row) => {
      if (sourceFilter !== "all" && row.sourceFamily !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [resourceRows, sourceFilter]);

  const filteredRows = useMemo(() => {
    return rowsAfterSourceFilter.filter((row) => {
      if (statusFilter === "all") {
        return true;
      }

      const rowStatusFilters = buildResourceStatusFilter(row);
      return rowStatusFilters.includes(statusFilter);
    });
  }, [rowsAfterSourceFilter, statusFilter]);

  const summary = useMemo(() => summarizeAcademicResourceRows(resourceRows), [resourceRows]);
  const filteredSummary = useMemo(() => summarizeAcademicResourceRows(filteredRows), [filteredRows]);

  const permissionContext = useMemo(
    () => ({ currentRole }),
    [currentRole],
  );

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

  const hasActiveFilters = sourceFilter !== "all" || statusFilter !== "all";
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
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
              <LibraryBig size={13} />
              Academic Resource Library
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">Lesson-linked resources and evidence mapping</h1>
            <p className="max-w-3xl text-xs leading-relaxed text-slate-600">
              Browse read-only academic resources derived from existing Workspace files and archived lesson-plan rows. This surface keeps the lesson-planning and NCERT workspaces intact while exposing source notes, evidence tags, and safe drill-throughs.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Read-only surface</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Evidence mapped from existing metadata</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Safe drill-through only</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {setActiveTab && (
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
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Visible resources"
            value={filteredSummary.totalResources}
            description={`Showing ${filteredSummary.totalResources} of ${summary.totalResources} workspace-backed items.`}
          />
          <StatCard
            label="Drive linked"
            value={filteredSummary.driveLinkedResources}
            description="Resources with a live Workspace or Drive link available."
          />
          <StatCard
            label="Evidence mapped"
            value={filteredSummary.sqaaEvidenceLinkedResources}
            description="Rows with SQAA, CBSE, NCERT, or mapping tags detected."
          />
          <StatCard
            label="Metadata only / unavailable"
            value={filteredSummary.sourceUnavailableOrMetadataOnly}
            description="Rows that are surfaced from metadata without a live file link."
          />
        </div>

        <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-white/70 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <Filter size={12} />
            Compact filters
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Source</span>
              <FilterChip active={sourceFilter === "all"} label="All sources" count={sourceFamilyCounts.all} onClick={() => setSourceFilter("all")} />
              {(Object.keys(SOURCE_FAMILY_LABELS) as AcademicResourceSourceFamily[]).map((family) => (
                <React.Fragment key={family}>
                  <FilterChip
                    active={sourceFilter === family}
                    label={SOURCE_FAMILY_LABELS[family]}
                    count={sourceFamilyCounts[family]}
                    onClick={() => setSourceFilter(family)}
                  />
                </React.Fragment>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</span>
              {(Object.keys(STATUS_FILTER_LABELS) as ResourceStatusFilter[]).map((status) => (
                <React.Fragment key={status}>
                  <FilterChip
                    active={statusFilter === status}
                    label={STATUS_FILTER_LABELS[status]}
                    count={statusCounts[status]}
                    onClick={() => setStatusFilter(status)}
                  />
                </React.Fragment>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSourceFilter("all");
                  setStatusFilter("all");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10.5px] font-bold text-blue-700 cursor-pointer hover:bg-blue-100"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="text-[10.5px] leading-relaxed text-slate-500">
            Source note: this page is derived from existing Workspace files and lesson-plan archive rows. It does not write back to Drive, Classroom, Sheets, or the registry catalog. Evidence tags are inferred from current metadata and shown only for review.
          </div>
        </div>
      </div>

      <GenericEntityPage
        definition={ACADEMIC_RESOURCE_DEFINITION}
        rows={filteredRows}
        permissionContext={permissionContext}
        renderDetailBeforeSections={renderDetailBeforeSections}
        renderDetailAfterSections={renderDetailAfterSections}
        showSearch
        showFilters={false}
        showSort
        showDisplayModeToggle
        showPagination
        className="items-start"
      />
    </div>
  );
}
