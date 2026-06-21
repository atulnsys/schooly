import { getGoogleWorkspaceAuthState } from "./googleWorkspaceAuth";
import { loadSeededRegistryConfig } from "./seededRegistryConfig";
import { readGoogleSheetTabRows, type GoogleSheetReadErrorCode } from "./googleSheetRead";
import type { SchoolRegistryState, StaffDirectoryRow } from "./schoolRegistry";

export type RegistryDropdownAvailability =
  | "loading"
  | "ready"
  | "empty"
  | "authentication_required"
  | "account_mismatch"
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
  loadedAt: string | null;
  message: string;
  options: RegistryDropdownOption[];
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
  if (availability === "authentication_required") return defaultMessage || "Google account connection required.";
  if (availability === "account_mismatch") return defaultMessage || "Connected Google account does not match the configured account.";
  if (availability === "source_unavailable") return defaultMessage || "Registry unavailable.";
  if (availability === "error") return defaultMessage || "Registry load failed.";
  return "Loading...";
}

function mapReadError(code?: GoogleSheetReadErrorCode, authState = getGoogleWorkspaceAuthState()): RegistryDropdownAvailability {
  if (authState.accountMatchStatus === "mismatch") return "account_mismatch";
  if (code === "AUTH_REQUIRED" || code === "TOKEN_EXPIRED") return "authentication_required";
  if (code === "ACCESS_DENIED" || code === "INVALID_URL") return "source_unavailable";
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

function normalizeAvailabilityFromState(state: "ready" | "empty" | "authentication_required" | "account_mismatch" | "source_unavailable" | "error"): RegistryDropdownAvailability {
  return state;
}

export function buildStaffDropdownOptions(registry: SchoolRegistryState | null): RegistryDropdownState {
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
    registry.mode === "missing" ? "source_unavailable" :
    registry.mode === "error" ? "error" :
    options.length > 0 ? "ready" : "empty";

  return {
    availability,
    loadedAt: registry?.loadedAt || null,
    message: buildAvailabilityMessage(availability, options.length > 0 ? "Staff directory loaded." : "No active staff rows found."),
    options,
  };
}

export async function loadLessonPlanRegistryDropdownState(): Promise<RegistryDropdownState> {
  const config = loadSeededRegistryConfig();
  const authState = getGoogleWorkspaceAuthState();
  if (authState.accountMatchStatus === "mismatch") {
    return {
      availability: "account_mismatch",
      loadedAt: null,
      message: "Connected Google account does not match the configured registry account.",
      options: [],
    };
  }
  if (!authState.connected || !authState.tokenPresent) {
    return {
      availability: authState.errorMessage && /expired/i.test(authState.errorMessage) ? "authentication_required" : "authentication_required",
      loadedAt: null,
      message: authState.errorMessage || "Google account connection required.",
      options: [],
    };
  }
  if (!config.lessonWorkspaceRegistryUrl.trim()) {
    return {
      availability: "source_unavailable",
      loadedAt: null,
      message: "Lesson workspace registry URL is not configured.",
      options: [],
    };
  }

  try {
    const result = await readGoogleSheetTabRows(config.lessonWorkspaceRegistryUrl, "Lesson_Workspace_Registry", { policy: "authenticated-required" });
    const options = uniqueByStableKey(result.rows.map(buildLessonPlanOption).filter(Boolean) as RegistryDropdownOption[]);
    const availability = options.length > 0 ? "ready" : "empty";
    return {
      availability,
      loadedAt: result.checkedAt,
      message: buildAvailabilityMessage(availability, options.length > 0 ? "Lesson workspace registry loaded." : "No lesson workspace rows found."),
      options,
    };
  } catch (error: any) {
    const availability = mapReadError(error?.code, authState);
    return {
      availability,
      loadedAt: null,
      message: error?.message || "Lesson workspace registry unavailable.",
      options: [],
    };
  }
}

export async function loadNcertDropdownState(): Promise<{ textbooks: RegistryDropdownState; chapters: RegistryDropdownState }> {
  const config = loadSeededRegistryConfig();
  const authState = getGoogleWorkspaceAuthState();
  const empty = (availability: RegistryDropdownAvailability, message: string): RegistryDropdownState => ({
    availability,
    loadedAt: null,
    message,
    options: [],
  });

  if (authState.accountMatchStatus === "mismatch") {
    return {
      textbooks: empty("account_mismatch", "Connected Google account does not match the configured registry account."),
      chapters: empty("account_mismatch", "Connected Google account does not match the configured registry account."),
    };
  }
  if (!authState.connected || !authState.tokenPresent) {
    const message = authState.errorMessage || "Google account connection required.";
    return {
      textbooks: empty("authentication_required", message),
      chapters: empty("authentication_required", message),
    };
  }
  if (!config.ncertRegistryUrl.trim()) {
    return {
      textbooks: empty("source_unavailable", "NCERT registry URL is not configured."),
      chapters: empty("source_unavailable", "NCERT registry URL is not configured."),
    };
  }

  try {
    const [booksResult, chaptersResult] = await Promise.all([
      readGoogleSheetTabRows(config.ncertRegistryUrl, "NCERT_Book_Registry", { policy: "authenticated-required" }),
      readGoogleSheetTabRows(config.ncertRegistryUrl, "NCERT_Chapter_Registry", { policy: "authenticated-required" }),
    ]);
    const bookOptions = uniqueByStableKey(booksResult.rows.map(buildNcertBookOption).filter(Boolean) as RegistryDropdownOption[]);
    const chapterOptions = uniqueByStableKey(chaptersResult.rows.map(buildNcertChapterOption).filter(Boolean) as RegistryDropdownOption[]);
    return {
      textbooks: {
        availability: bookOptions.length > 0 ? "ready" : "empty",
        loadedAt: booksResult.checkedAt,
        message: buildAvailabilityMessage(bookOptions.length > 0 ? "ready" : "empty", bookOptions.length > 0 ? "NCERT textbooks loaded." : "No NCERT textbooks found."),
        options: bookOptions,
      },
      chapters: {
        availability: chapterOptions.length > 0 ? "ready" : "empty",
        loadedAt: chaptersResult.checkedAt,
        message: buildAvailabilityMessage(chapterOptions.length > 0 ? "ready" : "empty", chapterOptions.length > 0 ? "NCERT chapters loaded." : "No NCERT chapters found."),
        options: chapterOptions,
      },
    };
  } catch (error: any) {
    const availability = mapReadError(error?.code, authState);
    const message = error?.message || "NCERT registry unavailable.";
    return {
      textbooks: empty(availability, message),
      chapters: empty(availability, message),
    };
  }
}
