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
| `b0577dc` | Implemented teacher/course/assignment registry pages |
| `c2e12f0` | Fixed Students registry discoverability in nav    |
| `1d8e3cb` | Added registry catalog and first-class Students page |
| `d35334b` | Reconciled generic registry migration tracker     |

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

`1f9eb7c`

Files committed:

`src/components/ClassroomManager.tsx`
`src/lib/classroomStudentEntityDefinition.tsx`
`docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

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

feat: add registry catalog for generic entity pages

Commit SHA:

`1d8e3cb`

Files committed:

`docs/GENERIC_ENTITY_VIEW_MIGRATION.md`
`src/components/StudentsRegistryPage.tsx`
`src/lib/registryCatalog.tsx`

## Step 10 â€” Recommended Next Group

Recommended next group:

No additional group should be migrated in this run. The current cycle should stop after the Students registry page.

Reason:

The next bounded target has already been completed for this run, and the tracker should stay focused on one migration cycle at a time.

## Follow-up Fix â€” Students Discoverability

* Before this fix, the Students page was present in code but not reliably visible in the sidebar because the active schema could come from older local storage state and the Students item was placed in a less visible nav section.
* `/students` now opens the Students registry page directly after the route-to-tab bridge was added in `App.tsx`.
* Sidebar visibility for Principal was fixed by normalizing the loaded schema and placing Students under `Teaching & Learning`.
* The Active Students KPI now drills through to Students.
* The Synced SIS Pupil Roster panel now includes a `View all students` button.

---

# Migration Cycle 5

## Step 1 â€” Inventory Findings

| Component/Page | Finding | Risk | Recommendation |
| -------------- | ------- | ---- | -------------- |
| `src/components/StudentsRegistryPage.tsx` | Live student registry page is already isolated and typed. | Low | Keep as the first-class Students page. |
| `src/components/TeachersRegistryPage.tsx` | Live teacher registry can be built directly from the existing `/api/teachers` feed. | Low | Migrate as a first-class registry page. |
| `src/components/ClassroomCoursesRegistryPage.tsx` | Synced classroom course feed is already typed and isolated. | Low | Migrate as a first-class registry page. |
| `src/components/ClassroomAssignmentsRegistryPage.tsx` | Synced classroom assignment feed is typed and can reuse the same generic list/detail framework. | Low | Migrate as a first-class registry page. |
| `LessonPlanner.tsx` | Selection-driven lesson registry/editor with AI and checklist flows. | Medium | Defer. |
| `TextbookIngestor.tsx` | Large NCERT import/audit workspace. | High | Defer. |
| `DashboardOverview.tsx` | Broad dashboard and registry drill-through surface. | High | Defer. |
| `RoleDashboards.tsx` | Status chip rather than list/detail page. | High | Defer. |

## Step 2 â€” Selected Object Group

Selected group: `People & Classroom` registry pages

Reason selected: These are the next low-risk, typed, list-shaped registry surfaces already powered by live feeds and the generic entity framework. They can be added without changing backend access, mock data, or classroom data flow.

Risk level: Low

Files expected to change: `src/App.tsx`, `src/components/DashboardOverview.tsx`, `src/components/TeachersRegistryPage.tsx`, `src/components/ClassroomCoursesRegistryPage.tsx`, `src/components/ClassroomAssignmentsRegistryPage.tsx`, `src/lib/teacherEntityDefinition.tsx`, `src/lib/classroomCourseEntityDefinition.tsx`, `src/lib/classroomAssignmentEntityDefinition.tsx`, `src/lib/schemaEngine.ts`, `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Step 3 â€” Migration Plan

Checklist:

* [x] Reuse existing types where available.
* [x] Do not create mock records.
* [x] Do not change data fetching.
* [x] Add dedicated entity definition files where needed.
* [x] Use `GenericEntityListView` where safe.
* [x] Use `GenericEntityPage` for the new registry pages.
* [x] Preserve existing filters.
* [x] Preserve existing actions.
* [x] Preserve role visibility.
* [x] Preserve Google Drive/Classroom links.
* [x] Preserve AI controls if present.
* [x] Preserve validation/status messages if present.
* [x] Defer detail migration if specialized UI would break.

## Step 4 â€” Behavior Preserved

* Students remains the first-class dedicated registry page.
* Classroom Sync still owns the embedded roster and course-scoped classroom panels.
* Existing classroom data fetching stayed unchanged.
* Surrounding dashboard and classroom sections remain intact.
* Generic pages now reuse the same live `/api/students`, `/api/teachers`, `/api/classroom/courses`, and `/api/classroom/assignments` feeds.

## Step 5 â€” Deferred Items

* No broad dashboard rewrite.
* No new backend or mock data.
* No LessonPlanner or TextbookIngestor migration.
* No extra registry groups beyond People & Classroom.

## Step 6 â€” Code Verification

Commands to run:

* `npx tsc --noEmit --pretty false`
* `npm run build`

Verification results:

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.

## Step 7 â€” UI Smoke Verification

UI verification should prove that the migrated pages work in the browser, not just in TypeScript.

Use existing project tooling only. Do not add Playwright, Cypress, or other UI test dependencies unless explicitly approved.

UI smoke method used:

Local browser smoke through the bundled browser runtime against the built server, using the system Edge executable.

UI smoke result:

Completed locally. I verified:

* The app opened at `http://127.0.0.1:3000` without runtime errors.
* The sidebar showed Students, Teachers, Classroom Courses, and Assignments for Principal.
* Direct routes `/students`, `/teachers`, `/courses`, and `/assignments` opened the correct registry pages.
* The generic lists rendered live rows from the existing feeds.
* The course assignment page no longer duplicated the course name in the row subtitle.
* No page-level browser errors were introduced by this migration.

## Step 8 â€” Commit

Commit message:

feat: implement generic entity view migration for courses, assignments, and teachers registries

Commit SHA:

`b0577dc`

Files committed:

`src/App.tsx`
`src/components/ClassroomAssignmentsRegistryPage.tsx`
`src/components/ClassroomCoursesRegistryPage.tsx`
`src/components/DashboardOverview.tsx`
`src/components/StudentsRegistryPage.tsx`
`src/components/TeachersRegistryPage.tsx`
`src/lib/classroomAssignmentEntityDefinition.tsx`
`src/lib/classroomCourseEntityDefinition.tsx`
`src/lib/schemaEngine.ts`
`src/lib/teacherEntityDefinition.tsx`

## Step 9 â€” Recommended Next Group

Recommended next group:

No additional group should be migrated in this run.

Reason:

This cycle already covered the bounded People & Classroom registry set. The next run should pick a fresh low-risk boundary if needed.

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

---

# Grouped Migration Cycle â€” Registry Catalog and First-Class Registry Pages

