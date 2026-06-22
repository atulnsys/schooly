import type {
  GenericEntityDefinition,
  GenericEntityDensity,
  GenericEntityDisplayMode,
  GenericEntityFilterState,
  GenericEntityFieldDefinition,
  GenericEntityPermissionContext,
  GenericEntitySortState,
} from "./genericEntityView";
import { getVisibleGenericFields } from "./genericEntityView";

export const GENERIC_ENTITY_TABLE_SCHEMA_VERSION = 1;
export const GENERIC_ENTITY_SAVED_VIEW_SCHEMA_VERSION = 1;

const SESSION_STORAGE_PREFIX = "schooly_generic_entity_table_session_v1";
const SAVED_VIEW_STORAGE_PREFIX = "schooly_generic_entity_table_views_v1";

export type GenericEntitySavedViewSource = "system" | "private";
export type GenericEntitySavedViewVisibility = "private";

export interface GenericEntityStorageContext {
  currentUser?: string | null;
  currentRole?: string | null;
  workspaceUrl?: string | null;
  account?: string | null;
  schoolId?: string | null;
}

export interface GenericEntityTablePreferences {
  schemaVersion: typeof GENERIC_ENTITY_TABLE_SCHEMA_VERSION;
  namespace: string;
  visibleFieldKeys: string[];
  fieldOrder: string[];
  density: GenericEntityDensity;
  columnWidths: Record<string, number>;
  pinnedFieldKeys: string[];
  updatedAt: string;
}

export interface GenericEntityTableSnapshot {
  search: string;
  filters: GenericEntityFilterState;
  sortState: GenericEntitySortState | null;
  displayMode: GenericEntityDisplayMode;
  pageSize: number;
  preferences: GenericEntityTablePreferences;
  selectedRowId?: string | null;
}

export interface GenericEntitySavedView {
  id: string;
  name: string;
  entityNamespace: string;
  visibility: GenericEntitySavedViewVisibility;
  ownerId?: string | null;
  source: GenericEntitySavedViewSource;
  isDefault: boolean;
  schemaVersion: typeof GENERIC_ENTITY_SAVED_VIEW_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  search: string;
  filters: GenericEntityFilterState;
  sort: GenericEntitySortState | null;
  displayMode: GenericEntityDisplayMode;
  pageSize: number;
  visibleFieldKeys: string[];
  fieldOrder: string[];
  density: GenericEntityDensity;
  columnWidths: Record<string, number>;
  pinnedFieldKeys: string[];
}

function normalizeText(value: string | null | undefined): string {
  return String(value || "").trim();
}

function safeHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function readStorage(storage: Storage | null | undefined, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage | null | undefined, key: string, value: string): void {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore browser storage restrictions.
  }
}

function removeStorage(storage: Storage | null | undefined, key: string): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore browser storage restrictions.
  }
}

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function uniqueKeys(keys: string[]): string[] {
  return Array.from(new Set(keys.filter(Boolean)));
}

function getFieldKey(field: GenericEntityFieldDefinition<object>): string {
  return String(field.key);
}

function isFieldVisibleByDefault(field: GenericEntityFieldDefinition<object>): boolean {
  if (field.tableRole === "action") return false;
  if (field.tableVisibleByDefault === false) return false;
  if (field.listVisible === false) return false;
  return true;
}

function isFieldMandatory(field: GenericEntityFieldDefinition<object>): boolean {
  return Boolean(field.tableRequired || field.required || field.tableRole === "identity" || field.tableHideable === false);
}

function isFieldPinnable(field: GenericEntityFieldDefinition<object>): boolean {
  if (field.tableRole === "action") return false;
  if (field.tablePinnable === false) return false;
  return true;
}

