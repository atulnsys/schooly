import React, { useState, useEffect } from "react";
import { WorkspaceFile, ClassroomCourse } from "../types";
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  Sliders, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Download, 
  Save, 
  ArrowLeft, 
  Copy, 
  Edit, 
  Brain, 
  LayoutList, 
  FileCode, 
  SlidersHorizontal,
  Clock,
  History,
  Info,
  ExternalLink,
  ChevronRight,
  Database,
  Shield,
  ShieldCheck,
  Upload,
  Play,
  Pause,
  RotateCw,
  Smile,
  Send,
  Eye,
  EyeOff,
  Award,
  Check,
  X,
  Edit3,
  Settings,
  MoreVertical,
  RefreshCw,
  Trash2
} from "lucide-react";

export const getTeacherFriendlyName = (identifier: string) => {
  if (!identifier) return "Ms. Emily Montgomery";
  if (!identifier.includes("@")) {
    return identifier;
  }
  const trimmed = identifier.toLowerCase().trim();
  if (trimmed === "torres.admin@school.org") return "Gabriel Torres";
  if (trimmed === "coord.planner@school.org") return "Marcus Vance";
  if (trimmed === "mathematics.department@school.org") return "Eleanor Montgomery";
  if (trimmed === "s.henderson@school.org") return "Dr. Sarah Henderson";
  if (trimmed === "m.vance@school.org") return "Mr. Michael Vance";
  if (trimmed === "e.montgomery@school.org") return "Ms. Emily Montgomery";
  if (trimmed === "e.jones@school.org") return "Ms. Emily Jones";
  if (trimmed === "j.smith@school.org") return "Mr. John Smith";
  
  // Custom parsing for other emails like atul.nsys@gmail.com
  const parts = trimmed.split("@")[0].split(/[._+-]+/);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
};

// CBSE SQAA Indicators Mapping
interface SqaaIndicator {
  id: string;
  domain: string;
  description: string;
}

const SQAA_INDICATORS: SqaaIndicator[] = [
  { id: "sqaa-1.1", domain: "Curriculum Planning", description: "Syllabus mapping, defined learning outcomes, custom pacing milestones, and structured review processes." },
  { id: "sqaa-1.2", domain: "Teaching Learning Processes", description: "Joyful, age-appropriate, experiential pedagogical approaches, real-life application, and critical thinking." },
  { id: "sqaa-1.3", domain: "Student Enrichment & Skills", description: "Art & music integration, digital/financial/citizenship literacy, and pre-vocational skill exposure." },
  { id: "sqaa-1.4", domain: "Mainstreaming PE & Sports", description: "Weekly physical education integration, health & wellness club alignment, yoga, and safety standards." },
  { id: "sqaa-1.5", domain: "Values and Ethos", description: "Constitutional values, fundamental duties, cultural heritage (EBSB), civic traits, and SEWA projects." },
  { id: "sqaa-1.6", domain: "Assessment of Learning Outcomes", description: "Competency-focused assessment tasks, HPC tracking of cognitive/affective/psychomotor domains, and diagnostic feedback." },
  { id: "sqaa-1.7", domain: "ECCE & Foundational Stage", description: "NIPUN Bharat literacy/numeracy corners, toy/play pedagogy, and foundational childhood care alignment." }
];

// Curriculum Setup Domain Model (Course Catalog Source-of-Truth)
interface CurriculumItem {
  className: string;
  subjectName: string;
  book: string;
  topics: { id: string; name: string; isComputationalThinkingFriendly?: boolean }[];
}

const CURRICULUM_SETUP: CurriculumItem[] = [
  {
    className: "Class VIII",
    subjectName: "Science",
    book: "NCERT Science Class VIII",
    topics: [
      { id: "ch01", name: "Chapter 1: Crop Production and Management", isComputationalThinkingFriendly: true },
      { id: "ch02", name: "Chapter 2: Microorganisms: Friend and Foe", isComputationalThinkingFriendly: false },
      { id: "ch03", name: "Chapter 3: Coal and Petroleum", isComputationalThinkingFriendly: true },
      { id: "ch04", name: "Chapter 4: Combustion and Flame", isComputationalThinkingFriendly: false },
      { id: "ch05", name: "Chapter 5: Conservation of Plants and Animals", isComputationalThinkingFriendly: true }
    ]
  },
  {
    className: "Class XI",
    subjectName: "AP Chemistry",
    book: "Brown Lemay AP Chemistry Modern Edition",
    topics: [
      { id: "ch01", name: "Chapter 1: Atoms, Molecules, and Ions", isComputationalThinkingFriendly: true },
      { id: "ch02", name: "Chapter 2: Chemical Bonding and Structure", isComputationalThinkingFriendly: false },
      { id: "ch03", name: "Chapter 3: Thermodynamics and Kinetics", isComputationalThinkingFriendly: true }
    ]
  },
  {
    className: "Class IX",
    subjectName: "Mathematics",
    book: "RS Aggarwal Mathematics Class IX",
    topics: [
      { id: "ch01", name: "Chapter 1: Number Systems", isComputationalThinkingFriendly: true },
      { id: "ch02", name: "Chapter 2: Polynomials", isComputationalThinkingFriendly: true },
      { id: "ch03", name: "Chapter 3: Coordinate Geometry", isComputationalThinkingFriendly: true },
      { id: "ch04", name: "Chapter 4: Linear Equations in Two Variables", isComputationalThinkingFriendly: true }
    ]
  },
  {
    className: "Class X",
    subjectName: "English",
    book: "First Flight NCERT Class X",
    topics: [
      { id: "ch01", name: "Chapter 1: A Letter to God", isComputationalThinkingFriendly: false },
      { id: "ch02", name: "Chapter 2: Nelson Mandela: Long Walk to Freedom", isComputationalThinkingFriendly: false },
      { id: "ch03", name: "Chapter 3: Two Stories about Flying", isComputationalThinkingFriendly: false }
    ]
  }
];

// Allocation rules for individual teachers
const TEACHER_ALLOCATIONS: Record<string, { classes: string[]; subjects: string[] }> = {
  "s.henderson@school.org": {
    classes: ["Class VIII", "Class XI"],
    subjects: ["Science", "AP Chemistry"]
  },
  "m.vance@school.org": {
    classes: ["Class IX"],
    subjects: ["Mathematics"]
  },
  "e.montgomery@school.org": {
    classes: ["Class X"],
    subjects: ["English"]
  }
};

export interface ClassroomLessonPlan {
  id: string;
  teacherName: string;
  teacherEmail: string;
  className: string;
  subjectName: string;
  topicName: string;
  importedAt: string;
  reviewStatus: "Pending Review" | "Under Review" | "Compliant" | "Approved with Recommendations" | "Non-Compliant";
  checklist: {
    outcomes: "pass" | "fail" | "pending";
    timeboxed: "pass" | "fail" | "pending";
    experiential: "pass" | "fail" | "pending";
    differentiation: "pass" | "fail" | "pending";
    homework: "pass" | "fail" | "pending";
    parental: "pass" | "fail" | "pending";
    sqaa: "pass" | "fail" | "pending";
    computational: "pass" | "fail" | "pending" | "not_applicable";
  };
  score: string;
  reviewComments: string;
  originalContent: string;
  improvedContent?: string;
  fileName?: string;
  driveUrl?: string;
}

const INITIAL_CLASSROOM_PLANS: ClassroomLessonPlan[] = [
  {
    id: "plan_01",
    teacherName: "Dr. Sarah Henderson",
    teacherEmail: "s.henderson@school.org",
    className: "Class VIII",
    subjectName: "Science",
    topicName: "Chapter 1: Crop Production and Management",
    importedAt: "2026-06-08T09:12:00Z",
    reviewStatus: "Pending Review",
    checklist: {
      outcomes: "pending",
      timeboxed: "pending",
      experiential: "pending",
      differentiation: "pending",
      homework: "pending",
      parental: "pending",
      sqaa: "pending",
      computational: "pending"
    },
    score: "0/8 criteria met",
    reviewComments: "Awaiting automated quality audit review...",
    originalContent: `# LESSON PLAN: Crop Production and Management

## A. LESSON HEADER [SQAA-sqaa-1.1]
- **Teacher**: Dr. Sarah Henderson
- **Class**: Class VIII (Section A)
- **Subject**: Science
- **Topic**: Chapter 1: Crop Production and Management
- **Duration**: 40 minutes

## B. CURRICULUM AND OUTCOME ALIGNMENT [SQAA-sqaa-1.1]
- **NCERT Learning Outcomes**: Explain agricultural practices, understand tilling, sowing, soil irrigation, and grain storage cycles.

## C. COMPREHENSIVE LEARNING OBJECTIVES
1. Identify standard soil preparation tools.
2. Differentiate between drip and sprinkler irrigation methodologies.

## D. PRIOR KNOWLEDGE & READINESS CHECK
- **Recap Activity**: Ask students where grains come from before they reach grocery vendors.
- **Oral Screening Question**: "Why is soil tilled?"

## E. NEP PEDAGOGY & EXPERIENTIAL LEARNING
- Active observation of germinating seeds in direct wet cotton trials.

## F. TIME-BOXED LESSON FLOW (40 MINUTES TOTAL)
- **1. Engage (5 mins)**: Show tilling tools and compare irrigated sprouts.
- **2. Explain (15 mins)**: Step by step lecture on sowing, fertilizers and harvest schedules.
- **3. Check (10 mins)**: Mini group observation.
- **4. Wrap up (10 mins)**: Exit question summary checks.

## H. DIFFERENTIATION & INCLUSIVE SUPPORT
- Remedial Support: None defined yet.
- Gifted Extensions: None defined yet.`
  },
  {
    id: "plan_02",
    teacherName: "Dr. Sarah Henderson",
    teacherEmail: "s.henderson@school.org",
    className: "Class XI",
    subjectName: "AP Chemistry",
    topicName: "Chapter 1: Atoms, Molecules, and Ions",
    importedAt: "2026-06-08T11:45:00Z",
    reviewStatus: "Non-Compliant",
    checklist: {
      outcomes: "pass",
      timeboxed: "fail",
      experiential: "fail",
      differentiation: "fail",
      homework: "pass",
      parental: "fail",
      sqaa: "fail",
      computational: "pass"
    },
    score: "3/8 criteria met",
    reviewComments: "Audit Flagged: The lesson plan lacks a clear detailed, time-boxed 40-minute pacing structure, has zero inclusive scaffolds or differentiation for advanced learners, does not define any home connection activities or WhatsApp communication drills with parents, and omits CBSE SQAA compliance indicators. AI recommends running targeted corrections.",
    originalContent: `# LESSON PLAN: Atoms, Molecules, and Ions

## A. LESSON HEADER [SQAA-sqaa-1.1]
- **Teacher**: Dr. Sarah Henderson
- **Class**: Class XI (Section A)
- **Subject**: AP Chemistry
- **Topic**: Chapter 1: Atoms, Molecules, and Ions
- **Duration**: 40 minutes

## B. CURRICULUM AND OUTCOME ALIGNMENT [SQAA-sqaa-1.1]
- **NCERT Learning Outcomes**: Differentiate isotope variations and calculate standard molecular mass ratios.

## C. COMPREHENSIVE LEARNING OBJECTIVES
1. Define atomic number vs mass number.
2. Compute relative isotopic abundancies.

## J. EXHAUSTIVE CONCEPT CHECK QUIZ (5 QUESTIONS)
1. What represents molecular isotopes?
2. Choose atomic charge properties.`
  },
  {
    id: "plan_03",
    teacherName: "Mr. Michael Vance",
    teacherEmail: "m.vance@school.org",
    className: "Class IX",
    subjectName: "Mathematics",
    topicName: "Chapter 1: Number Systems",
    importedAt: "2026-06-07T14:30:00Z",
    reviewStatus: "Pending Review",
    checklist: {
      outcomes: "pending",
      timeboxed: "pending",
      experiential: "pending",
      differentiation: "pending",
      homework: "pending",
      parental: "pending",
      sqaa: "pending",
      computational: "pending"
    },
    score: "0/8 criteria met",
    reviewComments: "Awaiting automated quality audit review...",
    originalContent: `# LESSON PLAN: Number Systems

## A. LESSON HEADER [SQAA-sqaa-1.1]
- **Teacher**: Mr. Michael Vance
- **Class**: Class IX (Section A)
- **Subject**: Mathematics
- **Topic**: Chapter 1: Number Systems
- **Duration**: 40 minutes

## B. CURRICULUM AND OUTCOME ALIGNMENT [SQAA-sqaa-1.1]
- **NCERT Learning Outcomes**: Group number types, understand irrational values, and learn fractional decimal expansions.

## C. COMPREHENSIVE LEARNING OBJECTIVES
1. Highlight real numbers and locate root root length on the lines.

## F. TIME-BOXED LESSON FLOW (40 MINUTES TOTAL)
- **1. Engage / Hook (5 mins)**: The paradox of root two length on grids.
- **2. Explain (20 mins)**: Proof of irrationalities.
- **3. Independent Practice (15 mins)**: Practice real conversion examples.`
  },
  {
    id: "plan_04",
    teacherName: "Ms. Emily Montgomery",
    teacherEmail: "e.montgomery@school.org",
    className: "Class X",
    subjectName: "English",
    topicName: "Chapter 1: A Letter to God",
    importedAt: "2026-06-06T10:00:00Z",
    reviewStatus: "Compliant",
    checklist: {
      outcomes: "pass",
      timeboxed: "pass",
      experiential: "pass",
      differentiation: "pass",
      homework: "pass",
      parental: "pass",
      sqaa: "pass",
      computational: "not_applicable"
    },
    score: "8/8 criteria met",
    reviewComments: "This classroom-generated English lesson plan meets all modern instructional quality requirements. Standard CBSE learning objectives mapped, time pacing is extremely granular, includes roleplays, incorporates bilingual vocabulary prompts for slow learners, and integrates a creative worksheet of home engagement prompts with parents. No corrective action needed.",
    originalContent: `# LESSON PLAN: A Letter to God

## A. LESSON HEADER [SQAA-sqaa-1.1]
- **Teacher**: Ms. Emily Montgomery
- **Class**: Class X (Section B)
- **Subject**: English
- **Topic**: Chapter 1: A Letter to God
- **Duration**: 40 minutes

## B. CURRICULUM AND OUTCOME ALIGNMENT [SQAA-sqaa-1.1]
- **NCERT Learning Outcomes**: Analyze character choices, explain irony, and write formal postoffice letters.

## C. COMPREHENSIVE LEARNING OBJECTIVES
1. Identify Lencho's firm faith and contrast with the community action.

## D. PRIOR KNOWLEDGE & READINESS CHECK
- Ask students: "What would you do if crops failed due to hail?"

## E. NEP PEDAGOGY & EXPERIENTIAL LEARNING [SQAA-sqaa-1.3]
- Roleplay as Lencho arriving at postal windows.

## F. TIME-BOXED LESSON FLOW (40 MINUTES TOTAL)
- **1. Engage (5 mins)**: Describe storm patterns and farmer challenges.
- **2. Explore (10 mins)**: Group letter draft reading sessions.
- **3. Explain (15 mins)**: Direct discussion of irony.
- **4. Wrap up (10 mins)**: Short response exit questions.

## H. DIFFERENTIATION & INCLUSIVE SUPPORT [SQAA-sqaa-1.2]
- Remedial Support: Bilingual vocabulary mapping.
- Gifted Extensions: Unpack ethical duality of help.

## J. EXHAUSTIVE CONCEPT CHECK QUIZ (5 QUESTIONS) [SQAA-sqaa-1.6]
1. Why did Lencho call postoffice counters 'crooks'?
2. Describe key ironies in the postmaster's help.

## K. RIGOROUS ASSIGNMENT TASKSET [SQAA-sqaa-1.6]
- Task details: Write a letter describing local compassionate behaviors.

## L. PARENT DISCUSSION PROMPTS [SQAA-sqaa-1.2]
- Guidance: Parental prompts to discuss faith and support.`
  }
];

// ----------------- Configurable QA Checklist Types & Engine -----------------
export interface ChecklistConfigItem {
  id: string;
  text: string;
  enabled: boolean;
}

export interface ChecklistConfig {
  [docType: string]: ChecklistConfigItem[];
}

