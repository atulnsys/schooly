# Schooly Feature Tracker

## 1. Discovery Summary

| Item | Finding |
| ---- | ------- |
| Date of discovery | 2026-06-12 |
| Branch name | `import/enhanced-codebase` tracking `origin/import/enhanced-codebase` |
| Repository root | `C:\Projects\schooly` |
| App framework | React 19 + Vite 6 + TypeScript, with an Express server launched by `tsx server.ts` |
| Entry points | `index.html`, `src/main.tsx`, `src/App.tsx`, `server.ts` |
| Main source folders | `src/components`, `src/lib`, `src/data/mock`, `docs`, `scripts`, `google_drive_templates`, `prompts/sdos-connectors` |
| Existing docs inspected | `README.md`, `DELIVERABLES.md`, `ROLES_COORDINATION_MAP.md`, `docs/SCHOOLY_DRIVE_INTEGRATION.md`, `docs/SCHOOL_DIGITAL_OPERATING_SYSTEM.md`, `docs/SCHOOL_DRIVE_MANIFEST.md`, `docs/dashboard-data-contract.md` |
| Existing mock files inspected | `src/data/mock/*.json`, especially Google Workspace, Classroom, dashboard, SQAA, NEP, governance, artifacts, and previous-year mocks |
| Existing dashboard/data files inspected | `src/lib/dashboardDataResolver.ts`, `src/lib/dashboardConfig.ts`, `src/components/DashboardOverview.tsx`, `src/components/RoleDashboards.tsx`, `src/data/mock/dashboard-*.json` |
| Existing scripts inspected | `scripts/create-sdos-drive.ps1`, `scripts/configs/*.json`, `google_drive_templates/*.csv`, `prompts/sdos-connectors/*.md` |
| What appears implemented | App shell, persona/role navigation, dashboard pages, mock-backed workspace/search/classroom/tasks/governance views, Google OAuth popup setup, Google Drive metadata read attempts, Google Classroom read attempts, Google Sheets dashboard resolver, Gemini-backed AI endpoints, SDOS manifest browser/scaffold docs, lesson/textbook planner UI |
| What appears mock-only | Most dashboard KPIs when live sheets are absent, SQAA/NEP evidence, governance compliance, classroom templates, parent/student/admin role samples, many task/audit/automation records, SDOS folder data, academic artifacts, previous-year rollover data |
| What appears missing | Durable school setup registry, academic year/class/section/subject/staff allocation registries, production dashboard empty/partial/permission state model, full Lesson Workspace registry, artifact registry, QA checklist registry, SQAA framework/version registry, evidence map writeback, Classroom publishing workflow with approvals, ResumeIQ integration |
| Main MVP risks | Mock data is deeply coupled to current screens, local dirty code changed several app files, Google API behavior depends on OAuth/session availability, no backend/database constraint limits durable sync, compliance evidence can look complete from demo data, docs/specs exceed verified product behavior |

### Verification Notes

- Verified from code: Vite/React/Express setup, route/component mounting, schema-driven role navigation, Firebase Google OAuth scopes, server endpoints for Drive/Classroom/tasks/audit/AI/textbooks, mock dataset loader, Google Sheets dashboard resolver, SDOS manifest script/docs.
- Inferred only from docs/specs/mock data: full SDOS operating model, SQAA/NEP compliance coverage, folder permission guarantees, complete dashboard governance model, future connector intent, and mock-to-live roadmap.
- Starting condition note: `git status --short --branch` showed a dirty working tree before this tracker was created. Existing changes were inspected and preserved. No product code was modified by this discovery step.
- Pull note: the branch showed an upstream tracking branch without ahead/behind markers, but the tree was dirty; no pull/merge/rebase/reset action was performed.

### NCERT UI Cleanup Notes

- NCERT class summary cards were simplified so each card is titled by class and shows compact subject/book status rows.
- Syllabus registry chapter title display now removes duplicated chapter prefixes such as `Chapter 1 Chapter 1 Real Numbers`.
- Diagnostics and known limitations were compacted into a collapsed `Diagnostics & Limitations` section.
- Registry Data Quality, source selection, and action areas were tightened for responsive wrapping and reduced horizontal overflow.
- Source/action layout now uses shorter labels, clearer selected states, stable loading button text, and helper text below primary actions.
- Added an NCERT ZIP/Page setup path that prepares proposed Drive folder and registry row counts, then can apply the setup after explicit user approval using Drive file and Google Sheets write scopes.
- Consolidated dashboard setup/registry detail into a dedicated Setup & Registries page; normal role dashboards now keep setup/registry detail in Settings or Setup & Registries, surface AI Assistant and Settings as primary sidenav items, and hide verbose persona diagnostics unless preview mode is enabled.

## 2. Repository Map

| Path | Type | Purpose | Notes |
| ---- | ---- | ------- | ----- |
| `package.json` | Config | Defines React/Vite/Express app scripts and dependencies | `dev` runs `tsx server.ts`; `lint` runs TypeScript check |
| `index.html` | App entry | Vite HTML mount point | Loads React root |
| `src/main.tsx` | App entry | Renders `<App />` | React strict mode |
| `src/App.tsx` | App shell | Main state, navigation, role switching, Google connection modal, REST data fetching | Role state is simulated/client-side; Google token read uses Firebase helper |
| `src/components/DashboardOverview.tsx` | Component | Principal/coordinator/teacher overview dashboards and role dashboard delegation | Uses dashboard resolver and visible source labels |
| `src/components/RoleDashboards.tsx` | Component | Admin, manager, HR, exams, parent, student dashboard views | Many cards are hardcoded/demo; live sheet cards can be injected |
| `src/components/ClassroomManager.tsx` | Component | Classroom course/assignment sync UI | Reads server-provided classroom data; publishing behavior requires further verification |
| `src/components/TaskProductivity.tsx` | Component | Task board and productivity actions | Backed by server in-memory arrays |
| `src/components/AIAssistants.tsx` | Component | AI assistant and automation UI | Uses Gemini/server flows plus mock prompts/automation records |
| `src/components/AcademicRollover.tsx` | Component | Academic rollover wizard | Server/in-memory config and mock previous-year data influence |
| `src/components/SystemGovernance.tsx` | Component | Governance, roles, schema, audit, manifest panels | Strong mock/docs dependency for compliance and SDOS |
| `src/components/MockDataStudio.tsx` | Component | Mock data browser/editor | Explicit demo data tooling |
| `src/components/LessonPlanner.tsx` | Component | Lesson planning/artifact generation UI | Partial product feature; registry is not yet durable/live |
| `src/components/TextbookIngestor.tsx` | Component | NCERT/textbook ingestion and TOC workflow | Partial; includes AI extraction and fallback chapter lists |
| `src/components/UniversalSearch.tsx` | Component | Workspace search and Q&A | Uses file state from server; mock fallback common |
| `src/lib/schemaEngine.ts` | Library | Declarative roles, capabilities, navigation, page/widget schema | Role access is client-side schema/localStorage driven |
| `src/lib/dataSourceEngine.ts` | Library | Workspace URL validation, Google Sheet URL parsing, connection config | Supports Drive/Docs/Classroom URL validation |
| `src/lib/dashboardDataResolver.ts` | Library | Reads canonical Google Sheets tabs and maps to principal/teacher/coordinator dashboard models | Empty/legacy/wrong-source states are visible; no local role-dashboard mock fallback |
| `src/lib/dashboardConfig.ts` | Library | Dashboard sheet defaults and localStorage lookup | Default public/saved sheet URL |
| `src/lib/firebaseAuth.ts` | Library | Firebase Google popup auth and access token handling | Read-only Drive/Classroom scopes |
| `src/lib/safeFetch.ts` | Library | Fetch helper | Support utility |
| `src/data/mock/*.json` | Mock data | Demo datasets for workspace, classroom, dashboards, artifacts, governance, SQAA, NEP, previous year | Must not be silent production source |
| `src/data/schooly-drive-manifest.json` | Data | Compiled SDOS manifest sample | Demo/manifest model |
| `server.ts` | Server | Express API, Gemini calls, Google Drive/Classroom reads, mock loaders, tasks/audit/lesson endpoints | Uses in-memory stores and mock fallback |
| `docs/SCHOOLY_DRIVE_INTEGRATION.md` | Docs | Describes local Drive/manifest applet integration | Spec/documentation evidence only unless code cross-checks |
| `docs/SCHOOL_DIGITAL_OPERATING_SYSTEM.md` | Docs | SDOS architecture and script usage | Conceptual/operational guide |
| `docs/SCHOOL_DRIVE_MANIFEST.md` | Docs | Manifest schema | Documentation evidence |
| `docs/dashboard-data-contract.md` | Docs | Google Sheet dashboard contract | Untracked at discovery start; aligns with current dirty dashboard resolver work |
| `scripts/create-sdos-drive.ps1` | Script | Generates local SDOS folder tree and manifest | Local filesystem scaffold, not live Google Drive creation |
| `scripts/configs/*.json` | Config samples | School config samples | Sample registries |
| `google_drive_templates/*.csv` | Templates | Spreadsheet examples for dashboard/compliance data | Template/demo data |
| `prompts/sdos-connectors/*.md` | Prompt docs | Connector test prompts for Drive/Classroom/SQAA/NEP/mock-to-live | Planning/test prompt evidence |

## 3. Current Feature Inventory

