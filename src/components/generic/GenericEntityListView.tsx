import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Copy,
  Check,
  Filter,
  LayoutGrid,
  List,
  Pencil,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  buildDefaultGenericEntityTablePreferences,
  type GenericEntitySavedView,
  type GenericEntityTablePreferences,
} from "../../lib/genericEntityTableState";
import {
  formatGenericFieldValue,
  formatGenericDate,
  getAllGenericRowIssues,
  getDistinctGenericFilterOptions,
  getGenericFieldValue,
  filterGenericRows,
  getVisibleGenericFields,
  GenericEntityActionDefinition,
  GenericEntityDefinition,
  GenericEntityDensity,
  GenericEntityDisplayMode,
  GenericEntityFieldDefinition,
  GenericEntityFilterState,
  GenericEntityPermissionContext,
  GenericEntitySortState,
  hasGenericPermission,
  sortGenericRows,
} from "../../lib/genericEntityView";
import type { GenericEntityListState } from "./useGenericEntityListState";
import OverlaySurface from "../common/OverlaySurface";

interface GenericEntityListViewProps<T extends object> {
  definition: GenericEntityDefinition<T>;
  rows: T[];

  state?: GenericEntityListState<T> | null;
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

function getFieldLabel<T extends object>(field: GenericEntityFieldDefinition<T>): string {
  return String(field.tableLabel || field.label || field.key);
}

function getFieldKey<T extends object>(field: GenericEntityFieldDefinition<T>): string {
  return String(field.key);
}

function isFieldMandatory<T extends object>(field: GenericEntityFieldDefinition<T>): boolean {
  return Boolean(field.tableRequired || field.required || field.tableRole === "identity");
}

function isFieldHideLocked<T extends object>(field: GenericEntityFieldDefinition<T>): boolean {
  return isFieldMandatory(field) || field.tableHideable === false;
}

function isFieldPinnable<T extends object>(field: GenericEntityFieldDefinition<T>): boolean {
  if (field.tableRole === "action") return false;
  if (field.tablePinnable === false) return false;
  return true;
}

function getDefaultWidthOptions<T extends object>(field: GenericEntityFieldDefinition<T>): number[] {
  const minWidth = Math.max(96, field.tableMinWidth ?? 96);
  const baseWidth =
    field.tableWidth && Number.isFinite(field.tableWidth)
      ? Math.round(field.tableWidth)
      : minWidth;
  const maxWidth = Math.max(baseWidth, field.tableMaxWidth ?? baseWidth + 64);
  const options = Array.from(new Set([minWidth, baseWidth, maxWidth].filter((value) => Number.isFinite(value) && value > 0)));
  return options.sort((left, right) => left - right);
}

function renderBadgeValue(value: string, variant?: string, className = "") {
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold font-sans border ${getBadgeClass(variant)} ${className}`}>
      {value}
    </span>
  );
}

function renderListFieldValue<T extends object>(
  row: T,
  field: GenericEntityFieldDefinition<T>,
): React.ReactNode {
  if (field.renderListValue) return field.renderListValue(row);

  const value = getGenericFieldValue(row, field);
  const text = formatGenericFieldValue(row, field);

  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-350">—</span>;
  }

  if (field.type === "date") return formatGenericDate(value, false);
  if (field.type === "datetime") return formatGenericDate(value, true);

  if (field.type === "boolean") {
    return renderBadgeValue(value ? "Yes" : "No", value ? "success" : "default");
  }

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

  if (field.type === "badge" || field.type === "status") {
    return renderBadgeValue(text, field.getBadgeVariant?.(row));
  }

  if (field.type === "number" || field.type === "currency" || field.type === "percentage" || field.type === "identifier") {
    return <span className="font-semibold tabular-nums">{text}</span>;
  }

  return text;
}

function getActionHref<T extends object>(action: GenericEntityActionDefinition<T>, row: T): string | undefined {
  return action.getHref?.(row) ?? action.href;
}

function resolveControlValue<T extends object>(
  controlledValue: T | undefined,
  fallback: T,
): T {
  return controlledValue === undefined ? fallback : controlledValue;
}

export default function GenericEntityListView<T extends object>({
  definition,
  rows,
  state,
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
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [pendingDeleteViewId, setPendingDeleteViewId] = useState<string | null>(null);

  const columnsButtonRef = useRef<HTMLButtonElement | null>(null);
  const viewsButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastAnnouncementRef = useRef("");

  const activeSearch = resolveControlValue(searchValue ?? state?.searchValue, localSearch);
  const activeFilters = resolveControlValue(filterValues ?? state?.filterValues, localFilters);
  const activeDisplayMode = resolveControlValue(displayMode ?? state?.displayMode, localDisplayMode);
  const activeSortState = resolveControlValue(controlledSortState ?? state?.sortState, localSortState);
  const activePage = resolveControlValue(controlledPage ?? state?.page, localPage);
  const activePageSize = resolveControlValue(controlledPageSize ?? state?.pageSize, localPageSize);
  const activeTablePreferences = state?.tablePreferences
    ?? buildDefaultGenericEntityTablePreferences(definition.entityName, definition, permissionContext);
  const activeSavedView = state?.activeSavedView ?? null;
  const activeSavedViewId = state?.activeSavedViewId ?? null;
  const savedViews = state?.savedViews ?? [];
  const tableDirty = state?.tableDirty ?? false;
  const tableDensity = activeTablePreferences.density;

  const allListFields = useMemo(
    () =>
      getVisibleGenericFields(null, definition.fields, "list", permissionContext).filter(
        (field) => field.tableRole !== "action",
      ),
    [definition.fields, permissionContext],
  );

  const fieldByKey = useMemo(
    () => new Map(allListFields.map((field) => [getFieldKey(field), field] as const)),
    [allListFields],
  );

  const orderedFieldKeys = useMemo(() => {
    const knownKeys = new Set(allListFields.map((field) => getFieldKey(field)));
    const primaryOrder = activeTablePreferences.fieldOrder.filter((key) => knownKeys.has(key));
    const missing = allListFields.map((field) => getFieldKey(field)).filter((key) => !primaryOrder.includes(key));
    return [...primaryOrder, ...missing];
  }, [activeTablePreferences.fieldOrder, allListFields]);

  const orderedFields = useMemo(
    () => orderedFieldKeys.map((key) => fieldByKey.get(key)).filter((field): field is GenericEntityFieldDefinition<T> => Boolean(field)),
    [fieldByKey, orderedFieldKeys],
  );

  const visibleFieldSet = useMemo(
    () => new Set(activeTablePreferences.visibleFieldKeys),
    [activeTablePreferences.visibleFieldKeys],
  );
  const pinnedFieldSet = useMemo(
    () => new Set(activeTablePreferences.pinnedFieldKeys),
    [activeTablePreferences.pinnedFieldKeys],
  );

  const visibleFields = useMemo(
    () => orderedFields.filter((field) => visibleFieldSet.has(getFieldKey(field))),
    [orderedFields, visibleFieldSet],
  );

  const filterableFields = useMemo(
    () => allListFields.filter((field) => field.filterable),
    [allListFields],
  );

  const sortableFields = useMemo(
    () => allListFields.filter((field) => field.sortable),
    [allListFields],
  );

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
  const activeViewLabel = activeSavedView
    ? activeSavedView.visibility === "private"
      ? "Private view on this browser"
      : activeSavedView.name
    : null;
  const savedViewStorageNote =
    state?.savedViewStorageMode === "session"
      ? "Saved views are session-only until a connected account and school context are available."
      : null;

  useEffect(() => {
    if (activeSavedView && viewsOpen && !renameDraft) {
      setRenameDraft(activeSavedView.name);
    }
  }, [activeSavedView, renameDraft, viewsOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextAnnouncement =
        visibleRows.length === 0
          ? (Boolean(activeSearch.trim()) || Object.values(activeFilters).some((value) => value && value !== "All"))
            ? "No matching records."
            : definition.emptyTitle ?? "No rows available yet."
          : showPagination && visibleRows.length > activePageSize
            ? `Showing records ${((safePage - 1) * activePageSize) + 1} to ${Math.min(visibleRows.length, safePage * activePageSize)} of ${visibleRows.length}.`
            : `${visibleRows.length} record${visibleRows.length === 1 ? "" : "s"} showing.`;

      if (nextAnnouncement !== lastAnnouncementRef.current) {
        lastAnnouncementRef.current = nextAnnouncement;
        setAnnouncement(nextAnnouncement);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [activeFilters, activePageSize, activeSearch, definition.emptyTitle, safePage, showPagination, visibleRows.length]);

  const updateSearch = (value: string) => {
    if (state?.setSearchValue) state.setSearchValue(value);
    else setLocalSearch(value);
  };

  const updateFilter = (fieldKey: string, value: string) => {
    const updated = { ...activeFilters, [fieldKey]: value };
    if (state?.setFilterValues) state.setFilterValues(updated);
    else if (onFilterChange) onFilterChange(updated);
    else setLocalFilters(updated);
  };

  const updateDisplayMode = (mode: GenericEntityDisplayMode) => {
    if (state?.setDisplayMode) state.setDisplayMode(mode);
    else if (onDisplayModeChange) onDisplayModeChange(mode);
    else setLocalDisplayMode(mode);
  };

  const updateSortState = (value: GenericEntitySortState | null) => {
    if (state?.setSortState) state.setSortState(value);
    else if (onSortChange) onSortChange(value);
    else setLocalSortState(value);
  };

  const updatePage = (value: number) => {
    if (state?.setPage) state.setPage(value);
    else if (onPageChange) onPageChange(value);
    else setLocalPage(value);
  };

  const updatePageSize = (value: number) => {
    if (state?.setPageSize) state.setPageSize(value);
    else if (onPageSizeChange) onPageSizeChange(value);
    else setLocalPageSize(value);
  };

  const clearControls = () => {
    updateSearch("");
    const defaults = definition.defaultFilters ?? {};
    if (state?.setFilterValues) state.setFilterValues(defaults);
    else if (onFilterChange) onFilterChange(defaults);
    else setLocalFilters(defaults);
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

  const getColumnCellStyle = (field: GenericEntityFieldDefinition<T>, isPinned: boolean, leftOffset: number): React.CSSProperties => {
    const width = activeTablePreferences.columnWidths[getFieldKey(field)] ?? 160;
    const minWidth = Math.max(96, field.tableMinWidth ?? 96);
    const maxWidth = Math.max(width, field.tableMaxWidth ?? width + 64);
    return {
      width,
      minWidth,
      maxWidth,
      textAlign: field.tableAlign ?? "left",
      ...(isPinned
        ? {
            position: "sticky" as const,
            left: leftOffset,
            zIndex: 12,
            backgroundColor: "rgb(255 255 255)",
          }
        : {}),
    };
  };

  const renderHeaderButton = (field: GenericEntityFieldDefinition<T>, isActive: boolean) => {
    if (!field.sortable) {
      return <span className="block truncate">{getFieldLabel(field)}</span>;
    }

    return (
      <button
        type="button"
        onClick={() => {
          updateSortState({
            fieldKey: getFieldKey(field),
            direction:
              isActive && activeSortState?.direction === "asc"
                ? "desc"
                : "asc",
          });
        }}
        className="inline-flex items-center gap-1 text-left w-full"
        aria-label={`Sort by ${getFieldLabel(field)}`}
        aria-pressed={isActive}
      >
        <span className="truncate">{getFieldLabel(field)}</span>
        {isActive ? (
          activeSortState?.direction === "asc" ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="text-slate-300" />
        )}
      </button>
    );
  };

  const renderCardRow = (row: T) => {
    const rowId = definition.getId(row);
    const isSelected = selectedId === rowId;
    const title = definition.getTitle(row);
    const subtitle = definition.getSubtitle?.(row);
    const summary = definition.getSummary?.(row);
    const issues = getAllGenericRowIssues(row, definition);
    const mostSevereIssue = issues.find((issue) => issue.severity === "error") ?? issues.find((issue) => issue.severity === "warning");

    const secondaryFields = visibleFields
      .filter((field) => String(field.key) !== "name" && String(field.key) !== "title" && field.tableRole !== "identity")
      .slice(0, maxVisibleFields);

    return (
      <div
        key={rowId}
        className={`transition-all flex items-start justify-between ${tableDensity === "compact" ? "gap-3 p-3" : "gap-4 p-4"} hover:bg-slate-50/75 ${isSelected ? "bg-blue-50/35 border-l-4 border-blue-550 pl-3" : ""}`}
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
                <span className="text-slate-350">{getFieldLabel(field)}: </span>
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
    const identityField = visibleFields.find((field) => field.tableRole === "identity") ?? null;
    const identityWidth = identityField?.tableWidth ?? 240;
    const pinnedKeys = new Set(activeTablePreferences.pinnedFieldKeys);
    const rowPaddingY = tableDensity === "compact" ? "py-2" : "py-3";
    const headerPaddingY = tableDensity === "compact" ? "py-2.5" : "py-3";
    const bodyTextClass = tableDensity === "compact" ? "text-[11px]" : "text-xs";
    const tableFields = [
      ...visibleFields.filter((field) => field.tableRole !== "identity" && pinnedKeys.has(getFieldKey(field))),
      ...visibleFields.filter((field) => field.tableRole !== "identity" && !pinnedKeys.has(getFieldKey(field))),
    ];
    let leftOffset = identityWidth;

    return (
      <div className="overflow-x-auto max-w-full">
        <table className="min-w-full text-xs border-separate border-spacing-0">
          <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-20">
            <tr>
              <th
                className={`text-left px-4 ${headerPaddingY} font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-20 bg-slate-50`}
                style={{ width: identityWidth, minWidth: identityWidth, position: "sticky", left: 0 }}
                scope="col"
              >
                {identityField ? getFieldLabel(identityField) : definition.entityName}
              </th>
              {tableFields.map((field) => {
                const key = getFieldKey(field);
                const isPinned = pinnedKeys.has(key);
                const widthStyle = getColumnCellStyle(field, isPinned, leftOffset);
                if (isPinned) {
                  leftOffset += widthStyle.width ? Number(widthStyle.width) : 160;
                }
                return (
                  <th
                    key={key}
                    className={`text-left px-4 ${headerPaddingY} font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50`}
                    style={widthStyle}
                    scope="col"
                    aria-sort={activeSortState?.fieldKey === key ? (activeSortState.direction === "desc" ? "descending" : "ascending") : undefined}
                  >
                    {renderHeaderButton(field, activeSortState?.fieldKey === key)}
                  </th>
                );
              })}
              {rowActions.length > 0 && (
                <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50">
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
              let leftCellOffset = identityWidth;

              return (
                <tr
                  key={rowId}
                  className={`hover:bg-slate-50/75 transition-all ${isSelected ? "bg-blue-50/35" : ""}`}
                  aria-selected={isSelected}
                >
                  <td className={`px-4 ${rowPaddingY} font-bold text-slate-800 max-w-[260px] align-top sticky left-0 bg-white z-10`} style={{ width: identityWidth, minWidth: identityWidth }}>
                    <div className="flex items-center gap-2">
                      {onSelectRow ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectRow(row);
                          }}
                          className="truncate text-left"
                          aria-label={`Open details for ${identityField ? formatGenericFieldValue(row, identityField) : definition.getTitle(row)}`}
                        >
                          <span className="truncate">{identityField ? renderListFieldValue(row, identityField) : definition.getTitle(row)}</span>
                        </button>
                      ) : (
                        <span className="truncate">{identityField ? renderListFieldValue(row, identityField) : definition.getTitle(row)}</span>
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

                  {tableFields.map((field) => {
                    const key = getFieldKey(field);
                    const isPinned = pinnedKeys.has(key);
                    const widthStyle = getColumnCellStyle(field, isPinned, leftCellOffset);
                    if (isPinned) {
                      leftCellOffset += widthStyle.width ? Number(widthStyle.width) : 160;
                    }
                    const rawValue = getGenericFieldValue(row, field);
                    const renderedValue = renderListFieldValue(row, field);
                    const wrapClass = field.tableWrap === "wrap" || field.type === "longText"
                      ? "whitespace-normal break-words"
                      : "truncate";

                    return (
                      <td
                        key={key}
                        className={`px-4 ${rowPaddingY} text-slate-600 align-top ${bodyTextClass} ${wrapClass}`}
                        style={widthStyle}
                        title={typeof rawValue === "string" ? rawValue : undefined}
                      >
                        {renderedValue}
                      </td>
                    );
                  })}

                  {rowActions.length > 0 && (
                    <td className={`px-4 ${rowPaddingY} text-right align-top sticky right-0 bg-white ${bodyTextClass}`}>
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

  const renderColumnsDialog = () => {
    if (!state) return null;

    return (
      <OverlaySurface
        open={columnsOpen}
        onClose={() => setColumnsOpen(false)}
        title="Columns"
        description="Show or hide optional columns, move them with keyboard-friendly buttons, and set compact or comfortable density."
        closeLabel="Close columns dialog"
        returnFocusRef={columnsButtonRef}
        maxWidthClassName="max-w-4xl"
        bodyClassName="px-5 py-4 space-y-5"
        footerClassName="px-5 py-4"
        header={(
          <div className="space-y-1 border-b border-slate-200 px-0 pb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Table configuration</div>
            <h3 id="generic-columns-dialog-title" className="text-lg font-black tracking-tight text-slate-950">
              Columns
            </h3>
            <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
              Show or hide optional columns, move them with keyboard-friendly buttons, and set compact or comfortable density.
              The identity column stays visible and row actions remain fixed at the end.
            </p>
          </div>
        )}
        body={(
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Density</div>
                  <p className="text-[11px] text-slate-500">Choose the row density for this list.</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                  {(["comfortable", "compact"] as GenericEntityDensity[]).map((density) => (
                    <button
                      key={density}
                      type="button"
                      onClick={() => state.setTableDensity(density)}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-bold capitalize ${activeTablePreferences.density === density ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Columns</div>
              <div className="space-y-2">
                {orderedFields.map((field) => {
                  const key = getFieldKey(field);
                  const mandatory = isFieldMandatory(field);
                  const hideLocked = isFieldHideLocked(field);
                  const moveLocked = hideLocked || field.tableRole === "identity";
                  const visible = visibleFieldSet.has(key) || hideLocked;
                  const pinnable = isFieldPinnable(field);
                  const widthOptions = getDefaultWidthOptions(field);
                  const currentWidth = activeTablePreferences.columnWidths[key] ?? widthOptions[1] ?? widthOptions[0] ?? 160;
                  const currentWidthMatch = widthOptions.find((width) => width === currentWidth) ?? widthOptions[0] ?? currentWidth;
                  return (
                    <div key={key} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3 shadow-sm">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{getFieldLabel(field)}</span>
                            {mandatory && (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                Required
                              </span>
                            )}
                            {field.tableHideable === false && !mandatory && (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                Fixed
                              </span>
                            )}
                            {pinnedFieldSet.has(key) && (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                                Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {mandatory
                              ? "This column cannot be hidden."
                              : field.tableHideable === false
                                ? "This column is treated as fixed."
                                : "Toggle visibility and reorder it with the keyboard-friendly buttons."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${hideLocked ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-700"}`}>
                            <input
                              type="checkbox"
                              checked={visible}
                              disabled={hideLocked}
                              onChange={() => state.toggleTableFieldVisibility(key)}
                              className="accent-blue-600"
                              aria-label={`Show ${getFieldLabel(field)}`}
                            />
                            Visible
                          </label>

