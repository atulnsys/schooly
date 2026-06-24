# Schooly Release Readiness

## Identification

| Field | Value |
| --- | --- |
| Product | Schooly UI |
| Branch | `teacher-ui-release-evidence` |
| Release candidate commit | `5f14734` |
| Audit date | `2026-06-24` |
| Reviewed through commit | `2cc84b8` |
| Documentation commit placeholder | pending final docs commit |

## Verification Summary

| Check | Result |
| --- | --- |
| Lint | Passed: `npm run lint` |
| TypeScript | Passed: `npx tsc --noEmit --pretty false` |
| Build | Passed: `npm run build` |
| Route smoke | Passed on `/`, `/settings`, `/registries`, `/registers`, `/staff`, `/teachers`, `/resources`, `/lesson-plans`, `/textbooks`, `/classroom`, `/students`, `/courses`, `/assignments`, and `/search` |
| Browser | Trusted Chrome verification completed on the teacher-facing flows in this release pass |
| Responsive | Verified across 3840x1400, 1920x1200, 1440x1200, 390x844, and 844x390; exact native 200% browser zoom remains open |
| Keyboard | Not fully verified in-browser in this pass |
| Screen reader | Not tested in this session |
| Realistic volume | Not fully verified in-browser in this pass |
| External provider | Code reviewed; live provider interaction was not re-run in this pass |
| Storage safety | Passed by code inspection: the auth helper no longer persists Google Workspace access tokens; live authenticated browser storage verification remains pending |

## Teacher-Facing UI Simplification and Browser Verification

| Scope | Evidence |
| --- | --- |
| Application commits | `aa00162` simplified the teacher-facing pages, and `5f14734` fixed the teacher UI verification defects. |
| Evidence commit | `2cc84b8` records the trusted browser verification pass. |
| Browser and OS | Chrome on Windows. |
| Roles verified | Teacher preview, plus principal/admin preview for the retained admin surfaces. |
| Routes verified | `/`, `/search`, `/ai-assistant`, `/tasks`, `/lesson-plans`, `/resources`, `/classroom`, `/students`, `/courses`, `/assignments`, `/textbooks`, `/registries`, `/settings`, `/setup-registries`, and `/school-setup`. |
| Viewports verified | 3840x1400, 1920x1200, 1440x1200, 390x844, 844x390, plus 1440x1200 at 2x device-scale as a zoom proxy. |
| Verified outcomes | Teacher navigation hides `Staff` and `Registry Explorer`; principal/admin preview retains them; contextual Back actions work on Resources and Registry Explorer; browser Back and Forward preserve Registry Explorer list/detail state; legacy `/setup-registries` and `/school-setup` resolve to Settings; no page-level horizontal overflow was observed in the tested layouts. |
| Remaining gaps | Exact native 200% browser zoom, screen-reader coverage, provider-backed mutations, realistic-volume browser runs, and authenticated browser storage inspection remain open. |

## Critical Workflows

| Workflow | Status | Evidence | Remaining limitation | Release impact |
| --- | --- | --- | --- | --- |
| Settings | Conditioned | Shared settings/auth code reviewed in `src/components/SettingsPage.tsx`, `src/lib/googleWorkspaceAuth.ts`, and `src/lib/googleSheetRead.ts`; route smoke passed; code inspection confirmed the token-persistence fix in `src/lib/googleWorkspaceAuth.ts`, but authenticated browser storage inspection remains pending. | No trusted browser run for edit/save/reconnect and no keyboard-only pass. | Release-safe if browser follow-up confirms the save and connection matrix. |
| Registries | Conditioned | Shared registry shell and generic list/detail foundations reviewed in `src/components/RegistryPageShell.tsx`, `src/components/GenericRegistryDataPage.tsx`, `src/components/generic/GenericEntityPage.tsx`, and `src/components/generic/GenericEntityListView.tsx`; route smoke passed. | No browser pass for search, filters, sort, views, back/forward, or detail close/reopen. | Release-safe if the browser matrix remains stable. |
| Resources | Conditioned | Source-state and filter overlay paths reviewed in `src/components/AcademicResourceLibraryPage.tsx`; route smoke passed. | No browser verification of the modal, filter overlay, and responsive layout this wave. | Release-safe if the existing overlay behavior holds in-browser. |
| Lesson Planner | Conditioned | Custom workflow remained intact in `src/components/LessonPlanner.tsx`; route smoke passed. | No browser verification of approval, duplicate-submit prevention, or failure retention this wave. | Release-safe with a follow-up browser pass. |
| Textbook Ingestor | Conditioned | Custom workflow remained intact in `src/components/TextbookIngestor.tsx`; route smoke passed. | No browser verification of preview/approval/execution boundaries or failure retention this wave. | Release-safe with a follow-up browser pass. |
| Search | Conditioned | Search route remained available; route smoke passed. | No browser verification of grouping, stale-response handling, or keyboard flow this wave. | Release-safe if interactive search behavior remains unchanged. |
| Classroom | Conditioned | Classroom route remained available; route smoke passed. | No browser drill-through or mobile verification this wave. | Release-safe if classroom consistency remains intact. |

