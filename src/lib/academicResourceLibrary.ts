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
  sourceLabel: string;
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
  sourceRecordId?: string;
  sourceAvailable: boolean;
  sourceConfidence: "high" | "medium" | "low";
  sourceNotes: string;
  driveUrl?: string;
  classroomUrl?: string;
  status: string;
  evidenceType: string;
  evidenceUrl?: string;
  evidenceStatus: "mapped" | "review only" | "unavailable";
  evidenceNotes: string;
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

function buildEvidenceTypeLabel(sqaaTags: string[], cbseTags: string[], ncertTags: string[], evidenceTags: string[]): string {
  const evidenceParts = [
    sqaaTags.length > 0 ? "SQAA" : "",
    cbseTags.length > 0 ? "CBSE" : "",
    ncertTags.length > 0 ? "NCERT" : "",
  ].filter(Boolean);

  if (evidenceParts.length > 0) {
    return evidenceParts.join(" / ");
  }

  if (evidenceTags.length > 0) {
    return "Evidence mapping";
  }

  return "None";
}

function buildEvidenceStatus(evidenceTags: string[], evidenceOriented: boolean): "mapped" | "review only" | "unavailable" {
  if (evidenceTags.length > 0) return "mapped";
  if (evidenceOriented) return "review only";
  return "unavailable";
}

function buildSourceLabel(sourceFamily: AcademicResourceSourceFamily, sourceText: string, resourceTypeId: string, isLessonPlanArchive = false): string {
  if (isLessonPlanArchive) return "Lesson Plan Archive";

  if (
    resourceTypeId === "assessment_bank" ||
    resourceTypeId === "assessment_plan"
  ) {
    return "Assessment Plan";
  }

  if (resourceTypeId === "question_paper" || resourceTypeId === "quiz") {
    return "Question Paper";
  }

  if (resourceTypeId === "parent_communication" || resourceTypeId === "parent_discussion") {
    return "Parent Communication";
  }

  if (resourceTypeId === "remediation_enrichment") {
    return "Remediation & Enrichment";
  }

  if (resourceTypeId === "evidence_map" || resourceTypeId === "sqaa_links" || resourceTypeId === "report_card_support") {
    return "Registry Metadata";
  }

  if (
    sourceText.includes("ncert") ||
    sourceText.includes("textbook") ||
    sourceText.includes("chapter resources")
  ) {
    return "Textbook / NCERT";
  }

  if (
    sourceText.includes("lesson plan") ||
    sourceText.includes("lessonplanner") ||
    sourceText.includes("lesson workspace") ||
    sourceText.includes("worksheet") ||
    sourceText.includes("homework") ||
    sourceText.includes("slides") ||
    sourceText.includes("activity")
  ) {
    return "Lesson Workspace";
  }

  if (sourceText.includes("artifact")) {
    return "Lesson Artifact";
  }

  if (sourceFamily === "Google Classroom") return "Google Classroom";
  if (sourceFamily === "Google Drive") return "Workspace File";
  if (sourceFamily === "Registry Explorer") return "Registry Metadata";

  return "Workspace File";
}

function buildSourceNotes(sourceLabel: string, sourceFamily: AcademicResourceSourceFamily, hasLiveLink: boolean, isLessonPlanArchive = false): string {
  if (isLessonPlanArchive) {
    return "This row was restored from the saved lesson-plan archive and stays read-only in the resource library.";
  }

  if (sourceLabel === "Textbook / NCERT") {
    return "This row is linked to NCERT/textbook context inferred from existing file metadata and remains read-only.";
  }

  if (sourceLabel === "Registry Metadata") {
    return "This row is derived from registry-linked metadata and supports evidence tracing without writing back to the registry.";
  }

  if (sourceLabel === "Lesson Artifact") {
    return "This row was inferred as a lesson artifact from existing source metadata and is shown read-only.";
  }

  if (sourceLabel === "Lesson Workspace") {
    return "This row was inferred as a lesson workspace item from existing source metadata and is shown read-only.";
  }

  if (sourceLabel === "Assessment Plan" || sourceLabel === "Question Paper" || sourceLabel === "Parent Communication" || sourceLabel === "Remediation & Enrichment") {
    return "This row was classified from existing planning metadata and is surfaced for review only.";
  }

  if (sourceFamily === "Google Classroom") {
    return "This row is backed by Classroom metadata and can be reviewed without changing classroom data.";
  }

  if (hasLiveLink) {
    return "This row is backed by a live workspace link and remains read-only in the resource library.";
  }

  return "This row is inferred from existing workspace metadata and stays read-only in the resource library.";
}

function buildSourceConfidence(sourceLabel: string, hasLiveLink: boolean, sourceFamily: AcademicResourceSourceFamily): "high" | "medium" | "low" {
  if (hasLiveLink) return "high";
  if (sourceLabel === "Workspace File" || sourceFamily === "unknown") return "low";
  return "medium";
}