## Registry Inventory

| Registry | Status | Why | Route |
| -------- | ------ | --- | ----- |
| Students | Active generic registry | Already backed by `/api/students` and a dedicated generic page. | `/students` |
| Teachers | Active generic registry | Already backed by `/api/teachers` and a dedicated generic page. | `/teachers` |
| Staff | Active generic registry | Backed by `Staff_Directory` from the live master registry. | `/staff` |
| Classroom Courses | Active generic registry | Already backed by `/api/classroom/courses` and a dedicated generic page. | `/courses` |
| Assignments | Active generic registry | Already backed by `/api/classroom/assignments` and a dedicated generic page. | `/assignments` |
| Classroom Roster / SIS pupils | Deferred: not a registry | Safe embedded classroom surface; do not split into another page yet. | Embedded in `/classroom` |
| Workspace Files | Active via Search/UniversalSearch | Already exposed through Search / UniversalSearch rather than a separate registry page. | `/search` |
| Lesson Plans | Custom List & Detail View | Selection-driven lesson workspace that stays specialized. | `/lesson-plans` |
| LessonPlanner editor/checklist/AI flows | Custom workflow | AI-assisted editing and workflow controls stay specialized. | `/lesson-plans` |
| TextbookIngestor / NCERT ingestion | Custom workflow | NCERT import and audit flow stays specialized. | `/textbooks` |
| DashboardOverview broad cards | Dashboard surface | Broad dashboard panels stay dashboard-only. | `/overview` |
| RoleDashboards broad role dashboards | Dashboard surface | Role dashboard cards stay dashboard-only. | `/role-cards` |
| Compliance Monitoring | Deferred: dashboard-only metric | Uses dashboard source data and chip-style panels only. | Dashboard-only |
| Assessment Tracking | Deferred: dashboard-only metric | Uses dashboard source data and chip-style panels only. | Dashboard-only |
| SQAA Evidence | Deferred: dashboard-only metric | Uses dashboard source data and chip-style panels only. | Dashboard-only |
| Remedial Feed | Deferred: dashboard-only metric | Uses dashboard source data and chip-style panels only. | Dashboard-only |
| Dashboard alerts | Dashboard surface | Alert cards stay on the dashboard surface. | Dashboard-only |
| Registry health/status chips | Deferred: not a registry | Status chips are health indicators, not registries. | Dashboard-only |

## Active Registries

The registry catalog now exposes these first-class generic pages:

* Students
* Teachers
* Staff
* Classroom Courses
* Assignments

## Deferred Registries And Why

* Classroom roster / SIS pupils: keep embedded in Classroom Sync.
* Workspace files: already handled by the Search experience.
* Lesson plans: tightly coupled to planner editing and AI flows.
* NCERT textbooks: tightly coupled to textbook ingestion and audit flows.

## Routes Added

* `/students`
* `/teachers`
* `/staff`
* `/courses`
* `/assignments`

## Navigation Added

* Students
* Teachers
* Staff
* Courses
* Assignments

## Drill-Throughs Added

* Active Students KPI -> Students
* Active Staff KPI -> Teachers
* Staff register card -> Staff
* Active Class Sections -> Courses
* Google Classroom Courses -> Courses
* Classroom Monitoring `Total Classrooms` -> Courses
* Classroom Monitoring `Assignments` -> Assignments
* Synced SIS Pupil Roster `View all students` -> Students

## Code Verification

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.

## UI Smoke Verification

Completed locally against the live app at `http://127.0.0.1:3000`.

Checked:

* Sidebar showed Students, Teachers, Courses, and Assignments for Principal.
* `/students` opened and rendered a generic registry list/detail page.
* `/teachers` opened and rendered a generic registry list/detail page.
* `/staff` opened and rendered a generic registry list/detail page.
* `/courses` opened and rendered a generic registry list/detail page.
* `/assignments` opened and rendered a generic registry list/detail page.
* Dashboard drill-throughs for Active Staff, Staff, Active Class Sections, Google Classroom Courses, and Assignments navigated to the right pages.
* Classroom Sync still rendered and `View all students` worked.
* Lessons Workspace and NCERT Textbooks routes still opened.
* Search still opened.
* No page-level browser errors were introduced.

## Files Changed

* `src/lib/registryCatalog.tsx`
* `src/components/RegistryPageShell.tsx`
* `src/components/StudentsRegistryPage.tsx`
* `src/components/TeachersRegistryPage.tsx`
* `src/components/ClassroomCoursesRegistryPage.tsx`
* `src/components/ClassroomAssignmentsRegistryPage.tsx`
* `src/components/StaffRegistryPage.tsx`
* `src/components/DashboardOverview.tsx`
* `src/lib/schemaEngine.ts`
* `src/lib/staffEntityDefinition.tsx`
* `src/lib/classroomCourseEntityDefinition.tsx`
* `src/lib/classroomAssignmentEntityDefinition.tsx`
* `src/lib/teacherEntityDefinition.tsx`

## Commit SHAs Recorded

* `b0577dc` â€” prior checkpoint for the people/classroom registry page migration
* `c2e12f0` â€” Students discoverability fix
* `1d8e3cb` â€” registry catalog and first-class Students registry page
* `d35334b` â€” tracker reconciliation checkpoint

## Tracker Changes Made

* Added `b0577dc` to the baseline checkpoint table.
* Added `1d8e3cb` to the baseline checkpoint table.
* Added `d35334b` to the baseline checkpoint table.
* Added a grouped registry-catalog migration section.
* Added the `Registry Completion Sprint — All Safe Registries` inventory and classification section.
* Recorded active registries, deferred registries, routes, navigation, drill-throughs, verification, and files changed.

---

# Registry Capability Catalog Alignment

## Scope

Align the app-level registry catalog with the canonical Schooly master registry capability catalog, starting with Staff Directory and then classifying the remaining live surfaces as canonical, derived, custom, or deferred.

## Staff Directory Canonical Metadata

| Field | Value |
| ----- | ----- |
| Capability ID | `CAP_STAFF_DIRECTORY` |
| Registry ID | `REG_STAFF_DIRECTORY` |
| Canonical Registry Name | `Staff_Directory` |
| Display Name | `Staff Directory` |
| Resource URI | `schooly://registry/REG_STAFF_DIRECTORY` |
| Source Spreadsheet ID | `12HRgp9O0mkIh5tWSc1Ev0PRTlGPGhpcxAne-oG6MSNM` |
| Tab Name | `Staff_Directory` |
| Object Category | `people` |
| Source Role | `Master Data` |
| Supported Operations | `read, search, append, update, validate` |
| Scope | `school_private` |
| Write Policy | `controlled_write` |
| Query Keys | `staff_id, school_id, academic_year, status, is_demo_data` |
| Duplicate Search Policy | `staff_directory, staff directory, staff_directory, people` |
| Discovery Notes | Canonical source registry. Use as the first-choice source for the people/staff category. |
| Status | `Active` |