export const INITIAL_QA_CHECKLISTS: ChecklistConfig = {
  "Lesson Plan": [
    { id: "lp_objectives", text: "Clear lesson objectives mapped to NCERT goals", enabled: true },
    { id: "lp_pacing", text: "Step-by-step 40-minute pacing structure (5E Flow)", enabled: true },
    { id: "lp_materials", text: "Required textbooks and supplementary materials catalog", enabled: true },
    { id: "lp_techniques", text: "Pedagogical techniques specified (experiential/art/sports/drama)", enabled: true }
  ],
  "Quiz": [
    { id: "qz_ncert", text: "NCERT-aligned diagnostic check questions", enabled: true },
    { id: "qz_cognitive", text: "Cognitive assessment questions mapped to Blooms taxonomy", enabled: true },
    { id: "qz_rubric", text: "Complete scoring rubric & answer key indicator", enabled: true }
  ],
  "Assignment / Worksheet": [
    { id: "as_structured", text: "Structured exercise sets & worksheets", enabled: true },
    { id: "as_practice", text: "Independent practice tasks", enabled: true },
    { id: "as_reflective", text: "Reflective and open-ended activities", enabled: true },
    { id: "as_learners", text: "Scaffolded support systems for standard/slow learners", enabled: true },
    { id: "as_gifted", text: "Enrichment & extension tasks for gifted learners", enabled: true }
  ],
  "Parent Communication": [
    { id: "pc_triggers", text: "Discussion triggers for active home dialogue", enabled: true },
    { id: "pc_whatsapp", text: "WhatsApp update text broadcaster draft template", enabled: true },
    { id: "pc_recoms", text: "Home exercise recommendations lists for parents", enabled: true }
  ],
  "Remediation & Enrichment": [
    { id: "re_slow", text: "Support structures for slow-paced learners", enabled: true },
    { id: "re_advanced", text: "Challenge opportunities for advanced/gifted learners", enabled: true }
  ],
  "SQAA Evidence Map": [
    { id: "sq_mapping", text: "Clear mapping to SQAA evidence indicator tags (e.g. sqaa-1.1)", enabled: true }
  ]
};

// Configurable Audit Engine
export const evaluatePlanChecklist = (content: string, checklists: ChecklistConfig) => {
  const results: Record<string, "pass" | "fail"> = {};
  if (!content) return results;
  const lower = content.toLowerCase();

  // Helper keyword matcher
  const hasKeywords = (phrases: string[]) => phrases.some(p => lower.includes(p.toLowerCase()));

  // 1. Lesson Plan checks
  if (checklists["Lesson Plan"]) {
    checklists["Lesson Plan"].forEach(item => {
      let passed = false;
      const id = item.id;
      if (id === "lp_objectives") {
        passed = hasKeywords(["learning outcome", "objective", "ncert learning outcomes", "## b.", "## c."]);
      } else if (id === "lp_pacing") {
        passed = hasKeywords(["40 minute", "duration", "time-boxed", "pacing", "5 mins", "15 mins", "10 mins", "## f."]);
      } else if (id === "lp_materials") {
        passed = hasKeywords(["material", "tool", "soil preparation", "book", "ncert"]);
      } else if (id === "lp_techniques") {
        passed = hasKeywords(["pedagog", "experiential", "roleplay", "art-integrated", "sports", "local context", "activity", "activities"]);
      } else {
        passed = lower.includes(item.text.toLowerCase().substring(0, 5));
      }
      results[id] = passed ? "pass" : "fail";
    });
  }

  // 2. Quiz checks
  if (checklists["Quiz"]) {
    checklists["Quiz"].forEach(item => {
      let passed = false;
      const id = item.id;
      if (id === "qz_ncert") {
        passed = hasKeywords(["quiz", "diagnostic", "question", "concept check", "## j."]);
      } else if (id === "qz_cognitive") {
        passed = hasKeywords(["cognitive", "assess", "question", "taxonomy", "bloop", "analysis", "## j."]);
      } else if (id === "qz_rubric") {
        passed = hasKeywords(["rubric", "score", "scoring", "answer key", "marking", "solution"]);
      } else {
        passed = lower.includes(item.text.toLowerCase().substring(0, 5));
      }
      results[id] = passed ? "pass" : "fail";
    });
  }

  // 3. Assignment / Worksheet checks
  if (checklists["Assignment / Worksheet"]) {
    checklists["Assignment / Worksheet"].forEach(item => {
      let passed = false;
      const id = item.id;
      if (id === "as_structured") {
        passed = hasKeywords(["assignment", "task", "worksheet", "exercise", "rigorous", "## k."]);
      } else if (id === "as_practice") {
        passed = hasKeywords(["practice", "independent", "homework", "task"]);
      } else if (id === "as_reflective") {
        passed = hasKeywords(["reflect", "reflective", "discuss", "parental discussion", "recommendation", "wrap"]);
      } else if (id === "as_learners") {
        passed = hasKeywords(["remedial", "moderate", "slow learner", "scaffold", "support", "bilingual", "## h."]);
      } else if (id === "as_gifted") {
        passed = hasKeywords(["gifted", "advanced", "enrichment", "extension", "challenge", "## h."]);
      } else {
        passed = lower.includes(item.text.toLowerCase().substring(0, 5));
      }
      results[id] = passed ? "pass" : "fail";
    });
  }

  // 4. Parent Communication checks
  if (checklists["Parent Communication"]) {
    checklists["Parent Communication"].forEach(item => {
      let passed = false;
      const id = item.id;
      if (id === "pc_triggers") {
        passed = hasKeywords(["parent", "home", "discuss", "trigger", "question", "## l."]);
      } else if (id === "pc_whatsapp") {
        passed = hasKeywords(["whatsapp", "broadcast", "message", "broadcaster", "update", "draft"]);
      } else if (id === "pc_recoms") {
        passed = hasKeywords(["exercise", "recommend", "home", "parental guidance", "activities for parent"]);
      } else {
        passed = lower.includes(item.text.toLowerCase().substring(0, 5));
      }
      results[id] = passed ? "pass" : "fail";
    });
  }

  // 5. Remediation & Enrichment checks
  if (checklists["Remediation & Enrichment"]) {
    checklists["Remediation & Enrichment"].forEach(item => {
      let passed = false;
      const id = item.id;
      if (id === "re_slow") {
        passed = hasKeywords(["remedial", "slow", "scaffold", "support", "bilingual", "## h."]);
      } else if (id === "re_advanced") {
        passed = hasKeywords(["gifted", "advanced", "challenge", "enrichment", "extension", "## h."]);
      } else {
        passed = lower.includes(item.text.toLowerCase().substring(0, 5));
      }
      results[id] = passed ? "pass" : "fail";
    });
  }

  // 6. SQAA Evidence Map checks
  if (checklists["SQAA Evidence Map"]) {
    checklists["SQAA Evidence Map"].forEach(item => {
      let passed = false;
      const id = item.id;
      if (id === "sq_mapping") {
        passed = hasKeywords(["sqaa-sqaa-", "sqaa-", "[sqaa-"]);
      } else {
        passed = lower.includes(item.text.toLowerCase().substring(0, 5));
      }
      results[id] = passed ? "pass" : "fail";
    });
  }

  return results;
};

const ALIGNED_CLASSROOM_PLANS: ClassroomLessonPlan[] = [
  {
    id: "plan_01",
    teacherName: "Ms. Emily Montgomery",
    teacherEmail: "e.montgomery@school.org",
    className: "Class X",
    subjectName: "English",
    topicName: "Chapter 1: A Letter to God",
    importedAt: "2026-06-08T09:12:00Z",
    reviewStatus: "Compliant",
    checklist: {
      outcomes: "pass",
      timeboxed: "pass",
      experiential: "pass",
      differentiation: "pass",
      homework: "pass",
      parental: "pass",
      sqaa: "pass",
      computational: "not_applicable"
    },
    score: "8/8 criteria met",
    reviewComments: "This classroom-generated English lesson plan meets all modern CBSE and School Quality Quality Assurance (SQAA) requirements. Core NCERT learning objectives are systematically time-boxed, active student roles are established, and inclusive scaffolds are clearly defined. No recommendations needed.",
    originalContent: `# CBSE LESSON PLAN: A LETTER TO GOD
## [SQAA-sqaa-1.1] Curriculum Alignment & Defined Learning Outcomes
- **Topic**: Chapter 1: A Letter to God (First Flight)
- **Target Class**: Class X-A
- **Time Allocated**: 40 Minutes (Strictly Time-boxed)
- **Learning Objectives**:
  1. Students will analyze the main theme of unwavering faith and human irony in the narrative.
  2. Students will identify and explain situational irony, psychological transitions, and symbolic elements.

## [SQAA-sqaa-1.2] Experiential Teaching Learning Processes (40-Min Pacing)
1. **Bridge Activity (5 Mins)**: Discuss weather dependencies and agrarian challenges, connecting to Lencho's rain expectations.
2. **Interactive Reading & Analysis (15 Mins)**: Unpack the letters, focusing on Socratic questioning of "faith moving mountains but breaking relations."
3. **Collaborative Roleplay [SQAA-sqaa-1.3]**: Roleplay as the postmaster weighing his choice to write back as "God" and discussing community helpfulness.
4. **Diagnostic Quiz (10 Mins)**: Formal assessment of situational irony.

## [SQAA-sqaa-1.6] Formative Assessment & Diagnostic Feedback
### NCERT Alignment Assessment Rules:
- **Diagnostic Quiz**:
  1. Question: Why is it ironic that Lencho calls the post office workers "crooks"? (Answer: Since they collected and contributed money themselves)
  2. Question: What does the postmaster's reaction reveal about his character? (Answer: Deep empathy, kindness, and respect for faith)

## [SQAA-sqaa-1.3] Student Homework & Structured Practice Tasks
- **Structured Homework**: Draft a 100-word reflective journal entry discussing the ethical dilemma faced by the postmaster.
- **Remedial Path [SQAA-sqaa-1.2]**: Formulate a timeline with 3 major narrative milestones.
- **Enrichment Path [SQAA-sqaa-1.3]**: Write a brief comparative essay on blind faith vs rational optimism.

## [SQAA-sqaa-1.5] Values and Parental Connection Bridge
- **Parental Engagement Topic**: Empathy, helping others anonymously, and mutual support. Ask parents to talk about times their community stood by them.
- **Communication Channel [SQAA-sqaa-1.1]**: Share homework logs and milestones to Class X-A WhatsApp parent broadcast lists.`,
    fileName: "lesson_plan.md",
    driveUrl: "https://drive.google.com/file/d/1Ch01SampleLessonPlanGradeX-English/view?usp=sharing"
  },
  {
    id: "plan_02",
    teacherName: "Ms. Emily Montgomery",
    teacherEmail: "e.montgomery@school.org",
    className: "Class X",
    subjectName: "English",
    topicName: "Chapter 2: Nelson Mandela: Long Walk to Freedom",
    importedAt: "2026-06-08T11:45:00Z",
    reviewStatus: "Pending Review",
    checklist: {
      outcomes: "pending",
      timeboxed: "pending",
      experiential: "pending",
      differentiation: "pending",
      homework: "pending",
      parental: "pending",
      sqaa: "pending",
      computational: "pending"
    },
    score: "0/8 criteria met",
    reviewComments: "Compliance verification pending. Standard outcome and indicators checks are active.",
    originalContent: `# CBSE LESSON PLAN: NELSON MANDELA: LONG WALK TO FREEDOM
## [SQAA-sqaa-1.1] Curriculum Alignment & Defined Learning Outcomes
- **Topic**: Chapter 2: Nelson Mandela: Long Walk to Freedom (First Flight)
- **Target Class**: Class X-A
- **Time Allocated**: 40 Minutes (Strictly Time-boxed)
- **Learning Objectives**:
  1. Analyze systemic prejudice, institutional liberty, and the true meaning of courage.
  2. Map key historical speeches to global human rights declarations by NCERT criteria.

## [SQAA-sqaa-1.2] Experiential Teaching Learning Processes (40-Min Pacing)
1. **Bridge Activity (5 Mins)**: Introduce the concept of a rainbow, translating it to a multicultural democratic constitution.
2. **Interactive Analysis (15 Mins)**: Study Mandela's Twin Obligations segment and his insights on "the oppressor and oppressed is alike robbed of humanity."
3. **Class Discussion (10 Mins)**: Group debate on individual freedom vs civic duties.
4. **Diagnostic Quiz (10 Mins)**: Quick review questions on historical perspectives.

## [SQAA-sqaa-1.6] Formative Assessment & Diagnostic Feedback
### NCERT Alignment Assessment Rules:
- **Diagnostic Quiz**:
  1. Question: What are the twin obligations described by Mandela? (Answer: Obligations to family/parents and obligations to people/community)
  2. Question: Contrast Mandela's definition of "courage" with fear. (Answer: Courage is not the absence of fear, but the triumph over it)

## [SQAA-sqaa-1.3] Student Homework & Structured Practice Tasks
- **Structured Homework**: Complete exercises mapping modern constitutional rights in India to Mandela's struggle.
- **Remedial Path [SQAA-sqaa-1.2]**: Memorize key definitions of freedom matching the NCERT glossary.
- **Enrichment Path [SQAA-sqaa-1.3]**: Draft a speech detailing modern human rights advocates globally.

## [SQAA-sqaa-1.5] Values and Parental Connection Bridge
- **Parental Engagement Topic**: Responsibility and family history. Encourage parents to share stories of historic struggles or civic duty milestones.
- **Communication Channel [SQAA-sqaa-1.1]**: Broadcast student quotes to Class X-A parental whatsapp list profiles.`,
    fileName: "lesson_plan.md",
    driveUrl: "https://drive.google.com/file/d/1Ch02NelsonMandelaLessonPlanGradeX-English/view?usp=sharing"
  },
  {
    id: "plan_03",
    teacherName: "Ms. Emily Montgomery",
    teacherEmail: "e.montgomery@school.org",
    className: "Class X",
    subjectName: "English",
    topicName: "Chapter 3: Two Stories about Flying",
    importedAt: "2026-06-07T14:30:00Z",
    reviewStatus: "Pending Review",
    checklist: {
      outcomes: "pending",
      timeboxed: "pending",
      experiential: "pending",
      differentiation: "pending",
      homework: "pending",
      parental: "pending",
      sqaa: "pending",
      computational: "pending"
    },
    score: "0/8 criteria met",
    reviewComments: "Compliance verification pending. Standard outcome and indicators checks are active.",
    originalContent: `# CBSE LESSON PLAN: TWO STORIES ABOUT FLYING
## [SQAA-sqaa-1.1] Curriculum Alignment & Defined Learning Outcomes
- **Topic**: Chapter 3: Two Stories about Flying (Part I: His First Flight)
- **Target Class**: Class X-A
- **Time Allocated**: 40 Minutes (Strictly Time-boxed) or time-boxed pacing
- **Learning Objectives**:
  1. Students will analyze the conflict between self-doubt and familial pressure.
  2. Evaluate the symbolic representation of flight as intellectual autonomy.

## [SQAA-sqaa-1.2] Experiential Teaching Learning Processes (45-Min Pacing)
- Discuss how animals teach self-survival techniques to their young.
- Classroom debate: Was the mother seagull cruel or compassionate?

## [SQAA-sqaa-1.6] Formative Assessment & Diagnostic Feedback
- **Diagnostic Quiz**:
  1. Question: What compelled the young seagull to take his first flight? (Answer: Hunger and the sight of food from his mother)
  2. Question: How did his family celebrate his successful landing? (Answer: Offering him scraps of dog-fish and screaming with praise)

## [SQAA-sqaa-1.3] Student Homework & Structured Practice Tasks
- Write a short story illustrating a moment you overcame fear.

*WARNING: Missing parental community bridges, remedial scaffolding plans, and formal whatsapp broadcast draft.*`,
    fileName: "lesson_plan.md",
    driveUrl: "https://drive.google.com/file/d/1Ch03StoriesAboutFlyingLessonPlanGradeX-English/view?usp=sharing"
  }
];

interface LessonPlannerProps {
  files: WorkspaceFile[];
  courses: ClassroomCourse[];
  currentUser: string;
  currentRole: string;
  onRefreshData?: () => void;
  setActiveTab?: (tab: string) => void;
}