                          <button
                            type="button"
                            onClick={() => state.moveTableField(key, -1)}
                            disabled={moveLocked || orderedFields[0]?.key === field.key}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            aria-label={`Move ${getFieldLabel(field)} up`}
                          >
                            <ChevronUp size={12} />
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => state.moveTableField(key, 1)}
                            disabled={moveLocked || orderedFields[orderedFields.length - 1]?.key === field.key}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            aria-label={`Move ${getFieldLabel(field)} down`}
                          >
                            <ChevronDown size={12} />
                            Down
                          </button>

                          <button
                            type="button"
                            onClick={() => state.toggleTableFieldPin(key)}
                            disabled={!pinnable || mandatory}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            aria-label={`${pinnedFieldSet.has(key) ? "Unpin" : "Pin"} ${getFieldLabel(field)}`}
                          >
                            {pinnedFieldSet.has(key) ? <PinOff size={12} /> : <Pin size={12} />}
                            {pinnedFieldSet.has(key) ? "Unpin" : "Pin"}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <label className="space-y-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          <span>Width</span>
                          <select
                            value={String(currentWidthMatch)}
                            onChange={(event) => state.setTableFieldWidth(key, Number(event.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-semibold text-slate-700 shadow-sm focus:outline-hidden focus:border-blue-500"
                          >
                            {widthOptions.map((width) => (
                              <option key={width} value={width}>
                                {width}px
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10.5px] text-slate-500">
                          <div className="font-semibold text-slate-700">Column metadata</div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-white px-2 py-0.5 border border-slate-200">{field.type || "text"}</span>
                            <span className="rounded-full bg-white px-2 py-0.5 border border-slate-200">{field.tableAlign || "left"} aligned</span>
                            <span className="rounded-full bg-white px-2 py-0.5 border border-slate-200">{field.tableWrap || "truncate"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
        footer={(
          <>
            <button
              type="button"
              onClick={state.resetTablePreferences}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-bold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw size={12} />
              Reset to default
            </button>
            <button
              type="button"
              onClick={() => setColumnsOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-[10.5px] font-bold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </>
        )}
      />
    );
  };

  const renderViewsDialog = () => {
    if (!state) return null;

    const selectedView = activeSavedView;
    const canEditSelectedView = Boolean(selectedView && selectedView.source !== "system");

    return (
      <OverlaySurface
        open={viewsOpen}
        onClose={() => {
          setViewsOpen(false);
          setPendingDeleteViewId(null);
        }}
        title="Views"
        description="Saved views live in this browser only. They preserve search, filters, sort, page size, density, and column settings for this entity."
        closeLabel="Close views dialog"
        returnFocusRef={viewsButtonRef}
        maxWidthClassName="max-w-4xl"
        bodyClassName="px-5 py-4 space-y-5"
        footerClassName="px-5 py-4"
        header={(
          <div className="space-y-1 border-b border-slate-200 px-0 pb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Private views</div>
            <h3 id="generic-views-dialog-title" className="text-lg font-black tracking-tight text-slate-950">
              Views
            </h3>
            <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
              Saved views live in this browser only. They preserve search, filters, sort, page size, density, and column settings for this entity.
            </p>
            {savedViewStorageNote && (
              <p className="max-w-3xl text-[10.5px] leading-relaxed text-amber-700">
                {savedViewStorageNote}
              </p>
            )}
          </div>
        )}
        body={(
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Current selection</div>
                  <div className="text-sm font-bold text-slate-900">
                    {activeViewLabel || "Session state"}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {tableDirty ? "Unsaved view changes" : "No unsaved view changes"}
                  </p>
                </div>
                {activeSavedView?.isDefault && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    Default
                  </span>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Saved views</div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white text-slate-600 border border-slate-200">
                  {savedViews.length} saved
                </span>
              </div>

              {savedViews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                  No private views saved yet. Use the form below to capture the current configuration.
                </div>
              ) : (
                <div className="space-y-2">
                  {savedViews.map((view) => {
                    const isActive = view.id === activeSavedViewId;
                    const isPendingDelete = pendingDeleteViewId === view.id;
                    const canEditView = view.source !== "system";
                    return (
                      <div key={view.id} className={`rounded-2xl border px-4 py-3 text-left transition-colors ${isActive ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => state.setActiveView(view.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{view.name}</span>
                              {view.visibility === "private" && (
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                  Private view on this browser
                                </span>
                              )}
                              {view.isDefault && (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              Updated {new Date(view.updatedAt).toLocaleString()}
                            </div>
                          </button>
                          {isActive && (
                            <span className="rounded-full border border-blue-200 bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                              Active
                            </span>
                          )}
                        </div>
                        {isPendingDelete ? (
                          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 space-y-3">
                            <div className="font-bold">Delete this saved view?</div>
                            <p className="text-[11px] leading-relaxed text-rose-800">
                              This removes "{view.name}" from browser storage. The current page state stays available until you choose another view.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setPendingDeleteViewId(null)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-bold text-slate-700 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  state.setActiveView(view.id);
                                  state.deleteActiveView();
                                  setPendingDeleteViewId(null);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-600 px-3 py-2 text-[10.5px] font-bold text-white hover:bg-rose-700"
                              >
                                <Trash2 size={12} />
                                Delete view
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setPendingDeleteViewId(view.id)}
                              disabled={!canEditView}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10.5px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Save current state</div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={newViewName}
                  onChange={(event) => setNewViewName(event.target.value)}
                  placeholder="New private view name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    state.saveViewAsNew(newViewName);
                    setNewViewName("");
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-600 px-4 py-2 text-[10.5px] font-bold text-white hover:bg-blue-700"
                >
                  <Copy size={12} />
                  Save as new view
                </button>
              </div>
            </section>

            {selectedView && (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Selected view</div>
                    <div className="text-sm font-bold text-slate-900">{selectedView.name}</div>
                  </div>
                  {canEditSelectedView ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                      Editable
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                      Read only
                    </span>
                  )}
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    value={renameDraft}
                    onChange={(event) => setRenameDraft(event.target.value)}
                    placeholder="Rename selected view"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => state.renameActiveView(renameDraft)}
                    disabled={!canEditSelectedView || !renameDraft.trim()}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10.5px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Pencil size={12} />
                    Rename
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={state.updateActiveView}
                    disabled={!canEditSelectedView}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <RotateCcw size={12} />
                    Update view
                  </button>
                  <button
                    type="button"
                    onClick={() => state.duplicateActiveView()}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy size={12} />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => state.setDefaultView(selectedView.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10.5px] font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <Check size={12} />
                    Set default
                  </button>
                  <button
                    type="button"
                    onClick={state.resetViewChanges}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw size={12} />
                    Reset changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteViewId(selectedView.id)}
                    disabled={!canEditSelectedView}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10.5px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
        footer={(
          <>
            <button
              type="button"
              onClick={state.restoreSystemDefault}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-bold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw size={12} />
              Restore system default
            </button>
            <button
              type="button"
              onClick={() => {
                setViewsOpen(false);
                setPendingDeleteViewId(null);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-[10.5px] font-bold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </>
        )}
      />
    );
  };

  const renderTableOrCards = () => {
    if (rows.length === 0) {
      return (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <Search size={32} className="mx-auto text-slate-350" />
          <p className="text-sm font-semibold text-slate-600">
            {definition.emptyTitle ?? `No ${definition.entityNamePlural.toLowerCase()} are available.`}
          </p>
          <p className="text-xs text-slate-400">
            {definition.emptyDescription ?? "This source has not returned live rows yet."}
          </p>
        </div>
      );
    }

    if (visibleRows.length === 0) {
      return (
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
      );
    }

    return activeDisplayMode === "table" ? (
      renderTable()
    ) : (
      <div className="divide-y divide-slate-100">{pagedRows.map((row) => renderCardRow(row))}</div>
    );
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <div className="p-4 border-b border-slate-100 bg-slate-50/75 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
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

            {activeViewLabel && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${tableDirty ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                {tableDirty ? "Unsaved view changes" : activeViewLabel}
              </span>
            )}

            {renderToolbarActions?.()}

            {state && (
              <>
                <button
                  type="button"
                  ref={columnsButtonRef}
                  onClick={() => setColumnsOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10.5px] font-bold text-slate-700 hover:bg-slate-50"
                  aria-label="Columns"
                >
                  <LayoutGrid size={13} />
                  Columns
                </button>
                <button
                  type="button"
                  ref={viewsButtonRef}
                  onClick={() => {
                    setRenameDraft(activeSavedView?.name || "");
                    setViewsOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10.5px] font-bold text-slate-700 hover:bg-slate-50"
                  aria-label="Views"
                >
                  <ChevronLeft size={13} className="rotate-180" />
                  Views
                </button>
              </>
            )}

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
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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

      {renderTableOrCards()}

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

      {columnsOpen && renderColumnsDialog()}
      {viewsOpen && renderViewsDialog()}
    </div>
  );
}