## Canonical / Derived Decision

| Registry | Classification | Decision |
| -------- | -------------- | -------- |
| Staff Directory | Active canonical generic registry | Canonical master registry source for people/staff records. |
| Teachers | Active derived generic registry | Role-filtered view derived from `REG_STAFF_DIRECTORY`; no separate canonical teacher registry was found. |
| Students | Active canonical generic registry | Live first-class page remains canonical in the app, but explicit capability metadata is still pending. |
| Classroom Courses | Active canonical generic registry | Live first-class page remains canonical in the app, but explicit capability metadata is still pending. |
| Classroom Assignments | Active canonical generic registry | Live first-class page remains canonical in the app, but explicit capability metadata is still pending. |
| Workspace Files | Active custom list/detail view | Generic Search/UniversalSearch surface, not a registry page. |
| Lesson Plans | Active custom list/detail view | Custom selection-driven list/detail workspace. |
| Lesson Resources / Academic Resources | Deferred: tightly coupled workflow | Coupled to lesson planning and authoring flows. |
| NCERT Textbooks | Custom workflow | Specialized NCERT ingestion and audit flow. |
| NCERT Chapters | Custom workflow | Specialized NCERT review and mapping flow. |
| Classroom Roster / SIS Pupils | Deferred: not a registry | Embedded classroom surface stays inside Classroom Sync. |
| Compliance Monitoring | Deferred: dashboard-only metric | KPI / dashboard surface only. |
| Assessment Tracking | Deferred: dashboard-only metric | KPI / dashboard surface only. |
| SQAA Evidence | Deferred: dashboard-only metric | KPI / dashboard surface only. |
| Remedial Feed | Deferred: dashboard-only metric | KPI / dashboard surface only. |
| Dashboard Alerts | Deferred: dashboard-only metric | Dashboard alert surface only. |
| Registry health/status chips | Deferred: not a registry | Health chips and indicators are not registries. |

## Active Canonical Registries

* Staff Directory
* Students
* Classroom Courses
* Classroom Assignments

## Active Derived Registries

* Teachers

## Active Custom List & Detail Views

* Workspace Files
* Lesson Plans

## Custom Workflows

* NCERT Textbooks
* NCERT Chapters
* Lesson Resources / Academic Resources

## Deferred Registries And Reasons

* Classroom Roster / SIS Pupils: keep embedded in Classroom Sync.
* Compliance Monitoring: dashboard-only metric, not a registry page.
* Assessment Tracking: dashboard-only metric, not a registry page.
* SQAA Evidence: dashboard-only metric, not a registry page.
* Remedial Feed: dashboard-only metric, not a registry page.
* Dashboard Alerts: dashboard-only metric, not a registry page.
* Registry health/status chips: indicators only, not registry records.
* Lesson Resources / Academic Resources: tightly coupled to lesson-planning and authoring workflows.
* Students, Classroom Courses, and Classroom Assignments: app pages are active, but explicit capability metadata rows are still pending.

## Drill-Through Coverage

* Active Students KPI -> Students
* Active Staff KPI -> Staff
* Teachers dashboard/card surfaces -> Teachers
* Classroom count/class sections -> Courses
* Assignments count/value -> Assignments
* Staff Directory surfaces -> Staff

## Missing Capability Catalog Rows

* Students
* Classroom Courses
* Classroom Assignments
* Workspace Files

These app surfaces are active today, but their explicit capability metadata rows still need canonical registry evidence before they can be mirrored into the catalog.

## Verification Results