function buildSourceRegistryId(sourceLabel: string, sourceFamily: AcademicResourceSourceFamily): string | undefined {
  if (sourceLabel === "Lesson Plan Archive") return "edu_classroom_review_plans";
  if (sourceLabel === "Textbook / NCERT") return "ncertRegistryUrl";
  if (sourceLabel === "Registry Metadata") return "qaSqaaRegistryUrl";
  if (sourceLabel === "Assessment Plan" || sourceLabel === "Question Paper") return "assessmentResultRegistryUrl";
  if (sourceLabel === "Google Classroom") return "classroomSyncRegistryUrl";
  if (sourceLabel === "Lesson Workspace" || sourceLabel === "Lesson Artifact" || sourceLabel === "Parent Communication" || sourceLabel === "Remediation & Enrichment") {
    return "lessonWorkspaceRegistryUrl";
  }
  if (sourceFamily === "Google Drive") return "workspace-files";
  return "workspace-files";
}

function buildSourceRoute(sourceLabel: string, sourceFamily: AcademicResourceSourceFamily): string | undefined {
  if (sourceLabel === "Lesson Plan Archive" || sourceLabel === "Lesson Workspace" || sourceLabel === "Lesson Artifact" || sourceLabel === "Parent Communication" || sourceLabel === "Remediation & Enrichment") {
    return "/lesson-plans";
  }
  if (sourceLabel === "Textbook / NCERT") return "/textbooks";
  if (sourceLabel === "Registry Metadata") return "/registries";
  if (sourceLabel === "Assessment Plan" || sourceLabel === "Question Paper") return "/registries";
  if (sourceLabel === "Google Classroom") return "/classroom";
  if (sourceFamily === "Google Drive") return "/search";
  return sourceFamily === "unknown" ? undefined : "/search";
}

function buildEvidenceUrl(driveUrl: string | undefined, classroomUrl: string | undefined, sourceRoute: string | undefined): string | undefined {
  return driveUrl || classroomUrl || sourceRoute;
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
  const sourceLabel = buildSourceLabel(sourceFamily, sourceText, resourceType.id);
  const sourceRoute = buildSourceRoute(sourceLabel, sourceFamily);
  const sourceRegistryId = buildSourceRegistryId(sourceLabel, sourceFamily);
  const sourceRecordId = String(file.id || "").trim() || undefined;
  const sourceAvailable = Boolean(driveUrl || classroomUrl || sourceRoute);
  const sourceConfidence = buildSourceConfidence(sourceLabel, Boolean(driveUrl || classroomUrl), sourceFamily);
  const sourceNotes = buildSourceNotes(sourceLabel, sourceFamily, Boolean(driveUrl || classroomUrl));
  const evidenceType = buildEvidenceTypeLabel(sqaaTags, cbseTags, ncertTags, evidenceTags);
  const evidenceStatus = buildEvidenceStatus(evidenceTags, resourceType.evidenceOriented);
  const evidenceUrl = buildEvidenceUrl(driveUrl, classroomUrl, sourceRoute);
  const evidenceNotes =
    evidenceTags.length > 0
      ? "Evidence tags were inferred from existing metadata and should be treated as review-only."
      : "Evidence tags are not available from this source yet.";
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
    sourceLabel,
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
    sourceRegistryId,
    sourceRoute,
    sourceRecordId,
    sourceAvailable,
    sourceConfidence,
    sourceNotes,
    driveUrl,
    classroomUrl,
    status,
    evidenceType,
    evidenceUrl,
    evidenceStatus,
    evidenceNotes,
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
  const sourceFamily = "LessonPlanner";
  const sourceLabel = buildSourceLabel(sourceFamily, normalizeText([topicName, originalContent].join(" ")), inferredType.id, true);
  const sourceRoute = buildSourceRoute(sourceLabel, sourceFamily);
  const sourceRegistryId = buildSourceRegistryId(sourceLabel, sourceFamily);
  const sourceRecordId = String(plan.id || topicName || "").trim() || undefined;
  const sourceAvailable = Boolean(driveUrl || sourceRoute);
  const sourceConfidence = buildSourceConfidence(sourceLabel, Boolean(driveUrl), sourceFamily);
  const sourceNotes = buildSourceNotes(sourceLabel, sourceFamily, Boolean(driveUrl), true);
  const evidenceType = buildEvidenceTypeLabel(sqaaTags, cbseTags, ncertTags, evidenceTags);
  const evidenceStatus = buildEvidenceStatus(evidenceTags, inferredType.evidenceOriented);
  const evidenceUrl = buildEvidenceUrl(driveUrl, undefined, sourceRoute);
  const evidenceNotes =
    evidenceTags.length > 0
      ? "Evidence tags were inferred from the archive metadata and should be treated as review-only."
      : "Evidence tags are not available from this source yet.";
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
    sourceFamily,
    sourceLabel,
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
    sourceRegistryId,
    sourceRoute,
    sourceRecordId,
    sourceAvailable,
    sourceConfidence,
    sourceNotes,
    driveUrl,
    classroomUrl: undefined,
    status,
    evidenceType,
    evidenceUrl,
    evidenceStatus,
    evidenceNotes,
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
