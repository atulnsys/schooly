import type {
  NcertBookRow,
  NcertChapterFileMapRow,
  NcertChapterRow,
  NcertDriveSourceFolderRow,
  RegistryRowSourceMeta,
  SchoolSelectedBookRow
} from "./ncertRegistry";

export type RegistryIssueSeverity = "blocking" | "warning" | "info";

export interface RegistryValidationIssue {
  severity: RegistryIssueSeverity;
  issueCode: string;
  sheetName: string;
  tabName: string;
  rowNumber?: number;
  cell?: string;
  fieldName?: string;
  currentValue?: string;
  expectedValue?: string;
  expectedPattern?: string;
  message: string;
  recommendedAction: string;
  canAutoFix: boolean;
  relatedClass?: string;
  relatedSubject?: string;
  relatedMedium?: string;
  relatedBookTitle?: string;
  relatedBookId?: string;
  relatedChapterId?: string;
  groupCount?: number;
  sampleRows?: number[];
  affectedRows?: number[];
  sources?: RegistryValidationIssueSource[];
}

export interface RegistryValidationIssueSource {
  sheetName: string;
  tabName: string;
  rowNumber?: number;
  cell?: string;
  fieldName?: string;
  value?: string;
}

export type RegistryValidationAction =
  | "loadRegistry"
  | "refreshRegistry"
  | "discoverMappings"
  | "extractSyllabus"
  | "generateLessonWorkspace"
  | "publishToClassroom";

export interface RegistryValidationActionContext {
  class?: string;
  subject?: string;
  medium?: string;
  bookTitle?: string;
  ncertBookId?: string;
  ncertChapterId?: string;
  sourceTab?: string;
}

interface RegistryValidationRecord {
  sheetName: string;
  tabName: string;
  rowNumber?: number;
  row: Record<string, string>;
  sourceMeta?: RegistryRowSourceMeta;
}

interface IdentifierConventionRule {
  issueCode: string;
  severity: RegistryIssueSeverity;
  affectedFields: string[];
  filters?: Partial<Record<"class" | "subject" | "book_title" | "ncert_book_id", string>>;
  disallowedPatterns: Array<{ pattern: RegExp; preferredReplacement: string }>;
  recommendationText: string;
  affectedTabs?: string[];
}

interface ObsoleteRegistryEntryRule {
  issueCode: string;
  severityByTab?: Record<string, RegistryIssueSeverity>;
  obsoleteIdentity: Partial<Record<"ncert_book_id" | "class" | "subject" | "book_title", string>>;
  replacementGuidance: string;
  affectedTabs: string[];
  canAutoFix: boolean;
}

interface ReplacementBookRule {
  issueCode: string;
  severity: RegistryIssueSeverity;
  class: string;
  subject: string;
  expectedBookIds: string[];
  recommendationText: string;
}

export interface NcertRegistryValidationInput {
  books: NcertBookRow[];
  chapters: NcertChapterRow[];
  selectedBooks: SchoolSelectedBookRow[];
  lessonMapRows: Record<string, string>[];
  driveSourceFolders: NcertDriveSourceFolderRow[];
  chapterFileMapRows: NcertChapterFileMapRow[];
}

const LIVE_SHEET = "NCERT English-medium registry";
const PRIVATE_SHEET = "NCERT private Drive map";

const IDENTIFIER_CONVENTION_RULES: IdentifierConventionRule[] = [
  {
    issueCode: "IDENTIFIER_CONVENTION_VIOLATION",
    severity: "warning",
    affectedFields: ["ncert_book_id", "ncert_chapter_id", "school_book_selection_id", "source_folder_id", "book_title"],
    filters: { class: "Class VIII", subject: "Mathematics" },
    disallowedPatterns: [
      { pattern: /PART-1/g, preferredReplacement: "PART-I" },
      { pattern: /PART-2/g, preferredReplacement: "PART-II" },
      { pattern: /Part\s*1/g, preferredReplacement: "Part-I" },
      { pattern: /Part\s*2/g, preferredReplacement: "Part-II" },
      { pattern: /Part-1/g, preferredReplacement: "Part-I" },
      { pattern: /Part-2/g, preferredReplacement: "Part-II" }
    ],
    recommendationText: "Use Roman part naming for this configured book identity convention."
  }
];

const OBSOLETE_ENTRY_RULES: ObsoleteRegistryEntryRule[] = [
  {
    issueCode: "OBSOLETE_BOOK_VERSION",
    obsoleteIdentity: {
      ncert_book_id: "NCERT-VIII-MATHEMATICS-MATHEMATICS-EN-001",
      class: "Class VIII",
      subject: "Mathematics",
      book_title: "Mathematics"
    },
    replacementGuidance: "Archive/delete old generic rows, re-extract current Part-I / Part-II TOC, and do not mechanically rename old chapters to the new books.",
    affectedTabs: ["NCERT_Book_Registry", "NCERT_Chapter_Registry", "School_Selected_Books", "NCERT_Lesson_Map"],
    severityByTab: {
      NCERT_Book_Registry: "warning",
      NCERT_Chapter_Registry: "blocking",
      School_Selected_Books: "blocking",
      NCERT_Lesson_Map: "blocking"
    },
    canAutoFix: false
  }
];

