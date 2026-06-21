import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Filter,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react";
import {
  filterGenericRows,
  formatGenericDate,
  getAllGenericRowIssues,
  getDistinctGenericFilterOptions,
  getGenericFieldValue,
  getVisibleGenericFields,
  GenericEntityActionDefinition,
  GenericEntityDefinition,
  GenericEntityDisplayMode,
  GenericEntityFilterState,
  GenericEntityPermissionContext,
  GenericEntitySortState,
  hasGenericPermission,
  sortGenericRows,
  truncateGenericText,
} from "../../lib/genericEntityView";

interface GenericEntityListViewProps<T extends object> {
  definition: GenericEntityDefinition<T>;
  rows: T[];

  selectedRow?: T | null;
  onSelectRow?: (row: T) => void;

  searchValue?: string;
  onSearchChange?: (value: string) => void;

  filterValues?: GenericEntityFilterState;
  onFilterChange?: (value: GenericEntityFilterState) => void;

  sortState?: GenericEntitySortState | null;
  onSortChange?: (value: GenericEntitySortState | null) => void;

  page?: number;
  onPageChange?: (value: number) => void;

  pageSize?: number;
  onPageSizeChange?: (value: number) => void;

  permissionContext?: GenericEntityPermissionContext;

  showSearch?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
  showDisplayModeToggle?: boolean;
  showPagination?: boolean;
  renderToolbarActions?: () => React.ReactNode;

  displayMode?: GenericEntityDisplayMode;
  onDisplayModeChange?: (mode: GenericEntityDisplayMode) => void;

  className?: string;
  maxVisibleFields?: number;
}

