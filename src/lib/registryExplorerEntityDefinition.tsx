import React from "react";
import type {
  GenericEntityActionDefinition,
  GenericEntityDefinition,
  GenericEntityFieldDefinition,
} from "./genericEntityView";
import { REGISTRY_CATALOG, type RegistryCatalogEntry } from "./registryCatalog";
import { REGISTRY_SCHEMA } from "./registrySchema";

export interface RegistryExplorerRow {
  registryId: string;
  displayName: string;
  sourceKind: string;
  status: string;
  sourceLabel: string;
  description: string;
  group: string;
  pageRoute?: string;
  dataRoute: string;
  workbookLabel?: string;
  spreadsheetKey?: string;
  tabName?: string;
  primaryKeyColumn?: string;
  safeBootstrapEligibility?: string;
  writebackAllowed?: boolean;
  operationalDataForbidden?: boolean;
  requiredHeaders?: string[];
  optionalHeaders?: string[];
  capabilitySummary?: string;
  canonicalRegistryName?: string;
  sourceSpreadsheetId?: string;
  tabCount?: number;
  derivedFromRegistryId?: string;
  discoveryNotes?: string;
  firstClassPageEnabled?: boolean;
  drillThroughEnabled?: boolean;
}

export interface RegistryExplorerSummary {
  totalEntries: number;
  canonicalPageEntries: number;
  derivedViewEntries: number;
  relationshipEntries: number;
  registryTabEntries: number;
  embeddedSurfaceEntries: number;
  sourceUnavailableEntries: number;
}

function slugifySegment(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getRegistryDataRoute(registryId: string): string {
  return `/registries/${encodeURIComponent(registryId)}`;
}

function resolveCatalogPageRouteFromTab(tabName: string): string | undefined {
  switch (tabName) {
    case "Staff_Directory":
      return "/staff";
    case "Student_Directory":
    case "Student_Enrollment":
      return "/students";
    case "Classroom_Course_Map":
      return "/courses";
    case "Classroom_Assignment_Map":
      return "/assignments";
    default:
      return undefined;
  }
}

function getPageRouteFromCatalogEntry(entry: RegistryCatalogEntry): string | undefined {
  if (!entry.firstClassPageEnabled) return undefined;
  if (entry.route === "search" && entry.id === "workspace-files") return "/search";
  return `/${entry.route}`;
}

function mapCatalogEntry(entry: RegistryCatalogEntry): RegistryExplorerRow {
  const capabilityMetadata = entry.capabilityMetadata;
  return {
    registryId: entry.id,
    displayName: entry.navLabel || entry.label,
    sourceKind: capabilityMetadata?.derivedFromRegistryId
      ? "Derived view"
      : entry.firstClassPageEnabled
        ? "First-class page"
        : "Embedded surface",
    status: entry.status,
    sourceLabel: entry.sourceLabel,
    description: entry.description,
    group: entry.group,
    pageRoute: getPageRouteFromCatalogEntry(entry),
    dataRoute: getRegistryDataRoute(entry.id),
    workbookLabel: capabilityMetadata?.canonicalRegistryName,
    spreadsheetKey: capabilityMetadata?.sourceSpreadsheetId,
    tabName: capabilityMetadata?.tabName,
    primaryKeyColumn: capabilityMetadata?.queryKeys?.[0],
    safeBootstrapEligibility: capabilityMetadata?.status,
    writebackAllowed: capabilityMetadata?.writePolicy !== "read_only",
    operationalDataForbidden: false,
    capabilitySummary: capabilityMetadata
      ? `${capabilityMetadata.capabilityId} · ${capabilityMetadata.sourceRole} · ${capabilityMetadata.supportedOperations.join(", ")}`
      : entry.allowedCapabilities?.join(", ") || "",
    canonicalRegistryName: capabilityMetadata?.canonicalRegistryName,
    sourceSpreadsheetId: capabilityMetadata?.sourceSpreadsheetId,
    discoveryNotes: capabilityMetadata?.discoveryNotes,
    derivedFromRegistryId: capabilityMetadata?.derivedFromRegistryId,
    firstClassPageEnabled: entry.firstClassPageEnabled,
    drillThroughEnabled: entry.drillThroughEnabled,
  };
}
function mapSchemaTab(workbook: (typeof REGISTRY_SCHEMA)[number], tab: (typeof REGISTRY_SCHEMA)[number]["tabs"][number]): RegistryExplorerRow {
  const isTeacherAllocations = tab.tabName === "Teacher_Allocations";
  const registryId = isTeacherAllocations ? "REG_TEACHER_ALLOCATIONS" : `${workbook.key}__${slugifySegment(tab.tabName)}`;
  const pageRoute = resolveCatalogPageRouteFromTab(tab.tabName);
  return {
    registryId,
    displayName: isTeacherAllocations ? "Teacher Allocations" : `${workbook.label} · ${tab.tabName}`,
    sourceKind: isTeacherAllocations ? "Relationship registry" : "Registry tab",
    status: tab.safeBootstrapEligibility === "none" ? "deferred" : tab.safeBootstrapEligibility,
    sourceLabel: workbook.label,
    description: isTeacherAllocations
      ? `${tab.tabName} in ${workbook.label} is a relationship/allocation registry for staffing, class, section, and subject ownership.`
      : `${tab.tabName} in ${workbook.label} with ${tab.requiredHeaders.length} required header${tab.requiredHeaders.length === 1 ? "" : "s"}.`,
    group: workbook.label,
    pageRoute,
    dataRoute: getRegistryDataRoute(registryId),
    workbookLabel: workbook.label,
    spreadsheetKey: tab.spreadsheetKey,
    tabName: tab.tabName,
    primaryKeyColumn: tab.primaryKeyColumn,
    safeBootstrapEligibility: tab.safeBootstrapEligibility,
    writebackAllowed: tab.writebackAllowed,
    operationalDataForbidden: tab.operationalDataForbidden,
    requiredHeaders: tab.requiredHeaders,
    optionalHeaders: tab.optionalHeaders,
    capabilitySummary: isTeacherAllocations
      ? `${tab.primaryKeyColumn} · relationship/allocation registry · ${tab.writebackAllowed ? "writeback allowed" : "read-only"}`
      : `${tab.primaryKeyColumn} · ${tab.writebackAllowed ? "writeback allowed" : "read-only"} · ${tab.operationalDataForbidden ? "operational data forbidden" : "operational data allowed"}`,
    canonicalRegistryName: tab.spreadsheetLabel,
    discoveryNotes: tab.safeBootstrapEligibility === "safe_first_batch"
      ? "Safe first batch tab from the registry schema."
      : tab.safeBootstrapEligibility === "selective_review"
        ? isTeacherAllocations
          ? "Relationship/allocation registry tab from the master registry. Keep it separate from Staff Directory and teacher views."
          : "Selective-review tab from the registry schema."
        : tab.safeBootstrapEligibility === "later_only"
          ? "Deferred until the related workflow is safely wired."
          : "Deferred registry tab with no bootstrap coverage yet.",
    firstClassPageEnabled: Boolean(pageRoute),
    drillThroughEnabled: Boolean(pageRoute),
  };
}

const REGISTRY_EXPLORER_ROWS: RegistryExplorerRow[] = [
  ...REGISTRY_CATALOG.map(mapCatalogEntry),
  ...REGISTRY_SCHEMA.flatMap((workbook) => workbook.tabs.map((tab) => mapSchemaTab(workbook, tab))),
];

const REGISTRY_EXPLORER_BY_ID = new Map(REGISTRY_EXPLORER_ROWS.map((row) => [row.registryId, row] as const));

function renderRegistryRouteLabel(row: RegistryExplorerRow): React.ReactNode {
  const label = row.derivedFromRegistryId
    ? "Derived page"
    : row.sourceKind === "Relationship registry"
      ? "Relationship registry"
    : row.pageRoute
      ? "First-class page"
      : "Universal registry route";

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
      {label}
    </span>
  );
}

