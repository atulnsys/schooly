import React, { useMemo } from "react";
import { BookOpen, ExternalLink, LibraryBig } from "lucide-react";
import GenericEntityPage from "./generic/GenericEntityPage";
import type { GenericEntityDefinition } from "../lib/genericEntityView";
import {
  buildAcademicResourceRows,
  type AcademicResourceRow,
} from "../lib/academicResourceTypes";
import type { WorkspaceFile } from "../types";

interface AcademicResourceLibraryPageProps {
  files: WorkspaceFile[];
  currentRole: string;
  setActiveTab?: (tab: string) => void;
}

const ACADEMIC_RESOURCE_DEFINITION: GenericEntityDefinition<AcademicResourceRow> = {
  entityName: "resource",
  entityNamePlural: "Academic Resource Library",
  description:
    "Lesson-linked Workspace files surfaced from Search and other existing classroom flows.",
  getId: (row) => row.id,
  getTitle: (row) => row.title,
  getSubtitle: (row) => [row.resourceTypeLabel, row.className, row.subjectName].filter(Boolean).join(" / "),
  getSummary: (row) => row.description,
  searchPlaceholder: "Search resources, lesson topics, tags, or file paths...",
  emptyTitle: "No academic resources found.",
  emptyDescription:
    "The library only surfaces lesson-linked files and existing archive records that already live in the workspace.",
  defaultDisplayMode: "table",
  defaultPageSize: 12,
  defaultSort: { fieldKey: "modifiedAt", direction: "desc" },
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
      getBadgeVariant: (row) => (row.status === "Linked" ? "success" : "warning"),
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
      key: "subjectName",
      label: "Subject",
      type: "text",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "lessonLinkage",
      label: "Lesson Linkage",
      type: "longText",
      listVisible: false,
      detailVisible: true,
      searchable: true,
    },
    {
      key: "modifiedAt",
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
      listVisible: true,
      detailVisible: true,
      searchable: true,
      sortable: true,
    },
    {
      key: "path",
      label: "Path",
      type: "longText",
      listVisible: false,
      detailVisible: true,
      searchable: true,
    },
    {
      key: "tags",
      label: "Tags",
      type: "tags",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      filterable: true,
      getFilterValues: (row) => row.tags,
    },
    {
      key: "webViewLink",
      label: "Web Link",
      type: "link",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "origin",
      label: "Origin",
      type: "badge",
      listVisible: false,
      detailVisible: true,
      getBadgeVariant: (row) => (row.origin === "WorkspaceFile" ? "info" : "default"),
    },
  ],
  sections: [
    {
      id: "resource-summary",
      title: "Resource Summary",
      description: "Lesson linkage and source status.",
      fields: ["resourceTypeLabel", "category", "status", "source", "origin"],
    },
    {
      id: "resource-context",
      title: "Lesson Context",
      description: "The class and subject context this resource belongs to.",
      fields: ["className", "subjectName", "lessonLinkage"],
    },
    {
      id: "resource-file",
      title: "File Details",
      description: "File provenance and location details.",
      fields: ["owner", "modifiedAt", "path", "tags", "webViewLink"],
    },
  ],
  actions: [
    {
      id: "open-web-link",
      label: "Open in Drive",
      placement: "detail",
      variant: "primary",
      icon: <ExternalLink size={12} />,
      getHref: (row) => row.webViewLink,
      target: "_blank",
      hidden: (row) => !row.webViewLink,
    },
  ],
};

export default function AcademicResourceLibraryPage({
  files,
  currentRole,
  setActiveTab,
}: AcademicResourceLibraryPageProps) {
  const resourceRows = useMemo(() => buildAcademicResourceRows(files), [files]);

  const permissionContext = useMemo(
    () => ({ currentRole }),
    [currentRole],
  );

  return (
    <div className="space-y-4" id="academic-resource-library-page">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
              <LibraryBig size={13} />
              Academic Resource Library
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">Lesson-linked resources</h1>
            <p className="max-w-3xl text-xs leading-relaxed text-slate-600">
              Browse lesson-linked Workspace files, resource packs, and source materials without leaving the existing lesson-planning and textbook workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab("lesson-plans")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-[10.5px] font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 cursor-pointer"
              >
                <BookOpen size={12} />
                Open Lesson Plans
              </button>
            )}
          </div>
        </div>
      </div>

      <GenericEntityPage
        definition={ACADEMIC_RESOURCE_DEFINITION}
        rows={resourceRows}
        permissionContext={permissionContext}
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
