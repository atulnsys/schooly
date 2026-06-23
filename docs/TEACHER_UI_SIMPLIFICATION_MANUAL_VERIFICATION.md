# Teacher UI Simplification Manual Verification

This repository pass completed the code changes, build, lint, TypeScript, and route-availability smoke checks.

Trusted browser verification was not available in this session, so the responsive and interaction checks below still need a live browser pass.

## Already verified

- `npm run lint`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `git diff --check`
- HTTP 200 route availability for:
  - `/`
  - `/search`
  - `/ai-assistant`
  - `/tasks`
  - `/lesson-plans`
  - `/resources`
  - `/classroom`
  - `/students`
  - `/courses`
  - `/assignments`
  - `/textbooks`
  - `/registries`
  - `/settings`
  - `/setup-registries`
  - `/school-setup`

## Still needs trusted browser verification

- 3840px or comparable ultra-wide desktop
- 1920px desktop
- 1440px laptop
- 1024px tablet / compact desktop
- 768px tablet
- 390px mobile portrait
- mobile landscape
- 200% browser zoom
- Teacher role navigation and layout
- Principal or administrator role navigation and layout
- Sidebar width, readability, and grouping
- Mobile drawer open/close behavior
- Escape-to-close behavior
- Back navigation from detail views
- Search / filter / selection preservation
- Split-pane behavior on registry-style pages
- Any horizontal scrolling regressions

## Notes for the browser pass

- Confirm the ultra-wide workspace no longer leaves a large blank center area.
- Confirm the Registry Explorer opens detail content only after selection.
- Confirm Settings legacy routes still land in the Settings sections.
- Confirm teacher-facing navigation no longer exposes dense setup or role-simulation controls.
- Confirm list/detail pages still preserve query, filters, and selection when drilling in and back out.
