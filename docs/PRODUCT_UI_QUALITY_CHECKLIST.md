# Product UI Quality Checklist

- Version: `1.0.0`
- Last updated: `2026-06-21`
- Scope: project-agnostic canonical checklist for product UI quality, reuse, data integrity, accessibility, responsive behavior, and implementation safety.
- Governance: stable requirement IDs, no renumbering after publication, mark obsolete entries as deprecated, and keep project-specific evidence in the project tracker.

## Changelog

- `1.0.0` - Initial publication based on the Schooly audit brief.

## Guidance

- Add new requirements using the next available ID in the relevant section.
- Keep requirement wording project-neutral.
- Store implementation evidence in the project-specific tracker, not in this canonical file.
- Deprecate obsolete requirements instead of deleting them silently.
- Require code evidence and, where applicable, rendered UI verification before marking an item `PASS`.

---
TITLE: Schooly Product UI Quality Audit and Progressive Compliance Tracker

You are working in the Schooly codebase on branch `import/enhanced-codebase`.

## Objective

Create a reusable, versioned Product Design and UI Quality Checklist, audit Schooly against it, fix clear high-priority gaps safely, and establish a tracker that must be updated during every future UI or product implementation sprint.

The checklist must remain project-agnostic so it can be reused in other applications.

The Schooly compliance tracker must remain project-specific.

Do not attempt to rewrite the entire application in one pass.

---

# Required deliverables

Create or update:

1. `docs/PRODUCT_UI_QUALITY_CHECKLIST.md`
2. `docs/SCHOOLY_PRODUCT_UI_QUALITY_TRACKER.md`

Optionally add a short link to these documents from:

`docs/GENERIC_ENTITY_VIEW_MIGRATION.md`

## Purpose of each file

### `PRODUCT_UI_QUALITY_CHECKLIST.md`

The reusable canonical checklist.

It must contain:

* checklist version;
* last updated date;
* stable requirement IDs;
* priority;
* requirement;
* acceptance evidence expected;
* changelog;
* guidance for adding, changing, deprecating, or replacing requirements.

### `SCHOOLY_PRODUCT_UI_QUALITY_TRACKER.md`

The Schooly-specific compliance record.

Each row must include:

* Requirement ID
* Priority
* Requirement
* Status
* Schooly evidence
* Gap
* Required action
* Verification
* Commit SHA
* Last reviewed

Allowed statuses:

* `PASS`
* `PARTIAL`
* `FAIL`
* `BLOCKED`
* `NOT TESTED`
* `NOT APPLICABLE`

Do not use percentages as a substitute for item-level status.

---

# Checklist governance

Use these rules so the checklist can evolve safely across projects:

1. Never reuse an existing requirement ID for a different requirement.
2. Do not renumber existing IDs after publication.
3. Add new requirements using the next available ID in the relevant section.
4. Mark obsolete requirements as `Deprecated`; do not silently delete them.
5. Record meaningful checklist changes in the changelog.
6. Keep the canonical checklist project-neutral.
7. Keep implementation evidence in the project-specific tracker.
8. Do not mark an item `PASS` merely because a component or prop exists.
9. A `PASS` requires code evidence and, where applicable, rendered UI verification.
10. Use `NOT APPLICABLE` only with a written reason.
11. Use `BLOCKED` only with the blocker and required dependency recorded.
12. Update the tracker whenever a relevant feature, page, component, or shared pattern changes.

Initial checklist version:

`1.0.0`

---

# Reusable Product Design and UI Quality Checklist

# P0 â€” Product Foundations

## 1. Design System and Reuse

* [ ] `DS-01` Use shared tokens for spacing, typography, colour, borders, radii, shadows, and breakpoints.
* [ ] `DS-02` Reuse shared cards, tables, forms, filters, dialogs, alerts, page shells, and states before creating new implementations.
* [ ] `DS-03` Avoid parallel implementations of the same interaction pattern.
* [ ] `DS-04` Keep component contracts consistent across dashboards, lists, details, and drill-through views.
* [ ] `DS-05` Use the approved spacing scale and consistent control heights.
* [ ] `DS-06` Use consistent status names, meanings, icons, and colours.
* [ ] `DS-07` Extend generic components through configuration or composition before forking them.
* [ ] `DS-08` Document intentional exceptions to shared patterns.

## 2. Data Integrity and Source Transparency

* [ ] `DATA-01` Display live, configured, or clearly identified demonstration data.
* [ ] `DATA-02` Do not use mock, placeholder, or hard-coded values to conceal unavailable integrations.
* [ ] `DATA-03` Distinguish loading, empty, unavailable, stale, permission, and error states.
* [ ] `DATA-04` Do not show zero when the source was not successfully read.
* [ ] `DATA-05` Show source identity and last successful sync where freshness matters.
* [ ] `DATA-06` Provide actionable alerts for missing sources, invalid configuration, validation failures, and sync errors.
* [ ] `DATA-07` Reconcile totals across cards, dashboards, lists, details, and exports.
* [ ] `DATA-08` Prevent duplicate records or metrics from overlapping sources.
* [ ] `DATA-09` Preserve source provenance when combining or deriving data.
* [ ] `DATA-10` Use natural domain sorting, such as Class I, Class II, and Class III.

