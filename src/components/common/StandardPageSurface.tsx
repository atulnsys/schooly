import React from "react";

type MetricTone = "default" | "blue" | "emerald" | "amber" | "rose" | "violet";

interface StandardPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

interface StandardPageLayoutProps {
  pageId: string;
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  metrics?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  dataTestId?: string;
}

interface StandardMetricCardProps {
  label: string;
  value: string | number | null | undefined;
  description?: string;
  tone?: MetricTone;
  className?: string;
}

interface StandardMetricGridProps {
  items: Array<StandardMetricCardProps>;
  className?: string;
}

function getMetricToneClasses(tone: MetricTone | undefined): string {
  if (tone === "blue") return "border-blue-100 bg-blue-50/80 text-blue-700";
  if (tone === "emerald") return "border-emerald-100 bg-emerald-50/80 text-emerald-700";
  if (tone === "amber") return "border-amber-100 bg-amber-50/80 text-amber-700";
  if (tone === "rose") return "border-rose-100 bg-rose-50/80 text-rose-700";
  if (tone === "violet") return "border-violet-100 bg-violet-50/80 text-violet-700";
  return "border-slate-200 bg-white text-slate-700";
}

export function StandardPageHeader({
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel = "Back to Dashboard",
  badges,
  actions,
  className = "",
}: StandardPageHeaderProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`} data-schooly-page-header="true">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
              {eyebrow}
            </div>
          )}
          <a
            href={backHref}
            className="inline-flex w-fit items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label={backLabel}
          >
            {backLabel}
          </a>
          <div className="space-y-1">
            <h1 className="text-xl font-black tracking-tight text-slate-950 break-words">
              {title}
            </h1>
            {description && (
              <p className="max-w-3xl text-xs leading-relaxed text-slate-600">
                {description}
              </p>
            )}
          </div>
          {badges && <div className="flex flex-wrap gap-2">{badges}</div>}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}

export function StandardPageLayout({
  pageId,
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  badges,
  actions,
  metrics,
  children,
  className = "",
  headerClassName = "",
  contentClassName = "",
  dataTestId,
}: StandardPageLayoutProps) {
  return (
    <section
      id={pageId}
      data-testid={dataTestId ?? `${pageId}-page`}
      data-schooly-page={pageId}
      data-schooly-page-layout="true"
      tabIndex={-1}
      className={`space-y-6 outline-none ${className}`}
    >
      <StandardPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        backHref={backHref}
        backLabel={backLabel}
        badges={badges}
        actions={actions}
        className={headerClassName}
      />

      {metrics && (
        <div data-schooly-page-metrics="true">
          {metrics}
        </div>
      )}

      <div data-schooly-page-content="true" className={contentClassName}>
        {children}
      </div>
    </section>
  );
}

export function StandardMetricCard({
  label,
  value,
  description,
  tone = "default",
  className = "",
}: StandardMetricCardProps) {
  const resolvedValue = value === null || value === undefined || value === "" ? "—" : value;

  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${getMetricToneClasses(tone)} ${className}`} data-schooly-metric-card="true">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-xl font-black tracking-tight text-slate-950">
        {resolvedValue}
      </div>
      {description && (
        <div className="mt-1 text-[10.5px] leading-relaxed text-slate-500">
          {description}
        </div>
      )}
    </div>
  );
}

export function StandardMetricGrid({ items, className = "" }: StandardMetricGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 ${className}`} data-schooly-metric-grid="true">
      {items.map((item) => (
        <div key={item.label}>
          <StandardMetricCard
            label={item.label}
            value={item.value}
            description={item.description}
            tone={item.tone}
            className={item.className}
          />
        </div>
      ))}
    </div>
  );
}
