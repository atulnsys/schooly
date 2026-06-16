import { parseGoogleSheetUrl } from "./dataSourceEngine";
import { DEFAULT_SEEDED_REGISTRY_CONFIG } from "./seededRegistryConfig";
import {
  hasBlockingIssueForNcertChapter,
  type RegistryValidationIssue,
  validateNcertRegistryState
} from "./registryValidation";

export const NCERT_MAIN_REGISTRY_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1K5YkgmWWK7Br1kdTtjSZQBRnoxRfZu-goHUpH2ArMFk/edit";

export const NCERT_REGISTRY_SHEET_URL = NCERT_MAIN_REGISTRY_SHEET_URL;

export const NCERT_MAIN_REGISTRY_STORAGE_KEY = "schooly_ncert_english_medium_registry_sheet_url";
export const NCERT_REGISTRY_STORAGE_KEY = NCERT_MAIN_REGISTRY_STORAGE_KEY;
export const NCERT_SEED_TOC_STORAGE_KEY = "schooly_ncert_seed_toc_sheet_url";
export const NCERT_PRIVATE_DRIVE_MAP_STORAGE_KEY = "schooly_ncert_private_drive_map_sheet_url";

export type NcertRegistryMode = "missing" | "live" | "fallback" | "error";
export type NcertRowSource = "live_registry" | "legacy_import";
export type NcertMedium = "English" | "Hindi";

export interface RegistryRowSourceMeta {
  sourceWorkbookName: string;
  sourceTabName: string;
  sourceRowNumber?: number;
  sourceColumnByField: Record<string, string>;
  sourceCellByField: Record<string, string>;
}

export interface NcertRegistryConfig {
  registryUrl: string;
  privateDriveMapUrl: string;
}

export interface NcertBookRow {
  ncert_book_id: string;
  class: string;
  subject: string;
  medium: NcertMedium;
  book_title: string;
  book_code: string;
  official_source_url: string;
  source_portal: string;
  source_checked_date: string;
  academic_year_applicable: string;
  edition_or_version: string;
  rationalised_content_applicable: string;
  toc_status: string;
  source_verification_status: string;
  human_review_status: string;
  notes: string;
  source: NcertRowSource;
  sourceMeta?: RegistryRowSourceMeta;
}

export interface NcertChapterRow {
  ncert_chapter_id: string;
  ncert_book_id: string;
  class: string;
  subject: string;
  medium: NcertMedium;
  chapter_number: number;
  chapter_title: string;
  unit_name: string;
  start_page?: number;
  end_page?: number;
  official_chapter_url: string;
  qr_code_reference: string;
  toc_source: string;
  parsed_status: string;
  learning_outcome_status: string;
  source_verification_status: string;
  human_review_status: string;
  notes: string;
  source: NcertRowSource;
  sourceMeta?: RegistryRowSourceMeta;
}

export interface NcertRegistrySourceMapRow {
  registry_source_map_id: string;
  registry_name: string;
  source_label: string;
  source_type: string;
  source_url: string;
  tab_name: string;
  import_status: string;
  notes: string;
  sourceMeta?: RegistryRowSourceMeta;
}

export interface NcertRegistryAuditLogRow {
  registry_audit_log_id: string;
  event_type: string;
  event_status: string;
  event_timestamp: string;
  actor: string;
  target_tab: string;
  target_row_id: string;
  message: string;
  notes: string;
  sourceMeta?: RegistryRowSourceMeta;
}

export interface NcertRegistrySelection extends SchoolSelectedBookRow {}

export interface NcertRegistryHealth {
  status: "missing" | "healthy" | "warning" | "error";
  loadedAt: string | null;
  registryUrl: string;
  privateDriveMapUrl: string;
  warningCount: number;
  validationCount: number;
  bookCount: number;
  chapterCount: number;
  selectionCount: number;
  sourceMapCount: number;
  auditLogCount: number;
  warnings: string[];
}

export interface NcertLegacyRegistryImportResult {
  importedBookCount: number;
  importedChapterCount: number;
  importedSourceMapCount: number;
  importedAuditLogCount: number;
  warnings: string[];
}