## 3. Roles, Permissions, and Context

* [ ] `AUTH-01` Show information and actions appropriate to the current role and scope.
* [ ] `AUTH-02` Hide actions the user cannot perform instead of showing controls that always fail.
* [ ] `AUTH-03` Clearly distinguish view-only, editable, and restricted states.
* [ ] `AUTH-04` Apply permission rules consistently to pages, drill-throughs, exports, and batch actions.
* [ ] `AUTH-05` Keep organisation, school, workspace, and platform data separated.
* [ ] `AUTH-06` Preserve the active organisation, school, role, workspace, and academic context during navigation.
* [ ] `AUTH-07` Prevent sensitive administrative, financial, personal, or cost information from appearing without permission.

---

# P0 â€” Application Shell and Navigation

## 4. Layout and Page Structure

* [ ] `LAYOUT-01` Use responsive desktop, tablet, and mobile layouts rather than only shrinking the desktop view.
* [ ] `LAYOUT-02` Prevent cards, controls, labels, dialogs, and tables from breaking the viewport.
* [ ] `LAYOUT-03` Use a readable maximum content width where unrestricted stretching reduces clarity.
* [ ] `LAYOUT-04` Maintain consistent section spacing and balanced card distribution.
* [ ] `LAYOUT-05` Align peer cards to consistent heights where practical.
* [ ] `LAYOUT-06` Avoid unnecessary nested cards and repeated borders.
* [ ] `LAYOUT-07` Separate page-level actions from section and row actions.
* [ ] `LAYOUT-08` Use structured skeletons for initial loading and minimise layout shift.
* [ ] `LAYOUT-09` Test intermediate widths and browser zoom, not only named breakpoints.

## 5. Page Headers

* [ ] `HEADER-01` Show one clear page title.
* [ ] `HEADER-02` Add supporting text only when it improves orientation.
* [ ] `HEADER-03` Use breadcrumbs only for meaningful hierarchy.
* [ ] `HEADER-04` Place the primary page action predictably.
* [ ] `HEADER-05` Visually distinguish primary, secondary, and overflow actions.
* [ ] `HEADER-06` Do not repeat the page title in the first content card.
* [ ] `HEADER-07` Show relevant context such as school, class, department, period, or status.
* [ ] `HEADER-08` Keep header actions usable without unpredictable wrapping or overlap.

## 6. Primary Navigation

* [ ] `NAV-01` Group destinations by user task.
* [ ] `NAV-02` Keep frequent destinations easy to reach.
* [ ] `NAV-03` Separate operational navigation from utilities and settings.
* [ ] `NAV-04` Avoid duplicate destinations without a clear reason.
* [ ] `NAV-05` Indicate the current destination using more than colour alone.
* [ ] `NAV-06` Support collapsed desktop navigation where useful and provide icon tooltips.
* [ ] `NAV-07` Use an appropriate mobile drawer or navigation pattern.
* [ ] `NAV-08` Preserve relevant navigation and page state.
* [ ] `NAV-09` Use natural keyboard order and visible focus indicators.
* [ ] `NAV-10` Use terminology familiar to the target users.

---

# P1 â€” Search, Filters, Tabs, and Views

## 7. Search and Filters

* [ ] `FILTER-01` Provide search where users need to find records quickly.
* [ ] `FILTER-02` Search domain-relevant fields and explain the scope where necessary.
* [ ] `FILTER-03` Debounce remote live search and cancel or ignore obsolete requests.
* [ ] `FILTER-04` Use source-backed dropdown values for governed data.
* [ ] `FILTER-05` Use shared filter components and configuration schemas.
* [ ] `FILTER-06` Map data types to appropriate controls: dropdown, date, range, boolean, or free text.
* [ ] `FILTER-07` Keep filter labels, spacing, action order, and responsive behaviour consistent.
* [ ] `FILTER-08` Support page-specific filters without changing the standard interaction pattern.
* [ ] `FILTER-09` Show applied filters through chips, summaries, or a filter count.
* [ ] `FILTER-10` Allow individual removal and Clear All.
* [ ] `FILTER-11` Apply filters consistently, either immediately or through Apply.
* [ ] `FILTER-12` Use Apply for expensive or multi-control filtering.
* [ ] `FILTER-13` Support dependent filters and refresh child options when parents change.
* [ ] `FILTER-14` Prevent invalid or contradictory filter combinations.
* [ ] `FILTER-15` Retain filters during list-to-detail and drill-through navigation.
* [ ] `FILTER-16` Represent search, filters, sort, page, and view in the URL where safe and practical.
* [ ] `FILTER-17` Restore list state through browser back and forward navigation.
* [ ] `FILTER-18` Avoid exposing sensitive values in shareable URLs.
* [ ] `FILTER-19` Show resulting record count after filters apply.
* [ ] `FILTER-20` Use a modal or drawer when inline filters overcrowd the page.
* [ ] `FILTER-21` Make date ranges inclusive and clearly labelled.
* [ ] `FILTER-22` Use global filters only when they genuinely apply to all affected sections.

