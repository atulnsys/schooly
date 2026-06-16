import type { ReactNode } from "react";

export type GenericEntityFieldType =
  | "text"
  | "longText"
  | "number"
  | "date"
  | "datetime"
  | "badge"
  | "tags"
  | "boolean"
  | "link"
  | "custom";

export type GenericEntityDisplayMode = "cards" | "table";
export type GenericEntityDensity = "compact" | "comfortable";
export type GenericEntityFieldKey<T extends object> = Extract<keyof T, string> | string;

export type GenericEntityIssueSeverity = "info" | "success" | "warning" | "error";
export type GenericEntityBadgeVariant = "default" | "info" | "success" | "warning" | "danger";
export type GenericEntityActionPlacement = "list" | "detail" | "both";
export type GenericEntityActionVariant = "primary" | "secondary" | "danger" | "ghost";

export interface GenericEntityPermissionContext {
  currentRole?: string;
  activeRoles?: string[];
  activeCapabilities?: string[];
}

export interface GenericEntityIssue {
  id: string;
  message: string;
  severity: GenericEntityIssueSeverity;
  fieldKey?: string;
}

export interface GenericEntityFilterState {
  [fieldKey: string]: string;
}

export interface GenericEntitySortState {
  fieldKey: string;
  direction: "asc" | "desc";
}

export interface GenericEntityFieldDefinition<T extends object> {
  key: GenericEntityFieldKey<T>;
  label: string;
  type?: GenericEntityFieldType;

  listVisible?: boolean;
  detailVisible?: boolean;

  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  required?: boolean;

  maxListChars?: number;
  className?: string;
  detailClassName?: string;

  permissions?: {
    roles?: string[];
    capabilities?: string[];
  };

  hidden?: (row: T, context?: GenericEntityPermissionContext) => boolean;

  getValue?: (row: T) => unknown;
  getFilterValue?: (row: T) => string;
  getFilterValues?: (row: T) => string[];

  getBadgeVariant?: (row: T) => GenericEntityBadgeVariant;

  renderListValue?: (row: T) => ReactNode;
  renderDetailValue?: (row: T) => ReactNode;
}

export interface GenericEntitySectionDefinition<T extends object> {
  id: string;
  title: string;
  description?: string;
  fields: GenericEntityFieldKey<T>[];
  visible?: (row: T, context?: GenericEntityPermissionContext) => boolean;
}

export interface GenericEntityActionDefinition<T extends object> {
  id: string;
  label: string;
  getLabel?: (row: T) => string;
  icon?: ReactNode;

  placement?: GenericEntityActionPlacement;
  variant?: GenericEntityActionVariant;

  permissions?: {
    roles?: string[];
    capabilities?: string[];
  };

  hidden?: (row: T, context?: GenericEntityPermissionContext) => boolean;
  disabled?: (row: T, context?: GenericEntityPermissionContext) => boolean;

  href?: string;
  getHref?: (row: T) => string | undefined;
  target?: "_blank" | "_self";

  onClick?: (row: T) => void;
}

export interface GenericEntityDefinition<T extends object> {
  entityName: string;
  entityNamePlural: string;
  description?: string;

  getId: (row: T) => string;
  getTitle: (row: T) => string;
  getSubtitle?: (row: T) => string | undefined;
  getSummary?: (row: T) => string | undefined;

  fields: GenericEntityFieldDefinition<T>[];
  sections?: GenericEntitySectionDefinition<T>[];
  actions?: GenericEntityActionDefinition<T>[];

  getRowIssues?: (row: T) => GenericEntityIssue[];

  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;

  defaultFilters?: GenericEntityFilterState;
  defaultSort?: GenericEntitySortState;
  defaultDisplayMode?: GenericEntityDisplayMode;
  defaultDensity?: GenericEntityDensity;
  defaultPageSize?: number;
}

export function hasGenericPermission(
  permissions: { roles?: string[]; capabilities?: string[] } | undefined,
  context?: GenericEntityPermissionContext,
): boolean {
  if (!permissions) return true;

  const activeRoles = new Set([
    ...(context?.activeRoles ?? []),
    ...(context?.currentRole ? [context.currentRole] : []),
  ]);

  const activeCapabilities = new Set(context?.activeCapabilities ?? []);

  const roleAllowed =
    !permissions.roles?.length ||
    permissions.roles.some((role) => activeRoles.has(role));

  const capabilityAllowed =
    !permissions.capabilities?.length ||
    permissions.capabilities.some((capability) => activeCapabilities.has(capability));

  return roleAllowed && capabilityAllowed;
}

export function getGenericFieldValue<T extends object>(
  row: T,
  field: GenericEntityFieldDefinition<T>,
): unknown {
  if (field.getValue) return field.getValue(row);

  const record = row as Record<string, unknown>;
  return record[String(field.key)];
}