const REPLACEMENT_BOOK_RULES: ReplacementBookRule[] = [
  {
    issueCode: "REPLACEMENT_BOOK_TOC_MISSING",
    severity: "warning",
    class: "Class VIII",
    subject: "Mathematics",
    expectedBookIds: [
      "NCERT-VIII-MATHEMATICS-GANITA-PRAKASH-PART-I-EN-001",
      "NCERT-VIII-MATHEMATICS-GANITA-PRAKASH-PART-II-EN-002"
    ],
    recommendationText: "Add TOC Pending stubs, re-extract chapter rows from source PDFs, or keep the book selectable without false chapter counts."
  }
];

function normalize(value: string | number | undefined): string {
  return String(value ?? "").trim();
}

function comparable(value: string | number | undefined): string {
  return normalize(value).toLowerCase().replace(/\s+/g, " ");
}

function getField(row: Record<string, string>, fieldName: string): string {
  return normalize(row[fieldName]);
}

function issue(input: RegistryValidationIssue): RegistryValidationIssue {
  return input;
}

function sourceFor(record: RegistryValidationRecord, fieldName?: string): RegistryValidationIssueSource {
  return {
    sheetName: record.sourceMeta?.sourceWorkbookName || record.sheetName,
    tabName: record.sourceMeta?.sourceTabName || record.tabName,
    rowNumber: record.sourceMeta?.sourceRowNumber || record.rowNumber,
    cell: fieldName ? record.sourceMeta?.sourceCellByField?.[fieldName] : undefined,
    fieldName,
    value: fieldName ? getField(record.row, fieldName) : undefined
  };
}

function cellFor(record: RegistryValidationRecord, fieldName?: string): string | undefined {
  return fieldName ? record.sourceMeta?.sourceCellByField?.[fieldName] : undefined;
}

function issueContextFromRecord(record: RegistryValidationRecord) {
  return {
    relatedClass: getField(record.row, "class"),
    relatedSubject: getField(record.row, "subject"),
    relatedMedium: getField(record.row, "medium"),
    relatedBookTitle: getField(record.row, "book_title"),
    relatedBookId: getField(record.row, "ncert_book_id"),
    relatedChapterId: getField(record.row, "ncert_chapter_id")
  };
}

function matchesFilters(record: RegistryValidationRecord, filters?: IdentifierConventionRule["filters"]): boolean {
  if (!filters) return true;
  return Object.entries(filters).every(([field, expected]) => comparable(record.row[field]) === comparable(expected));
}

function hasTocPendingTitle(value: string): boolean {
  const title = comparable(value);
  return !title || title === "toc pending" || title === "toc pending - add/parse reviewed chapter rows";
}

function isPlaceholderValue(value: string): boolean {
  return /<\s*(PASTE|REPLACE|APP_GENERATES|EXPECTED)[^>]*>/i.test(value);
}

function isTocPendingStatus(value: string): boolean {
  return comparable(value).includes("toc pending");
}

function isObsoleteClassViiiMathematicsChapter(bookId: string, chapterId: string): boolean {
  const obsoleteId = "ncert-viii-mathematics-mathematics-en-001";
  return comparable(bookId) === obsoleteId || comparable(chapterId).startsWith(obsoleteId);
}

function asBookRecord(book: NcertBookRow): RegistryValidationRecord {
  return {
    sheetName: book.source === "legacy_import" ? "NCERT legacy import" : LIVE_SHEET,
    tabName: "NCERT_Book_Registry",
    rowNumber: book.sourceMeta?.sourceRowNumber,
    sourceMeta: book.sourceMeta,
    row: {
      ncert_book_id: book.ncert_book_id,
      class: book.class,
      subject: book.subject,
      medium: book.medium,
      book_title: book.book_title,
      source_verification_status: book.source_verification_status,
      toc_status: book.toc_status,
      edition_or_version: book.edition_or_version
    }
  };
}

function asChapterRecord(chapter: NcertChapterRow): RegistryValidationRecord {
  return {
    sheetName: chapter.source === "legacy_import" ? "NCERT legacy import" : LIVE_SHEET,
    tabName: "NCERT_Chapter_Registry",
    rowNumber: chapter.sourceMeta?.sourceRowNumber,
    sourceMeta: chapter.sourceMeta,
    row: {
      ncert_chapter_id: chapter.ncert_chapter_id,
      ncert_book_id: chapter.ncert_book_id,
      class: chapter.class,
      subject: chapter.subject,
      medium: chapter.medium,
      chapter_number: String(chapter.chapter_number || ""),
      chapter_title: chapter.chapter_title,
      parsed_status: chapter.parsed_status,
      source_verification_status: chapter.source_verification_status
    }
  };
}