| Feature ID | Feature Name | Area / Module | Role(s) | Current Status | Evidence in Codebase | Key Files / Components | Current Data Source | Live Data Source Needed | Notes |
| ---------- | ------------ | ------------- | ------- | -------------- | -------------------- | ---------------------- | ------------------- | ----------------------- | ----- |
| APP-001 | React app shell | Core app | All | Complete | Vite + React entry points and Express server scripts exist | `src/main.tsx`, `src/App.tsx`, `server.ts`, `package.json` | Client/server runtime | N/A | Complete as app shell, not as product completeness |
| APP-002 | AI Studio/simple share compatibility | Core app | All | Partial | README references AI Studio app; no separate production database required | `README.md`, `server.ts` | Local Express + browser storage | Same simple sharing path with documented tradeoffs | Express server is still required locally |
| RBAC-001 | Role-aware navigation | RBAC | Principal, coordinator, HOD, teacher, admin, student, others | Partial | Schema roles and navigation compile by capabilities; route guard redirects disallowed tabs | `src/lib/schemaEngine.ts`, `src/App.tsx` | Local schema/localStorage | Auth/custom claims or signed registry | Client-side only |
| RBAC-002 | Role model and permissions | RBAC | All | Partial | Roles include Principal, School Coordinator, HOD, Teacher, Admin, Manager, HR, Student, Exams, Parent | `src/lib/schemaEngine.ts`, `src/App.tsx` | Local schema | Governed role registry + identity mapping | No server-enforced RBAC verified |
| DASH-OVERVIEW-001 | Cockpit/dashboard overview | Dashboard | Principal, coordinator, teacher | Partial | Overview component and dashboard resolver exist | `DashboardOverview.tsx`, `dashboardDataResolver.ts` | Google Sheet attempt with empty state | Published Sheet/registry with validation | Live path exists; missing sheet shows no invented metrics, the main shell now fills a centered max-width workspace again, and the normal dashboards keep setup/registry detail in Settings or Setup & Registries while large cards stay capped to top-five previews with drill-through |
| DASH-PRINCIPAL-001 | Principal dashboard | Dashboard | Principal | Partial | Principal dashboard resolves from live sheet tabs and otherwise stays empty | `dashboardDataResolver.ts`, `docs/dashboard-data-contract.md` | Google Sheet or empty state | Live Sheet/Drive/Classroom/Form registers | Needs authenticated Drive/Sheet provisioning |
| DASH-COORD-001 | Coordinator dashboard | Dashboard | School Coordinator | Partial | Coordinator dashboard resolves from live planner/classroom/remedial sheet tabs plus coordinator scope and planned duty/renewal registries | `dashboardDataResolver.ts`, `docs/dashboard-data-contract.md` | Google Sheet or empty state | Live planner/classroom/remedial registers | HOD/coordinator distinction is shallow; `Coordinator_Scope` now provides class ownership |
| DASH-HOD-001 | HOD dashboard | Dashboard | HOD | Partial | HOD dashboard now resolves from live department scope, NCERT resource coverage, assessment, remedial, and enrichment registries | `dashboardDataResolver.ts`, `DashboardOverview.tsx`, `docs/dashboard-data-contract.md` | Google Sheets or empty state | Department registry, NCERT registry, assessment/result registry, enrichment registry | Dedicated HOD layout is live; setup states remain when scope rows are missing |
| DASH-MANAGER-001 | Manager dashboard | Dashboard | Manager | Partial | Manager dashboard now resolves from live operations, compliance, assessment, and announcement registries | `dashboardDataResolver.ts`, `DashboardOverview.tsx`, `docs/dashboard-data-contract.md` | Google Sheets or empty state | Strategic operations registry, QA registry, assessment/result registry, Classroom sync registry | Setup states remain until the manager-specific registries are created |
| DASH-TEACHER-001 | Teacher dashboard | Dashboard | Teacher | Partial | Teacher dashboard model and live sheet mapper exist without local role mock fallback | `dashboardDataResolver.ts`, `docs/dashboard-data-contract.md` | Google Sheet or empty state | Teacher allocation + Classroom + planner sheets | Needs authenticated teacher scoping |
| DASH-STUDENT-001 | Student dashboard | Dashboard | Student | Partial | Student dashboard now resolves from live student, timetable, attendance, assignment, and announcement rows | `dashboardDataResolver.ts`, `DashboardOverview.tsx`, `docs/dashboard-data-contract.md` | Google Sheet or empty state | Student registry, timetable, attendance, Classroom sync, study-file registries | Setup states remain until the selected student is resolved from live rows |
| DASH-SQAA-001 | Compliance/SQAA dashboard | Dashboard/Compliance | Principal, admin, compliance | Mock Only | Compliance categories exist in mock principal/governance/SQAA files | `governance-compliance.mock.json`, `sqaa-evidence.mock.json`, `SystemGovernance.tsx` | Mock JSON/docs | SQAA framework registry + evidence map | Not verified as live compliance tracker |
| DRIVE-001 | Google Workspace connection | Drive | Admin, principal, teachers | Partial | URL modal, test endpoint, Firebase scopes, Drive API metadata fetch | `App.tsx`, `firebaseAuth.ts`, `server.ts`, `dataSourceEngine.ts` | OAuth token/public API key/mock fallback | Google Drive folder ID + OAuth token | Read-only metadata only |
| DRIVE-002 | SDOS folder/manifest model | Drive/SDOS | Admin, governance | Mock Only | Manifest JSON, docs, PowerShell script, governance browser | `schooly-drive-manifest.json`, `create-sdos-drive.ps1`, `SystemGovernance.tsx` | Local manifest/script | Live Drive folder creation/index | Script creates local folders, not Google Drive |
| DRIVE-003 | Artifact/file inventory | Drive | All authorized | Partial | Workspace files endpoint merges live Drive metadata with mock files | `server.ts`, `google-workspace.mock.json`, `UniversalSearch.tsx` | Google Drive metadata + mock database | Drive API file listing with stored root | Needs no-silent-mock labeling everywhere |
| SHEETS-001 | Google Sheets dashboard source | Sheets/Dashboard | Principal, coordinator, teacher | Partial | Resolver fetches gviz tabs, maps metrics, and returns empty state when unavailable | `dashboardDataResolver.ts`, `dashboardConfig.ts`, `docs/dashboard-data-contract.md` | Published Google Sheet or empty state | Live dashboard sheet/registries | Provisioning prompt added for sheet bundle creation |
| REG-001 | Seeded live registry configuration | Data sources | Admin, coordinator | Partial | Explicit seeded registry config keys exist for master data, NCERT private Drive map, Lesson Workspace, QA/SQAA, dashboard, NCERT registry, and seed TOCs | `src/lib/seededRegistryConfig.ts`, `dashboardConfig.ts`, `ncertRegistry.ts` | localStorage-configured Google Sheet URLs | Uploaded seeded Google Sheets | URLs are configurable; private Sheet URLs are not hardcoded |
| REG-002 | Master data registry reader | School setup | Admin, coordinator, teacher | Partial | Narrow reader supports `School_Profile`, `Academic_Years`, `Classes_Sections`, `Subjects`, `Staff_Directory`, `Teacher_Allocations`, `Timetable`, `Student_Directory`, and `Data_Source_Status` tabs | `src/lib/schoolRegistry.ts`, `LessonPlanner.tsx` | Google Sheets tabs when configured; visibly labelled demo fallback otherwise | `Schooly_Master_Data_Registry_SEEDED` | Used in LessonPlanner for class/subject/teacher allocations where safe |
| CLASSROOM-001 | Google Classroom read sync | Classroom | Coordinator, teacher, admin | Partial | Server fetches courses, announcements, coursework with token | `server.ts`, `ClassroomManager.tsx`, `firebaseAuth.ts` | Classroom API or mock JSON | OAuth Classroom API | Read path only; scoped by token availability |
| CLASSROOM-002 | Classroom publish/mapping | Classroom | Teacher, coordinator | Partial | Lesson/Textbook workflows reference Classroom publishing; classroom mock includes assignments | `LessonPlanner.tsx`, `TextbookIngestor.tsx`, `ClassroomManager.tsx` | Mock/in-memory/UI actions | Classroom API write scopes + approval queue | OAuth scopes are read-only, so production publish is not complete |
| TASKS-001 | Tasks/productivity | Operations | All staff/selected roles | Partial | Task endpoints and UI exist | `TaskProductivity.tsx`, `server.ts` | In-memory server arrays/mock | Sheet registry or Drive task log | No durable persistence verified |
| AI-001 | AI copilot/artifact generation | AI | Teacher, coordinator, principal | Partial | Gemini client, robust generation helper, assistant UI, lesson/textbook AI endpoints | `server.ts`, `AIAssistants.tsx`, `LessonPlanner.tsx`, `TextbookIngestor.tsx` | Gemini + mock/workspace inputs | Approved live registries + audit log | Needs human review logging |
| AI-002 | AI quality review | AI/QA | Coordinator, compliance | Missing | SQAA/QA prompts exist, but no durable review registry verified | `prompts/sdos-connectors/*.md`, `sqaa-evidence.mock.json` | Prompt docs/mock | QA checklist + AI review log | MVP-critical gap |
| CHAT-001 | Chat assistant | AI/Chat | All | Partial | Universal Search Q&A and assistant-style UI exist | `UniversalSearch.tsx`, `AIAssistants.tsx`, `server.ts` | Workspace files/mock + Gemini | Scoped live content index | Not a governed full chat assistant |
| ROLLOVER-001 | Academic rollover wizard | Academic year | Admin, coordinator | Partial | Rollover component/endpoints/config state exist | `AcademicRollover.tsx`, `server.ts`, `previous-academic-year.mock.json` | In-memory + mock | Academic year registry + archive source | No live year registry |
| GOV-001 | Governance/RBAC admin | Governance | Admin, principal | Partial | Schema editor/governance panels and audit logs exist | `SystemGovernance.tsx`, `schemaEngine.ts`, `server.ts` | Local schema/in-memory audit/mock | Signed governance registry | Client-side changes not production governance |
| QA-001 | QA checklist configuration | QA | Coordinator, compliance | Missing | No dedicated registry found | N/A | N/A | Google Sheet QA checklist registry | Add before live compliance claims |
| QA-002 | Review/audit evidence workflow | QA/Governance | Coordinator, compliance | Mock Only | Audit logs and SQAA mock evidence exist | `SystemGovernance.tsx`, `sqaa-evidence.mock.json`, `governance-compliance.mock.json` | Mock/in-memory | Evidence map + review status sheet | Needs human approval states |
| SQAA-001 | SQAA evidence map | Compliance | Compliance, principal | Mock Only | Mock file and test prompt exist | `sqaa-evidence.mock.json`, `prompts/sdos-connectors/06-sqaa-evidence-linking-test.md` | Mock JSON | SQAA registry + Drive evidence links | No live validation verified |
| SQAA-002 | NEP/NCF/CBSE mapping | Compliance | Compliance, academic leaders | Mock Only | NEP mock/prompt and CBSE docs/script defaults exist | `nep-alignment.mock.json`, `create-sdos-drive.ps1` | Mock/docs | Framework registries/versioning | NCF/state/IB extensibility not implemented |
| LESSON-001 | Lesson Workspace registry | Lesson Workspace | Teacher, coordinator | Partial | Lesson planner and textbook ingestor create/display lesson plan records | `LessonPlanner.tsx`, `TextbookIngestor.tsx`, `server.ts` | In-memory/local/mock/Drive file metadata | Google Sheet registry + Drive folder outputs | Needs central durable registry |
| LESSON-002 | Artifact generation suite | Lesson Workspace | Teacher | Partial | Lesson plan, quiz, homework, worksheet, rubric, source/markdown-like artifacts appear in UI/endpoints | `LessonPlanner.tsx`, `TextbookIngestor.tsx`, `server.ts` | Gemini + mock/inputs | Artifact registry + Drive outputs | Needs acceptance workflow and Classroom publish |
| TOC-001 | TOC/book ingestion | Curriculum | Teacher, coordinator | Partial | TOC image/web/manual ingestion and NCERT fallback lists exist | `TextbookIngestor.tsx`, `server.ts` | AI extraction + fallback NCERT catalogs | Uploaded book/PDF/Drive/source registry | Needs copyright/source controls |
| NCERT-001 | NCERT external registry strategy | Curriculum/NCERT | Admin, coordinator, teacher | Partial | Tracker now defines the consolidated English-medium NCERT registry as the live source for class, subject, book, and chapter lists | `docs/SCHOOLY_FEATURE_TRACKER.md`, `TextbookIngestor.tsx`, `LessonPlanner.tsx`, `server.ts` | Consolidated Google Sheet registry + private Drive map | External CSV/Google Sheet registry | MVP must avoid bundled PDFs |
| NCERT-002 | NCERT book registry | Curriculum/NCERT | Admin, coordinator | Partial | `src/lib/ncertRegistry.ts` reads `NCERT_Book_Registry` from the consolidated Google Sheet and TextbookIngestor/LessonPlanner use live registry book rows only | `ncertRegistry.ts`, `TextbookIngestor.tsx`, `LessonPlanner.tsx` | Google Sheets registry only | External CSV/Google Sheet registry | Book records include class, subject, medium, title, official URL, portal, checked date, version notes; `ncert_book_id` is the primary identity |
| NCERT-003 | NCERT chapter/TOC registry | Curriculum/NCERT | Teacher, coordinator | Partial | Registry reader reads `NCERT_Chapter_Registry`; TOC Pending rows are excluded from real chapter counts and Needs Human Review is labelled | `ncertRegistry.ts`, `TextbookIngestor.tsx`, `LessonPlanner.tsx` | Google Sheets chapter registry | External CSV/Google Sheet chapter registry | Chapters must be reviewed metadata linked to book IDs |
| NCERT-004 | School-selected books mapping | Curriculum/NCERT | Admin, coordinator | Partial | Registry reader reads `School_Selected_Books` rows, though full school-selection UI is not yet implemented | `ncertRegistry.ts` | Google Sheets `School_Selected_Books` | `School_Selected_Books` external Sheet/CSV | Maps selected books to academic year, class, section, subject |
| NCERT-005 | Official complete-book download links | Curriculum/NCERT | Teacher, coordinator, admin | Partial | TextbookIngestor surfaces official source URLs from selected registry book rows without bundling PDFs | `ncertRegistry.ts`, `TextbookIngestor.tsx` | Google Sheets registry official URL fields | External registry with official NCERT/ePathshala URLs | Show official source links without bundling PDFs |
| NCERT-006 | Optional selected-book import to school Google Drive | Curriculum/Drive | Admin | Missing | Drive metadata read exists, but no selected NCERT import log/automation found | `server.ts` | N/A | School Drive file IDs/URLs in `School_Selected_Books` and import log | P1 automation; manual selected-book testing may begin earlier |
| NCERT-007 | NCERT source/version/rationalised-content tracking | Curriculum/NCERT | Coordinator, compliance | Missing | No source/version log found | N/A | N/A | External source/version log | Track checked date, detected changes, and action required |
| NCERT-008 | Lesson Workspace integration from NCERT chapter | Lesson Workspace/NCERT | Teacher | Partial | LessonPlanner can propose a draft Lesson Workspace from selected NCERT book/chapter rows and stores NCERT IDs/status fields | `ncertRegistry.ts`, `TextbookIngestor.tsx`, `LessonPlanner.tsx` | Selected NCERT book/chapter registry with fallback labels | Selected NCERT book/chapter registry | Create Lesson Workspace from selected metadata, not hardcoded fallback lists |
| NCERT-009 | NCERT learning outcome / QA / SQAA mapping support | Curriculum/QA/SQAA | Coordinator, compliance, teacher | Missing | No NCERT learning outcome or QA/SQAA mapping registry found | N/A | N/A | External mapping registry + QA/SQAA registries | Link NCERT chapter to learning outcomes, QA expectations, SQAA categories |
| NCERT-010 | Future Schooly managed server cache | Curriculum/Architecture | Admin, platform | Deferred | No cache implementation; tracker explicitly defers this architecture | `docs/SCHOOLY_FEATURE_TRACKER.md` | N/A | Future server architecture only | Requires legal/terms review and architecture approval |
| NCERT-011 | NCERT chapter PDF Drive mapping | Curriculum/Drive | Admin, coordinator, teacher | Partial | Optional `NCERT_Chapter_File_Map` tab can be read from a private map Sheet; LessonPlanner/TextbookIngestor show PDF linked/missing/pending/ambiguous labels and only attach source-file metadata for linked rows | `ncertRegistry.ts`, `TextbookIngestor.tsx`, `LessonPlanner.tsx` | Private Google Sheet map rows | Reviewed private Drive map Sheet | No PDFs are downloaded, scanned, or mutated in this task |
| NCERT-012 | NCERT private Drive source folder registry | Curriculum/Drive | Admin, coordinator | Partial | Optional `NCERT_Drive_Source_Folders` tab can be read and matched to books by `ncert_book_id` or exact class/subject/medium/title fallback | `ncertRegistry.ts`, `TextbookIngestor.tsx`, `LessonPlanner.tsx` | Private Google Sheet folder rows | Reviewed private Drive map Sheet | Shows Drive folder configured/missing; no Drive file listing is performed |
| NCERT-013 | NCERT chapter-file match review | Curriculum/Drive/QA | Coordinator, teacher | Partial | App labels ambiguous/pending/missing PDF map statuses and keeps ambiguous PDF matches out of source-file metadata | `ncertRegistry.ts`, `LessonPlanner.tsx`, `TextbookIngestor.tsx` | Private Sheet match status/review status | Review workflow + optional future writeback | MVP remains CSV/import workflow; no unsafe writeback implemented |
| NCERT-014 | NCERT registry de-duplication and overlay precedence | Curriculum/NCERT | Admin, coordinator, teacher | Partial | Effective registry view merges only matching `ncert_book_id` book rows, prioritizes seed TOC rows, and excludes TOC Pending stubs from chapter counts | `ncertRegistry.ts`, `TextbookIngestor.tsx`, `LessonPlanner.tsx` | Main registry + seed overlay Google Sheets | Reviewed registry data | Different `ncert_book_id` rows remain separate even under the same class/subject/medium |
| NCERT-015 | Rule-driven registry validation | Curriculum/NCERT/QA | Admin, coordinator, teacher | Partial | Generic validator reports naming convention, obsolete identity, replacement TOC, identity consistency, reference integrity, chapter-prefix, placeholder, and private map issues with source row/cell metadata where available | `registryValidation.ts`, `ncertRegistry.ts`, `TextbookIngestor.tsx` | Loaded NCERT/public/private registry rows | Reviewed registry rows + future test suite | Reports only; no Google Sheets writeback |
| NCERT-016 | Action-scoped registry blockers | Curriculum/NCERT/QA | Teacher, coordinator | Partial | Registry Data Quality distinguishes global issues from current-action blockers; refresh/validate never blocks, discovery/extraction ignore unrelated stale lesson-map rows, workspace/Classroom actions use stricter selected-book blockers; TOC Pending blockers apply only to selected books with zero real chapters | `registryValidation.ts`, `TextbookIngestor.tsx` | Validation issues from loaded registry rows | Expanded action coverage across all NCERT-linked screens | Current UI coverage is strongest in TextbookIngestor; LessonPlanner publish gates need further unification |
| NCERT-017 | Registry manual-fix workflow | Curriculum/NCERT/QA | Admin, coordinator | Partial | Data Quality panel groups TOC Pending info rows, shows row/cell/source details, filters issue severities/action blockers/current selection, and provides suggested manual fixes plus copyable reports | `registryValidation.ts`, `TextbookIngestor.tsx` | Validation issues from loaded registry rows | Manual Sheet cleanup by registry owner | Interactive guidance only; no automatic Sheet mutation |
| NCERT-018 | Textbook source selection UX | Curriculum/NCERT | Teacher, coordinator | Partial | Syllabus Source Selection now separates official NCERT URL, Google Drive file link, Google Drive folder, local PDF upload, TOC screenshot, and manual chapter entry; Drive file/folder links show parsed ID/validity before actions run | `TextbookIngestor.tsx` | User-provided source link/file plus optional private Drive map rows | Reviewed extraction/matching workflow | Folder-level extraction is intentionally not implemented; Drive folder use is limited to configured/matching metadata today |
| NCERT-019 | Textbook extraction action status | Curriculum/NCERT/QA | Teacher, coordinator | Partial | The old combined extract-and-sync action is split into `Extract Syllabus` plus a disabled future sync button; actions show running/success/warning/error/blocked status, validation result, selected source, outcome, and next step | `TextbookIngestor.tsx` | Current UI state and action-scoped validation | Durable extraction review + future Drive sync | No silent no-op; sync to Google Drive remains a future workflow after extraction review |
| NCERT-020 | Async action processing feedback | Curriculum/NCERT/UX | Teacher, coordinator | Partial | Long-running NCERT Textbook actions now show a shared processing overlay, button-level busy labels, duplicate-click guards, and separate Action Status updates while Registry Data Quality remains visible | `TextbookIngestor.tsx` | Current UI state | Broader reuse across other Schooly screens | Covers registry refresh, Drive matching, extraction, delete selected/all, and future sync placeholder |
| NCERT-021 | Source-aware Drive matching readiness | Curriculum/NCERT/Drive | Teacher, coordinator | Partial | `Find Matching Drive PDFs` now requires a Drive file, Drive folder, or usable private Drive map row; Official NCERT URL is clearly marked ready for extraction but not Drive matching, with diagnostics for class/subject/book/source/map readiness | `TextbookIngestor.tsx` | User source selection + optional private Drive map rows | Read-only Drive file listing/matching workflow if scopes permit later | No Drive scanning, Drive mutation, or OAuth scope changes were added |
| NCERT-022 | TOC Pending validation grouping polish | Curriculum/NCERT/QA | Admin, coordinator | Partial | TOC Pending placeholder issues use stable group keys in the UI and copied report summarizes affected row ranges for large groups instead of dumping every row | `registryValidation.ts`, `TextbookIngestor.tsx` | Loaded registry validation issues | Manual cleanup workflow and validator tests | Informational TOC Pending rows remain non-blocking unless selected-book action rules require reviewed chapters |
| NCERT-023 | NCERT class coverage KPIs and folder-map usage | Curriculum/NCERT/UX | Teacher, coordinator | Partial | Header now shows class coverage cards with subject chapter-count chips for drill-through; selected books with Drive folder or linked PDF rows show a `*` marker; configured Drive folders can be used when reviewed chapter-file map rows exist | `TextbookIngestor.tsx` | NCERT chapter registry + private Drive folder/file map rows | Folder scanner or reviewed file-map workflow | Bare folder scanning is not implemented; usage is metadata/map-driven only |
| RESUMEIQ-001 | ResumeIQ/recruitment module | Recruitment | HR/admin | Deferred | No ResumeIQ/recruitment references found in repo search | N/A | N/A | Future recruitment integration | Keep outside academic MVP |