## 8. Tabs and Saved Views

* [ ] `VIEW-01` Use tabs only for peer content in the same context.
* [ ] `VIEW-02` Do not duplicate sidebar navigation with tabs.
* [ ] `VIEW-03` Show tab counts only when decision-useful.
* [ ] `VIEW-04` Preserve the active tab during supported flows.
* [ ] `VIEW-05` Do not show empty or disabled tabs without explanation.
* [ ] `VIEW-06` Preserve temporary filters, sort, columns, widths, pinning, density, and page size for the session.
* [ ] `VIEW-07` Allow named views to be saved, updated, duplicated, renamed, deleted, and set as default where supported.
* [ ] `VIEW-08` Define view visibility as private, team, role, or organisation-wide.
* [ ] `VIEW-09` Restrict shared-view changes to authorised owners or administrators.
* [ ] `VIEW-10` Store filters, sort, columns, order, widths, pinning, density, and page size in saved views where supported.
* [ ] `VIEW-11` Indicate when the current view differs from its saved version.
* [ ] `VIEW-12` Distinguish temporary changes, Reset, Restore default, and Delete view.
* [ ] `VIEW-13` Handle renamed, removed, or inaccessible fields in older views gracefully.
* [ ] `VIEW-14` Distinguish system-defined and user-created views.
* [ ] `VIEW-15` Allow a shared view to be duplicated before customisation.

---

# P1 â€” Dashboards and Visual Summaries

## 9. KPI and Summary Cards

* [ ] `KPI-01` Give each card one clear purpose.
* [ ] `KPI-02` Use concise labels and clearly readable values.
* [ ] `KPI-03` Use readable numeral glyphs without distracting slashed zeroes.
* [ ] `KPI-04` Keep typography, padding, and alignment consistent across peer cards.
* [ ] `KPI-05` Avoid repeating the same label in the title, subtitle, and description.
* [ ] `KPI-06` Show units, period, scope, and comparison basis where relevant.
* [ ] `KPI-07` Explain comparisons instead of showing unexplained arrows.
* [ ] `KPI-08` Do not communicate direction or severity through colour alone.
* [ ] `KPI-09` Make cards interactive only when a meaningful destination exists.
* [ ] `KPI-10` Preserve filters and context in card drill-throughs.
* [ ] `KPI-11` Use a non-interactive treatment for cards without drill-through.
* [ ] `KPI-12` Keep operational warnings separate from ordinary KPIs.

## 10. Alerts and Attention Items

* [ ] `ALERT-01` Separate actionable exceptions from routine metrics.
* [ ] `ALERT-02` Prioritise by severity, urgency, and user responsibility.
* [ ] `ALERT-03` Explain what happened, why it matters, and what action is available.
* [ ] `ALERT-04` Link actionable items to the relevant record or workflow.
* [ ] `ALERT-05` Avoid duplicate alerts across sections.
* [ ] `ALERT-06` Group repeated alerts where individual rows create noise.
* [ ] `ALERT-07` Support acknowledged, dismissed, or resolved states where applicable.
* [ ] `ALERT-08` Do not present success or â€œall clearâ€ states as warnings.
* [ ] `ALERT-09` Do not display technical placeholders or repeated source labels as alert content.

## 11. Charts and Visualisations

* [ ] `CHART-01` Use a chart only when it communicates better than a value or table.
* [ ] `CHART-02` Select the chart type based on the analytical question.
* [ ] `CHART-03` Show clear labels, units, legends, and periods.
* [ ] `CHART-04` Use accessible colours and distinguishable patterns.
* [ ] `CHART-05` Provide exact values through tooltips or labels.
* [ ] `CHART-06` Avoid misleading truncated scales.
* [ ] `CHART-07` Handle empty and unavailable chart states.
* [ ] `CHART-08` Provide a table or text alternative for important information.
* [ ] `CHART-09` Avoid unnecessary animation.
* [ ] `CHART-10` Resize without clipping labels, legends, or values.

---

# P1 â€” Lists, Tables, and Data Operations

## 12. List View Structure

* [ ] `LIST-01` Use a compact header with title, count, search, filters, and primary action.
* [ ] `LIST-02` Keep frequent actions visible and place infrequent actions in overflow.
* [ ] `LIST-03` Show the applied organisation, class, department, period, or other scope.
* [ ] `LIST-04` Use the generic list view by default for standard search, filter, sort, selection, pagination, and row-action behaviour.
* [ ] `LIST-05` Use a custom view only when the workflow or interaction model differs materially.
* [ ] `LIST-06` Document why a custom view is required and which generic capabilities it replaces.
* [ ] `LIST-07` Reuse shared headers, filters, states, permissions, and data services in custom views.
* [ ] `LIST-08` Keep custom views on the same route, permission, state, and design-system foundations.
* [ ] `LIST-09` Preserve applicable search, filter, accessibility, saved-view, and state behaviour in custom views.
* [ ] `LIST-10` Do not use a custom view solely for cosmetic variation.
* [ ] `LIST-11` Use table, card, or alternate mobile presentation according to the data and device.
* [ ] `LIST-12` Keep row and card click behaviour predictable.
* [ ] `LIST-13` Do not make the entire row clickable when it conflicts with nested controls.

