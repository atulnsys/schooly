import React from "react";
import {
  GenericEntityDefinition,
  GenericEntityPermissionContext,
} from "../../lib/genericEntityView";
import GenericEntityDetailView from "./GenericEntityDetailView";
import GenericEntityListView from "./GenericEntityListView";
import { useGenericEntityListState } from "./useGenericEntityListState";

interface GenericEntityPageProps<T extends object> {
  definition: GenericEntityDefinition<T>;
  rows: T[];
  stateNamespace?: string;

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
}

export default function GenericEntityPage<T extends object>({
  definition,
  rows,
  stateNamespace,
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
}: GenericEntityPageProps<T>) {
  const listState = useGenericEntityListState({
    namespace: stateNamespace,
    definition,
    rows,
    enabled: Boolean(stateNamespace),
  });

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      <div className="lg:col-span-2">
        <GenericEntityListView
          definition={definition}
          rows={rows}
          selectedRow={listState.selectedRow}
          onSelectRow={listState.selectRow}
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

      <div className="space-y-4">
        <GenericEntityDetailView
          definition={definition}
          row={listState.selectedRow}
          onClearSelection={() => listState.selectRow(null)}
          permissionContext={permissionContext}
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