## 4. MVP Feature List

| MVP Priority | Feature ID | Feature Name | User Role | User Value | Included in MVP | Reason | Dependencies | Acceptance Criteria | Status | Notes |
| ------------ | ---------- | ------------ | --------- | ---------- | --------------- | ------ | ------------ | ------------------- | ------ | ----- |
| P0 | DRIVE-001 | Google Drive connection / selected root | Admin | Select the school Drive root and verify access | Yes | Live metadata begins here | OAuth, root folder ID | User can connect, see selected root, and see explicit live/mock/permission state | Partial | Existing connection is not enough without persisted selected root |
| P0 | APP-003 | School setup/configuration registry | Admin | Store school code, curriculum, stages, sections, identities | Yes | Everything else depends on school metadata | Google Sheet registry | Registry loads, validates, and displays missing fields | Missing | Use Sheet first under no-backend constraint |
| P0 | ROLLOVER-002 | Academic year registry | Admin, coordinator | Track active year and historical rollover | Yes | Required for Drive paths and dashboards | Setup registry | Current year is loaded from live registry, not hardcoded | Missing | Rollover UI exists but no live registry |
| P0 | APP-004 | Classes/sections/subjects registry | Coordinator | Standardize dashboard and lesson filters | Yes | Prevents hardcoded class/subject samples | Setup registry | Class, section, subject lists read from live Sheet | Missing | Current data mostly mock/config |
| P0 | RBAC-003 | Staff and teacher allocation registry | Admin, coordinator | Scope teacher dashboards and lesson ownership | Yes | Required for permissions and KPI ownership | Role registry, staff Sheet | Teacher allocations drive dashboard filters | Missing | Roles exist but allocations are demo |
| P0 | SHEETS-001 | Live dashboard source adapter | Principal, coordinator, teacher | Replace mock KPIs with live rows | Yes | Core MVP dashboard value | Published Sheet contract | Dashboards read `Schooly_Dashboard_Source_SEEDED` and label empty/legacy/wrong-source states visibly | Partial | Resolver supports canonical tabs and legacy warnings |
| P0 | DASH-PRINCIPAL-001 | Principal dashboard live KPIs | Principal | See school-level activity and risks | Yes | Executive MVP screen | Live dashboard adapter | KPIs derive from live tabs with empty/partial/error states | Partial | No local role-dashboard mock fallback |
| P0 | DASH-COORD-001 | Coordinator dashboard live KPIs | Coordinator | Track planner/classroom/remedial readiness | Yes | Academic operations MVP | Live dashboard adapter | Coordinator cards update from live rows | Partial | Needs department/class filters |
| P0 | DASH-TEACHER-001 | Teacher dashboard live KPIs | Teacher | Track own classes and submissions | Yes | Teacher usefulness | Staff allocation + live adapter | Teacher sees own scoped rows | Partial | Needs auth identity scoping |
| P0 | DASH-SQAA-001 | Compliance/SQAA dashboard | Principal, compliance | Track evidence gaps | Yes | Compliance is MVP-critical | SQAA registry, evidence map | Dashboard separates verified evidence from missing/unreviewed | Mock Only | Do not mark complete from mock |
| P0 | LESSON-001 | Lesson Workspace registry | Teacher, coordinator | Central planning unit per class/subject/chapter | Yes | Core academic workflow | Class/subject registry, Drive root | Workspace record can be created/listed/filtered from live registry | Partial | Existing planner is not durable enough |
| P0 | LESSON-003 | Artifact registry | Teacher | Track generated/uploaded lesson artifacts | Yes | Needed for QA, Drive, Classroom | Lesson Workspace registry | Artifacts have type, owner, status, Drive link, review state | Missing | Current files are mixed with mock workspace |
| P0 | QA-001 | QA checklist configuration | Coordinator | Standardize review criteria | Yes | Prevents arbitrary AI approval | QA Sheet registry | Checklist can be loaded per artifact type | Missing | No registry found |
| P0 | AI-002 | AI quality review log | Coordinator | Record human-reviewed AI outputs | Yes | Reduces hallucination/compliance risk | QA checklist, artifact registry | AI output has reviewer, decision, timestamp, notes | Missing | Required before compliance claims |
| P0 | SQAA-003 | SQAA framework registry | Compliance | Store SQAA domains/indicators/versions | Yes | Evidence map needs source framework | SQAA Sheet | Framework loads with version and status | Missing | Mock SQAA file is reference only |
| P0 | SQAA-001 | SQAA evidence map | Compliance | Link artifacts/files to indicators | Yes | Board/compliance evidence | Framework registry, Drive file IDs | Evidence link can be verified and marked reviewed | Mock Only | Existing mock demonstrates intended shape |
| P0 | DASH-STATE-001 | Dashboard empty/partial/permission/error states | All dashboard roles | Trust dashboard data quality | Yes | Prevent silent bad data | Live adapter | UI differentiates empty, partial, permission denied, legacy source, and wrong file type | Partial | Source labels exist; permission detail still needs strengthening |
| P0 | MOCK-001 | Clear demo/mock mode labeling | All | Avoid mistaking demo for production | Yes | Critical trust/safety issue | Data resolver + UI labels | Every mock-backed screen is visibly labeled | Partial | Some labels exist; not universal |
| P1 | CLASSROOM-002 | Google Classroom mapping and publishing | Teacher, coordinator | Publish approved materials to Classroom | Yes, P1 | Useful after lesson registry is stable | Classroom write scopes, approval flow | Approved artifact maps to course/topic and publishes or queues | Partial | Current OAuth scopes are read-only |
| P1 | CHAT-001 | Chat assistant | Staff | Ask scoped questions across files/registries | Yes, P1 | Useful but not first data layer | Live index, RBAC | Answers cite scoped sources and respect permissions | Partial | Search/Q&A exists; governance incomplete |
| P1 | TOC-001 | Book/TOC ingestion | Teacher | Seed lesson workspace from textbook | Yes, P1 | Accelerates planning | Lesson registry, copyright controls | TOC upload creates reviewed chapter records | Partial | Existing AI/fallback path needs governance |
| P0 | NCERT-001 | NCERT external registry strategy | Admin, coordinator | Define official-link-first NCERT handling | Yes | Avoids bundling PDFs and keeps source policy clear | Tracker strategy | Tracker defines official-link-first NCERT strategy and avoids bundled PDFs | Partial | Strategy documented; implementation still needed |
| P0 | NCERT-002 | NCERT book registry | Admin, coordinator | Select books from reviewed metadata | Yes | Book metadata is required before chapter/workspace use | External CSV/Google Sheet registry | Book records include class, subject, medium, title, official URL, source portal, checked date, version notes | Partial | Reader exists; full admin registry management is not implemented |
| P0 | NCERT-003 | NCERT chapter/TOC registry | Teacher, coordinator | Use reviewed chapter metadata | Yes | Lesson Workspace should start from reviewed chapters | NCERT book registry | Chapters are stored as reviewed metadata rows linked to book IDs | Partial | Seed overlay rows are read and labelled; human review workflow still needed |
| P0 | NCERT-004 | School-selected books mapping | Admin, coordinator | Map selected books to the school timetable/curriculum | Yes | Schools use different books/mediums/editions | Book registry + school setup | School can map selected NCERT books to academic year, class, section, and subject | Partial | `School_Selected_Books` rows are read; school-selection management UI is missing |
| P0 | NCERT-005 | Official complete-book download links | Teacher, coordinator, admin | Let schools access official source books | Yes | MVP must rely on official source links, not bundled PDFs | NCERT book registry | Schooly can show official source links for selected books without bundling PDFs | Partial | TextbookIngestor surfaces registry source URLs |
| P1 | NCERT-006 | Optional selected-book import to school Google Drive | Admin | Store school-controlled copies when desired | Yes, after P0 registry | Useful for testing and school-controlled use | Drive connection + selected books mapping | Imported school Drive file ID and URL can be stored; automation deferred if needed | Missing | Manual testing may begin with a few selected books |
| P1 | NCERT-007 | NCERT source/version/rationalised-content tracking | Coordinator, compliance | Know whether source metadata is stale | Yes | Official sources can change | Source/version log | Source checked date, detected change, and action required can be tracked | Missing | Supports rationalised-content review |
| P0 | NCERT-008 | Lesson Workspace integration from NCERT chapter | Teacher | Create lessons from selected chapter metadata | Yes | Central lesson flow must avoid hardcoded fallback data | Lesson registry + NCERT book/chapter registry | Lesson Workspace can be created from selected NCERT book/chapter metadata, not hardcoded fallback data | Partial | Draft workspace creation stores NCERT IDs and status; production review workflow remains |
| P1 | NCERT-009 | NCERT learning outcome / QA / SQAA mapping support | Coordinator, teacher, compliance | Link lesson planning to outcomes and evidence | Yes | QA/SQAA needs chapter context | NCERT chapter registry + QA/SQAA registries | NCERT chapter can be linked to learning outcomes, QA checklist expectations, and SQAA evidence categories | Missing | Pair with QA/SQAA MVP |
| Deferred | NCERT-010 | Future Schooly managed server cache | Platform/admin | Optional future cached access | No | Requires legal and server architecture review | Future server architecture | Only documented as future architecture; not implemented; requires legal/terms review and server architecture approval | Deferred | Must never be source of truth |
| P2 | ROLLOVER-001 | Academic rollover wizard | Admin | Archive and seed next year | Later MVP | Useful once registries are live | Academic year registry | Rollover creates preview and requires approval | Partial | Mock-backed today |
| Deferred | RESUMEIQ-001 | ResumeIQ/recruitment | HR/admin | Recruitment workflows | No | Outside academic MVP | Future module | No academic MVP dependency | Deferred | No working integration found |

