import React from "react";
import { AlertTriangle, ExternalLink, FileText, X } from "lucide-react";
import {
  formatGenericDate,
  getAllGenericRowIssues,
  getGenericFieldValue,
  getVisibleGenericFields,
  GenericEntityActionDefinition,
  GenericEntityDefinition,
  GenericEntityFieldDefinition,
  GenericEntityFieldKey,
  GenericEntityPermissionContext,
  hasGenericPermission,
} from "../../lib/genericEntityView";

interface GenericEntityDetailContext {
  displayMode?: "read-only" | "editable" | "restricted" | "unavailable";
  stateLabel?: string | null;
  sourceLabel?: string | null;
  sourceStatusLabel?: string | null;
  sourceLastSyncedAt?: string | null;
  sourceLastCheckedAt?: string | null;
  selectionNote?: string | null;
  readOnlyReason?: string | null;
}

interface GenericEntityDetailViewProps<T extends object> {
  definition: GenericEntityDefinition<T>;
  row: T | null;
  selectedRowId?: string | null;
  selectedRowIsVisible?: boolean;
  onClearSelection?: () => void;
  permissionContext?: GenericEntityPermissionContext;
  detailContext?: GenericEntityDetailContext | null;
  className?: string;
  childrenBeforeSections?: React.ReactNode;
  childrenAfterSections?: React.ReactNode;
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
  return "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200";
}

function getDisplayModeLabel(mode: GenericEntityDetailContext["displayMode"]): string {
  if (mode === "editable") return "Editable";
  if (mode === "restricted") return "Restricted";
  if (mode === "unavailable") return "Unavailable";
  return "Read only";
}

function getActionHref<T extends object>(action: GenericEntityActionDefinition<T>, row: T): string | undefined {
  return action.getHref?.(row) ?? action.href;
}

function renderDetailFieldValue<T extends object>(
  row: T,
  field: GenericEntityFieldDefinition<T>,
): React.ReactNode {
  if (field.renderDetailValue) return field.renderDetailValue(row);

  const value = getGenericFieldValue(row, field);

  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-500">Not available</span>;
  }

  if (field.type === "date") return formatGenericDate(value, false);
  if (field.type === "datetime") return formatGenericDate(value, true);
  if (field.type === "boolean") return value ? "Yes" : "No";

  if (field.type === "tags" && Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-400 italic">No tags assigned.</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5 justify-end">
        {value.map((tag) => (
          <span
            key={String(tag)}
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100"
          >
            {String(tag)}
          </span>
        ))}
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

  if (field.type === "link" && typeof value === "string") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-bold"
      >
        Open link <ExternalLink size={11} />
      </a>
    );
  }

  if (field.type === "longText") {
    return (
      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 text-left col-span-2 whitespace-pre-wrap break-words">
        {String(value)}
      </p>
    );
  }

  return String(value);
}