## 13. Table Behaviour

* [ ] `TABLE-01` Keep headers visible for long scrolling tables where useful.
* [ ] `TABLE-02` Prioritise essential columns and hide lower-priority fields responsively.
* [ ] `TABLE-03` Use deliberate wrapping or truncation and provide access to essential truncated content.
* [ ] `TABLE-04` Set sensible minimum and maximum column widths.
* [ ] `TABLE-05` Support column resizing, reordering, visibility, and pinning where users need them.
* [ ] `TABLE-06` Provide one accessible column-management control.
* [ ] `TABLE-07` Protect mandatory identity and action columns.
* [ ] `TABLE-08` Preserve column configuration for the session and saved views where supported.
* [ ] `TABLE-09` Align and format numbers, dates, currency, percentages, identifiers, and statuses consistently.
* [ ] `TABLE-10` Sort only meaningful fields and show accessible sort direction.
* [ ] `TABLE-11` Use deterministic default sorting and natural domain sorting.
* [ ] `TABLE-12` Handle blanks, dates, numbers, and mixed-case text consistently.
* [ ] `TABLE-13` Use multi-column sorting only where genuinely useful.
* [ ] `TABLE-14` Keep row height readable without excessive whitespace.
* [ ] `TABLE-15` Avoid horizontal scrolling for primary information where practical.
* [ ] `TABLE-16` Keep row actions consistently positioned and accessibly labelled.
* [ ] `TABLE-17` Do not make column actions discoverable only through hover.
* [ ] `TABLE-18` Make column controls keyboard operable.

## 14. Selection, Pagination, Export, and Empty Lists

* [ ] `OPS-01` Show selection controls only when batch actions exist.
* [ ] `OPS-02` Show the number of selected records.
* [ ] `OPS-03` Distinguish selecting the page from selecting all matching records.
* [ ] `OPS-04` Disable incompatible batch actions with an explanation.
* [ ] `OPS-05` Confirm destructive batch operations.
* [ ] `OPS-06` Report partial batch success or failure by record.
* [ ] `OPS-07` Preserve filters and selection context where practical.
* [ ] `OPS-08` Use pagination, virtualisation, or progressive loading appropriate to dataset size.
* [ ] `OPS-09` Show the current range and total count where known.
* [ ] `OPS-10` Support page-size changes where useful.
* [ ] `OPS-11` Preserve page position when returning from a detail record.
* [ ] `OPS-12` Do not load an entire large dataset only to calculate visible summaries.
* [ ] `OPS-13` Keep server-side search, filters, sorting, and pagination consistent.
* [ ] `EXPORT-01` Make exports respect current search, filters, sort, fields, scope, selection, and permissions.
* [ ] `EXPORT-02` Distinguish selected records, current page, and all matching records.
* [ ] `EXPORT-03` Export user-facing labels and formatted values unless raw data is requested.
* [ ] `EXPORT-04` Provide progress and completion feedback.
* [ ] `EXPORT-05` Report partial or failed exports accurately.
* [ ] `EXPORT-06` Include applied scope or filter summary where useful.
* [ ] `EMPTY-01` Distinguish no records from no matching filtered records.
* [ ] `EMPTY-02` Explain the empty state in user-facing language.
* [ ] `EMPTY-03` Provide the most relevant permitted next action.
* [ ] `EMPTY-04` Do not show create actions without permission.
* [ ] `EMPTY-05` Keep empty-state visuals concise.

---

# P1 â€” Details, Forms, and Workflows

## 15. Detail Views

* [ ] `DETAIL-01` Use the generic detail view for standard identity, fields, status, relations, audit, and actions.
* [ ] `DETAIL-02` Use a custom detail view only for a materially different workflow or information hierarchy.
* [ ] `DETAIL-03` Document why the custom view is required and what it replaces.
* [ ] `DETAIL-04` Reuse shared headers, actions, fields, forms, relations, permissions, and states.
* [ ] `DETAIL-05` Keep record identity, status, and key identifier visible.
* [ ] `DETAIL-06` Group fields by user task.
* [ ] `DETAIL-07` Use tabs only for genuinely distinct information groups.
* [ ] `DETAIL-08` Avoid repeating the same information across header and cards.
* [ ] `DETAIL-09` Use reusable list components for related records.
* [ ] `DETAIL-10` Keep the primary action visible without overcrowding the header.
* [ ] `DETAIL-11` Show relevant created, updated, and ownership information.
* [ ] `DETAIL-12` Preserve the originating list, filters, page, and scroll context.
* [ ] `DETAIL-13` Use explicit view and edit modes for complex or sensitive records.
* [ ] `DETAIL-14` Distinguish read-only values without making them illegible.
* [ ] `DETAIL-15` Provide a migration or fallback path for custom detail views.

