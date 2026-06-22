# Wave 9 Manual Browser Verification

Browser automation was attempted from this session, but the local Playwright browser binary is not installed on this machine. Because of that, the responsive and reliability checks below are the required manual fallback matrix rather than live pass/fail evidence.

## Responsive Matrix

Prerequisite for every row: the app is available at `http://127.0.0.1:3001`.
Action sequence for every row: open the route, inspect the page header, primary actions, stacking, overflow, and reachability at the listed viewport.
Expected result for every row: the page fits the viewport, key actions stay reachable, and no page-level horizontal overflow appears.
Actual result for every row: not run because browser control was unavailable.
Pass/Fail for every row: Fail.

| Route | Viewport | Prerequisite | Action sequence | Expected result | Actual result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 1280x900 | App running | Open landing page and inspect shell, cards, and navigation | Shell and primary actions remain stable | Not run | Fail | Representative wide desktop check |
| `/` | 1024x768 | App running | Open landing page and inspect shell, cards, and navigation | Shell and primary actions remain stable | Not run | Fail | Representative medium-width check |
| `/` | 768x1024 | App running | Open landing page and inspect shell, cards, and navigation | Shell and primary actions remain stable | Not run | Fail | Tablet portrait check |
| `/` | 390x844 | App running | Open landing page and inspect shell, cards, and navigation | Shell stacks cleanly without clipping | Not run | Fail | Mobile portrait check |
| `/` | 844x390 | App running | Open landing page and inspect shell, cards, and navigation | Shell remains usable in landscape | Not run | Fail | Mobile landscape check |
| `/settings` | 1280x900 | App running | Open Settings and inspect sections, labels, and controls | Forms remain readable and reachable | Not run | Fail | Settings shell and save controls |
| `/settings` | 1024x768 | App running | Open Settings and inspect sections, labels, and controls | Forms remain readable and reachable | Not run | Fail | Intermediate width check |
| `/settings` | 768x1024 | App running | Open Settings and inspect sections, labels, and controls | Forms stack in one column where needed | Not run | Fail | Tablet portrait check |
| `/settings` | 390x844 | App running | Open Settings and inspect sections, labels, and controls | No collisions or clipped helper text | Not run | Fail | Narrow mobile check |
| `/settings` | 844x390 | App running | Open Settings and inspect sections, labels, and controls | Sections remain reachable in landscape | Not run | Fail | Landscape mobile check |
| `/registries` | 1280x900 | App running | Open Registry Explorer and inspect list, detail, and controls | Table and detail remain readable | Not run | Fail | Generic registry surface |
| `/registries` | 1024x768 | App running | Open Registry Explorer and inspect list, detail, and controls | Table and detail remain readable | Not run | Fail | Intermediate width check |
| `/registries` | 768x1024 | App running | Open Registry Explorer and inspect list, detail, and controls | Table and cards stack logically | Not run | Fail | Tablet portrait check |
| `/registries` | 390x844 | App running | Open Registry Explorer and inspect list, detail, and controls | No page-level horizontal overflow | Not run | Fail | Narrow mobile check |
| `/registries` | 844x390 | App running | Open Registry Explorer and inspect list, detail, and controls | Primary action remains reachable | Not run | Fail | Landscape mobile check |
| `/registers` | 1280x900 | App running | Open Registers and inspect list, detail, and controls | Table and actions remain readable | Not run | Fail | Register surface |
| `/registers` | 1024x768 | App running | Open Registers and inspect list, detail, and controls | Table and actions remain readable | Not run | Fail | Intermediate width check |
| `/registers` | 768x1024 | App running | Open Registers and inspect list, detail, and controls | Narrow layout remains usable | Not run | Fail | Tablet portrait check |
| `/registers` | 390x844 | App running | Open Registers and inspect list, detail, and controls | No clipping or hidden controls | Not run | Fail | Narrow mobile check |
| `/registers` | 844x390 | App running | Open Registers and inspect list, detail, and controls | Controls remain reachable in landscape | Not run | Fail | Landscape mobile check |
| `/staff` | 1280x900 | App running | Open Staff and inspect KPI cards, list, and filters | Counts and actions remain readable | Not run | Fail | Staff surface |
| `/staff` | 1024x768 | App running | Open Staff and inspect KPI cards, list, and filters | Counts and actions remain readable | Not run | Fail | Intermediate width check |
| `/staff` | 768x1024 | App running | Open Staff and inspect KPI cards, list, and filters | Layout stacks without collisions | Not run | Fail | Tablet portrait check |
| `/staff` | 390x844 | App running | Open Staff and inspect KPI cards, list, and filters | Narrow layout remains usable | Not run | Fail | Narrow mobile check |
| `/staff` | 844x390 | App running | Open Staff and inspect KPI cards, list, and filters | KPI cards stay legible | Not run | Fail | Landscape mobile check |
| `/students` | 1280x900 | App running | Open Students and inspect list, cards, and filters | Content stays readable | Not run | Fail | Student surface |
| `/students` | 1024x768 | App running | Open Students and inspect list, cards, and filters | Content stays readable | Not run | Fail | Intermediate width check |
| `/students` | 768x1024 | App running | Open Students and inspect list, cards, and filters | Content stacks safely | Not run | Fail | Tablet portrait check |
| `/students` | 390x844 | App running | Open Students and inspect list, cards, and filters | No horizontal overflow | Not run | Fail | Narrow mobile check |
| `/students` | 844x390 | App running | Open Students and inspect list, cards, and filters | Primary actions remain visible | Not run | Fail | Landscape mobile check |
| `/resources` | 1280x900 | App running | Open Resources and inspect modal, cards, and controls | Modal and list stay reachable | Not run | Fail | Resource library surface |
| `/resources` | 1024x768 | App running | Open Resources and inspect modal, cards, and controls | Modal and list stay reachable | Not run | Fail | Intermediate width check |
| `/resources` | 768x1024 | App running | Open Resources and inspect modal, cards, and controls | Cards stack cleanly | Not run | Fail | Tablet portrait check |
| `/resources` | 390x844 | App running | Open Resources and inspect modal, cards, and controls | Modal and footer remain visible | Not run | Fail | Narrow mobile check |
| `/resources` | 844x390 | App running | Open Resources and inspect modal, cards, and controls | Modal remains usable in landscape | Not run | Fail | Landscape mobile check |
| `/courses` | 1280x900 | App running | Open Courses and inspect list, detail, and actions | Layout stays readable | Not run | Fail | Course surface |
| `/courses` | 1024x768 | App running | Open Courses and inspect list, detail, and actions | Layout stays readable | Not run | Fail | Intermediate width check |
| `/courses` | 768x1024 | App running | Open Courses and inspect list, detail, and actions | Stack order remains logical | Not run | Fail | Tablet portrait check |
| `/courses` | 390x844 | App running | Open Courses and inspect list, detail, and actions | Primary actions stay reachable | Not run | Fail | Narrow mobile check |
| `/courses` | 844x390 | App running | Open Courses and inspect list, detail, and actions | Landscape remains usable | Not run | Fail | Landscape mobile check |
| `/assignments` | 1280x900 | App running | Open Assignments and inspect list, detail, and actions | Layout stays readable | Not run | Fail | Assignment surface |
| `/assignments` | 1024x768 | App running | Open Assignments and inspect list, detail, and actions | Layout stays readable | Not run | Fail | Intermediate width check |
| `/assignments` | 768x1024 | App running | Open Assignments and inspect list, detail, and actions | Stack order remains logical | Not run | Fail | Tablet portrait check |
| `/assignments` | 390x844 | App running | Open Assignments and inspect list, detail, and actions | Primary actions stay reachable | Not run | Fail | Narrow mobile check |
| `/assignments` | 844x390 | App running | Open Assignments and inspect list, detail, and actions | Landscape remains usable | Not run | Fail | Landscape mobile check |
| `/classroom` | 1280x900 | App running | Open Classroom and inspect workspace and controls | Workspace stays readable | Not run | Fail | Classroom surface |
| `/classroom` | 1024x768 | App running | Open Classroom and inspect workspace and controls | Workspace stays readable | Not run | Fail | Intermediate width check |
| `/classroom` | 768x1024 | App running | Open Classroom and inspect workspace and controls | Workspace stacks safely | Not run | Fail | Tablet portrait check |
| `/classroom` | 390x844 | App running | Open Classroom and inspect workspace and controls | Actions remain reachable | Not run | Fail | Narrow mobile check |
| `/classroom` | 844x390 | App running | Open Classroom and inspect workspace and controls | Landscape remains usable | Not run | Fail | Landscape mobile check |
| `/lesson-plans` | 1280x900 | App running | Open Lesson Planner and inspect editing, approvals, and navigation | Custom workflow remains usable | Not run | Fail | Lesson Planner surface |
| `/lesson-plans` | 1024x768 | App running | Open Lesson Planner and inspect editing, approvals, and navigation | Custom workflow remains usable | Not run | Fail | Intermediate width check |
| `/lesson-plans` | 768x1024 | App running | Open Lesson Planner and inspect editing, approvals, and navigation | Sections stack safely | Not run | Fail | Tablet portrait check |
| `/lesson-plans` | 390x844 | App running | Open Lesson Planner and inspect editing, approvals, and navigation | No clipped controls or fields | Not run | Fail | Narrow mobile check |
| `/lesson-plans` | 844x390 | App running | Open Lesson Planner and inspect editing, approvals, and navigation | Landscape remains usable | Not run | Fail | Landscape mobile check |
| `/textbooks` | 1280x900 | App running | Open Textbook Ingestor and inspect setup, review, and approval controls | Custom workflow remains usable | Not run | Fail | Textbook surface |
| `/textbooks` | 1024x768 | App running | Open Textbook Ingestor and inspect setup, review, and approval controls | Custom workflow remains usable | Not run | Fail | Intermediate width check |
| `/textbooks` | 768x1024 | App running | Open Textbook Ingestor and inspect setup, review, and approval controls | Sections stack safely | Not run | Fail | Tablet portrait check |
| `/textbooks` | 390x844 | App running | Open Textbook Ingestor and inspect setup, review, and approval controls | No clipped controls or fields | Not run | Fail | Narrow mobile check |
| `/textbooks` | 844x390 | App running | Open Textbook Ingestor and inspect setup, review, and approval controls | Landscape remains usable | Not run | Fail | Landscape mobile check |
| `/search` | 1280x900 | App running | Open Search and inspect filters, results, and detail panel | Search remains readable | Not run | Fail | Universal search surface |
| `/search` | 1024x768 | App running | Open Search and inspect filters, results, and detail panel | Search remains readable | Not run | Fail | Intermediate width check |
| `/search` | 768x1024 | App running | Open Search and inspect filters, results, and detail panel | Results stack safely | Not run | Fail | Tablet portrait check |
| `/search` | 390x844 | App running | Open Search and inspect filters, results, and detail panel | No overflow or hidden actions | Not run | Fail | Narrow mobile check |
| `/search` | 844x390 | App running | Open Search and inspect filters, results, and detail panel | Landscape remains usable | Not run | Fail | Landscape mobile check |