function asSelectionRecord(selection: SchoolSelectedBookRow): RegistryValidationRecord {
  return {
    sheetName: selection.source === "legacy_import" ? "NCERT legacy import" : LIVE_SHEET,
    tabName: "School_Selected_Books",
    rowNumber: selection.sourceMeta?.sourceRowNumber,
    sourceMeta: selection.sourceMeta,
    row: {
      school_book_selection_id: selection.school_book_selection_id,
      ncert_book_id: selection.ncert_book_id,
      class: selection.class,
      section: selection.section,
      subject: selection.subject,
      academic_year: selection.academic_year
    }
  };
}

function asDriveFolderRecord(folder: NcertDriveSourceFolderRow): RegistryValidationRecord {
  return {
    sheetName: PRIVATE_SHEET,
    tabName: "NCERT_Drive_Source_Folders",
    rowNumber: folder.sourceMeta?.sourceRowNumber,
    sourceMeta: folder.sourceMeta,
    row: {
      source_folder_id: folder.source_folder_id,
      ncert_book_id: folder.ncert_book_id,
      class: folder.class,
      section: folder.section,
      subject: folder.subject,
      medium: folder.medium,
      book_title: folder.book_title,
      drive_folder_url: folder.drive_folder_url,
      academic_year: folder.academic_year
    }
  };
}

function asFileMapRecord(fileMap: NcertChapterFileMapRow): RegistryValidationRecord {
  return {
    sheetName: PRIVATE_SHEET,
    tabName: "NCERT_Chapter_File_Map",
    rowNumber: fileMap.sourceMeta?.sourceRowNumber,
    sourceMeta: fileMap.sourceMeta,
    row: {
      chapter_file_map_id: fileMap.chapter_file_map_id,
      ncert_book_id: fileMap.ncert_book_id,
      ncert_chapter_id: fileMap.ncert_chapter_id,
      class: fileMap.class,
      section: fileMap.section,
      subject: fileMap.subject,
      medium: fileMap.medium,
      book_title: fileMap.book_title,
      chapter_number: String(fileMap.chapter_number || ""),
      chapter_title: fileMap.chapter_title,
      drive_folder_url: fileMap.drive_folder_url,
      drive_file_id: fileMap.drive_file_id,
      drive_file_url: fileMap.drive_file_url,
      file_name: fileMap.file_name,
      match_status: fileMap.match_status,
      review_status: fileMap.review_status
    }
  };
}

function asLessonMapRecord(row: Record<string, string>): RegistryValidationRecord {
  const sourceMeta = (row as any).__sourceMeta as RegistryRowSourceMeta | undefined;
  return {
    sheetName: sourceMeta?.sourceWorkbookName || LIVE_SHEET,
    tabName: sourceMeta?.sourceTabName || "NCERT_Lesson_Map",
    rowNumber: sourceMeta?.sourceRowNumber,
    sourceMeta,
    row
  };
}

function validateIdentifierConventions(records: RegistryValidationRecord[]): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  IDENTIFIER_CONVENTION_RULES.forEach((rule) => {
    records
      .filter((record) => !rule.affectedTabs || rule.affectedTabs.includes(record.tabName))
      .filter((record) => matchesFilters(record, rule.filters))
      .forEach((record) => {
        rule.affectedFields.forEach((fieldName) => {
          const currentValue = getField(record.row, fieldName);
          if (!currentValue) return;
          rule.disallowedPatterns.forEach(({ pattern, preferredReplacement }) => {
            pattern.lastIndex = 0;
            if (!pattern.test(currentValue)) return;
            issues.push(issue({
              severity: rule.severity,
              issueCode: rule.issueCode,
              sheetName: record.sheetName,
              tabName: record.tabName,
              rowNumber: record.rowNumber,
              fieldName,
              cell: cellFor(record, fieldName),
              currentValue,
              expectedValue: currentValue.replace(pattern, preferredReplacement),
              message: `${fieldName} uses a disallowed naming pattern.`,
              recommendedAction: rule.recommendationText,
              canAutoFix: false,
              ...issueContextFromRecord(record),
              sources: [sourceFor(record, fieldName)]
            }));
          });
        });
      });
  });
  return issues;
}

function validateObsoleteEntries(records: RegistryValidationRecord[]): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  OBSOLETE_ENTRY_RULES.forEach((rule) => {
    records
      .filter((record) => rule.affectedTabs.includes(record.tabName))
      .forEach((record) => {
        const matches = Object.entries(rule.obsoleteIdentity).every(([fieldName, value]) =>
          comparable(record.row[fieldName]) === comparable(value)
        );
        if (!matches) return;
        issues.push(issue({
          severity: rule.severityByTab?.[record.tabName] || "warning",
          issueCode: rule.issueCode,
          sheetName: record.sheetName,
          tabName: record.tabName,
          rowNumber: record.rowNumber,
          fieldName: "ncert_book_id",
          cell: cellFor(record, "ncert_book_id"),
          currentValue: getField(record.row, "ncert_book_id"),
          expectedValue: rule.replacementGuidance,
          message: "This registry row uses an obsolete book/version identity.",
          recommendedAction: rule.replacementGuidance,
          canAutoFix: rule.canAutoFix,
          ...issueContextFromRecord(record),
          sources: [sourceFor(record, "ncert_book_id")]
        }));
      });
  });
  return issues;
}

