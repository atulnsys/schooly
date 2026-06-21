import { getGoogleWorkspaceAuthState } from "./googleWorkspaceAuth";
import { loadSeededRegistryConfig } from "./seededRegistryConfig";
import { readGoogleSheetTabRows, type GoogleSheetReadErrorCode } from "./googleSheetRead";
import type { SchoolRegistryState, StaffDirectoryRow } from "./schoolRegistry";

export type RegistryDropdownAvailability =
  | "loading"
  | "refreshing"
  | "ready"
  | "empty"
  | "stale"
  | "authentication_required"
  | "account_mismatch"
  | "permission_denied"
  | "source_unavailable"
  | "error";

export interface RegistryDropdownOption {
  stableKey: string;
  value: string;
  label: string;
  secondaryLabel?: string;
  sourceRegistryKey: string;
  sourceTabName: string;
}

export interface RegistryDropdownState {
  availability: RegistryDropdownAvailability;
  lastCheckedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  isRefreshing: boolean;
  loadedAt: string | null;
  message: string;
  options: RegistryDropdownOption[];
  staleReason?: string | null;
  errorCode?: string | null;
}

export interface AcademicResourceDropdownSources {
  lessonPlanRegistry: RegistryDropdownState;
  ncertTextbooks: RegistryDropdownState;
  ncertChapters: RegistryDropdownState;
}

function normalizeToken(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
}

function uniqueByStableKey(options: RegistryDropdownOption[]): RegistryDropdownOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.stableKey)) return false;
    seen.add(option.stableKey);
    return true;
  });
}

function buildAvailabilityMessage(availability: RegistryDropdownAvailability, defaultMessage: string): string {
  if (availability === "ready") return defaultMessage;
  if (availability === "empty") return defaultMessage;
  if (availability === "stale") return defaultMessage || "Previous rows are retained, but the latest refresh needs attention.";
  if (availability === "refreshing") return defaultMessage || "Refreshing source rows...";
  if (availability === "authentication_required") return defaultMessage || "Google account connection required.";
  if (availability === "account_mismatch") return defaultMessage || "Connected Google account does not match the configured account.";
  if (availability === "permission_denied") return defaultMessage || "Registry access is restricted.";
  if (availability === "source_unavailable") return defaultMessage || "Registry unavailable.";
  if (availability === "error") return defaultMessage || "Registry load failed.";
  return "Loading...";
}

function mapReadError(code?: GoogleSheetReadErrorCode, authState = getGoogleWorkspaceAuthState()): RegistryDropdownAvailability {
  if (authState.accountMatchStatus === "mismatch") return "account_mismatch";
  if (code === "AUTH_REQUIRED" || code === "TOKEN_EXPIRED") return "authentication_required";
  if (code === "ACCESS_DENIED") return "permission_denied";
  if (code === "INVALID_URL") return "source_unavailable";
  return "error";
}

function buildLessonPlanOption(row: Record<string, string>): RegistryDropdownOption | null {
  const stableKey = String(row.lesson_workspace_id || "").trim();
  if (!stableKey) return null;
  const classLabel = String(row.class || "").trim();
  const sectionLabel = String(row.section || "").trim();
  const subjectLabel = String(row.subject || "").trim();
  const chapterLabel = String(row.chapter_title || row.book_title || "").trim();
  const labelParts = [classLabel, sectionLabel ? `Section ${sectionLabel}` : "", subjectLabel, chapterLabel]
    .filter(Boolean)
    .join(" · ");
  const secondaryLabel = [row.teacher_staff_id ? `Teacher ${row.teacher_staff_id}` : "", row.planned_start_date ? `Starts ${row.planned_start_date}` : ""]
    .filter(Boolean)
    .join(" · ");
  return {
    stableKey,
    value: stableKey,
    label: labelParts || stableKey,
    secondaryLabel: secondaryLabel || undefined,
    sourceRegistryKey: "lessonWorkspaceRegistryUrl",
    sourceTabName: "Lesson_Workspace_Registry",
  };
}

function buildNcertBookOption(row: Record<string, string>): RegistryDropdownOption | null {
  const stableKey = String(row.ncert_book_id || "").trim();
  if (!stableKey) return null;
  const classLabel = String(row.class || "").trim();
  const subjectLabel = String(row.subject || "").trim();
  const titleLabel = String(row.book_title || "").trim();
  const secondaryLabel = [row.toc_status ? `TOC ${row.toc_status}` : "", row.source_verification_status ? row.source_verification_status : ""]
    .filter(Boolean)
    .join(" · ");
  return {
    stableKey,
    value: stableKey,
    label: [classLabel, subjectLabel, titleLabel].filter(Boolean).join(" · ") || stableKey,
    secondaryLabel: secondaryLabel || undefined,
    sourceRegistryKey: "ncertRegistryUrl",
    sourceTabName: "NCERT_Book_Registry",
  };
}

