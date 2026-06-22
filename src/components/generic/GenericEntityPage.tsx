import React, { useEffect, useMemo, useRef } from "react";
import {
  filterGenericRows,
  GenericEntityDefinition,
  GenericEntityPermissionContext,
} from "../../lib/genericEntityView";
import type { GenericEntityStorageContext } from "../../lib/genericEntityTableState";
import GenericEntityDetailView from "./GenericEntityDetailView";
import GenericEntityListView from "./GenericEntityListView";
import { useGenericEntityListState } from "./useGenericEntityListState";

interface GenericEntityPageProps<T extends object> {
  definition: GenericEntityDefinition<T>;
  rows: T[];
  stateNamespace?: string;
  storageContext?: GenericEntityStorageContext | null;

  permissionContext?: GenericEntityPermissionContext;

  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
  showDisplayModeToggle?: boolean;
  showPagination?: boolean;
  renderToolbarActions?: () => React.ReactNode;

  renderDetailBeforeSections?: (row: T) => React.ReactNode;
  renderDetailAfterSections?: (row: T) => React.ReactNode;
  detailContext?: {
    displayMode?: "read-only" | "editable" | "restricted" | "unavailable";
    stateLabel?: string | null;
    sourceLabel?: string | null;
    sourceStatusLabel?: string | null;
    sourceLastSyncedAt?: string | null;
    sourceLastCheckedAt?: string | null;
    readOnlyReason?: string | null;
  } | null;
}

export default function GenericEntityPage<T extends object>({
  definition,
  rows,
  stateNamespace,
  storageContext,
  permissionContext,
  className = "",
  showSearch = true,
  showFilters = true,
  showSort = true,
  showDisplayModeToggle = true,
  showPagination = true,
  renderToolbarActions,
  renderDetailBeforeSections,
  renderDetailAfterSections,
  detailContext,
}: GenericEntityPageProps<T>) {
  const listState = useGenericEntityListState({
    namespace: stateNamespace,
    definition,
    rows,
    enabled: Boolean(stateNamespace),
    permissionContext,
    storageContext,
  });
  const pageRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const previousSelectedRowIdRef = useRef<string | null>(null);

  const visibleRows = useMemo(
    () => filterGenericRows(rows, definition, listState.searchValue, listState.filterValues, permissionContext),
    [definition, listState.filterValues, listState.searchValue, permissionContext, rows],
  );
  const selectedRowIsVisible =
    !listState.selectedRowId ||
    visibleRows.some((row) => definition.getId(row) === listState.selectedRowId);

  useEffect(() => {
    const previousSelectedRowId = previousSelectedRowIdRef.current;
    previousSelectedRowIdRef.current = listState.selectedRowId;

    if (listState.selectedRowId && listState.selectedRowId !== previousSelectedRowId) {
      window.requestAnimationFrame(() => {
        detailRef.current?.focus({ preventScroll: true });
      });
      return;
    }

    if (!listState.selectedRowId && previousSelectedRowId) {
      window.requestAnimationFrame(() => {
        (returnFocusRef.current ?? pageRef.current)?.focus?.({ preventScroll: true });
      });
    }
  }, [listState.selectedRowId]);

  const handleSelectRow = (row: T) => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      returnFocusRef.current = document.activeElement;
    }
    listState.selectRow(row);
  };

  const handleClearSelection = () => {
    listState.selectRow(null);
    window.requestAnimationFrame(() => {
      (returnFocusRef.current ?? pageRef.current)?.focus?.({ preventScroll: true });
    });
  };

  return (
    <div ref={pageRef} tabIndex={-1} className={`grid grid-cols-1 lg:grid-cols-3 gap-6 outline-none ${className}`}>
      <div className="lg:col-span-2">
        <GenericEntityListView
          definition={definition}
          rows={rows}
          state={listState}
          selectedRow={listState.selectedRow}
          onSelectRow={handleSelectRow}
          searchValue={listState.searchValue}
          onSearchChange={listState.setSearchValue}
          filterValues={listState.filterValues}
          onFilterChange={listState.setFilterValues}
          sortState={listState.sortState}
          onSortChange={listState.setSortState}
          page={listState.page}
          onPageChange={listState.setPage}
          pageSize={listState.pageSize}
          onPageSizeChange={listState.setPageSize}
          permissionContext={permissionContext}
          showSearch={showSearch}
          showFilters={showFilters}
          showSort={showSort}
          showDisplayModeToggle={showDisplayModeToggle}
          showPagination={showPagination}
          renderToolbarActions={renderToolbarActions}
          displayMode={listState.displayMode}
          onDisplayModeChange={listState.setDisplayMode}
        />
      </div>

      <div ref={detailRef} className="space-y-4" tabIndex={-1}>
        <GenericEntityDetailView
          definition={definition}
          row={listState.selectedRow}
          selectedRowId={listState.selectedRowId}
          selectedRowIsVisible={selectedRowIsVisible}
          onClearSelection={handleClearSelection}
          permissionContext={permissionContext}
          detailContext={detailContext}
          childrenBeforeSections={
            listState.selectedRow ? renderDetailBeforeSections?.(listState.selectedRow) : null
          }
          childrenAfterSections={
            listState.selectedRow ? renderDetailAfterSections?.(listState.selectedRow) : null
          }
        />
      </div>
    </div>
  );
}