function validateReplacementBooks(input: NcertRegistryValidationInput): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  REPLACEMENT_BOOK_RULES.forEach((rule) => {
    rule.expectedBookIds.forEach((bookId) => {
      const book = input.books.find((candidate) => comparable(candidate.ncert_book_id) === comparable(bookId));
      if (!book) {
        issues.push(issue({
          severity: "warning",
          issueCode: "REPLACEMENT_BOOK_MISSING",
          sheetName: LIVE_SHEET,
          tabName: "NCERT_Book_Registry",
          fieldName: "ncert_book_id",
          currentValue: "",
          expectedValue: bookId,
          message: `Expected replacement book ${bookId} is missing.`,
          recommendedAction: rule.recommendationText,
          canAutoFix: false,
          relatedClass: rule.class,
          relatedSubject: rule.subject,
          relatedBookId: bookId
        }));
        return;
      }

      const siblingTitles = rule.expectedBookIds
        .map((expectedId) => input.books.find((candidate) => comparable(candidate.ncert_book_id) === comparable(expectedId))?.book_title || "")
        .filter(Boolean);
      if (!book.book_title || new Set(siblingTitles.map(comparable)).size !== siblingTitles.length) {
        issues.push(issue({
          severity: "warning",
          issueCode: "REPLACEMENT_BOOK_TITLE_NOT_DISTINCT",
          sheetName: LIVE_SHEET,
          tabName: "NCERT_Book_Registry",
          fieldName: "book_title",
          currentValue: book.book_title,
          expectedValue: "Present and distinct replacement book titles",
          message: "Replacement book titles must be present and distinct.",
          recommendedAction: "Align current replacement book titles before teachers select them.",
          canAutoFix: false,
          relatedClass: book.class,
          relatedSubject: book.subject,
          relatedMedium: book.medium,
          relatedBookTitle: book.book_title,
          relatedBookId: book.ncert_book_id
        }));
      }

      const chapters = input.chapters.filter((chapter) => comparable(chapter.ncert_book_id) === comparable(bookId));
      const hasRealChapter = chapters.some((chapter) => !hasTocPendingTitle(chapter.chapter_title) && !isTocPendingStatus(chapter.parsed_status));
      const hasTocPendingStub = chapters.some((chapter) => hasTocPendingTitle(chapter.chapter_title) || isTocPendingStatus(chapter.parsed_status));
      if (!hasRealChapter && !hasTocPendingStub) {
        issues.push(issue({
          severity: rule.severity,
          issueCode: rule.issueCode,
          sheetName: LIVE_SHEET,
          tabName: "NCERT_Chapter_Registry",
          fieldName: "ncert_book_id",
          currentValue: bookId,
          expectedValue: "Chapter rows or explicit TOC Pending stub",
          message: "Replacement book exists but has no chapter rows or explicit TOC Pending stub.",
          recommendedAction: rule.recommendationText,
          canAutoFix: false,
          relatedClass: book.class,
          relatedSubject: book.subject,
          relatedMedium: book.medium,
          relatedBookTitle: book.book_title,
          relatedBookId: bookId
        }));
      }
    });
  });
  return issues;
}

function validateIdentityConsistency(records: RegistryValidationRecord[]): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  const byBookId = new Map<string, RegistryValidationRecord[]>();
  records.forEach((record) => {
    const bookId = comparable(record.row.ncert_book_id);
    if (!bookId) return;
    byBookId.set(bookId, [...(byBookId.get(bookId) || []), record]);
  });

  byBookId.forEach((group, bookId) => {
    ["class", "subject", "medium", "book_title", "academic_year", "edition_or_version"].forEach((fieldName) => {
      const values = Array.from(new Set(group.map((record) => getField(record.row, fieldName)).filter(Boolean).map(comparable)));
      if (values.length <= 1) return;
      const valueRecords = group.filter((record) => getField(record.row, fieldName));
      const sample = valueRecords[0];
      const sources = valueRecords.map((record) => sourceFor(record, fieldName));
      issues.push(issue({
        severity: "warning",
        issueCode: fieldName === "book_title" ? "BOOK_ID_TITLE_MISMATCH" : "BOOK_ID_METADATA_MISMATCH",
        sheetName: sample?.sheetName || LIVE_SHEET,
        tabName: sample?.tabName || "Multiple tabs",
        rowNumber: sample?.rowNumber,
        fieldName,
        cell: sample ? cellFor(sample, fieldName) : undefined,
        currentValue: values.join(" | "),
        expectedValue: "One consistent value for the same ncert_book_id",
        message: fieldName === "book_title"
          ? "Same ncert_book_id has multiple book_title values."
          : `The same ncert_book_id has inconsistent ${fieldName} values across registry tabs.`,
        recommendedAction: fieldName === "book_title"
          ? "Use one title consistently for the same ncert_book_id, or change the ID if these are different books/versions."
          : "Align metadata for the same book ID across public, seed, private, selected-book, and lesson-map registries.",
        canAutoFix: false,
        relatedBookId: getField(sample?.row || {}, "ncert_book_id") || bookId,
        relatedClass: getField(sample?.row || {}, "class"),
        relatedSubject: getField(sample?.row || {}, "subject"),
        relatedMedium: getField(sample?.row || {}, "medium"),
        relatedBookTitle: getField(sample?.row || {}, "book_title"),
        sources
      }));
    });
  });
  return issues;
}

