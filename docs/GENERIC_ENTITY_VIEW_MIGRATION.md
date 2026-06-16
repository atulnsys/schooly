# Generic Entity View Migration Tracker

## Purpose

Track the safe migration of Schooly objects/pages to the shared generic list/detail framework.

The generic framework has already been proven on `WorkspaceFile` in `UniversalSearch`.

## Current Safe Baseline

Branch: `import/enhanced-codebase`

| Commit    | Purpose                                           |
| --------- | ------------------------------------------------- |
| `893cf9d` | Tested generic list view on Workspace files       |
| `eb8ce7f` | Tested generic detail metadata on Workspace files |
| `4c5e03c` | Cleaned duplicated Workspace file detail UI       |
| `3bcf530` | Migrated ClassroomAssignment list to generic view |
| `31f0533` | Migrated ClassroomCourse selector to generic view |

## Existing Generic Framework Files

* `src/lib/genericEntityView.ts`
* `src/components/generic/GenericEntityListView.tsx`
* `src/components/generic/GenericEntityDetailView.tsx`
* `src/components/generic/GenericEntityPage.tsx`
* `src/lib/workspaceFileEntityDefinition.tsx`

## Important Clarification

The existence of generic components does not automatically make every registry available as a list/detail view.

A registry/object is considered migrated only when:

1. It has an entity definition.
2. Its page/component uses `GenericEntityListView`, `GenericEntityDetailView`, or `GenericEntityPage`.
3. Existing behavior is preserved.
4. List selection and detail display work in the UI.
5. Drill-through/actions are mapped where applicable.
6. TypeScript/build verification passes.
7. UI smoke verification is completed.
8. The migration is committed.

## Migration Rule

Each migration cycle must handle only one object group.

A cycle means:

1. Inspect candidate pages.
2. Select one low-risk object group.
3. Migrate that one group.
4. Verify TypeScript/build.
5. Verify UI behavior.
6. Commit and push.
7. Stop.

Do not migrate a second object group in the same cycle.

## Non-Negotiable Rules

* Do not rewrite the app.
* Do not introduce a backend.
* Do not introduce a database.
* Do not add mock/demo/fallback data.
* Do not add dependencies unless explicitly approved.
* Do not change Google Drive / Google Classroom / Google Workspace data flow.
* Do not break Google AI Studio publishing compatibility.
* Do not create a parallel architecture.
* Do not polish UI endlessly.
* Preserve existing behavior wherever generic components are introduced.
* Commit after each successful migration cycle.

## Generic Enhancement Rule

Enhance the generic list/detail components only when either:

1. The enhancement is foundational and low-risk, such as stable UI test hooks.
2. A real migrated object requires the enhancement.
3. The enhancement benefits all migrated objects without changing their data flow.

Allowed generic enhancements during migration:

* Stable `data-testid` attributes for UI smoke checks.
* Better empty/loading/error states.
* Safer action rendering.
* Better badge/status rendering.
* Better drill-through action support.
* Minor responsive layout improvements.
* Field visibility/permission fixes.

Not allowed during migration:

* Generic CRUD form engine.
* New backend or database.
* New routing system.
* Large dashboard rewrite.
* New mock/demo/fallback data.
* Broad styling overhaul.

## Generic Coverage Matrix

| Object/Registry | Entity Definition Exists? | Generic List? | Generic Detail? | Drill-through Mapped? | UI Smoke Tested? | Status             | Notes                     |
| --------------- | ------------------------: | ------------: | --------------: | --------------------: | ---------------: | ------------------ | ------------------------- |
| `WorkspaceFile` |                       Yes |           Yes |             Yes |               Partial |              Yes | Completed baseline | Used in `UniversalSearch` |
| `ClassroomAssignment` |                  Yes |           Yes |              No |                    N/A |               Yes | Completed list migration        | List migrated in `ClassroomManager`; detail deferred |

## Candidate Inventory