export interface SchoolSelectedBookRow {
  school_book_selection_id: string;
  school_id: string;
  academic_year: string;
  class: string;
  section: string;
  subject: string;
  ncert_book_id: string;
  is_primary_textbook: string;
  optional_or_supplementary: string;
  school_drive_file_id: string;
  school_drive_file_url: string;
  import_status: string;
  notes: string;
  source: NcertRowSource;
  sourceMeta?: RegistryRowSourceMeta;
}

export interface NcertDriveSourceFolderRow {
  source_folder_id: string;
  school_id: string;
  academic_year: string;
  class: string;
  section: string;
  subject: string;
  medium: NcertMedium;
  ncert_book_id: string;
  book_title: string;
  drive_folder_url: string;
  access_status: string;
  scan_status: string;
  last_scanned_at: string;
  notes: string;
  sourceMeta?: RegistryRowSourceMeta;
}

export interface NcertChapterFileMapRow {
  chapter_file_map_id: string;
  school_id: string;
  academic_year: string;
  class: string;
  section: string;
  subject: string;
  medium: NcertMedium;
  ncert_book_id: string;
  ncert_chapter_id: string;
  book_title: string;
  chapter_number: number;
  chapter_title: string;
  drive_folder_url: string;
  drive_file_id: string;
  drive_file_url: string;
  file_name: string;
  file_mime_type: string;
  match_status: string;
  review_status: string;
  mapped_by: string;
  mapped_at: string;
  notes: string;
  sourceMeta?: RegistryRowSourceMeta;
}

export interface NcertRegistryState {
  mode: NcertRegistryMode;
  sourceLabel: string;
  warnings: string[];
  loadedAt: string | null;
  config: NcertRegistryConfig;
  books: NcertBookRow[];
  chapters: NcertChapterRow[];
  selectedBooks: SchoolSelectedBookRow[];
  lessonMapRows: Record<string, string>[];
  sourceVersionRows: NcertRegistrySourceMapRow[];
  sourceMapRows: NcertRegistrySourceMapRow[];
  auditLogRows: NcertRegistryAuditLogRow[];
  driveSourceFolders: NcertDriveSourceFolderRow[];
  chapterFileMapRows: NcertChapterFileMapRow[];
  validationIssues: RegistryValidationIssue[];
}

const REGISTRY_TABS = [
  "NCERT_Book_Registry",
  "NCERT_Chapter_Registry",
  "NCERT_Registry_Source_Map",
  "NCERT_Registry_Audit_Log",
  "README"
];

const PRIVATE_DRIVE_MAP_TABS = [
  "NCERT_Drive_Source_Folders",
  "NCERT_Chapter_File_Map"
];

function normalizeKey(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function cellToString(cell: any): string {
  if (cell == null) return "";
  if (typeof cell === "string") return cell.trim();
  if (typeof cell === "number" || typeof cell === "boolean") return String(cell);
  if (typeof cell.v !== "undefined" && cell.v != null) return String(cell.v).trim();
  if (typeof cell.f !== "undefined" && cell.f != null) return String(cell.f).trim();
  return "";
}

function looksLikeGeneratedColumnLabels(headers: string[]): boolean {
  return headers.length > 0 && headers.every((header, index) => {
    let label = "";
    let n = index + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      label = String.fromCharCode(65 + rem) + label;
      n = Math.floor((n - 1) / 26);
    }
    return header === normalizeKey(label);
  });
}