function validateReferenceIntegrity(input: NcertRegistryValidationInput): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  const bookIds = new Set(input.books.map((book) => comparable(book.ncert_book_id)).filter(Boolean));
  const chapterIds = new Set(input.chapters.map((chapter) => comparable(chapter.ncert_chapter_id)).filter(Boolean));

  const checkBookRef = (record: RegistryValidationRecord, issueCode: string, recommendation: string) => {
    const bookId = comparable(record.row.ncert_book_id);
    if (!bookId || bookIds.has(bookId)) return;
    issues.push(issue({
      severity: "blocking",
      issueCode,
      sheetName: record.sheetName,
      tabName: record.tabName,
      rowNumber: record.rowNumber,
      fieldName: "ncert_book_id",
      cell: cellFor(record, "ncert_book_id"),
      currentValue: getField(record.row, "ncert_book_id"),
      expectedValue: "Existing NCERT_Book_Registry.ncert_book_id",
      message: "This row references a book ID that is not present in the book registry.",
      recommendedAction: recommendation,
      canAutoFix: false,
      ...issueContextFromRecord(record),
      sources: [sourceFor(record, "ncert_book_id")]
    }));
  };

  input.chapters.map(asChapterRecord).forEach((record) => checkBookRef(record, "BOOK_REFERENCE_NOT_FOUND", "Create the book registry row first, or correct this chapter row's ncert_book_id."));
  input.selectedBooks.map(asSelectionRecord).forEach((record) => checkBookRef(record, "BOOK_REFERENCE_NOT_FOUND", "Correct the selected-book mapping or add the referenced book registry row."));
  input.lessonMapRows.map(asLessonMapRecord).forEach((record) => checkBookRef(record, "BOOK_REFERENCE_NOT_FOUND", "Correct the lesson map book reference before using it."));
  input.driveSourceFolders.map(asDriveFolderRecord).forEach((record) => checkBookRef(record, "PRIVATE_MAP_BOOK_NOT_FOUND", "Map the private Drive folder to a public/seed NCERT book ID."));
  input.chapterFileMapRows.map(asFileMapRecord).forEach((record) => checkBookRef(record, "PRIVATE_MAP_BOOK_NOT_FOUND", "Map the private chapter file row to a public/seed NCERT book ID."));

  input.lessonMapRows.map(asLessonMapRecord).forEach((record) => {
    const chapterId = comparable(record.row.ncert_chapter_id);
    if (!chapterId || chapterIds.has(chapterId)) return;
    const chapterTitle = getField(record.row, "chapter_title");
    if (hasTocPendingTitle(chapterTitle)) return;
    issues.push(issue({
      severity: "blocking",
      issueCode: "CHAPTER_REFERENCE_NOT_FOUND",
      sheetName: record.sheetName,
      tabName: record.tabName,
      rowNumber: record.rowNumber,
      fieldName: "ncert_chapter_id",
      cell: cellFor(record, "ncert_chapter_id"),
      currentValue: getField(record.row, "ncert_chapter_id"),
      expectedValue: "Existing NCERT_Chapter_Registry.ncert_chapter_id",
      message: isObsoleteClassViiiMathematicsChapter(getField(record.row, "ncert_book_id"), getField(record.row, "ncert_chapter_id"))
        ? "Lesson map references a chapter that no longer exists in NCERT_Chapter_Registry. This appears to be an obsolete Class VIII Mathematics generic-book mapping. Rebuild this row after Part-I / Part-II chapter rows are extracted."
        : "Lesson map references a chapter that no longer exists in NCERT_Chapter_Registry.",
      recommendedAction: isObsoleteClassViiiMathematicsChapter(getField(record.row, "ncert_book_id"), getField(record.row, "ncert_chapter_id"))
        ? "Archive/delete old NCERT_Lesson_Map rows that refer to NCERT-VIII-MATHEMATICS-MATHEMATICS-EN-001, then rebuild them after Ganita Prakash Part-I / Part-II chapter rows exist."
        : "Archive/delete or rebuild stale lesson map rows after the referenced chapter rows are available.",
      canAutoFix: false,
      ...issueContextFromRecord(record),
      sources: [sourceFor(record, "ncert_chapter_id")]
    }));
  });

  return issues;
}