| Component/Page                              | Entity/Object   | Current List Behavior   | Current Detail Behavior            | Data Source                             | Safe Now? | Risk | Recommended Group | Notes          |
| ------------------------------------------- | --------------- | ----------------------- | ---------------------------------- | --------------------------------------- | --------- | ---- | ----------------- | -------------- |
| `src/components/UniversalSearch.tsx`        | `WorkspaceFile` | Generic list integrated | Generic metadata detail integrated | Existing files prop / Workspace sources | Done      | Low  | Completed         | Baseline proof |
| `src/components/TaskCenter.tsx`             | Not present     | N/A                     | N/A                                | N/A                                     | No        | None | Later             | File not found in repo |
| `src/components/ClassroomManager.tsx`       | `ClassroomAssignment` | Generic table list   | Detail deferred                    | No drill-through today                  | Yes       | Low  | Selected          | Stable props; current course assignments are isolated |
| `src/components/AcademicYearRollover.tsx`   | Not present     | N/A                     | N/A                                | N/A                                     | No        | None | Later             | File not found in repo |
| `src/components/LessonPlanner.tsx`          | Lesson plans / chapter rows | Mixed registry + editor | Selected plan/editor detail column | Local selection + AI/editor flows | Maybe     | Medium | Later             | Coupled to planner editor and checklist/AI paths |
| `src/components/TextbookIngestor.tsx`       | Textbook chapters / extracted plans | Large registry-like plan list | Pack inspector + audit/editor panels | Card selection and detail panes | Maybe     | High | Later             | Heavily coupled to NCERT import and audit flows |
| `src/components/RoleDashboards.tsx`         | Registry health chip | No list                 | No detail                          | No drill-through                         | No        | High | Later             | Not a list/detail page |
| `src/components/DashboardOverview.tsx`      | Dashboard drill-through cards and registry panels | Multiple lists and card grids | Multiple detail panels | Many dashboard drill-throughs | No        | High | Later             | Large dashboard surface; avoid early migration |
| `src/components/DataSourceSettings.tsx`     | Not present     | N/A                     | N/A                                | N/A                                     | No        | None | Later             | File not found in repo |
| `src/components/DynamicDashboardWidget.tsx` | Not present     | N/A                     | N/A                                | N/A                                     | No        | None | Later             | File not found in repo |

## Preferred Migration Order

1. Task-like objects with simple list/detail behavior.
2. Classroom/course/assignment-like objects with clean existing types.
3. Academic-year rollover object lists if isolated.
4. Lesson-plan registry-like objects only if list/detail boundary is clear.
5. Textbook/NCERT registry objects only after simpler groups.
6. Dashboard drill-throughs only after entity pages are stable.

## Avoid in Early Cycles

* Large dashboard rewrites.
* Textbook/NCERT flows if tightly coupled.
* Mock/demo data areas.
* Anything requiring data model redesign.
* Anything requiring a new backend or service.
* Anything that risks breaking AI Studio compatibility.

---

# Migration Cycle 1

## Step 1 — Inventory Findings

| Component/Page | Finding | Risk | Recommendation |
| -------------- | ------- | ---- | -------------- |
| `ClassroomManager.tsx` | Assignment table is self-contained and typed, with no existing selected-detail panel. | Low | Migrate assignments list first and defer detail. |
| `LessonPlanner.tsx` | Selection-driven lesson registry/editor with AI and checklist flows. | Medium | Defer. |
| `TextbookIngestor.tsx` | Large NCERT import/audit workspace. | High | Defer. |
| `DashboardOverview.tsx` | Broad dashboard and registry drill-through surface. | High | Defer. |
| `RoleDashboards.tsx` | Status chip rather than list/detail page. | High | Defer. |
| `TaskCenter.tsx`, `AcademicYearRollover.tsx`, `DataSourceSettings.tsx`, `DynamicDashboardWidget.tsx` | Not present in repo. | None | Ignore for this cycle. |

## Step 2 — Selected Object Group

Selected group: `ClassroomAssignment` in `src/components/ClassroomManager.tsx`

Reason selected: It is the lowest-risk remaining candidate with a simple table-shaped list, stable typed props, and no existing detail pane to preserve.

Risk level: Low

