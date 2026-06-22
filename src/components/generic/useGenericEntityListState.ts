import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GenericEntityDefinition,
  GenericEntityDisplayMode,
  GenericEntityFilterState,
  GenericEntityPermissionContext,
  GenericEntitySortState,
  GenericEntityDensity,
} from "../../lib/genericEntityView";
import {
  areGenericEntityTableSnapshotsEqual,
  buildDefaultGenericEntityTablePreferences,
  createGenericEntitySavedViewSnapshot,
  createGenericEntityTableSnapshot,
  GenericEntitySavedView,
  GenericEntityStorageContext,
  GenericEntityTablePreferences,
  GenericEntityTableSnapshot,
  loadGenericEntitySavedViews,
  loadGenericEntityTableSnapshot,
  normalizeGenericEntityTablePreferences,
  saveGenericEntitySavedViews,
  saveGenericEntityTableSnapshot,
} from "../../lib/genericEntityTableState";

export interface GenericEntityListState<T extends object> {
  searchValue: string;
  setSearchValue: (value: string) => void;
  filterValues: GenericEntityFilterState;
  setFilterValue: (fieldKey: string, value: string) => void;
  setFilterValues: (value: GenericEntityFilterState) => void;
  clearFilters: () => void;
  sortState: GenericEntitySortState | null;
  setSortState: (value: GenericEntitySortState | null) => void;
  page: number;
  setPage: (value: number) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
  displayMode: GenericEntityDisplayMode;
  setDisplayMode: (value: GenericEntityDisplayMode) => void;
  selectedRow: T | null;
  selectRow: (row: T | null) => void;
  activeFilterCount: number;
  tablePreferences: GenericEntityTablePreferences;
  setTablePreferences: (value: GenericEntityTablePreferences) => void;
  tableDirty: boolean;
  activeSavedView: GenericEntitySavedView | null;
  activeSavedViewId: string | null;
  savedViews: GenericEntitySavedView[];
  savedViewStorageMode: "browser" | "session";
  saveViewAsNew: (name: string) => void;
  updateActiveView: () => void;
  duplicateActiveView: (name?: string) => void;
  renameActiveView: (name: string) => void;
  deleteActiveView: () => void;
  setActiveView: (viewId: string | null) => void;
  setDefaultView: (viewId: string | null) => void;
  resetViewChanges: () => void;
  restoreSystemDefault: () => void;
  resetTablePreferences: () => void;
  moveTableField: (fieldKey: string, direction: -1 | 1) => void;
  toggleTableFieldVisibility: (fieldKey: string) => void;
  setTableFieldWidth: (fieldKey: string, width: number) => void;
  toggleTableFieldPin: (fieldKey: string) => void;
  setTableDensity: (density: GenericEntityDensity) => void;
}

interface InternalListState {
  search: string;
  filters: GenericEntityFilterState;
  sortState: GenericEntitySortState | null;
  page: number;
  pageSize: number;
  displayMode: GenericEntityDisplayMode;
  selectedRowId: string | null;
  tablePreferences: GenericEntityTablePreferences;
  activeSavedViewId: string | null;
}

interface UseGenericEntityListStateOptions<T extends object> {
  namespace?: string | null;
  definition: GenericEntityDefinition<T>;
  rows: T[];
  enabled?: boolean;
  storageContext?: GenericEntityStorageContext | null;
  permissionContext?: GenericEntityPermissionContext;
}

function normalizeInteger(value: string | null | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readFiltersFromParams(params: URLSearchParams, allowedKeys: string[]): GenericEntityFilterState {
  const rawValue = params.get("f");
  if (!rawValue) return {};

  const allowedKeySet = new Set(allowedKeys);
  const filters: GenericEntityFilterState = {};

  rawValue.split(",").forEach((entry) => {
    const trimmed = entry.trim();
    if (!trimmed) return;

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex <= 0) return;

    const rawKey = trimmed.slice(0, separatorIndex).trim();
    const rawFilterValue = trimmed.slice(separatorIndex + 1).trim();
    if (!rawKey || !rawFilterValue) return;

    const key = decodeURIComponent(rawKey);
    if (!allowedKeySet.has(key)) return;

    const value = decodeURIComponent(rawFilterValue);
    if (value && value !== "All") {
      filters[key] = value;
    }
  });

  return filters;
}