function validateChapterIdPrefix(input: NcertRegistryValidationInput): RegistryValidationIssue[] {
  return input.chapters
    .filter((chapter) => chapter.ncert_chapter_id && chapter.ncert_book_id && !chapter.ncert_chapter_id.startsWith(chapter.ncert_book_id))
    .map((chapter) => issue({
      severity: "blocking",
      issueCode: "CHAPTER_ID_BOOK_ID_PREFIX_MISMATCH",
      sheetName: chapter.source === "legacy_import" ? "NCERT legacy import" : LIVE_SHEET,
      tabName: "NCERT_Chapter_Registry",
      fieldName: "ncert_chapter_id",
      currentValue: chapter.ncert_chapter_id,
      expectedPattern: `${chapter.ncert_book_id}*`,
      message: "ncert_chapter_id must start with the exact ncert_book_id.",
      recommendedAction: "Correct the chapter ID or book ID before using this row for Lesson Workspace generation.",
      canAutoFix: false,
      relatedClass: chapter.class,
      relatedSubject: chapter.subject,
      relatedMedium: chapter.medium,
      relatedBookTitle: chapter.chapter_title,
      relatedBookId: chapter.ncert_book_id,
      relatedChapterId: chapter.ncert_chapter_id
    }));
}

function validatePlaceholders(records: RegistryValidationRecord[]): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  const tocPendingGroups = new Map<string, { records: RegistryValidationRecord[]; sample: RegistryValidationRecord }>();
  records.forEach((record) => {
    Object.entries(record.row).forEach(([fieldName, value]) => {
      if (isPlaceholderValue(value)) {
        issues.push(issue({
          severity: "warning",
          issueCode: record.tabName === "NCERT_Chapter_File_Map" ? "PLACEHOLDER_FILE_MAP_ROW" : "PLACEHOLDER_VALUE_IN_LIVE_REGISTRY",
          sheetName: record.sheetName,
          tabName: record.tabName,
          rowNumber: record.rowNumber,
          fieldName,
          cell: cellFor(record, fieldName),
          currentValue: value,
          expectedValue: "Reviewed live registry value or blank setup guidance",
          message: "Placeholder value is present in a live registry path.",
          recommendedAction: "Keep placeholders only as setup guidance; do not use placeholder rows as real source material.",
          canAutoFix: false,
          ...issueContextFromRecord(record),
          sources: [sourceFor(record, fieldName)]
        }));
      }
    });

    if (record.tabName === "NCERT_Chapter_Registry" && hasTocPendingTitle(record.row.chapter_title)) {
      const groupKey = [
        record.sheetName,
        record.tabName,
        comparable(record.row.class),
        comparable(record.row.subject),
        comparable(record.row.book_title),
        comparable(record.row.ncert_book_id),
        "TOC_PENDING_COUNTED_AS_REAL_CHAPTER"
      ].join("|");
      const existing = tocPendingGroups.get(groupKey);
      if (existing) {
        existing.records.push(record);
      } else {
        tocPendingGroups.set(groupKey, { sample: record, records: [record] });
      }
    }
  });
  tocPendingGroups.forEach(({ records, sample }) => {
    const affectedRows = records.map((record) => record.rowNumber).filter((rowNumber): rowNumber is number => Number.isFinite(rowNumber));
    issues.push(issue({
      severity: "info",
      issueCode: "TOC_PENDING_COUNTED_AS_REAL_CHAPTER",
      sheetName: sample.sheetName,
      tabName: sample.tabName,
      rowNumber: sample.rowNumber,
      fieldName: "chapter_title",
      cell: cellFor(sample, "chapter_title"),
      currentValue: sample.row.chapter_title || "TOC Pending",
      expectedValue: "TOC Pending rows excluded from real chapter counts",
      message: `TOC Pending placeholders: ${records.length} rows. These rows are excluded from real chapter counts.`,
      recommendedAction: "No action required if this is setup guidance. Replace with reviewed chapter rows before Lesson Workspace generation.",
      canAutoFix: false,
      ...issueContextFromRecord(sample),
      groupCount: records.length,
      sampleRows: affectedRows.slice(0, 5),
      affectedRows,
      sources: records.slice(0, 10).map((record) => sourceFor(record, "chapter_title"))
    }));
  });
  return issues;
}