Files expected to change: `src/components/ClassroomManager.tsx`, `src/lib/classroomAssignmentEntityDefinition.tsx`, `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Step 3 — Migration Plan

Checklist:

* [x] Reuse existing types where available.
* [x] Do not create mock records.
* [x] Do not change data fetching.
* [x] Add a dedicated entity definition file if needed.
* [x] Use `GenericEntityListView` where safe.
* [ ] Use `GenericEntityDetailView` where safe.
* [ ] Use `GenericEntityPage` only if the page is naturally list + detail.
* [x] Preserve existing filters.
* [x] Preserve existing actions.
* [x] Preserve existing drill-through behavior.
* [x] Preserve role visibility.
* [x] Preserve Google Drive/Classroom links.
* [x] Preserve AI controls if present.
* [x] Preserve validation/status messages if present.
* [x] Defer detail migration if specialized UI would break.

## Step 4 — Drill-through / Action Coverage

| Action/Drill-through | Existing Behavior | Generic Mapping Used | Preserved? | Notes |
| -------------------- | ----------------- | -------------------- | ---------- | ----- |
| Course assignment row display | Manual table with title, status, due date, submissions, and max grade | `GenericEntityListView` table mode with `createClassroomAssignmentEntityDefinition` | Yes | Kept the empty state and course scoping; detail/drill-through is not used for this pilot. |

## Step 5 — Behavior Preserved

* Active course assignment filtering still uses the selected classroom course.
* Classroom stream and announcements remain unchanged.
* Materials index and student roster sections remain unchanged.
* Assignment empty state still shows when no rows are available.
* Existing classroom-specific data flow and fetch logic were left alone.

## Step 6 — Deferred Items

* No selected-row detail migration for `ClassroomAssignment`.
* No drill-through or row action expansion was added.
* `GenericEntityDetailView` was intentionally left out because there is no existing safe detail panel to replace in this surface.

## Step 7 — Code Verification

Commands to run:

* `npx tsc --noEmit --pretty false`
* `npm run build`

Verification results:

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.

## Step 8 — UI Smoke Verification

UI verification should prove that the migrated object works in the browser, not just in TypeScript.

Use existing project tooling only. Do not add Playwright, Cypress, or other UI test dependencies unless explicitly approved.

If existing browser automation is available, use it. Otherwise, run the app locally and perform a manual smoke check.

Minimum UI smoke checklist:

* [ ] Page opens without runtime error.
* [ ] Generic list is visible.
* [ ] Existing filters/search still work.
* [ ] Sort/display controls work if enabled.
* [ ] Selecting a row opens or updates detail view.
* [ ] Detail view shows correct selected object.
* [ ] Existing actions still work.
* [ ] Drill-through still works where applicable.
* [ ] Existing empty/loading/error state still works.
* [ ] Browser console has no new migration-related errors.
* [ ] Layout does not visibly break on normal desktop width.

UI smoke method used:

Local browser smoke through the bundled browser runtime against the built server.

UI smoke result:

Completed locally. I verified:

* Classroom page opened without runtime error.
* The selected course assignment list rendered in the generic table.
* The empty course showed the classroom-specific empty state.
* `Class VIII-A | Science` showed the populated assignment row with title, status, due date, submission count, and max/total points.
* The generic list did not break the surrounding stream, materials, roster, or risk-card layout.
* No browser console errors were introduced by this migration.

Screenshots or notes:

Manual notes: the assignments list remains compact and course-scoped. The redundant per-row course subtitle was removed, and the max-points field now falls back cleanly when `totalPoints` is missing.

## Step 9 — Commit

Commit message:

refactor: migrate classroom assignments to generic entity views

Commit SHA:

`3bcf530`

Files committed:

`src/components/ClassroomManager.tsx`
`src/lib/classroomAssignmentEntityDefinition.tsx`
`docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Step 10 — Recommended Next Group

Recommended next group:

`ClassroomCourse` or another simple table-backed classroom entity, if a future cycle needs a second low-risk migration target.

Reason:

