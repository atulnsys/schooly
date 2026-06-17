import type { WorkspaceFile } from "../types";

export type AcademicResourceAudience =
  | "student-facing"
  | "teacher-facing"
  | "parent-facing"
  | "assessment-facing"
  | "compliance-facing";

export interface AcademicResourceTypeDefinition {
  id: string;
  displayLabel: string;
  description: string;
  category: "Planning" | "Instruction" | "Assessment" | "Communication" | "Compliance" | "Source Material";
  typicalSource: string;
  studentFacing: boolean;
  teacherFacing: boolean;
  parentFacing: boolean;
  assessmentFacing: boolean;
  complianceFacing: boolean;
  keywords: string[];
}

export interface AcademicResourceRow {
  id: string;
  title: string;
  description: string;
  resourceTypeId: string;
  resourceTypeLabel: string;
  category: AcademicResourceTypeDefinition["category"];
  typicalSource: string;
  studentFacing: boolean;
  teacherFacing: boolean;
  parentFacing: boolean;
  assessmentFacing: boolean;
  complianceFacing: boolean;
  source: string;
  status: string;
  origin: "WorkspaceFile" | "SavedLessonArchive";
  className?: string;
  subjectName?: string;
  chapterName?: string;
  lessonLinkage?: string;
  modifiedAt?: string;
  owner?: string;
  webViewLink?: string;
  path?: string;
  tags: string[];
}

const TEXT_TOKEN_MAP = (value?: string) => (value || "").toLowerCase();

export const ACADEMIC_RESOURCE_TYPES: AcademicResourceTypeDefinition[] = [
  {
    id: "outline",
    displayLabel: "Outline",
    description: "Lesson flow and compliance outline used for planning and review.",
    category: "Planning",
    typicalSource: "LessonPlanner or chapter-linked Drive notes",
    studentFacing: false,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: false,
    complianceFacing: true,
    keywords: ["outline", "lesson plan", "lesson-plan", "lesson_plan", "plan outline"],
  },
  {
    id: "slides",
    displayLabel: "Slides / PPT",
    description: "Presentation deck or slide outline for teaching delivery.",
    category: "Instruction",
    typicalSource: "LessonPlanner or generated teaching packs",
    studentFacing: false,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: false,
    complianceFacing: false,
    keywords: ["slides", "slide deck", "ppt", "presentation", "deck"],
  },
  {
    id: "quiz",
    displayLabel: "Quiz",
    description: "Concept check or diagnostic quiz for a lesson chapter.",
    category: "Assessment",
    typicalSource: "LessonPlanner or TextbookIngestor",
    studentFacing: true,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: true,
    complianceFacing: false,
    keywords: ["quiz", "concept check", "diagnostic", "mcq"],
  },
  {
    id: "worksheet",
    displayLabel: "Worksheet",
    description: "Student practice sheet with guided exercises.",
    category: "Instruction",
    typicalSource: "LessonPlanner or chapter resource packs",
    studentFacing: true,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: true,
    complianceFacing: false,
    keywords: ["worksheet", "worksheets", "practice sheet"],
  },
  {
    id: "activity_sheet",
    displayLabel: "Activity Sheet",
    description: "Experiential activity or hands-on task sheet.",
    category: "Instruction",
    typicalSource: "LessonPlanner or classroom activity pack",
    studentFacing: true,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: false,
    complianceFacing: false,
    keywords: ["activity sheet", "activity", "experiential", "lab", "hands-on"],
  },
  {
    id: "question_bank",
    displayLabel: "Question Bank",
    description: "Reusable question set for discussion, revision, or drills.",
    category: "Assessment",
    typicalSource: "LessonPlanner or TextbookIngestor",
    studentFacing: true,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: true,
    complianceFacing: false,
    keywords: ["question bank", "questionbank", "bank of questions"],
  },
  {
    id: "assessment_bank",
    displayLabel: "Assessment Bank",
    description: "Scored or rubric-driven assessment blueprint.",
    category: "Assessment",
    typicalSource: "LessonPlanner or evaluation pack",
    studentFacing: false,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: true,
    complianceFacing: true,
    keywords: ["assessment bank", "assessment blueprint", "diagnostic blueprint", "blueprint"],
  },
  {
    id: "homework",
    displayLabel: "Homework",
    description: "Take-home practice, reflection, or independent work.",
    category: "Planning",
    typicalSource: "LessonPlanner",
    studentFacing: true,
    teacherFacing: true,
    parentFacing: true,
    assessmentFacing: false,
    complianceFacing: false,
    keywords: ["homework", "assignments", "take-home", "class tasks"],
  },
  {
    id: "parent_discussion",
    displayLabel: "Parent Discussion",
    description: "Prompts to support home conversation about the lesson.",
    category: "Communication",
    typicalSource: "LessonPlanner",
    studentFacing: false,
    teacherFacing: true,
    parentFacing: true,
    assessmentFacing: false,
    complianceFacing: false,
    keywords: ["parent discussion", "parent prompts", "discussion prompts", "home conversation"],
  },
  {
    id: "parent_communication",
    displayLabel: "Parent Communication",
    description: "WhatsApp or broadcast-style family communication draft.",
    category: "Communication",
    typicalSource: "LessonPlanner",
    studentFacing: false,
    teacherFacing: true,
    parentFacing: true,
    assessmentFacing: false,
    complianceFacing: false,
    keywords: ["parent communication", "whatsapp", "broadcast", "family message"],
  },
  {
    id: "remediation_enrichment",
    displayLabel: "Remediation & Enrichment",
    description: "Support or extension guidance for mixed-ability classrooms.",
    category: "Planning",
    typicalSource: "LessonPlanner",
    studentFacing: true,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: false,
    complianceFacing: false,
    keywords: ["remediation", "enrichment", "scaffold", "support", "gifted"],
  },
  {
    id: "rubric",
    displayLabel: "Rubric",
    description: "Scoring rubric or quality-assurance matrix.",
    category: "Compliance",
    typicalSource: "LessonPlanner or evaluation pack",
    studentFacing: false,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: true,
    complianceFacing: true,
    keywords: ["rubric", "grading matrix", "score matrix"],
  },
  {
    id: "sqaa_links",
    displayLabel: "SQAA Links / Evidence Map",
    description: "Indicator links and evidence references for compliance review.",
    category: "Compliance",
    typicalSource: "LessonPlanner",
    studentFacing: false,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: false,
    complianceFacing: true,
    keywords: ["sqaa", "evidence map", "indicator cards", "compliance indicator"],
  },
  {
    id: "raw_markdown",
    displayLabel: "Raw Markdown / Source Material",
    description: "Source document or unparsed lesson material.",
    category: "Source Material",
    typicalSource: "Drive file or lesson archive",
    studentFacing: false,
    teacherFacing: true,
    parentFacing: false,
    assessmentFacing: false,
    complianceFacing: false,
    keywords: ["raw markdown", "source material", "lesson plan", "markdown", "source"],
  },
];