function parseGvizTable(text: string): Record<string, string>[] {
  const match = text.match(/setResponse\(([\s\S]+)\);\s*$/);
  if (!match) {
    throw new Error("Unexpected Google Sheets response format.");
  }

  const payload = JSON.parse(match[1]);
  const rawHeaders = (payload?.table?.cols || []).map((col: any, index: number) =>
    String(col.label || col.id || col.columnId || `column_${index + 1}`).trim()
  );
  const bodyRows = payload?.table?.rows || [];
  const firstRowValues = (bodyRows[0]?.c || []).map(cellToString);
  const useFirstRowAsHeaders = looksLikeGeneratedColumnLabels(rawHeaders.map(normalizeKey)) &&
    firstRowValues.some((value: string) => value.trim() !== "");
  const headers = (useFirstRowAsHeaders ? firstRowValues : rawHeaders).map((header: string, index: number) =>
    normalizeKey(header || `column_${index + 1}`)
  );

  return (useFirstRowAsHeaders ? bodyRows.slice(1) : bodyRows)
    .map((row: any, rowIndex: number) => {
      const entry: Record<string, string> = {};
      (row.c || []).forEach((cell: any, index: number) => {
        entry[headers[index] || `column_${index + 1}`] = cellToString(cell);
      });
      Object.defineProperty(entry, "__sourceRowNumber", {
        value: rowIndex + 2,
        enumerable: false
      });
      Object.defineProperty(entry, "__sourceColumnByField", {
        value: headers.reduce((acc: Record<string, string>, header: string, index: number) => {
          acc[header] = columnName(index);
          return acc;
        }, {}),
        enumerable: false
      });
      return entry;
    })
    .filter((row: Record<string, string>) => Object.values(row).some((value) => value.trim() !== ""));
}

function columnName(index: number): string {
  let value = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    value = String.fromCharCode(65 + rem) + value;
    n = Math.floor((n - 1) / 26);
  }
  return value;
}

function withSourceMeta(rows: Record<string, string>[], sourceWorkbookName: string, sourceTabName: string) {
  rows.forEach((row) => {
    const rowNumber = (row as any).__sourceRowNumber as number | undefined;
    const sourceColumnByField = ((row as any).__sourceColumnByField || {}) as Record<string, string>;
    Object.defineProperty(row, "__sourceMeta", {
      value: {
        sourceWorkbookName,
        sourceTabName,
        sourceRowNumber: rowNumber,
        sourceColumnByField,
        sourceCellByField: Object.fromEntries(
          Object.entries(sourceColumnByField).map(([field, column]) => [field, rowNumber ? `${column}${rowNumber}` : column])
        )
      } satisfies RegistryRowSourceMeta,
      enumerable: false
    });
  });
  return rows;
}

async function fetchSheetTabRows(sheetUrl: string, tabName: string): Promise<Record<string, string>[]> {
  const parsed = parseGoogleSheetUrl(sheetUrl);
  if (!parsed) {
    throw new Error("NCERT registry URL is not a Google Sheets link.");
  }
  const url = `https://docs.google.com/spreadsheets/d/${parsed.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const response = await fetch(url, { headers: { Accept: "text/plain, */*" } });
  if (!response.ok) {
    throw new Error(`Tab '${tabName}' returned ${response.status}.`);
  }
  return parseGvizTable(await response.text());
}

async function fetchTabs(sheetUrl: string, tabNames: string[], sourceLabel: string) {
  const warnings: string[] = [];
  const tabs: Record<string, Record<string, string>[]> = {};
  const settled = await Promise.allSettled(
    tabNames.map(async (tabName) => [tabName, await fetchSheetTabRows(sheetUrl, tabName)] as const)
  );

  settled.forEach((result, index) => {
    const tabName = tabNames[index];
    if (result.status === "fulfilled") {
      tabs[tabName] = result.value[1];
      withSourceMeta(tabs[tabName], sourceLabel, tabName);
    } else {
      tabs[tabName] = [];
      warnings.push(`${sourceLabel}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    }
  });

  return { tabs, warnings };
}

function sourceMetaFor(row: Record<string, string>): RegistryRowSourceMeta | undefined {
  return (row as any).__sourceMeta as RegistryRowSourceMeta | undefined;
}

function pick(row: Record<string, string>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (row[normalized] && row[normalized].trim()) return row[normalized].trim();
  }
  return fallback;
}