## 16. Forms and Validation

* [ ] `FORM-01` Use persistent visible labels.
* [ ] `FORM-02` Mark required fields consistently.
* [ ] `FORM-03` Explain unusual formats and constraints before submission.
* [ ] `FORM-04` Use controls appropriate to the data type.
* [ ] `FORM-05` Use source-backed dropdowns for governed values.
* [ ] `FORM-06` Support search in long dropdowns.
* [ ] `FORM-07` Avoid excessively long unstructured option menus.
* [ ] `FORM-08` Provide safe defaults without irreversible assumptions.
* [ ] `FORM-09` Preserve entered data after recoverable validation failures.
* [ ] `FORM-10` Warn before abandoning unsaved changes.
* [ ] `FORM-11` Prevent duplicate submissions.
* [ ] `FORM-12` Show saving, saved, and failed states.
* [ ] `FORM-13` Place specific correction guidance near invalid fields.
* [ ] `FORM-14` Move focus to the first invalid field and provide a summary for long forms.
* [ ] `FORM-15` Do not disable the primary action without explaining what is incomplete.
* [ ] `FORM-16` Associate labels, helper text, and errors programmatically.
* [ ] `FORM-17` Use helper text only when it adds information beyond the label.
* [ ] `FORM-18` Keep instructions readable and do not truncate validation or compliance guidance.

## 17. Multi-Step Workflows

* [ ] `WIZARD-01` Use a wizard only when the task has a meaningful sequence.
* [ ] `WIZARD-02` Show current, completed, and remaining steps using descriptive names.
* [ ] `WIZARD-03` Retain data when moving backwards and forwards.
* [ ] `WIZARD-04` Validate each step at the appropriate time.
* [ ] `WIZARD-05` Provide a final review before completion.
* [ ] `WIZARD-06` Distinguish saving progress from completing the workflow.
* [ ] `WIZARD-07` Support drafts for long or high-effort workflows.
* [ ] `WIZARD-08` Warn before abandoning incomplete work.
* [ ] `WIZARD-09` Do not hide important decisions in optional or collapsed steps.

---

# P2 â€” Overlays, States, and Feedback

## 18. Modals, Drawers, Popovers, and Menus

* [ ] `OVERLAY-01` Use modals only for focused temporary tasks.
* [ ] `OVERLAY-02` Use drawers for contextual workflows needing more space.
* [ ] `OVERLAY-03` Use popovers only for lightweight related information or actions.
* [ ] `OVERLAY-04` Provide a clear title, backdrop, and explicit action labels.
* [ ] `OVERLAY-05` Trap focus, move focus into the overlay, and return focus to the trigger.
* [ ] `OVERLAY-06` Support Escape for non-destructive dialogs.
* [ ] `OVERLAY-07` Prevent accidental backdrop dismissal for destructive or partially completed work.
* [ ] `OVERLAY-08` Keep primary and secondary actions consistently positioned.
* [ ] `OVERLAY-09` Constrain height and keep long content scrollable with visible header and footer.
* [ ] `OVERLAY-10` Avoid nested modals.
* [ ] `OVERLAY-11` Use full-screen or drawer treatment on mobile when needed.
* [ ] `OVERLAY-12` Keep menus inside the viewport and close them appropriately.
* [ ] `OVERLAY-13` Keep primary actions outside overflow menus.
* [ ] `OVERLAY-14` Use accessible touch targets and do not depend on hover.

## 19. Loading, Empty, Error, and Permission States

* [ ] `STATE-01` Define initial loading, background refresh, empty, filtered-empty, unavailable, stale, offline, permission, and unexpected-error states.
* [ ] `STATE-02` Use skeletons where the final structure is known.
* [ ] `STATE-03` Use scoped progress indicators and avoid blocking unrelated page sections.
* [ ] `STATE-04` Keep existing data visible during safe background refreshes.
* [ ] `STATE-05` Disable only controls affected by an operation.
* [ ] `STATE-06` Provide feedback for operations taking more than a moment.
* [ ] `STATE-07` Do not leave loading indicators running indefinitely without timeout or error handling.
* [ ] `STATE-08` Use plain user-facing error language.
* [ ] `STATE-09` Provide Retry, Configure, Connect, or other recovery actions where relevant.
* [ ] `STATE-10` Do not expose stack traces, tokens, internal paths, or sensitive details.
* [ ] `STATE-11` Keep surrounding navigation available when one section fails.
* [ ] `STATE-12` Explain permission restrictions without exposing protected information.

## 20. Alerts, Banners, and Toasts