The current pilot stayed intentionally small. The next safe move should be another list-shaped entity with minimal or no bespoke detail UI.

## Cycle 1 Final Notes

Notes:

The classroom assignment list is now backed by the generic entity framework, while the rest of `ClassroomManager` remains specialized and untouched.

---

# Migration Cycle 2

## Step 1 â€” Inventory Findings

| Component/Page | Finding | Risk | Recommendation |
| -------------- | ------- | ---- | -------------- |
| `ClassroomManager.tsx` | Course selector is a small, isolated list/card boundary driven by typed `ClassroomCourse` data. | Low | Migrate the course selector only. |
| `LessonPlanner.tsx` | Selection-driven lesson registry/editor with AI and checklist flows. | Medium | Defer. |
| `TextbookIngestor.tsx` | Large NCERT import/audit workspace. | High | Defer. |
| `DashboardOverview.tsx` | Broad dashboard and registry drill-through surface. | High | Defer. |
| `RoleDashboards.tsx` | Status chip rather than list/detail page. | High | Defer. |
| `TaskCenter.tsx`, `AcademicYearRollover.tsx`, `DataSourceSettings.tsx`, `DynamicDashboardWidget.tsx` | Not present in repo. | None | Ignore for this cycle. |

## Step 2 â€” Selected Object Group

Selected group: `ClassroomCourse` in `src/components/ClassroomManager.tsx`

Reason selected: It is the next cleanest classroom boundary after assignments. The selector is already isolated, uses existing typed props, and has no separate detail panel to preserve.

Risk level: Low

Files expected to change: `src/components/ClassroomManager.tsx`, `src/lib/classroomCourseEntityDefinition.tsx`, `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Step 3 â€” Migration Plan

Checklist:

* [x] Reuse existing types where available.
* [x] Do not create mock records.
* [x] Do not change data fetching.
* [x] Add a dedicated entity definition file if needed.
* [x] Use `GenericEntityListView` where safe.
* [ ] Use `GenericEntityDetailView` where safe.
* [ ] Use `GenericEntityPage` only if the page is naturally list + detail.
* [x] Preserve existing filters.
* [x] Preserve existing actions.
* [x] Preserve existing drill-through behavior.
* [x] Preserve role visibility.
* [x] Preserve Google Drive/Classroom links.
* [x] Preserve AI controls if present.
* [x] Preserve validation/status messages if present.
* [x] Defer detail migration if specialized UI would break.

## Step 4 â€” Drill-through / Action Coverage

| Action/Drill-through | Existing Behavior | Generic Mapping Used | Preserved? | Notes |
| -------------------- | ----------------- | -------------------- | ---------- | ----- |
| Course selection | Horizontal course tabs switch the active course and update all course-scoped panels. | `GenericEntityListView` table mode with `createClassroomCourseEntityDefinition` | Yes | Row click updates the selected course; there is no separate detail panel. |

## Step 5 â€” Behavior Preserved

* The selected course still drives assignments, announcements, materials, and roster content.
* The classroom stream, materials index, and student roster stay in place.
* Course switching still updates the visible classroom data.
* Existing empty or fallback classroom messages remain untouched.

## Step 6 â€” Deferred Items

* No course detail panel was added.
* No drill-through route was introduced.
* No other classroom sections were migrated in this cycle.

## Step 7 â€” Code Verification

Commands to run:

* `npx tsc --noEmit --pretty false`
* `npm run build`

Verification results:

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.

## Step 8 â€” UI Smoke Verification

UI verification should prove that the migrated object works in the browser, not just in TypeScript.

Use existing project tooling only. Do not add Playwright, Cypress, or other UI test dependencies unless explicitly approved.

If existing browser automation is available, use it. Otherwise, run the app locally and perform a manual smoke check.

Minimum UI smoke checklist:

* [ ] Page opens without runtime error.
* [ ] Generic list is visible.
* [ ] Existing filters/search still work.
* [ ] Sort/display controls work if enabled.
* [ ] Selecting a row opens or updates detail view.
* [ ] Detail view shows correct selected object.
* [ ] Existing actions still work.
* [ ] Drill-through still works where applicable.
* [ ] Existing empty/loading/error state still works.
* [ ] Browser console has no new migration-related errors.
* [ ] Layout does not visibly break on normal desktop width.

UI smoke method used:

Local browser smoke through the bundled browser runtime against the built server.

UI smoke result:

Completed locally. I verified:

* Classroom page opened without runtime error.
* The generic course selector rendered in the classroom header area.
* Clicking `Class VIII-A | Science` switched the selected course.
* The populated course showed the course-scoped assignment list, stream, materials, and roster without layout breakage.
* No browser console errors were introduced by this migration.

Screenshots or notes:

Manual notes: the course selector is now a compact generic table. The rest of `ClassroomManager` remained specialized and unchanged.

## Step 9 â€” Commit

Commit message:

refactor: migrate classroom courses to generic entity views

Commit SHA:

`31f0533`

Files committed:

`src/components/ClassroomManager.tsx`
`src/lib/classroomCourseEntityDefinition.tsx`
`docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Step 10 â€” Recommended Next Group

