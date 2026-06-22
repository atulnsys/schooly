# Wave 10 Final Acceptance Manual

This file captures the browser-dependent checks that were required for Wave 10 but could not be completed in this session because trusted browser control was unavailable.

## Current Evidence

| Check | Result |
| --- | --- |
| Lint | Passed |
| TypeScript | Passed |
| Build | Passed |
| Route smoke | Passed on `/`, `/settings`, `/registries`, `/registers`, `/staff`, `/teachers`, `/resources`, `/lesson-plans`, `/textbooks`, `/classroom`, `/students`, `/courses`, `/assignments`, and `/search` |
| Browser | Not run |
| Keyboard | Not run |
| Screen reader | Not run |
| Responsive | Not run |
| Realistic volume | Not run |

## Manual Browser Matrix

Use this matrix in a trusted browser when available.

| Route | Viewport | Exact steps | Expected result |
| --- | --- | --- | --- |
| `/` | Desktop, 1024px, 768px, 390px portrait, mobile landscape, 200% zoom | Open the landing page, inspect the shell, navigation, and primary cards. | No clipping, no horizontal overflow, and the main navigation remains reachable. |
| `/settings` | Same as above | Edit a writable setting, save it, retry after a failed save, and test the registry connection flow. | Save states remain truthful, drafts persist on failure, and duplicate submission is prevented. |
| `/registries` | Same as above | Search, filter, change display mode, open and close a detail row, then use Back and Forward. | Context is preserved and the detail shell behaves predictably. |
| `/resources` | Same as above | Open the filter modal, move through controls with keyboard only, close it, and reopen it. | Focus is trapped correctly, Escape works, and the overlay stays within the viewport. |
| `/lesson-plans` | Same as above | Open a lesson, exercise the approval or save path, and check failure retention. | The custom workflow remains intact and does not lose user input. |
| `/textbooks` | Same as above | Open the ingest flow, review preview and approval steps, and inspect failure handling. | The preview survives recoverable failures and approval remains explicit. |
| `/search` | Same as above | Enter a query, clear it, and confirm the no-results and result-grouping states. | Results remain legible and older responses do not replace newer ones. |
| `/classroom` | Same as above | Open the page and inspect any supported drill-through or consistency indicators. | Route remains stable and no layout issues appear at the sampled widths. |

## Accessibility Checks

| Check | Status | Note |
| --- | --- | --- |
| Keyboard-only navigation | Not run | Trusted browser control was unavailable. |
| Focus order and return | Not run | Trusted browser control was unavailable. |
| Screen reader workflow | Not run | No screen reader was available in this session. |
| Contrast and labels | Code reviewed only | No browser pass was available. |

## Notes

- This manual file is the fallback evidence bundle for Wave 10.
- It should be completed in a trusted browser before anyone claims `READY`.
- The application received one narrow auth-storage fix in Wave 10, but the browser-dependent checks still need completion.