## 5. Mock-to-Live Data Conversion Tracker

Production dashboards must not silently read mock JSON. If demo/sample mode is retained, it must be visibly labelled, separated from live mode, and blocked from being interpreted as verified school evidence.

| Mock Entity / Field | Current Usage | Dashboard / Feature Affected | Current Source | Required Live Source | API / Registry Needed | Replacement Strategy | Status | Acceptance Criteria | Notes |
| ------------------- | ------------- | ---------------------------- | -------------- | -------------------- | --------------------- | -------------------- | ------ | ------------------- | ----- |
| Workspace/root drive name | Connection UI and governance labels | Drive, dashboards, search | `google-workspace.mock.json`, localStorage, manifest sample | Selected Google Drive folder | Drive API + setup Sheet | Store selected root ID/name in registry | Partial | Root name and ID shown from live verified source | Current default can be demo URL |
| Academic years | Rollover and SDOS paths | Rollover, dashboards, lesson workspace | `previous-academic-year.mock.json`, manifest | Academic year registry | Google Sheet | Add `academic_years` tab | Missing | Active year controls filters and paths | Required P0 |
| Folders | Search/governance/Drive panels | Drive, SDOS | `google-workspace.mock.json`, manifest | Drive folder listing | Drive API | Sync metadata into registry/cache view | Partial | Folder IDs, names, parents, permissions from live | Server can fetch metadata with token |
| Folder paths | SDOS and lesson outputs | Drive, lesson workspace | Mock paths/local script | Derived from root + registry | Drive API + registry | Resolve from Drive IDs, not string paths | Mock Only | Path display is traceable to folder IDs | Local Windows paths are demo |
| Folder access audience | Governance/compliance | RBAC, Drive safety | Mock ACL fields/docs | Drive permissions API | Drive API permissions | Read and label permission state | Mock Only | Student/staff access is verified live | Do not rely on docs-only rule |
| File inventory | Universal Search, dashboards | Search, Drive, compliance | Workspace mock + live merge | Drive files list | Drive API | Prefer live files; isolate mock demo set | Partial | User sees live/mock origin per file | Server currently merges live and mock |
| File MIME type | Search/filtering/artifact type | Search, lesson artifacts | Mock/file metadata | Drive API `mimeType` | Drive API | Normalize MIME to artifact type | Partial | MIME and artifact type visible from live metadata | Existing mapper is partial |
| Artifact type | Lesson and compliance | Lesson workspace, QA | `academic-artifacts.mock.json`, file tags | Artifact registry | Google Sheet | Add artifact type enum registry | Mock Only | Every artifact has type/source/status | Needed for QA |
| Class/section/subject/chapter metadata | Filters and planner | Dashboards, lesson, TOC | Mock, hardcoded lists, NCERT fallback | Class/subject registry + TOC registry | Google Sheet | Normalize entities and foreign keys | Partial | Filters come from registry, not hardcoded lists | Current Class X/VIII samples |
| Owner/createdBy/updatedBy | Audit and file cards | Search, QA, lesson | Mock owners/live Drive owners | Auth identity + Drive metadata | Firebase Auth + Drive API | Store owner IDs and reviewer IDs | Partial | Ownership is sourced and auditable | Current user is simulated |
| Timestamps | Dashboards/audit | Audit, Drive, tasks | Mock timestamps/in-memory | Drive/Sheets timestamps | Drive API + Sheet rows | Store created/updated/lastSync | Partial | Last sync and row timestamps displayed | Needs standardized timestamp fields |
| Curriculum source | SDOS/lesson | Lesson, compliance | CBSE docs/mock | Curriculum registry | Google Sheet | Add curriculum/framework tabs | Mock Only | Source/version displayed per plan | CBSE defaults are script/docs |
| Framework alignment | SQAA/NEP/CBSE cards | Compliance, QA | `nep-alignment.mock.json`, `sqaa-evidence.mock.json` | Framework registry + evidence map | Google Sheet | Human-reviewed mapping workflow | Mock Only | AI-mapped items cannot be complete before review | MVP blocker |
| SQAA evidence links | Compliance dashboard | SQAA | `sqaa-evidence.mock.json` | Drive file IDs + evidence map Sheet | Drive API + Google Sheet | Link evidence to verified file IDs | Mock Only | Broken links and missing evidence are shown | Existing prompt is test-only |
| Tags | Search and AI suggestions | Search, Drive | Mock tags + AI tag endpoint | File metadata registry | Drive API + Sheet | Allow reviewed tags in registry | Partial | Tags carry source and confidence | AI suggestions need approval |
| Access/student visibility | Student safety | Student/search/governance | Mock fields/docs | Drive permissions + Classroom roles | Drive/Classroom APIs | Enforce on server/data resolver | Mock Only | Student cannot receive restricted records | Current RBAC is client-side |
| Permissions | Compliance/safety | Drive, RBAC | Mock/docs | Drive permissions API + auth claims | Drive API/Firebase | Surface permission errors distinctly | Partial | Permission denied is not fallback-to-mock | Critical |
| Shared drives | Drive inventory | Search, governance | Mock paths | Drive API supports corpora/shared drives | Drive API | Add shared drive selector | Missing | Shared drive files can be indexed | Not verified |
| Classroom courses | Classroom dashboard | Classroom, teacher dashboards | Mock + Classroom API read | Google Classroom API | Classroom API | Prefer live courses by token | Partial | Courses list has live/mock state | Server read exists |
| Classroom assignments | Classroom dashboard | Classroom, teacher/student | Mock + Classroom API read | Google Classroom API | Classroom API | Map coursework to class/subject registry | Partial | Assignments linked to courses and dates | Publish not complete |
| Planner submissions | Principal/coordinator/teacher KPIs | Dashboards | Mock dashboard/Form data | Google Form response Sheet | Google Sheets | Add dashboard tab and resolver validation | Partial | Submission rates derive from live rows | Contract doc exists |
| Compliance evidence | SQAA dashboard | Compliance | Governance/SQAA mocks | Evidence map Sheet + Drive links | Sheets + Drive | Build reviewed evidence register | Mock Only | Verified/missing/unreviewed states visible | MVP P0 |
| Dashboard KPI rows | All dashboards | Principal/coordinator/teacher | Legacy dashboard mock JSON removed from role flow | `Schooly_Dashboard_Source_SEEDED` canonical tabs | Google Sheets | Complete resolver and visible state labels | Partial | No silent mock fallback | Resolver maps canonical tabs and legacy aliases |