function validatePrivateDriveMap(input: NcertRegistryValidationInput): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  const folderIds = new Map<string, NcertDriveSourceFolderRow[]>();
  const folderUrls = new Map<string, NcertDriveSourceFolderRow[]>();
  const publicBookById = new Map(input.books.map((book) => [comparable(book.ncert_book_id), book]));

  input.driveSourceFolders.forEach((folder) => {
    const sourceFolderId = comparable(folder.source_folder_id);
    if (sourceFolderId) folderIds.set(sourceFolderId, [...(folderIds.get(sourceFolderId) || []), folder]);
    const driveFolderUrl = comparable(folder.drive_folder_url);
    if (driveFolderUrl) folderUrls.set(driveFolderUrl, [...(folderUrls.get(driveFolderUrl) || []), folder]);

    const publicBook = publicBookById.get(comparable(folder.ncert_book_id));
    if (publicBook && folder.book_title && comparable(publicBook.book_title) !== comparable(folder.book_title)) {
      issues.push(issue({
        severity: "warning",
        issueCode: "PRIVATE_MAP_TITLE_MISMATCH",
        sheetName: PRIVATE_SHEET,
        tabName: "NCERT_Drive_Source_Folders",
        fieldName: "book_title",
        currentValue: folder.book_title,
        expectedValue: publicBook.book_title,
        message: "Private Drive map title does not match the public/seed registry title for the same book ID.",
        recommendedAction: "Align the public and private titles, or use a different book ID if this is a different book.",
        canAutoFix: false,
        relatedClass: folder.class,
        relatedSubject: folder.subject,
        relatedMedium: folder.medium,
        relatedBookTitle: folder.book_title,
        relatedBookId: folder.ncert_book_id
      }));
    }
  });

  folderIds.forEach((rows, folderId) => {
    if (rows.length <= 1) return;
    issues.push(issue({
      severity: "blocking",
      issueCode: "DUPLICATE_SOURCE_FOLDER_ID",
      sheetName: PRIVATE_SHEET,
      tabName: "NCERT_Drive_Source_Folders",
      fieldName: "source_folder_id",
      currentValue: folderId,
      expectedValue: "Unique source_folder_id",
      message: "Duplicate source_folder_id appears in the private Drive source folder registry.",
      recommendedAction: "Assign a unique source_folder_id to each source folder mapping.",
      canAutoFix: false,
      relatedBookId: rows[0]?.ncert_book_id,
      relatedClass: rows[0]?.class,
      relatedSubject: rows[0]?.subject,
      relatedMedium: rows[0]?.medium,
      relatedBookTitle: rows[0]?.book_title
    }));
  });

  folderUrls.forEach((rows, folderUrl) => {
    const uniqueBookSubjects = new Set(rows.map((row) => `${comparable(row.ncert_book_id)}|${comparable(row.subject)}`));
    if (uniqueBookSubjects.size <= 1) return;
    issues.push(issue({
      severity: "warning",
      issueCode: "DRIVE_FOLDER_REUSED",
      sheetName: PRIVATE_SHEET,
      tabName: "NCERT_Drive_Source_Folders",
      fieldName: "drive_folder_url",
      currentValue: folderUrl,
      expectedValue: "One Drive folder per book/subject mapping unless explicitly intentional",
      message: "The same Drive folder URL is reused across different books or subjects.",
      recommendedAction: "Confirm the folder is intentionally shared, or split the mappings by book/subject.",
      canAutoFix: false,
      relatedBookId: rows[0]?.ncert_book_id,
      relatedClass: rows[0]?.class,
      relatedSubject: rows[0]?.subject,
      relatedMedium: rows[0]?.medium,
      relatedBookTitle: rows[0]?.book_title
    }));
  });

  return issues;
}

export function validateNcertRegistryState(input: NcertRegistryValidationInput): RegistryValidationIssue[] {
  const records: RegistryValidationRecord[] = [
    ...input.books.map(asBookRecord),
    ...input.chapters.map(asChapterRecord),
    ...input.selectedBooks.map(asSelectionRecord),
    ...input.lessonMapRows.map(asLessonMapRecord),
    ...input.driveSourceFolders.map(asDriveFolderRecord),
    ...input.chapterFileMapRows.map(asFileMapRecord)
  ];

  return [
    ...validateIdentifierConventions(records),
    ...validateObsoleteEntries(records),
    ...validateReplacementBooks(input),
    ...validateIdentityConsistency(records),
    ...validateReferenceIntegrity(input),
    ...validateChapterIdPrefix(input),
    ...validatePlaceholders(records),
    ...validatePrivateDriveMap(input)
  ];
}

function contextMatchesIssue(context: RegistryValidationActionContext, issueItem: RegistryValidationIssue): boolean {
  const contextBookId = comparable(context.ncertBookId);
  const contextChapterId = comparable(context.ncertChapterId);
  const contextClass = comparable(context.class);
  const contextSubject = comparable(context.subject);
  const contextMedium = comparable(context.medium);
  const contextBookTitle = comparable(context.bookTitle);

  if (contextBookId && comparable(issueItem.relatedBookId || issueItem.currentValue) === contextBookId) return true;
  if (contextChapterId && comparable(issueItem.relatedChapterId || issueItem.currentValue) === contextChapterId) return true;
  if (contextBookTitle && comparable(issueItem.relatedBookTitle) === contextBookTitle) {
    const classMatches = !contextClass || !issueItem.relatedClass || comparable(issueItem.relatedClass) === contextClass;
    const subjectMatches = !contextSubject || !issueItem.relatedSubject || comparable(issueItem.relatedSubject) === contextSubject;
    const mediumMatches = !contextMedium || !issueItem.relatedMedium || comparable(issueItem.relatedMedium) === contextMedium;
    return classMatches && subjectMatches && mediumMatches;
  }
  return false;
}

export function getBlockingIssuesForAction(
  action: RegistryValidationAction,
  context: RegistryValidationActionContext,
  allIssues: RegistryValidationIssue[]
): RegistryValidationIssue[] {
  if (action === "loadRegistry" || action === "refreshRegistry") return [];
  if (!context.ncertBookId && !context.ncertChapterId && !context.bookTitle) return [];

  return allIssues.filter((item) => {
    if (!contextMatchesIssue(context, item)) return false;

    if (action === "discoverMappings" || action === "extractSyllabus") {
      if (item.tabName === "NCERT_Lesson_Map") return false;
      if (item.issueCode === "REPLACEMENT_BOOK_TOC_MISSING") return false;
      return item.severity === "blocking" &&
        ["NCERT_Book_Registry", "NCERT_Chapter_Registry", "School_Selected_Books", "NCERT_Drive_Source_Folders", "NCERT_Chapter_File_Map"].includes(item.tabName);
    }

    if (action === "generateLessonWorkspace" || action === "publishToClassroom") {
      if (item.issueCode === "REPLACEMENT_BOOK_TOC_MISSING") return true;
      return item.severity === "blocking";
    }

    return false;
  });
}