export default function LessonPlanner({ 
  files, 
  courses, 
  currentUser, 
  currentRole,
  onRefreshData,
  setActiveTab
}: LessonPlannerProps) {

  // Navigation states
  const [activeView, setActiveView] = useState<"setup" | "editor" | "saved">("setup");

  // Classroom Registry states
  const [classroomPlans, setClassroomPlans] = useState<ClassroomLessonPlan[]>(() => {
    const saved = localStorage.getItem("edu_classroom_review_plans");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Force refresh if the saved registry contains old science crops lesson plans
        const hasOldData = parsed.some((p: any) => p.topicName && p.topicName.includes("Crop Production"));
        if (!hasOldData) {
          return parsed;
        }
      } catch (e) {
        console.warn("[DEBUG] Error checking cached lesson plans registry", e);
      }
    }
    return ALIGNED_CLASSROOM_PLANS;
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [qaRightTab, setQaRightTab] = useState<"audit" | "config">("audit");
  const [selectedConfigType, setSelectedConfigType] = useState<string>("Lesson Plan");
  const [newCriterionText, setNewCriterionText] = useState<string>("");
  const [syncingFromDrive, setSyncingFromDrive] = useState<boolean>(false);
  const [syncReport, setSyncReport] = useState<{ count: number; message: string } | null>(null);

  // Simulation warning and inline URL editing states
  const [showSimulatedDocWarning, setShowSimulatedDocWarning] = useState<boolean>(false);
  const [warningPlan, setWarningPlan] = useState<ClassroomLessonPlan | null>(null);
  const [editingUrlPlanId, setEditingUrlPlanId] = useState<string | null>(null);
  const [reportPlan, setReportPlan] = useState<any | null>(null);
  const [tempUrlValue, setTempUrlValue] = useState<string>("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Configurable File Discovery settings
  const [showDiscoveryRules, setShowDiscoveryRules] = useState<boolean>(false);
  const [discoveryConfig, setDiscoveryConfig] = useState<{
    pathPattern: string;
    nameContains: string;
    allowedExtensions: string[];
    defaultClass: string;
    defaultSubject: string;
  }>(() => {
    const saved = localStorage.getItem("edu_discovery_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("[DEBUG] Error parsing discovery config", e);
      }
    }
    return {
      pathPattern: "/Academic Repository/AY 2026-27/Secondary/{Class}/{Section}/{Subject}/02_Chapter_Resources",
      nameContains: "lesson, plan",
      allowedExtensions: [".md", ".pdf", ".doc", ".docx"],
      defaultClass: "Class X",
      defaultSubject: "English"
    };
  });

  const activePlan = classroomPlans.find(p => p.id === selectedPlanId);

  // Configurable QA Checklists state
  const [qaChecklists, setQaChecklists] = useState<ChecklistConfig>(() => {
    const saved = localStorage.getItem("edu_qa_checklists_config");
    return saved ? JSON.parse(saved) : INITIAL_QA_CHECKLISTS;
  });

  const handleUpdateChecklistItem = (docType: string, itemId: string, enabled: boolean) => {
    const updated = {
      ...qaChecklists,
      [docType]: qaChecklists[docType].map(item => item.id === itemId ? { ...item, enabled } : item)
    };
    setQaChecklists(updated);
    localStorage.setItem("edu_qa_checklists_config", JSON.stringify(updated));
  };

  const handleAddChecklistItem = (docType: string, text: string) => {
    if (!text.trim()) return;
    const newItem = { id: `custom_${Date.now()}`, text: text.trim(), enabled: true };
    const updated = {
      ...qaChecklists,
      [docType]: [...qaChecklists[docType], newItem]
    };
    setQaChecklists(updated);
    localStorage.setItem("edu_qa_checklists_config", JSON.stringify(updated));
  };

  const handleRemoveChecklistItem = (docType: string, itemId: string) => {
    const updated = {
      ...qaChecklists,
      [docType]: qaChecklists[docType].filter(item => item.id !== itemId)
    };
    setQaChecklists(updated);
    localStorage.setItem("edu_qa_checklists_config", JSON.stringify(updated));
  };

  // State to default select first plan for audit presentation on mount, or redirect from Textbook Ingestor
  useEffect(() => {
    const targetPlanId = localStorage.getItem("edu_active_lesson_planner_plan_id");
    const targetView = localStorage.getItem("edu_active_lesson_planner_view");
    
    if (targetPlanId && targetView === "editor" && classroomPlans.length > 0) {
      const matched = classroomPlans.find(p => p.id === targetPlanId || p.topicName === targetPlanId);
      if (matched) {
        setSelectedPlanId(matched.id);
        setSelectedClass(matched.className);
        setSelectedSubject(matched.subjectName);
        setSelectedTopic(matched.topicName);
        setEditorMarkdown(matched.originalContent);
        setGeneratedMarkdown(matched.originalContent);
        setDeckTab("outline");
        setActiveView("editor");
        setSaveSuccess(matched.reviewStatus === "Compliant");
        
        localStorage.removeItem("edu_active_lesson_planner_plan_id");
        localStorage.removeItem("edu_active_lesson_planner_view");
        return;
      }
    }

    if (classroomPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(classroomPlans[0].id);
    }
  }, [classroomPlans, selectedPlanId]);

  const getStatusLabelLocal = (plan: any, defectCount?: number) => {
    const status = plan.reviewStatus || "Pending Review";
    if (status === "Compliant" || status === "Approved" || status === "Approved with Recommendations") {
      return "Approved";
    }
    if (status === "Pending Review" || status === "Pending") {
      return "Pending";
    }
    if (defectCount !== undefined) {
      return `Defects (${defectCount})`;
    }
    if (plan.checklist) {
      const failsCount = Object.keys(plan.checklist).filter(k => plan.checklist[k] === "fail" || plan.checklist[k] === "failed").length;
      return `Defects (${failsCount || 1})`;
    }
    return "Defects (2)";
  };

  const handleDeletePlanLocal = (planId: string) => {
    const plan = classroomPlans.find(p => p.id === planId);
    if (!plan) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${plan.topicName}"?`);
    if (!confirmDelete) return;

    const filtered = classroomPlans.filter(p => p.id !== planId);
    savePlansToStorage(filtered);

    // Also persist deleted key so sync can also skip it if requested
    try {
      const key = `${plan.className}::${plan.subjectName}::${plan.topicName}`;
      const saved = localStorage.getItem("edu_classroom_deleted_plan_keys");
      const deletedKeys = saved ? JSON.parse(saved) : [];
      if (!deletedKeys.includes(key)) {
        deletedKeys.push(key);
        localStorage.setItem("edu_classroom_deleted_plan_keys", JSON.stringify(deletedKeys));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Helper to save plans in storage
  const savePlansToStorage = (updatedPlans: ClassroomLessonPlan[]) => {
    setClassroomPlans(updatedPlans);
    localStorage.setItem("edu_classroom_review_plans", JSON.stringify(updatedPlans));
  };

  const handleUpdateDriveUrl = (planId: string, newUrl: string) => {
    const updated = classroomPlans.map(p => p.id === planId ? { ...p, driveUrl: newUrl } : p);
    savePlansToStorage(updated);
  };

  const handleUpdateDiscoveryConfig = (key: string, value: any) => {
    const updated = { ...discoveryConfig, [key]: value };
    setDiscoveryConfig(updated);
    localStorage.setItem("edu_discovery_config", JSON.stringify(updated));
  };

  const handleDriveUrlClick = (e: React.MouseEvent, plan: ClassroomLessonPlan) => {
    if (plan.driveUrl && plan.driveUrl.includes("1Ch0")) {
      e.preventDefault();
      e.stopPropagation();
      setWarningPlan(plan);
      setTempUrlValue(plan.driveUrl);
      setShowSimulatedDocWarning(true);
    }
  };

  const handlePullLessonsFromDrive = () => {
    setSyncingFromDrive(true);
    setSyncReport(null);

    setTimeout(() => {
      // 1. Build a dynamic path parsing regex based on user-configured pattern path
      let pattern = discoveryConfig.pathPattern;
      let regexStr = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape special characters
        .replace(/\\\{Class\\\}/g, "(?<class>[^/]+)")
        .replace(/\\\{Section\\\}/g, "(?<section>[^/]+)")
        .replace(/\\\{Subject\\\}/g, "(?<subject>[^/]+)");
      
      let pathRegex: RegExp;
      try {
        pathRegex = new RegExp(regexStr, "i");
      } catch (err) {
        console.error("Invalid discovery path pattern regex, reverting to fallback matcher", err);
        pathRegex = /Academic Repository/i; // safe fallback
      }

      // 2. Perform discovery scan on all available workspace files
      const repoFiles = files.filter(f => {
        // Evaluate the path pattern matching
        const matchesPath = pathRegex.test(f.path);
        if (!matchesPath) return false;

        // Verify the file's extension against allowed discovery extensions
        const lowercaseName = f.name.toLowerCase();
        const matchesExtension = discoveryConfig.allowedExtensions.some(ext => 
          lowercaseName.endsWith(ext.toLowerCase())
        );
        if (!matchesExtension) return false;

        // Verify file name contains constraints if set
        if (discoveryConfig.nameContains.trim()) {
          const keywords = discoveryConfig.nameContains
            .toLowerCase()
            .split(",")
            .map(k => k.trim())
            .filter(Boolean);
          if (keywords.length > 0) {
            const matchesKeyword = keywords.some(kw => lowercaseName.includes(kw));
            if (!matchesKeyword) return false;
          }
        }

        return true;
      });

      if (repoFiles.length === 0) {
        setSyncReport({
          count: 0,
          message: `No files found on Drive matching path pattern "${discoveryConfig.pathPattern}", keyword filters "${discoveryConfig.nameContains}", or extensions (${discoveryConfig.allowedExtensions.join(", ")}).`
        });
        setSyncingFromDrive(false);
        return;
      }

      // 3. Auto-classify and index into Lesson Plan Registry
      let addedCount = 0;
      const currentPlans = [...classroomPlans];

      repoFiles.forEach(file => {
        const finalId = `plan_drive_${file.id}`;
        
        // Match existing entry to prevent duplicates
        const alreadyExists = currentPlans.some(p => p.id === finalId || p.originalContent.includes(file.path));
        if (!alreadyExists) {
          // Dynamic metadata parsing
          let fileClass = discoveryConfig.defaultClass;
          let fileSubject = discoveryConfig.defaultSubject;

          const match = file.path.match(pathRegex);
          if (match && match.groups) {
            if (match.groups.class) {
              fileClass = decodeURIComponent(match.groups.class).replace(/_/g, " ").trim();
            }
            if (match.groups.subject) {
              fileSubject = decodeURIComponent(match.groups.subject).replace(/_/g, " ").trim();
            }
          }

          // Generate friendly Topic / Chapter names
          let topicName = file.name;
          const segments = file.path.split("/");
          const lastSegment = segments[segments.length - 1];
          if (lastSegment && (lastSegment.toLowerCase().includes("ch0") || lastSegment.toLowerCase().includes("chapter"))) {
            const friendlyFolder = lastSegment.replace(/_/g, " ").trim();
            if (friendlyFolder === "Ch01 Sample Chapter" || friendlyFolder.toLowerCase().includes("ch01")) {
              topicName = "Chapter 1: A Letter to God";
            } else if (friendlyFolder === "Ch02 Nelson Mandela" || friendlyFolder.toLowerCase().includes("ch02")) {
              topicName = "Chapter 2: Nelson Mandela: Long Walk to Freedom";
            } else if (friendlyFolder === "Ch03 Stories About Flying" || friendlyFolder.toLowerCase().includes("ch03")) {
              topicName = "Chapter 3: Two Stories about Flying";
            } else {
              topicName = `${friendlyFolder}: ${file.name}`;
            }
          } else {
            // strip file extension for clean title
            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            topicName = nameWithoutExt.replace(/_/g, " ").replace(/-/g, " ");
          }

          // Build dynamic mock content tailored to discovered file details
          const cleanTopicLabel = topicName.replace(/Chapter \d+:\s*/i, "");
          const originalContentMarkdown = `# CBSE LESSON PLAN: ${topicName.toUpperCase()}
## [SQAA-sqaa-1.1] Curriculum Alignment & Defined Learning Outcomes
- **Topic**: ${topicName} (Scanned Resource)
- **Target Class**: ${fileClass} (Academic Sync)
- **Subject**: ${fileSubject}
- **Learning Objectives**:
  1. Students will define and analyze core concepts of ${cleanTopicLabel} with high comprehension.
  2. Students will identify key questions, frameworks, and values presented in the syllabus unit.

## [SQAA-sqaa-1.2] Experiential Teaching Learning Processes (40-Min Pacing)
1. **Prior Connection Warmup (5 Mins)**: Address past experiences and bridge schemas.
2. **Directed Study & Close Analysis (15 Mins)**: Study and summarize text/concept milestones.
3. **Applied Group Workshop (10 Mins)**: Collaborative evaluation and diagnostic application.
4. **Diagnostic Exit Ticket (10 Mins)**: Fast questions establishing mastery metrics.

## [SQAA-sqaa-1.6] Formative Assessment & Diagnostic Feedback
### CBSE SQAA Aligned Evaluation Draft:
- **Diagnostic Quiz**:
  1. What is the fundamental inquiry of this chapter "${cleanTopicLabel}"?
  2. Map out one remedial learning checklist item.

## [SQAA-sqaa-1.3] Student Homework & Structured Practice Tasks
- **Structured Homework**: Develop a reflective paragraph connecting themes of '${cleanTopicLabel}' to standard guidelines.
- **Remedial Scaffolding**: Create a simple 3 points flowchart mapping key vocabulary.

## [SQAA-sqaa-1.5] Values and Parental Connection Bridge
- **Parental Engagement**: Have parents confirm worksheet completion and discuss real-world civic duty milestones.
- **WhatsApp Channel Draft**: Share students' lesson logs with parents network.`;

          currentPlans.push({
            id: finalId,
            teacherName: "Elaine Montgomery",
            teacherEmail: "e.montgomery@school.org",
            className: fileClass,
            subjectName: fileSubject,
            topicName: topicName,
            importedAt: new Date().toISOString(),
            reviewStatus: "Pending Review",
            checklist: {
              outcomes: "pending",
              timeboxed: "pending",
              experiential: "pending",
              differentiation: "pending",
              homework: "pending",
              parental: "pending",
              sqaa: "pending",
              computational: "pending"
            },
            score: "0/8 criteria met",
            reviewComments: `Discovered and indexed via Academic Repository. Located path: "${file.path}/${file.name}". Click "Run QA Compliance Audit" to run CBSE SQAA validations.`,
            originalContent: originalContentMarkdown,
            fileName: file.name,
            driveUrl: file.webViewLink || `https://drive.google.com/open?id=${file.id}`
          });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        savePlansToStorage(currentPlans);
        setSyncReport({
          count: addedCount,
          message: `Successfully sync'd ${addedCount} discovered lessons matching pattern "${discoveryConfig.pathPattern}". Matched folders were successfully indexed to corresponding Classes & Subjects!`
        });
      } else {
        setSyncReport({
          count: 0,
          message: "No new files to index. All matching files in the Academic Repository path are already imported into your Lesson Plan Registry."
        });
      }
      setSyncingFromDrive(false);
    }, 1200);
  };

  // Trigger dynamic compliance audit engine
  const handleTriggerAudit = (planId: string) => {
    setIsReviewing(true);
    setReviewError("");
    
    setTimeout(() => {
      const plan = classroomPlans.find(p => p.id === planId);
      if (!plan) {
        setIsReviewing(false);
        return;
      }

      // Run keyword validation
      const audit = evaluatePlanChecklist(plan.originalContent, qaChecklists);
      
      // Calculate enabled checks and passed counts
      let totalEnabled = 0;
      let totalPassed = 0;
      
      Object.keys(qaChecklists).forEach(category => {
        qaChecklists[category].forEach(item => {
          if (item.enabled) {
            totalEnabled++;
            if (audit[item.id] === "pass") {
              totalPassed++;
            }
          }
        });
      });

      const scoreStr = `${totalPassed}/${totalEnabled}`;
      const isPerfect = totalPassed === totalEnabled;
      const status: "Compliant" | "Non-Compliant" | "Approved with Recommendations" = 
        isPerfect ? "Compliant" : (totalPassed >= totalEnabled * 0.7 ? "Approved with Recommendations" : "Non-Compliant");

      const updatedPlans = classroomPlans.map(p => {
        if (p.id === planId) {
          // Sync modern checklist dot mapping
          const newDottedChecklist = {
            outcomes: audit["lp_objectives"] || "fail",
            timeboxed: audit["lp_pacing"] || "fail",
            experiential: audit["lp_techniques"] || "fail",
            differentiation: (audit["re_slow"] === "pass" || audit["re_advanced"] === "pass") ? "pass" : "fail",
            homework: (audit["as_structured"] === "pass" || audit["as_practice"] === "pass") ? "pass" : "fail",
            parental: (audit["pc_triggers"] === "pass" || audit["pc_whatsapp"] === "pass") ? "pass" : "fail",
            sqaa: audit["sq_mapping"] || "fail"
          } as typeof plan.checklist;

          return {
            ...p,
            reviewStatus: status,
            score: scoreStr,
            checklist: newDottedChecklist,
            reviewComments: isPerfect 
              ? "Draft analyzed successfully. Zero non-conformance flags identified." 
              : `Reviewed with ${totalEnabled - totalPassed} Defect${totalEnabled - totalPassed === 1 ? "" : "s"}. Missing elements detected in document template.`
          };
        }
        return p;
      });

      savePlansToStorage(updatedPlans);
      setIsReviewing(false);
    }, 1000);
  };

  // Selection states
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [coverMode, setCoverMode] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    "CBSE Standard Approved School Template (CBSE/NCERT/SQAA)"
  );
  const [customFocus, setCustomFocus] = useState<string>(
    localStorage.getItem("theme_lesson_plan_custom_focus_pref") || ""
  );
  const [selectedSqaaIndicators, setSelectedSqaaIndicators] = useState<string[]>([
    "sqaa-1.1",
    "sqaa-1.2",
    "sqaa-1.3",
    "sqaa-1.5",
    "sqaa-1.6"
  ]);

  // Table of Contents dynamic uploader states
  const [customParsedChapters, setCustomParsedChapters] = useState<Record<string, { id: string; name: string; isComputationalThinkingFriendly?: boolean }[]>>({});
  const [isUploadingToc, setIsUploadingToc] = useState<boolean>(false);
  const [uploadTocError, setUploadTocError] = useState<string>("");
  const [uploadTocSuccess, setUploadTocSuccess] = useState<string>("");

  // Tabs for the single-page material planner (Interactive Lesson Deck)
  const [deckTab, setDeckTab] = useState<"outline" | "slides" | "quiz" | "assignments" | "parental" | "audit" | "raw" | "sqaa_links">("outline");
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);

  // Search Results inside Drive
  const [matchedFiles, setMatchedFiles] = useState<WorkspaceFile[]>([]);
  const [searchTriggered, setSearchTriggered] = useState<boolean>(false);
  const [existingOptionSelected, setExistingOptionSelected] = useState<string | null>(null);

  // Lesson Plan editor content
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string>("");
  const [editorMarkdown, setEditorMarkdown] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string>("");

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // History state lookup
  const [localSavedPlans, setLocalSavedPlans] = useState<WorkspaceFile[]>([]);

  // Interactive UI configurations
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicValue, setEditingTopicValue] = useState<string>("");
  const [newTopicValue, setNewTopicValue] = useState<string>("");
  const [showAddTopicInput, setShowAddTopicInput] = useState<boolean>(false);

  // Interactive Topic Editing Handlers
  const handleUpdateTopicName = (topicId: string, newName: string) => {
    if (!newName.trim()) return;
    const customKey = `${selectedClass}_${selectedSubject}`;
    const staticMatch = CURRICULUM_SETUP.find(
      c => c.className === selectedClass && c.subjectName === selectedSubject
    );
    const currentTopics = customParsedChapters[customKey] || (staticMatch ? [...staticMatch.topics] : []);
    
    const updated = currentTopics.map(t => t.id === topicId ? { ...t, name: newName } : t);
    setCustomParsedChapters(prev => ({
      ...prev,
      [customKey]: updated
    }));
    
    // Update active selections if matching the modified name
    const oldTopic = currentTopics.find(t => t.id === topicId);
    if (oldTopic && selectedTopic === oldTopic.name) {
      setSelectedTopic(newName);
    }
    setEditingTopicId(null);
  };

  const handleAddCustomTopic = (name: string) => {
    if (!name.trim()) return;
    const customKey = `${selectedClass}_${selectedSubject}`;
    const staticMatch = CURRICULUM_SETUP.find(
      c => c.className === selectedClass && c.subjectName === selectedSubject
    );
    const currentTopics = customParsedChapters[customKey] || (staticMatch ? [...staticMatch.topics] : []);
    
    const newTopic = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      isComputationalThinkingFriendly: false
    };
    
    setCustomParsedChapters(prev => ({
      ...prev,
      [customKey]: [...currentTopics, newTopic]
    }));
    setSelectedTopic(newTopic.name);
    setNewTopicValue("");
    setShowAddTopicInput(false);
  };

  const handleRemoveTopic = (topicId: string) => {
    const customKey = `${selectedClass}_${selectedSubject}`;
    const staticMatch = CURRICULUM_SETUP.find(
      c => c.className === selectedClass && c.subjectName === selectedSubject
    );
    const currentTopics = customParsedChapters[customKey] || (staticMatch ? [...staticMatch.topics] : []);
    
    const updated = currentTopics.filter(t => t.id !== topicId);
    setCustomParsedChapters(prev => ({
      ...prev,
      [customKey]: updated
    }));
    
    if (updated.length > 0) {
      setSelectedTopic(updated[0].name);
    } else {
      setSelectedTopic("");
    }
  };

  // Automatically compute selected curriculum book based on class & subject
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      const match = CURRICULUM_SETUP.find(
        c => c.className === selectedClass && c.subjectName === selectedSubject
      );
      if (match) {
        setSelectedBook(match.book);
        
        const customKey = `${selectedClass}_${selectedSubject}`;
        const customTopics = customParsedChapters[customKey] || [];
        const mergedTopics = [...match.topics, ...customTopics];

        if (mergedTopics.length > 0 && !selectedTopic) {
          setSelectedTopic(mergedTopics[0].name);
        }
      } else {
        setSelectedBook("");
        setSelectedTopic("");
      }
    } else {
      setSelectedBook("");
      setSelectedTopic("");
    }
  }, [selectedClass, selectedSubject, customParsedChapters]);

  // Reset saveSuccess status when curriculum selection or configuration values change
  useEffect(() => {
    setSaveSuccess(false);
  }, [selectedClass, selectedSubject, selectedTopic, selectedTemplate, coverMode]);

  // Classroom Slides Presentation Stopwatch
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Determine user allocations and restrictions based on Roles
  const isTeacherRole = currentRole === "Teacher" || currentRole === "Vice Principal";
  const allocation = TEACHER_ALLOCATIONS[currentUser];

  const availableClasses = isTeacherRole && allocation && !coverMode
    ? allocation.classes
    : CURRICULUM_SETUP.map(c => c.className).filter((v, i, a) => a.indexOf(v) === i);

  const availableSubjects = isTeacherRole && allocation && !coverMode
    ? allocation.subjects
    : selectedClass
      ? CURRICULUM_SETUP.filter(c => c.className === selectedClass).map(c => c.subjectName)
      : [];

  const activeCurriculum = CURRICULUM_SETUP.find(
    c => c.className === selectedClass && c.subjectName === selectedSubject
  );

  // Compute merged textbook chapters lists
  const customKey = `${selectedClass}_${selectedSubject}`;
  const customTopicsList = customParsedChapters[customKey] || [];
  const mergedActiveTopicsList = activeCurriculum 
    ? [...activeCurriculum.topics, ...customTopicsList] 
    : [...customTopicsList];

  const hasNoAllocation = isTeacherRole && !coverMode && (!allocation || allocation.classes.length === 0);

  // Synchronized Drive Sweeper for syllabus duplication
  const handleSearchExistingPlans = () => {
    if (!selectedClass || !selectedSubject) return;
    
    setSearchTriggered(true);
    // Find files matching selected class/subject inside user Drive or global Workspace
    const matched = files.filter(file => {
      const nameLower = file.name.toLowerCase();
      const clsMatch = selectedClass.toLowerCase().replace(/\s+/g, "");
      const subMatch = selectedSubject.toLowerCase();
      
      return (
        file.source === "Drive" &&
        nameLower.includes("lesson") &&
        nameLower.includes(clsMatch) &&
        nameLower.includes(subMatch)
      );
    });

    setMatchedFiles(matched);
    setExistingOptionSelected(null);
  };

  // Run on selection change to auto-scan drive
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTopic) {
      handleSearchExistingPlans();
    } else {
      setSearchTriggered(false);
      setMatchedFiles([]);
    }
  }, [selectedClass, selectedSubject, selectedTopic, coverMode]);

  // AI Adapt logic
  const handleAdaptExistingPlan = async (sourceFile: WorkspaceFile) => {
    setIsGenerating(true);
    setGenerationError("");
    setActiveView("editor");

    try {
      const res = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantType: "education",
          prompt: `Adapt this existing school lesson document summary: "${sourceFile.name} | ${sourceFile.contentSum}" for my target class "${selectedClass}" and subject "${selectedSubject}" using chapter "${selectedTopic}". Ensure it matches standard CBSE rubrics, has measurable learning objectives, a clear time-boxed 40-minute teaching path, addresses these custom focus needs: "${customFocus || "standard alignment"}", and explicitly addresses and tags coverage of these selected school SQAA indicator requirements: ${selectedSqaaIndicators.join(", ")} (e.g., place [SQAA-sqaa-1.1], [SQAA-sqaa-1.2], etc. directly inside the relevant headings). Provide the complete robust adapted lesson plan in Markdown.`,
          user: currentUser,
          role: currentRole
        })
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setGeneratedMarkdown(data.text);
        setEditorMarkdown(data.text);
      } else {
        throw new Error(data.error || "Failed to adapt lesson plan.");
      }
    } catch (err: any) {
      setGenerationError(err.message || "Unable to reach Gemini adaptive synthesis pipeline.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload Table of Contents image and parse chapters/topics
  const handleUploadAndParseToc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedClass || !selectedSubject) {
      setUploadTocError("Please select Class and Subject first so the chapters can be mapped correctly.");
      return;
    }

    setIsUploadingToc(true);
    setUploadTocError("");
    setUploadTocSuccess("");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const userKey = localStorage.getItem("workspace_custom_key_preference") || "";
        const res = await fetch("/api/curriculum/parse-toc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64String,
            mimeType: file.type,
            userKey: userKey
          })
        });

        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.topics)) {
          const customKey = `${selectedClass}_${selectedSubject}`;
          
          setCustomParsedChapters(prev => ({
            ...prev,
            [customKey]: data.topics
          }));

          setUploadTocSuccess(`Successfully extracted ${data.topics.length} chapters/topics from the Table of Contents image!`);
          
          if (data.topics.length > 0) {
            setSelectedTopic(data.topics[0].name);
          }
        } else {
          throw new Error(data.error || "Could not successfully extract topics from the image. Please make sure the table of contents is clearly visible.");
        }
      } catch (err: any) {
        console.error(err);
        setUploadTocError(err.message || "Failed parsing textbook image. Please try again with a clear photo/screenshot.");
      } finally {
        setIsUploadingToc(false);
      }
    };

    reader.onerror = () => {
      setUploadTocError("Failed reading file. Please pick another image format.");
      setIsUploadingToc(false);
    };

    reader.readAsDataURL(file);
  };

  // Generate completely new plan
  const handleGenerateNewPlan = async () => {
    if (!selectedClass || !selectedSubject || !selectedTopic) {
      setGenerationError("Please complete critical fields first.");
      return;
    }

    setIsGenerating(true);
    setGenerationError("");
    setActiveView("editor");
    setIsEditing(false);
    setDeckTab("outline"); // Reset tab to first view
    setSlideIndex(0); // Reset interactive slides index

    try {
      const res = await fetch("/api/gemini/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: selectedClass,
          subjectName: selectedSubject,
          bookName: selectedBook,
          topicName: selectedTopic,
          templateType: selectedTemplate,
          coverMode: coverMode,
          userGuidelines: customFocus,
          selectedSqaaIndicators: selectedSqaaIndicators,
          teacherName: currentUser === "s.henderson@school.org" ? "Dr. Sarah Henderson" : `Tutor [ID: ${currentUser}]`,
          user: currentUser,
          role: currentRole
        })
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setGeneratedMarkdown(data.text);
        setEditorMarkdown(data.text);
      } else {
        throw new Error(data.error || "Encountered server processing error.");
      }
    } catch (err: any) {
      setGenerationError(err.message || "Failed generating lesson outline. Please audit your workspace parameters.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Clone and Edit logic
  const handleCloneExistingPlan = (sourceFile: WorkspaceFile) => {
    setGeneratedMarkdown(`# CLONED AND READY: ${sourceFile.name}\n\nThis is a local editable copy of your drive pacing file: ${sourceFile.name}.\n\n### Original Abstract Summary:\n${sourceFile.contentSum}\n\n---\n\n## Custom Lesson Plan Modifications go here...\n- Refocusing delivery targets for: ${selectedClass} Section A\n- Guided topic completion schedules completed.`);
    setEditorMarkdown(`# CLONED AND READY: ${sourceFile.name}\n\nThis is a local editable copy of your drive pacing file: ${sourceFile.name}.\n\n### Original Abstract Summary:\n${sourceFile.contentSum}\n\n---\n\n## Custom Lesson Plan Modifications go here...\n- Refocusing delivery targets for: ${selectedClass} Section A\n- Guided topic completion schedules completed.`);
    setActiveView("editor");
    setIsEditing(true);
  };

  // Save to drive function
  const handleSaveToDrive = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const safeFileName = `AY2026_27_${selectedClass.replace(/\s+/g, "_")}_${selectedSubject.replace(/\s+/g, "_")}_Chapter_${selectedTopic.replace(/[^a-zA-Z0-9]/g, "_")}_Lesson_Plan_v1.md`;
    const folderPath = `/Google Drive/My Drive/Academic Year 2026-27/${selectedClass}/${selectedSubject}/Lesson Plans`;

    try {
      // Register with Drive files backend
      const res = await fetch("/api/workspace/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: safeFileName,
          type: "doc",
          source: "Drive",
          path: folderPath,
          owner: currentUser,
          sharingRule: coverMode ? "Department Only" : "Domain Shared",
          size: `${Math.ceil((editorMarkdown.length / 1024) * 1.5) || 12} KB`,
          contentSum: `Structured NEP-aligned Lesson plan for ${selectedClass} ${selectedSubject} - ${selectedTopic}. Template used: ${selectedTemplate}. Covers NCERT and SQAA validations.`,
          tags: coverMode ? ["Lesson Plan", "Cover Period", "CBSE"] : ["Lesson Plan", "Syllabus", "CBSE"],
          user: currentUser,
          role: currentRole
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        if (onRefreshData) {
          onRefreshData(); // Refresh list immediately
        }
        // Save to temporary local history state too
        const returned = await res.json();
        if (returned.file) {
          setLocalSavedPlans(prev => [returned.file, ...prev]);
        }
        // Write dynamic audit log trigger
        fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: currentUser,
            role: currentRole,
            action: "Lesson Plan Published",
            detail: `Saved '${safeFileName}' to connected Drive directory`,
            category: "automation",
            success: true
          })
        });
      } else {
        throw new Error("Could not integrated file write on Drive container.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving lesson plan to Workspace server.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper compiler to output beautiful formatted layouts without third party dependency risks
  const renderSimpleMarkdown = (text: string, options?: { skipTitle?: boolean }) => {
    if (!text) return null;
    const lines = text.split("\n");
    let hasSkippedFirstTitle = false;

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Headings
      if (trimmed.startsWith("# ")) {
        if (options?.skipTitle && !hasSkippedFirstTitle) {
          hasSkippedFirstTitle = true;
          return null;
        }
        const cleaned = trimmed.substring(2).replace(/\[SQAA-[\w.-]+\]/gi, "").trim();
        return (
          <h1 key={idx} className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2.5 mt-6 mb-4 font-sans tracking-tight">
            {cleaned}
          </h1>
        );
      }
      if (trimmed.startsWith("## ")) {
        const cleaned = trimmed.substring(3).replace(/\[SQAA-[\w.-]+\]/gi, "").trim();
        return (
          <h2 key={idx} className="text-base font-bold text-blue-700 bg-blue-50/60 border-l-4 border-blue-600 pl-3 py-1.5 mt-6 mb-3 rounded-r-lg font-sans">
            {cleaned}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        const cleaned = trimmed.substring(4).replace(/\[SQAA-[\w.-]+\]/gi, "").trim();
        return (
          <h3 key={idx} className="text-sm font-bold text-slate-700 mt-5 mb-2 font-sans tracking-tight">
            {cleaned}
          </h3>
        );
      }

      // Checkboxes / checklists
      if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]")) {
        const checked = trimmed.startsWith("- [x]");
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1.5 ml-1">
            <input type="checkbox" checked={checked} readOnly className="mt-1 rounded text-blue-600 focus:ring-blue-500 font-mono" />
            <span className={`text-xs text-slate-600 ${checked ? 'line-through text-slate-400' : ''}`}>
              {trimmed.substring(6)}
            </span>
          </div>
        );
      }

      // Bullet List item
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.substring(2);
        return (
          <li key={idx} className="text-xs text-slate-600 ml-4 list-disc space-y-1 my-1 leading-relaxed">
            {content.split("**").map((chunk, cIdx) => 
              cIdx % 2 === 1 ? <strong key={cIdx} className="font-bold text-slate-800">{chunk}</strong> : chunk
            )}
          </li>
        );
      }

      // Horizontal dividers
      if (trimmed === "---") {
        return <hr key={idx} className="border-t border-slate-200 my-5" />;
      }

      // Bold-line formatting blocks
      if (trimmed.startsWith("- **")) {
        return (
          <div key={idx} className="my-2 ml-2 text-xs text-slate-600 leading-relaxed">
            {trimmed.split("**").map((chunk, cIdx) => 
              cIdx % 2 === 1 ? <strong key={cIdx} className="font-semibold text-slate-800">{chunk}</strong> : chunk
            )}
          </div>
        );
      }

      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Default paragraph texts with selective inline bolds
      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed my-1.5">
          {trimmed.split("**").map((chunk, cIdx) => 
            cIdx % 2 === 1 ? <strong key={cIdx} className="font-bold text-slate-800">{chunk}</strong> : chunk
          )}
        </p>
      );
    });
  };

  // Segment partitioning helper for the Interactive Material Suite tabs
  const fullContent = editorMarkdown;
  
  // 1. Integrated Plan Outline Section
  let planOutline = fullContent;
  const quizMarkerIdx = fullContent.indexOf("## J. EXHAUSTIVE CONCEPT CHECK QUIZ");
  if (quizMarkerIdx !== -1) {
    planOutline = fullContent.substring(0, quizMarkerIdx);
  }

  // Extract utility parsing engine
  function extractSection(content: string, startHeader: string, nextHeaders: string[]): string {
    const startIdx = content.indexOf(startHeader);
    if (startIdx === -1) return "";
    let endIdx = content.length;
    
    for (const h of nextHeaders) {
      const idx = content.indexOf(h, startIdx + startHeader.length);
      if (idx !== -1 && idx < endIdx) {
        endIdx = idx;
      }
    }
    return content.substring(startIdx, endIdx);
  }

  // 2. Classroom Presentation Slides data
  const timeBoxedFlowText = extractSection(fullContent, "## F. TIME-BOXED LESSON FLOW", [
    "## G. COMPUTATIONAL THINKING",
    "## H. DIFFERENTIATION",
    "## I. FORMATIVE ASSESSMENT",
    "## J. EXHAUSTIVE CONCEPT CHECK QUIZ"
  ]);

  const slideDeckData: { title: string; content: string; duration: string; tips: string }[] = [];
  if (timeBoxedFlowText) {
    const matches = timeBoxedFlowText.split("\n")
      .map(line => line.trim())
      .filter(line => line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s*/.test(line));

    matches.forEach((step, stepId) => {
      const cleaned = step.replace(/^[-*\d.\s]+/, "");
      let stepTitle = `Phase ${stepId + 1}: Classroom Activity`;
      let stepDuration = "10 mins";
      
      const minMatch = cleaned.match(/\((\d+)\s*mins?\)/i) || cleaned.match(/(\d+)\s*mins?/i);
      if (minMatch) {
         stepDuration = `${minMatch[1]} mins`;
      }

      slideDeckData.push({
        title: stepTitle,
        content: cleaned,
        duration: stepDuration,
        tips: "Keep student active engagement high. Prompt analytical questioning and gather real-time student feedback."
      });
    });
  }

  // Fallback slides if generation is blank
  if (slideDeckData.length === 0) {
    slideDeckData.push(
      { title: "Slide 1: Spark Curiosity", content: `Connect ${selectedTopic || "this topic"} to familiar life properties. Challenge students with a simple real-world enigma or observational prompt.`, duration: "5 mins", tips: "Avoid diving directly into formulas. Guide intuitive formulations first." },
      { title: "Slide 2: Active Investigation & Querying", content: `Hands-on inquiry and joint formulating of core properties relating to ${selectedTopic || "this topic"}.`, duration: "10 mins", tips: "Ask open questions: 'What happens if we alter this variable?' Let them write observations." },
      { title: "Slide 3: Guided Synthesis & Standard Focus", content: "Synthesize central rules or principles. Work through classic NCERT examples step-by-step.", duration: "10 mins", tips: "Verify understanding. Provide visual cues, outlines, or diagrams on the active whiteboard." },
      { title: "Slide 4: Adaptive Peer Exercises", content: "Empower students to solve scaffolded peer challenges or complete self-directed worksheet steps in small groups.", duration: "10 mins", tips: "Facilitate support circles. Remediate with customized hints, push with advanced twists." },
      { title: "Slide 5: Exit Slip & Wrap-Up", content: `Complete a simple exit slip task to verify benchmark objectives of ${selectedTopic || "this topic"}.`, duration: "5 mins", tips: "Collect student checks. Identify any lingering learning roadblocks." }
    );
  }

  // 3. Concept Quiz Tab extracts
  const quizHeader = "## J. EXHAUSTIVE CONCEPT CHECK QUIZ";
  const assignmentHeader = "## K. RIGOROUS ASSIGNMENT TASKSET";
  const parentHeader = "## L. PARENT DISCUSSION PROMPTS";
  const postDeliveryHeader = "## M. TEACHER POST-DELIVERY";

  let quizContent = extractSection(fullContent, quizHeader, [assignmentHeader, parentHeader, postDeliveryHeader]);
  if (!quizContent) {
    quizContent = "### Concept Quiz\nNo explicit quiz section was discovered in the lesson plan yet. Initiate generation to formulate comprehensive concept checks.";
  }

  const handleCopyQuiz = () => {
    navigator.clipboard.writeText(quizContent);
    alert("Quiz successfully copied to clipboard!");
  };

  // 4. Assignments Tab extracts
  let assignmentContent = extractSection(fullContent, assignmentHeader, [parentHeader, postDeliveryHeader]);
  if (!assignmentContent) {
    assignmentContent = "### Standard & Advanced Assignment Sets\nNo assignment taskset discovered yet. CBSE standard homework sets are appended on full model generation.";
  }

  const handleCopyAssignments = () => {
    navigator.clipboard.writeText(assignmentContent);
    alert("Assignments copied to clipboard!");
  };

  // 5. Parental Communication Bridge Tab extracts
  let parentalContent = extractSection(fullContent, parentHeader, [postDeliveryHeader]);
  const parentWhatsAppTemplate = `*Dear Parents,* 😊 \n\nWe completed an exciting lesson on *${selectedTopic || "our curriculum topic"}* inside class today! \n\nTo bridge classroom learning with home conversation, here are a few fun prompts to discuss with your child:\n${parentalContent ? parentalContent.substring(0, 400).replace(/##\s+/g, "").replace(/###\s+/g, "") : "• What was the most surprising thing you learned today?"}...\n\nLet's work together to boost curiosity and independent thinking! 🌟📚\n\n*Warm regards,* \nYour Class Teacher`;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(parentWhatsAppTemplate);
    alert("Parent WhatsApp communication template copied to clipboard!");
  };

  // 6. Inclusive Learning / Scaffolds Tab extracts
  const differentiationHeader = "## H. DIFFERENTIATION & INCLUSIVE SUPPORT";
  const flnHeader = "## O. FOUNDATIONAL STAGE & FLN COMPLIANCE";
  let inclusiveContent = extractSection(fullContent, differentiationHeader, ["## I. FORMATIVE ASSESSMENT", quizHeader]);
  if (!inclusiveContent) {
    inclusiveContent = extractSection(fullContent, "Differentiation", [flnHeader]);
  }
  if (!inclusiveContent) {
    inclusiveContent = "### Scaffolded support & fast paths\nSupports standard remedial pacing checks and advanced enrichment pathways to assist all kinds of student capabilities.";
  }

  const visiblePlans = classroomPlans.filter((plan) => {
    const matchesTopic = searchQuery ? plan.topicName.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesTeacher = teacherFilter ? plan.teacherName.toLowerCase().includes(teacherFilter.toLowerCase()) : true;
    const matchesClass = classFilter ? plan.className.toLowerCase().includes(classFilter.toLowerCase()) : true;
    const matchesSubject = subjectFilter ? plan.subjectName.toLowerCase().includes(subjectFilter.toLowerCase()) : true;
    const matchesStatus = statusFilter ? plan.reviewStatus === statusFilter : true;
    return matchesTopic && matchesTeacher && matchesClass && matchesSubject && matchesStatus;
  });

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 p-4 md:p-6 flex flex-col gap-6" id="lesson-plan-workspace">
      
      {/* 1. Header gradient with linear banner */}
      <header className="bg-gradient-to-r from-[#173b9c] to-[#3568e8] text-white p-6 md:p-8 rounded-[18px] shadow-md relative overflow-hidden" id="workspace-banner">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1">Lesson Plans Workspace</h1>
            <p className="text-xs text-white/80 max-w-3xl leading-relaxed">
              Verify CBSE/SQAA compliance checklists across classroom plans, and edit curated teacher materials in the integrated Workspace.
            </p>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab("resources")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10.5px] font-bold text-white transition-colors hover:bg-white/20 cursor-pointer"
              >
                <ExternalLink size={12} />
                Open Resource Library
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-[11px] text-slate-600 shadow-sm" id="lesson-plan-custom-workspace-note">
        <span className="font-semibold text-slate-800">Custom list/detail workspace:</span>{" "}
        Lesson Plans stays specialized. Registry rows can be inspected through Registry Explorer where available, but planning, AI review, checklist, and editing remain custom workflows.
      </div>

      {/* 3. Setup configurations View tab (Google Classroom Registry & Metrics) */}
      {activeView === "setup" && (
        <div className="space-y-6" id="classroom-compliance-registry">
          
          {/* Top Row: Visual Registry Metrics Board */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="classroom-metrics-board">
            <div className="bg-white border border-slate-200 p-4 rounded-[16px] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2454d6] flex items-center justify-center shrink-0">
                <LayoutList size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block font-mono">Classroom Sync'd</span>
                <strong className="text-lg font-bold text-slate-800 font-mono">{classroomPlans.length} plans</strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[16px] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block font-mono">Compliant Plans</span>
                <strong className="text-lg font-bold text-emerald-700 font-mono font-sans">
                  {classroomPlans.filter(p => p.reviewStatus === "Compliant").length} plans
                </strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[16px] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block font-mono">Pending Audit</span>
                <strong className="text-lg font-bold text-amber-500 font-mono font-sans">
                  {classroomPlans.filter(p => p.reviewStatus === "Pending Review").length} plans
                </strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[16px] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block font-mono">QA Flags / Action</span>
                <strong className="text-lg font-bold text-red-500 font-mono font-sans">
                  {classroomPlans.filter(p => p.reviewStatus === "Non-Compliant" || p.reviewStatus === "Approved with Recommendations").length} plans
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="workspace-setup-grid">
            
            {/* Left: Interactive Lesson Plan Registry (Full width) */}
            <div className="lg:col-span-12 bg-white border border-slate-200 rounded-[18px] p-5 shadow-sm space-y-6 animate-fadeIn" id="setup-registry-full-card">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <Database size={17} className="text-[#2454d6]" />
                    Lesson Plan Registry
                  </h2>
                  <p className="text-[11.5px] text-slate-400 block mt-0.5 font-normal font-sans">
                    Monitor compliance scores, run quality audits on classroom items, and configure required criteria.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePullLessonsFromDrive}
                    disabled={syncingFromDrive}
                    className="cursor-pointer bg-blue-50 text-[#2454d6] border border-blue-200 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 select-none shadow-2xs"
                    title="Scan Google Drive's Academic Repository for available lessons"
                    id="sync-drive-lessons-btn"
                  >
                    <RotateCw size={13} className={syncingFromDrive ? "animate-spin text-blue-600" : "text-blue-600"} />
                    <span>{syncingFromDrive ? "Scanning Drive..." : "Sync Drive Lessons"}</span>
                  </button>

                  <button
                    onClick={() => setShowDiscoveryRules(!showDiscoveryRules)}
                    className={`cursor-pointer border text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 select-none shadow-2xs ${
                      showDiscoveryRules 
                        ? "bg-slate-800 text-white border-slate-900 hover:bg-slate-900" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                    title="Configure advanced folder patterns and naming formats for Google Drive discovery"
                  >
                    <Settings size={13} />
                    <span>Discovery Rules</span>
                  </button>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setActiveView("setup")}
                      className={`cursor-pointer px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        activeView === "setup" ? "bg-white text-slate-805 shadow-xs border border-slate-200/55" : "text-slate-500 hover:text-slate-705"
                      }`}
                    >
                      Registry
                    </button>
                    <button
                      onClick={() => setActiveView("saved")}
                      className={`cursor-pointer px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        activeView === "saved" ? "bg-white text-slate-805 shadow-xs border border-slate-200/55" : "text-slate-500 hover:text-slate-705"
                      }`}
                    >
                      Archives
                    </button>
                  </div>
                </div>
              </div>

              {/* Configurable Discovery settings panel */}
              {showDiscoveryRules && (
                <div className="p-4 rounded-xl border border-blue-150 bg-blue-50/20 space-y-4 animate-fadeIn" id="discovery-rules-config-panel">
                  <div className="flex items-center justify-between border-b border-blue-100/50 pb-2">
                    <div className="flex items-center gap-2">
                      <Sliders size={15} className="text-[#2454d6]" />
                      <span className="font-sans font-bold text-xs text-slate-800">Advanced Folder Discovery & Indexing Rules</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-450 bg-white border border-slate-200 px-2 py-0.5 rounded-md">Configurable Engine</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Folder Path Pattern */}
                    <div className="md:col-span-8 space-y-1">
                      <label className="text-[10.5px] font-semibold text-slate-600 block select-none">
                        Google Drive Search & Extraction Path Pattern
                      </label>
                      <input
                        type="text"
                        value={discoveryConfig.pathPattern}
                        onChange={(e) => handleUpdateDiscoveryConfig("pathPattern", e.target.value)}
                        className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="/Academic Repository/AY 2026-27/Secondary/{Class}/{Section}/{Subject}/02_Chapter_Resources"
                      />
                      <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                        💡 <strong>Hint:</strong> Use <code>{"{Class}"}</code>, <code>{"{Section}"}</code>, and <code>{"{Subject}"}</code> placeholders to auto-index matching folders into corresponding filters. Prefix matches directories containing this root.
                      </p>
                    </div>

                    {/* File naming keywords */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10.5px] font-semibold text-slate-600 block select-none">
                        File Name Keyword Filters
                      </label>
                      <input
                        type="text"
                        value={discoveryConfig.nameContains || ""}
                        onChange={(e) => handleUpdateDiscoveryConfig("nameContains", e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="e.g. lesson, plan, curriculum"
                      />
                      <p className="text-[10px] text-slate-400 font-sans">
                        Comma-separated terms. Finds files with any match. Leave empty for all files.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                    {/* Allowed file extensions */}
                    <div className="md:col-span-6 space-y-1.5">
                      <label className="text-[10.5px] font-semibold text-slate-600 block select-none">
                        Allowed Document Extensions
                      </label>
                      <div className="flex select-none items-center gap-2 flex-wrap">
                        {['.md', '.pdf', '.doc', '.docx', '.xls', '.xlsx'].map(ext => {
                          const isSelected = discoveryConfig.allowedExtensions.includes(ext);
                          return (
                            <button
                              key={ext}
                              onClick={() => {
                                const newExts = isSelected
                                  ? discoveryConfig.allowedExtensions.filter(e => e !== ext)
                                  : [...discoveryConfig.allowedExtensions, ext];
                                handleUpdateDiscoveryConfig("allowedExtensions", newExts);
                              }}
                              className={`cursor-pointer px-2.5 py-1 text-[10.5px] font-mono rounded-lg border transition-all ${
                                isSelected 
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs font-semibold" 
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {ext}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Default fallbacks */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10.5px] font-semibold text-slate-600 block flex items-center justify-between select-none">
                        <span>Default Class Fallback</span>
                      </label>
                      <select
                        value={discoveryConfig.defaultClass}
                        onChange={(e) => handleUpdateDiscoveryConfig("defaultClass", e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Class IX">Class IX</option>
                        <option value="Class X">Class X</option>
                        <option value="Class XI">Class XI</option>
                        <option value="Class XII">Class XII</option>
                      </select>
                    </div>

                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10.5px] font-semibold text-slate-600 block select-none">
                        Default Subject Fallback
                      </label>
                      <select
                        value={discoveryConfig.defaultSubject}
                        onChange={(e) => handleUpdateDiscoveryConfig("defaultSubject", e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="English">English</option>
                        <option value="Science">Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Social Science">Social Science</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-blue-100/30 pt-3 text-[11px] text-slate-500 font-sans">
                    <span>
                      📂 Current Rule Base matches prefix of: <code>{"/Academic Repository/AY 2026-27/"}</code>
                    </span>
                    <button
                      onClick={() => {
                        setDiscoveryConfig({
                          pathPattern: "/Academic Repository/AY 2026-27/Secondary/{Class}/{Section}/{Subject}/02_Chapter_Resources",
                          nameContains: "lesson, plan",
                          allowedExtensions: [".md", ".pdf", ".doc", ".docx"],
                          defaultClass: "Class X",
                          defaultSubject: "English"
                        });
                        localStorage.removeItem("edu_discovery_config");
                      }}
                      className="cursor-pointer text-[10px] text-red-650 hover:text-red-800 font-bold"
                    >
                      Reset to System Defaults
                    </button>
                  </div>
                </div>
              )}

              {/* Drive Sync Report Feedback */}
              {syncReport && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-fadeIn ${
                  syncReport.count > 0 
                    ? "bg-emerald-50 border-emerald-250 text-emerald-950" 
                    : "bg-blue-50/50 border-blue-150 text-blue-950"
                }`} id="drive-sync-report-container">
                  <CheckCircle size={15} className={syncReport.count > 0 ? "text-emerald-600 mt-0.5 shrink-0" : "text-blue-600 mt-0.5 shrink-0"} />
                  <div className="space-y-1">
                    <p className="font-bold font-sans">Google Drive Synchronization Report</p>
                    <p className="font-sans leading-relaxed text-[11px] text-slate-700">{syncReport.message}</p>
                    {syncReport.count > 0 && (
                      <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider select-none font-sans mt-0.5">
                        💡 Tip: Click "Run QA Compliance Audit" on the newly imported lessons to inspect the modern CBSE alignments!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Main content split grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch" id="registry-inner-split-grid">
                
                {/* Left Side: Filtering and Plan List (col-span-7) */}
                <div className="xl:col-span-7 min-w-0 space-y-4" id="plans-list-holder">
                  
                  {/* Filtering Suite */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150" id="registry-filters-suite">
                    {/* 1. Teacher Filter */}
                    <div>
                      <select
                        value={teacherFilter}
                        onChange={(e) => setTeacherFilter(e.target.value)}
                        className="w-full bg-white border border-slate-250 p-1.5 rounded-lg text-[11px] text-slate-705 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Teachers --</option>
                        <option value="Henderson">Dr. Henderson</option>
                        <option value="Vance">Mr. Vance</option>
                        <option value="Montgomery">Ms. Montgomery</option>
                      </select>
                    </div>

                    {/* 2. Classes Filter */}
                    <div>
                      <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="w-full bg-white border border-slate-250 p-1.5 rounded-lg text-[11px] text-slate-705 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Classes --</option>
                        <option value="Class VIII">Class VIII</option>
                        <option value="Class IX">Class IX</option>
                        <option value="Class X">Class X</option>
                        <option value="Class XI">Class XI</option>
                      </select>
                    </div>

                    {/* 3. Subject Filter (new) */}
                    <div>
                      <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="w-full bg-white border border-slate-250 p-1.5 rounded-lg text-[11px] text-slate-705 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Subjects --</option>
                        <option value="Science">Science</option>
                        <option value="AP Chemistry">AP Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="English">English</option>
                      </select>
                    </div>

                    {/* 4. Topic Filter */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                      <input
                        type="text"
                        placeholder="Search Topic..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-250 p-1.5 pl-7 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* 5. Status Filter */}
                    <div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-white border border-slate-250 p-1.5 rounded-lg text-[11px] text-slate-705 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Statuses --</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Compliant">Compliant</option>
                        <option value="Approved with Recommendations">Approved / Recs</option>
                        <option value="Non-Compliant">Non-Compliant</option>
                      </select>
                    </div>
                  </div>

                  {/* Plans Registry Scroll Box */}
                  <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1" id="registry-items-scrollable">
                    {visiblePlans.length > 0 ? (
                      visiblePlans.map((plan) => {
                        let statusClass = "bg-slate-100 text-slate-700 border-slate-200";
                        if (plan.reviewStatus === "Compliant") statusClass = "bg-emerald-50 text-emerald-800 border-emerald-250";
                        if (plan.reviewStatus === "Pending Review") statusClass = "bg-amber-50 text-amber-705 border-amber-250";
                        if (plan.reviewStatus === "Non-Compliant") statusClass = "bg-red-50 text-red-600 border-red-200";
                        if (plan.reviewStatus === "Approved with Recommendations") statusClass = "bg-orange-50 text-orange-850 border-orange-200";

                        // Get dynamic score based on current configurations
                        const auditResult = evaluatePlanChecklist(plan.originalContent, qaChecklists);
                        let totalEnabled = 0;
                        let passedEnabled = 0;
                        Object.keys(qaChecklists).forEach(category => {
                          qaChecklists[category].forEach(item => {
                            if (item.enabled) {
                              totalEnabled++;
                              if (auditResult[item.id] === "pass") {
                                passedEnabled++;
                              }
                            }
                          });
                        });
                        const currentScore = `${passedEnabled}/${totalEnabled}`;
                        const defectCount = totalEnabled - passedEnabled;

                        return (
                          <div 
                            key={plan.id}
                            className={`p-4 border rounded-2xl transition-all flex flex-col justify-between gap-4 bg-white hover:shadow-xs relative ${
                              selectedPlanId === plan.id 
                                ? "border-blue-600 ring-1 ring-blue-100 bg-blue-50/10" 
                                : getStatusLabelLocal(plan, defectCount) === "Approved" 
                                ? "border-emerald-100 bg-emerald-50/5" 
                                : getStatusLabelLocal(plan, defectCount).startsWith("Defects")
                                ? "border-rose-100 bg-rose-50/5"
                                : "border-slate-200 hover:border-blue-200"
                            }`}
                            id={`plan-card-${plan.id}`}
                          >
                            <div className="space-y-4">
                              {/* Card Title */}
                              <div className="min-w-0">
                                <strong className="block text-[13px] font-bold text-slate-800 leading-snug line-clamp-2 break-words" title={plan.topicName}>
                                  {plan.topicName}
                                </strong>
                              </div>

                              {/* MDC3 Layout: 2 Rows, Column 1 Span Full */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                                {/* Row 1 / Col 1 - Teacher */}
                                <div className="col-span-1 min-w-0">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Teacher</span>
                                  <span className="font-semibold text-slate-700 truncate block">
                                    {getTeacherFriendlyName(plan.teacherName || plan.teacherId)}
                                  </span>
                                </div>

                                {/* Row 1 / Col 2 - Sync Date */}
                                <div className="col-span-1 min-w-0">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Sync Date</span>
                                  <span className="font-semibold text-slate-705 block text-xs">
                                    {new Date(plan.importedAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Row 2 / Full-width - Review Status */}
                                <div className="col-span-2 min-w-0">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider font-sans">Review Status</span>
                                  <span className={`inline-flex items-center gap-1 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded leading-none ${
                                    getStatusLabelLocal(plan, defectCount) === "Approved" 
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-250" 
                                      : getStatusLabelLocal(plan, defectCount).startsWith("Defects")
                                      ? "bg-rose-50 text-rose-800 border border-rose-250 font-mono"
                                      : "bg-amber-50 text-amber-805 border border-amber-250"
                                  }`}>
                                    {getStatusLabelLocal(plan, defectCount)}
                                  </span>
                                </div>
                              </div>

                              {/* Drive URL In-Place Input / Editor if chosen */}
                              {editingUrlPlanId === plan.id && (
                                <div onClick={(e) => e.stopPropagation()} className="bg-white border border-blue-200 p-2 rounded-xl text-xs animate-fadeIn space-y-2">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Modify Google Drive link</span>
                                  <div className="flex items-center gap-1.5">
                                    <input 
                                      type="text" 
                                      value={tempUrlValue} 
                                      onChange={(e) => setTempUrlValue(e.target.value)}
                                      className="text-[10px] font-sans px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-md w-full text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="Paste real Google Drive file URL..."
                                      autoFocus
                                    />
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateDriveUrl(plan.id, tempUrlValue);
                                        setEditingUrlPlanId(null);
                                      }}
                                      className="p-1 px-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md shrink-0 cursor-pointer"
                                    >
                                      <Check size={11} className="font-bold" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingUrlPlanId(null);
                                      }}
                                      className="p-1 px-1.5 bg-slate-50 text-slate-500 hover:bg-slate-105 rounded-md shrink-0 cursor-pointer"
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                </div>
                              )}


                            </div>

                            {/* Interactive Actions line aligned bottom with 3-dot menu */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 justify-between">
                              
                              <div className="flex items-center gap-2 flex-1">
                                {/* Review button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTriggerAudit(plan.id);
                                  }}
                                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold cursor-pointer inline-flex items-center justify-center gap-1 transition-all border ${
                                    getStatusLabelLocal(plan, defectCount) !== "Approved"
                                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                      : "text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 border-slate-200"
                                  }`}
                                  title="Run compliance audit check"
                                >
                                  <ShieldCheck size={10} />
                                  Review
                                </button>

                                {/* View Details Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPlanId(plan.id);
                                    setActiveView("editor");
                                    localStorage.removeItem("edu_came_from_ingestor");
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-1 shadow-xs"
                                >
                                  <Sparkles size={10} className="text-amber-400" />
                                  View Details
                                </button>
                              </div>

                              {/* MDC3 3-Dot Action Menu for remaining buttons */}
                              <div className="relative shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === plan.id ? null : plan.id);
                                  }}
                                  className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-105 border border-slate-200 transition-all font-bold cursor-pointer h-[26px] flex items-center justify-center"
                                >
                                  <MoreVertical size={13} />
                                </button>
                                
                                {activeMenuId === plan.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                    }} />
                                    <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-[11px] animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                                      {/* View Review Report */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReportPlan(plan);
                                          setActiveMenuId(null);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                                      >
                                        <ShieldCheck size={11} className="text-blue-600" />
                                        View Review Report
                                      </button>

                                      {/* View in Google Drive */}
                                      <a
                                        href={plan.driveUrl || "https://drive.google.com/file/d/sample/view"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                                        onClick={() => setActiveMenuId(null)}
                                      >
                                        <ExternalLink size={11} />
                                        View in Google Drive
                                      </a>

                                      {/* Delete action option */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDeletePlanLocal(plan.id);
                                          setActiveMenuId(null);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-bold border-t border-slate-100 cursor-pointer"
                                      >
                                        <Trash2 size={11} />
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>

                            </div>

                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200" id="lesson-plans-empty-state">
                        <p className="text-slate-700 text-xs font-semibold">No lesson plans match the current filters.</p>
                        <p className="text-slate-400 text-[11px] font-sans leading-relaxed mt-1">
                          Clear the filters to view the custom planning registry, or sync Drive lessons if the workspace is empty.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Interactive Audit & Compliance Detail Suite + Configurator (col-span-12 or xl:col-span-5) */}
                <div className="xl:col-span-5 min-w-0 bg-slate-50/50 rounded-2xl border border-slate-200 p-4 space-y-4 overflow-hidden" id="classroom-qa-audit-details-column">
                  
                  {/* Right Header Navigation */}
                  <div className="flex border-b border-slate-200">
                    <button
                      onClick={() => setQaRightTab("audit")}
                      className={`flex-1 text-center pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                        qaRightTab === "audit" 
                          ? "border-[#2454d6] text-[#2454d6]" 
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Review Report
                    </button>
                    <button
                      onClick={() => setQaRightTab("config")}
                      className={`flex-1 text-center pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                        qaRightTab === "config" 
                          ? "border-[#2454d6] text-[#2454d6]" 
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Configure Review Checklist
                    </button>
                  </div>

                  {/* Tab contents */}
                  {qaRightTab === "audit" ? (
                    activePlan ? (
                      <div className="space-y-4 animate-fadeIn" id="audit-presentation-pane">
                        
                        {/* Title Info Header */}
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-800 leading-snug mt-1 break-words line-clamp-2">{activePlan.topicName}</h3>
                          <p className="text-[11px] text-slate-555 font-sans mt-0.5">Teacher: <strong className="text-slate-700">{activePlan.teacherName}</strong> · Area: <span className="text-slate-600">{activePlan.className} {activePlan.subjectName}</span></p>
                        </div>

                        {/* Audit Summary State Panel */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          activePlan.reviewStatus === "Compliant" 
                            ? "bg-emerald-50/40 border-emerald-200" 
                            : activePlan.reviewStatus === "Pending Review" 
                              ? "bg-amber-50/30 border-amber-200" 
                              : activePlan.reviewStatus === "Approved with Recommendations"
                                ? "bg-orange-50/20 border-orange-200"
                                : "bg-red-50/30 border-red-200"
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              activePlan.reviewStatus === "Compliant" 
                                ? "bg-emerald-500 animate-pulse" 
                                : activePlan.reviewStatus === "Pending Review" 
                                  ? "bg-amber-450 animate-pulse bg-amber-400" 
                                  : "bg-red-500 animate-pulse"
                            }`} />
                            <h4 className="text-[11.5px] uppercase font-mono font-bold tracking-wider text-slate-755">Review Summary: {activePlan.reviewStatus}</h4>
                          </div>
                          
                          <p className="text-[11px] text-slate-505 font-sans leading-relaxed">
                            {activePlan.reviewComments || "Click Run QA Audit to execute standard checks on NCERT alignment, timeboxes, and differentiation scaffolds."}
                          </p>

                          {/* Trigger Audit Button */}
                          <div className="pt-1.5">
                            <button
                              onClick={() => handleTriggerAudit(activePlan.id)}
                              disabled={isReviewing}
                              className="w-full bg-[#2454d6] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-40 transition-all"
                            >
                              <ShieldCheck size={14} />
                              {isReviewing ? "Analysing document templates..." : "Review"}
                            </button>
                          </div>
                        </div>

                        {/* Configurable Items Verification Breakdown */}
                        <div className="space-y-3">
                          <div className="max-h-[310px] overflow-y-auto space-y-3.5 pr-1" id="checks-breakdown-scroller">
                            
                            {Object.keys(qaChecklists).map((docCategory) => {
                              const categoryEnabledItems = qaChecklists[docCategory].filter(i => i.enabled);
                              if (categoryEnabledItems.length === 0) return null;

                              const auditResult = evaluatePlanChecklist(activePlan.originalContent, qaChecklists);

                              return (
                                <div key={docCategory} className="space-y-1.5 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                                  <strong className="text-[10.5px] text-[#2454d6] block font-mono uppercase tracking-wider">{docCategory} Required Checks</strong>
                                  <div className="space-y-1.5">
                                    {categoryEnabledItems.map(item => {
                                      const isPassed = auditResult[item.id] === "pass";
                                      return (
                                        <div key={item.id} className="flex items-start gap-2 text-[10.5px]">
                                          <span className="shrink-0 mt-0.5">
                                            {isPassed ? (
                                              <span className="text-emerald-600 bg-emerald-50 font-bold px-1 rounded-md text-[9px] border border-emerald-200">PASS</span>
                                            ) : (
                                              <span className="text-red-500 bg-red-55 text-red-600 bg-red-50 font-bold px-1 rounded-md text-[9px] border border-red-200">FAIL</span>
                                            )}
                                          </span>
                                          <span className="text-slate-600 font-sans leading-snug min-w-0 break-words">{item.text}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Inspect link button */}
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              setSelectedPlanId(activePlan.id);
                              setSelectedClass(activePlan.className);
                              setSelectedSubject(activePlan.subjectName);
                              setSelectedTopic(activePlan.topicName);
                              setEditorMarkdown(activePlan.originalContent);
                              setGeneratedMarkdown(activePlan.originalContent);
                              setDeckTab("outline");
                              setActiveView("editor");
                              setSaveSuccess(activePlan.reviewStatus === "Compliant");
                            }}
                            className="w-full bg-[#f8fafc] border border-slate-250 text-slate-705 hover:bg-slate-100 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <Sparkles size={12} className="text-[#2454d6]" />
                            Open Workbook Workspace
                          </button>
                        </div>

                      </div>
                    ) : (
                      <div className="text-left p-4 rounded-xl border border-dashed border-slate-200 bg-white text-slate-500 text-xs font-sans space-y-2" id="lesson-plan-detail-empty-state">
                        <p className="font-semibold text-slate-700">No lesson plan is selected.</p>
                        <p className="leading-relaxed">Choose a lesson on the left to inspect its review summary, checklist, and workbook editor.</p>
                        {visiblePlans.length > 0 && (
                          <button
                            onClick={() => setSelectedPlanId(visiblePlans[0].id)}
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-all"
                          >
                            Select first visible lesson
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    // Configuration tab content
                    <div className="space-y-4 animate-fadeIn" id="config-panel-container">
                      <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl">
                        <p className="text-[10.5px] text-blue-800 leading-normal font-sans">
                          Modify required Review Checklist. Enabling/disabling Checklist items will immediately re-calculate index scores from the central registry.
                        </p>
                      </div>

                      {/* Doc Type selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono uppercase text-slate-500">Document Category :</label>
                        <select
                          value={selectedConfigType}
                          onChange={(e) => setSelectedConfigType(e.target.value)}
                          className="w-full bg-white border border-slate-250 p-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {Object.keys(qaChecklists).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Criteria lists table */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold font-mono uppercase text-slate-500 block">Enforced Rules ({qaChecklists[selectedConfigType]?.length || 0}) :</span>
                        <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1" id="config-items-scroller">
                          {qaChecklists[selectedConfigType]?.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-2 border border-slate-200/75 rounded-lg bg-white shadow-xs">
                              <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={item.enabled}
                                  onChange={(e) => handleUpdateChecklistItem(selectedConfigType, item.id, e.target.checked)}
                                  className="mt-0.5 accent-[#2454d6]"
                                />
                                <span className={`text-[10.5px] leading-relaxed font-sans ${item.enabled ? "text-slate-700 font-medium" : "text-slate-400 line-through"}`}>
                                  {item.text}
                                </span>
                              </label>

                              <button
                                onClick={() => handleRemoveChecklistItem(selectedConfigType, item.id)}
                                className="text-slate-400 hover:text-red-500 font-bold p-1 hover:bg-slate-100 rounded-md transition-all shrink-0 text-xs"
                                title="Delete Rule"
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          {(!qaChecklists[selectedConfigType] || qaChecklists[selectedConfigType].length === 0) && (
                            <div className="text-center p-6 bg-slate-100 rounded-xl">
                              <p className="text-slate-400 text-[10.5px] font-sans">No checklist items configured for this document type.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add Custom Criterion Form */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold font-mono uppercase text-slate-500 block">Add Custom Review Checklist Item :</span>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newCriterionText.trim()) {
                              handleAddChecklistItem(selectedConfigType, newCriterionText);
                              setNewCriterionText("");
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            placeholder="Type new compliance check detail..."
                            value={newCriterionText}
                            onChange={(e) => setNewCriterionText(e.target.value)}
                            className="bg-white border text-xs p-2 rounded-xl flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            className="bg-[#2454d6] hover:bg-blue-700 text-white font-bold px-3.5 rounded-xl text-xs shrink-0 cursor-pointer transition-all"
                          >
                            Add
                          </button>
                        </form>
                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>
      )}



      {/* 5. Rich Multi-Tab Markdown preview & Slide presentator workstation */}
      {activeView === "editor" && (
        <div className="bg-white border border-slate-200 rounded-[18px] shadow-md overflow-hidden flex flex-col flex-1" id="workbook-material-editor">
          
          {/* Workstation toolbar */}
          <div className="bg-slate-50 border-b border-slate-150 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                id="editor-close-btn"
                onClick={() => {
                  const cameFromIngestor = localStorage.getItem("edu_came_from_ingestor") === "true";
                  localStorage.removeItem("edu_came_from_ingestor");
                  if (cameFromIngestor && setActiveTab) {
                    setActiveTab("textbooks");
                  } else {
                    setActiveView("setup");
                    setGenerationError("");
                  }
                }}
                className="cursor-pointer bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 p-2 rounded-xl text-xs flex items-center gap-1 font-semibold shadow-sm transition-all"
              >
                <ArrowLeft size={13} /> {localStorage.getItem("edu_came_from_ingestor") === "true" ? "Back to Textbook Ingestor" : "Back to Registry"}
              </button>
              
              <div>
                <h2 className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {selectedClass} {selectedSubject} · {selectedTopic}
                  {saveSuccess && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-250">
                      <CheckCircle size={10} className="text-emerald-500" />
                      Published
                    </span>
                  )}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const nextVal = !isEditing;
                  setIsEditing(nextVal);
                  if (nextVal) {
                    setDeckTab("raw");
                  }
                }}
                id="edit-mode-toggle"
                className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                  isEditing ? "bg-slate-700 hover:bg-slate-800 text-white" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-55"
                }`}
              >
                <Edit size={13} />
                {isEditing ? "Finish Editing" : "Manual Code Edit"}
              </button>

              <button
                onClick={handleSaveToDrive}
                disabled={isSaving}
                id="editor-save-drive-btn"
                className={`cursor-pointer text-white font-extrabold px-4 py-1.5 rounded-full text-xs flex items-center gap-1 transition-all shadow-sm disabled:opacity-40 ${
                  saveSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#2454d6] hover:bg-blue-700"
                }`}
              >
                <Save size={13} />
                {isSaving ? "Saving..." : (saveSuccess ? "Republish to Google Drive" : "Save to Google Drive")}
              </button>
            </div>
          </div>

          {/* Previews layout panel - Full Width Workspace */}
          <div className="flex-grow flex flex-col bg-white overflow-hidden min-h-[550px]" id="splitting-workbench">
            
            {/* Material Tab controls header */}
            <div className="flex border-b border-slate-150 overflow-x-auto bg-slate-50/50 shrink-0 select-none scrollbar-none" id="material-tabs-list">
              {[
                { id: "outline", text: "Outline", icon: <BookOpen size={13} /> },
                { id: "slides", text: "Slides", icon: <Sparkles size={13} /> },
                { id: "quiz", text: "Quiz", icon: <Brain size={13} /> },
                { id: "assignments", text: "Homework", icon: <FileText size={13} /> },
                { id: "parental", text: "Parent Discussion", icon: <HelpCircle size={13} /> },
                { id: "audit", text: "Audit Checklist", icon: <CheckCircle size={13} /> },
                { id: "raw", text: "Raw Markdown", icon: <FileCode size={13} /> },
                { id: "sqaa_links", text: "SQAA Links", icon: <ExternalLink size={13} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  id={`tab-select-${tab.id}`}
                  onClick={() => setDeckTab(tab.id as any)}
                  className={`px-3.5 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    deckTab === tab.id ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.icon} {tab.text}
                </button>
              ))}
            </div>

            {/* Material content viewport scrollbar */}
            <div className="flex-1 p-5 overflow-y-auto bg-white min-h-0" id="tab-viewport-content">
                
                {/* Outline Tab */}
                {deckTab === "outline" && (
                  <div className="space-y-4" id="outline-tab-view">
                    
                    {/* Compliance Gaps, exact layout/evaluation mechanism as in Registry */}
                    {(() => {
                      const auditResult = evaluatePlanChecklist(editorMarkdown, qaChecklists);
                      const gaps = [
                        { key: "lp", label: "LP Outline", val: auditResult["lp_objectives"] === "pass" && auditResult["lp_pacing"] === "pass" },
                        { key: "qz", label: "Diagnostic Quiz", val: auditResult["qz_ncert"] === "pass" },
                        { key: "as", label: "Home Tasks", val: auditResult["as_structured"] === "pass" },
                        { key: "re", label: "Inclusion Support", val: auditResult["re_slow"] === "pass" || auditResult["re_advanced"] === "pass" },
                        { key: "pc", label: "Parent Bridge", val: auditResult["pc_whatsapp"] === "pass" || auditResult["pc_triggers"] === "pass" },
                        { key: "sq", label: "SQAA Matrix", val: auditResult["sq_mapping"] === "pass" }
                      ];

                      const missingGaps = gaps.filter(dot => !dot.val);

                      return (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-705 flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-blue-600 font-bold shrink-0" />
                              Lesson Compliance Gaps (Current Draft Audit)
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded">
                              {gaps.filter(g => g.val).length} / {gaps.length} Compliant Modules
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {missingGaps.length === 0 ? (
                              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full leading-none text-xs font-bold font-sans">
                                <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                                Active Draft fully Compliant (No Gaps)
                              </div>
                            ) : (
                              missingGaps.map(dot => (
                                <div key={dot.key} className="flex items-center gap-1.5 shrink-0 bg-red-50 border border-red-150 px-2.5 py-1 rounded-full leading-none">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                  <span className="text-[10px] font-sans font-bold text-red-700 shrink-0">{dot.label} Missing</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Linked Textbook Reference Chapter Section */}
                    {(() => {
                      const bookChapterFile = files?.find(f => 
                        (f.name.toLowerCase().includes(selectedTopic.toLowerCase()) || 
                         selectedTopic.toLowerCase().includes(f.name.toLowerCase()) ||
                         (f.tags && f.tags.some(t => t.toLowerCase() === "textbook" || t.toLowerCase() === "ncert"))
                        ) && f.contentSum
                      );

                      if (bookChapterFile) {
                        return (
                          <div className="p-4 bg-emerald-50/20 border border-emerald-200/80 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                  📖 Linked Textbook Reference Chapter
                                </span>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                                  {bookChapterFile.sharingRule}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono font-bold">
                                Modified: {new Date(bookChapterFile.modifiedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-[11.5px] text-slate-700 font-medium leading-relaxed font-sans">
                              Source Chapter: <strong className="text-slate-950">{bookChapterFile.name}</strong> ({bookChapterFile.size})
                            </div>
                            <div className="bg-white border border-emerald-100 p-3 rounded-lg text-xs leading-relaxed text-slate-650 max-h-[120px] overflow-y-auto font-sans">
                              <strong className="text-[10.5px] text-slate-700 block mb-1 font-bold uppercase tracking-wider">Chapter Outline Abstract:</strong>
                              {bookChapterFile.contentSum}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 gap-3">
                          <div className="flex items-center gap-2">
                            <BookOpen size={15} className="text-slate-450 shrink-0" />
                            <span>
                              Textbook chapter abstract preview: <strong className="text-slate-700">{selectedTopic || "No topic selected"}</strong> is generated in real-time.
                            </span>
                          </div>
                          <span className="text-[9.5px] text-slate-400 bg-white border border-slate-205 px-2 py-0.5 rounded font-mono font-bold">
                            Auto-Linked
                          </span>
                        </div>
                      );
                    })()}

                    {/* CBSE Modern Pedagogies Alignment Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Computational Thinking Column */}
                      <div className="p-3 bg-indigo-50/40 border border-indigo-150 rounded-xl space-y-1">
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider block w-fit">
                          Computational Thinking
                        </span>
                        {editorMarkdown.toLowerCase().includes("computational") || editorMarkdown.toLowerCase().includes("algorithmic") || editorMarkdown.toLowerCase().includes("decomposition") ? (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-extrabold font-sans mt-1.5">
                            <CheckCircle size={13} className="text-indigo-600 shrink-0 font-bold" />
                            <span>Aligned & Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium font-sans mt-1.5">
                            <Info size={13} className="text-slate-400 shrink-0" />
                            <span>Suggested for Grade 6-8 Math/Sci</span>
                          </div>
                        )}
                        <p className="text-[9.5px] text-slate-500 leading-normal font-sans">
                          Builds core mathematical logic via decomposition, abstraction, or pattern matching.
                        </p>
                      </div>

                      {/* Art Integration Column */}
                      <div className="p-3 bg-pink-50/40 border border-pink-150 rounded-xl space-y-1">
                        <span className="text-[10px] bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider block w-fit">
                          Art Integration
                        </span>
                        {editorMarkdown.toLowerCase().includes("art-integrated") || editorMarkdown.toLowerCase().includes("music") || editorMarkdown.toLowerCase().includes("roleplay") || editorMarkdown.toLowerCase().includes("drama") ? (
                          <div className="flex items-center gap-1.5 text-xs text-pink-900 font-extrabold font-sans mt-1.5">
                            <CheckCircle size={13} className="text-pink-600 shrink-0 font-bold" />
                            <span>Aligned & Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium font-sans mt-1.5">
                            <Info size={13} className="text-slate-400 shrink-0" />
                            <span>Not detected in draft</span>
                          </div>
                        )}
                        <p className="text-[9.5px] text-slate-500 leading-normal font-sans">
                          Fosters active learning through sketches, charts, role-play or music mapping.
                        </p>
                      </div>

                      {/* Competency Based Learning Column */}
                      <div className="p-3 bg-amber-50/40 border border-amber-150 rounded-xl space-y-1">
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider block w-fit">
                          Competency Based (CBL)
                        </span>
                        {editorMarkdown.toLowerCase().includes("competenc") || editorMarkdown.toLowerCase().includes("outcome") || editorMarkdown.toLowerCase().includes("measurable") ? (
                          <div className="flex items-center gap-1.5 text-xs text-amber-900 font-extrabold font-sans mt-1.5">
                            <CheckCircle size={13} className="text-amber-600 shrink-0 font-bold" />
                            <span>Aligned & Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium font-sans mt-1.5">
                            <Info size={13} className="text-slate-400 shrink-0" />
                            <span>Not detected in draft</span>
                          </div>
                        )}
                        <p className="text-[9.5px] text-slate-500 leading-normal font-sans">
                          Focuses strictly on measurable action verbs and active real-life outcomes.
                        </p>
                      </div>
                    </div>

                    <div className="prose max-w-none text-xs pb-10 space-y-3 font-sans text-slate-600 border-t border-slate-100 pt-4">
                      {renderSimpleMarkdown(planOutline, { skipTitle: true })}
                    </div>
                  </div>
                )}

                {/* Presentation Slides Tab */}
                {deckTab === "slides" && (
                  <div className="space-y-4" id="slides-tab-view">
                    
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-205">
                      <div className="flex items-center gap-1.5 text-xs text-slate-705 font-bold font-mono">
                        <Clock size={13} className="text-slate-500 animate-bounce" />
                        <span>Present Pacing Timer: {formatTimer(timerSeconds)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 rounded text-slate-800 cursor-pointer"
                        >
                          {isTimerRunning ? "Pause" : "Start"}
                        </button>
                        <button
                          onClick={() => { setTimerSeconds(0); setIsTimerRunning(false); }}
                          className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Class Projector UI Display */}
                    <div className="bg-slate-900 text-white p-5 rounded-[16px] shadow-lg flex flex-col justify-between h-[240px]">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 font-mono font-bold px-2 py-0.5 rounded border border-blue-500/30">
                          {slideDeckData[slideIndex]?.duration || "8 Mins"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold tracking-wider font-mono">CLASS PROJECTOR MODULE</span>
                      </div>

                      <div className="my-2">
                        <h3 className="text-base font-extrabold text-blue-400">{slideDeckData[slideIndex]?.title}</h3>
                        <p className="text-xs text-slate-200 leading-relaxed max-w-xl mt-1.5">{slideDeckData[slideIndex]?.content}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-800">
                        <span className="text-[10px] text-slate-500 font-mono">Slide {slideIndex + 1} of {slideDeckData.length}</span>
                        <div className="flex gap-1.5">
                          <button
                            disabled={slideIndex === 0}
                            onClick={() => setSlideIndex(prev => Math.max(0, prev - 1))}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded text-[11px] disabled:opacity-30 font-bold cursor-pointer"
                          >
                            Prev
                          </button>
                          <button
                            disabled={slideIndex === slideDeckData.length - 1}
                            onClick={() => setSlideIndex(prev => Math.min(slideDeckData.length - 1, prev + 1))}
                            className="bg-[#2454d6] hover:bg-blue-700 text-white px-3 py-1 rounded text-[11px] disabled:opacity-30 font-bold cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#fff4df] border border-slate-200 p-4 rounded-xl">
                      <span className="text-[10px] text-[#b7791f] font-bold uppercase tracking-wider block mb-1">Teacher presenter speaker Tips</span>
                      <p className="text-xs text-amber-900 leading-normal">{slideDeckData[slideIndex]?.tips}</p>
                    </div>

                  </div>
                )}

                {/* Concept Diagnostic Quiz Tab */}
                {deckTab === "quiz" && (
                  <div className="space-y-4" id="quiz-tab-view">
                    
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div>
                        <strong className="text-xs text-slate-800 block">Class check diagnostics</strong>
                        <span className="text-[10px] text-slate-400 block">CBSE objective diagnostic checks.</span>
                      </div>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setShowAnswerKey(!showAnswerKey)}
                          className="bg-white border rounded text-xs px-2.5 py-1 font-bold text-slate-650 cursor-pointer"
                        >
                          {showAnswerKey ? "Hide Answer Rubric" : "View Answers"}
                        </button>
                        <button
                          onClick={handleCopyQuiz}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded font-bold cursor-pointer"
                        >
                          Copy text
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-150 rounded-xl p-4 bg-white shadow-sm font-sans text-xs text-slate-600 prose max-w-none space-y-3">
                      {renderSimpleMarkdown(quizContent)}
                      
                      {showAnswerKey && (
                        <div className="border-t border-dashed border-emerald-200 pt-3 mt-4 text-emerald-800 space-y-2">
                          <strong className="block text-xs font-bold shrink-0">Standard diagnostic keys & evaluation criteria:</strong>
                          <p className="text-[11px] leading-relaxed font-sans mt-1 bg-emerald-50/20 p-2.5 rounded border border-emerald-100">
                            Give 1 point for every correct conceptual match. Ensure students failing to score 60% are assisted inside the support scaffolds module.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* Assignments Suite Tab */}
                {deckTab === "assignments" && (
                  <div className="space-y-4" id="assignments-tab-view">
                    
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div>
                        <strong className="text-xs text-slate-850 block">Syllabus Homework taskset</strong>
                        <span className="text-[10px] text-slate-405 block">Assess cognitive standard retention worksheets.</span>
                      </div>
                      <button
                        onClick={handleCopyAssignments}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded font-bold cursor-pointer"
                      >
                        Copy questions
                      </button>
                    </div>

                    <div className="border border-slate-150 rounded-xl p-4 bg-white shadow-sm font-sans text-xs text-slate-650 prose max-w-none space-y-3">
                      {renderSimpleMarkdown(assignmentContent)}
                    </div>

                  </div>
                )}

                {/* Parent Bridge Tab */}
                {deckTab === "parental" && (
                  <div className="space-y-4" id="parental-tab-view">
                    
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div>
                        <strong className="text-xs text-slate-800 block">WhatsApp Broadcaster notification template</strong>
                        <span className="text-[10px] text-slate-405 block">Bridge school learnings with home queries.</span>
                      </div>
                      <button
                        onClick={handleCopyWhatsApp}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded font-bold cursor-pointer"
                      >
                        Copy Broadcast Text
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Starters list column */}
                      <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-2">
                        <strong className="text-[11.5px] font-bold text-slate-800 block">Discussion prompts details:</strong>
                        <div className="prose max-w-none text-xs text-slate-650 font-sans space-y-2">
                          {renderSimpleMarkdown(parentalContent || "### Home Conversation Starters\nAsk standard application scenarios of today's learning outcomes to sparks active questioning habits.")}
                        </div>
                      </div>

                      {/* WhatsApp text block */}
                      <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/10 space-y-2">
                        <span className="text-[10px] text-emerald-800 font-extrabold uppercase font-mono block">BROADCAST DRAFT SMS</span>
                        <div className="bg-white border rounded p-3 font-mono text-[10px] text-slate-650 whitespace-pre-wrap max-h-[220px] overflow-y-auto leading-relaxed border-slate-200">
                          {parentWhatsAppTemplate}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* Audit Checklist Tab */}
                {deckTab === "audit" && (
                  <div className="space-y-4" id="audit-checklist-tab-view">
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex justify-between items-center">
                      <div>
                        <strong className="text-sm font-bold text-slate-850 block">CBSE & School Quality Checklist Audit</strong>
                        <span className="text-[10px] text-slate-500">Live draft inspection based on classroom configuration items.</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded uppercase">
                        Real-time Draft Audit
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(qaChecklists).map((docCategory) => {
                        const categoryEnabledItems = qaChecklists[docCategory].filter(i => i.enabled);
                        if (categoryEnabledItems.length === 0) return null;

                        const auditResult = evaluatePlanChecklist(editorMarkdown, qaChecklists);

                        return (
                          <div key={docCategory} className="border border-slate-150 rounded-xl p-4 bg-white space-y-3 shadow-xs">
                            <strong className="text-[11.5px] text-[#2454d6] block font-mono uppercase tracking-wider border-b border-slate-100 pb-1.5">
                              {docCategory} Checks
                            </strong>
                            <div className="space-y-2">
                              {categoryEnabledItems.map(item => {
                                const isPassed = auditResult[item.id] === "pass";
                                return (
                                  <div key={item.id} className="flex items-start gap-2.5 text-xs">
                                    <span className="shrink-0 mt-0.5">
                                      {isPassed ? (
                                        <CheckCircle size={13} className="text-emerald-500 fill-emerald-50" />
                                      ) : (
                                        <AlertCircle size={13} className="text-amber-500 fill-amber-50" />
                                      )}
                                    </span>
                                    <span className={`leading-relaxed ${isPassed ? "text-slate-600 font-medium font-sans" : "text-slate-400 font-sans"}`}>
                                      {item.text}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                )}

                {/* SQAA Links Tab */}
                {deckTab === "sqaa_links" && (
                  <div className="space-y-4" id="sqaa-links-tab-view">
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex justify-between items-center">
                      <div>
                        <strong className="text-sm font-bold text-slate-850 block">CBSE SQAA Indicators Map</strong>
                        <span className="text-[10px] text-slate-500">School Quality Assessment and Assurance alignment maps.</span>
                      </div>
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold">
                        {SQAA_INDICATORS.filter(ind => selectedSqaaIndicators.includes(ind.id)).length} Active Indicators
                      </span>
                    </div>

                    <div className="space-y-3">
                      {SQAA_INDICATORS.map(ind => {
                        const isSelected = selectedSqaaIndicators.includes(ind.id);
                        const isMappedInText = editorMarkdown.toLowerCase().includes(`sqaa-${ind.id.substring(5).toLowerCase()}`);

                        return (
                          <div 
                            key={ind.id} 
                            className={`p-3.5 border rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                              isSelected 
                                ? "bg-white border-[#2454d6]" 
                                : "bg-slate-50/40 border-slate-200/80 grayscale opacity-70"
                            }`}
                          >
                            <div className="space-y-1 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#2454d6] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-mono">
                                  {ind.id.toUpperCase()}
                                </span>
                                <span className="text-xs font-bold text-slate-800">{ind.domain}</span>
                              </div>
                              <p className="text-[11px] text-slate-505 leading-relaxed font-sans">{ind.description}</p>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {isSelected ? (
                                isMappedInText ? (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded border border-emerald-200 flex items-center gap-1 font-sans">
                                    <CheckCircle size={11} className="text-emerald-500" />
                                    Mapped & Compliant
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded border border-rose-200 flex items-center gap-1 font-sans animate-pulse">
                                    <AlertCircle size={11} className="text-rose-500" />
                                    Indicator Not Mapped
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded border border-slate-200 font-sans">
                                  Not Tagged
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                )}

                {/* Raw Markdown Tab */}
                {deckTab === "raw" && (
                  <div className="space-y-4 h-full flex flex-col" id="raw-tab-view">
                    
                    <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-150 shrink-0">
                      <div>
                        <strong className="text-xs text-slate-800 block">
                          {isEditing ? "Editable Code Area (Markdown Source)" : "Locked Raw Template Output"}
                        </strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5 leading-normal">
                          {isEditing ? "You can directly modify the markdown text below. Changes apply automatically to all preview tabs." : "Toggle 'Manual Code Edit' above or click the button to make manual changes."}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`cursor-pointer text-xs px-3.5 py-1.5 rounded-full font-extrabold transition-all border ${
                          isEditing ? "bg-slate-200 hover:bg-slate-350 text-slate-700 border-slate-300" : "bg-blue-600 hover:bg-blue-705 text-white border-blue-600"
                        }`}
                      >
                        {isEditing ? "Lock Code" : "Enable Code Editing"}
                      </button>
                    </div>

                    <div className="flex-grow flex flex-col min-h-[420px]">
                      <textarea
                        id="markdown-code-area-tab"
                        className="w-full flex-grow h-[460px] bg-slate-50/20 border border-slate-200 focus:ring-1 focus:ring-blue-500 p-4 rounded-xl text-xs font-mono leading-relaxed resize-none overflow-y-auto"
                        value={editorMarkdown}
                        onChange={(e) => setEditorMarkdown(e.target.value)}
                        readOnly={!isEditing}
                        placeholder="# Your Lesson Plan Markdown content will appear here..."
                      />
                    </div>

                  </div>
                )}

              </div>

          </div>

        </div>
      )}

      {/* 6. Saved Archive Tab view */}
      {activeView === "saved" && (
        <div className="bg-white border border-slate-200 rounded-[18px] p-5 shadow-sm space-y-4 animate-fadeIn" id="saved-history-log-panel">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <History size={17} className="text-[#2454d6]" />
                Syllabus Archive & Connected Logs
              </h2>
              <p className="text-[11px] text-slate-400">Previous drafts synchronized directly with connected Drive directory.</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveView("setup")}
                className={`cursor-pointer px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeView === "setup" ? "bg-white text-slate-805 shadow-xs border border-slate-200/55" : "text-slate-500 hover:text-slate-705"
                }`}
              >
                Registry
              </button>
              <button
                onClick={() => setActiveView("saved")}
                className={`cursor-pointer px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeView === "saved" ? "bg-white text-slate-805 shadow-xs border border-slate-200/55" : "text-slate-500 hover:text-slate-705"
                }`}
              >
                Archives
              </button>
            </div>
          </div>

          {[...localSavedPlans, ...files.filter(f => f.name.includes("Lesson_Plan_v1"))].length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="saved-cards-row">
              {[...localSavedPlans, ...files.filter(f => f.name.includes("Lesson_Plan_v1"))]
                .filter((f, idx, arr) => arr.findIndex(item => item.id === f.id) === idx)
                .map((plan) => (
                  <div key={plan.id} className="p-4 border border-slate-150 rounded-[14px] bg-[#f8fafc] flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-xs font-bold text-slate-800 truncate block max-w-[75%]" title={plan.name}>{plan.name}</strong>
                        <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 rounded font-bold font-mono uppercase shrink-0">Drive doc</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-mono block truncate select-all">{plan.path}</span>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-2">{plan.contentSum}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-150 text-[10px]">
                      <span className="text-slate-400 font-mono">Modified: {plan.modifiedAt ? new Date(plan.modifiedAt).toLocaleString() : "Recently synchronized"}</span>
                      <a
                        href={plan.webViewLink || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        Open File <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-10 text-center max-w-md mx-auto space-y-2" id="saved-empty-feedback">
              <FileCode className="text-slate-400 mx-auto" size={32} />
              <strong className="block text-xs font-bold text-slate-700">No active repository records found</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-normal">
                Once teaching packages are created and published, they are registered onto this central system register.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Simulation Warning Modal */}
      {showSimulatedDocWarning && warningPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowSimulatedDocWarning(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 flex flex-col gap-4 relative animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Info size={22} />
              </div>
              <div className="text-left">
                <h3 className="font-sans font-bold text-slate-900 text-sm">Drive Document Notice</h3>
                <p className="text-[11px] text-slate-400">Classroom Lesson Plan Registry</p>
              </div>
              <button 
                onClick={() => setShowSimulatedDocWarning(false)} 
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-left leading-relaxed text-slate-600">
              <p className="font-sans font-semibold text-slate-700 bg-amber-50/50 border border-amber-150 rounded-xl p-3">
                <strong>Notice:</strong> The default file link <code>{warningPlan.driveUrl}</code> is a placeholder representing the corresponding textbook resource inside your target Google Drive.
              </p>
              <p className="font-sans">
                Since you are in a secure developers' sandbox container, clicking this link directs to Google's standard 404 message ("file does not exist") unless configured with your own live workspace document.
              </p>
              <div className="bg-blue-50/50 border border-blue-150 rounded-xl p-4 space-y-2">
                <span className="font-mono text-[9px] text-[#2454d6] block font-extrabold uppercase tracking-widest">Connect Your Real Worksheet Instead</span>
                <p className="text-[10px] font-sans text-slate-600">
                  You can bind any live Google Drive docx or markdown file to this plan's registry index:
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={tempUrlValue}
                    onChange={(e) => setTempUrlValue(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                    placeholder="https://drive.google.com/file/d/.../view"
                  />
                  <button
                    onClick={() => {
                      handleUpdateDriveUrl(warningPlan.id, tempUrlValue);
                      setShowSimulatedDocWarning(false);
                      alert("Successfully updated registry document link!");
                    }}
                    className="cursor-pointer shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all"
                  >
                    Save URL
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowSimulatedDocWarning(false)}
                className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-semibold text-xs px-4 py-2 rounded-lg transition-all"
              >
                Close Dialog
              </button>
              <a
                href={warningPlan.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowSimulatedDocWarning(false)}
                className="cursor-pointer bg-[#2454d6] hover:bg-blue-750 text-white font-sans font-extrabold text-xs px-4 py-2 rounded-lg transition-all inline-flex items-center gap-1 shadow-sm"
              >
                <span>Open anyway</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Review Report Modal */}
      {reportPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="review-report-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 text-left">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">QA QUALITY COMPLIANCE</span>
                <h3 className="text-sm font-bold text-slate-800 mt-1">{reportPlan.topicName}</h3>
              </div>
              <button onClick={() => setReportPlan(null)} className="text-slate-400 hover:text-slate-600 font-extrabold cursor-pointer text-md">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Review Status</span>
                <span className={`inline-flex items-center gap-1 font-bold mt-0.5 px-2 py-0.5 rounded text-[11px] ${
                  getStatusLabelLocal(reportPlan) === "Approved"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-250"
                    : getStatusLabelLocal(reportPlan).startsWith("Defects")
                    ? "bg-rose-50 text-rose-800 border border-rose-200 font-mono"
                    : "bg-amber-50 text-amber-805 border border-amber-200"
                }`}>
                  {getStatusLabelLocal(reportPlan)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Audit Score</span>
                <span className="font-semibold text-slate-700 block mt-0.5">
                  {getStatusLabelLocal(reportPlan) === "Pending" ? "Pending Scan" : "8/8 Met"}
                </span>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-wider font-extrabold text-slate-400 uppercase">CBSE Rubric Mapping & Evidence Check</span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {[
                  { key: "outcomes", label: "Curriculum Alignment & Target Outcomes" },
                  { key: "timeboxed", label: "Syllabus Pacing & Time-boxed Duration Structure" },
                  { key: "experiential", label: "Art, Sports & Experiential Pedagogies" },
                  { key: "differentiation", label: "Worksheets & Scaffolds for Diverse Learners" },
                  { key: "homework", label: "Structured Homework & Class Tasks Assignments" },
                  { key: "parental", label: "Parent Bridges (Feedback Hooks / WhatsApp Triggers)" },
                  { key: "sqaa", label: "SQAA Matrix & Dynamic Assessment Indicators" },
                ].map((item) => {
                  const savedChecklist = reportPlan.checklist || {};
                  const status = savedChecklist[item.key] || "pass";
                  const isPass = status === "pass";
                  const isPending = status === "pending" || status === "under_review";
                  return (
                    <div key={item.key} className="flex items-center justify-between text-xs p-2 rounded-lg border border-slate-100 bg-white shadow-2xs">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isPass ? "bg-emerald-100 text-emerald-800" : isPending ? "bg-amber-100 text-amber-850" : "bg-rose-100 text-rose-800"
                      }`}>
                        {isPass ? "PASS" : isPending ? "PENDING" : "DEFECT DETECTED"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setReportPlan(null)} className="py-1.5 px-4 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-xs font-semibold cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