## 6. Dashboard Live Data Tracker

| Dashboard | Role | KPI / Card / Table | Current Data Source | Target Live Data Source | Google API / Sheet / Registry | Filters Required | Drilldown Required | Empty State | Partial Data State | Permission Error State | Last Sync Needed | Status | Acceptance Criteria |
| --------- | ---- | ------------------ | ------------------- | ----------------------- | ----------------------------- | ---------------- | ------------------ | ----------- | ------------------ | ---------------------- | ---------------- | ------ | ------------------- |
| Principal | Principal | Classrooms Active | Mock JSON or Google Sheet tab | Classroom courses/activity rows | Classroom API + `classroom_activity` tab | Academic year, class, section | Course list | Yes | Yes | Yes | Yes | Partial | KPI derives from live rows or shows labeled fallback |
| Principal | Principal | Weekly Planners Submitted | Mock/Form dashboard rows | Planner submissions Sheet | `planner_submissions` tab | Year, week, stage | Missing planners | Yes | Yes | Yes | Yes | Partial | Submitted/total/overdue come from live tab |
| Principal | Principal | Assessments on Track | Mock dashboard rows | Assessment tracking Sheet | `assessment_tracking` tab | Year, class, subject | Subject breakdown | Yes | Yes | Yes | Yes | Partial | Live percentages replace mock values |
| Principal | Principal | Compliance Score | Mock compliance rows | SQAA evidence map | `compliance_evidence` + SQAA registry | Framework version | Evidence links | Yes | Yes | Yes | Yes | Mock Only | Only reviewed evidence counts |
| Academic Coordinator | Coordinator | Planner matrix | Coordinator mock or sheet | Planner submissions registry | `planner_submissions` | Stage, class, section | Teacher/class detail | Yes | Yes | Yes | Yes | Partial | Matrix rows trace to live submissions |
| Academic Coordinator | Coordinator | Classroom activity | Mock/Classroom API | Classroom API/coursework | Classroom API + registry | Class, section, subject | Course detail | Yes | Yes | Yes | Yes | Partial | Inactive/missing courses listed |
| HOD | HOD | Department subject coverage | Shared dashboard/mock | Subject planner registry | `syllabus_coverage` + staff allocation | Department, subject | Teacher/class detail | Yes | Yes | Yes | Yes | Mock Only | Dedicated HOD view uses subject scope |
| Manager | Manager | Strategic operations KPI strip | Mock dashboard rows | Strategic operations registry | `dashboard_metrics`, `budget_utilization`, `strategic_milestones`, `operational_checklist` | Academic year, owner, review period | Drill into source row | Yes | Yes | Yes | Yes | Partial | KPIs come only from live rows or setup state |
| Manager | Manager | Compliance checklist | Mock review rows | QA and compliance registry | `qa_checklist_config`, `qa_review_log`, `sqaa_evidence_map` | School, academic year, review stage | Evidence detail | Yes | Yes | Yes | Yes | Partial | Checklist rows never invent completion |
| Manager | Manager | Announcements / source health | Mock alerts | Classroom and source registries | `classroom_announcement_sync`, `dashboard_source_log` | Academic year, class, section | Announcement detail | Yes | Yes | Yes | Yes | Partial | Source URLs stay hidden from users |
| Student | Student | KPI strip / tasks / timetable / announcements | Mock student cards | Student registry + classroom/timetable/attendance rows | `student_directory`, `student_enrollment`, `timetable`, `attendance_summary`, `classroom_assignment_map`, `classroom_submission_sync`, `classroom_announcement_sync`, `books_registry`, `book_toc_registry` | Student name/ID, class, section, academic year | Assignment/timetable/announcement detail | Yes | Yes | Yes | Yes | Partial | Student portal must resolve live student identity before rendering |
| Teacher | Teacher | Assigned classes | Teacher mock/sheet | Staff allocation + Classroom | Staff allocation Sheet + Classroom API | Auth user, class, subject | Class detail | Yes | Yes | Yes | Yes | Partial | Teacher sees only assigned rows |
| Teacher | Teacher | Planner/assessment/notebook status | Teacher mock/sheet | Planner, assessment, notebook tabs | Sheets | Auth user, week | Artifact/task detail | Yes | Yes | Yes | Yes | Partial | Data source labels shown |
| Compliance/SQAA | Compliance | Evidence gaps | SQAA mock | Evidence map + framework registry | Sheets + Drive API | Framework version, domain | Evidence file detail | Yes | Yes | Yes | Yes | Mock Only | Missing evidence cannot look complete |
| Google Classroom Sync | Coordinator/teacher | Courses, assignments, announcements | Mock + read API | Classroom API | Classroom API | Teacher, class, subject | Coursework detail | Yes | Yes | Yes | Yes | Partial | API failure does not silently become live |
| Lesson Workspace Quality | Coordinator | QA status per lesson | Not durable/mock | Lesson registry + QA log | Google Sheets | Teacher, class, chapter | Artifact review | Yes | Yes | Yes | Yes | Missing | QA state drives dashboard |
| Curriculum Completion | Principal/coordinator | Syllabus coverage | Mock/sheet | Curriculum registry + planner progress | `syllabus_coverage` | Year, stage, subject | Chapter detail | Yes | Yes | Yes | Yes | Partial | Live tab drives completion |
| Timetable Coverage | Coordinator | Timetable gaps | Hardcoded/demo | Timetable registry | Google Sheet | Class, teacher, period | Gap detail | Yes | Yes | Yes | Yes | Missing | Timetable rows exist in registry |
| Assessment Readiness | Exams/coordinator | Assessments ready | Mock/sheet | Assessment bank/artifact registry | Sheets + Drive | Subject, term | Assessment artifact | Yes | Yes | Yes | Yes | Partial | Readiness linked to reviewed artifacts |
| Parent Communication | Parent/admin | Tickets/announcements | Hardcoded component state | Parent communication registry/Classroom announcements | Sheet/Classroom API | Student/class | Message detail | Yes | Yes | Yes | Yes | Mock Only | Demo tickets clearly labeled |
| Evidence Gaps | Compliance | Missing docs | SQAA mock | Evidence map + Drive permissions | Sheets + Drive API | Framework domain | File/link detail | Yes | Yes | Yes | Yes | Mock Only | Broken/missing links visible |
| Admin/IT Connection Health | Admin | API health | Hardcoded + test endpoint | OAuth status + endpoint diagnostics | Drive/Classroom APIs | Service | Error detail | Yes | Yes | Yes | Yes | Partial | Real connection status replaces static "connected" cards |
| ResumeIQ/Recruitment later | HR | Candidate pipeline | None | Future recruitment source | Future API/Sheet | Role, job | Candidate detail | Yes | Yes | Yes | Yes | Deferred | Not part of academic MVP |

## 7. Lesson Workspace Feature Tracker