* [ ] `FEEDBACK-01` Use inline messages for field issues, banners for persistent page conditions, toasts for brief completion feedback, and dialogs for decisions.
* [ ] `FEEDBACK-02` Use consistent semantic status tokens.
* [ ] `FEEDBACK-03` Use text or icons in addition to colour.
* [ ] `FEEDBACK-04` Keep success messages concise.
* [ ] `FEEDBACK-05` Keep critical errors visible until resolved or acknowledged.
* [ ] `FEEDBACK-06` Allow sufficient reading time for transient notifications.
* [ ] `FEEDBACK-07` Pause dismissal while the user interacts where supported.
* [ ] `FEEDBACK-08` Provide a recovery action where one exists.
* [ ] `FEEDBACK-09` Prevent duplicate notifications from stacking.
* [ ] `FEEDBACK-10` Announce important feedback through an appropriate live region.

---

# P2 â€” Content, Responsive Design, and Accessibility

## 21. Content, Typography, and Icons

* [ ] `CONTENT-01` Use terminology familiar to users and consistent across the application.
* [ ] `CONTENT-02` Use specific domain labels instead of generic â€œItem,â€ â€œObject,â€ or unexplained â€œStatus.â€
* [ ] `CONTENT-03` Use action-oriented button labels.
* [ ] `CONTENT-04` Avoid repeating headings, labels, and descriptions without adding meaning.
* [ ] `CONTENT-05` Keep explanatory text concise and useful.
* [ ] `CONTENT-06` Use sentence case unless the design system specifies otherwise.
* [ ] `CONTENT-07` Use plain-language errors.
* [ ] `CONTENT-08` Avoid exposing technical source names in primary text unless users need them.
* [ ] `CONTENT-09` Handle singular, plural, and counts correctly.
* [ ] `CONTENT-10` Format dates, time, currency, and numbers for the userâ€™s locale.
* [ ] `TYPE-01` Use the approved typography scale with clear hierarchy and adequate line height.
* [ ] `TYPE-02` Avoid excessively light text for important information.
* [ ] `TYPE-03` Use readable numeral forms.
* [ ] `ICON-01` Use the approved icon library and consistent visual weight.
* [ ] `ICON-02` Label or describe unfamiliar and icon-only controls.
* [ ] `ICON-03` Hide decorative icons from assistive technology.

## 22. Responsive Behaviour

* [ ] `RESP-01` Define intended desktop, tablet, and mobile behaviour.
* [ ] `RESP-02` Stack cards, forms, actions, and fields logically on narrow screens.
* [ ] `RESP-03` Keep primary actions visible without covering content.
* [ ] `RESP-04` Prevent labels, buttons, values, and badges from colliding.
* [ ] `RESP-05` Avoid fixed widths that cause clipping or overflow.
* [ ] `RESP-06` Use horizontal table scrolling only when alternate layouts or column reduction are unsuitable.
* [ ] `RESP-07` Use appropriately sized and separated touch targets.
* [ ] `RESP-08` Test intermediate widths, landscape, portrait, and browser zoom.

## 23. Accessibility

* [ ] `A11Y-01` Use semantic HTML before ARIA.
* [ ] `A11Y-02` Maintain a logical heading hierarchy.
* [ ] `A11Y-03` Make all functionality keyboard accessible.
* [ ] `A11Y-04` Provide visible focus states and natural focus order.
* [ ] `A11Y-05` Provide a skip-to-content mechanism for complex shells.
* [ ] `A11Y-06` Associate labels, helper text, errors, and controls.
* [ ] `A11Y-07` Provide accessible names for buttons, links, inputs, cards, icons, and tables.
* [ ] `A11Y-08` Associate table headers correctly with cells.
* [ ] `A11Y-09` Expose current sort direction programmatically.
* [ ] `A11Y-10` Make column menus, resizing, reordering, visibility, and view management keyboard operable.
* [ ] `A11Y-11` Provide keyboard alternatives to drag-and-drop.
* [ ] `A11Y-12` Do not make controls discoverable only through hover.
* [ ] `A11Y-13` Announce important filter, sort, loading, result-count, and status changes appropriately.
* [ ] `A11Y-14` Meet approved text and interface contrast.
* [ ] `A11Y-15` Do not communicate meaning through colour alone.
* [ ] `A11Y-16` Provide alternatives for meaningful images and charts.
* [ ] `A11Y-17` Respect reduced-motion preferences.
* [ ] `A11Y-18` Test key workflows with keyboard-only navigation and a screen reader.

---

# P3 â€” Performance, Reliability, and Implementation Safety

## 24. Performance

* [ ] `PERF-01` Load only the data needed for the current view.
* [ ] `PERF-02` Use server-side pagination, filtering, and sorting for large datasets.
* [ ] `PERF-03` Avoid duplicate requests for data already available in context.
* [ ] `PERF-04` Cancel or ignore obsolete requests.
* [ ] `PERF-05` Lazy-load secondary content where appropriate.
* [ ] `PERF-06` Optimise large images, icons, charts, and assets.
* [ ] `PERF-07` Avoid unnecessary rerenders of large tables and dashboards.
* [ ] `PERF-08` Cache stable reference data appropriately.
* [ ] `PERF-09` Keep interactions responsive during background work.
* [ ] `PERF-10` Test with realistic data volumes.

## 25. Interaction Reliability

