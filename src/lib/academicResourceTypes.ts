import type { WorkspaceFile } from "../types";

export type AcademicResourceAudience = "teacher" | "student" | "parent" | "coordinator" | "compliance" | "mixed";

export type AcademicResourceSourceFamily =
  | "LessonPlanner"
  | "TextbookIngestor"
  | "Google Drive"
  | "Google Classroom"
  | "Registry Explorer"
  | "unknown";

export type AcademicResourceCategory =
  | "Planning"
  | "Instruction"
  | "Assessment"
  | "Communication"
  | "Remediation"
  | "Enrichment"
  | "Compliance"
  | "Evidence"
  | "Source Material";

export interface AcademicResourceTypeDefinition {
  id: string;
  label: string;
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
  keywords: string[];
}

function defineAcademicResourceType(definition: AcademicResourceTypeDefinition): AcademicResourceTypeDefinition {
  return definition;
}

export const ACADEMIC_RESOURCE_TYPES: AcademicResourceTypeDefinition[] = [
  defineAcademicResourceType({
    id: "lesson_plan",
    label: "Lesson Plan",
    description: "A complete lesson plan artifact or lesson workspace draft.",
    category: "Planning",
    audience: "teacher",
    sourceFamily: "LessonPlanner",
    instructional: true,
    assessment: false,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: true,
    evidenceOriented: true,
    defaultStatusLabel: "Draft or linked",
    keywords: ["lesson plan", "lesson-plan", "lesson_plan", "lessonplanner", "plan draft"],
  }),
  defineAcademicResourceType({
    id: "outline",
    label: "Outline",
    description: "Lesson flow or compliance outline used for planning and review.",
    category: "Planning",
    audience: "teacher",
    sourceFamily: "LessonPlanner",
    instructional: true,
    assessment: false,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: true,
    evidenceOriented: true,
    defaultStatusLabel: "Linked",
    keywords: ["outline", "lesson flow", "plan outline"],
  }),
  defineAcademicResourceType({
    id: "slides",
    label: "Slides",
    description: "Presentation deck or slide outline for teaching delivery.",
    category: "Instruction",
    audience: "teacher",
    sourceFamily: "LessonPlanner",
    instructional: true,
    assessment: false,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: false,
    evidenceOriented: false,
    defaultStatusLabel: "Linked",
    keywords: ["slides", "slide deck", "ppt", "presentation", "deck"],
  }),
  defineAcademicResourceType({
    id: "quiz",
    label: "Quiz",
    description: "Concept check or diagnostic quiz for a lesson chapter.",
    category: "Assessment",
    audience: "mixed",
    sourceFamily: "TextbookIngestor",
    instructional: false,
    assessment: true,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: false,
    evidenceOriented: true,
    defaultStatusLabel: "Ready for review",
    keywords: ["quiz", "concept check", "diagnostic", "mcq"],
  }),
  defineAcademicResourceType({
    id: "worksheet",
    label: "Worksheet",
    description: "Student practice sheet with guided exercises.",
    category: "Instruction",
    audience: "mixed",
    sourceFamily: "LessonPlanner",
    instructional: true,
    assessment: true,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: false,
    evidenceOriented: false,
    defaultStatusLabel: "Linked",
    keywords: ["worksheet", "worksheets", "practice sheet"],
  }),
  defineAcademicResourceType({
    id: "activity_sheet",
    label: "Activity Sheet",
    description: "Experiential activity or hands-on task sheet.",
    category: "Instruction",
    audience: "mixed",
    sourceFamily: "TextbookIngestor",
    instructional: true,
    assessment: false,
    communication: false,
    remediation: false,
    enrichment: true,
    compliance: false,
    evidenceOriented: false,
    defaultStatusLabel: "Linked",
    keywords: ["activity sheet", "activity", "experiential", "lab", "hands-on"],
  }),
  defineAcademicResourceType({
    id: "question_bank",
    label: "Question Bank",
    description: "Reusable question set for discussion, revision, or drills.",
    category: "Assessment",
    audience: "mixed",
    sourceFamily: "TextbookIngestor",
    instructional: false,
    assessment: true,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: false,
    evidenceOriented: true,
    defaultStatusLabel: "Ready for review",
    keywords: ["question bank", "questionbank", "bank of questions"],
  }),
  defineAcademicResourceType({
    id: "assessment_bank",
    label: "Assessment Bank",
    description: "Scored or rubric-driven assessment blueprint.",
    category: "Assessment",
    audience: "coordinator",
    sourceFamily: "LessonPlanner",
    instructional: false,
    assessment: true,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: true,
    evidenceOriented: true,
    defaultStatusLabel: "Ready for review",
    keywords: ["assessment bank", "assessment blueprint", "diagnostic blueprint", "blueprint", "assessment plan"],
  }),
  defineAcademicResourceType({
    id: "homework",
    label: "Homework",
    description: "Take-home practice, reflection, or independent work.",
    category: "Planning",
    audience: "mixed",
    sourceFamily: "LessonPlanner",
    instructional: true,
    assessment: false,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: false,
    evidenceOriented: false,
    defaultStatusLabel: "Linked",
    keywords: ["homework", "home work", "take-home", "class tasks"],
  }),
  defineAcademicResourceType({
    id: "parent_discussion",
    label: "Parent Discussion",
    description: "Prompts to support home conversation about the lesson.",
    category: "Communication",
    audience: "parent",
    sourceFamily: "LessonPlanner",
    instructional: false,
    assessment: false,
    communication: true,
    remediation: false,
    enrichment: false,
    compliance: false,
    evidenceOriented: false,
    defaultStatusLabel: "Linked",
    keywords: ["parent discussion", "parent prompts", "discussion prompts", "home conversation"],
  }),
  defineAcademicResourceType({
    id: "parent_communication",
    label: "Parent Communication",
    description: "WhatsApp or broadcast-style family communication draft.",
    category: "Communication",
    audience: "parent",
    sourceFamily: "LessonPlanner",
    instructional: false,
    assessment: false,
    communication: true,
    remediation: false,
    enrichment: false,
    compliance: false,
    evidenceOriented: false,
    defaultStatusLabel: "Linked",
    keywords: ["parent communication", "whatsapp", "broadcast", "family message", "parent message"],
  }),
  defineAcademicResourceType({
    id: "remediation_enrichment",
    label: "Remediation and Enrichment",
    description: "Support or extension guidance for mixed-ability classrooms.",
    category: "Remediation",
    audience: "mixed",
    sourceFamily: "LessonPlanner",
    instructional: true,
    assessment: false,
    communication: false,
    remediation: true,
    enrichment: true,
    compliance: false,
    evidenceOriented: false,
    defaultStatusLabel: "Linked",
    keywords: ["remediation", "enrichment", "scaffold", "support", "gifted"],
  }),
  defineAcademicResourceType({
    id: "rubric",
    label: "Rubric",
    description: "Scoring rubric or quality-assurance matrix.",
    category: "Compliance",
    audience: "coordinator",
    sourceFamily: "LessonPlanner",
    instructional: false,
    assessment: true,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: true,
    evidenceOriented: true,
    defaultStatusLabel: "Ready for review",
    keywords: ["rubric", "grading matrix", "score matrix"],
  }),
  defineAcademicResourceType({
    id: "sqaa_links",
    label: "SQAA Links",
    description: "Indicator links and evidence references for compliance review.",
    category: "Evidence",
    audience: "compliance",
    sourceFamily: "LessonPlanner",
    instructional: false,
    assessment: false,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: true,
    evidenceOriented: true,
    defaultStatusLabel: "Evidence mapped",
    keywords: ["sqaa", "evidence map", "indicator cards", "compliance indicator"],
  }),
  defineAcademicResourceType({
    id: "evidence_map",
    label: "Evidence Map",
    description: "Crosswalk between lesson artifacts and evidence requirements.",
    category: "Evidence",
    audience: "compliance",
    sourceFamily: "Registry Explorer",
    instructional: false,
    assessment: false,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: true,
    evidenceOriented: true,
    defaultStatusLabel: "Evidence mapped",
    keywords: ["evidence map", "crosswalk", "traceability map", "mapping"],
  }),
  defineAcademicResourceType({
    id: "raw_markdown",
    label: "Raw Markdown / Source Material",
    description: "Source document or unparsed lesson material.",
    category: "Source Material",
    audience: "teacher",
    sourceFamily: "unknown",
    instructional: false,
    assessment: false,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: false,
    evidenceOriented: false,
    defaultStatusLabel: "Source only",
    keywords: ["raw markdown", "source material", "lesson plan", "markdown", "source"],
  }),
  defineAcademicResourceType({
    id: "teacher_reflection",
    label: "Teacher Reflection",
    description: "Teacher notes or post-lesson reflection for review.",
    category: "Planning",
    audience: "teacher",
    sourceFamily: "LessonPlanner",
    instructional: false,
    assessment: false,
    communication: false,
    remediation: true,
    enrichment: false,
    compliance: false,
    evidenceOriented: false,
    defaultStatusLabel: "Linked",
    keywords: ["reflection", "teacher reflection", "lesson reflection", "teacher notes"],
  }),
  defineAcademicResourceType({
    id: "assessment_plan",
    label: "Assessment Plan",
    description: "Assessment blueprint, mark scheme, or planned evaluation sequence.",
    category: "Assessment",
    audience: "coordinator",
    sourceFamily: "LessonPlanner",
    instructional: false,
    assessment: true,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: true,
    evidenceOriented: true,
    defaultStatusLabel: "Ready for review",
    keywords: ["assessment plan", "assessment blueprint", "mark scheme", "evaluation plan"],
  }),
  defineAcademicResourceType({
    id: "question_paper",
    label: "Question Paper",
    description: "Exam paper, sample paper, or term-test style resource.",
    category: "Assessment",
    audience: "mixed",
    sourceFamily: "TextbookIngestor",
    instructional: false,
    assessment: true,
    communication: false,
    remediation: false,
    enrichment: false,
    compliance: false,
    evidenceOriented: true,
    defaultStatusLabel: "Ready for review",
    keywords: ["question paper", "exam paper", "sample paper", "test paper", "board paper"],
  }),
  defineAcademicResourceType({
    id: "report_card_support",
    label: "Report Card Support",
    description: "Comment bank, remark support, or progress-report guidance.",
    category: "Compliance",
    audience: "coordinator",
    sourceFamily: "Registry Explorer",
    instructional: false,
    assessment: false,
    communication: true,
    remediation: false,
    enrichment: false,
    compliance: true,
    evidenceOriented: true,
    defaultStatusLabel: "Ready for review",
    keywords: ["report card", "report card support", "progress report", "remark bank"],
  }),
];

