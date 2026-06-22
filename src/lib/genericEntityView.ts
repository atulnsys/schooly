import type { ReactNode } from "react";
import { compareClassLabels } from "./classSort";

export type GenericEntityFieldType =
  | "text"
  | "longText"
  | "number"
  | "currency"
  | "percentage"
  | "identifier"
  | "status"
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
  tableVisibleByDefault?: boolean;
  tableRequired?: boolean;
  tableRole?: "identity" | "data" | "action";
  tablePriority?: number;
  tableMinWidth?: number;
  tableMaxWidth?: number;
  tableWidth?: number;
  tableAlign?: "left" | "center" | "right";
  tableWrap?: "wrap" | "truncate";
  tablePinnable?: boolean;
  tableHideable?: boolean;
  tableLabel?: string;

  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  required?: boolean;
  getSortValue?: (row: T) => unknown;
  format?: {
    currency?: string;
    unit?: string;
    precision?: number;
    percentageScale?: "fraction" | "whole";
  };

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
  return `${value.slice(0, maxChars).trim()}...`;
}

function normalizeSortText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map((item) => normalizeSortText(item)).join(" ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function formatNumberValue(value: unknown, precision = 0, useGrouping = true): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
    useGrouping,
  }).format(numeric);
}

function formatPercentageValue(
  value: unknown,
  precision = 1,
  percentageScale: "fraction" | "whole" = "fraction",
): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  const percentageValue = percentageScale === "fraction" ? numeric * 100 : numeric;
  return `${formatNumberValue(percentageValue, precision)}%`;
}

function formatCurrencyValue(value: unknown, currency = "USD", precision = 0): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: precision,
      minimumFractionDigits: precision,
    }).format(numeric);
  } catch {
    return `${currency} ${formatNumberValue(numeric, precision)}`;
  }
}

function formatIdentifierValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value);
}

function isLikelyClassLabel(value: unknown): boolean {
  const text = normalizeSortText(value).toLowerCase();
  return /\bclass\b/.test(text) || /^c(?:lass)?\s*(?:[ivx]+|\d+)/i.test(text);
}

function compareGenericText(left: unknown, right: unknown): number {
  const leftText = normalizeSortText(left);
  const rightText = normalizeSortText(right);
  if (isLikelyClassLabel(leftText) && isLikelyClassLabel(rightText)) {
    return compareClassLabels(leftText, rightText);
  }
  return leftText.localeCompare(rightText, undefined, { sensitivity: "base", numeric: true });
}

function compareGenericSortValues(left: unknown, right: unknown): number {
  const leftBlank = left === null || left === undefined || left === "";
  const rightBlank = right === null || right === undefined || right === "";
  if (leftBlank && rightBlank) return 0;
  if (leftBlank) return 1;
  if (rightBlank) return -1;

  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  const leftDate = new Date(String(left));
  const rightDate = new Date(String(right));
  if (!Number.isNaN(leftDate.getTime()) && !Number.isNaN(rightDate.getTime())) {
    return leftDate.getTime() - rightDate.getTime();
  }

  const leftNumeric = Number(left);
  const rightNumeric = Number(right);
  if (Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric)) {
    return leftNumeric - rightNumeric;
  }

  return compareGenericText(left, right);
}

export function formatGenericFieldValue<T extends object>(
  row: T,
  field: GenericEntityFieldDefinition<T>,
): string {
  if (field.renderListValue) {
    const rendered = field.renderListValue(row);
    if (typeof rendered === "string") return rendered;
    if (typeof rendered === "number") return String(rendered);
    return normalizeSortText(rendered);
  }

  const value = getGenericFieldValue(row, field);
  if (value === null || value === undefined || value === "") return "—";

  if (field.type === "date") return formatGenericDate(value, false);
  if (field.type === "datetime") return formatGenericDate(value, true);
  if (field.type === "boolean") return value ? "Yes" : "No";
  if (field.type === "number") return formatNumberValue(value, field.format?.precision ?? 0, true);
  if (field.type === "currency") return formatCurrencyValue(value, field.format?.currency ?? "USD", field.format?.precision ?? 0);
  if (field.type === "percentage") {
    const scale = field.format?.percentageScale ?? (Number(value) > 1 ? "whole" : "fraction");
    return formatPercentageValue(value, field.format?.precision ?? 1, scale);
  }
  if (field.type === "identifier") return formatIdentifierValue(value);
  if (field.type === "status") return String(value);
  if (field.type === "tags" && Array.isArray(value)) return value.map(String).join(", ");
  if (field.type === "badge") return String(value);
  if (field.type === "longText") return truncateGenericText(String(value), field.maxListChars ?? 140);
  if (field.type === "custom" && typeof value !== "string") return normalizeSortText(value);

  const text = String(value);
  if (field.format?.unit) return `${text} ${field.format.unit}`;
  return truncateGenericText(text, field.maxListChars ?? 140);
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

  return Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));
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
    const aValue = field.getSortValue?.(a) ?? getGenericFieldValue(a, field);
    const bValue = field.getSortValue?.(b) ?? getGenericFieldValue(b, field);
    const comparison = compareGenericSortValues(aValue, bValue);
    if (comparison !== 0) return comparison * directionMultiplier;

    const aId = definition.getId(a);
    const bId = definition.getId(b);
    return compareGenericText(aId, bId);
  });
}
