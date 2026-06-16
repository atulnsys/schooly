const ROMAN_CLASS_ORDER: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12
};

const CLASS_LABEL_BY_NUMBER: Record<number, string> = {
  1: "Class I",
  2: "Class II",
  3: "Class III",
  4: "Class IV",
  5: "Class V",
  6: "Class VI",
  7: "Class VII",
  8: "Class VIII",
  9: "Class IX",
  10: "Class X",
  11: "Class XI",
  12: "Class XII"
};

export interface ClassSortInput {
  classOrder?: string | number | null;
  classNumber?: string | number | null;
  classLabel?: string | null;
}

function toNumericValue(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value).trim();
  if (!text) return null;
  const parsed = Number(text.replace(/[,%$]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractClassToken(label: string): string {
  const text = String(label || "").trim().toUpperCase();
  if (!text) return "";
  const match = text.match(/CLASS\s*([IVX]+|\d{1,2})/i);
  return match?.[1] || text.match(/([IVX]+|\d{1,2})/)?.[1] || "";
}

function fromLabel(label: string): number {
  const token = extractClassToken(label);
  if (!token) {
    const fallbackNumeric = String(label || "").match(/(\d+)/);
    return fallbackNumeric ? Number(fallbackNumeric[1]) : Number.MAX_SAFE_INTEGER;
  }
  if (/^\d+$/.test(token)) return Number(token);
  return ROMAN_CLASS_ORDER[token] || Number.MAX_SAFE_INTEGER;
}

export function getClassSortValue(input: string | ClassSortInput): number {
  if (typeof input === "string") {
    return fromLabel(input);
  }

  const classOrder = toNumericValue(input.classOrder);
  if (classOrder !== null) return classOrder;

  const classNumber = toNumericValue(input.classNumber);
  if (classNumber !== null) return classNumber;

  return fromLabel(input.classLabel || "");
}

export function compareClassLabels(left: string, right: string): number {
  const diff = getClassSortValue(left) - getClassSortValue(right);
  return diff !== 0 ? diff : String(left || "").localeCompare(String(right || ""));
}

export function formatClassLabel(label: string | number | null | undefined): string {
  if (label == null) return "";
  const text = String(label).trim();
  if (!text) return "";

  const directNumeric = toNumericValue(text);
  if (directNumeric !== null && CLASS_LABEL_BY_NUMBER[directNumeric]) {
    return CLASS_LABEL_BY_NUMBER[directNumeric];
  }

  const token = extractClassToken(text);
  if (!token) return text;

  if (/^\d+$/.test(token)) {
    const numeric = Number(token);
    return CLASS_LABEL_BY_NUMBER[numeric] || `Class ${token}`;
  }

  const roman = token.toUpperCase();
  return ROMAN_CLASS_ORDER[roman] ? `Class ${roman}` : text;
}