export function formatRegistryValidationReport(
  issues: RegistryValidationIssue[],
  action?: RegistryValidationAction,
  context: RegistryValidationActionContext = {}
): string {
  if (issues.length === 0) return "Registry Data Quality: no issues reported.";
  const summarizeRows = (rows: number[] = []) => {
    const uniqueRows = Array.from(new Set(rows)).sort((a, b) => a - b);
    if (uniqueRows.length === 0) return "";
    if (uniqueRows.length <= 12) return uniqueRows.join(", ");
    const ranges: string[] = [];
    let start = uniqueRows[0];
    let previous = uniqueRows[0];
    uniqueRows.slice(1).forEach((row) => {
      if (row === previous + 1) {
        previous = row;
        return;
      }
      ranges.push(start === previous ? String(start) : `${start}-${previous}`);
      start = row;
      previous = row;
    });
    ranges.push(start === previous ? String(start) : `${start}-${previous}`);
    return ranges.join(", ");
  };
  const actionBlockers = action ? new Set(getBlockingIssuesForAction(action, context, issues)) : new Set<RegistryValidationIssue>();
  return issues.map((item, index) => [
    `${index + 1}. [${item.severity.toUpperCase()}] ${item.issueCode}`,
    `Sheet Name: ${item.sheetName}`,
    `Tab Name: ${item.tabName}`,
    `Row: ${item.rowNumber || "unknown"}`,
    `Cell: ${item.cell || "unknown"}`,
    item.fieldName ? `Field: ${item.fieldName}` : "",
    item.currentValue ? `Current Value: ${item.currentValue}` : "",
    item.expectedValue || item.expectedPattern ? `Expected Value / Recommendation: ${item.expectedValue || item.expectedPattern}` : `Expected Value / Recommendation: ${item.recommendedAction}`,
    `Issue Code: ${item.issueCode}`,
    `Severity: ${item.severity}`,
    `Blocks Current Action: ${actionBlockers.has(item) ? "Yes" : "No"}`,
    item.groupCount ? `Grouped issue count: ${item.groupCount}` : "",
    item.sampleRows?.length ? `Sample rows: ${item.sampleRows.join(", ")}` : "",
    item.affectedRows?.length ? `Affected rows: ${summarizeRows(item.affectedRows)}` : "",
    item.sources?.length ? `Sources:\n${item.sources.map((source, sourceIndex) =>
      `  ${sourceIndex + 1}. ${source.sheetName} / ${source.tabName} / row ${source.rowNumber || "unknown"} / cell ${source.cell || "unknown"} / ${source.fieldName || "row"} = ${source.value || ""}`
    ).join("\n")}` : "",
    `Message: ${item.message}`,
    `Recommended action: ${item.recommendedAction}`,
    `Auto-fix allowed: ${item.canAutoFix ? "Yes" : "No"}`
  ].filter(Boolean).join("\n")).join("\n\n");
}

export function getManualFixSuggestion(item: RegistryValidationIssue): string {
  if (item.issueCode === "TOC_PENDING_COUNTED_AS_REAL_CHAPTER") return "No action required; informational only";
  if (item.issueCode === "CHAPTER_REFERENCE_NOT_FOUND" && item.tabName === "NCERT_Lesson_Map") return "Archive/delete this stale row or rebuild after TOC extraction";
  if (item.issueCode === "OBSOLETE_BOOK_VERSION") return "Archive/delete this stale row";
  if (item.issueCode === "REPLACEMENT_BOOK_TOC_MISSING") return "Rebuild after TOC extraction";
  if (item.issueCode.includes("MISMATCH") || item.issueCode.includes("CONVENTION") || item.issueCode.includes("PLACEHOLDER")) return "Update this cell manually";
  return item.severity === "info" ? "No action required; informational only" : "Update this cell manually";
}

export function hasBlockingIssueForNcertChapter(chapter: NcertChapterRow, issues: RegistryValidationIssue[]): boolean {
  return issues.some((item) =>
    item.severity === "blocking" &&
    item.tabName === "NCERT_Chapter_Registry" &&
    (
      (item.fieldName === "ncert_chapter_id" && comparable(item.currentValue) === comparable(chapter.ncert_chapter_id)) ||
      (item.fieldName === "ncert_book_id" && comparable(item.currentValue) === comparable(chapter.ncert_book_id))
    )
  );
}

export function hasBlockingIssueForNcertBook(book: NcertBookRow, issues: RegistryValidationIssue[]): boolean {
  return issues.some((item) =>
    item.severity === "blocking" &&
    comparable(item.currentValue) === comparable(book.ncert_book_id)
  );
}