* `npx tsc --noEmit --pretty false` succeeded after the metadata alignment changes.
* `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke completed locally against the running app.
* `/staff` opened and showed the canonical Staff Directory metadata block.
* `/teachers` opened and showed the derived-from-Staff note.
* `/students`, `/courses`, and `/assignments` still opened normally.
* `/search`, `/classroom`, `/lesson-plans`, and `/textbooks` still opened without runtime errors.
* `/registers` exposed the registers hub and the Staff drill-through landed on `/staff`.
* The browser console showed existing network-access and 404 messages, but no new runtime failure from the metadata alignment work.
* Local commit SHA for this alignment pass: `422cef239637189d80c4a03b21e659e3eb5bd13a`.
* Push attempt failed because this shell cannot reach `github.com` over port 443.

---

# Registry Completion Sprint — All Safe Registries

## Registry Inventory

| Candidate | Classification | Source / Reason | Route / Surface |
| --------- | -------------- | --------------- | --------------- |
| Students | Active generic registry | Existing `/api/students` feed and dedicated generic page. | `/students` |
| Teachers | Derived staff-backed registry view | Staff Directory rows plus teacher allocations, surfaced through the compatibility `/teachers` page. | `/teachers` |
| Staff | Active generic registry | Live `Staff_Directory` rows from the master registry. | `/staff` |
| Classroom Courses | Active generic registry | Existing `/api/classroom/courses` feed and dedicated generic page. | `/courses` |
| Assignments | Active generic registry | Existing `/api/classroom/assignments` feed and dedicated generic page. | `/assignments` |
| Classroom Roster / SIS Pupils | Deferred: not a registry | Embedded classroom surface stays inside Classroom Sync. | `/classroom` embedded panel |
| Workspace Files | Active via Search/UniversalSearch | Already covered by Search and the generic Workspace file framework. | `/search` |
| Lesson Plans | Custom List & Detail View | Selection-driven planning workspace remains specialized. | `/lesson-plans` |
| LessonPlanner editor/checklist/AI flows | Custom workflow | AI-assisted editing and workflow controls are not a registry page. | `/lesson-plans` |
| Lesson Resources / Academic Resources | Deferred: tightly coupled workflow | Coupled to lesson planning and workspace authoring. | Lesson workspace / dashboard surfaces |
| TextbookIngestor / NCERT ingestion | Custom workflow | NCERT import, OCR, and audit flows stay specialized. | `/textbooks` |
| NCERT Textbooks | Custom workflow | Existing textbook workspace is intentionally specialized. | `/textbooks` |
| NCERT Chapters | Custom workflow | Chapter import/review/publish flows stay inside the NCERT workspace. | `/textbooks` |
| Tasks | Custom workflow | Task board is action-oriented, not a registry page. | `/tasks` |
| Audit Logs | Dashboard surface | Read-only audit trail shown in governance/dashboard panels. | `/governance` |
| Automations | Custom workflow | Automation builder is an interactive workflow surface. | `/ai-assistant` |
| Compliance Monitoring | Deferred: dashboard-only metric | Dashboard KPI and panel data only. | Dashboard surface |
| Assessment Tracking | Deferred: dashboard-only metric | Dashboard KPI and panel data only. | Dashboard surface |
| SQAA Evidence | Deferred: dashboard-only metric | Dashboard KPI and panel data only. | Dashboard surface |
| Remedial Feed | Deferred: dashboard-only metric | Dashboard KPI and panel data only. | Dashboard surface |
| Dashboard alerts | Dashboard surface | Alert cards stay on the dashboard surface. | Dashboard surface |
| Registry health/status chips | Deferred: not a registry | Health chips are indicators, not registry pages. | Dashboard surface |
| DashboardOverview broad cards | Dashboard surface | Broad dashboard panels should remain specialized. | `/overview` |
| RoleDashboards broad role dashboards | Dashboard surface | Role cards are dashboard surfaces, not registry pages. | `/role-cards` |
| Teacher Allocations | Deferred: dashboard-only metric | Used by dashboards and role cards, but not promoted as a registry page this sprint. | Dashboard surface |
| Student Directory / Enrollment | Deferred: missing data source | Data exists in the master registry, but the app already exposes Students through `/api/students`. | Master registry source |

## Active First-Class Registry Pages

* Students
* Teachers
* Staff
* Classroom Courses
* Assignments

## Newly Activated Registries

* Staff

## Custom List & Detail View Registries

* Lesson Plans

## Custom Workflows

* LessonPlanner editor/checklist/AI flows
* TextbookIngestor / NCERT ingestion
* NCERT Textbooks
* NCERT Chapters
* Tasks
* Automations

## Deferred Registries

* Classroom Roster / SIS Pupils
* Workspace Files
* Lesson Resources / Academic Resources
* Compliance Monitoring
* Assessment Tracking
* SQAA Evidence
* Remedial Feed
* Teacher Allocations
* Student Directory / Enrollment

## Deferred Registries And Why

* Classroom roster / SIS pupils: keep embedded in Classroom Sync.
* Workspace files: already handled by Search / UniversalSearch.
* Lesson resources / academic resources: too coupled to lesson-planning and authoring flows.
* Compliance / assessment / SQAA / remedial surfaces: still dashboard-only metrics in this app.
* Teacher allocations: already used by dashboards and role cards; no first-class page added in this sprint.
* Student directory / enrollment: the live Students page already exists through `/api/students`.

## Routes Available

* `/students`
* `/teachers`
* `/staff`
* `/courses`
* `/assignments`
* `/search`

## Drill-Throughs Added

* Active Students KPI -> Students
* Active Staff KPI -> Teachers
* Staff register card -> Staff
* Active Class Sections -> Courses
* Google Classroom Courses -> Courses
* Classroom Monitoring `Total Classrooms` -> Courses
* Classroom Monitoring `Assignments` -> Assignments
* Synced SIS Pupil Roster `View all students` -> Students

## Verification Entries Added

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.

## Files Changed

* `src/App.tsx`
* `src/components/DashboardOverview.tsx`
* `src/components/StaffRegistryPage.tsx`
* `src/lib/registryCatalog.tsx`
* `src/lib/schemaEngine.ts`
* `src/lib/staffEntityDefinition.tsx`

## Commit SHAs Recorded

* `d35334b` â€” tracker reconciliation checkpoint

## Tracker Changes Made

* Added `d35334b` to the baseline checkpoint table.
* Added Staff as a newly activated generic registry.
* Added the completion sprint inventory section.
* Recorded active registries, custom list/detail surfaces, custom workflows, deferred registries, routes, drill-throughs, verification entries, files changed, and commit SHAs.

# Universal Registry Explorer Cycle

## Selected Object Group

Registry Explorer and universal registry data route.

## Why This Group

This is a single metadata-driven browser surface that can cover the registry catalog without creating more bespoke pages.

## Files Changed

* `src/App.tsx`
* `src/lib/schemaEngine.ts`
* `src/components/RegistryExplorerPage.tsx`
* `src/components/GenericRegistryDataPage.tsx`
* `src/lib/registryExplorerEntityDefinition.tsx`

## Behavior Preserved

* Existing sidebar navigation
* Existing `Registers` hub
* Existing first-class pages for Students, Teachers, Staff, Courses, and Assignments
* Existing generic registry pages and dashboard surfaces

## Verification

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke completed locally:
  * `/registries` opened the registry explorer and showed the registry catalog.
  * Sidebar `Registries` item was visible for the active Principal session.
  * `/registries/students` opened the Students first-class page.
  * `/registries/masterDataRegistryUrl__staff_directory` opened the generic registry data route fallback.
  * No new browser console errors were observed in the smoke run.

## Deferred

* No new live row loader was added for the schema-only registry tabs.
* No dashboard drill-through changes were made in this cycle.

## Commit SHA

* `ad42319` - `feat: add universal registry explorer`

---

# Staff / Teachers Consolidation Follow-up

## Selected Object Group

Teachers, now derived from Staff Directory instead of a separate canonical teacher registry.

## Why This Group

The teacher page already had a stable generic shell. The smallest safe consolidation was to keep `/teachers` as a compatibility route while sourcing its rows from `Staff_Directory` and `Teacher_Allocations`.

## Files Changed

* `src/App.tsx`
* `src/components/TeachersRegistryPage.tsx`
* `src/lib/schoolRegistry.ts`
* `src/lib/staffEntityDefinition.tsx`
* `src/lib/teacherEntityDefinition.tsx`
* `src/lib/registryCatalog.tsx`
* `src/lib/registryExplorerEntityDefinition.tsx`
* `src/lib/schemaEngine.ts`
* `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Behavior Preserved

* `/teachers` still opens the teacher page.
* `/staff` still opens the canonical staff directory.
* `/registries` still opens the registry explorer.
* Students, courses, assignments, search, classroom, lesson plans, and textbooks were left alone.
* The teacher page still uses the generic registry shell and row selection.

## Verification

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke completed locally with the local Chrome executable:
  * `/teachers` opened the generic teacher registry page and showed the derived-from-staff metadata block.
  * `/staff` opened the canonical staff registry page.
  * `/registries` opened the registry explorer shell.
  * Browser console showed the existing network-access and 404 noise from the app, but no new runtime errors from this consolidation.

## Deferred

* No backend or database changes were made.
* No separate canonical teacher registry was added.
* The registry explorer still includes the compatibility teacher route as a derived view, not as a new canonical source.

---

# Post Staff/Teachers Consolidation Governance

## Schema Check

* `is_teacher` status: `pending`
* The actual `Staff_Directory` header set in `src/lib/registrySchema.ts` does not currently list `is_teacher`.
* Code support exists for inference and optional loading, but the live registry schema itself still needs the field if we want a first-class source value.

## Suggested Registry_Field_Catalog Row