const TYPE_LOOKUP = new Map(ACADEMIC_RESOURCE_TYPES.map((type) => [type.id, type]));

function joinParts(parts: Array<string | number | undefined>): string {
  return parts
    .map((part) => (part === undefined || part === null ? "" : String(part).trim()))
    .filter(Boolean)
    .join(" · ");
}

export function getAcademicResourceType(resourceTypeId: string) {
  return TYPE_LOOKUP.get(resourceTypeId) || TYPE_LOOKUP.get("raw_markdown")!;
}

export function inferAcademicResourceType(file: WorkspaceFile): AcademicResourceTypeDefinition {
  const haystack = TEXT_TOKEN_MAP(
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

  for (const resourceType of ACADEMIC_RESOURCE_TYPES) {
    if (resourceType.keywords.some((keyword) => haystack.includes(keyword))) {
      return resourceType;
    }
  }

  if (file.type === "slide") return TYPE_LOOKUP.get("slides")!;
  if (file.type === "form") return TYPE_LOOKUP.get("quiz")!;
  if (file.name.toLowerCase().includes("worksheet")) return TYPE_LOOKUP.get("worksheet")!;
  if (file.name.toLowerCase().includes("homework")) return TYPE_LOOKUP.get("homework")!;

  return TYPE_LOOKUP.get("raw_markdown")!;
}

export function buildAcademicResourceRows(files: WorkspaceFile[] = [], savedLessonArchives: WorkspaceFile[] = []): AcademicResourceRow[] {
  const mergedFiles = [...files, ...savedLessonArchives];
  const seen = new Set<string>();

  return mergedFiles
    .filter((file) => {
      const haystack = TEXT_TOKEN_MAP([file.name, file.path, file.contentSum, file.topicName, ...(file.tags || [])].join(" "));
      return ACADEMIC_RESOURCE_TYPES.some((type) => type.keywords.some((keyword) => haystack.includes(keyword))) || Boolean(file.topicName || file.chapterNumber);
    })
    .map<AcademicResourceRow | null>((file) => {
      const resourceType = inferAcademicResourceType(file);
      const id = [file.id, file.path, file.name, resourceType.id].filter(Boolean).join("|");
      if (seen.has(id)) {
        return null;
      }
      seen.add(id);

      const lessonLinkage = joinParts([
        file.topicName,
        file.chapterNumber ? `Chapter ${file.chapterNumber}` : "",
        file.bookName,
      ]);

      const row: AcademicResourceRow = {
        id,
        title: file.topicName || file.name,
        description: file.contentSum || file.path || "No additional description is available.",
        resourceTypeId: resourceType.id,
        resourceTypeLabel: resourceType.displayLabel,
        category: resourceType.category,
        typicalSource: resourceType.typicalSource,
        studentFacing: resourceType.studentFacing,
        teacherFacing: resourceType.teacherFacing,
        parentFacing: resourceType.parentFacing,
        assessmentFacing: resourceType.assessmentFacing,
        complianceFacing: resourceType.complianceFacing,
        source: file.source,
        status: file.webViewLink ? "Linked" : "Source unavailable",
        origin: savedLessonArchives.some((archive) => archive.id === file.id) ? "SavedLessonArchive" : "WorkspaceFile",
        className: file.className,
        subjectName: file.subjectName,
        chapterName: file.topicName || (file.chapterNumber ? `Chapter ${file.chapterNumber}` : undefined),
        lessonLinkage: lessonLinkage || undefined,
        modifiedAt: file.modifiedAt,
        owner: file.owner,
        webViewLink: file.webViewLink,
        path: file.path,
        tags: file.tags || [],
      };
      return row;
    })
    .filter((item): item is AcademicResourceRow => Boolean(item))
    .sort((left, right) => {
      const leftTitle = left.title.toLowerCase();
      const rightTitle = right.title.toLowerCase();
      if (leftTitle === rightTitle) {
        return left.resourceTypeLabel.localeCompare(right.resourceTypeLabel);
      }
      return leftTitle.localeCompare(rightTitle);
    });
}