## Risk Register

| Severity | Affected route or workflow | Requirement IDs | Evidence | Impact | Likelihood | Mitigation | Release decision | Follow-up role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HIGH | Browser verification for critical workflows | `ACCEPT-11`, `ACCEPT-12`, `ACCEPT-13`, `ACCEPT-15`, `SAFE-15`, `SAFE-16`, `A11Y-18` | Route smoke, lint, typecheck, build, and code review passed; trusted Chrome verification now covers the teacher-facing navigation and responsive matrix, but exact native 200% zoom and some workflow evidence remain pending. | READY cannot be claimed from partial browser coverage alone. | High, because the remaining browser gaps are still workflow-relevant. | Run the remaining keyboard, screen-reader, zoom, and provider-backed checks in a trusted browser. | `CONDITIONALLY READY` | UI QA / browser verification |
| HIGH | Accessibility acceptance | `ACCEPT-12`, `A11Y-18` | No real keyboard-only or screen-reader pass was completed. | Accessibility cannot be declared complete. | High. | Use a trusted browser with a screen reader and record the workflow. | `CONDITIONALLY READY` | Accessibility QA |
| MEDIUM | Realistic data volume | `SAFE-16`, `ACCEPT-13`, `PERF-10` | Build and code review succeeded, but no live volume pass ran. | Large lists could still hide a layout or interaction issue. | Medium. | Exercise the largest legitimate datasets later. | `CONDITIONALLY READY` | UI QA |
| MEDIUM | External provider flows | `ACCEPT-02`, `ACCEPT-05`, `ACCEPT-10` | Auth and sheet-read helpers were reviewed, but live Google Workspace interaction was not repeated. | Provider-specific failures could still surface only in-browser. | Medium. | Re-run the provider-backed flows in a trusted browser when available. | `CONDITIONALLY READY` | Integration QA |
| MEDIUM | Context preservation | `ACCEPT-07`, `OPS-11` | Shared list-state and detail-shell code was reviewed; route smoke passed. | Back/Forward and filter persistence remain browser-dependent. | Medium. | Run the history and context-preservation scenarios manually. | `CONDITIONALLY READY` | UI QA |
| LOW | Bundle-size warning | `PERF-10` | Build completed with the existing Vite chunk-size warning. | Bundle size remains worth watching, but it did not block the build. | Low. | Revisit only if later profiling shows user impact. | `CONDITIONALLY READY` | Performance follow-up |
| INFORMATIONAL | HTTP route availability | `SAFE-14`, `ACCEPT-15` | Route smoke returned HTTP 200 on all required routes. | HTTP 200 proves availability only, not workflow correctness. | Informational. | Keep route smoke as a gate, not as a substitute for browser verification. | `CONDITIONALLY READY` | Release engineering |

## Accepted Limitations

- Exact native 200% browser zoom was not verified; a 2x device-scale proxy was used instead.
- Screen-reader verification was not available in this session.
- Realistic-volume browser testing was not available in this session.
- Authenticated browser storage inspection remains mandatory.
- The build still emits the existing Vite chunk-size warning.
- Route smoke confirms availability only and does not prove workflow correctness.

## Deferred Backend Limitations

- No backend architecture changes were needed for Wave 10.
- Provider-backed interactions remain dependent on the existing Google Workspace and Google Sheets helpers.

## Browser-Verification Gaps

- Exact native 200% zoom, focus management, keyboard-only flows, and modal interaction remain open.
- Browser Back/Forward, responsive layout, and teacher role navigation were verified in the trusted Chrome pass.
- The end-to-end final acceptance workflow remains open.

## Accessibility-Verification Gaps

- Keyboard-only navigation remains open.
- Screen-reader verification remains open.
- Final acceptance row `ACCEPT-12` remains not tested for that reason.

## Realistic-Volume Gaps

- No live large-dataset pass was possible.
- Long-content behavior remains code-reviewed but not browser-proved in this wave.

## External-Provider Gaps

- Live Google Workspace OAuth and Google Sheets read/write flows were not re-run in-browser this wave.
- The primary auth path remains Google Workspace OAuth, with the existing fallback path retained as a fallback only.

## Rollback Considerations

- A narrow application fix changed `src/lib/googleWorkspaceAuth.ts`; rollback would be to revert `5f14734` if needed.
- If a later browser pass finds a regression, the app state still corresponds to the reviewed implementation at `5f14734`.
- The documentation commit can be reverted independently if needed.

## Final Recommendation

`CONDITIONALLY READY`

The application build, lint, typecheck, route smoke, code review, and the storage-safety fix all support release continuation, but the remaining exact native 200% zoom gap, authenticated browser storage inspection, keyboard-only evidence, screen-reader evidence, and realistic-volume browser evidence mean the release cannot be called `READY` yet.