| registry_id | field_name | display_name | data_type | required | default_value | description |
| ----------- | ----------- | ------------ | --------- | -------- | ------------- | ----------- |
| `REG_STAFF_DIRECTORY` | `is_teacher` | `Is Teacher?` | `BOOLEAN` | `FALSE` | `FALSE` | TRUE when the staff member performs teaching duties and should appear in teacher views, teacher allocation workflows, and academic staff filters. |

## Registry Decisions

* Staff Directory remains the canonical people/employee registry.
* Teachers remains a derived view sourced from `REG_STAFF_DIRECTORY`.
* Teacher Allocations remains a separate relationship/allocation registry.
* Teachers is not counted as a separate canonical registry in the governance model.

## Registry Explorer Classification

* `Teachers` -> `Derived view`
* `Teacher Allocations` -> `Relationship registry`
* `Staff` -> canonical registry

## Registry Count Impact

* Canonical people/employee registry count remains unchanged.
* Explorer totals still show the derived Teachers view and the separate Teacher Allocations registry, but they are labeled distinctly so they are not mistaken for separate canonical people registries.

## Verification Result

* TypeScript/build/browser smoke were completed successfully during the consolidation pass.
* No Google Sheets writes were performed.
* Commit SHA: `8ae7a99`

## Commit SHA

* `1a4b0c7` - `docs: finalize registry explorer coverage`

---

# Registry Finalization — 56 Registry Explorer Coverage

## Selected Object Group

Universal Registry Explorer and universal registry data route.

## Why This Group

The explorer is the single metadata-driven surface that covers the known registry catalog without creating more bespoke pages.

## Files Changed

* `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Behavior Preserved

* `/registries` still opens the registry explorer.
* `/registries/:registryId` still opens first-class registry pages or the generic registry data fallback.
* `/staff`, `/teachers`, `/students`, `/courses`, `/assignments`, `/classroom`, `/search`, `/lesson-plans`, and `/textbooks` still open.
* Staff/Teachers governance stays intact: Staff remains canonical, Teachers remains derived, and Teacher Allocations remains separate.

## Verification

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke completed locally against the running app:
  * `/registries` opened the explorer and showed `SHOWING 79 OF 79`.
  * `/registries/students`, `/registries/staff`, and `/registries/REG_TEACHER_ALLOCATIONS` loaded successfully.
  * `/students`, `/teachers`, `/courses`, `/assignments`, `/classroom`, `/search`, `/lesson-plans`, and `/textbooks` loaded successfully.
  * No new browser console errors were observed during the smoke pass.

## Deferred

* No new bespoke registry pages were created.
* No backend, database, mock data, or dependency work was added.
* No registry row data was invented.

## Commit SHA

* `d670de0d52c1ce29b1e1b87745af708c818ee992`

---

# Lesson Plans — Custom List Detail Stabilization

## Why Lesson Plans Remains Custom

Lesson Plans stays a custom list/detail workspace instead of moving into the generic registry framework. The page is tightly coupled to lesson authoring, AI review, checklist management, Drive save/sync, and workbook editing flows.

## List / Detail Improvements Made

* The lesson list and detail/editor panes now read as a clearer custom split workspace.
* The split layout was tightened with `min-w-0`, `overflow-hidden`, and safer wrapping on the selected lesson title and supporting metadata.
* The page now shows a subtle custom-workspace note so the surface is clearly identified as specialized.
* Empty and missing-selection states were clarified so the right-hand detail area does not feel broken when nothing is selected.

## Custom Workflow Areas Preserved

* LessonPlanner AI/editor flows.
* Checklist configuration and remediation review flows.
* Parent communication generation.
* Drive save/sync behavior.
* Textbook-linked lesson generation and workbook editing.

## Drill-Through Behavior

* No new registry drill-through was introduced.
* The existing `Open Workbook Workspace` action remains the safe drill-through into the editor.
* No misleading click affordance was added to lesson cards beyond the current action buttons.

## Empty / Error / Loading State Behavior

* The list now shows a clearer empty state when filters hide all lesson plans.
* The detail pane now explains when no lesson is selected and offers a one-click selection fallback when visible lessons exist.
* No backend/source behavior was changed.

## Verification Results

* TypeScript: `npx tsc --noEmit --pretty false` succeeded.
* Build: `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke: completed in headless Chrome against `http://127.0.0.1:3001/lesson-plans`.

## UI Smoke Notes

* `/lesson-plans` opened successfully.
* The lesson-plan split view rendered at desktop width without visible layout breakage.
* The custom workspace note rendered above the registry grid.
* The selected lesson detail pane, checklist area, and workbook action remained visible.
* Chrome headless reported only its own Google Update / GPU warnings, not a page runtime error.

## Commit SHA

* `a752086`

---

# Academic Resources - Source Mapping and SQAA Evidence Links

## Scope

This cycle strengthens the `/resources` read-only surface with richer source mapping and SQAA / CBSE / NCERT evidence links while keeping Lesson Plans and NCERT Textbooks specialized.

## What Was Refined

* The academic resource rows now carry richer source metadata: source label, source record ID, source availability, source confidence, and source notes.
* The academic resource rows now carry richer evidence metadata: evidence type, evidence URL, evidence status, and evidence notes.
* The selected-resource detail view now surfaces the richer source/evidence context alongside the existing generic detail fields.
* The resource list subtitle now leans on the more specific source context instead of only the broad source family.
* Lesson Plans and Textbook Ingestor now open `/resources` with a lightweight source hint in the URL.

## Data Source

* Existing `WorkspaceFile` rows from Search-backed workspace data.
* Existing saved lesson-plan archive rows from local storage.
* No backend, mock data, or registry write path was added.

## Behavior Preserved

* Lesson Plans remains a custom list/detail workspace.
* NCERT Textbooks remains a custom ingestion and audit workspace.
* `/lesson-plans` and `/textbooks` still use their existing workflows.
* The resource page remains read-only.

## Tracker Notes

* `/resources` direct route: still works.
* Source mapping: now shows source label, source record ID, source registry ID, source route, and source confidence.
* Evidence display: now shows SQAA / CBSE / NCERT / mapping tags plus evidence type, evidence URL, and evidence notes.
* Evidence-unavailable message: now uses the explicit `Evidence tags are not available from this source yet.` text.
* Lesson Plans and NCERT Textbooks drill-in: now pass a lightweight `source` hint when opening `/resources`.
* Browser smoke: verified locally on `/resources`, `/lesson-plans`, and `/textbooks`; the page loaded, the resource table rendered, a selected row exposed the new source/evidence metadata, and the lesson/textbook entry buttons preserved the `/resources?source=...` handoff.
* Browser smoke note: the environment still blocks some external fetches such as Google Fonts and Google Sheets JSON reads, so the console showed network-access-denied noise that is unrelated to this change.