const TYPE_LOOKUP = new Map(ACADEMIC_RESOURCE_TYPES.map((type) => [type.id, type] as const));

const INFERENCE_RULES: Array<{ typeId: string; patterns: string[] }> = [
  { typeId: "lesson_plan", patterns: ["lesson plan", "lesson-plan", "lesson_plan", "lessonplanner"] },
  { typeId: "outline", patterns: ["outline", "lesson flow", "plan outline"] },
  { typeId: "slides", patterns: ["slides", "slide deck", "ppt", "presentation", "deck"] },
  { typeId: "quiz", patterns: ["quiz", "concept check", "diagnostic", "mcq"] },
  { typeId: "worksheet", patterns: ["worksheet", "worksheets", "practice sheet"] },
  { typeId: "activity_sheet", patterns: ["activity sheet", "activity", "experiential", "lab", "hands-on"] },
  { typeId: "question_bank", patterns: ["question bank", "questionbank", "bank of questions"] },
  { typeId: "assessment_bank", patterns: ["assessment bank", "assessment blueprint", "diagnostic blueprint", "blueprint"] },
  { typeId: "homework", patterns: ["homework", "home work", "take-home", "class tasks"] },
  { typeId: "parent_discussion", patterns: ["parent discussion", "parent prompts", "discussion prompts", "home conversation"] },
  { typeId: "parent_communication", patterns: ["parent communication", "whatsapp", "broadcast", "family message"] },
  { typeId: "remediation_enrichment", patterns: ["remediation", "enrichment", "scaffold", "support", "gifted"] },
  { typeId: "rubric", patterns: ["rubric", "grading matrix", "score matrix"] },
  { typeId: "sqaa_links", patterns: ["sqaa", "indicator cards", "evidence map", "compliance indicator"] },
  { typeId: "evidence_map", patterns: ["evidence map", "crosswalk", "traceability map", "mapping"] },
  { typeId: "teacher_reflection", patterns: ["reflection", "teacher reflection", "lesson reflection", "teacher notes"] },
  { typeId: "assessment_plan", patterns: ["assessment plan", "assessment blueprint", "mark scheme", "evaluation plan"] },
  { typeId: "question_paper", patterns: ["question paper", "exam paper", "sample paper", "test paper", "board paper"] },
  { typeId: "report_card_support", patterns: ["report card", "report card support", "progress report", "remark bank"] },
];

