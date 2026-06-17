import type { WorkspaceFile } from "../types";
import {
  getAcademicResourceType,
  inferAcademicResourceType,
  type AcademicResourceAudience,
  type AcademicResourceCategory,
  type AcademicResourceSourceFamily,
} from "./academicResourceTypes";

export interface AcademicResourceRow {
  id: string;
  title: string;
  resourceTypeId: string;
  resourceTypeLabel: string;
  description: string;
  category: AcademicResourceCategory;
  audience: AcademicResourceAudience;
  sourceFamily: AcademicResourceSourceFamily;
  instructional: boolean;
  assessment: boolean;
  communication: boolean;
  remediation: boolean;
  enrichment: boolean;
  compliance: boolean;
  evidenceOriented: boolean;
  defaultStatusLabel?: string;
  className?: string;
  section?: string;
  subject?: string;
  chapter?: string;
  lessonPlanId?: string;
  lessonPlanTitle?: string;
  source: string;
  sourceRegistryId?: string;
  sourceRoute?: string;
  driveUrl?: string;
  classroomUrl?: string;
  status: string;
  sqaaTags: string[];
  ncertTags: string[];
  cbseTags: string[];
  evidenceTags: string[];
  updatedAt?: string;
  owner?: string;
  sharingRule?: string;
  raw: WorkspaceFile | Record<string, unknown>;
  tags: string[];
  isMetadataOnly: boolean;
  sourceUnavailable: boolean;
}

export interface AcademicResourceSummary {
  totalResources: number;
  resourceTypesRepresented: number;
  driveLinkedResources: number;
  classroomLinkedResources: number;
  sqaaEvidenceLinkedResources: number;
  sourceUnavailableOrMetadataOnly: number;
}

const TAG_REGEX = {
  sqaa: /SQAA-[A-Z0-9._-]+/gi,
  cbse: /CBSE-[A-Z0-9._-]+/gi,
  ncert: /NCERT-[A-Z0-9._-]+/gi,
  evidence: /(evidence|indicator|crosswalk|traceability|mapping)/gi,
};