## Verification Result

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke completed locally with the environment-specific external fetch noise noted above.

## Commit SHA

* `560ac71`

---

# Academic Resources - Filters Summary and Query Context Completion

## Scope

This cycle finishes the `/resources` completion pass by broadening filter/query-context handling, summary cards, and source-handoff behavior while leaving the existing source-mapping and SQAA evidence work in place.

The source-mapping baseline from `560ac71` remains the foundation for this phase.

## What Was Completed

* `/resources` now accepts and applies query context for `source`, `class`, `section`, `subject`, `book`, `chapter`, `lessonPlanId`, `sourceRegistryId`, `resourceType`, `evidenceStatus`, and `sourceConfidence`.
* The resource page now exposes richer filters for resource type, category, audience, class, section, subject, book, chapter, source registry ID, lesson plan ID, evidence status, source confidence, Drive link availability, and Classroom link availability.
* Summary cards now include total resources, resource types represented, Drive-linked resources, Classroom-linked resources, evidence-mapped resources, source-unavailable resources, and low-confidence/inferred mappings.
* The generic detail view now has fuller academic context coverage, including section, book, and lesson-plan identifiers where they exist.
* Lesson Plans and Textbook Ingestor now pass richer resource-library context through the `/resources` handoff URL.
* The resource page now shows an explicit active query-context banner and a clearer empty-state hint when filters remove all rows.

## Behavior Preserved

* The resource library stays read-only.
* Lesson Plans remains a custom planning workspace.
* Textbook Ingestor remains a custom NCERT/import workspace.
* The generic list/detail framework remains limited to the `/resources` surface.
* Existing source/evidence mapping behavior is unchanged.

## Tracker Notes

* `/resources` direct route: still works.
* Filter controls: visible and responsive in local smoke.
* Reset filters: clears the custom resource filters.
* Lesson Plans handoff: returns to `/resources?source=lesson-plans&lessonPlanId=...&resourceType=lesson_plan` in local smoke.
* Textbooks handoff: returns to `/resources?source=textbooks` in local smoke.
* Browser smoke: completed locally on `/resources`, `/lesson-plans`, and `/textbooks`; the page loaded, filters changed the row set, reset restored the list, and the handoff buttons preserved the expected resource route.
* Browser smoke note: the environment still blocks some external fetches such as Google Fonts and Google Sheets JSON reads, so the console showed network-access-denied noise unrelated to this change.

## Verification Result

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke completed locally with the environment-specific external fetch noise noted above.

## Commit SHA

* `8524fcb`

---

# Sidebar Navigation Cleanup - Registry Explorer and Settings Simplification

## Scope

This follow-up cleanup removes the separate `Registers` sidebar section, keeps `Registry Explorer` as the main system/data entry point, renames `AI Assistant` to `My AI Assistant`, and flattens `Settings` so the top-level item is the link instead of a repeated section item.

## What Changed

* `AI Assistant` sidebar label now renders as `My AI Assistant`.
* `Registry Explorer` is the visible system/data entry point instead of a separate `Registers` section.
* `Teachers` remains a route, but it is no longer shown as a main sidebar item.
* `Assignments` stays under `Teaching & Learning`.
* The `Settings` section no longer renders a nested `Settings` child item.
* The old live school register cards were moved into `RegistryExplorerPage` as KPI cards.
* `/registers` now aliases safely to `/registries`.

## Behavior Preserved

* `/`, `/search`, `/lesson-plans`, `/resources`, `/classroom`, `/students`, `/courses`, `/assignments`, `/staff`, `/teachers`, `/registries`, `/registries/:registryId`, `/textbooks`, and `/settings` still work.
* Registry Explorer still opens the registry explorer shell and registry detail routes.
* Teachers still opens as a derived route.
* The registry explorer KPI cards still drill through to the live student, course, staff, assignment, and related pages.

## Verification Result

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke completed locally:
  * `/` opened successfully.
  * `/registers` aliased to the Registry Explorer surface.
  * `/registries` showed the Registry Explorer header and the moved live school register KPI cards.
  * The sidebar rendered `My AI Assistant` instead of `AI Assistant`.
  * The sidebar no longer showed a separate `Registers` section.
  * The sidebar no longer showed a repeated `Settings` section item.
  * No new browser console errors were introduced beyond the existing Vite websocket and network noise.

## Files Changed

* `src/App.tsx`
* `src/components/DashboardOverview.tsx`
* `src/components/RegistryExplorerPage.tsx`
* `src/lib/schemaEngine.ts`
* `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

---

# Sidebar Navigation - Remove Role Dashboards and Restore Settings

## Final Sidebar Structure

* `Dashboard`
* `Search`
* `My Workspace`
  * `My AI Assistant`
  * `Tasks`
* `Teaching & Learning`
  * `Lessons Workspace`
  * `Resources`
  * `Classroom Sync`
  * `Students`
  * `Classroom Courses`
  * `Assignments`
  * `NCERT Textbooks`
* `School Operations`
  * `Staff`
* `System & Data`
  * `Registry Explorer`
* `Settings`

## What Changed

* `Role Dashboards` is preserved as a route but no longer appears in the main sidebar.
* `Settings` is restored as a standalone sidebar action.
* `Registers` remains removed from the visible sidebar.
* `/registers` remains a compatibility alias that resolves to `/registries`.
* `Registry Explorer` now lives under `System & Data`.
* `Resources` was added under `Teaching & Learning`.
* `Teachers` stays hidden from the main sidebar while the `/teachers` route remains available.
* Old saved schema metadata is reconciled on load so stale `Registers`, `Role Cards`, `AI Assistant`, or `Academic Resources` labels do not require manual local-storage cleanup.

## Routes Preserved

* `/`
* `/search`
* `/lesson-plans`
* `/resources`
* `/classroom`
* `/students`
* `/courses`
* `/assignments`
* `/staff`
* `/teachers`
* `/registries`
* `/registers`
* `/registries/:registryId`
* `/textbooks`
* `/settings`

## Verification Result

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke was attempted, but local browser execution was blocked because the bundled Playwright browser binary is not installed and the local `ms-playwright` cache path is access-restricted in this environment.

## UI Smoke Notes

* I verified the code path that removes `Role Dashboards` from the sidebar and restores the standalone `Settings` action while keeping `Registry Explorer` under `System & Data`.
* I could not complete a live browser render check in this environment because Chromium was unavailable.

## Files Changed

* `src/App.tsx`
* `src/components/DashboardOverview.tsx`
* `src/lib/schemaEngine.ts`
* `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Commit SHA

* Pending

---

# Sidebar Footer - Compact Collapsible Connection Cards

## What Was Compacted