function serializeFilters(filters: GenericEntityFilterState): string | null {
  const entries = Object.entries(filters)
    .filter(([, value]) => Boolean(value) && value !== "All")
    .sort(([left], [right]) => left.localeCompare(right, undefined, { sensitivity: "base", numeric: true }));
  if (entries.length === 0) return null;

  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}:${encodeURIComponent(value)}`)
    .join(",");
}

function hasExplicitUrlState(params: URLSearchParams): boolean {
  return ["q", "f", "sort", "dir", "page", "size", "view", "row"].some((key) => params.has(key));
}

function snapshotFromLocation<T extends object>(
  params: URLSearchParams,
  definition: GenericEntityDefinition<T>,
  rows: T[],
  defaultDisplayMode: GenericEntityDisplayMode,
): {
  search: string;
  filters: GenericEntityFilterState;
  sortState: GenericEntitySortState | null;
  page: number;
  pageSize: number;
  displayMode: GenericEntityDisplayMode;
  selectedRowId: string | null;
} {
  const allowedFilterKeys = definition.fields
    .filter((field) => field.filterable)
    .map((field) => String(field.key));
  const sortField = params.get("sort");
  const sortFieldAllowed = sortField
    ? definition.fields.some((field) => String(field.key) === sortField && field.sortable)
    : false;

  const selectedRowId = params.get("row");
  const selectedRowAllowed = Boolean(selectedRowId && rows.some((row) => definition.getId(row) === selectedRowId));

  return {
    search: params.get("q") || "",
    filters: readFiltersFromParams(params, allowedFilterKeys),
    sortState: sortFieldAllowed
      ? {
          fieldKey: sortField,
          direction: params.get("dir") === "desc" ? "desc" : "asc",
        }
      : definition.defaultSort ?? null,
    page: normalizeInteger(params.get("page"), 1),
    pageSize: normalizeInteger(params.get("size"), definition.defaultPageSize ?? 20),
    displayMode:
      params.get("view") === "table"
        ? "table"
        : params.get("view") === "cards"
          ? "cards"
          : defaultDisplayMode,
    selectedRowId: selectedRowAllowed ? selectedRowId : null,
  };
}

function snapshotToSearchParams(
  snapshot: InternalListState,
  defaultDisplayMode: GenericEntityDisplayMode,
  currentParams: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(currentParams.toString());

  params.delete("q");
  params.delete("f");
  params.delete("sort");
  params.delete("dir");
  params.delete("page");
  params.delete("size");
  params.delete("view");
  params.delete("row");
  params.delete("sv");

  if (snapshot.search.trim()) params.set("q", snapshot.search.trim());

  const serializedFilters = serializeFilters(snapshot.filters);
  if (serializedFilters) params.set("f", serializedFilters);

  if (snapshot.sortState) {
    params.set("sort", snapshot.sortState.fieldKey);
    params.set("dir", snapshot.sortState.direction);
  }

  if (snapshot.page > 1) params.set("page", String(snapshot.page));
  if (snapshot.pageSize > 0) params.set("size", String(snapshot.pageSize));
  if (snapshot.displayMode !== defaultDisplayMode) params.set("view", snapshot.displayMode);
  if (snapshot.selectedRowId) params.set("row", snapshot.selectedRowId);
  if (snapshot.activeSavedViewId) params.set("sv", snapshot.activeSavedViewId);

  return params;
}

function createListStateFromSource<T extends object>(
  namespace: string,
  definition: GenericEntityDefinition<T>,
  rows: T[],
  defaultDisplayMode: GenericEntityDisplayMode,
  permissionContext?: GenericEntityPermissionContext,
  storageContext?: GenericEntityStorageContext | null,
): {
  state: InternalListState;
  savedViews: GenericEntitySavedView[];
  activeViewSnapshot: GenericEntityTableSnapshot | null;
} {
  const defaultPreferences = buildDefaultGenericEntityTablePreferences(namespace, definition, permissionContext);
  const defaultSnapshot = createGenericEntityTableSnapshot(
    "",
    definition.defaultFilters ?? {},
    definition.defaultSort ?? null,
    defaultDisplayMode,
    definition.defaultPageSize ?? 20,
    defaultPreferences,
  );

  if (typeof window === "undefined") {
    return {
      state: {
        search: defaultSnapshot.search,
        filters: defaultSnapshot.filters,
        sortState: defaultSnapshot.sortState,
        page: 1,
        pageSize: defaultSnapshot.pageSize,
        displayMode: defaultSnapshot.displayMode,
        selectedRowId: null,
        tablePreferences: defaultPreferences,
        activeSavedViewId: null,
      },
      savedViews: [],
      activeViewSnapshot: null,
    };
  }

  const sessionSnapshot = loadGenericEntityTableSnapshot(
    namespace,
    definition,
    permissionContext,
    window.sessionStorage,
    storageContext || undefined,
  );
  const canUsePersistentSavedViews = Boolean(storageContext?.account && storageContext?.schoolId);
  const savedViewStorage = canUsePersistentSavedViews ? window.localStorage : window.sessionStorage;
  const savedViews = loadGenericEntitySavedViews(
    namespace,
    definition,
    permissionContext,
    savedViewStorage,
    storageContext || undefined,
  );

  const urlParams = new URLSearchParams(window.location.search);
  const urlSnapshot = snapshotFromLocation(urlParams, definition, rows, defaultDisplayMode);
  const explicitUrlState = hasExplicitUrlState(urlParams);
  const requestedViewId = String(urlParams.get("sv") || "").trim();
  const selectedView = requestedViewId ? savedViews.find((view) => view.id === requestedViewId) ?? null : null;
  const defaultView = savedViews.find((view) => view.isDefault) ?? null;

  const viewSnapshot = selectedView
    ? createGenericEntityTableSnapshot(
        selectedView.search,
        selectedView.filters,
        selectedView.sort,
        selectedView.displayMode,
        selectedView.pageSize,
        {
          schemaVersion: 1,
          namespace,
          visibleFieldKeys: selectedView.visibleFieldKeys,
          fieldOrder: selectedView.fieldOrder,
          density: selectedView.density,
          columnWidths: selectedView.columnWidths,
          pinnedFieldKeys: selectedView.pinnedFieldKeys,
          updatedAt: selectedView.updatedAt,
        },
      )
    : defaultView
      ? createGenericEntityTableSnapshot(
          defaultView.search,
          defaultView.filters,
          defaultView.sort,
          defaultView.displayMode,
          defaultView.pageSize,
          {
            schemaVersion: 1,
            namespace,
            visibleFieldKeys: defaultView.visibleFieldKeys,
            fieldOrder: defaultView.fieldOrder,
            density: defaultView.density,
            columnWidths: defaultView.columnWidths,
            pinnedFieldKeys: defaultView.pinnedFieldKeys,
            updatedAt: defaultView.updatedAt,
          },
        )
      : null;

  const sessionSourceSnapshot = sessionSnapshot
    ? createGenericEntityTableSnapshot(
        sessionSnapshot.search,
        sessionSnapshot.filters,
        sessionSnapshot.sortState,
        sessionSnapshot.displayMode,
        sessionSnapshot.pageSize,
        sessionSnapshot.preferences,
      )
    : null;

  const baseSnapshot = explicitUrlState
    ? urlSnapshot
    : viewSnapshot || sessionSourceSnapshot || defaultSnapshot;

  const tablePreferences = selectedView
    ? normalizeGenericEntityTablePreferences(
        namespace,
        {
          schemaVersion: 1,
          namespace,
          visibleFieldKeys: selectedView.visibleFieldKeys,
          fieldOrder: selectedView.fieldOrder,
          density: selectedView.density,
          columnWidths: selectedView.columnWidths,
          pinnedFieldKeys: selectedView.pinnedFieldKeys,
          updatedAt: selectedView.updatedAt,
        },
        definition,
        permissionContext,
      )
    : !explicitUrlState && defaultView
      ? normalizeGenericEntityTablePreferences(
          namespace,
          {
            schemaVersion: 1,
            namespace,
            visibleFieldKeys: defaultView.visibleFieldKeys,
            fieldOrder: defaultView.fieldOrder,
            density: defaultView.density,
            columnWidths: defaultView.columnWidths,
            pinnedFieldKeys: defaultView.pinnedFieldKeys,
            updatedAt: defaultView.updatedAt,
          },
          definition,
          permissionContext,
        )
      : explicitUrlState
        ? defaultPreferences
        : sessionSnapshot?.preferences || defaultPreferences;

  return {
    state: {
      search: baseSnapshot.search,
      filters: baseSnapshot.filters,
      sortState: baseSnapshot.sortState,
      page: explicitUrlState ? urlSnapshot.page : 1,
      pageSize: baseSnapshot.pageSize,
      displayMode: baseSnapshot.displayMode,
      selectedRowId: baseSnapshot.selectedRowId ?? null,
      tablePreferences,
      activeSavedViewId: selectedView?.id ?? (!explicitUrlState && defaultView ? defaultView.id : null),
    },
    savedViews,
    activeViewSnapshot: viewSnapshot,
  };
}

export function useGenericEntityListState<T extends object>({
  namespace,
  definition,
  rows,
  enabled = false,
  permissionContext,
  storageContext,
}: UseGenericEntityListStateOptions<T>): GenericEntityListState<T> {
  const resolvedNamespace = namespace || definition.entityName;
  const defaultPageSize = definition.defaultPageSize ?? 20;
  const defaultDisplayMode = definition.defaultDisplayMode ?? "cards";
  const savedViewStorageMode: "browser" | "session" =
    storageContext?.account && storageContext?.schoolId ? "browser" : "session";
  const listScopeKey = useMemo(
    () =>
      [
        resolvedNamespace,
        defaultDisplayMode,
        savedViewStorageMode,
        permissionContext?.currentRole || "",
        (permissionContext?.activeRoles || []).join(","),
        (permissionContext?.activeCapabilities || []).join(","),
        storageContext?.currentUser || "",
        storageContext?.currentRole || "",
        storageContext?.workspaceUrl || "",
        storageContext?.account || "",
        storageContext?.schoolId || "",
      ].join("|"),
    [
      defaultDisplayMode,
      permissionContext?.activeCapabilities,
      permissionContext?.activeRoles,
      permissionContext?.currentRole,
      resolvedNamespace,
      savedViewStorageMode,
      storageContext?.account,
      storageContext?.currentRole,
      storageContext?.currentUser,
      storageContext?.schoolId,
      storageContext?.workspaceUrl,
    ],
  );
  const initialEnvironment = createListStateFromSource(
    resolvedNamespace,
    definition,
    rows,
    defaultDisplayMode,
    permissionContext,
    storageContext,
  );

  const [state, setState] = useState<InternalListState>(initialEnvironment.state);
  const [savedViews, setSavedViews] = useState<GenericEntitySavedView[]>(initialEnvironment.savedViews);
  const activeViewSnapshotRef = useRef<GenericEntityTableSnapshot | null>(initialEnvironment.activeViewSnapshot);
  const lastScopeKeyRef = useRef(listScopeKey);

  const currentSnapshot = useMemo(
    () =>
      createGenericEntityTableSnapshot(
        state.search,
        state.filters,
        state.sortState,
        state.displayMode,
        state.pageSize,
        state.tablePreferences,
      ),
    [state.displayMode, state.filters, state.pageSize, state.search, state.sortState, state.tablePreferences],
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handlePopState = () => {
      const resolved = createListStateFromSource(
        resolvedNamespace,
        definition,
        rows,
        defaultDisplayMode,
        permissionContext,
        storageContext,
      );
      setState(resolved.state);
      setSavedViews(resolved.savedViews);
      activeViewSnapshotRef.current = resolved.activeViewSnapshot;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [defaultDisplayMode, definition, enabled, permissionContext, rows, resolvedNamespace, storageContext]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (lastScopeKeyRef.current === listScopeKey) return;

    const resolved = createListStateFromSource(
      resolvedNamespace,
      definition,
      rows,
      defaultDisplayMode,
      permissionContext,
      storageContext,
    );
    setState(resolved.state);
    setSavedViews(resolved.savedViews);
    activeViewSnapshotRef.current = resolved.activeViewSnapshot;
    lastScopeKeyRef.current = listScopeKey;
  }, [defaultDisplayMode, definition, enabled, listScopeKey, permissionContext, resolvedNamespace, rows, storageContext]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !namespace) return;
    saveGenericEntityTableSnapshot(resolvedNamespace, currentSnapshot, window.sessionStorage, storageContext || undefined);
  }, [currentSnapshot, enabled, namespace, resolvedNamespace, storageContext]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !namespace) return;

    const currentParams = new URLSearchParams(window.location.search);
    const nextParams = snapshotToSearchParams(state, defaultDisplayMode, currentParams);
    const nextSearch = nextParams.toString();
    const currentSearch = currentParams.toString();

    if (nextSearch === currentSearch) {
      return;
    }

    const currentWithoutSearch = new URLSearchParams(currentSearch);
    currentWithoutSearch.delete("q");
    const nextWithoutSearch = new URLSearchParams(nextSearch);
    nextWithoutSearch.delete("q");
    const onlySearchChanged = currentWithoutSearch.toString() === nextWithoutSearch.toString()
      && currentParams.get("q") !== nextParams.get("q");

    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    if (onlySearchChanged) {
      window.history.replaceState({}, "", nextUrl);
    } else {
      window.history.pushState({}, "", nextUrl);
    }
  }, [defaultDisplayMode, enabled, namespace, resolvedNamespace, state]);

  useEffect(() => {
    if (!enabled) return;

    const selectedRowExists =
      state.selectedRowId &&
      rows.some((row) => definition.getId(row) === state.selectedRowId);
    if (state.selectedRowId && !selectedRowExists) {
      setState((current) => ({ ...current, selectedRowId: null }));
    }
  }, [definition, enabled, rows, state.selectedRowId]);

  const selectedRow = useMemo(
    () => rows.find((row) => definition.getId(row) === state.selectedRowId) ?? null,
    [definition, rows, state.selectedRowId],
  );

  const activeSavedView = useMemo(
    () => savedViews.find((view) => view.id === state.activeSavedViewId) ?? null,
    [savedViews, state.activeSavedViewId],
  );

  const activeFilterCount = Object.values(state.filters).filter((value) => Boolean(value) && value !== "All").length;
  const tableDirty = Boolean(activeViewSnapshotRef.current && !areGenericEntityTableSnapshotsEqual(currentSnapshot, activeViewSnapshotRef.current));

  const updateSavedViews = (nextViews: GenericEntitySavedView[]) => {
    const deduped = nextViews.filter((view, index, array) => array.findIndex((candidate) => candidate.id === view.id) === index);
    setSavedViews(deduped);
    if (enabled && typeof window !== "undefined" && namespace) {
      saveGenericEntitySavedViews(
        resolvedNamespace,
        deduped,
        savedViewStorageMode === "browser" ? window.localStorage : window.sessionStorage,
        storageContext || undefined,
      );
    }
  };

  const applySnapshot = (snapshot: GenericEntityTableSnapshot, activeSavedViewId: string | null) => {
    activeViewSnapshotRef.current = activeSavedViewId ? snapshot : null;
    setState((current) => ({
      ...current,
      search: snapshot.search,
      filters: { ...snapshot.filters },
      sortState: snapshot.sortState,
      page: 1,
      pageSize: snapshot.pageSize,
      displayMode: snapshot.displayMode,
      selectedRowId: null,
      tablePreferences: snapshot.preferences,
      activeSavedViewId,
    }));
  };

  const buildCurrentViewSnapshot = (): GenericEntityTableSnapshot =>
    createGenericEntityTableSnapshot(
      state.search,
      state.filters,
      state.sortState,
      state.displayMode,
      state.pageSize,
      state.tablePreferences,
    );

  const persistCurrentStateAsView = (view: GenericEntitySavedView) => {
    const nextViews = savedViews.some((candidate) => candidate.id === view.id)
      ? savedViews.map((candidate) => (candidate.id === view.id ? view : candidate))
      : [...savedViews, view];
    updateSavedViews(nextViews);
    const snapshot = createGenericEntityTableSnapshot(
      view.search,
      view.filters,
      view.sort,
      view.displayMode,
      view.pageSize,
      {
        schemaVersion: 1,
        namespace: resolvedNamespace,
        visibleFieldKeys: view.visibleFieldKeys,
        fieldOrder: view.fieldOrder,
        density: view.density,
        columnWidths: view.columnWidths,
        pinnedFieldKeys: view.pinnedFieldKeys,
        updatedAt: view.updatedAt,
      },
    );
    activeViewSnapshotRef.current = snapshot;
    setState((current) => ({
      ...current,
      activeSavedViewId: view.id,
    }));
  };

  const resolveViewSnapshot = (view: GenericEntitySavedView): GenericEntityTableSnapshot =>
    createGenericEntityTableSnapshot(
      view.search,
      view.filters,
      view.sort,
      view.displayMode,
      view.pageSize,
      {
        schemaVersion: 1,
        namespace: resolvedNamespace,
        visibleFieldKeys: view.visibleFieldKeys,
        fieldOrder: view.fieldOrder,
        density: view.density,
        columnWidths: view.columnWidths,
        pinnedFieldKeys: view.pinnedFieldKeys,
        updatedAt: view.updatedAt,
      },
    );

  const setActiveView = (viewId: string | null) => {
    if (!viewId) {
      return;
    }
    const view = savedViews.find((candidate) => candidate.id === viewId) ?? null;
    if (!view) return;
    applySnapshot(resolveViewSnapshot(view), view.id);
  };

  const saveViewAsNew = (name: string) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return;
    const snapshot = buildCurrentViewSnapshot();
    const nextView = createGenericEntitySavedViewSnapshot(resolvedNamespace, trimmed, snapshot, {
      source: "private",
      ownerId: storageContext?.account || storageContext?.currentUser || null,
      isDefault: false,
    });
    updateSavedViews([...savedViews, nextView]);
    activeViewSnapshotRef.current = snapshot;
    setState((current) => ({ ...current, activeSavedViewId: nextView.id }));
  };

  const updateActiveView = () => {
    const active = activeSavedView;
    if (!active || active.source === "system") return;
    const snapshot = buildCurrentViewSnapshot();
    const updatedView = {
      ...active,
      updatedAt: new Date().toISOString(),
      search: snapshot.search,
      filters: snapshot.filters,
      sort: snapshot.sortState,
      displayMode: snapshot.displayMode,
      pageSize: snapshot.pageSize,
      visibleFieldKeys: snapshot.preferences.visibleFieldKeys,
      fieldOrder: snapshot.preferences.fieldOrder,
      density: snapshot.preferences.density,
      columnWidths: snapshot.preferences.columnWidths,
      pinnedFieldKeys: snapshot.preferences.pinnedFieldKeys,
    };
    persistCurrentStateAsView(updatedView);
  };

  const duplicateActiveView = (name?: string) => {
    const sourceView = activeSavedView;
    const snapshot = buildCurrentViewSnapshot();
    const baseName = sourceView?.name || "View";
    const nextName = String(name || "").trim() || `${baseName} copy`;
    const duplicated = createGenericEntitySavedViewSnapshot(resolvedNamespace, nextName, snapshot, {
      source: "private",
      ownerId: storageContext?.account || storageContext?.currentUser || null,
      isDefault: false,
    });
    updateSavedViews([...savedViews, duplicated]);
    activeViewSnapshotRef.current = snapshot;
    setState((current) => ({ ...current, activeSavedViewId: duplicated.id }));
  };

  const renameActiveView = (name: string) => {
    const active = activeSavedView;
    const trimmed = String(name || "").trim();
    if (!active || active.source === "system" || !trimmed) return;
    const nextViews = savedViews.map((view) =>
      view.id === active.id
        ? { ...view, name: trimmed, updatedAt: new Date().toISOString() }
        : view,
    );
    updateSavedViews(nextViews);
  };

  const setDefaultView = (viewId: string | null) => {
    if (!viewId) return;
    const target = savedViews.find((view) => view.id === viewId);
    if (!target) return;
    const now = new Date().toISOString();
    const nextViews = savedViews.map((view) => ({
      ...view,
      isDefault: view.id === viewId,
      updatedAt: view.id === viewId ? now : view.updatedAt,
    }));
    updateSavedViews(nextViews);
  };

  const deleteActiveView = () => {
    const active = activeSavedView;
    if (!active || active.source === "system") return;
    const remaining = savedViews.filter((view) => view.id !== active.id);
    updateSavedViews(remaining);

    const nextDefault = remaining.find((view) => view.isDefault) ?? remaining[0] ?? null;
    if (nextDefault) {
      applySnapshot(resolveViewSnapshot(nextDefault), nextDefault.id);
      return;
    }

    restoreSystemDefault();
  };

  const resetViewChanges = () => {
    const active = activeSavedView;
    if (!active) {
      restoreSystemDefault();
      return;
    }
    applySnapshot(resolveViewSnapshot(active), active.id);
  };

  const restoreSystemDefault = () => {
    const preferences = buildDefaultGenericEntityTablePreferences(resolvedNamespace, definition, permissionContext);
    activeViewSnapshotRef.current = null;
    setState({
      search: "",
      filters: definition.defaultFilters ?? {},
      sortState: definition.defaultSort ?? null,
      page: 1,
      pageSize: definition.defaultPageSize ?? 20,
      displayMode: defaultDisplayMode,
      selectedRowId: null,
      tablePreferences: preferences,
      activeSavedViewId: null,
    });
  };

  const resetTablePreferences = () => {
    setState((current) => ({
      ...current,
      tablePreferences: buildDefaultGenericEntityTablePreferences(resolvedNamespace, definition, permissionContext),
    }));
  };

  const updateTablePreferences = (
    updater: (current: GenericEntityTablePreferences) => GenericEntityTablePreferences,
  ) => {
    setState((current) => ({
      ...current,
      tablePreferences: normalizeGenericEntityTablePreferences(
        resolvedNamespace,
        updater(current.tablePreferences),
        definition,
        permissionContext,
      ),
    }));
  };

  const moveTableField = (fieldKey: string, direction: -1 | 1) => {
    updateTablePreferences((current) => {
      const field = definition.fields.find((candidate) => String(candidate.key) === fieldKey);
      if (!field || field.tableRole === "action" || field.tableRole === "identity" || field.tableHideable === false) {
        return current;
      }
      const currentOrder = [...current.fieldOrder];
      const index = currentOrder.indexOf(fieldKey);
      if (index < 0) return current;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= currentOrder.length) return current;
      const nextOrder = [...currentOrder];
      const [moved] = nextOrder.splice(index, 1);
      nextOrder.splice(nextIndex, 0, moved);
      return { ...current, fieldOrder: nextOrder, updatedAt: new Date().toISOString() };
    });
  };

  const toggleTableFieldVisibility = (fieldKey: string) => {
    const field = definition.fields.find((candidate) => String(candidate.key) === fieldKey);
    if (!field || field.tableRole === "action" || field.required || field.tableRequired || field.tableRole === "identity" || field.tableHideable === false) return;
    updateTablePreferences((current) => {
      const visibleSet = new Set(current.visibleFieldKeys);
      if (visibleSet.has(fieldKey)) visibleSet.delete(fieldKey);
      else visibleSet.add(fieldKey);
      return { ...current, visibleFieldKeys: Array.from(visibleSet), updatedAt: new Date().toISOString() };
    });
  };

  const setTableFieldWidth = (fieldKey: string, width: number) => {
    updateTablePreferences((current) => ({
      ...current,
      columnWidths: { ...current.columnWidths, [fieldKey]: width },
      updatedAt: new Date().toISOString(),
    }));
  };

  const toggleTableFieldPin = (fieldKey: string) => {
    const field = definition.fields.find((candidate) => String(candidate.key) === fieldKey);
    if (!field || field.tableRole === "action" || field.tablePinnable === false) return;
    updateTablePreferences((current) => {
      const pinnedSet = new Set(current.pinnedFieldKeys);
      if (pinnedSet.has(fieldKey)) pinnedSet.delete(fieldKey);
      else pinnedSet.add(fieldKey);
      return { ...current, pinnedFieldKeys: Array.from(pinnedSet), updatedAt: new Date().toISOString() };
    });
  };

  const setTableDensity = (density: GenericEntityDensity) => {
    updateTablePreferences((current) => ({
      ...current,
      density,
      updatedAt: new Date().toISOString(),
    }));
  };

  const setSearchValue = (value: string) => setState((current) => ({ ...current, search: value }));
  const setFilterValue = (fieldKey: string, value: string) =>
    setState((current) => {
      const nextFilters = { ...current.filters };
      if (!value || value === "All") delete nextFilters[fieldKey];
      else nextFilters[fieldKey] = value;
      return { ...current, filters: nextFilters };
    });
  const setFilterValues = (value: GenericEntityFilterState) =>
    setState((current) => ({ ...current, filters: { ...value } }));
  const clearFilters = () =>
    setState((current) => ({ ...current, filters: definition.defaultFilters ?? {} }));
  const setSortState = (value: GenericEntitySortState | null) => setState((current) => ({ ...current, sortState: value }));
  const setPage = (value: number) => setState((current) => ({ ...current, page: value > 0 ? value : 1 }));
  const setPageSize = (value: number) =>
    setState((current) => ({ ...current, pageSize: value > 0 ? value : defaultPageSize }));
  const setDisplayMode = (value: GenericEntityDisplayMode) =>
    setState((current) => ({ ...current, displayMode: value }));
  const selectRow = (row: T | null) =>
    setState((current) => ({
      ...current,
      selectedRowId: row ? definition.getId(row) : null,
    }));
  const setTablePreferences = (value: GenericEntityTablePreferences) =>
    setState((current) => ({
      ...current,
      tablePreferences: normalizeGenericEntityTablePreferences(resolvedNamespace, value, definition, permissionContext),
    }));

  return {
    searchValue: state.search,
    setSearchValue,
    filterValues: state.filters,
    setFilterValue,
    setFilterValues,
    clearFilters,
    sortState: state.sortState,
    setSortState,
    page: state.page,
    setPage,
    pageSize: state.pageSize,
    setPageSize,
    displayMode: state.displayMode,
    setDisplayMode,
    selectedRow,
    selectRow,
    activeFilterCount,
    tablePreferences: state.tablePreferences,
    setTablePreferences,
    tableDirty,
    activeSavedView,
    activeSavedViewId: state.activeSavedViewId,
    savedViews,
    savedViewStorageMode,
    saveViewAsNew,
    updateActiveView,
    duplicateActiveView,
    renameActiveView,
    deleteActiveView,
    setActiveView,
    setDefaultView,
    resetViewChanges,
    restoreSystemDefault,
    resetTablePreferences,
    moveTableField,
    toggleTableFieldVisibility,
    setTableFieldWidth,
    toggleTableFieldPin,
    setTableDensity,
  };
}