| Feature ID | Capability | Current Status | Existing Code Evidence | Required Data Source | Required Artifact Type | Google Drive Output | Google Classroom Output | SQAA/QA Linkage | MVP Priority | Acceptance Criteria | Notes |
| ---------- | ---------- | -------------- | ---------------------- | -------------------- | ---------------------- | ------------------- | ----------------------- | --------------- | ------------ | ------------------- | ----- |
| LESSON-001 | Workspace creation | Partial | `LessonPlanner.tsx`, `TextbookIngestor.tsx`, server lesson/textbook endpoints | Lesson Workspace registry | Workspace record | Root/class/subject/chapter folder | None initially | QA status field | P0 | Create/list/filter workspace from registry | Current state is not durable enough |
| LESSON-004 | Existing resource reuse before generation | Partial | Workspace files passed into planner/search | Drive file inventory | Source resource | Existing Drive file links | Optional material link | Review source relevance | P0 | UI shows reusable existing files before generating | Needs stronger matching |
| TOC-001 | Table of contents upload and parsing | Partial | TOC/image parse endpoint and TextbookIngestor UI | TOC registry | TOC rows | Store source and parsed rows | None | Human review | P1 | Parsed chapters require review before workspace creation | Current fallback can mask extraction gaps |
| LESSON-005 | Book PDF/ZIP/link ingestion | Partial | Textbook source model and NCERT discovery | Source registry | Book/source | Source file/link | None | Copyright/source status | P1 | Source has permission/copyright status | Needs governance |
| LESSON-006 | Outline | Partial | Lesson generation prompts/UI | Lesson registry | Outline | Markdown/doc file | Optional material | QA checklist | P0 | Outline saved as artifact with status | Likely generated but not registry-backed |
| LESSON-007 | Lesson Plan | Partial | Lesson planner/textbook generation | Lesson registry | Lesson plan | Drive doc/markdown | Optional assignment/material | SQAA indicators | P0 | Reviewed lesson plan saved and linked | Existing mock lesson files |
| LESSON-008 | Related videos | Missing | No verified live implementation | Resource registry | Video links | Link records | Optional material | Source review | P2 | Teacher can attach reviewed links | Not core P0 |
| LESSON-009 | Slides/PPT | Partial | Mock artifacts/templates mention slides/PPT | Artifact registry | Slides/PPT | Drive slide/PPT file | Optional material | QA review | P1 | Generated/uploaded slides have artifact metadata | Need implementation proof before complete |
| LESSON-010 | Quiz | Partial | Lesson planner/server generation and sample script content | Artifact registry | Quiz | Drive doc/form | Classroom assignment/material | QA review | P0 | Quiz saved with answer key/review status | Mock/script supports samples |
| LESSON-011 | Homework | Partial | Lesson planner/server generation and sample script content | Artifact registry | Homework | Drive doc | Classroom assignment | QA review | P0 | Homework artifact can be approved and published | Write scopes missing for live publish |
| LESSON-012 | Worksheet | Partial | Lesson planner generation references | Artifact registry | Worksheet | Drive doc/pdf | Optional assignment | QA review | P0 | Worksheet linked to workspace | Needs durable registry |
| LESSON-013 | Activity Sheet | Partial | SDOS artifacts and generation references | Artifact registry | Activity sheet | Drive doc | Optional assignment | QA review | P1 | Activity sheet stored and reviewed | Not fully verified live |
| LESSON-014 | Question Bank | Mock Only | SDOS sample script/docs/mock artifacts | Artifact registry | Question bank | Drive doc/sheet | None | Secure QA | P1 | Question bank is restricted and reviewed | High privacy risk |
| LESSON-015 | Assessment Bank | Mock Only | SDOS sample script/docs/mock artifacts | Artifact registry | Assessment bank | Drive doc/sheet | None | Secure QA | P1 | Assessment bank has restricted permissions | Do not expose to students |
| LESSON-016 | Rubric | Partial | Script sample, planner/generation references | Artifact registry | Rubric | Drive doc/sheet | Optional material | QA review | P0 | Rubric totals validate and is linked | Some rubric logic noted in docs |
| LESSON-017 | Parent Discussion | Mock Only | Parent dashboard hardcoded tickets/announcements | Communication registry | Parent note | Drive/log optional | Classroom/parent channel later | Review | P2 | Parent communication is tracked | Not P0 |
| LESSON-018 | Raw Markdown / editable source | Partial | Sample markdown/script and lesson files | Artifact registry | Raw markdown | Drive markdown/doc | None | QA review | P0 | Editable source stored with generated output | Needed for AI review |
| LESSON-019 | SQAA Links | Mock Only | Mock SQAA mappings | SQAA evidence map | SQAA link | Evidence link | None | SQAA map | P0 | Link is verified against framework/version | Mock only now |
| LESSON-020 | Evidence Map | Mock Only | `sqaa-evidence.mock.json` | Evidence map registry | Evidence row | Drive file link | None | Required | P0 | Each artifact can map to evidence item | MVP blocker |
| LESSON-021 | Teacher reflection | Missing | No durable reflection registry verified | Lesson registry | Reflection | Drive/sheet row | None | QA review | P1 | Teacher can add reflection after lesson | Useful for SQAA |
| LESSON-022 | Coordinator review | Missing | No durable review workflow verified | QA review log | Review record | Sheet row | None | Required | P0 | Coordinator can approve/request changes | Required for quality |
| LESSON-023 | Classroom observation record | Mock Only | Forms/governance mocks | Observation registry | Observation | Sheet/doc | None | Evidence | P1 | Observation links to teacher/workspace | Mock currently |
| LESSON-024 | Remediation and enrichment plan | Partial | Dashboard/remedial mocks and artifact docs | Remedial registry | Remediation/enrichment plan | Drive doc | Classroom optional | QA/SQAA | P1 | Plan links to evidence and class | Needs live student/privacy controls |
| NCERT-008 | Create Lesson Workspace from selected NCERT chapter | Partial | LessonPlanner can propose a draft workspace from selected NCERT registry chapter rows and stores NCERT IDs/status fields | NCERT book registry + chapter registry + `School_Selected_Books` | Lesson workspace seed metadata | Optional school Drive source link | Blocked until review | QA/SQAA mapping later | P0 | Workspace is created from selected NCERT book/chapter metadata, not hardcoded fallback data | TOC Pending is blocked; Needs Human Review stays draft-only |

## NCERT Resource Strategy

### Mode 1: Official Link Only - MVP Default

Schooly should store NCERT metadata and official source links, not bundled PDFs. NCERT/ePathshala remains the official source of truth. Schooly stores book metadata, chapter metadata, official source URLs, source checked date, and version notes.

Schools can click official complete-book links to download the books they want. The app does not depend on all NCERT books being present locally, and it must not bundle NCERT PDFs into the app repository or React bundle. This keeps the app small, avoids stale content, reduces redistribution/licensing risk, and preserves Google AI Studio/simple sharing compatibility.

NCERT can have multiple books for the same class, subject, and medium. Schooly must treat `ncert_book_id` as the primary identity, use `book_title` as the display title, and preserve different `ncert_book_id` rows as separate books. Rows must not be collapsed only because class, subject, and medium match. `TOC Pending`, `TOC Pending - add/parse reviewed chapter rows`, and blank chapter-title rows are placeholders and must not count as real chapters.

Status: MVP default, P0.

### Mode 2: School Google Drive Import - Testing and School-Controlled Use

For testing, only a few selected NCERT books may be manually downloaded from official sources and stored in a controlled Google Drive test folder. For real schools, the school admin chooses which books the school uses.

The school may import selected complete books into its own Google Drive. Schooly stores the school Drive file IDs and URLs in `School_Selected_Books`, alongside the import source, import date, source URL, and review status. Imported copies remain under the school's ownership and control. This is not the same as bundling PDFs in the app.

For the private Drive-map MVP, the admin manually creates `NCERT_Drive_Source_Folders` rows in `Schooly_NCERT_Private_Drive_Map`. The app reads those rows to show whether a selected NCERT book has a configured private Drive folder. A later read-only scan may generate draft `NCERT_Chapter_File_Map` rows, but the current workflow is: generate/review draft CSV, import or paste it into the private Sheet, then let Schooly read reviewed map rows. Direct Google Sheets writeback and Drive file mutation are not part of this task.

Status: P1 for automated workflow. Manual testing may begin earlier with selected books.

### Mode 3: Schooly Managed Server Cache - Future Server Architecture Only

This is Deferred and not part of MVP. It should be considered only if Schooly later has a server-based architecture. It requires legal/terms/licensing review, attribution, storage cost model, version tracking, stale-content detection, takedown/update workflow, access controls, and source audit logs.

The server cache must never become the source of truth. Official NCERT/ePathshala URLs remain the source of truth. Schools should still be able to use official links or their own Google Drive copies instead of a Schooly cache.

Status: Deferred, not included in MVP.

## Seeded Live Registry Path

The seeded Google Sheets pack is now the preferred test-live path when URLs are configured in browser storage or the visible setup fields. `Schooly_Master_Data_Registry_SEEDED` supplies school profile, academic years, classes/sections, subjects, staff, teacher allocations, timetable, optional students, and data-source status rows. LessonPlanner uses the live classes, subjects, and teacher allocations where safe; otherwise it shows labelled demo fallback lists.

The remaining seeded Sheets are configured as explicit data-source slots: `Schooly_NCERT_Private_Drive_Map_SEEDED`, `Schooly_Lesson_Workspace_Registry_SEEDED`, `Schooly_QA_SQAA_Registry_SEEDED`, `Schooly_Dashboard_Source_SEEDED`, `Schooly_NCERT_Registry_English_MVP`, and `Schooly_NCERT_Verified_Seed_TOCs`. `Schooly_Dashboard_Data_Source_SEEDED` is legacy and can be archived after verifying no app/localStorage configuration references it. NCERT registry behavior remains handled by the NCERT reader, including seed TOC overlay precedence and private Drive map rows. Lesson Workspace and QA/SQAA seeded readers are still future work; current lesson/QA records continue to use localStorage, server memory, and visibly labelled demo/mock data where live registries are not wired.

Registry validation is intentionally report-first. It separates global data-quality issues from blockers for the selected action. `Refresh & Validate Registry` reloads configured Sheets and reruns validation without extraction or writeback. Manual-fix reports include sheet, tab, row/cell when available, field, current value, expected value/recommendation, issue code, severity, whether the issue blocks the selected action, grouped issue counts, sample/affected rows, and conflicting sources for cross-registry mismatches. TOC Pending placeholder issues are grouped to avoid panel spam. Remaining limitations: Google Sheets writeback is intentionally absent, row/cell metadata depends on rows coming through the current gviz reader, automated tests are not configured in `package.json`, and LessonPlanner should reuse the same action-scoped gate in a later pass.

## 8. SQAA / Compliance Feature Tracker