function normalizeText(value?: string): string {
  return String(value || "").toLowerCase();
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function isRealUrl(value?: string): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function stripFileExtension(name?: string): string {
  const raw = String(name || "").trim();
  if (!raw) return "";
  const dotIndex = raw.lastIndexOf(".");
  if (dotIndex <= 0) return raw;
  return raw.slice(0, dotIndex);
}

function extractMatchedTags(text: string, regex: RegExp): string[] {
  return uniqueStrings(text.match(regex) || []);
}

function collectEvidenceTags(tags: string[], sourceText: string): {
  sqaaTags: string[];
  cbseTags: string[];
  ncertTags: string[];
  evidenceTags: string[];
} {
  const normalizedTags = tags.map((tag) => String(tag || "").trim()).filter(Boolean);
  const sqaaTags = uniqueStrings([
    ...normalizedTags.filter((tag) => /sqaa/i.test(tag)),
    ...extractMatchedTags(sourceText, TAG_REGEX.sqaa),
  ]);
  const cbseTags = uniqueStrings([
    ...normalizedTags.filter((tag) => /cbse/i.test(tag)),
    ...extractMatchedTags(sourceText, TAG_REGEX.cbse),
  ]);
  const ncertTags = uniqueStrings([
    ...normalizedTags.filter((tag) => /ncert/i.test(tag)),
    ...extractMatchedTags(sourceText, TAG_REGEX.ncert),
  ]);
  const evidenceTags = uniqueStrings([
    ...sqaaTags,
    ...cbseTags,
    ...ncertTags,
    ...normalizedTags.filter((tag) => /evidence|indicator|crosswalk|traceability|mapping/i.test(tag)),
    ...extractMatchedTags(sourceText, TAG_REGEX.evidence),
  ]);

  return { sqaaTags, cbseTags, ncertTags, evidenceTags };
}

function candidateSourceFamily(file: WorkspaceFile, sourceText: string): AcademicResourceSourceFamily {
  if (normalizeText(file.source) === "classroom") return "Google Classroom";
  if (normalizeText(file.source) === "drive" || normalizeText(file.source) === "shared drive") return "Google Drive";

  if (
    sourceText.includes("lesson plan") ||
    sourceText.includes("lessonplanner") ||
    sourceText.includes("edu_classroom_review_plans")
  ) {
    return "LessonPlanner";
  }

  if (
    sourceText.includes("textbook") ||
    sourceText.includes("ncert") ||
    sourceText.includes("chapter_resources") ||
    sourceText.includes("resource pack")
  ) {
    return "TextbookIngestor";
  }

  if (sourceText.includes("registry") || sourceText.includes("crosswalk") || sourceText.includes("traceability")) {
    return "Registry Explorer";
  }

  if (normalizeText(file.source) === "gmail") return "Google Drive";
  return "unknown";
}

function sourceRouteForFamily(sourceFamily: AcademicResourceSourceFamily): string | undefined {
  switch (sourceFamily) {
    case "LessonPlanner":
      return "/lesson-plans";
    case "TextbookIngestor":
      return "/textbooks";
    case "Registry Explorer":
      return "/registries";
    case "Google Classroom":
      return "/classroom";
    case "Google Drive":
      return "/search";
    default:
      return "/search";
  }
}

function sourceRegistryIdForFamily(sourceFamily: AcademicResourceSourceFamily): string | undefined {
  switch (sourceFamily) {
    case "LessonPlanner":
      return "edu_classroom_review_plans";
    case "TextbookIngestor":
      return "ncert_textbook_resources";
    case "Registry Explorer":
      return "registry-explorer";
    case "Google Classroom":
      return "workspace-google-classroom";
    case "Google Drive":
      return "workspace-google-drive";
    default:
      return "workspace-files";
  }
}

function shouldIncludeWorkspaceFile(file: WorkspaceFile): boolean {
  const sourceText = normalizeText(
    [
      file.name,
      file.path,
      file.contentSum,
      file.topicName,
      file.bookName,
      file.subjectName,
      file.className,
      ...(file.tags || []),
    ].join(" "),
  );

  const resourceType = inferAcademicResourceType(file);
  return (
    Boolean(file.topicName || file.chapterNumber) ||
    resourceType.id !== "raw_markdown" ||
    sourceText.includes("lesson") ||
    sourceText.includes("resource") ||
    sourceText.includes("worksheet") ||
    sourceText.includes("assessment") ||
    sourceText.includes("quiz") ||
    sourceText.includes("rubric") ||
    sourceText.includes("sqaa") ||
    sourceText.includes("cbse") ||
    sourceText.includes("ncert") ||
    sourceText.includes("reflection")
  );
}

function normalizeWorkspaceFile(file: WorkspaceFile): AcademicResourceRow | null {
  if (!shouldIncludeWorkspaceFile(file)) return null;

  const resourceType = inferAcademicResourceType(file);
  const sourceText = normalizeText([file.name, file.path, file.contentSum, ...(file.tags || [])].join(" "));
  const sourceFamily = candidateSourceFamily(file, sourceText);
  const driveUrl = isRealUrl(file.webViewLink) ? file.webViewLink : undefined;
  const classroomUrl = sourceFamily === "Google Classroom" ? driveUrl : undefined;
  const title = file.topicName || stripFileExtension(file.name) || file.name;
  const description = file.contentSum || file.path || "No additional description is available.";
  const tags = uniqueStrings(file.tags || []);
  const { sqaaTags, cbseTags, ncertTags, evidenceTags } = collectEvidenceTags(tags, sourceText);
  const status = driveUrl
    ? "Linked"
    : file.topicName || file.chapterNumber || file.contentSum || tags.length
      ? "Metadata only"
      : "Source unavailable";

  return {
    id: `workspace:${file.id}:${resourceType.id}`,
    title,
    resourceTypeId: resourceType.id,
    resourceTypeLabel: resourceType.label,
    description,
    category: resourceType.category,
    audience: resourceType.audience,
    sourceFamily,
    instructional: resourceType.instructional,
    assessment: resourceType.assessment,
    communication: resourceType.communication,
    remediation: resourceType.remediation,
    enrichment: resourceType.enrichment,
    compliance: resourceType.compliance,
    evidenceOriented: resourceType.evidenceOriented,
    defaultStatusLabel: resourceType.defaultStatusLabel,
    className: file.className,
    subject: file.subjectName,
    chapter: file.topicName || (file.chapterNumber ? `Chapter ${file.chapterNumber}` : undefined),
    source: file.source,
    sourceRegistryId: sourceRegistryIdForFamily(sourceFamily),
    sourceRoute: sourceRouteForFamily(sourceFamily),
    driveUrl,
    classroomUrl,
    status,
    sqaaTags,
    cbseTags,
    ncertTags,
    evidenceTags,
    updatedAt: file.modifiedAt,
    owner: file.owner,
    sharingRule: file.sharingRule,
    raw: file,
    tags,
    isMetadataOnly: !driveUrl && status === "Metadata only",
    sourceUnavailable: status === "Source unavailable",
  };
}

function normalizeSavedLessonPlanRow(plan: Record<string, unknown>): AcademicResourceRow | null {
  const topicName = String(plan.topicName || plan.title || plan.fileName || "").trim();
  const originalContent = String(plan.originalContent || plan.reviewComments || "").trim();
  const importedAt = String(plan.importedAt || plan.updatedAt || "").trim();
  const driveUrl = isRealUrl(String(plan.driveUrl || "")) ? String(plan.driveUrl) : undefined;
  const tags = uniqueStrings(
    Array.isArray(plan.tags)
      ? plan.tags.map((tag) => String(tag || "").trim())
      : [],
  );

  if (!topicName && !originalContent && !String(plan.id || "").trim()) {
    return null;
  }

  const syntheticFile: WorkspaceFile = {
    id: String(plan.id || topicName || "lesson-plan"),
    name: String(plan.fileName || topicName || "Lesson Plan"),
    type: "doc",
    source: "Drive",
    path: String(plan.path || topicName || "lesson-plan"),
    owner: String(plan.teacherName || plan.teacherEmail || "LessonPlanner"),
    modifiedAt: importedAt || new Date(0).toISOString(),
    medium: undefined,
    className: String(plan.className || ""),
    subjectName: String(plan.subjectName || ""),
    bookName: String(plan.bookName || ""),
    topicName: topicName || undefined,
    chapterNumber: typeof plan.chapterNumber === "number" ? plan.chapterNumber : undefined,
    sharingRule: "Private",
    isFavorite: false,
    tags,
    size: "",
    contentSum: originalContent || topicName || "Lesson plan archive entry",
    webViewLink: driveUrl,
  };

  const inferredType = inferAcademicResourceType(syntheticFile);
  const { sqaaTags, cbseTags, ncertTags, evidenceTags } = collectEvidenceTags(
    tags,
    normalizeText([topicName, originalContent].join(" ")),
  );
  const status = driveUrl
    ? "Linked"
    : String(plan.reviewStatus || "").trim()
      ? `Review: ${String(plan.reviewStatus)}`
      : "Metadata only";

  return {
    id: `lesson-plan:${syntheticFile.id}:${inferredType.id}`,
    title: topicName || stripFileExtension(syntheticFile.name) || "Lesson plan",
    resourceTypeId: inferredType.id,
    resourceTypeLabel: inferredType.label,
    description: originalContent || String(plan.reviewComments || "No additional description is available."),
    category: inferredType.category,
    audience: inferredType.audience,
    sourceFamily: "LessonPlanner",
    instructional: inferredType.instructional,
    assessment: inferredType.assessment,
    communication: inferredType.communication,
    remediation: inferredType.remediation,
    enrichment: inferredType.enrichment,
    compliance: inferredType.compliance,
    evidenceOriented: inferredType.evidenceOriented,
    defaultStatusLabel: inferredType.defaultStatusLabel,
    className: String(plan.className || ""),
    subject: String(plan.subjectName || ""),
    chapter: topicName || undefined,
    lessonPlanId: String(plan.id || topicName || ""),
    lessonPlanTitle: topicName || undefined,
    source: "LessonPlanner archive",
    sourceRegistryId: "edu_classroom_review_plans",
    sourceRoute: "/lesson-plans",
    driveUrl,
    classroomUrl: undefined,
    status,
    sqaaTags,
    cbseTags,
    ncertTags,
    evidenceTags,
    updatedAt: importedAt || undefined,
    owner: String(plan.teacherName || plan.teacherEmail || ""),
    raw: plan,
    tags,
    isMetadataOnly: !driveUrl,
    sourceUnavailable: !driveUrl && !originalContent,
  };
}

export function loadSavedLessonPlanArchiveRows(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem("edu_classroom_review_plans");
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object") : [];
  } catch {
    return [];
  }
}

