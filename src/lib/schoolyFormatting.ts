const DEFAULT_MISSING_VALUE = "—";

type DateFormatOptions = {
  includeTime?: boolean;
  fallback?: string;
};

type NumberFormatOptions = {
  precision?: number;
  useGrouping?: boolean;
  fallback?: string;
};

type PercentageFormatOptions = {
  precision?: number;
  scale?: "fraction" | "whole";
  fallback?: string;
};

export function formatSchoolyDate(value: unknown, options: DateFormatOptions = {}): string {
  const { includeTime = false, fallback = DEFAULT_MISSING_VALUE } = options;
  if (value === null || value === undefined || value === "") return fallback;

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  try {
    if (includeTime) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(date);
  } catch {
    return includeTime ? date.toLocaleString() : date.toLocaleDateString();
  }
}

export function formatSchoolyNumber(value: unknown, options: NumberFormatOptions = {}): string {
  const { precision = 0, useGrouping = true, fallback = DEFAULT_MISSING_VALUE } = options;
  if (value === null || value === undefined || value === "") return fallback;

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
    useGrouping,
  }).format(numeric);
}

export function formatSchoolyPercentage(value: unknown, options: PercentageFormatOptions = {}): string {
  const { precision = 1, scale = "fraction", fallback = DEFAULT_MISSING_VALUE } = options;
  if (value === null || value === undefined || value === "") return fallback;

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);

  const percentageValue = scale === "fraction" ? numeric * 100 : numeric;
  return `${formatSchoolyNumber(percentageValue, { precision, useGrouping: true, fallback })}%`;
}

export function formatSchoolyCurrency(value: unknown, currency = "USD", precision = 0, fallback = DEFAULT_MISSING_VALUE): string {
  if (value === null || value === undefined || value === "") return fallback;

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: precision,
      minimumFractionDigits: precision,
    }).format(numeric);
  } catch {
    return `${currency} ${formatSchoolyNumber(numeric, { precision, useGrouping: true, fallback })}`;
  }
}

export function formatSchoolyCount(value: number | null | undefined, singular: string, plural?: string): string {
  if (value === null || value === undefined) return DEFAULT_MISSING_VALUE;

  const label = value === 1 ? singular : (plural || `${singular}s`);
  return `${formatSchoolyNumber(value, { precision: 0, useGrouping: true })} ${label}`;
}

export function formatSchoolyIdentifier(value: unknown, fallback = DEFAULT_MISSING_VALUE): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function formatSchoolyText(value: unknown, fallback = DEFAULT_MISSING_VALUE): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}