function getBadgeClass(variant: string | undefined): string {
  if (variant === "success") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (variant === "warning") return "bg-amber-50 text-amber-700 border-amber-100";
  if (variant === "danger") return "bg-rose-50 text-rose-700 border-rose-100";
  if (variant === "info") return "bg-blue-50 text-blue-700 border-blue-100";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getActionClass(variant: string | undefined): string {
  if (variant === "primary") return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
  if (variant === "danger") return "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200";
  if (variant === "ghost") return "bg-transparent hover:bg-slate-100 text-slate-500 border-transparent";
  return "bg-white hover:bg-slate-50 text-slate-650 border-slate-200";
}

function renderListFieldValue<T extends object>(
  row: T,
  field: GenericEntityDefinition<T>["fields"][number],
): React.ReactNode {
  if (field.renderListValue) return field.renderListValue(row);

  const value = getGenericFieldValue(row, field);

  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-350">—</span>;
  }

  if (field.type === "date") return formatGenericDate(value, false);
  if (field.type === "datetime") return formatGenericDate(value, true);
  if (field.type === "boolean") return value ? "Yes" : "No";

  if (field.type === "tags" && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.slice(0, 4).map((tag) => (
          <span
            key={String(tag)}
            className="bg-slate-100 text-slate-600 text-[8.5px] font-mono px-1.5 py-0.5 rounded-md"
          >
            {String(tag)}
          </span>
        ))}
        {value.length > 4 && (
          <span className="text-slate-400 text-[8px] font-mono self-center">
            +{value.length - 4} more
          </span>
        )}
      </div>
    );
  }

  if (field.type === "badge") {
    return (
      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold font-sans border ${getBadgeClass(field.getBadgeVariant?.(row))}`}>
        {String(value)}
      </span>
    );
  }

  const text = String(value);
  return truncateGenericText(text, field.maxListChars ?? 120);
}

function getActionHref<T extends object>(action: GenericEntityActionDefinition<T>, row: T): string | undefined {
  return action.getHref?.(row) ?? action.href;
}

export default function GenericEntityListView<T extends object>({
  definition,
  rows,
  selectedRow = null,
  onSelectRow,
  searchValue,
  onSearchChange,
  filterValues,
  onFilterChange,
  permissionContext,
  showSearch = true,
  showFilters = true,
  showSort = true,
  showDisplayModeToggle = true,
  showPagination = true,
  renderToolbarActions,
  displayMode,
  onDisplayModeChange,
  sortState: controlledSortState,
  onSortChange,
  page: controlledPage,
  onPageChange,
  pageSize: controlledPageSize,
  onPageSizeChange,
  className = "",
  maxVisibleFields = 5,
}: GenericEntityListViewProps<T>) {
  const [localSearch, setLocalSearch] = useState("");
  const [localFilters, setLocalFilters] = useState<GenericEntityFilterState>(
    definition.defaultFilters ?? {},
  );
  const [localDisplayMode, setLocalDisplayMode] = useState<GenericEntityDisplayMode>(
    definition.defaultDisplayMode ?? "cards",
  );
  const [localSortState, setLocalSortState] = useState<GenericEntitySortState | null>(
    definition.defaultSort ?? null,
  );
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(definition.defaultPageSize ?? 20);
  const [announcement, setAnnouncement] = useState("");

  const activeSearch = searchValue ?? localSearch;
  const activeFilters = filterValues ?? localFilters;
  const activeDisplayMode = displayMode ?? localDisplayMode;
  const activeSortState = controlledSortState ?? localSortState;
  const activePage = controlledPage ?? localPage;
  const activePageSize = controlledPageSize ?? localPageSize;

  const filterableFields = getVisibleGenericFields(null, definition.fields, "list", permissionContext)
    .filter((field) => field.filterable);

  const sortableFields = getVisibleGenericFields(null, definition.fields, "list", permissionContext)
    .filter((field) => field.sortable);

  const rowActions =
    definition.actions?.filter((action) => {
      if (!hasGenericPermission(action.permissions, permissionContext)) return false;
      return action.placement === "list" || action.placement === "both" || !action.placement;
    }) ?? [];

  const visibleRows = useMemo(() => {
    const filtered = filterGenericRows(rows, definition, activeSearch, activeFilters, permissionContext);
    return sortGenericRows(filtered, definition, activeSortState);
  }, [rows, definition, activeSearch, activeFilters, permissionContext, activeSortState]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / activePageSize));
  const safePage = Math.min(activePage, totalPages);

  const pagedRows = showPagination
    ? visibleRows.slice((safePage - 1) * activePageSize, safePage * activePageSize)
    : visibleRows;

  const selectedId = selectedRow ? definition.getId(selectedRow) : null;

  useEffect(() => {
    if (controlledPage !== undefined && controlledPage !== safePage) {
      onPageChange?.(safePage);
      return;
    }

    if (controlledPage === undefined && localPage !== safePage) {
      setLocalPage(safePage);
    }
  }, [controlledPage, localPage, onPageChange, safePage]);

  const updateSearch = (value: string) => {
    if (onSearchChange) onSearchChange(value);
    else setLocalSearch(value);
  };

  const updateFilter = (fieldKey: string, value: string) => {
    const updated = { ...activeFilters, [fieldKey]: value };
    if (onFilterChange) onFilterChange(updated);
    else setLocalFilters(updated);
  };

  const updateDisplayMode = (mode: GenericEntityDisplayMode) => {
    if (onDisplayModeChange) onDisplayModeChange(mode);
    else setLocalDisplayMode(mode);
  };

  const updateSortState = (value: GenericEntitySortState | null) => {
    if (onSortChange) onSortChange(value);
    else setLocalSortState(value);
  };

  const updatePage = (value: number) => {
    if (onPageChange) onPageChange(value);
    else setLocalPage(value);
  };

  const updatePageSize = (value: number) => {
    if (onPageSizeChange) onPageSizeChange(value);
    else setLocalPageSize(value);
  };

  const clearControls = () => {
    updateSearch("");
    if (onFilterChange) onFilterChange(definition.defaultFilters ?? {});
    else setLocalFilters(definition.defaultFilters ?? {});
    updateSortState(definition.defaultSort ?? null);
    updatePage(1);
  };

  const hasActiveFilters = Object.values(activeFilters).some((value) => value && value !== "All");
  const defaultSort = definition.defaultSort ?? null;
  const hasActiveSort =
    Boolean(activeSortState) &&
    (!defaultSort ||
      defaultSort.fieldKey !== activeSortState.fieldKey ||
      defaultSort.direction !== activeSortState.direction);
  const hasActiveControls = Boolean(activeSearch.trim()) || hasActiveFilters || hasActiveSort;
  const activeFilterCount = Object.entries(activeFilters).filter(([, value]) => value && value !== "All").length;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (visibleRows.length === 0) {
        setAnnouncement(
          hasActiveControls
            ? "No matching records."
            : definition.emptyTitle ?? "No rows available yet.",
        );
        return;
      }

      if (showPagination && visibleRows.length > activePageSize) {
        const start = (safePage - 1) * activePageSize + 1;
        const end = Math.min(visibleRows.length, safePage * activePageSize);
        setAnnouncement(`Showing records ${start} to ${end} of ${visibleRows.length}.`);
        return;
      }

      setAnnouncement(`${visibleRows.length} record${visibleRows.length === 1 ? "" : "s"} showing.`);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [activePageSize, definition.emptyTitle, hasActiveControls, safePage, showPagination, visibleRows.length]);

  const renderActions = (row: T) => (
    <div className="flex items-center gap-1 shrink-0">
      {rowActions
        .filter((action) => !action.hidden?.(row, permissionContext))
        .map((action) => {
          const href = getActionHref(action, row);
          const disabled = action.disabled?.(row, permissionContext);
          const label = action.getLabel?.(row) ?? action.label;
          const rowLabel = definition.getTitle(row);
          const actionLabel = `${label} for ${rowLabel}`;

          if (href && !disabled) {
            return (
              <a
                key={action.id}
                href={href}
                target={action.target ?? "_blank"}
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${getActionClass(action.variant)}`}
                title={label}
                aria-label={actionLabel}
              >
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true">{action.icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </a>
            );
          }

          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                action.onClick?.(row);
              }}
              className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${getActionClass(action.variant)}`}
              title={label}
              aria-label={actionLabel}
            >
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">{action.icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            </button>
          );
        })}

      {onSelectRow && <ChevronRight size={14} className="text-slate-300" />}
    </div>
  );

  const renderCardRow = (row: T) => {
    const rowId = definition.getId(row);
    const isSelected = selectedId === rowId;
    const title = definition.getTitle(row);
    const subtitle = definition.getSubtitle?.(row);
    const summary = definition.getSummary?.(row);
    const issues = getAllGenericRowIssues(row, definition);
    const mostSevereIssue = issues.find((issue) => issue.severity === "error") ?? issues.find((issue) => issue.severity === "warning");

    const secondaryFields = getVisibleGenericFields(row, definition.fields, "list", permissionContext)
      .filter((field) => String(field.key) !== "name" && String(field.key) !== "title")
      .slice(0, maxVisibleFields);

    return (
        <div
        key={rowId}
        className={`p-4 hover:bg-slate-50/75 transition-all flex items-start justify-between gap-4 ${isSelected ? "bg-blue-50/35 border-l-4 border-blue-550 pl-3" : ""}`}
      >
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {onSelectRow ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectRow(row);
                }}
                className="font-semibold text-left text-slate-800 text-sm truncate block cursor-pointer"
                title={title}
                aria-label={`Open details for ${title}`}
              >
                {title}
              </button>
            ) : (
              <span className="font-semibold text-slate-800 text-sm truncate block" title={title}>
                {title}
              </span>
            )}

            {subtitle && (
              <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono shrink-0">
                {subtitle}
              </span>
            )}

            {mostSevereIssue && (
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getBadgeClass(mostSevereIssue.severity === "error" ? "danger" : "warning")}`}>
                <AlertTriangle size={10} />
                {issues.length} alert{issues.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {summary && (
            <p className="text-xs text-slate-500 line-clamp-1 italic font-sans">
              "{summary}"
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-450 font-mono pt-0.5">
            {secondaryFields.map((field) => (
              <span key={String(field.key)} className={field.className}>
                <span className="text-slate-350">{field.label}: </span>
                <span className="font-semibold text-slate-600">
                  {renderListFieldValue(row, field)}
                </span>
              </span>
            ))}
          </div>
        </div>

        {renderActions(row)}
      </div>
    );
  };

  const renderTable = () => {
    const fields = getVisibleGenericFields(null, definition.fields, "list", permissionContext)
      .slice(0, Math.max(3, maxVisibleFields + 1));

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">
                {definition.entityName}
              </th>
              {fields.map((field) => (
                <th key={String(field.key)} className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">
                  {field.label}
                </th>
              ))}
              {rowActions.length > 0 && (
                <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedRows.map((row) => {
              const rowId = definition.getId(row);
              const isSelected = selectedId === rowId;
              const issues = getAllGenericRowIssues(row, definition);

              return (
                <tr
                  key={rowId}
                  className={`hover:bg-slate-50/75 transition-all ${isSelected ? "bg-blue-50/35" : ""}`}
                  aria-selected={isSelected}
                >
                  <td className="px-4 py-3 font-bold text-slate-800 max-w-[260px]">
                    <div className="flex items-center gap-2">
                      {onSelectRow ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectRow(row);
                          }}
                          className="truncate text-left"
                          aria-label={`Open details for ${definition.getTitle(row)}`}
                        >
                          <span className="truncate">{definition.getTitle(row)}</span>
                        </button>
                      ) : (
                        <span className="truncate">{definition.getTitle(row)}</span>
                      )}
                      {issues.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-100">
                          <AlertTriangle size={10} />
                          {issues.length}
                        </span>
                      )}
                    </div>
                    {definition.getSubtitle?.(row) && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {definition.getSubtitle?.(row)}
                      </div>
                    )}
                  </td>

                  {fields.map((field) => (
                    <td key={String(field.key)} className="px-4 py-3 text-slate-600 align-top max-w-[220px]">
                      {renderListFieldValue(row, field)}
                    </td>
                  ))}

                  {rowActions.length > 0 && (
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex justify-end">{renderActions(row)}</div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <div className="p-4 border-b border-slate-100 bg-slate-50/75 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {definition.entityNamePlural}
            </h3>
            {definition.description && (
              <p className="text-[10.5px] text-slate-500 font-sans leading-normal mt-0.5">
                {definition.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">
              Showing {visibleRows.length} of {rows.length}
              {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`}
            </div>

            {renderToolbarActions?.()}

            {showDisplayModeToggle && (
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => updateDisplayMode("cards")}
                  className={`p-1.5 rounded-md cursor-pointer ${activeDisplayMode === "cards" ? "bg-blue-50 text-blue-700" : "text-slate-400 hover:text-slate-700"}`}
                  title="Card view"
                  aria-label="Card view"
                  aria-pressed={activeDisplayMode === "cards"}
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => updateDisplayMode("table")}
                  className={`p-1.5 rounded-md cursor-pointer ${activeDisplayMode === "table" ? "bg-blue-50 text-blue-700" : "text-slate-400 hover:text-slate-700"}`}
                  title="Table view"
                  aria-label="Table view"
                  aria-pressed={activeDisplayMode === "table"}
                >
                  <List size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        {(showSearch || showFilters || showSort) && (
          <div className="space-y-2">
            {showSearch && (
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={activeSearch}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder={definition.searchPlaceholder ?? `Search ${definition.entityNamePlural.toLowerCase()}...`}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                  aria-label={`Search ${definition.entityNamePlural.toLowerCase()}`}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {showFilters && filterableFields.length > 0 && (
                <>
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                    <Filter size={12} />
                    <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}:</span>
                  </div>

                  {filterableFields.map((field) => {
                    const fieldKey = String(field.key);
                    const options = getDistinctGenericFilterOptions(rows, field);

                    return (
                      <select
                        key={fieldKey}
                        value={activeFilters[fieldKey] ?? "All"}
                        onChange={(event) => updateFilter(fieldKey, event.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10.5px] text-slate-650 font-semibold focus:outline-hidden"
                        aria-label={`Filter by ${field.label}`}
                      >
                        <option value="All">{field.label}: All</option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    );
                  })}
                </>
              )}

            {showSort && sortableFields.length > 0 && (
              <>
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] ml-0 sm:ml-2">
                    <ChevronsUpDown size={12} />
                    <span>Sort:</span>
                  </div>

                  <select
                    value={activeSortState?.fieldKey ?? ""}
                    onChange={(event) => {
                      const fieldKey = event.target.value;
                      updateSortState(fieldKey ? { fieldKey, direction: activeSortState?.direction ?? "asc" } : null);
                    }}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10.5px] text-slate-650 font-semibold focus:outline-hidden"
                    aria-label={`Sort ${definition.entityNamePlural}`}
                  >
                    <option value="">Default</option>
                    {sortableFields.map((field) => (
                      <option key={String(field.key)} value={String(field.key)}>
                        {field.label}
                      </option>
                    ))}
                  </select>

                  {activeSortState && (
                    <button
                      type="button"
                      onClick={() =>
                        updateSortState({
                          fieldKey: activeSortState.fieldKey,
                          direction: activeSortState.direction === "asc" ? "desc" : "asc",
                        })
                      }
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      aria-label={`Sort direction ${activeSortState.direction === "asc" ? "ascending" : "descending"}`}
                    >
                      {activeSortState.direction === "asc" ? "Asc" : "Desc"}
                    </button>
                  )}
                </>
              )}

              {hasActiveControls && (
                <button
                  type="button"
                  onClick={clearControls}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X size={11} />
                  Clear
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(activeFilters)
                  .filter(([, value]) => value && value !== "All")
                  .map(([fieldKey, value]) => {
                    const field = filterableFields.find((item) => String(item.key) === fieldKey);
                    const label = field ? `${field.label}: ${value}` : `${fieldKey}: ${value}`;
                    return (
                      <button
                        key={fieldKey}
                        type="button"
                        onClick={() => updateFilter(fieldKey, "All")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
                        aria-label={`Remove filter ${label}`}
                        title={`Remove ${label}`}
                      >
                        <span className="max-w-[160px] truncate">{label}</span>
                        <X size={10} />
                      </button>
                    );
                  })}
                <button
                  type="button"
                  onClick={clearControls}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <Search size={32} className="mx-auto text-slate-350" />
          <p className="text-sm font-semibold text-slate-600">
            {definition.emptyTitle ?? `No ${definition.entityNamePlural.toLowerCase()} are available.`}
          </p>
          <p className="text-xs text-slate-400">
            {definition.emptyDescription ?? "This source has not returned live rows yet."}
          </p>
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <Search size={32} className="mx-auto text-slate-350" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-600">
              No records match the current search and filters.
            </p>
            <p className="text-xs text-slate-400">
              Clear one filter, clear all filters, or adjust the search terms to widen the results.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Boolean(activeSearch.trim()) && (
              <button
                type="button"
                onClick={() => updateSearch("")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10.5px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <X size={11} />
                Clear Search
              </button>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearControls}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10.5px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <X size={11} />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : activeDisplayMode === "table" ? (
        renderTable()
      ) : (
        <div className="divide-y divide-slate-100">
          {pagedRows.map((row) => renderCardRow(row))}
        </div>
      )}

      {showPagination && visibleRows.length > activePageSize && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-500 font-mono">
              Showing {visibleRows.length === 0 ? 0 : (safePage - 1) * activePageSize + 1}-{Math.min(visibleRows.length, safePage * activePageSize)} of {visibleRows.length}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Page {safePage} of {totalPages}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activePageSize}
              onChange={(event) => updatePageSize(Number(event.target.value))}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10.5px] text-slate-650 font-semibold focus:outline-hidden"
              aria-label="Rows per page"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => updatePage(Math.max(1, safePage - 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft size={13} />
            </button>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => updatePage(Math.min(totalPages, safePage + 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
