# Wave 7 Manual Browser Verification

This checklist records the exact browser steps that still need live interaction.
It is intentionally conservative: no row below should be marked passed unless the full sequence was actually performed.

## Generic Detail Surfaces

| Route | Viewport | Exact steps | Pass | Fail |
| --- | --- | --- | --- | --- |
| `/registries` | Desktop, `1024px`, `390px`, `200%` zoom | Open the page, select a row, inspect the title, key identifier, status, source identity, created/updated/owner chips, then close the detail pane with the button and reopen the same row with the keyboard. | The detail shows the record identity, source context, audit metadata, and long text clearly; close returns focus to the initiating control; layout does not clip at any viewport. | Detail hides identity or source context, focus is lost, values clip, or the pane behaves differently across the sampled widths. |
| `/staff` | Desktop, `1024px`, `390px`, `200%` zoom | Open a staff row, verify status and source metadata, close the detail, then use Back and Forward to return to the same row. | Filters, page, page size, and the selected row remain intact; Back and Forward restore the same state without a normalization loop. | The list resets, the row ID is lost, or browser history causes a state loop. |
| `/teachers` | Desktop, `1024px`, `390px`, `200%` zoom | Open a teacher row that is read-only and inspect the read-only reason, source identity, ownership, and any validation or source issues. | The record is clearly read-only, the values remain legible, and any disabled actions explain why they are unavailable. | The panel looks editable, hides source state, or exposes actions without an explanation. |
| `/students` | Desktop, `1024px`, `390px`, `200%` zoom | Open a student row, change filters so the row disappears, then close and reopen the detail. | The detail explains that the row is still selected but filtered out; the originating page and filters remain intact. | The row disappears with no explanation or the filter/page state is lost. |
| `/courses` | Desktop, `1024px`, `390px`, `200%` zoom | Open a course row from a direct `row` URL, then repeat with a stale `row` value after removing the record from the visible source. | The direct link works when valid, stale IDs fail safely, and the missing-record state is truthful. | The pane shows a false success, a blank panel, or a crash. |
| `/assignments` | Desktop, `1024px`, `390px`, `200%` zoom | Open an assignment row, inspect the grouped fields and external links if present, then switch to a filtered state that hides the row. | The detail remains readable, grouped fields stay organized, and the filtered-out state is explained clearly. | The detail collapses into duplicate identity cards, or the filtered state is silent. |
| `/resources` | Desktop, `1024px`, `390px`, `200%` zoom | Open a resource row from the list, close it with the keyboard only, then open it again and inspect the external links. | Keyboard opening and closing work, focus moves predictably, and the detail supports the resource read-only workflow. | Keyboard interaction fails, focus is lost, or the detail cannot be reopened cleanly. |

## Settings Forms

| Route | Viewport | Exact steps | Pass | Fail |
| --- | --- | --- | --- | --- |
| `/settings` organization save | Desktop, `1024px`, `390px`, `200%` zoom | Edit an organization field, double-click `Save Local Settings`, then type another change and confirm the saved message clears. | Only one local save runs, a saving state appears, and stale success feedback clears after the next edit. | The form submits twice, the success message stays stale after editing, or entered values are cleared. |
| `/settings` registry connection | Desktop, `1024px`, `390px`, `200%` zoom | Enter a connection account hint and registry URL, blur the fields, then click `Save Connection` and `Test Connection`. | Labels stay visible, helper text is readable, saving state is visible, and invalid or source-unavailable results are truthful. | The form hides its labels, saves the wrong source, or overwrites the draft on failure. |
| `/settings` Gemini key | Desktop, `1024px`, `390px`, `200%` zoom | Edit the Gemini API key, press Enter while the field is focused, then click `Save Application Settings`. | The save path runs once, the button shows saving state, and Enter plus click do not duplicate the save. | Two saves fire, the blur-save and button-save race each other, or the input is cleared on failure. |
| `/settings` registry update | Desktop, `1024px`, `390px`, `200%` zoom | Leave write confirmation off, attempt `Update Registry`, then turn confirmation on and retry after write access is granted. | Confirmation and permission gates block the write honestly, duplicate execution is prevented, and the status explains what remains unsaved. | The page writes without approval, gives fake success, or leaves the user unsure what happened. |
| `/settings` responsive and keyboard | Desktop, `1024px`, `390px`, `200%` zoom | Move through the settings inputs with Tab, Shift+Tab, Enter, and Space; repeat at the sampled widths. | Focus order is predictable, labels remain visible, and the layout stays usable without overlapping controls. | Focus jumps unexpectedly, instructions truncate, or the layout breaks at a sampled width. |

## Custom Workflow Regression

| Route | Viewport | Exact steps | Pass | Fail |
| --- | --- | --- | --- | --- |
| `/lesson-plans` | Desktop and mobile | Open Lesson Planner, inspect the editing flow, and verify that the approval or review sequence still behaves as a custom workflow rather than a generic registry form. | The planner remains bespoke, the review-before-write behaviour is preserved, and no generic detail shell replaces it. | The page is flattened into the generic registry detail pattern or loses its existing approval steps. |
| `/textbooks` | Desktop and mobile | Open Textbook Ingestor, walk through preview, approval, and publish-related screens, and check that a failure retains the preview. | The ingestion flow stays custom, approval gates remain explicit, duplicate execution is prevented, and failure-state retention works. | The workflow loses its staged preview/approval design or claims success before execution completes. |
| `/classroom` | Desktop and mobile | Open the classroom route and confirm it still loads normally. | The route remains separate from the generic detail foundation and still loads cleanly. | The classroom route breaks or is forced into a generic detail pattern. |
| `/search` | Desktop and mobile | Open universal search and confirm that the search workflow still behaves as it did before Wave 7. | Search stays functional and unchanged by the detail/form remediation work. | Search is broken, repurposed, or loses its existing navigation behaviour. |