function normalizeText(value?: string): string {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function containsAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

export function getAcademicResourceType(resourceTypeId: string): AcademicResourceTypeDefinition {
  return TYPE_LOOKUP.get(resourceTypeId) || TYPE_LOOKUP.get("raw_markdown")!;
}

export function inferAcademicResourceType(file: WorkspaceFile): AcademicResourceTypeDefinition {
  const haystack = normalizeText(
    [
      file.name,
      file.path,
      file.contentSum,
      file.topicName,
      file.bookName,
      file.subjectName,
      file.className,
      file.medium,
      ...(file.tags || []),
    ].join(" "),
  );

  for (const rule of INFERENCE_RULES) {
    if (containsAny(haystack, rule.patterns)) {
      return getAcademicResourceType(rule.typeId);
    }
  }

  if (file.type === "slide") return getAcademicResourceType("slides");
  if (file.type === "form") return getAcademicResourceType("quiz");
  if (file.name.toLowerCase().includes("worksheet")) return getAcademicResourceType("worksheet");
  if (file.name.toLowerCase().includes("homework")) return getAcademicResourceType("homework");
  if (file.name.toLowerCase().includes("reflection")) return getAcademicResourceType("teacher_reflection");
  if (file.name.toLowerCase().includes("report card")) return getAcademicResourceType("report_card_support");

  return getAcademicResourceType("raw_markdown");
}