export function isGenericValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function getRequiredFieldIssues<T extends object>(
  row: T,
  fields: GenericEntityFieldDefinition<T>[],
): GenericEntityIssue[] {
  return fields
    .filter((field) => field.required)
    .filter((field) => isGenericValueEmpty(getGenericFieldValue(row, field)))
    .map((field) => ({
      id: `required_${String(field.key)}`,
      fieldKey: String(field.key),
      message: `${field.label} is required.`,
      severity: "error" as const,
    }));
}

export function getAllGenericRowIssues<T extends object>(
  row: T,
  definition: GenericEntityDefinition<T>,
): GenericEntityIssue[] {
  return [
    ...getRequiredFieldIssues(row, definition.fields),
    ...(definition.getRowIssues?.(row) ?? []),
  ];
}

export function toGenericSearchString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(" ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function formatGenericDate(value: unknown, includeTime = false): string {
  if (!value) return "—";

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  return includeTime ? date.toLocaleString() : date.toLocaleDateString();
}

export function truncateGenericText(value: string, maxChars = 140): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars).trim()}…`;
}

export function getGenericFieldSearchText<T extends object>(
  row: T,
  field: GenericEntityFieldDefinition<T>,
): string {
  return toGenericSearchString(getGenericFieldValue(row, field)).toLowerCase();
}

export function getGenericFilterValues<T extends object>(
  row: T,
  field: GenericEntityFieldDefinition<T>,
): string[] {
  if (field.getFilterValues) return field.getFilterValues(row).filter(Boolean);
  if (field.getFilterValue) return [field.getFilterValue(row)].filter(Boolean);

  const value = getGenericFieldValue(row, field);

  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === null || value === undefined || value === "") return [];

  return [String(value)];
}

export function getDistinctGenericFilterOptions<T extends object>(
  rows: T[],
  field: GenericEntityFieldDefinition<T>,
): string[] {
  const values = new Set<string>();

  rows.forEach((row) => {
    getGenericFilterValues(row, field).forEach((value) => values.add(value));
  });

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export function getVisibleGenericFields<T extends object>(
  row: T | null,
  fields: GenericEntityFieldDefinition<T>[],
  mode: "list" | "detail",
  context?: GenericEntityPermissionContext,
): GenericEntityFieldDefinition<T>[] {
  return fields.filter((field) => {
    if (!hasGenericPermission(field.permissions, context)) return false;
    if (row && field.hidden?.(row, context)) return false;
    if (mode === "list" && field.listVisible === false) return false;
    if (mode === "detail" && field.detailVisible === false) return false;
    return true;
  });
}

export function filterGenericRows<T extends object>(
  rows: T[],
  definition: GenericEntityDefinition<T>,
  searchText: string,
  filterState: GenericEntityFilterState,
  context?: GenericEntityPermissionContext,
): T[] {
  const normalizedSearch = searchText.trim().toLowerCase();

  return rows.filter((row) => {
    const searchableFields = getVisibleGenericFields(row, definition.fields, "list", context)
      .filter((field) => field.searchable);

    const titleText = definition.getTitle(row).toLowerCase();
    const subtitleText = definition.getSubtitle?.(row)?.toLowerCase() ?? "";
    const summaryText = definition.getSummary?.(row)?.toLowerCase() ?? "";

    const matchesSearch =
      !normalizedSearch ||
      titleText.includes(normalizedSearch) ||
      subtitleText.includes(normalizedSearch) ||
      summaryText.includes(normalizedSearch) ||
      searchableFields.some((field) =>
        getGenericFieldSearchText(row, field).includes(normalizedSearch),
      );

    if (!matchesSearch) return false;

    const filterableFields = getVisibleGenericFields(row, definition.fields, "list", context)
      .filter((field) => field.filterable);

    return filterableFields.every((field) => {
      const selectedValue = filterState[String(field.key)];
      if (!selectedValue || selectedValue === "All") return true;

      return getGenericFilterValues(row, field).includes(selectedValue);
    });
  });
}

export function sortGenericRows<T extends object>(
  rows: T[],
  definition: GenericEntityDefinition<T>,
  sortState: GenericEntitySortState | null,
): T[] {
  if (!sortState) return rows;

  const field = definition.fields.find(
    (candidate) => String(candidate.key) === sortState.fieldKey,
  );

  if (!field) return rows;

  const directionMultiplier = sortState.direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const aValue = getGenericFieldValue(a, field);
    const bValue = getGenericFieldValue(b, field);

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (field.type === "date" || field.type === "datetime") {
      const aTime = new Date(String(aValue)).getTime();
      const bTime = new Date(String(bValue)).getTime();

      if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
        return (aTime - bTime) * directionMultiplier;
      }
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * directionMultiplier;
    }

    return String(aValue).localeCompare(String(bValue)) * directionMultiplier;
  });
}