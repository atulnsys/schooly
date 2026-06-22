# Wave 8 Manual Browser Verification

This checklist records the browser steps that should be run for the wave 8 overlay, UI state, error, and feedback pass.
No row below should be marked passed unless the full sequence was actually performed in a browser.

## Overlays

| Route | Prerequisite | Viewport | Action sequence | Expected result | Actual result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | File preview or Drive sync trigger visible | Desktop, `1024px`, `390px`, `200%` zoom | Open the file preview modal, then open the Drive sync modal. Close each with the close button, backdrop, and Escape. Reopen one and verify focus returns to the trigger. | Both overlays use the shared shell, trap focus, restore focus, and keep the body scroll locked only while open. | Not run | Not run | Covers app preview, Drive sync, focus entry, Escape, backdrop click, and focus return. |
| `/registries` | Shared list controls available | Desktop, `1024px`, `390px`, `200%` zoom | Open `Columns`, change density, hide and restore a non-mandatory column, then close and reopen. Repeat with `Views`, save a view, and trigger delete confirmation from the same overlay. | Shared overlay is used, table state survives open/close, destructive delete confirmation stays inside the same overlay, and no nested modal appears. | Not run | Not run | Covers Columns, Saved Views, saved-view deletion, action ordering, and nested-overlay prevention. |
| `/resources` | Filter button visible | Desktop, `1024px`, `390px`, `200%` zoom | Open the resource filter overlay, change a few filters, click Cancel, reopen it, then Apply the filters. | Filter state survives open/close, Apply and Cancel remain distinct, Escape is supported, and backdrop dismissal is safe. | Not run | Not run | Covers Resources filters and mobile-safe layout. |
| `/lesson-plans` | Lesson Planner loaded with at least one plan | Desktop and mobile | Trigger the delete confirmation, cancel once, then confirm once. Repeat a save attempt and a copy-to-clipboard action. | Confirmation happens in-app, cancel makes no mutation, duplicate execution is blocked, and success/failure is surfaced in-page rather than via browser prompts. | Not run | Not run | Covers Lesson Planner confirmation and feedback replacement. |
| `/textbooks` | Textbook Ingestor loaded with at least one plan | Desktop and mobile | Trigger the delete confirmation, cancel once, then confirm once. Run one approval or execution path and verify feedback appears in-page. | Confirmation happens in-app, cancel makes no mutation, failure keeps preview state, and success appears only after completion. | Not run | Not run | Covers Textbook approval or execution confirmation. |

## Interaction

| Route | Prerequisite | Viewport | Action sequence | Expected result | Actual result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/registries` | Columns dialog open | Desktop, `1024px` | Move focus into the dialog, press Tab and Shift+Tab through the controls, then press Escape. | Initial focus lands inside the dialog, focus cycles, Escape closes only when allowed, and focus returns to the trigger. | Not run | Not run | Covers focus entry, Tab, Shift+Tab, Escape, and focus return. |
| `/resources` | Filter dialog open | Desktop, `1024px` | Move through the overlay with the keyboard, then click the backdrop and verify close behaviour. | Backdrop click closes a non-destructive overlay, focus returns safely, and no stale focus trap remains. | Not run | Not run | Covers backdrop click and focus cleanup. |
| `/lesson-plans` | Delete confirmation open | Desktop, `1024px` | Try backdrop click, Escape, Cancel, and Confirm. | Backdrop dismissal is blocked for the destructive confirm, Cancel performs no mutation, and Confirm executes once only. | Not run | Not run | Covers destructive backdrop protection and duplicate-submit protection. |
| `/textbooks` | Delete confirmation open | Desktop, `1024px` | Try backdrop click, Escape, Cancel, and Confirm. | Backdrop dismissal is blocked for the destructive confirm, Cancel performs no mutation, and Confirm executes once only. | Not run | Not run | Covers destructive backdrop protection and duplicate-submit protection. |
| `/registries` | Saved Views dialog open | Desktop, `1024px` | Open delete confirmation from within the overlay, then return to the saved views list and reopen it. | The menu closes before the confirm opens, focus returns to the overlay trigger, and the overlay does not stack another modal shell. | Not run | Not run | Covers menu closing and nested-overlay prevention. |
| `/settings` | Save controls available | Desktop, `1024px`, `390px`, `200%` zoom | Trigger a recoverable save or validation error, then attempt the action again. | Only the affected control is disabled, the loader clears, and a newer result replaces the older message. | Not run | Not run | Covers duplicate-message prevention and loading-state clearing. |

## Responsive

| Route | Prerequisite | Viewport | Action sequence | Expected result | Actual result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Any overlay trigger visible | Desktop, `1024px`, `390px`, `200%` zoom | Open each modal and inspect the body/footer action placement at the three sizes. | Dialogs remain within the viewport, have readable headers and footers, and keep action targets touch-friendly. | Not run | Not run | Covers mobile presentation, action placement, and touch targets. |
| `/registries` | Columns dialog open | Desktop, `1024px`, `390px`, `200%` zoom | Scroll the overlay body and inspect the footer buttons at each size. | Long content scrolls within the body, the footer stays visible, and controls remain usable on mobile. | Not run | Not run | Covers long-content scrolling and consistent footer placement. |
| `/resources` | Filter overlay open | Desktop, `1024px`, `390px`, `200%` zoom | Resize the viewport with the overlay open and confirm the controls stay usable. | The dialog stays readable at desktop, 1024px, and 390px widths with no clipped controls. | Not run | Not run | Covers responsive overlay layout. |

## States And Feedback

| Route | Prerequisite | Viewport | Action sequence | Expected result | Actual result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/resources` | Page loading in progress | Desktop | Observe the initial load and then the empty and filtered-empty cases. | Loading and empty states are distinct, and filtered-empty is not presented as a data failure. | Not run | Not run | Covers initial loading, empty, filtered-empty, and source-awareness. |
| `/settings` | Source unavailable or permission-restricted state available | Desktop | Trigger the unavailable or permission state and inspect the recovery text. | The message distinguishes unavailable, permission, and retry/reconnect states without exposing protected details. | Not run | Not run | Covers unavailable, permission, and recovery-action messaging. |
| `/lesson-plans` | Save attempt available | Desktop | Attempt a save and then retry after an error or edit. | Existing content stays visible, success does not appear early, and stale success clears on the next attempt or edit. | Not run | Not run | Covers background operation, recoverable failure, retry, and stale-success clearing. |
| `/textbooks` | Confirmation or execution path available | Desktop | Run a confirm-based action and then inspect the post-action feedback. | The page shows concise success only after completion, and failure keeps the preview or entered state. | Not run | Not run | Covers concise success, failure retention, and critical-error persistence. |
| `/search` | Search results with feedback available | Desktop | Trigger a feedback message and watch the live region behaviour. | The message is announced once, repeated renders do not duplicate it, and assistive-tech semantics stay polite or assertive by tone. | Not run | Not run | Covers live-region behaviour, semantic urgency, and duplicate-message prevention. |
| `/mock_studio` | Invalid JSON available | Desktop | Save invalid JSON, then fix it and save again. | Validation stays inline, the page does not escalate to browser alerts, and the second save replaces the earlier error. | Not run | Not run | Covers inline field message vs banner taxonomy. |