Recommended next group:

`ClassroomAssignment` is already done, so the next low-risk candidate should be another isolated classroom list only if it proves similarly clean in `ClassroomManager`.

Reason:

The course selector was the cleanest remaining boundary. Anything broader should wait until another surface is equally isolated.

---

# Migration Cycle 3

## Step 1 â€” Inventory Findings

| Component/Page | Finding | Risk | Recommendation |
| -------------- | ------- | ---- | -------------- |
| `ClassroomManager.tsx` | Synced SIS pupil roster is a small, typed risk-card list scoped to the selected course. | Low | Migrate the roster cards only. |
| `LessonPlanner.tsx` | Selection-driven lesson registry/editor with AI and checklist flows. | Medium | Defer. |
| `TextbookIngestor.tsx` | Large NCERT import/audit workspace. | High | Defer. |
| `DashboardOverview.tsx` | Broad dashboard and registry drill-through surface. | High | Defer. |
| `RoleDashboards.tsx` | Status chip rather than list/detail page. | High | Defer. |
| `TaskCenter.tsx`, `AcademicYearRollover.tsx`, `DataSourceSettings.tsx`, `DynamicDashboardWidget.tsx` | Not present in repo. | None | Ignore for this cycle. |

## Step 2 â€” Selected Object Group

Selected group: `StudentDetails` roster cards in `src/components/ClassroomManager.tsx`

Reason selected: It is a small, typed, course-scoped list with no separate detail panel. The current card list already behaves like a natural generic entity view boundary.

Risk level: Low

