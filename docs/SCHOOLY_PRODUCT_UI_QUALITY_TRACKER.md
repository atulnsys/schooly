# Schooly Product UI Quality Tracker

## Audit Metadata

| Field | Value |
| --- | --- |
| Repository | `C:\Projects\schooly` |
| Branch | `codex-ui-tracker-followup` |
| Audit date | `2026-06-21` |
| Baseline commit | `ca4f4fe` |
| Current tracker scope | Initial progressive pass covering Settings, Staff, Academic Resources, Registry Explorer, and shared shell foundations |
| Verification performed | `npx tsc --noEmit --pretty false`, `npm run build`, local route smoke, browser smoke at default / ~1024px / narrow mobile |
| Reviewed through commit | `pending` |

## Status Summary

| Status | Count |
| --- | --- |
| `PASS` | 18 |
| `PARTIAL` | 4 |
| `FAIL` | 0 |
| `BLOCKED` | 0 |
| `NOT TESTED` | 2 |
| `NOT APPLICABLE` | 0 |

## Tracker Rows

| Requirement ID | Priority | Requirement | Status | Schooly evidence | Gap | Required action | Verification | Commit SHA | Last reviewed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DS-02` | P0 | Reuse shared cards, tables, forms, filters, dialogs, page shells, and states before creating new implementations. | `PASS` | `GenericEntityPage`/`GenericEntityListView` are reused by `/resources` and `/registries`; `StaffRegistryPage` wraps the shared registry shell. | None in the audited surfaces. | Keep extending the shared shell instead of adding parallel page chrome. | Code review plus browser snapshots on `/resources`, `/registries`, and `/staff`. | `pending` | `2026-06-21` |
| `DATA-01` | P0 | Display live, configured, or clearly identified demonstration data. | `PASS` | Settings shows connected/unavailable states; Registry Explorer shows live counts and source-unavailable states; Resources labels the surface as workspace-backed and read-only. | None in the audited surfaces. | Preserve truthful source labeling. | Code review, browser snapshots, and route smoke. | `pending` | `2026-06-21` |
| `DATA-02` | P0 | Do not use mock, placeholder, or hard-coded values to conceal unavailable integrations. | `PASS` | Settings and Resources expose unavailable state text instead of inventing successful connections. | None in the audited surfaces. | Keep unavailable states explicit whenever a source is not connected. | Code review and browser snapshots. | `pending` | `2026-06-21` |
| `DATA-03` | P0 | Distinguish loading, empty, unavailable, stale, permission, and error states. | `PARTIAL` | Registry source cards and dropdown loaders expose loading, empty, unavailable, and error-like states. | Not every state variant was exhaustively exercised in-browser. | Continue sampling state permutations in follow-up sprints. | Code review plus browser smoke on the audited flows. | `pending` | `2026-06-21` |
| `DATA-05` | P0 | Show source identity and last successful sync where freshness matters. | `PARTIAL` | Settings exposes source identity, account match, and last checked/tested state; Registry Explorer exposes source labels and row counts. | Freshness stamps are not yet audited across every page. | Carry the source/time summary into other surfaces that need freshness context. | Code review and browser snapshots on Settings and Registry Explorer. | `pending` | `2026-06-21` |
| `DATA-07` | P0 | Reconcile totals across cards, dashboards, lists, details, and exports. | `PASS` | Staff KPI cards dedupe by identity and derive active/teaching/non-teaching totals from `Staff_Directory`. | None in the audited staff surface. | Keep staff and registry counts derived from the same source rules. | Code review of `StaffRegistryPage` and `liveSchoolEntityBuilders`. | `pending` | `2026-06-21` |
| `AUTH-01` | P0 | Show information and actions appropriate to the current role and scope. | `PASS` | Settings shows the active role; Registry Explorer and Staff remain scoped to the current role. | None in the audited surfaces. | Preserve role-aware surface selection and labels. | Browser snapshots on Settings and Registry Explorer. | `pending` | `2026-06-21` |
| `AUTH-02` | P0 | Hide actions the user cannot perform instead of showing controls that always fail. | `PASS` | Write actions remain disabled until the confirmation state is set; Registry Explorer navigation opens only valid routes. | None observed in the audited flows. | Keep destructive or write actions gated by real permissions. | Browser snapshots and route smoke. | `pending` | `2026-06-21` |
| `LAYOUT-01` | P0 | Use responsive desktop, tablet, and mobile layouts rather than only shrinking the desktop view. | `PASS` | Resources and Settings loaded at the default viewport, ~1024px, and narrow mobile widths. | No viewport breakage observed in the sampled flows. | Keep testing intermediate widths when adding UI. | Browser smoke at default, 1024px, and mobile viewports. | `pending` | `2026-06-21` |
| `HEADER-01` | P0 | Show one clear page title. | `PASS` | Settings and Resources each present a single obvious page heading. | None in the audited surfaces. | Avoid reintroducing duplicated page titles in first cards. | Browser snapshots. | `pending` | `2026-06-21` |
| `HEADER-04` | P0 | Place the primary page action predictably. | `PASS` | Settings exposes `View Registry Explorer` in the connection section; Resources exposes the filter action in the toolbar. | None in the audited surfaces. | Keep the main action in the expected header or toolbar location. | Browser snapshots and button activation checks. | `pending` | `2026-06-21` |
| `NAV-03` | P0 | Separate operational navigation from utilities and settings. | `PASS` | Registry Explorer sits under system/data navigation; Settings remains a standalone utility page. | None in the audited surfaces. | Preserve the current separation of work pages and utilities. | Browser snapshots of the app shell and Settings. | `pending` | `2026-06-21` |
| `KPI-04` | P1 | Keep typography, padding, and alignment consistent across peer cards. | `PASS` | Staff KPI cards share a compact consistent card treatment. | None in the audited staff card group. | Keep the KPI card treatment uniform when adding more stats. | Code review and browser snapshot of `/staff`. | `pending` | `2026-06-21` |
| `FILTER-04` | P1 | Use source-backed dropdown values for governed data. | `PASS` | Lesson plans load from `Lesson_Workspace_Registry`, staff from `Staff_Directory`, NCERT books from `NCERT_Book_Registry`, and NCERT chapters from `NCERT_Chapter_Registry`. | None in the audited filter flow after the loader fix. | Keep dropdowns registry-backed and stable-keyed. | Code review, browser modal inspection, and route smoke. | `pending` | `2026-06-21` |
| `FILTER-13` | P1 | Support dependent filters and refresh child options when parents change. | `PASS` | Chapter options are filtered by the selected NCERT book in both the live state and the draft modal state. | None in the audited resources flow. | Keep dependent filters recomputed from the parent selection. | Code review plus browser inspection of the filter modal. | `pending` | `2026-06-21` |
| `VIEW-04` | P1 | Preserve the active tab during supported flows. | `NOT TESTED` | Not explicitly exercised in this pass. | The active-tab persistence path was not sampled. | Verify tab persistence in a later focused pass. | Not tested in this run. | `pending` | `2026-06-21` |
| `STATE-01` | P2 | Define loading, background refresh, empty, filtered-empty, unavailable, stale, offline, permission, and unexpected-error states. | `PARTIAL` | The audited pages expose loading, empty, unavailable, and filtered-empty behavior. | The full state matrix was not exhaustively validated. | Continue broad state sampling in follow-up sprints. | Browser snapshots and route smoke. | `pending` | `2026-06-21` |
| `A11Y-03` | P2 | Make all functionality keyboard accessible. | `PASS` | The filter modal opens from the toolbar, Escape closes it, and the trigger remains keyboard reachable. | No screen-reader test was run. | Keep keyboard handling on new overlays and dialogs. | Browser keyboard checks on the resources modal. | `pending` | `2026-06-21` |
| `A11Y-04` | P2 | Provide visible focus states and natural focus order. | `PASS` | The modal focuses the close button on open and returns focus to the trigger on close. | None in the audited modal. | Preserve focus restoration for future overlays. | Browser focus checks on the resources filter modal. | `pending` | `2026-06-21` |
| `A11Y-18` | P2 | Test key workflows with keyboard-only navigation and a screen reader. | `NOT TESTED` | Keyboard-only modal flow was checked; no screen reader run was performed. | Screen-reader verification remains outstanding. | Add a later accessibility pass with a screen reader. | Partial keyboard-only check only. | `pending` | `2026-06-21` |
| `PERF-04` | P3 | Cancel or ignore obsolete requests. | `PASS` | The resources loader keeps a cancellation flag and the NCERT fetch now isolates book/chapter results with `Promise.allSettled`. | None in the audited dropdown flow. | Keep async loads cancellation-safe when adding more registry reads. | Code review and build/lint verification. | `pending` | `2026-06-21` |
| `SAFE-03` | P3 | Make the smallest coherent change. | `PASS` | Only the resources modal and NCERT dropdown loader were changed for this pass. | None. | Preserve the narrow-scope pattern for future fixes. | Code review of the diff. | `pending` | `2026-06-21` |
| `SAFE-14` | P3 | Run relevant type checks, lint, tests, build, and smoke checks. | `PASS` | `npx tsc --noEmit --pretty false`, `npm run build`, route smoke, and browser smoke all passed. | None. | Keep the verification set narrow but real. | Verified in this turn. | `pending` | `2026-06-21` |
| `SAFE-15` | P3 | Test loading, empty, filtered-empty, error, unavailable, permission, and populated states. | `PARTIAL` | Populated, loading, unavailable, filtered-empty, and modal states were sampled. | Not every state combination was exercised. | Expand state coverage in later sprints. | Browser smoke plus code review. | `pending` | `2026-06-21` |
| `ACCEPT-15` | Final | The affected workflow was verified end to end. | `PASS` | Settings -> Registry Explorer, Resources modal open/close, and route smoke all completed successfully. | None in the audited workflow. | Keep using end-to-end validation for future UI changes. | Browser smoke and route smoke. | `pending` | `2026-06-21` |

## Remaining P0 Notes

- No new P0 blocker was left open in the audited Settings, Staff, or Resources flows after the modal focus fix and NCERT dropdown loader update.
- The remaining tracker gaps are coverage gaps, not known breakages: active-tab persistence, full state matrix sampling, and screen-reader verification still need a later pass.