* [ ] `RELIABILITY-01` Prevent duplicate submissions and repeated destructive actions.
* [ ] `RELIABILITY-02` Use optimistic updates only when rollback is defined.
* [ ] `RELIABILITY-03` Handle partial failures explicitly.
* [ ] `RELIABILITY-04` Preserve user input after recoverable failures.
* [ ] `RELIABILITY-05` Do not silently discard edits.
* [ ] `RELIABILITY-06` Confirm irreversible or high-impact actions.
* [ ] `RELIABILITY-07` Provide Undo for reversible actions where practical.
* [ ] `RELIABILITY-08` Keep browser back and forward navigation predictable.
* [ ] `RELIABILITY-09` Prevent stale responses from replacing newer data.
* [ ] `RELIABILITY-10` Keep displayed state consistent after create, edit, archive, delete, and refresh.

## 26. Safe Implementation and Verification

* [ ] `SAFE-01` Inspect the existing architecture before introducing a component or pattern.
* [ ] `SAFE-02` Extend intended components, services, routes, types, and styles.
* [ ] `SAFE-03` Make the smallest coherent change.
* [ ] `SAFE-04` Do not rewrite unrelated code.
* [ ] `SAFE-05` Do not create a second data or component architecture.
* [ ] `SAFE-06` Treat custom views as controlled extensions of generic architecture.
* [ ] `SAFE-07` Prefer configuration, composition, and extension points before forking.
* [ ] `SAFE-08` Keep generic and custom views on shared routing, permissions, state, data access, and design foundations.
* [ ] `SAFE-09` Periodically promote recurring custom requirements into reusable capabilities.
* [ ] `SAFE-10` Keep new UI data-driven and configuration-driven where appropriate.
* [ ] `SAFE-11` Do not add mock data to hide missing integrations.
* [ ] `SAFE-12` Preserve existing routes, permissions, filters, state, and workflows.
* [ ] `SAFE-13` Verify the narrowest affected workflow first.
* [ ] `SAFE-14` Run relevant type checks, lint, tests, build, and smoke checks.
* [ ] `SAFE-15` Test loading, empty, filtered-empty, error, unavailable, permission, and populated states.
* [ ] `SAFE-16` Test long labels, large values, duplicates, and realistic record volumes.
* [ ] `SAFE-17` Record limitations instead of concealing them with placeholders.

---

# Final Acceptance Checklist

* [ ] `ACCEPT-01` Shared components and design tokens are used.
* [ ] `ACCEPT-02` Data is live, configured, or clearly identified as demonstration data.
* [ ] `ACCEPT-03` Values reconcile with their source and related pages.
* [ ] `ACCEPT-04` Missing or unreadable data is not shown as zero.
* [ ] `ACCEPT-05` Role and permission rules are applied.
* [ ] `ACCEPT-06` Primary and secondary actions are clear.
* [ ] `ACCEPT-07` Search, filters, sort, views, and navigation preserve context.
* [ ] `ACCEPT-08` Interactive metrics and alerts have working destinations.
* [ ] `ACCEPT-09` Alerts are actionable and not duplicated.
* [ ] `ACCEPT-10` Loading, empty, filtered-empty, error, unavailable, stale, and permission states are handled.
* [ ] `ACCEPT-11` Layout works on desktop, tablet, mobile, and browser zoom.
* [ ] `ACCEPT-12` Keyboard, focus, labels, contrast, and screen-reader behaviour are acceptable.
* [ ] `ACCEPT-13` Long content and realistic data volumes do not break the page.
* [ ] `ACCEPT-14` No unrelated functionality or styling changed.
* [ ] `ACCEPT-15` The affected workflow was verified end to end.

---

# Schooly audit scope

Audit all active Schooly pages and shared UI foundations, including:

* `/`
* `/settings`
* `/registries`
* `/staff`
* `/teachers`
* `/students`
* `/resources`
* `/courses`
* `/assignments`
* `/classroom`
* `/lesson-plans`
* `/textbooks`
* `/search`

Also inspect:

* application shell and navigation;
* generic list and detail components;
* registry page shell;
* shared cards and status components;
* filter architecture;
* saved-view support;
* tables and column behaviour;
* modal and drawer patterns;
* role and permission checks;
* source-state and data-provenance logic;
* responsive behaviour;
* accessibility foundations.

---

# Immediate Schooly priority review

Review the latest implemented changes first.

## Settings

Confirm:

* Registry Summary was removed.
* `section=summary` safely opens Registry Connection.
* `View Registry Explorer` opens `/registries` in List View.
* Registry connection and authentication states remain truthful.
* Advanced configuration remains available without dominating the normal flow.

## Staff

Confirm:

* Capability Metadata is hidden only on Staff.
* Other applicable registry pages still show capability metadata.
* KPI cards reconcile with `Staff_Directory`.
* Total Staff is deduplicated.
* Active Staff uses the shared active-status rule.
* Teaching Staff uses `isTeacherStaffRow`.
* Non-Teaching Staff equals Active Staff minus Teaching Staff.
* Departments are deduplicated from active staff.
* Staff filters use canonical Staff Directory values.