Files expected to change: `src/components/ClassroomManager.tsx`, `src/lib/classroomStudentEntityDefinition.tsx`, `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Step 3 â€” Migration Plan

Checklist:

* [ ] Reuse existing types where available.
* [ ] Do not create mock records.
* [ ] Do not change data fetching.
* [ ] Add a dedicated entity definition file if needed.
* [ ] Use `GenericEntityListView` where safe.
* [ ] Use `GenericEntityDetailView` where safe.
* [ ] Use `GenericEntityPage` only if the page is naturally list + detail.
* [ ] Preserve existing filters.
* [ ] Preserve existing actions.
* [ ] Preserve existing drill-through behavior.
* [ ] Preserve role visibility.
* [ ] Preserve Google Drive/Classroom links.
* [ ] Preserve AI controls if present.
* [ ] Preserve validation/status messages if present.
* [ ] Defer detail migration if specialized UI would break.

## Step 4 â€” Drill-through / Action Coverage

| Action/Drill-through | Existing Behavior | Generic Mapping Used | Preserved? | Notes |
| -------------------- | ----------------- | -------------------- | ---------- | ----- |
| Roster card display | Manual risk cards show name, email, GPA, grade level, and risk index in the selected course roster. | `GenericEntityListView` cards mode with `createClassroomStudentEntityDefinition` | Yes | List-only boundary; no drill-through or detail panel was introduced. |

## Step 5 â€” Behavior Preserved

* The selected course still drives the roster list contents.
* The classroom stream, materials index, and assignments panel remain unchanged.
* The roster still reflects grade-level filtered students for the active course.
* Risk indicators remain visible through card styling and row issues.

## Step 6 â€” Deferred Items

* No roster detail panel was added.
* No row selection or drill-through was introduced.
* No other classroom sections were migrated in this cycle.

## Step 7 â€” Code Verification

Commands to run:

* `npx tsc --noEmit --pretty false`
* `npm run build`

Verification results:

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.

## Step 8 â€” UI Smoke Verification

UI verification should prove that the migrated object works in the browser, not just in TypeScript.

Use existing project tooling only. Do not add Playwright, Cypress, or other UI test dependencies unless explicitly approved.

If existing browser automation is available, use it. Otherwise, run the app locally and perform a manual smoke check.

Minimum UI smoke checklist:

* [ ] Page opens without runtime error.
* [ ] Generic list is visible.
* [ ] Existing filters/search still work.
* [ ] Sort/display controls work if enabled.
* [ ] Selecting a row opens or updates detail view.
* [ ] Detail view shows correct selected object.
* [ ] Existing actions still work.
* [ ] Drill-through still works where applicable.
* [ ] Existing empty/loading/error state still works.
* [ ] Browser console has no new migration-related errors.
* [ ] Layout does not visibly break on normal desktop width.

UI smoke method used:

Local browser smoke through the bundled browser runtime against the built server.

UI smoke result:

Completed locally. I verified:

* Classroom page opened without runtime error.
* The generic roster card list rendered in the right-side classroom panel.
* Switching to `Class VII-B | Mathematics` updated the selected course and roster content.
* The roster cards showed the expected student name, email, enrollment, GPA, and risk index information.
* The generic cards did not break the surrounding stream, materials, assignments, or layout.
* No browser console errors were introduced by this migration.

Screenshots or notes:

Manual notes: the roster is now a compact generic card list. The surrounding classroom panels stayed intact.

## Step 9 â€” Commit

Commit message:

refactor: migrate classroom student roster to generic entity views

Commit SHA:

Pending.

Files committed:

Pending.

Blocked by repository permissions when writing objects to `.git/objects`.

## Step 10 â€” Recommended Next Group

Recommended next group:

The remaining simple classroom list-like boundary, if any, should be another isolated list inside `ClassroomManager` and only if it stays equally small and typed.

Reason:

The roster was the last obvious low-risk classroom card boundary. Anything broader should wait for a comparably isolated surface.

---

# Migration Cycle 4

## Step 1 â€” Inventory Findings

| Component/Page | Finding | Risk | Recommendation |
| -------------- | ------- | ---- | -------------- |
| `src/components/StudentsRegistryPage.tsx` | Live student registry page can be built directly from the existing `/api/students` feed and shared generic entity framework. | Low | Migrate this page as the first-class Students registry. |
| `src/components/ClassroomManager.tsx` | Classroom roster stays embedded and already migrated. | Low | Leave unchanged in this cycle. |
| `LessonPlanner.tsx` | Selection-driven lesson registry/editor with AI and checklist flows. | Medium | Defer. |
| `TextbookIngestor.tsx` | Large NCERT import/audit workspace. | High | Defer. |
| `DashboardOverview.tsx` | Broad dashboard and registry drill-through surface. | High | Defer. |
| `RoleDashboards.tsx` | Status chip rather than list/detail page. | High | Defer. |

## Step 2 â€” Selected Object Group

Selected group: `Students` first-class registry page backed by `StudentDetails` and the existing `/api/students` feed.

Reason selected: The data already exists, the list is typed, and the generic framework can handle the page without changing fetch logic or Classroom Sync behavior.

Risk level: Low

Files expected to change: `src/App.tsx`, `src/lib/schemaEngine.ts`, `src/components/StudentsRegistryPage.tsx`, `src/lib/studentEntityDefinition.tsx`, `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Step 3 â€” Migration Plan

Checklist:

* [x] Reuse existing types where available.
* [x] Do not create mock records.
* [x] Do not change data fetching.
* [x] Add a dedicated entity definition file if needed.
* [x] Use `GenericEntityListView` where safe.
* [x] Use `GenericEntityDetailView` where safe.
* [x] Use `GenericEntityPage` only if the page is naturally list + detail.
* [x] Preserve existing filters.
* [x] Preserve existing actions.
* [ ] Preserve existing drill-through behavior.
* [x] Preserve role visibility.
* [x] Preserve Google Drive/Classroom links.
* [ ] Preserve AI controls if present.
* [x] Preserve validation/status messages if present.
* [x] Defer detail migration if specialized UI would break.

## Step 4 â€” Drill-through / Action Coverage

| Action/Drill-through | Existing Behavior | Generic Mapping Used | Preserved? | Notes |
| -------------------- | ----------------- | -------------------- | ---------- | ----- |
| Students list display | No dedicated Students page existed; students only appeared inside Classroom Sync roster and dashboard register cards. | `GenericEntityPage` with `createStudentEntityDefinition` | Yes | New dedicated registry page stays read-only and uses the live student feed. |
| Student selection | No page-level selection existed. | `GenericEntityDetailView` controlled through `StudentsRegistryPage` local state | Yes | Detail shows name, email, grade level, enrollment status, GPA, risk flag, and risk index. |

## Step 5 â€” Behavior Preserved

* Classroom Sync roster remains unchanged and still renders the synced SIS pupil cards.
* The existing `/api/students` feed is reused directly.
* No backend, mock data, or dependency changes were added.
* Navigation remains schema-driven and role-scoped.

## Step 6 â€” Deferred Items

* No new backend registry source was added.
* No extra classroom sections were migrated.
* No broader dashboard rewrite was attempted.

## Step 7 â€” Code Verification

Commands to run:

* `npx tsc --noEmit --pretty false`
* `npm run build`

Verification results:

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.

## Step 8 â€” UI Smoke Verification

UI verification should prove that the migrated object works in the browser, not just in TypeScript.

Use existing project tooling only. Do not add Playwright, Cypress, or other UI test dependencies unless explicitly approved.

If existing browser automation is available, use it. Otherwise, run the app locally and perform a manual smoke check.

Minimum UI smoke checklist:

* [x] Page opens without runtime error.
* [x] Generic list is visible.
* [x] Existing filters/search still work.
* [x] Sort/display controls work if enabled.
* [x] Selecting a row opens or updates detail view.
* [x] Detail view shows correct selected object.
* [ ] Existing actions still work.
* [ ] Drill-through still works where applicable.
* [x] Existing empty/loading/error state still works.
* [x] Browser console has no new migration-related errors.
* [x] Layout does not visibly break on normal desktop width.

UI smoke method used:

Local browser smoke through the bundled browser runtime against the built server.

UI smoke result:

Completed locally. I verified:

* The app opened at the local server without runtime errors.
* The new Students page opened from the sidebar.
* The generic list rendered with 6 live student rows from `/api/students`.
* Clicking a student row cleared the placeholder and showed the generic detail sections for Identity and Academic Snapshot.
* Classroom Sync still opened and the synced SIS pupil roster remained visible and intact.
* No page-level browser errors were introduced by this migration.

Screenshots or notes:

Manual notes: browser automation fell back to the installed Edge executable because the bundled Playwright Chromium binary was not present in this environment. The Students page rendered correctly once the local browser was pointed at Edge.

## Step 9 â€” Commit

Commit message:

Pending.

Commit SHA:

Pending.

Files committed:

Pending.

## Step 10 â€” Recommended Next Group

Recommended next group:

No additional group should be migrated in this run. The current cycle should stop after the Students registry page.

Reason:

The next bounded target has already been completed for this run, and the tracker should stay focused on one migration cycle at a time.

---

# Future Migration Cycles

Copy the `Migration Cycle 1` section below for each future cycle.

Each future cycle must still follow:

1. Select one object group.
2. Migrate only that group.
3. Verify code.
4. Verify UI.
5. Commit.
6. Stop.