function getDefaultColumnWidth(field: GenericEntityFieldDefinition<object>): number {
  const minWidth = Math.max(96, field.tableMinWidth ?? 96);
  if (field.tableWidth && Number.isFinite(field.tableWidth)) {
    return Math.max(minWidth, Math.round(field.tableWidth));
  }

  switch (field.type) {
    case "longText":
      return Math.max(minWidth, 240);
    case "date":
    case "datetime":
      return Math.max(minWidth, 140);
    case "number":
    case "currency":
    case "percentage":
    case "identifier":
      return Math.max(minWidth, 120);
    case "badge":
    case "status":
      return Math.max(minWidth, 132);
    case "link":
      return Math.max(minWidth, 180);
    case "tags":
      return Math.max(minWidth, 200);
    default:
      return Math.max(minWidth, 160);
  }
}

function getFieldWidthBounds(field: GenericEntityFieldDefinition<object>): { minWidth: number; maxWidth: number } {
  const minWidth = Math.max(96, field.tableMinWidth ?? 96);
  const defaultWidth = getDefaultColumnWidth(field);
  const maxWidth = Math.max(defaultWidth, field.tableMaxWidth ?? Math.max(defaultWidth, minWidth + 48));
  return { minWidth, maxWidth };
}

function normalizeColumnWidth(field: GenericEntityFieldDefinition<object>, width: unknown): number | null {
  const numeric = Number(width);
  if (!Number.isFinite(numeric)) return null;

  const rounded = Math.round(numeric);
  const { minWidth, maxWidth } = getFieldWidthBounds(field);
  if (rounded < minWidth || rounded > maxWidth) return null;
  return rounded;
}

function getAccessibleListFields<T extends object>(
  definition: GenericEntityDefinition<T>,
  context?: GenericEntityPermissionContext,
): GenericEntityFieldDefinition<T>[] {
  return getVisibleGenericFields(null, definition.fields, "list", context)
    .filter((field) => field.tableRole !== "action");
}

function sortFieldsByPriority<T extends object>(fields: GenericEntityFieldDefinition<T>[]): GenericEntityFieldDefinition<T>[] {
  return fields
    .map((field, index) => ({
      field,
      index,
      priority: Number.isFinite(Number(field.tablePriority)) ? Number(field.tablePriority) : Number.MAX_SAFE_INTEGER,
    }))
    .sort((left, right) => {
      if (left.priority !== right.priority) return left.priority - right.priority;
      return left.index - right.index;
    })
    .map((entry) => entry.field);
}

function normalizeFieldKeyList(keys: unknown, allowedKeys: string[]): string[] {
  if (!Array.isArray(keys)) return [];
  const allowed = new Set(allowedKeys);
  return uniqueKeys(
    keys
      .map((key) => String(key || "").trim())
      .filter((key) => key && allowed.has(key)),
  );
}

function normalizeFilterState(filters: unknown, allowedKeys: string[]): GenericEntityFilterState {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) return {};
  const allowed = new Set(allowedKeys);
  return Object.entries(filters as Record<string, unknown>).reduce<GenericEntityFilterState>((acc, [key, value]) => {
    const trimmedKey = String(key || "").trim();
    const trimmedValue = String(value || "").trim();
    if (!trimmedKey || !allowed.has(trimmedKey) || !trimmedValue || trimmedValue === "All") return acc;
    acc[trimmedKey] = trimmedValue;
    return acc;
  }, {});
}

function appendMissingFieldKeys(orderedKeys: string[], allKeys: string[]): string[] {
  const next = [...orderedKeys];
  const existing = new Set(next);
  allKeys.forEach((key) => {
    if (!existing.has(key)) {
      existing.add(key);
      next.push(key);
    }
  });
  return next;
}

function readEnvelope<T>(storage: Storage | null | undefined, key: string): T | null {
  const parsed = parseJson<{ schemaVersion?: number; payload?: T }>(readStorage(storage, key));
  if (!parsed || typeof parsed !== "object" || typeof parsed.schemaVersion !== "number") return null;
  return (parsed.payload ?? null) as T | null;
}

function writeEnvelope<T>(storage: Storage | null | undefined, key: string, payload: T): void {
  writeStorage(storage, key, JSON.stringify({ schemaVersion: 1, payload }));
}

