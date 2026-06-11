# Schooly AI — Local Drive & Manifest Applet Integration

The Schooly AI client-server application integrates with the School Digital Operating System (SDOS) directory setup by utilizing the generated `schooly-drive-manifest.json` schema. This file binds operational workspaces to dynamic front-end widgets without needing background database systems.

---

## 1. Governance Console: School Drive Structure
* **Location**: *System Governance* Dashboard -> Bottom Panel: **"School Drive Structure"**.
* **Utility**: Admins use this workspace to browse compiled directory structures outside of live Google Workspace environments.
* **Component Features**:
  1. **School Areas Switcher**: Instantly filters directories matching the core Three-World model (Academic Repository, Google Classroom Templates, and School Governance) and three supporting structures (Forms Intake, Dashboard Data, and Org Structure / Staff & Groups).
  2. **Folder Path Preview**: Leverages `repositoryStages`, `repositoryClasses`, `repositorySections`, and `repositorySubjects` from the manifest to render an interactive cascade. Selecting values instantly compiles and previews the mapped directory path context.
  3. **Visual Document Browser**: Lists the standard diagnostic plans and evaluation files generated when `-WithSampleFiles` is specified (e.g. `README.md`, `sample_lesson_plan.md`, `sample_quiz.md`, `sample_assignment.md`, `sample_assessment_bank.md`, and `sample_rubric.md`).
  4. **Structure File Check**: Supports uploading local registry manifest copies. Instantly triggers validations checking 16 key requirements, registering verification success states within the local session.

---

## 2. Integrated Academic Copilots & Planner
* **Location**: *Curriculum AI Planner* -> Workspace: **"AI Assistants"** / **"Universal Search"**.
* **Utility**: When teachers use the Curriculum AI Planner (`AIAssistants.tsx`) to draft interactive study plans, quizzes, or rubrics, they select active repository contexts directly mapped from the loaded SDOS subject branches.
* **Flow**:
  1. The assistant matches the active teacher stage and subject against `repositoryStages` and `repositorySubjects` from the master manifest.
  2. The generated output structures (e.g., standard evaluation rubrics) are automatically configured with percentages summing to exactly **100%**, preventing inconsistent calculation metrics.
  3. If a teacher requests exporting generated files, the app maps the target export destination to the precise SDOS folder path (e.g., `C:\SchoolyTestDrive\Academic Repository\AY 2026-27\Secondary\Class X\Class X-A\Mathematics\02_Chapter_Resources`).

---

## 3. Strict Student Separation Rules
* Under standard LMS arrangements, students collaborate on Google Classroom delivery layers.
* However, students are **strictly walled off** from World 1 (`Academic Repository`) and World 3 (`School Governance`).
* No student-facing panels or views inside the Schooly AI application render or expose elements referencing the central `C:\SchoolyTestDrive\Academic Repository` physical index. This keeps high-stakes diagnostic assessment archives safe from leakages.

---

## 4. Universal Search Integration
* The central Search engine incorporates SDOS folder structures under indexed document parameters.
* When administrators search for terms (such as "Curriculum", "Compliance", "IT Directory", or "Lesson Plan"), the system resolves items by querying mapped fields in `schooly-drive-manifest.json` alongside dynamic files, yielding high-speed localized file previews.

---
*Maintained by the Schooly AI Enterprise Systems Committee — 2026.*