export function buildAcademicResourceRows(
  files: WorkspaceFile[] = [],
  savedLessonPlans: Record<string, unknown>[] = loadSavedLessonPlanArchiveRows(),
): AcademicResourceRow[] {
  const mergedRows = [
    ...files.map(normalizeWorkspaceFile),
    ...savedLessonPlans.map(normalizeSavedLessonPlanRow),
  ].filter((item): item is AcademicResourceRow => Boolean(item));

  const seen = new Set<string>();
  return mergedRows
    .filter((row) => {
      const key = row.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      const leftTitle = left.title.toLowerCase();
      const rightTitle = right.title.toLowerCase();
      if (leftTitle === rightTitle) {
        return left.resourceTypeLabel.localeCompare(right.resourceTypeLabel);
      }
      return leftTitle.localeCompare(rightTitle);
    });
}

export function summarizeAcademicResourceRows(rows: AcademicResourceRow[] = []): AcademicResourceSummary {
  return {
    totalResources: rows.length,
    resourceTypesRepresented: new Set(rows.map((row) => row.resourceTypeId)).size,
    driveLinkedResources: rows.filter((row) => Boolean(row.driveUrl)).length,
    classroomLinkedResources: rows.filter((row) => Boolean(row.classroomUrl)).length,
    sqaaEvidenceLinkedResources: rows.filter((row) => row.sqaaTags.length > 0 || row.evidenceTags.length > 0).length,
    sourceUnavailableOrMetadataOnly: rows.filter((row) => row.sourceUnavailable || row.isMetadataOnly).length,
  };
}