function buildNcertChapterOption(row: Record<string, string>): RegistryDropdownOption | null {
  const stableKey = String(row.ncert_chapter_id || "").trim();
  if (!stableKey) return null;
  const chapterNumber = String(row.chapter_number || "").trim();
  const chapterTitle = String(row.chapter_title || "").trim();
  return {
    stableKey,
    value: stableKey,
    label: [chapterNumber ? `Chapter ${chapterNumber}` : "", chapterTitle].filter(Boolean).join(" · ") || stableKey,
    secondaryLabel: String(row.ncert_book_id || "").trim() || undefined,
    sourceRegistryKey: "ncertRegistryUrl",
    sourceTabName: "NCERT_Chapter_Registry",
  };
}

function normalizeAvailabilityFromState(state: "ready" | "empty" | "authentication_required" | "account_mismatch" | "permission_denied" | "source_unavailable" | "stale" | "refreshing" | "error"): RegistryDropdownAvailability {
  return state;
}

function createRegistryDropdownState(
  availability: RegistryDropdownAvailability,
  message: string,
  options: RegistryDropdownOption[],
  checkedAt: string | null,
  previous?: RegistryDropdownState | null,
  errorCode?: string | null,
  staleReason?: string | null,
): RegistryDropdownState {
  const retainPrevious = availability === "stale" || availability === "refreshing";
  const retainedOptions = retainPrevious && previous?.options?.length ? previous.options : options;
  const lastSuccessfulSyncAt = retainPrevious && previous?.lastSuccessfulSyncAt ? previous.lastSuccessfulSyncAt : checkedAt;
  return {
    availability,
    lastCheckedAt: checkedAt,
    lastSuccessfulSyncAt,
    isRefreshing: availability === "refreshing",
    loadedAt: lastSuccessfulSyncAt,
    message,
    options: retainedOptions,
    staleReason: staleReason || null,
    errorCode: errorCode || null,
  };
}

export function buildStaffDropdownOptions(registry: SchoolRegistryState | null, previous?: RegistryDropdownState | null): RegistryDropdownState {
  const rows = (registry?.staffDirectory || [])
    .filter((row) => {
      const status = normalizeToken(row.status);
      if (!status) return true;
      if (/(^|\s)(inactive|archived|deleted|removed)(\s|$)/.test(status)) return false;
      return /(^|\s)(active|current|enabled|enrolled)(\s|$)/.test(status);
    });

  const options = uniqueByStableKey(
    rows
      .map((row: StaffDirectoryRow) => {
        const stableKey = String(row.staff_id || row.email || row.staff_name || "").trim();
        if (!stableKey) return null;
        const label = [row.staff_name, row.role || row.department ? `(${row.role || row.department})` : ""]
          .filter(Boolean)
          .join(" ")
          .trim() || stableKey;
        const secondaryLabel = [row.email, row.department ? `Dept: ${row.department}` : ""].filter(Boolean).join(" · ");
        return {
          stableKey,
          value: stableKey,
          label,
          secondaryLabel: secondaryLabel || undefined,
          sourceRegistryKey: "masterDataRegistryUrl",
          sourceTabName: "Staff_Directory",
        } satisfies RegistryDropdownOption;
      })
      .filter(Boolean) as RegistryDropdownOption[],
  );

  const availability: RegistryDropdownAvailability =
    !registry ? "source_unavailable" :
    registry.sourceStatus === "refreshing" ? "refreshing" :
    registry.sourceStatus === "stale" ? "stale" :
    registry.sourceStatus === "authentication_required" ? "authentication_required" :
    registry.sourceStatus === "account_mismatch" ? "account_mismatch" :
    registry.sourceStatus === "permission_denied" ? "permission_denied" :
    registry.mode === "missing" ? "source_unavailable" :
    registry.mode === "error" ? (previous?.options?.length ? "stale" : "error") :
    options.length > 0 ? "ready" : "empty";

  const checkedAt = registry?.lastCheckedAt || registry?.loadedAt || previous?.lastCheckedAt || null;
  return createRegistryDropdownState(
    availability,
    buildAvailabilityMessage(availability, options.length > 0 ? "Staff directory loaded." : "No active staff rows found."),
    options,
    checkedAt,
    previous,
    registry?.errorCode || null,
    registry?.staleReason || previous?.staleReason || null,
  );
}