## Academic Resources

Confirm:

* the old Compact Filters card is absent;
* the filter action appears in the list toolbar;
* the modal supports Apply, Cancel, Clear All, Escape, focus handling, and mobile scrolling;
* applied-filter count is correct;
* query parameters initialise the active filter state;
* Lesson Plan options come from `Lesson_Workspace_Registry`;
* Staff options come from `Staff_Directory`;
* NCERT Textbooks come from `NCERT_Book_Registry`;
* NCERT Chapters come from `NCERT_Chapter_Registry`;
* stable registry IDs are used;
* unavailable registries do not silently fall back to unrelated data;
* one unavailable registry does not disable unrelated dropdowns.

---

# Audit process

## Phase 1 â€” Inventory

1. Run `git status --short`.
2. Run `git --no-pager log --oneline --decorate -15`.
3. Confirm the active branch and clean worktree.
4. Inventory active routes, page components, generic components, shared patterns, data services, and permissions.
5. Identify custom views and record why each is custom.

## Phase 2 â€” Baseline assessment

For every checklist item:

1. Assign a status.
2. Record code evidence.
3. Record rendered evidence where required.
4. Record the affected routes and components.
5. Record the gap and recommended action.
6. Do not mark unverified behaviour as `PASS`.

## Phase 3 â€” Prioritisation

Prioritise findings in this order:

1. P0 data-integrity, permission, navigation, and broken-layout issues.
2. P1 workflow, filter, table, and drill-through issues.
3. P2 accessibility, state, content, and responsive issues.
4. P3 performance and maintainability improvements.

Classify each gap as:

* Critical
* High
* Medium
* Low

Also record:

* user impact;
* affected roles;
* affected routes;
* whether the gap is shared or page-specific;
* recommended implementation sprint.

## Phase 4 â€” Safe remediation

In this pass:

* fix clear P0 failures that are small, coherent, and low-risk;
* fix regressions directly related to the latest Settings, Staff, or Resources work;
* do not attempt to resolve the entire checklist in one large change;
* create a prioritised backlog for remaining items;
* use bounded implementation loops;
* update the tracker after every fix.

For each fix:

1. Inspect the current implementation.
2. Reuse existing extension points.
3. Make the smallest coherent change.
4. Run the narrowest relevant verification.
5. Fix only issues caused by the change.
6. Update tracker evidence and status.
7. Commit before moving to an unrelated requirement group.

## Phase 5 â€” Progressive compliance

At the end of the pass:

* calculate counts by status and priority;
* do not calculate a misleading single quality score;
* list all P0 failures and partials;
* identify the next recommended sprint;
* leave every unresolved item trackable;
* add a â€œReviewed through commitâ€ value to the tracker.

---

# Evidence requirements

Examples of acceptable evidence:

* file path and symbol/component;
* route and rendered state;
* test name and result;
* screenshot reference where available;
* browser viewport used;
* API/source state;
* accessibility check performed;
* commit SHA.

Examples of unacceptable evidence:

* â€œLooks goodâ€
* â€œComponent existsâ€
* â€œShould workâ€
* â€œBuild passedâ€ as proof of UI behaviour
* route HTTP 200 as proof of interaction correctness

---

# Verification

Run:

`npx tsc --noEmit --pretty false`

Run the repositoryâ€™s configured lint and test commands where available.

Run:

`npm run build`

The existing Vite chunk-size warning is acceptable if the build succeeds.

Perform browser smoke at:

`http://127.0.0.1:3001`

Test at minimum:

* wide desktop;
* approximately 1024px;
* narrow mobile;
* browser zoom where practical;
* keyboard-only navigation for key workflows.

Do not add new testing dependencies merely for this audit.

---

# Commit strategy

Use focused commits.

Suggested commits:

1. `docs: add reusable product UI quality checklist`
2. `docs: add Schooly UI compliance tracker`
3. `fix: resolve critical UI quality gaps`
4. `docs: update Schooly UI audit evidence`

Do not use `git add .`.

Stage only relevant files.

Do not push unless explicitly requested.

---

# Final response requirements

Include:

* initial branch and git status;
* checklist file created or updated;
* checklist version;
* tracker file created or updated;
* number of requirements by priority;
* PASS count;
* PARTIAL count;
* FAIL count;
* BLOCKED count;
* NOT TESTED count;
* NOT APPLICABLE count;
* all remaining P0 gaps;
* Settings review result;
* Staff review result and KPI values;
* Academic Resources review result;
* generic versus custom view findings;
* responsive findings;
* accessibility findings;
* data-integrity findings;
* permission findings;
* fixes made;
* tracker rows updated;
* TypeScript result;
* lint/test result;
* build result;
* browser smoke result;
* commit SHAs;
* push status;
* recommended next sprint.

Mandatory final response contract:

The final line must be exactly:

TITLE: Schooly Product UI Quality Audit and Progressive Compliance Tracker

Do not add text after that line.