* The lower sidebar connection/status area now renders as a compact summary strip by default.
* The previous always-expanded footer content is now behind a `Show details` / `Hide details` toggle.

## Visible By Default

* Current role, such as `Principal`.
* Workspace connection state, such as `Workspace connected` or `Needs setup`.
* Google Sheets state, such as `Sheets connected` or `Sheets not connected`.

## Expanded Details

* Workspace link / connection URL.
* Google Sheets write-access state and write-account text.
* `Configure Workspace Link`.
* `Test Connection`.
* Existing connection-test message block.
* Role details and current operator information.
* Deployment version and status text.

## Behavior Preserved

* `Configure Workspace Link` still opens the same modal.
* `Test Connection` still uses the existing connection test handler.
* Long URLs and status text are truncated or wrapped so they do not widen the sidebar.

## Local State Decision

* Expanded / collapsed state is kept in component state only.
* The footer is collapsed by default for a lighter sidebar.

## Routes Preserved

* `/`
* `/search`
* `/lesson-plans`
* `/resources`
* `/classroom`
* `/students`
* `/courses`
* `/assignments`
* `/staff`
* `/teachers`
* `/registries`
* `/registers`
* `/textbooks`
* `/settings`

## Verification Result

* `npx tsc --noEmit --pretty false` pending.
* `npm run build` pending.
* Browser smoke pending.

## UI Smoke Notes

* Pending local browser verification.

## Commit SHA

* Pending

---

# Lesson Resources - Academic Resource Library

## Scope

This cycle introduced the `/resources` surface for lesson-linked academic resources without changing the Lesson Plans custom workflow or the NCERT textbook ingestion workspace.

## What Was Added

* `AcademicResourceLibraryPage` wired into the app shell.
* A `/resources` route and sidebar entry under Teaching & Learning.
* `src/lib/academicResourceTypes.ts` for the academic resource taxonomy.
* Safe navigation buttons from Lesson Plans and NCERT Textbooks into the resource library.

## Data Source

* The page reads existing `WorkspaceFile` rows from Search-backed workspace data.
* No backend, mock data, or new registry source was added.
* The page is read-only and does not mutate any saved records.

## Behavior Preserved

* Lesson Plans remains a custom list/detail workspace.
* NCERT Textbooks remains a custom ingestion and audit workspace.
* `/lesson-plans` and `/textbooks` still use their existing workflows.
* The new page is additive and does not replace Search, Lesson Plans, or Textbooks.

## Tracker Notes

* `/resources` direct route: added in the app shell.
* Sidebar visibility: added for Teaching-capable roles through schema-driven navigation.
* Lesson Plans link: added.
* Textbooks link: added.
* Browser smoke: verified in Chrome on `/resources`, `/lesson-plans`, `/textbooks`, `/students`, and `/classroom`.

## Commit SHA

* `9463671`

---

# Academic Resources - Library Completion and Evidence Mapping

## Scope

This follow-up refines the `/resources` page into a read-only evidence-map surface with source notes, compact filters, and safer drill-throughs while keeping Lesson Plans and NCERT Textbooks specialized.

## What Was Refined

* The resource page now uses the richer academic resource helper in `src/lib/academicResourceLibrary.ts`.
* Summary cards now show visible resources, Drive-linked rows, evidence-mapped rows, and metadata-only / unavailable rows.
* Compact source and status filters were added on the page itself so the generic list stays usable without extra generic filter noise.
* The selected-resource detail panel now includes a source note and an evidence snapshot before and after the generic sections.
* Safe drill-through actions were added for the source surface, Drive, and Classroom when those links exist.
* Saved lesson-plan archive rows are now merged into the resource list alongside `WorkspaceFile` rows.

## Data Source

* Existing `WorkspaceFile` rows from Search-backed workspace data.
* Existing saved lesson-plan archive rows from local storage.
* No backend, mock data, or registry write path was added.

## Behavior Preserved

* Lesson Plans remains a custom list/detail workspace.
* NCERT Textbooks remains a custom ingestion and audit workspace.
* `/lesson-plans` and `/textbooks` still use their existing workflows.
* The resource page remains read-only.

## Tracker Notes

* `/resources` direct route: still works.
* Sidebar visibility: still available for Teaching-capable roles.
* Source notes: added in the header and the selected-resource detail panel.
* Evidence mapping: added as a detail snapshot and detail sections.
* Compact filters: added for source family and status.
* Safe drill-throughs: added for source surface, Drive, and Classroom where available.
* Browser smoke: verified on `/resources`, `/lesson-plans`, `/textbooks`, `/students`, and `/classroom`.

## Commit SHA

* `98eefcd8629572e99ddf6cf9860e0994270f3184`

---

# Dashboard Data Quality - Alerts Counts and Source States

## Scope

This follow-up tightens dashboard trust signals without changing the app structure or inventing data.

## What Was Adjusted

* Added a small local source-state helper in `DashboardOverview.tsx` so registry-backed cards can distinguish `ready`, `empty`, `missing`, `incomplete`, `fallback`, and `unknown`.
* Reworded alert and registry status labels to be more specific and less repetitive.
* Replaced misleading zero-style counts with source-aware messages when the backing registry is unavailable or incomplete.
* Kept normal numeric zeroes only where a live source exists and truly has no rows.
* Cleaned up repetitive placeholder labels in the teacher performance and remedial panels.
* Kept the classroom/class display order natural by using the existing class-sorting helper for the classroom announcement slice.

## School at a Glance and Classroom Monitoring

* Active Students, Active Staff, Active Class Sections, Google Classroom Courses, Attendance / Engagement, and classroom monitoring rows now use source-aware count labels.
* School at a Glance and Classroom Monitoring stay visually consistent while avoiding bare zeroes when the source is missing.
* Teacher Allocation Coverage continues to route to `REG_TEACHER_ALLOCATIONS`.

## Registry Explorer KPI Source-State Alignment

* Registry Explorer drill-through targets were preserved.
* The live registry connection summary now shows clearer source-state text for missing, incomplete, and fallback registry rows.
* The `/registries` and `/registers` surfaces remain intact, with no new canonical registry added in this pass.

## Preserved Routes and Drill-Throughs

* Existing dashboard drill-throughs remain intact for Students, Staff, Teachers, Courses, Assignments, and teacher allocation coverage.
* Existing app routes remain intact, including `/`, `/search`, `/lesson-plans`, `/resources`, `/textbooks`, `/classroom`, `/students`, `/courses`, `/assignments`, `/staff`, `/teachers`, `/registries`, `/registers`, and `/settings`.

## UI Smoke

* Verified locally in Chrome via headless smoke: the dashboard shell loaded without runtime error, the remedial follow-up feed title rendered, the source-state labels rendered, `/registries` and `/registers` resolved correctly, and no new console errors were captured.

## Files Changed