export async function loadLessonPlanRegistryDropdownState(previous?: RegistryDropdownState | null): Promise<RegistryDropdownState> {
  const config = loadSeededRegistryConfig();
  const authState = getGoogleWorkspaceAuthState();
  const hasPrevious = Boolean(previous?.options?.length);
  if (authState.accountMatchStatus === "mismatch") {
    return createRegistryDropdownState(
      hasPrevious ? "stale" : "account_mismatch",
      hasPrevious
        ? `${previous?.message || "Lesson workspace registry loaded."} Latest refresh failed: Connected Google account does not match the configured registry account.`
        : "Connected Google account does not match the configured registry account.",
      hasPrevious ? previous?.options || [] : [],
      null,
      previous
    );
  }
  if (!authState.connected || !authState.tokenPresent) {
    const message = authState.errorMessage || "Google account connection required.";
    return createRegistryDropdownState(
      hasPrevious ? "stale" : "authentication_required",
      hasPrevious ? `${previous?.message || "Lesson workspace registry loaded."} Latest refresh failed: ${message}` : message,
      hasPrevious ? previous?.options || [] : [],
      null,
      previous,
      authState.errorMessage && /expired/i.test(authState.errorMessage) ? "TOKEN_EXPIRED" : "AUTH_REQUIRED"
    );
  }
  if (!config.lessonWorkspaceRegistryUrl.trim()) {
    return createRegistryDropdownState(
      hasPrevious ? "stale" : "source_unavailable",
      hasPrevious ? `${previous?.message || "Lesson workspace registry loaded."} Latest refresh failed: Lesson workspace registry URL is not configured.` : "Lesson workspace registry URL is not configured.",
      hasPrevious ? previous?.options || [] : [],
      null,
      previous,
      "INVALID_URL"
    );
  }

  try {
    const result = await readGoogleSheetTabRows(config.lessonWorkspaceRegistryUrl, "Lesson_Workspace_Registry", { policy: "authenticated-required" });
    const options = uniqueByStableKey(result.rows.map(buildLessonPlanOption).filter(Boolean) as RegistryDropdownOption[]);
    const availability = options.length > 0 ? "ready" : "empty";
    return createRegistryDropdownState(
      availability,
      buildAvailabilityMessage(availability, options.length > 0 ? "Lesson workspace registry loaded." : "No lesson workspace rows found."),
      options,
      result.checkedAt,
      previous,
    );
  } catch (error: any) {
    const availability = mapReadError(error?.code, authState);
    const hasPrevious = Boolean(previous?.options?.length);
    return createRegistryDropdownState(
      hasPrevious ? "stale" : availability,
      hasPrevious
        ? `${previous?.message || "Lesson workspace registry loaded."} Latest refresh failed: ${error?.message || "Registry unavailable."}`
        : (error?.message || "Lesson workspace registry unavailable."),
      hasPrevious ? previous?.options || [] : [],
      new Date().toISOString(),
      previous,
      error?.code || null,
      error?.message || null,
    );
  }
}