export default function GenericEntityDetailView<T extends object>({
  definition,
  row,
  selectedRowId,
  selectedRowIsVisible,
  onClearSelection,
  permissionContext,
  detailContext,
  className = "",
  childrenBeforeSections,
  childrenAfterSections,
}: GenericEntityDetailViewProps<T>) {
  const detailMode = definition.detail?.displayMode ?? detailContext?.displayMode ?? "read-only";
  const stateLabel = detailContext?.stateLabel ?? getDisplayModeLabel(detailMode);
  const sourceLabel = detailContext?.sourceLabel ?? null;
  const sourceStatusLabel = detailContext?.sourceStatusLabel ?? null;
  const readOnlyReason = definition.detail?.readOnlyReason ?? detailContext?.readOnlyReason ?? null;
  const selectionNote = detailContext?.selectionNote ?? null;
  const selectionVisibilityNote =
    selectionNote ||
    (selectedRowIsVisible === false
      ? "This record is still selected, but the current list filters hide it."
      : null);
  const sourceLastSyncedAt = detailContext?.sourceLastSyncedAt ?? null;
  const sourceLastCheckedAt = detailContext?.sourceLastCheckedAt ?? null;

  const buildDetailText = (fieldKeyCandidates: string[]): string | null => {
    if (!row) return null;

    for (const candidate of fieldKeyCandidates) {
      const field = definition.fields.find((item) => String(item.key) === candidate);
      if (!field) continue;

      const value = getGenericFieldValue(row, field);
      if (value === null || value === undefined || value === "") continue;

      if (field.type === "date") return formatGenericDate(value, false);
      if (field.type === "datetime") return formatGenericDate(value, true);
      if (field.type === "boolean") return value ? "Yes" : "No";
      if (Array.isArray(value)) {
        const joined = value.map(String).filter(Boolean).join(", ");
        if (joined) return joined;
        continue;
      }

      return String(value);
    }

    return null;
  };

  if (!row) {
    const missingHeadline = selectedRowId
      ? `Record ${selectedRowId} is no longer available.`
      : "No record selected";
    const missingBody = selectedRowId
      ? selectedRowIsVisible === false
        ? "The record is still selected, but the current list filters hide it. Clear the filters or close the detail pane to continue browsing."
        : "The direct link may be stale, the source may have changed, or the record may have been removed from the current dataset."
      : "Choose a record from the list to inspect its source details.";

    return (
      <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-3 ${className}`}>
        <FileText size={26} className="mx-auto text-slate-300" />
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-slate-800">{missingHeadline}</h3>
          <p className="text-xs text-slate-500">{missingBody}</p>
        </div>
        {selectedRowId && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600 break-all">
            Record ID: {selectedRowId}
          </div>
        )}
        {onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          >
            <X size={12} />
            Close detail
          </button>
        )}
      </div>
    );
  }

  const title = definition.getTitle(row);
  const subtitle = definition.getSubtitle?.(row);
  const issues = getAllGenericRowIssues(row, definition);
  const detailFields = getVisibleGenericFields(row, definition.fields, "detail", permissionContext);
  const fieldsByKey = new Map<string, GenericEntityFieldDefinition<T>>();
  detailFields.forEach((field) => fieldsByKey.set(String(field.key), field));

  const detailActions =
    definition.actions?.filter((action) => {
      if (!hasGenericPermission(action.permissions, permissionContext)) return false;
      if (action.hidden?.(row, permissionContext)) return false;
      return action.placement === "detail" || action.placement === "both" || !action.placement;
    }) ?? [];

  const sections = definition.sections?.length
    ? definition.sections
    : [
        {
          id: "details",
          title: `${definition.entityName} Details`,
          fields: detailFields.map((field) => field.key),
        },
      ];

  const metaEntries = [
    { label: "Record ID", value: definition.getId(row), tone: "default" },
    { label: "State", value: stateLabel, tone: detailMode === "editable" ? "success" : detailMode === "restricted" ? "warning" : detailMode === "unavailable" ? "danger" : "info" },
    sourceLabel ? { label: "Source", value: sourceLabel, tone: "default" } : null,
    sourceStatusLabel ? { label: "Source status", value: sourceStatusLabel, tone: "info" } : null,
    buildDetailText(["status", "reviewStatus", "enrollmentStatus", "sourceState", "sourceStatus"])
      ? { label: "Status", value: buildDetailText(["status", "reviewStatus", "enrollmentStatus", "sourceState", "sourceStatus"]) as string, tone: "default" }
      : null,
    buildDetailText(["owner", "ownerId", "importedBy", "verifiedBy", "teacherName"])
      ? { label: "Owner", value: buildDetailText(["owner", "ownerId", "importedBy", "verifiedBy", "teacherName"]) as string, tone: "default" }
      : null,
    buildDetailText(["createdAt", "created_at", "importedAt", "startedAt"])
      ? { label: "Created", value: buildDetailText(["createdAt", "created_at", "importedAt", "startedAt"]) as string, tone: "default" }
      : null,
    buildDetailText(["updatedAt", "updated_at", "modifiedAt", "completedAt"])
      ? { label: "Updated", value: buildDetailText(["updatedAt", "updated_at", "modifiedAt", "completedAt"]) as string, tone: "default" }
      : null,
    (buildDetailText(["lastSuccessfulSyncAt", "lastSyncedAt", "syncedAt"]) ?? (sourceLastSyncedAt ? formatGenericDate(sourceLastSyncedAt, true) : null))
      ? { label: "Last sync", value: buildDetailText(["lastSuccessfulSyncAt", "lastSyncedAt", "syncedAt"]) ?? (sourceLastSyncedAt ? formatGenericDate(sourceLastSyncedAt, true) : ""), tone: "default" }
      : null,
  ].filter((entry): entry is { label: string; value: string; tone: string } => Boolean(entry));

  const externalLinks = definition.detail?.externalLinks ?? [];

  const renderMetaChip = (label: string, value: string, tone: string) => {
    const chipClass =
      tone === "success"
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : tone === "warning"
          ? "bg-amber-50 text-amber-700 border-amber-100"
          : tone === "danger"
            ? "bg-rose-50 text-rose-700 border-rose-100"
            : tone === "info"
              ? "bg-blue-50 text-blue-700 border-blue-100"
              : "bg-slate-50 text-slate-700 border-slate-200";

    return (
      <div key={label} className={`rounded-xl border px-3 py-2 ${chipClass}`}>
        <div className="text-[9px] uppercase tracking-[0.18em] font-mono font-bold opacity-80">{label}</div>
        <div className="mt-1 text-[11px] font-semibold break-words">{value}</div>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 max-w-full overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-950 truncate" title={title}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
            aria-label={`Close ${definition.entityName} details`}
            title={`Close ${definition.entityName} details`}
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {metaEntries.map((entry) => renderMetaChip(entry.label, entry.value, entry.tone))}
      </div>

      {(readOnlyReason || selectionVisibilityNote || sourceLastCheckedAt) && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-[11px] text-slate-600 space-y-1.5">
          {readOnlyReason && <p className="font-semibold text-slate-700">{readOnlyReason}</p>}
          {selectionVisibilityNote && <p className="text-slate-500">{selectionVisibilityNote}</p>}
          {sourceLastCheckedAt && (
            <p className="text-slate-500">
              Last checked: {formatGenericDate(sourceLastCheckedAt, true)}
            </p>
          )}
        </div>
      )}

      {issues.length > 0 && (
        <div className="space-y-1.5">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`flex items-start gap-2 p-2 rounded-xl border text-[10.5px] font-semibold ${
                issue.severity === "error"
                  ? "bg-rose-50 text-rose-800 border-rose-100"
                  : issue.severity === "warning"
                    ? "bg-amber-50 text-amber-800 border-amber-100"
                    : issue.severity === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                      : "bg-blue-50 text-blue-800 border-blue-100"
              }`}
            >
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {childrenBeforeSections}

      <div className="space-y-3">
        {sections
          .filter((section) => !section.visible || section.visible(row, permissionContext))
          .map((section) => {
            const visibleSectionFields = section.fields
              .map((fieldKey: GenericEntityFieldKey<T>) => fieldsByKey.get(String(fieldKey)))
              .filter((field): field is GenericEntityFieldDefinition<T> => Boolean(field));

            if (visibleSectionFields.length === 0) return null;

            return (
              <div
                key={section.id}
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{section.title}</h4>
                  {section.description && (
                    <p className="text-[10.5px] text-slate-500 mt-0.5">{section.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 pt-2 border-t border-slate-200 text-slate-500 font-mono text-[10px]">
                  {visibleSectionFields.map((field) => {
                    const valueNode = renderDetailFieldValue(row, field);
                    const isLongText = field.type === "longText";

                    if (isLongText) {
                      return (
                        <React.Fragment key={String(field.key)}>
                          <span className="col-span-2 font-bold text-slate-600">{field.label}:</span>
                          <div className="col-span-2">{valueNode}</div>
                        </React.Fragment>
                      );
                    }

                    return (
                      <React.Fragment key={String(field.key)}>
                        <span className="pr-2">{field.label}:</span>
                        <span className={`font-bold text-slate-700 text-right break-words ${field.detailClassName ?? ""}`}>
                          {valueNode}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {childrenAfterSections}

      {externalLinks.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono font-bold text-slate-400">External links</div>
          <div className="flex flex-wrap gap-2">
            {externalLinks.map((link) => {
              const href = link.getHref?.(row) ?? link.href;
              if (!href) return null;

              return (
                <a
                  key={link.label}
                  href={href}
                  target={link.target ?? "_blank"}
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors ${
                    link.variant === "primary"
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      : link.variant === "danger"
                        ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  aria-label={link.description ? `${link.label}. ${link.description}` : link.label}
                  title={link.description ?? link.label}
                >
                  {link.label}
                  <ExternalLink size={11} />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {detailActions.length > 0 && (
        <div className="pt-3 border-t border-slate-150 flex flex-wrap gap-2">
          {detailActions.map((action) => {
            const href = getActionHref(action, row);
            const disabled = action.disabled?.(row, permissionContext);
            const disabledReason = action.disabledReason?.(row, permissionContext);
            const label = action.getLabel?.(row) ?? action.label;

            if (href && !disabled) {
              return (
                <a
                  key={action.id}
                  href={href}
                  target={action.target ?? "_blank"}
                  rel="noreferrer"
                  className={`flex-1 min-w-[130px] py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${getActionClass(action.variant)}`}
                  aria-label={label}
                >
                  {action.icon}
                  {label}
                </a>
              );
            }

            return (
              <button
                key={action.id}
                type="button"
                disabled={disabled}
                onClick={() => action.onClick?.(row)}
                className={`flex-1 min-w-[130px] py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${getActionClass(action.variant)}`}
                aria-label={label}
                title={disabledReason || label}
              >
                <span className="flex flex-col items-center gap-0.5 text-center">
                  <span className="inline-flex items-center gap-1.5">
                    {action.icon}
                    {label}
                  </span>
                  {disabledReason && (
                    <span className="text-[10px] font-medium text-current/70">{disabledReason}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