function normalizeSortText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map((item) => normalizeSortText(item)).join(" ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

export function getGenericEntityStorageScopeKey(
  namespace: string,
  context?: GenericEntityStorageContext,
): string {
  const scopeValue = [
    normalizeText(namespace),
    normalizeText(context?.currentUser),
    normalizeText(context?.currentRole),
    normalizeText(context?.workspaceUrl),
    normalizeText(context?.account),
    normalizeText(context?.schoolId),
  ].join("|");

  return safeHash(scopeValue);
}

export function getGenericEntitySessionStorageKey(
  namespace: string,
  context?: GenericEntityStorageContext,
): string {
  return `${SESSION_STORAGE_PREFIX}:${normalizeText(namespace)}:${getGenericEntityStorageScopeKey(namespace, context)}`;
}

export function getGenericEntitySavedViewStorageKey(
  namespace: string,
  context?: GenericEntityStorageContext,
): string {
  return `${SAVED_VIEW_STORAGE_PREFIX}:${normalizeText(namespace)}:${getGenericEntityStorageScopeKey(namespace, context)}`;
}

export function buildDefaultGenericEntityTablePreferences<T extends object>(
  namespace: string,
  definition: GenericEntityDefinition<T>,
  context?: GenericEntityPermissionContext,
): GenericEntityTablePreferences {
  const fields = sortFieldsByPriority(
    getAccessibleListFields(definition, context).map((field) => field as GenericEntityFieldDefinition<object>),
  );
  const allowedKeys = fields.map((field) => getFieldKey(field));
  const visibleFieldKeys = fields
    .filter((field) => isFieldVisibleByDefault(field) || isFieldMandatory(field))
    .map((field) => getFieldKey(field));

  const columnWidths = fields.reduce<Record<string, number>>((acc, field) => {
    acc[getFieldKey(field)] = getDefaultColumnWidth(field);
    return acc;
  }, {});

  return {
    schemaVersion: GENERIC_ENTITY_TABLE_SCHEMA_VERSION,
    namespace,
    visibleFieldKeys: uniqueKeys(visibleFieldKeys),
    fieldOrder: uniqueKeys(allowedKeys),
    density: definition.defaultDensity ?? "comfortable",
    columnWidths,
    pinnedFieldKeys: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeGenericEntityTablePreferences<T extends object>(
  namespace: string,
  preferences: Partial<GenericEntityTablePreferences> | null | undefined,
  definition: GenericEntityDefinition<T>,
  context?: GenericEntityPermissionContext,
): GenericEntityTablePreferences {
  const fields = sortFieldsByPriority(
    getAccessibleListFields(definition, context).map((field) => field as GenericEntityFieldDefinition<object>),
  );
  const allowedKeys = fields.map((field) => getFieldKey(field));
  const fieldByKey = new Map(fields.map((field) => [getFieldKey(field), field] as const));
  const defaultPreferences = buildDefaultGenericEntityTablePreferences(namespace, definition, context);

  const storedFieldOrder = normalizeFieldKeyList(preferences?.fieldOrder, allowedKeys);
  const normalizedFieldOrder = uniqueKeys(
    storedFieldOrder.length > 0
      ? appendMissingFieldKeys(storedFieldOrder, allowedKeys)
      : defaultPreferences.fieldOrder,
  );

  const storedVisibleKeys = normalizeFieldKeyList(preferences?.visibleFieldKeys, allowedKeys);
  const visibleSourceKeys = storedVisibleKeys.length > 0 ? storedVisibleKeys : defaultPreferences.visibleFieldKeys;
  const mandatoryKeys = new Set(
    fields
      .filter((field) => isFieldMandatory(field))
      .map((field) => getFieldKey(field)),
  );

  const normalizedVisibleKeys = normalizedFieldOrder.filter((key) => {
    const field = fieldByKey.get(key);
    return Boolean(field && (visibleSourceKeys.includes(key) || mandatoryKeys.has(key)));
  });

  const normalizedPinnedKeys = uniqueKeys(
    normalizeFieldKeyList(preferences?.pinnedFieldKeys, allowedKeys).filter((key) => {
      const field = fieldByKey.get(key);
      return Boolean(field && isFieldPinnable(field) && normalizedVisibleKeys.includes(key));
    }),
  );

  const columnWidths = Object.entries(preferences?.columnWidths || {}).reduce<Record<string, number>>((acc, [key, width]) => {
    const field = fieldByKey.get(key);
    if (!field) return acc;
    const normalizedWidth = normalizeColumnWidth(field, width);
    if (normalizedWidth === null) return acc;
    acc[key] = normalizedWidth;
    return acc;
  }, {});

  fields.forEach((field) => {
    const key = getFieldKey(field);
    if (columnWidths[key] === undefined) {
      columnWidths[key] = getDefaultColumnWidth(field);
    }
  });

  return {
    schemaVersion: GENERIC_ENTITY_TABLE_SCHEMA_VERSION,
    namespace,
    visibleFieldKeys: normalizedVisibleKeys.length > 0 ? normalizedVisibleKeys : defaultPreferences.visibleFieldKeys,
    fieldOrder: normalizedFieldOrder,
    density: preferences?.density === "compact" ? "compact" : preferences?.density === "comfortable" ? "comfortable" : defaultPreferences.density,
    columnWidths,
    pinnedFieldKeys: normalizedPinnedKeys,
    updatedAt: typeof preferences?.updatedAt === "string" ? preferences.updatedAt : defaultPreferences.updatedAt,
  };
}

export function loadGenericEntityTablePreferences<T extends object>(
  namespace: string,
  definition: GenericEntityDefinition<T>,
  context?: GenericEntityPermissionContext,
  storage?: Storage | null,
  storageContext?: GenericEntityStorageContext,
): GenericEntityTablePreferences {
  const fallback = buildDefaultGenericEntityTablePreferences(namespace, definition, context);
  const key = getGenericEntitySessionStorageKey(namespace, storageContext);
  const parsed = readEnvelope<Partial<GenericEntityTablePreferences>>(storage ?? null, key);
  if (!parsed) return fallback;
  return normalizeGenericEntityTablePreferences(namespace, parsed, definition, context);
}

export function saveGenericEntityTablePreferences(
  namespace: string,
  preferences: GenericEntityTablePreferences,
  storage?: Storage | null,
  storageContext?: GenericEntityStorageContext,
): void {
  const key = getGenericEntitySessionStorageKey(namespace, storageContext);
  writeEnvelope(storage ?? null, key, preferences);
}

export function clearGenericEntityTablePreferences(
  namespace: string,
  storage?: Storage | null,
  storageContext?: GenericEntityStorageContext,
): void {
  removeStorage(storage ?? null, getGenericEntitySessionStorageKey(namespace, storageContext));
}

export function loadGenericEntityTableSnapshot<T extends object>(
  namespace: string,
  definition: GenericEntityDefinition<T>,
  context?: GenericEntityPermissionContext,
  storage?: Storage | null,
  storageContext?: GenericEntityStorageContext,
): GenericEntityTableSnapshot | null {
  const key = getGenericEntitySessionStorageKey(namespace, storageContext);
  const parsed = readEnvelope<Partial<GenericEntityTableSnapshot>>(storage ?? null, key);
  if (!parsed) return null;
  const allowedFilterKeys = getAccessibleListFields(definition, context)
    .filter((field) => field.filterable)
    .map((field) => getFieldKey(field as GenericEntityFieldDefinition<object>));

  const preferences = normalizeGenericEntityTablePreferences(
    namespace,
    parsed.preferences,
    definition,
    context,
  );

  return {
    search: normalizeText(parsed.search),
    filters: normalizeFilterState(parsed.filters, allowedFilterKeys),
    sortState: parsed.sortState ?? null,
    displayMode: parsed.displayMode === "table" ? "table" : "cards",
    pageSize: Number.isFinite(Number(parsed.pageSize)) && Number(parsed.pageSize) > 0 ? Math.max(1, Math.round(Number(parsed.pageSize))) : definition.defaultPageSize ?? 20,
    preferences,
    selectedRowId: typeof parsed.selectedRowId === "string" ? parsed.selectedRowId : null,
  };
}

export function saveGenericEntityTableSnapshot(
  namespace: string,
  snapshot: GenericEntityTableSnapshot,
  storage?: Storage | null,
  storageContext?: GenericEntityStorageContext,
): void {
  const key = getGenericEntitySessionStorageKey(namespace, storageContext);
  writeEnvelope(storage ?? null, key, snapshot);
}

export function normalizeGenericEntitySavedView<T extends object>(
  namespace: string,
  view: Partial<GenericEntitySavedView> | null | undefined,
  definition: GenericEntityDefinition<T>,
  context?: GenericEntityPermissionContext,
): GenericEntitySavedView | null {
  if (!view || typeof view !== "object") return null;
  const allowedFilterKeys = getAccessibleListFields(definition, context)
    .filter((field) => field.filterable)
    .map((field) => getFieldKey(field as GenericEntityFieldDefinition<object>));

  const preferences = normalizeGenericEntityTablePreferences(
    namespace,
    {
      schemaVersion: GENERIC_ENTITY_TABLE_SCHEMA_VERSION,
      namespace,
      visibleFieldKeys: view.visibleFieldKeys || [],
      fieldOrder: view.fieldOrder || [],
      density: view.density,
      columnWidths: view.columnWidths || {},
      pinnedFieldKeys: view.pinnedFieldKeys || [],
      updatedAt: view.updatedAt || new Date().toISOString(),
    },
    definition,
    context,
  );

  const name = normalizeText(view.name) || "Untitled view";
  const id = normalizeText(view.id) || `view_${safeHash(`${namespace}:${name}:${view.createdAt || view.updatedAt || new Date().toISOString()}`)}`;
  const createdAt = normalizeText(view.createdAt) || new Date().toISOString();
  const updatedAt = normalizeText(view.updatedAt) || createdAt;

  return {
    id,
    name,
    entityNamespace: namespace,
    visibility: "private",
    ownerId: view.ownerId ?? null,
    source: view.source === "system" ? "system" : "private",
    isDefault: Boolean(view.isDefault),
    schemaVersion: GENERIC_ENTITY_SAVED_VIEW_SCHEMA_VERSION,
    createdAt,
    updatedAt,
    search: normalizeText(view.search),
    filters: normalizeFilterState(view.filters, allowedFilterKeys),
    sort: view.sort ?? null,
    displayMode: view.displayMode === "table" ? "table" : "cards",
    pageSize: Number.isFinite(Number(view.pageSize)) && Number(view.pageSize) > 0 ? Math.max(1, Math.round(Number(view.pageSize))) : definition.defaultPageSize ?? 20,
    visibleFieldKeys: preferences.visibleFieldKeys,
    fieldOrder: preferences.fieldOrder,
    density: preferences.density,
    columnWidths: preferences.columnWidths,
    pinnedFieldKeys: preferences.pinnedFieldKeys,
  };
}

export function loadGenericEntitySavedViews<T extends object>(
  namespace: string,
  definition: GenericEntityDefinition<T>,
  context?: GenericEntityPermissionContext,
  storage?: Storage | null,
  storageContext?: GenericEntityStorageContext,
): GenericEntitySavedView[] {
  const key = getGenericEntitySavedViewStorageKey(namespace, storageContext);
  const parsed = readEnvelope<GenericEntitySavedView[]>(storage ?? null, key);
  if (!Array.isArray(parsed)) return [];

  const normalized = parsed
    .map((view) => normalizeGenericEntitySavedView(namespace, view, definition, context))
    .filter((view): view is GenericEntitySavedView => Boolean(view));

  const defaultIndex = normalized.findIndex((view) => view.isDefault);
  if (defaultIndex > -1) {
    return normalized.map((view, index) => ({
      ...view,
      isDefault: index === defaultIndex,
    }));
  }

  return normalized;
}

export function saveGenericEntitySavedViews(
  namespace: string,
  views: GenericEntitySavedView[],
  storage?: Storage | null,
  storageContext?: GenericEntityStorageContext,
): void {
  const key = getGenericEntitySavedViewStorageKey(namespace, storageContext);
  writeEnvelope(storage ?? null, key, views);
}

export function clearGenericEntitySavedViews(
  namespace: string,
  storage?: Storage | null,
  storageContext?: GenericEntityStorageContext,
): void {
  removeStorage(storage ?? null, getGenericEntitySavedViewStorageKey(namespace, storageContext));
}

export function createGenericEntityTableSnapshot(
  search: string,
  filters: GenericEntityFilterState,
  sortState: GenericEntitySortState | null,
  displayMode: GenericEntityDisplayMode,
  pageSize: number,
  preferences: GenericEntityTablePreferences,
): GenericEntityTableSnapshot {
  return {
    search: normalizeText(search),
    filters: { ...filters },
    sortState,
    displayMode,
    pageSize,
    preferences: {
      ...preferences,
      visibleFieldKeys: [...preferences.visibleFieldKeys],
      fieldOrder: [...preferences.fieldOrder],
      columnWidths: { ...preferences.columnWidths },
      pinnedFieldKeys: [...preferences.pinnedFieldKeys],
    },
  };
}

export function createGenericEntitySavedViewSnapshot(
  namespace: string,
  name: string,
  snapshot: GenericEntityTableSnapshot,
  options: {
    ownerId?: string | null;
    source?: GenericEntitySavedViewSource;
    isDefault?: boolean;
    id?: string;
    createdAt?: string;
  } = {},
): GenericEntitySavedView {
  const timestamp = new Date().toISOString();
  const createdAt = options.createdAt || timestamp;

  return {
    id: options.id || `view_${safeHash(`${namespace}:${name}:${timestamp}`)}`,
    name: normalizeText(name) || "Untitled view",
    entityNamespace: namespace,
    visibility: "private",
    ownerId: options.ownerId ?? null,
    source: options.source || "private",
    isDefault: Boolean(options.isDefault),
    schemaVersion: GENERIC_ENTITY_SAVED_VIEW_SCHEMA_VERSION,
    createdAt,
    updatedAt: timestamp,
    search: normalizeText(snapshot.search),
    filters: snapshot.filters || {},
    sort: snapshot.sortState,
    displayMode: snapshot.displayMode,
    pageSize: snapshot.pageSize,
    visibleFieldKeys: snapshot.preferences.visibleFieldKeys,
    fieldOrder: snapshot.preferences.fieldOrder,
    density: snapshot.preferences.density,
    columnWidths: snapshot.preferences.columnWidths,
    pinnedFieldKeys: snapshot.preferences.pinnedFieldKeys,
  };
}

export function areGenericEntityTableSnapshotsEqual(
  left: GenericEntityTableSnapshot,
  right: GenericEntityTableSnapshot,
): boolean {
  return JSON.stringify({
    search: normalizeText(left.search),
    filters: left.filters,
    sortState: left.sortState,
    displayMode: left.displayMode,
    pageSize: left.pageSize,
    preferences: {
      visibleFieldKeys: left.preferences.visibleFieldKeys,
      fieldOrder: left.preferences.fieldOrder,
      density: left.preferences.density,
      columnWidths: left.preferences.columnWidths,
      pinnedFieldKeys: left.preferences.pinnedFieldKeys,
    },
  }) === JSON.stringify({
    search: normalizeText(right.search),
    filters: right.filters,
    sortState: right.sortState,
    displayMode: right.displayMode,
    pageSize: right.pageSize,
    preferences: {
      visibleFieldKeys: right.preferences.visibleFieldKeys,
      fieldOrder: right.preferences.fieldOrder,
      density: right.preferences.density,
      columnWidths: right.preferences.columnWidths,
      pinnedFieldKeys: right.preferences.pinnedFieldKeys,
    },
  });
}