export async function loadNcertDropdownState(previous?: { textbooks: RegistryDropdownState; chapters: RegistryDropdownState } | null): Promise<{ textbooks: RegistryDropdownState; chapters: RegistryDropdownState }> {
  const config = loadSeededRegistryConfig();
  const authState = getGoogleWorkspaceAuthState();
  const empty = (availability: RegistryDropdownAvailability, message: string, prior?: RegistryDropdownState | null, errorCode?: string | null): RegistryDropdownState =>
    createRegistryDropdownState(availability, message, [], null, prior, errorCode);
  const hasPreviousTextbooks = Boolean(previous?.textbooks?.options?.length);
  const hasPreviousChapters = Boolean(previous?.chapters?.options?.length);

  if (authState.accountMatchStatus === "mismatch") {
    return {
      textbooks: empty(
        hasPreviousTextbooks ? "stale" : "account_mismatch",
        hasPreviousTextbooks
          ? `${previous?.textbooks?.message || "NCERT textbooks loaded."} Latest refresh failed: Connected Google account does not match the configured registry account.`
          : "Connected Google account does not match the configured registry account.",
        previous?.textbooks
      ),
      chapters: empty(
        hasPreviousChapters ? "stale" : "account_mismatch",
        hasPreviousChapters
          ? `${previous?.chapters?.message || "NCERT chapters loaded."} Latest refresh failed: Connected Google account does not match the configured registry account.`
          : "Connected Google account does not match the configured registry account.",
        previous?.chapters
      ),
    };
  }
  if (!authState.connected || !authState.tokenPresent) {
    const message = authState.errorMessage || "Google account connection required.";
    return {
      textbooks: empty(
        hasPreviousTextbooks ? "stale" : "authentication_required",
        hasPreviousTextbooks ? `${previous?.textbooks?.message || "NCERT textbooks loaded."} Latest refresh failed: ${message}` : message,
        previous?.textbooks,
        authState.errorMessage && /expired/i.test(authState.errorMessage) ? "TOKEN_EXPIRED" : "AUTH_REQUIRED"
      ),
      chapters: empty(
        hasPreviousChapters ? "stale" : "authentication_required",
        hasPreviousChapters ? `${previous?.chapters?.message || "NCERT chapters loaded."} Latest refresh failed: ${message}` : message,
        previous?.chapters,
        authState.errorMessage && /expired/i.test(authState.errorMessage) ? "TOKEN_EXPIRED" : "AUTH_REQUIRED"
      ),
    };
  }
  if (!config.ncertRegistryUrl.trim()) {
    return {
      textbooks: empty(
        hasPreviousTextbooks ? "stale" : "source_unavailable",
        hasPreviousTextbooks ? `${previous?.textbooks?.message || "NCERT textbooks loaded."} Latest refresh failed: NCERT registry URL is not configured.` : "NCERT registry URL is not configured.",
        previous?.textbooks,
        "INVALID_URL"
      ),
      chapters: empty(
        hasPreviousChapters ? "stale" : "source_unavailable",
        hasPreviousChapters ? `${previous?.chapters?.message || "NCERT chapters loaded."} Latest refresh failed: NCERT registry URL is not configured.` : "NCERT registry URL is not configured.",
        previous?.chapters,
        "INVALID_URL"
      ),
    };
  }

  try {
    const [booksResult, chaptersResult] = await Promise.allSettled([
      readGoogleSheetTabRows(config.ncertRegistryUrl, "NCERT_Book_Registry", { policy: "authenticated-required" }),
      readGoogleSheetTabRows(config.ncertRegistryUrl, "NCERT_Chapter_Registry", { policy: "authenticated-required" }),
    ]);

    const booksState: RegistryDropdownState = booksResult.status === "fulfilled"
      ? (() => {
          const bookOptions = uniqueByStableKey(booksResult.value.rows.map(buildNcertBookOption).filter(Boolean) as RegistryDropdownOption[]);
          const availability = bookOptions.length > 0 ? "ready" : "empty";
          return createRegistryDropdownState(
            availability,
            buildAvailabilityMessage(availability, bookOptions.length > 0 ? "NCERT textbooks loaded." : "No NCERT textbooks found."),
            bookOptions,
            booksResult.value.checkedAt,
            previous?.textbooks,
          );
        })()
      : (() => {
          const prior = previous?.textbooks;
          const availability = prior?.options?.length ? "stale" : mapReadError(booksResult.reason?.code, authState);
          const message = prior?.options?.length
            ? `${prior.message || "NCERT textbooks loaded."} Latest refresh failed: ${booksResult.reason?.message || "NCERT textbooks unavailable."}`
            : (booksResult.reason?.message || "NCERT textbooks unavailable.");
          return createRegistryDropdownState(availability, message, prior?.options || [], new Date().toISOString(), prior, booksResult.reason?.code || null, booksResult.reason?.message || null);
        })();

    const chaptersState: RegistryDropdownState = chaptersResult.status === "fulfilled"
      ? (() => {
          const chapterOptions = uniqueByStableKey(chaptersResult.value.rows.map(buildNcertChapterOption).filter(Boolean) as RegistryDropdownOption[]);
          const availability = chapterOptions.length > 0 ? "ready" : "empty";
          return createRegistryDropdownState(
            availability,
            buildAvailabilityMessage(availability, chapterOptions.length > 0 ? "NCERT chapters loaded." : "No NCERT chapters found."),
            chapterOptions,
            chaptersResult.value.checkedAt,
            previous?.chapters,
          );
        })()
      : (() => {
          const prior = previous?.chapters;
          const availability = prior?.options?.length ? "stale" : mapReadError(chaptersResult.reason?.code, authState);
          const message = prior?.options?.length
            ? `${prior.message || "NCERT chapters loaded."} Latest refresh failed: ${chaptersResult.reason?.message || "NCERT chapters unavailable."}`
            : (chaptersResult.reason?.message || "NCERT chapters unavailable.");
          return createRegistryDropdownState(availability, message, prior?.options || [], new Date().toISOString(), prior, chaptersResult.reason?.code || null, chaptersResult.reason?.message || null);
        })();

    return {
      textbooks: booksState,
      chapters: chaptersState,
    };
  } catch (error: any) {
    const availability = mapReadError(error?.code, authState);
    const message = error?.message || "NCERT registry unavailable.";
    return {
      textbooks: empty(
        previous?.textbooks?.options?.length ? "stale" : availability,
        previous?.textbooks?.options?.length
          ? `${previous?.textbooks?.message || "NCERT textbooks loaded."} Latest refresh failed: ${message}`
          : message,
        previous?.textbooks,
        error?.code || null
      ),
      chapters: empty(
        previous?.chapters?.options?.length ? "stale" : availability,
        previous?.chapters?.options?.length
          ? `${previous?.chapters?.message || "NCERT chapters loaded."} Latest refresh failed: ${message}`
          : message,
        previous?.chapters,
        error?.code || null
      ),
    };
  }
}