export function getRegistryExplorerRows(): RegistryExplorerRow[] {
  return REGISTRY_EXPLORER_ROWS;
}

export function getRegistryExplorerRow(registryId: string): RegistryExplorerRow | undefined {
  return REGISTRY_EXPLORER_BY_ID.get(String(registryId || "").trim());
}

export function getRegistryExplorerSummary(rows: RegistryExplorerRow[] = REGISTRY_EXPLORER_ROWS): RegistryExplorerSummary {
  return {
    totalEntries: rows.length,
    canonicalPageEntries: rows.filter((row) => row.sourceKind === "First-class page").length,
    derivedViewEntries: rows.filter((row) => row.sourceKind === "Derived view").length,
    relationshipEntries: rows.filter((row) => row.sourceKind === "Relationship registry").length,
    registryTabEntries: rows.filter((row) => row.sourceKind === "Registry tab").length,
    embeddedSurfaceEntries: rows.filter((row) => row.sourceKind === "Embedded surface").length,
    sourceUnavailableEntries: rows.filter((row) => row.status === "deferred" || row.status === "none").length,
  };
}

export function getRegistryDataRouteForRow(row: RegistryExplorerRow): string {
  return row.dataRoute;
}

export function getRegistryPageRouteForRow(row: RegistryExplorerRow): string | undefined {
  return row.pageRoute;
}

