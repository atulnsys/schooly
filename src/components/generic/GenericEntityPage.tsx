import React, { useState } from "react";
import {
  GenericEntityDefinition,
  GenericEntityDisplayMode,
  GenericEntityPermissionContext,
} from "../../lib/genericEntityView";
import GenericEntityDetailView from "./GenericEntityDetailView";
import GenericEntityListView from "./GenericEntityListView";

interface GenericEntityPageProps<T extends object> {
  definition: GenericEntityDefinition<T>;
  rows: T[];

  selectedRow?: T | null;
  onSelectRow?: (row: T | null) => void;

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
  selectedRow,
  onSelectRow,
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
  const [internalSelectedRow, setInternalSelectedRow] = useState<T | null>(null);
  const [displayMode, setDisplayMode] = useState<GenericEntityDisplayMode>(
    definition.defaultDisplayMode ?? "cards",
  );

  const activeSelectedRow = selectedRow !== undefined ? selectedRow : internalSelectedRow;

  const handleSelectRow = (row: T | null) => {
    if (onSelectRow) onSelectRow(row);
    else setInternalSelectedRow(row);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      <div className="lg:col-span-2">
        <GenericEntityListView
          definition={definition}
          rows={rows}
          selectedRow={activeSelectedRow}
          onSelectRow={(row) => handleSelectRow(row)}
          permissionContext={permissionContext}
          showSearch={showSearch}
          showFilters={showFilters}
          showSort={showSort}
          showDisplayModeToggle={showDisplayModeToggle}
          showPagination={showPagination}
          renderToolbarActions={renderToolbarActions}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
        />
      </div>

      <div className="space-y-4">
        <GenericEntityDetailView
          definition={definition}
          row={activeSelectedRow}
          onClearSelection={() => handleSelectRow(null)}
          permissionContext={permissionContext}
          childrenBeforeSections={
            activeSelectedRow ? renderDetailBeforeSections?.(activeSelectedRow) : null
          }
          childrenAfterSections={
            activeSelectedRow ? renderDetailAfterSections?.(activeSelectedRow) : null
          }
        />
      </div>
    </div>
  );
}