## Reliability Matrix

Prerequisite for every row: the app is available at `http://127.0.0.1:3001`.
Action sequence for every row: exercise the named flow once, then repeat the likely failure or repeat path.
Expected result for every row: the UI keeps data, state, and feedback consistent.
Actual result for every row: not run because browser control was unavailable.
Pass/Fail for every row: Fail.

| Flow | Prerequisite | Action sequence | Expected result | Actual result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Settings save | App running | Edit a field, save, and repeat the save action | One request, one success state | Not run | Fail | Duplicate submission guard not manually exercised |
| Settings reconnect | App running | Reconnect the source, then trigger a second test | Only the active request should win | Not run | Fail | Obsolete-request handling not manually exercised |
| Resources modal | App running | Open and close the resource filter dialog | Focus returns to the trigger and draft state survives | Not run | Fail | Input preservation not manually exercised |
| Registry detail | App running | Open a record, then return with Back | List state and selection remain predictable | Not run | Fail | Back and Forward not manually exercised |
| Search filtering | App running | Search, change the query, and repeat quickly | Older results do not replace newer ones | Not run | Fail | Stale-response handling not manually exercised |
| Universal search tags | App running | Add and remove a tag, then refresh the panel | Edited tags stay in sync with source state | Not run | Fail | Post-operation consistency not manually exercised |
| Lesson Planner approval | App running | Review and approve a lesson item, then inspect state | Confirmation is explicit and state remains accurate | Not run | Fail | Partial-failure and irreversible-action checks not manually exercised |
| Textbook Ingestor approval | App running | Review and approve a textbook item, then inspect state | Confirmation is explicit and state remains accurate | Not run | Fail | Partial-failure and irreversible-action checks not manually exercised |
| Filter state | App running | Apply filters, clear them, and reopen the page | Filter context is preserved or cleared intentionally | Not run | Fail | Unsaved or transient state retention not manually exercised |
| Refresh flow | App running | Refresh a source or list twice in quick succession | Existing data remains visible until the active refresh completes | Not run | Fail | Safe refresh and stale-data checks not manually exercised |