function toNumber(value: string): number | undefined {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeStatus(value: string, fallback = "Needs Official Verification"): string {
  const text = String(value || "").trim();
  if (!text) return fallback;
  const lowered = text.toLowerCase();
  if (lowered.includes("toc") && lowered.includes("pending")) return "TOC Pending";
  if (lowered.includes("needs") && lowered.includes("review")) return "Extracted - Needs Human Review";
  if (lowered.includes("verified")) return "Verified";
  if (lowered.includes("official") && lowered.includes("link")) return "Official Link Only";
  return text;
}

function normalizeComparable(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeBookIdentity(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function makeBookFallbackKey(book: Pick<NcertBookRow, "class" | "subject" | "medium" | "book_title">): string {
  return [
    normalizeComparable(book.class),
    normalizeComparable(book.subject),
    normalizeComparable(book.medium || "English"),
    normalizeComparable(book.book_title)
  ].join("|");
}

function makeBookMergeKey(book: NcertBookRow): string {
  const bookId = normalizeBookIdentity(book.ncert_book_id);
  return bookId ? `id:${bookId}` : `fallback:${makeBookFallbackKey(book)}`;
}

function isTocPendingTitle(value: string): boolean {
  const title = normalizeComparable(value);
  return !title || title === "toc pending" || title === "toc pending - add/parse reviewed chapter rows";
}

function isTocPendingStatus(value: string): boolean {
  const status = normalizeComparable(value);
  return status.includes("toc pending");
}

function normalizeBook(row: Record<string, string>, source: NcertRowSource): NcertBookRow {
  const bookId = pick(row, ["ncert_book_id", "book_id", "id"], "");
  const title = pick(row, ["book_title", "title", "book_name", "name"], "");
  const tocStatus = normalizeStatus(pick(row, ["toc_status", "source_verification_status", "status"], ""));
  return {
    ncert_book_id: bookId || `${pick(row, ["class"], "class")}-${pick(row, ["subject"], "subject")}-${title}`.replace(/\s+/g, "_").toLowerCase(),
    class: pick(row, ["class", "class_name", "grade"], ""),
    subject: pick(row, ["subject", "subject_name"], ""),
    medium: pick(row, ["medium", "language"], "English") as NcertMedium,
    book_title: title,
    book_code: pick(row, ["book_code", "ncert_book_code", "code"], ""),
    official_source_url: pick(row, ["official_source_url", "official_url", "source_url", "complete_book_url", "url"], ""),
    source_portal: pick(row, ["source_portal", "portal"], "NCERT/ePathshala"),
    source_checked_date: pick(row, ["source_checked_date", "checked_date", "last_checked"], ""),
    academic_year_applicable: pick(row, ["academic_year_applicable", "academic_year"], ""),
    edition_or_version: pick(row, ["edition_or_version", "version", "edition"], ""),
    rationalised_content_applicable: pick(row, ["rationalised_content_applicable", "rationalized_content_applicable", "rationalised"], ""),
    toc_status: tocStatus,
    source_verification_status: normalizeStatus(pick(row, ["source_verification_status", "verification_status", "status"], tocStatus)),
    human_review_status: normalizeStatus(pick(row, ["human_review_status", "review_status"], tocStatus), tocStatus),
    notes: pick(row, ["notes", "remarks"], ""),
    source,
    sourceMeta: sourceMetaFor(row)
  };
}

function normalizeChapter(row: Record<string, string>, source: NcertRowSource): NcertChapterRow {
  const chapterNumber = toNumber(pick(row, ["chapter_number", "chapter_no", "number", "num"], "")) || 0;
  const title = pick(row, ["chapter_title", "chapter_name", "title", "name"], chapterNumber ? `Chapter ${chapterNumber}` : "");
  const parsedStatus = normalizeStatus(pick(row, ["parsed_status", "toc_status", "source_verification_status", "status"], ""));
  return {
    ncert_chapter_id: pick(row, ["ncert_chapter_id", "chapter_id", "id"], ""),
    ncert_book_id: pick(row, ["ncert_book_id", "book_id"], ""),
    class: pick(row, ["class", "class_name", "grade"], ""),
    subject: pick(row, ["subject", "subject_name"], ""),
    medium: pick(row, ["medium", "language"], "English") as NcertMedium,
    chapter_number: chapterNumber,
    chapter_title: title,
    unit_name: pick(row, ["unit_name", "unit"], ""),
    start_page: toNumber(pick(row, ["start_page", "page_start"], "")),
    end_page: toNumber(pick(row, ["end_page", "page_end"], "")),
    official_chapter_url: pick(row, ["official_chapter_url", "chapter_url", "official_source_url", "url"], ""),
    qr_code_reference: pick(row, ["qr_code_reference", "qr_code"], ""),
    toc_source: pick(row, ["toc_source", "source"], ""),
    parsed_status: parsedStatus,
    learning_outcome_status: normalizeStatus(pick(row, ["learning_outcome_status", "outcome_status"], ""), "Needs Official Verification"),
    source_verification_status: normalizeStatus(pick(row, ["source_verification_status", "verification_status"], parsedStatus), parsedStatus),
    human_review_status: normalizeStatus(pick(row, ["human_review_status", "review_status"], parsedStatus), parsedStatus),
    notes: pick(row, ["notes", "remarks"], ""),
    source,
    sourceMeta: sourceMetaFor(row)
  };
}

function normalizeSelection(row: Record<string, string>, source: NcertRowSource): SchoolSelectedBookRow {
  return {
    school_book_selection_id: pick(row, ["school_book_selection_id", "selection_id", "id"], ""),
    school_id: pick(row, ["school_id"], ""),
    academic_year: pick(row, ["academic_year"], ""),
    class: pick(row, ["class", "class_name", "grade"], ""),
    section: pick(row, ["section"], ""),
    subject: pick(row, ["subject", "subject_name"], ""),
    ncert_book_id: pick(row, ["ncert_book_id", "book_id"], ""),
    is_primary_textbook: pick(row, ["is_primary_textbook", "primary"], ""),
    optional_or_supplementary: pick(row, ["optional_or_supplementary", "book_role"], ""),
    school_drive_file_id: pick(row, ["school_drive_file_id", "drive_file_id"], ""),
    school_drive_file_url: pick(row, ["school_drive_file_url", "drive_file_url"], ""),
    import_status: pick(row, ["import_status", "status"], ""),
    notes: pick(row, ["notes", "remarks"], ""),
    source,
    sourceMeta: sourceMetaFor(row)
  };
}

function normalizeDriveSourceFolder(row: Record<string, string>): NcertDriveSourceFolderRow {
  return {
    source_folder_id: pick(row, ["source_folder_id", "id"], ""),
    school_id: pick(row, ["school_id"], ""),
    academic_year: pick(row, ["academic_year"], ""),
    class: pick(row, ["class", "class_name", "grade"], ""),
    section: pick(row, ["section"], ""),
    subject: pick(row, ["subject", "subject_name"], ""),
    medium: pick(row, ["medium", "language"], "English") as NcertMedium,
    ncert_book_id: pick(row, ["ncert_book_id", "book_id"], ""),
    book_title: pick(row, ["book_title", "title", "book_name", "name"], ""),
    drive_folder_url: pick(row, ["drive_folder_url", "folder_url", "url"], ""),
    access_status: pick(row, ["access_status"], ""),
    scan_status: pick(row, ["scan_status"], ""),
    last_scanned_at: pick(row, ["last_scanned_at"], ""),
    notes: pick(row, ["notes", "remarks"], ""),
    sourceMeta: sourceMetaFor(row)
  };
}

function normalizeChapterFileMap(row: Record<string, string>): NcertChapterFileMapRow {
  return {
    chapter_file_map_id: pick(row, ["chapter_file_map_id", "id"], ""),
    school_id: pick(row, ["school_id"], ""),
    academic_year: pick(row, ["academic_year"], ""),
    class: pick(row, ["class", "class_name", "grade"], ""),
    section: pick(row, ["section"], ""),
    subject: pick(row, ["subject", "subject_name"], ""),
    medium: pick(row, ["medium", "language"], "English") as NcertMedium,
    ncert_book_id: pick(row, ["ncert_book_id", "book_id"], ""),
    ncert_chapter_id: pick(row, ["ncert_chapter_id", "chapter_id"], ""),
    book_title: pick(row, ["book_title", "title", "book_name", "name"], ""),
    chapter_number: toNumber(pick(row, ["chapter_number", "chapter_no", "number", "num"], "")) || 0,
    chapter_title: pick(row, ["chapter_title", "chapter_name", "title", "name"], ""),
    drive_folder_url: pick(row, ["drive_folder_url", "folder_url"], ""),
    drive_file_id: pick(row, ["drive_file_id", "file_id"], ""),
    drive_file_url: pick(row, ["drive_file_url", "file_url", "url"], ""),
    file_name: pick(row, ["file_name", "filename", "name"], ""),
    file_mime_type: pick(row, ["file_mime_type", "mime_type"], ""),
    match_status: pick(row, ["match_status", "status"], ""),
    review_status: pick(row, ["review_status"], ""),
    mapped_by: pick(row, ["mapped_by"], ""),
    mapped_at: pick(row, ["mapped_at"], ""),
    notes: pick(row, ["notes", "remarks"], ""),
    sourceMeta: sourceMetaFor(row)
  };
}

function normalizeRegistrySourceMap(row: Record<string, string>): NcertRegistrySourceMapRow {
  return {
    registry_source_map_id: pick(row, ["registry_source_map_id", "source_map_id", "id"], ""),
    registry_name: pick(row, ["registry_name", "registry"], "Schooly_NCERT_English_Medium_Registry"),
    source_label: pick(row, ["source_label", "label", "source_name"], ""),
    source_type: pick(row, ["source_type", "type"], ""),
    source_url: pick(row, ["source_url", "url", "drive_url"], ""),
    tab_name: pick(row, ["tab_name", "sheet_name", "tab"], ""),
    import_status: pick(row, ["import_status", "status"], ""),
    notes: pick(row, ["notes", "remarks"], ""),
    sourceMeta: sourceMetaFor(row)
  };
}

function normalizeRegistryAuditLog(row: Record<string, string>): NcertRegistryAuditLogRow {
  return {
    registry_audit_log_id: pick(row, ["registry_audit_log_id", "audit_log_id", "id"], ""),
    event_type: pick(row, ["event_type", "type"], ""),
    event_status: pick(row, ["event_status", "status"], ""),
    event_timestamp: pick(row, ["event_timestamp", "timestamp", "created_at"], ""),
    actor: pick(row, ["actor", "user", "updated_by"], ""),
    target_tab: pick(row, ["target_tab", "tab_name", "sheet_name"], ""),
    target_row_id: pick(row, ["target_row_id", "row_id", "record_id"], ""),
    message: pick(row, ["message", "details"], ""),
    notes: pick(row, ["notes", "remarks"], ""),
    sourceMeta: sourceMetaFor(row)
  };
}

export function isRealNcertChapterRow(chapter: NcertChapterRow): boolean {
  if (isTocPendingTitle(chapter.chapter_title)) return false;
  if (isTocPendingStatus(chapter.parsed_status) || isTocPendingStatus(chapter.source_verification_status)) return false;
  return true;
}

export function getNcertBookChapterSummary(book: NcertBookRow, chapters: NcertChapterRow[]) {
  const realChapters = chapters
    .filter((chapter) => normalizeBookIdentity(chapter.ncert_book_id) === normalizeBookIdentity(book.ncert_book_id))
    .filter(isRealNcertChapterRow);
  const hasSeed = realChapters.some((chapter) => chapter.source === "legacy_import");
  return {
    count: realChapters.length,
    hasSeed,
    sourceLabel: realChapters.length > 0 ? "Registry" : "",
    chapters: realChapters
  };
}

export function findNcertDriveSourceFolder(
  book: NcertBookRow | undefined,
  folders: NcertDriveSourceFolderRow[]
): NcertDriveSourceFolderRow | undefined {
  if (!book) return undefined;
  const bookId = normalizeBookIdentity(book.ncert_book_id);
  if (bookId) {
    const byId = folders.find((folder) => normalizeBookIdentity(folder.ncert_book_id) === bookId);
    if (byId) return byId;
  }
  return folders.find((folder) =>
    !normalizeBookIdentity(folder.ncert_book_id) &&
    normalizeComparable(folder.class) === normalizeComparable(book.class) &&
    normalizeComparable(folder.subject) === normalizeComparable(book.subject) &&
    normalizeComparable(folder.medium || "English") === normalizeComparable(book.medium || "English") &&
    normalizeComparable(folder.book_title) === normalizeComparable(book.book_title)
  );
}

export function findNcertChapterFileMap(
  chapter: NcertChapterRow | undefined,
  rows: NcertChapterFileMapRow[]
): NcertChapterFileMapRow | undefined {
  if (!chapter) return undefined;
  const chapterId = normalizeBookIdentity(chapter.ncert_chapter_id);
  if (chapterId) {
    const byChapterId = rows.find((row) => normalizeBookIdentity(row.ncert_chapter_id) === chapterId);
    if (byChapterId) return byChapterId;
  }
  const matches = rows.filter((row) =>
    !normalizeBookIdentity(row.ncert_chapter_id) &&
    normalizeBookIdentity(row.ncert_book_id) === normalizeBookIdentity(chapter.ncert_book_id) &&
    Number(row.chapter_number || 0) === Number(chapter.chapter_number || 0) &&
    normalizeComparable(row.chapter_title) === normalizeComparable(chapter.chapter_title)
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function getNcertChapterPdfStatus(chapter: NcertChapterRow | undefined, rows: NcertChapterFileMapRow[]): string {
  const fileMap = findNcertChapterFileMap(chapter, rows);
  if (!fileMap) return "PDF missing";
  const status = normalizeComparable(fileMap.match_status);
  if (status.includes("ambiguous")) return "PDF match ambiguous";
  if (status.includes("pending")) return "PDF match pending";
  if (fileMap.drive_file_id || fileMap.drive_file_url) return "PDF linked";
  return "PDF missing";
}

export function loadNcertRegistryConfig(): NcertRegistryConfig {
  try {
    return {
      registryUrl: localStorage.getItem(NCERT_REGISTRY_STORAGE_KEY) || localStorage.getItem("schooly_ncert_main_registry_sheet_url") || NCERT_REGISTRY_SHEET_URL,
      privateDriveMapUrl: localStorage.getItem(NCERT_PRIVATE_DRIVE_MAP_STORAGE_KEY) || DEFAULT_SEEDED_REGISTRY_CONFIG.ncertPrivateDriveMapUrl
    };
  } catch {
    return {
      registryUrl: NCERT_REGISTRY_SHEET_URL,
      privateDriveMapUrl: DEFAULT_SEEDED_REGISTRY_CONFIG.ncertPrivateDriveMapUrl
    };
  }
}

export function saveNcertRegistryConfig(config: NcertRegistryConfig): void {
  try {
    localStorage.setItem(NCERT_REGISTRY_STORAGE_KEY, config.registryUrl.trim());
    localStorage.setItem(NCERT_PRIVATE_DRIVE_MAP_STORAGE_KEY, config.privateDriveMapUrl.trim());
    localStorage.removeItem("schooly_ncert_main_registry_sheet_url");
    localStorage.removeItem(NCERT_SEED_TOC_STORAGE_KEY);
  } catch (error) {
    console.warn("[NCERT REGISTRY] Unable to persist registry config.", error);
  }
}

export function getNcertStatusTone(status: string): "good" | "warn" | "pending" | "info" {
  const lowered = String(status || "").toLowerCase();
  if (lowered.includes("verified")) return "good";
  if (lowered.includes("needs") && lowered.includes("review")) return "warn";
  if (lowered.includes("toc") && lowered.includes("pending")) return "pending";
  return "info";
}

export function chapterToTopicName(chapter: NcertChapterRow): string {
  const prefix = chapter.chapter_number ? `Chapter ${chapter.chapter_number}: ` : "";
  return `${prefix}${chapter.chapter_title || "Untitled Chapter"}`.trim();
}

export async function loadNcertRegistry(config = loadNcertRegistryConfig()): Promise<NcertRegistryState> {
  const hasRegistry = !!config.registryUrl.trim();

  if (!hasRegistry) {
    return {
      mode: "missing",
      sourceLabel: "NCERT registry missing",
      warnings: ["No NCERT registry sheet URL is configured."],
      loadedAt: null,
      config,
      books: [],
      chapters: [],
      selectedBooks: [],
      lessonMapRows: [],
      sourceVersionRows: [],
      sourceMapRows: [],
      auditLogRows: [],
      driveSourceFolders: [],
      chapterFileMapRows: [],
      validationIssues: []
    };
  }

  const warnings: string[] = [];
  let registryTabs: Record<string, Record<string, string>[]> = {};
  let privateDriveMapTabs: Record<string, Record<string, string>[]> = {};
  let loadedAny = false;

  try {
    const registry = await fetchTabs(config.registryUrl, REGISTRY_TABS, "NCERT English-medium registry");
    registryTabs = registry.tabs;
    warnings.push(...registry.warnings);
    loadedAny = loadedAny || Object.values(registry.tabs).some((rows) => rows.length > 0);
  } catch (error: any) {
    warnings.push(`NCERT English-medium registry: ${error?.message || String(error)}`);
  }

  if (config.privateDriveMapUrl.trim()) {
    try {
      const privateMap = await fetchTabs(config.privateDriveMapUrl, PRIVATE_DRIVE_MAP_TABS, "private Drive map");
      privateDriveMapTabs = privateMap.tabs;
      warnings.push(...privateMap.warnings);
    } catch (error: any) {
      warnings.push(`private Drive map: ${error?.message || String(error)}`);
    }
  } else {
    warnings.push("Private Drive map sheet URL is not configured. Add Schooly_NCERT_Private_Drive_Map to show Drive folder/PDF linkage.");
  }

  if (!loadedAny) {
    return {
      mode: "error",
      sourceLabel: "NCERT registry fetch failed",
      warnings: warnings.length > 0 ? warnings : ["No NCERT registry rows were returned."],
      loadedAt: null,
      config,
      books: [],
      chapters: [],
      selectedBooks: [],
      lessonMapRows: [],
      sourceVersionRows: [],
      sourceMapRows: [],
      auditLogRows: [],
      driveSourceFolders: [],
      chapterFileMapRows: [],
      validationIssues: []
    };
  }

  const books = (registryTabs.NCERT_Book_Registry || []).map((row) => normalizeBook(row, "live_registry"));
  const chapters = (registryTabs.NCERT_Chapter_Registry || []).map((row) => normalizeChapter(row, "live_registry"));
  const selectedBooks: SchoolSelectedBookRow[] = [];

  const driveSourceFolders = (privateDriveMapTabs.NCERT_Drive_Source_Folders || []).map(normalizeDriveSourceFolder);
  const chapterFileMapRows = (privateDriveMapTabs.NCERT_Chapter_File_Map || []).map(normalizeChapterFileMap);
  const lessonMapRows: Record<string, string>[] = [];
  const sourceMapRows = (registryTabs.NCERT_Registry_Source_Map || []).map(normalizeRegistrySourceMap);
  const auditLogRows = (registryTabs.NCERT_Registry_Audit_Log || []).map(normalizeRegistryAuditLog);
  const validationIssues = validateNcertRegistryState({
    books,
    chapters,
    selectedBooks,
    lessonMapRows,
    driveSourceFolders,
    chapterFileMapRows
  });
  const usableChapters = chapters.filter((chapter) => !hasBlockingIssueForNcertChapter(chapter, validationIssues));

  return {
    mode: "live",
    sourceLabel: "NCERT registry connected",
    warnings,
    loadedAt: new Date().toISOString(),
    config,
    books,
    chapters: usableChapters,
    selectedBooks,
    lessonMapRows,
    sourceVersionRows: sourceMapRows,
    sourceMapRows,
    auditLogRows,
    driveSourceFolders,
    chapterFileMapRows,
    validationIssues
  };
}