* `src/components/DashboardOverview.tsx`
* `src/lib/dashboardDataResolver.ts`
* `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Commit SHA

* `pending`

---

# Registry Explorer - Source State Badges and KPI Clarity

## Selected Object Group

Registry Explorer summary cards and registry explorer row metadata.

## Why This Group

This is a narrow presentation pass on an already metadata-driven surface. It improves source-state clarity without changing registry routing, drill-throughs, or the underlying data model.

## Files Changed

* `src/App.tsx`
* `src/components/RegistryExplorerPage.tsx`
* `src/components/RegistryPageShell.tsx`
* `src/lib/registryExplorerEntityDefinition.tsx`
* `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Behavior Preserved

* Existing `/registries` and `/registers` routes
* Existing registry explorer drill-throughs
* Existing registry catalog and generic registry data pages
* Existing first-class pages for Students, Teachers, Staff, Courses, Assignments, Classroom, Search, Lesson Plans, and Textbooks

## What Changed

* Registry Explorer KPI cards now show explicit source-state badges for ready, empty, missing, fallback, incomplete, and unknown states.
* Card counts now avoid implying healthy data when the underlying source is unavailable.
* Registry explorer row metadata now exposes a source-state badge in the generic surface.
* Registry page headers now show a compact source-state chip alongside the existing row-count and role chips.

## Verification Result

* `npx tsc --noEmit --pretty false` succeeded after one type fix in the source-state badge variant mapping.
* `npm run build` succeeded with the existing Vite chunk-size warning only.

## UI Smoke Result

* Browser runtime smoke was blocked because the in-app browser bridge reported `privileged native pipe bridge is not available; browser-client is not trusted`.
* I did confirm the code path and the route wiring locally, but I could not complete a live browser interaction pass in this session.

## Deferred

* No registry data model or backend changes were made.
* No new registry routes or canonical registries were added.
* No drill-through targets were changed.

## Commit SHA

* `691922b`

---

# Dashboard and Registry Drill-Through - Align Cards to Live Registry Views

## Scope

This follow-up aligns dashboard KPIs, registry summary cards, and registry explorer summary cards to the live first-class page or registry detail surface they already map to, without adding mock data or a new navigation architecture.

## What Was Adjusted

* Dashboard summary cards now prefer explicit live destinations instead of generic tab-only drill-through where a registry detail surface already exists.
* Registry hub cards for Subjects, Attendance, and Assessments now route to live registry detail surfaces instead of a generic fallback.
* Registry explorer summary cards now distinguish between first-class pages, registry detail routes, and dashboard tabs.
* Zero-row registry cards now show a clearer unavailable/no-live-rows message instead of a misleading silent count.

## Alert and Availability Notes

* Existing registry health messaging already distinguishes missing tabs, empty tabs, and header problems.
* This pass keeps that logic intact and makes the card-level drill-through destinations more explicit.
* Missing or incomplete registry rows continue to show a visible warning state instead of a fake row.

## School at a Glance

* Active Students still opens the students surface.
* Active Staff still opens the staff surface.
* Active Class Sections still opens the classroom courses surface.
* Teacher Allocation Coverage still opens the teacher allocations registry detail route.

## UI Smoke

* Verified locally in Chrome against `http://127.0.0.1:3001`.
* Dashboard loaded without runtime error.
* Teacher Allocation Coverage opened the live teacher allocations registry detail route.
* Registry Explorer loaded and the Subjects card opened the live registry detail route.
* Registry Explorer Students card opened the students page.
* Console output contained existing environment noise from blocked external requests, but no page errors were introduced by this change.

## Files Changed

* `src/App.tsx`
* `src/components/DashboardOverview.tsx`
* `src/components/RegistryExplorerPage.tsx`
* `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Commit SHA

* `pending`

---

# Feature Readiness â€” Registry Count and Drill-Through Closure

## Count Reconciliation

* Master capability catalog baseline: `56` registry IDs supplied by the Schooly registry capability catalog.
* Registry Explorer UI baseline: `79` explorer entries shown in the app.
* The 79-entry explorer surface is broader than the canonical catalog because it includes:
  * `4` canonical first-class pages
  * `1` derived view
  * `1` relationship registry
  * `69` schema-tab entries
  * `4` embedded/custom surfaces
  * `43` source-unavailable entries that still need mapping or later review
* No canonical registry is being shown twice as two separate canonical registries.
* The UI now describes the surface as explorer entries rather than implying that all 79 are canonical registries.

## Drill-Through Coverage

* Active Students -> `/students`
* Active Staff -> `/staff`
* Teachers / teacher people view -> `/teachers`
* Teacher Allocation Coverage -> `/registries/REG_TEACHER_ALLOCATIONS`
* Courses / class sections / classroom course surfaces -> `/courses`
* Assignments -> `/assignments`
* Registry explorer / registry-derived surfaces -> `/registries`
* `REG_STAFF_DIRECTORY` -> `/registries/REG_STAFF_DIRECTORY`
* `REG_TEACHER_ALLOCATIONS` -> `/registries/REG_TEACHER_ALLOCATIONS`
* Source-unavailable registry IDs now show a clear fallback state instead of a confusing blank route.

## Preserved Routes

* `/registries`
* `/registries/REG_STAFF_DIRECTORY`
* `/registries/REG_TEACHER_ALLOCATIONS`
* `/staff`
* `/teachers`
* `/students`
* `/courses`
* `/assignments`
* `/classroom`
* `/search`
* `/lesson-plans`
* `/textbooks`

## Readiness Result

* The registry UI migration is complete enough to proceed to the next feature sprint.
* Remaining registry work is source mapping and data-governance cleanup, not UI migration.

## Verification Result

* `npx tsc --noEmit --pretty false` succeeded.
* `npm run build` succeeded with the existing Vite chunk-size warning only.
* Browser smoke completed locally:
  * `/registries` opened with understandable explorer count labels.
  * Search and filters still worked in the registry explorer.
  * `/registries/REG_STAFF_DIRECTORY` and `/registries/REG_TEACHER_ALLOCATIONS` opened.
  * `/staff`, `/teachers`, `/students`, `/courses`, and `/assignments` opened.
  * `/classroom`, `/search`, `/lesson-plans`, and `/textbooks` opened.
  * Dashboard drill-throughs for Students, Staff, Teachers, Teacher Allocation Coverage, Courses, and Assignments were present.
  * Registry explorer and dashboard smoke showed no new browser console errors.

## Files Changed

* `src/App.tsx`
* `src/components/DashboardOverview.tsx`
* `src/components/GenericRegistryDataPage.tsx`
* `src/components/RegistryExplorerPage.tsx`
* `src/lib/registryExplorerEntityDefinition.tsx`
* `docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Commit SHA

* `pending`