| Feature ID | SQAA / Compliance Capability | Current Status | Source Framework | Evidence Required | Registry Needed | Dashboard Impact | AI Review Needed | MVP Priority | Acceptance Criteria | Notes |
| ---------- | ---------------------------- | -------------- | ---------------- | ----------------- | --------------- | ---------------- | ---------------- | ------------ | ------------------- | ----- |
| SQAA-003 | SQAA framework import | Missing | CBSE SQAA | Domain/indicator definitions | SQAA framework Sheet | Compliance dashboard | Human validation | P0 | Import creates versioned framework rows | Mock evidence is not framework import |
| SQAA-004 | SQAA versioning | Missing | CBSE SQAA | Version/date/source | Framework registry | Historical evidence validity | Yes | P0 | Evidence points to framework version | Prevent stale compliance claims |
| SQAA-001 | SQAA evidence map | Mock Only | CBSE SQAA | Drive file links, artifact IDs, reviewer | Evidence map Sheet | Evidence gap cards | Yes | P0 | Verified evidence counted separately from proposed evidence | Existing mock only |
| SQAA-005 | Evidence gap detection | Mock Only | SQAA/NEP/CBSE | Required indicator coverage | Evidence map + framework | Gap dashboard | Yes | P0 | Missing indicators are listed | Do not infer from mock |
| SQAA-006 | Evidence file linking | Partial | SQAA/CBSE | Drive file IDs and permissions | Evidence map + Drive | Compliance drilldown | Yes | P0 | Link validity and permission state checked | Drive metadata read exists |
| SQAA-007 | Compliance dashboard | Mock Only | SQAA/CBSE | Reviewed evidence rows | Framework/evidence registries | Principal/compliance dashboard | Yes | P0 | No mock evidence counts as complete | Existing UI can show mock scores |
| SQAA-008 | Compliance report generation | Missing | SQAA/CBSE | Reviewed evidence and gaps | Report registry | Exports/reporting | Yes | P1 | Generated report requires approval | Not verified |
| SQAA-002 | NEP/NCF/CBSE mapping | Mock Only | NEP/NCF/CBSE | Framework crosswalk | Framework registry | Compliance/context cards | Yes | P1 | Crosswalk has source/version/reviewer | NEP mock exists |
| SQAA-009 | State/IB extensibility | Missing | State boards/IB | Framework definitions | Framework registry | Multi-framework dashboard | Yes | P2 | Additional framework can be loaded without code changes | Future |
| SQAA-010 | Human review of AI-mapped compliance | Missing | All frameworks | Review decision and notes | AI review log | Evidence confidence | Required | P0 | AI suggestions stay "proposed" until human reviewed | MVP-critical |

## 9. AI Agent Feature Tracker

| Agent ID | Agent Name | Current Status | Trigger | Inputs | Outputs | Human Approval Needed | Files/Sheets/APIs Used | Dashboard Impact | MVP Priority | Acceptance Criteria | Notes |
| -------- | ---------- | -------------- | ------- | ------ | ------- | --------------------- | ---------------------- | ---------------- | ------------ | ------------------- | ----- |
| AGENT-001 | School Setup Agent | Missing | Admin setup | School profile | Setup registry rows | Yes | Google Sheet | Enables all dashboards | P0 | Produces editable validated registry, not hidden state | No verified agent |
| AGENT-002 | Google Drive Structure Agent | Partial | Connect/generate SDOS | Manifest/config | Folder plan/manifest | Yes | Drive API/script/manifest | Drive health | P1 | Can preview before creating/changing folders | Current script is local filesystem |
| AGENT-003 | Master Data Mapping Agent | Missing | Registry import | Classes/staff/subjects | Normalized mappings | Yes | Google Sheet | Dashboard filters | P0 | Mapping changes are reviewed | Needed early |
| AGENT-004 | Curriculum Mapping Agent | Mock Only | Curriculum import | Curriculum/chapters | Curriculum map | Yes | Mock/Sheet future | Lesson/compliance | P1 | Outputs reviewed chapter map | Current mocks/prompt only |
| AGENT-005 | Book/TOC Ingestion Agent | Partial | Upload/link TOC | Image/PDF/link/class/subject | Chapter list | Yes | Gemini, server endpoints | Lesson workspace | P1 | TOC output has review status and source | Existing extraction path |
| AGENT-006 | Lesson Workspace Generator Agent | Partial | Teacher creates workspace | Class/subject/chapter | Workspace + artifacts | Yes | Gemini/server/mock | Lesson quality | P0 | Workspace saved to registry | Needs durable write |
| AGENT-007 | Existing Resource Reuse Agent | Partial | Before generation/search | Drive files, lesson context | Suggested resources | Yes | Drive metadata/mock files | Reduces duplicate work | P0 | Suggestions cite file IDs/source | Needs ranking/review |
| AGENT-008 | Artifact Generator Agent | Partial | Generate artifact | Lesson context, type, rubric | Draft artifact | Yes | Gemini | Lesson/QA | P0 | Draft cannot be published before review | Current generation exists, review missing |
| AGENT-009 | QA Reviewer Agent | Missing | Draft artifact ready | Artifact + checklist | QA findings | Required | QA checklist Sheet + Gemini | Quality dashboard | P0 | Findings stored with reviewer decision | MVP blocker |
| AGENT-010 | SQAA Evidence Mapper Agent | Mock Only | Artifact reviewed | Artifact + framework | Proposed evidence links | Required | SQAA mock/Sheet future | Compliance | P0 | AI mapping is "proposed" until human approval | Existing prompt only |
| AGENT-011 | Google Classroom Publisher Agent | Partial | Approved publish | Artifact + course mapping | Classroom post/assignment | Yes | Classroom API | Classroom sync | P1 | Uses write scopes or queues manual publish | Current scopes read-only |
| AGENT-012 | Dashboard/KPI Agent | Partial | Dashboard load/sync | Sheet/Classroom/Drive rows | KPI model | Review for formulas | Google Sheet/Drive/Classroom | All dashboards | P0 | Calculations are traceable to rows | Resolver exists |
| AGENT-013 | Live Data Sync Agent | Partial | App load/manual refresh | OAuth token/root/sheet URL | Live rows/files/courses | No for read, yes for mapping | Drive/Classroom/Sheets | Source health | P0 | Sync status shown and failures explicit | Current fallback needs hardening |
| AGENT-014 | Compliance Report Agent | Missing | Compliance review | Evidence map/framework | Report draft | Required | Sheets/Drive/Gemini | Compliance exports | P1 | Report includes only reviewed evidence | Not verified |
| AGENT-015 | Chat Assistant Agent | Partial | Search/Q&A/assistant UI | Workspace files/prompts | Answer/action suggestion | Depends on action | Gemini + files/mock | User productivity | P1 | Answers cite scoped sources and label mock | Governance needed |
| AGENT-016 | ResumeIQ Integration Agent | Deferred | Future HR module | Resumes/candidates | Recruitment insights | Yes | Future source | HR dashboard | Deferred | No academic MVP impact | No repo evidence |

## 10. Technical Debt and Risks

| Risk ID | Risk / Technical Debt | Area | Impact | Likelihood | Mitigation | MVP Blocking | Owner / Role | Status | Notes |
| ------- | --------------------- | ---- | ------ | ---------- | ---------- | ------------ | ------------ | ------ | ----- |
| RISK-001 | Mock data tightly coupled to dashboards | Dashboard | Users may trust fake KPIs | High | Add explicit source mode and block silent fallback | Yes | Tech lead | Open | Resolver falls back to mocks |
| RISK-002 | Source code/doc mismatch | Docs/Product | Tracker/plans may overstate readiness | High | Feature status must cite code evidence | Yes | Product/engineering | Open | Many docs describe future state |
| RISK-003 | Missing Google Drive IDs | Drive | Cannot verify evidence or paths | High | Store folder/file IDs in registries | Yes | Admin/engineering | Open | String paths are insufficient |
| RISK-004 | Inconsistent folder naming | SDOS/Drive | Bad matching and broken dashboards | Medium | Registry-driven folder schema | No | Admin/coordinator | Open | SDOS script helps but live Drive may differ |
| RISK-005 | Inconsistent metadata | Data | KPI formulas unreliable | High | Define Sheet schemas and validation | Yes | Data owner | Open | Contract doc is first step |
| RISK-006 | Incomplete OAuth scopes | Classroom/Drive | Publishing cannot work | High | Separate read-only MVP from write/publish plan | Yes for publish | Engineering/admin | Open | Current scopes are read-only |
| RISK-007 | Google Classroom API limitations | Classroom | Some operations unavailable/slow | Medium | Queue/manual approval fallback | No | Engineering | Open | Keep P1 |
| RISK-008 | Permission mismatch | Security | Students/staff may see wrong data | High | Server-side filtering and Drive permission checks | Yes | Admin/security | Open | Current role model is client-side |
| RISK-009 | Live dashboard latency | Dashboard | Slow or stale KPIs | Medium | Last sync, caching, partial states | No | Engineering | Open | No backend constraint complicates caching |
| RISK-010 | No-backend constraint | Architecture | Durability limited to Sheets/Drive/browser state | High | Use Google Sheets as first metadata layer | Yes | Product/engineering | Open | Avoid hidden database requirement |
| RISK-011 | Google AI Studio publishing compatibility | Deployment | Server features may not share as simple static app | Medium | Document simple sharing and server tradeoffs | No | Product/engineering | Open | Express server currently required |
| RISK-012 | Student/staff data privacy | Security | Sensitive academic and personnel data exposure | High | Minimal scopes, permission checks, demo/live separation | Yes | Admin/security | Open | Mock data contains realistic personas |
| RISK-013 | Copyright/source handling for books/PDFs | Curriculum | Improper ingestion/use of copyrighted material | Medium | Source/copyright status registry | Yes for book ingestion | Academic lead | Open | TOC/book workflows need controls |
| RISK-014 | AI review hallucination | AI/QA | Incorrect lesson/compliance outputs | High | Human review log + checklist | Yes | Coordinator/compliance | Open | AI outputs need approval |
| RISK-015 | Compliance evidence falsely marked complete | Compliance | Audit failure | High | Separate proposed/verified/reviewed evidence states | Yes | Compliance owner | Open | Mock SQAA must not count |
| RISK-016 | Dirty working tree at discovery start | Repo hygiene | Tracker may reflect uncommitted code | Medium | Preserve changes and report status | No | Engineering | Open | Several app files modified before tracker |
| RISK-017 | NCERT copyright/redistribution risk | NCERT/Curriculum | Bundling or redistributing PDFs could violate terms or create legal exposure | High | Official-link-first strategy; school-controlled Drive copies only | Yes | Product/legal/admin | Open | Do not bundle NCERT books in the app |
| RISK-018 | Stale NCERT content risk | NCERT/Curriculum | Lessons may use outdated/rationalised content | High | Source/version log with checked dates and detected changes | Yes | Academic coordinator | Open | Track rationalised-content status |
| RISK-019 | App bloat if PDFs are bundled | NCERT/App delivery | Large files break simple sharing and slow deployments | High | Keep PDFs outside repo/app bundle | Yes | Engineering/product | Open | No PDFs downloaded or committed |
| RISK-020 | Official source link rot | NCERT/Data | Official URLs may change or break | Medium | Scheduled/manual source check log | No | Academic coordinator | Open | Store portal and checked date |
| RISK-021 | Schools use different books/mediums/editions | NCERT/School setup | Wrong book may seed wrong lessons | High | `School_Selected_Books` mapping per school/year/class/section/subject | Yes | School admin | Open | Avoid one-size-fits-all defaults |
| RISK-022 | AI hallucination while parsing TOCs | NCERT/AI | Incorrect chapter rows could seed bad Lesson Workspaces | High | Human review status before workspace creation | Yes | Teacher/coordinator | Open | Current TOC generation is Partial only |
| RISK-023 | Server cache licensing and takedown obligations | NCERT/Architecture | Future cache creates legal, storage, and operations burden | High | Keep server cache Deferred until approved | No for MVP | Product/legal/platform | Open | Cache must never be source of truth |
| RISK-024 | Test Google Drive copies mistaken for canonical sources | NCERT/Drive | Test files may be treated as official content | Medium | Label test imports and keep official URL/source metadata | Yes | Admin/coordinator | Open | Imported copies are school-controlled references |

