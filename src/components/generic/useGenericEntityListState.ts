import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GenericEntityDefinition,
  GenericEntityDisplayMode,
  GenericEntityFilterState,
  GenericEntitySortState,
} from "../../lib/genericEntityView";

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
}

interface ListStateSnapshot {
  search: string;
  filters: GenericEntityFilterState;
  sortState: GenericEntitySortState | null;
  page: number;
  pageSize: number;
  displayMode: GenericEntityDisplayMode;
  selectedRowId: string | null;
}

interface UseGenericEntityListStateOptions<T extends object> {
  namespace?: string | null;
  definition: GenericEntityDefinition<T>;
  rows: T[];
  enabled?: boolean;
}

function normalizeInteger(value: string | null | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readFiltersFromParams(
  params: URLSearchParams,
  allowedKeys: string[],
): GenericEntityFilterState {
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
    .sort(([left], [right]) => left.localeCompare(right));
  if (entries.length === 0) return null;

  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}:${encodeURIComponent(value)}`)
    .join(",");
}

function snapshotToSearchParams(
  snapshot: ListStateSnapshot,
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

  if (snapshot.search.trim()) params.set("q", snapshot.search.trim());

  const serializedFilters = serializeFilters(snapshot.filters);
  if (serializedFilters) params.set("f", serializedFilters);

  if (snapshot.sortState) {
    params.set("sort", snapshot.sortState.fieldKey);
    params.set("dir", snapshot.sortState.direction);
  }

  if (snapshot.page > 1) params.set("page", String(snapshot.page));
  if (snapshot.pageSize > 0) params.set("size", String(snapshot.pageSize));
  if (snapshot.displayMode !== "cards") params.set("view", snapshot.displayMode);
  if (snapshot.selectedRowId) params.set("row", snapshot.selectedRowId);

  return params;
}

function snapshotFromLocation<T extends object>(
  params: URLSearchParams,
  definition: GenericEntityDefinition<T>,
  rows: T[],
): ListStateSnapshot {
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
    displayMode: params.get("view") === "table" ? "table" : definition.defaultDisplayMode ?? "cards",
    selectedRowId: selectedRowAllowed ? selectedRowId : null,
  };
}

export function useGenericEntityListState<T extends object>({
  namespace,
  definition,
  rows,
  enabled = false,
}: UseGenericEntityListStateOptions<T>): GenericEntityListState<T> {
  const defaultPageSize = definition.defaultPageSize ?? 20;
  const defaultDisplayMode = definition.defaultDisplayMode ?? "cards";
  const lastSyncedStateRef = useRef<ListStateSnapshot | null>(null);

  const readSnapshot = (): ListStateSnapshot => {
    if (!enabled || typeof window === "undefined") {
      return {
        search: "",
        filters: definition.defaultFilters ?? {},
        sortState: definition.defaultSort ?? null,
        page: 1,
        pageSize: defaultPageSize,
        displayMode: defaultDisplayMode,
        selectedRowId: null,
      };
    }

    return snapshotFromLocation(new URLSearchParams(window.location.search), definition, rows);
  };

  const [state, setState] = useState<ListStateSnapshot>(readSnapshot);
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handlePopState = () => {
      setState(snapshotFromLocation(new URLSearchParams(window.location.search), definition, rows));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [definition, enabled, rows]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !namespace) return;

    const currentParams = new URLSearchParams(window.location.search);
    const nextParams = snapshotToSearchParams(state, currentParams);
    const nextSearch = nextParams.toString();
    const currentSearch = currentParams.toString();
    if (nextSearch === currentSearch) {
      lastSyncedStateRef.current = state;
      return;
    }

    const previous = lastSyncedStateRef.current ?? snapshotFromLocation(currentParams, definition, rows);
    const filtersChanged = serializeFilters(previous.filters) !== serializeFilters(state.filters);
    const sortChanged =
      previous.sortState?.fieldKey !== state.sortState?.fieldKey ||
      previous.sortState?.direction !== state.sortState?.direction;
    const pageChanged = previous.page !== state.page;
    const pageSizeChanged = previous.pageSize !== state.pageSize;
    const displayModeChanged = previous.displayMode !== state.displayMode;
    const selectedRowChanged = previous.selectedRowId !== state.selectedRowId;
    const searchChanged = previous.search !== state.search;
    const onlySearchChanged =
      searchChanged &&
      !filtersChanged &&
      !sortChanged &&
      !pageChanged &&
      !pageSizeChanged &&
      !displayModeChanged &&
      !selectedRowChanged;

    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    if (onlySearchChanged) {
      window.history.replaceState({}, "", nextUrl);
    } else {
      window.history.pushState({}, "", nextUrl);
    }
    lastSyncedStateRef.current = state;
  }, [definition, enabled, namespace, rows, state]);

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

  const activeFilterCount = Object.values(state.filters).filter((value) => Boolean(value) && value !== "All").length;

  return {
    searchValue: state.search,
    setSearchValue: (value) =>
      setState((current) => ({
        ...current,
        search: value,
      })),
    filterValues: state.filters,
    setFilterValue: (fieldKey, value) =>
      setState((current) => {
        const nextFilters = { ...current.filters };
        if (!value || value === "All") delete nextFilters[fieldKey];
        else nextFilters[fieldKey] = value;
        return { ...current, filters: nextFilters };
      }),
    setFilterValues: (value) =>
      setState((current) => ({
        ...current,
        filters: { ...value },
      })),
    clearFilters: () =>
      setState((current) => ({
        ...current,
        filters: definition.defaultFilters ?? {},
      })),
    sortState: state.sortState,
    setSortState: (value) =>
      setState((current) => ({
        ...current,
        sortState: value,
      })),
    page: state.page,
    setPage: (value) =>
      setState((current) => ({
        ...current,
        page: value > 0 ? value : 1,
      })),
    pageSize: state.pageSize,
    setPageSize: (value) =>
      setState((current) => ({
        ...current,
        pageSize: value > 0 ? value : defaultPageSize,
      })),
    displayMode: state.displayMode,
    setDisplayMode: (value) =>
      setState((current) => ({
        ...current,
        displayMode: value,
      })),
    selectedRow,
    selectRow: (row) =>
      setState((current) => ({
        ...current,
        selectedRowId: row ? definition.getId(row) : null,
      })),
    activeFilterCount,
  };
}