export function createRegistryExplorerEntityDefinition(
  onOpenPageRoute?: (row: RegistryExplorerRow) => void,
  onOpenDataRoute?: (row: RegistryExplorerRow) => void,
): GenericEntityDefinition<RegistryExplorerRow> {
  const fields: GenericEntityFieldDefinition<RegistryExplorerRow>[] = [
    {
      key: "displayName",
      label: "Registry",
      type: "text",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      sortable: true,
      filterable: true,
      maxListChars: 60,
    },
    {
      key: "sourceKind",
      label: "Kind",
      type: "badge",
      listVisible: true,
      detailVisible: true,
      filterable: true,
      sortable: true,
      getBadgeVariant: (row) =>
        row.sourceKind === "Derived view"
          ? "info"
          : row.sourceKind === "Relationship registry"
            ? "warning"
          : row.pageRoute
            ? "success"
            : row.sourceKind === "Registry tab"
              ? "warning"
              : "info",
    },
    {
      key: "status",
      label: "Status",
      type: "badge",
      listVisible: true,
      detailVisible: true,
      filterable: true,
      sortable: true,
      getBadgeVariant: (row) => {
        if (row.status === "active" || row.status === "safe_first_batch") return "success";
        if (row.status === "selective_review") return "warning";
        if (row.status === "later_only" || row.status === "deferred") return "danger";
        return "info";
      },
    },
    {
      key: "sourceLabel",
      label: "Source",
      type: "text",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      sortable: true,
      maxListChars: 64,
    },
    {
      key: "pageRoute",
      label: "First-Class Page",
      type: "link",
      listVisible: true,
      detailVisible: true,
      renderListValue: (row) => row.pageRoute ? renderRegistryRouteLabel(row) : <span className="text-slate-350">Not mapped</span>,
      renderDetailValue: (row) => row.pageRoute || <span className="text-slate-400 italic">No first-class page mapped.</span>,
    },
    {
      key: "dataRoute",
      label: "Data Route",
      type: "link",
      listVisible: true,
      detailVisible: true,
      searchable: true,
      sortable: true,
      renderListValue: () => <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Open route</span>,
    },
    {
      key: "group",
      label: "Group",
      type: "text",
      listVisible: true,
      detailVisible: true,
      filterable: true,
      sortable: true,
      searchable: true,
    },
    {
      key: "workbookLabel",
      label: "Workbook",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      sortable: true,
      maxListChars: 80,
    },
    {
      key: "tabName",
      label: "Tab",
      type: "text",
      listVisible: false,
      detailVisible: true,
      searchable: true,
      sortable: true,
    },
    {
      key: "primaryKeyColumn",
      label: "Primary Key",
      type: "text",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "safeBootstrapEligibility",
      label: "Bootstrap Safety",
      type: "badge",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "writebackAllowed",
      label: "Writeback Allowed",
      type: "boolean",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "operationalDataForbidden",
      label: "Operational Data Forbidden",
      type: "boolean",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "capabilitySummary",
      label: "Capability Summary",
      type: "longText",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "description",
      label: "Description",
      type: "longText",
      listVisible: false,
      detailVisible: true,
    },
    {
      key: "discoveryNotes",
      label: "Discovery Notes",
      type: "longText",
      listVisible: false,
      detailVisible: true,
    },
  ];

  const actions: GenericEntityActionDefinition<RegistryExplorerRow>[] = [
    {
      id: "open-data-route",
      label: "Open Data Route",
      placement: "detail",
      variant: "primary",
      onClick: (row) => onOpenDataRoute?.(row),
    },
    {
      id: "open-page-route",
      label: "Open First-Class Page",
      placement: "detail",
      variant: "secondary",
      hidden: (row) => !row.pageRoute,
      onClick: (row) => onOpenPageRoute?.(row),
    },
  ];

  return {
    entityName: "Registry",
    entityNamePlural: "Explorer entries",
    description: "Explore the Schooly registry catalog, including canonical registry pages, derived views, relationship registries, schema tabs, and embedded surfaces, and open each entry either through its first-class page or the universal data route.",
    getId: (row) => row.registryId,
    getTitle: (row) => row.displayName,
    getSubtitle: (row) => row.sourceLabel,
    getSummary: (row) => row.description,
    fields,
    sections: [
      {
        id: "overview",
        title: "Overview",
        fields: ["displayName", "sourceKind", "status", "group"],
      },
      {
        id: "routes",
        title: "Routes",
        fields: ["pageRoute", "dataRoute"],
      },
      {
        id: "schema",
        title: "Schema",
        fields: ["workbookLabel", "tabName", "primaryKeyColumn", "safeBootstrapEligibility", "writebackAllowed", "operationalDataForbidden"],
      },
      {
        id: "capability",
        title: "Capability Notes",
        fields: ["capabilitySummary", "description", "discoveryNotes"],
      },
    ],
    actions,
    searchPlaceholder: "Search explorer entries, tabs, workbook names, routes, or status",
    emptyTitle: "No explorer entries found.",
    emptyDescription: "The registry explorer is waiting for the catalog to load.",
    defaultDisplayMode: "table",
    defaultPageSize: 20,
  };
}