## 11. MVP Decision Log

| Decision ID | Date | Decision | Reason | Impacted Features | MVP Impact | Open / Closed | Notes |
| ----------- | ---- | -------- | ------ | ----------------- | ---------- | ------------- | ----- |
| DEC-001 | 2026-06-12 | Mock data is reference/demo only, not production data. | Prevent false dashboard/compliance confidence | DASH-*, SQAA-*, MOCK-001 | P0 | Open | Must be visible in UI |
| DEC-002 | 2026-06-12 | Google Sheets registry should be the first live metadata layer unless a backend is proven necessary. | Preserves simple sharing/no-backend constraint | APP-003, SHEETS-001, LESSON-001, SQAA-003 | P0 | Open | Existing dashboard resolver supports Sheets |
| DEC-003 | 2026-06-12 | Lesson Workspace is the central planning and execution unit. | Connects curriculum, artifacts, QA, Drive, Classroom, SQAA | LESSON-* | P0 | Open | Existing planner needs registry |
| DEC-004 | 2026-06-12 | QA/SQAA evidence tracking is MVP-critical. | Avoids unreviewed AI/compliance claims | QA-*, SQAA-* | P0 | Open | Missing today |
| DEC-005 | 2026-06-12 | ResumeIQ is deferred from the academic MVP unless existing integration is already present. | No code evidence found and outside academic MVP | RESUMEIQ-001 | Deferred | Closed for MVP | Revisit later |
| DEC-006 | 2026-06-12 | Classroom publishing remains P1 until write scopes and approval flow are designed. | Current OAuth scopes are read-only and lesson registry is incomplete | CLASSROOM-002, LESSON-* | P1 | Open | Read sync can remain earlier |
| DEC-007 | 2026-06-12 | NCERT PDFs will not be bundled in the app. | Avoid app bloat, stale content, and redistribution risk | NCERT-001, NCERT-005, NCERT-010 | P0 | Open | Applies to repo and app bundle |
| DEC-008 | 2026-06-12 | Official NCERT/ePathshala links are the MVP default. | Official portals remain source of truth | NCERT-001, NCERT-002, NCERT-005 | P0 | Open | Store metadata and links first |
| DEC-009 | 2026-06-12 | Schools should be given official complete-book links to download books they want. | School admins choose their own texts and editions | NCERT-004, NCERT-005 | P0 | Open | App should not require all books locally |
| DEC-010 | 2026-06-12 | For testing, only selected NCERT books may be stored in a controlled Google Drive test folder. | Keep test scope small and auditable | NCERT-006 | P1 | Open | Manual testing can start before automation |
| DEC-011 | 2026-06-12 | Schools may import selected books into their own Google Drive and Schooly should store Drive file IDs. | Keeps imported copies under school ownership/control | NCERT-004, NCERT-006 | P1 | Open | Store source URL, import date, and review status |
| DEC-012 | 2026-06-12 | A Schooly-managed NCERT server cache is future-only and Deferred. | Not compatible with current MVP/simple sharing constraints | NCERT-010 | Deferred | Open | Do not treat cache as MVP |
| DEC-013 | 2026-06-12 | Server cache must not be implemented without legal/terms review, source attribution, storage plan, version tracking, takedown/update workflow, and server architecture approval. | Cache creates legal and operational obligations | NCERT-010, RISK-023 | Deferred | Open | Cache must never be source of truth |
| DEC-014 | 2026-06-12 | Lesson Workspaces should use selected book/chapter registry records, not hardcoded NCERT fallback lists. | Prevents wrong chapters and supports school-specific choices | NCERT-003, NCERT-004, NCERT-008, LESSON-001 | P0 | Open | Current fallback lists should become demo/reference only |

## 12. Next Implementation Prompts

### Prompt 1: Verify and isolate mock dashboard dependencies

- Goal: Ensure dashboards never silently present mock data as production.
- Scope: Audit dashboard data imports, server mock endpoints, source labels, and fallback branches.
- Files likely affected: `src/lib/dashboardDataResolver.ts`, `src/components/DashboardOverview.tsx`, `src/components/RoleDashboards.tsx`, `server.ts`, `src/data/mock/*.json`.
- Features from tracker addressed: MOCK-001, DASH-STATE-001, DASH-PRINCIPAL-001, DASH-COORD-001, DASH-TEACHER-001.
- Acceptance criteria: Every dashboard card/table shows Live, Demo, Empty, Partial, or Permission Error state; production mode cannot silently fall back to mock JSON.
- Manual tests: Load with valid Sheet URL, invalid Sheet URL, empty Sheet tabs, blocked Sheet, and no OAuth token.

### Prompt 2: Add live dashboard source adapter plan

- Goal: Produce a narrow implementation plan for the live dashboard source adapter under the no-backend constraint.
- Scope: Define Google Sheet tabs, row schemas, validation rules, source states, and fallback boundaries.
- Files likely affected: `docs/dashboard-data-contract.md`, `docs/SCHOOLY_FEATURE_TRACKER.md`, optionally new `docs/live-dashboard-source-adapter-plan.md`.
- Features from tracker addressed: SHEETS-001, DASH-STATE-001, APP-003, ROLLOVER-002, APP-004.
- Acceptance criteria: Plan maps every P0 dashboard KPI to a Sheet/API source, filters, empty/error states, and acceptance tests.
- Manual tests: Review plan against existing resolver and identify missing tabs/columns.

### Prompt 3: Implement Google Sheet dashboard source adapter

- Goal: Convert the current partial resolver into a robust MVP live dashboard adapter.
- Scope: Read configured Sheet tabs, validate schemas, expose source state, and stop unsafe mock fallback in production mode.
- Files likely affected: `src/lib/dashboardDataResolver.ts`, `src/lib/dashboardConfig.ts`, `src/components/DashboardOverview.tsx`, `docs/dashboard-data-contract.md`.
- Features from tracker addressed: SHEETS-001, DASH-PRINCIPAL-001, DASH-COORD-001, DASH-TEACHER-001, DASH-STATE-001.
- Acceptance criteria: Principal/coordinator/teacher dashboards render live rows, show last sync, and show empty/partial/permission states.
- Manual tests: Use a test Sheet with complete, partial, empty, and permission-blocked tabs.

### Prompt 4: Implement Lesson Workspace registry MVP

- Goal: Add the central live registry for lesson workspaces and artifacts using Google Sheets/simple sharing constraints.
- Scope: Define registry schema, read/write adapter, workspace list/create flow, artifact row model, and visible demo/live labels.
- Files likely affected: `src/components/LessonPlanner.tsx`, `src/components/TextbookIngestor.tsx`, `src/lib/*`, `server.ts`, `docs/SCHOOLY_FEATURE_TRACKER.md`.
- Features from tracker addressed: LESSON-001, LESSON-003, LESSON-004, LESSON-018, QA-001.
- Acceptance criteria: A teacher can create a workspace record and attach or generate an artifact with status and source.
- Manual tests: Create workspace, reload app, filter by class/subject/chapter, verify registry row and UI source label.

### Prompt 5: Implement QA/SQAA review MVP

- Goal: Add human review and SQAA evidence mapping for AI-generated lesson artifacts.
- Scope: Create QA checklist config, AI review log, SQAA framework/evidence map rows, and review UI states.
- Files likely affected: `src/components/LessonPlanner.tsx`, `src/components/SystemGovernance.tsx`, `src/lib/*`, `docs/SCHOOLY_FEATURE_TRACKER.md`.
- Features from tracker addressed: QA-001, QA-002, AI-002, SQAA-001, SQAA-003, SQAA-010.
- Acceptance criteria: AI-generated artifacts remain unapproved until reviewed; SQAA links are proposed, verified, or rejected; dashboards count only reviewed evidence.
- Manual tests: Generate draft artifact, mark review changes requested, approve, map evidence, verify compliance dashboard state.

### Phase NCERT-A: Create external NCERT registry templates

- Goal: Create CSV/JSON templates outside the app repository under `C:\Projects\schooly-reference-data\ncert\`.
- Scope: NCERT book registry, chapter registry, selected books mapping, source/version log, import log, future cache registry, schema descriptor.
- Acceptance criteria: Templates exist outside `C:\Projects\schooly` and no PDFs are downloaded or committed.

### Phase NCERT-B: Populate small test NCERT registry

- Goal: Add a few selected NCERT books only, with official URLs and manually checked metadata.
- Scope: External registry rows only.
- Acceptance criteria: Each row includes source portal, official URL, checked date, version notes, and review status.

### Phase NCERT-C: Test school Google Drive copies

- Goal: Manually store a few selected NCERT books in a controlled Google Drive folder for testing.
- Scope: School-controlled test folder and external import/selection logs.
- Acceptance criteria: Drive file IDs are recorded and clearly labelled as school/test copies, not canonical sources.

### Phase NCERT-D: Add Schooly registry reader

- Goal: Let Schooly read selected NCERT book/chapter metadata from an external CSV or Google Sheet registry.
- Scope: Read-only adapter and visible source labels.
- Acceptance criteria: Schooly displays selected books and chapters without hardcoded NCERT fallback lists.

### Phase NCERT-E: Create Lesson Workspace from NCERT chapter

- Goal: Use selected book/chapter records as the source for Lesson Workspace creation.
- Scope: Lesson Workspace creation flow and registry linkage.
- Acceptance criteria: Workspace source references `ncert_book_id` and `ncert_chapter_id`.

### Phase NCERT-F: Optional Drive import workflow

- Goal: Later allow school admin to import selected official books to school Drive and track Drive IDs.
- Scope: Admin workflow, import log, review status, error handling.
- Acceptance criteria: Imported files remain school-controlled and are never bundled in the app.

### Phase NCERT-G: Source/version refresh checks

- Goal: Track official source checked date, rationalised-content status, and detected changes.
- Scope: Source/version log and action-required review workflow.
- Acceptance criteria: Stale or changed sources are flagged before lesson generation.

### Phase NCERT-H: Future server cache architecture

- Goal: Document only; do not implement until legal/terms and server architecture are approved.
- Scope: Legal review, attribution, storage cost model, version tracking, stale-content detection, takedown/update workflow, access controls, source audit logs.
- Acceptance criteria: Server cache remains Deferred and official NCERT/ePathshala links remain source of truth.
