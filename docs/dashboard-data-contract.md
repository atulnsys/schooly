# Dashboard Data Contract

Schooly reads production dashboard data from a native Google Sheet. It must not use uploaded `.xlsx` files or local mock JSON for Principal, Coordinator, or Teacher dashboard metrics.

## Canonical Drive Location

Use the existing Google Drive structure. Do not create duplicate numeric folders.

```text
SchoolyTestDrive/
  00_School_Setup_and_Registries/
    01_Live_Master_Data/
    02_Lesson_Workspace_Registries/
    03_QA_SQAA_Compliance/
    04_Curriculum_Reference_Data/
    05_Dashboard_Data/
```

Canonical dashboard source:

```text
00_School_Setup_and_Registries/05_Dashboard_Data/Schooly_Dashboard_Source_SEEDED
```

Legacy dashboard source:

```text
00_School_Setup_and_Registries/05_Dashboard_Data/Schooly_Dashboard_Data_Source_SEEDED
```

`Schooly_Dashboard_Data_Source_SEEDED` is legacy. It can be archived after confirming no localStorage/app configuration points at it. The app should not require it for production dashboard flow.

## Canonical Workbooks

- Master Data Registry: `00_School_Setup_and_Registries/01_Live_Master_Data/Schooly_Master_Data_Registry_SEEDED`
- Dashboard Source: `00_School_Setup_and_Registries/05_Dashboard_Data/Schooly_Dashboard_Source_SEEDED`
- Lesson Workspace Registry: `00_School_Setup_and_Registries/02_Lesson_Workspace_Registries/Schooly_Lesson_Workspace_Registry_SEEDED`
- QA/SQAA Registry: `00_School_Setup_and_Registries/03_QA_SQAA_Compliance/Schooly_QA_SQAA_Registry_SEEDED`
- Curriculum/NCERT Reference Data: `00_School_Setup_and_Registries/04_Curriculum_Reference_Data/...`

If an `.xlsx` copy exists directly under `00_School_Setup_and_Registries`, treat it as an upload artifact only. Use the converted/native Google Sheet URL as the app source.

## Configuration

- Config key: `schooly_dashboard_sheet_url`
- Recommended workbook: `Schooly_Dashboard_Source_SEEDED`
- Empty-state source: no dashboard metrics are displayed until a readable native Google Sheet is connected

## Canonical Tabs

The resolver primarily reads these tabs from `Schooly_Dashboard_Source_SEEDED`:

- `Dashboard_KPI_Definitions`
- `Dashboard_Metrics`
- `Planner_Submissions`
- `Classroom_Activity`
- `Assessment_Tracking`
- `Notebook_Monitoring`
- `Attendance_Summary`
- `Syllabus_Coverage`
- `Compliance_Evidence_Summary`
- `Evidence_Gaps`
- `Dashboard_Alerts`
- `Dashboard_Source_Log`

## Legacy Tab Aliases

Legacy tabs are supported only as lower-priority fallbacks and should produce this warning:

```text
Legacy dashboard workbook detected. Use Schooly_Dashboard_Source_SEEDED or update tab names.
```

Alias mapping:

- `KPI_Definitions` -> `Dashboard_KPI_Definitions`
- `Dashboard_KPI_Source` -> `Dashboard_Metrics`
- `Curriculum_Coverage` -> `Syllabus_Coverage`
- `Compliance_Evidence` -> `Compliance_Evidence_Summary`
- `Alert_Log` -> `Dashboard_Alerts`

## Source Health Warnings

If both old and new dashboard source names are configured:

```text
Two dashboard source workbooks detected. Using Schooly_Dashboard_Source_SEEDED. Archive the older Schooly_Dashboard_Data_Source_SEEDED after confirming data migration.
```

If the configured URL points to the old workbook:

```text
Legacy dashboard source configured. This may still work only if legacy tab aliases are supported. Recommended: switch to Schooly_Dashboard_Source_SEEDED.
```

If the configured URL points to an uploaded Excel file:

```text
This file is an uploaded Excel file, not a native Google Sheet. Open it with Google Sheets or use the converted Google Sheet URL.
```

## Dashboard Mapping

Principal dashboard uses:

- Classrooms Active -> `Classroom_Activity`
- Weekly Planners Submitted -> `Planner_Submissions`
- Assessments on Track -> `Assessment_Tracking`
- Compliance Score -> `Compliance_Evidence_Summary`
- Notebook Monitoring -> `Notebook_Monitoring`
- Syllabus Coverage -> `Syllabus_Coverage`
- Alerts -> `Dashboard_Alerts`
- Evidence gaps / remedial risk -> `Evidence_Gaps`
- Source/resource contribution log -> `Dashboard_Source_Log`

Coordinator dashboard uses:

- Planner status -> `Planner_Submissions`
- Classroom activity -> `Classroom_Activity`
- Assessments due/completion -> `Assessment_Tracking`
- Remedial/evidence gaps -> `Evidence_Gaps`
- Source/resource contribution log -> `Dashboard_Source_Log`
- Coordinator scope / class ownership -> `Coordinator_Scope` in `Schooly_Master_Data_Registry`
- Planner matrix + source health -> `Dashboard_Metrics`, `Dashboard_Alerts`, `Dashboard_Source_Log`

Planned coordinator-only tabs:

- `Invigilation_Olympiad_Duties` in the assessment/result registry workbook
- `Schooly_Teacher_CPD_Renewal_Registry` in the HR/CPD workbook

For the coordinator dashboard, the app must resolve classes, sections, subjects, and teacher assignments from live registry rows. If `Coordinator_Scope` is missing, the dashboard should render setup-required states rather than inventing coordinator coverage.

Teacher dashboard uses:

- Assigned classes / activity -> `Classroom_Activity`
- Planner submissions -> `Planner_Submissions`
- Assessment completion -> `Assessment_Tracking`
- Syllabus coverage -> `Syllabus_Coverage`
- Notebook monitoring -> `Notebook_Monitoring`
- Teacher-scoped metric rows -> `Dashboard_Metrics`

Student dashboard uses:

- Student identity / class scope -> `Student_Directory`, `Student_Enrollment`, `Classes_Sections`
- Attendance status -> `Attendance_Summary`
- Active assignments / checklist -> `Classroom_Assignment_Map`, `Classroom_Submission_Sync`, `Dashboard_Alerts`
- Timetable / daily schedule -> `Timetable`, `Classroom_Course_Map`, `Classroom_Activity`
- Study files / quick access resources -> `Books_Registry`, `Book_TOC_Registry`
- Announcements -> `Classroom_Announcement_Sync`, `Classroom_Activity`

For the student dashboard, the app must resolve the selected student from live registry rows and must not invent student names, classes, or homework counts. If the selected student cannot be resolved, show setup-required states rather than a fake portal.

## Setup & Registries

The role dashboards now share a single `RegistryHealthSummary` model for setup visibility. That summary drives the compact `Setup & Registry Health` strip on the normal dashboards and the full Setup & Registries page.

Dashboard behavior:

- Principal, school admin, and manager roles show the compact strip with connected count, warning count, critical count, onboarding status, last sync time, next action, and an `Open Setup Centre` action.
- Coordinator, HOD, exams, and teacher roles only show the compact strip when a relevant source is unhealthy, and they do not render detailed registry internals on the normal dashboard.
- Parent and student roles only show a simple role-relevant issue message when a required source is unavailable.
- When registries are healthy and the role is not privileged, the compact strip is hidden rather than expanded into registry detail cards.
- Normal role dashboards keep the shell compact: the hero shows `Role Dashboard · Session · Alerts` with the alert badge aligned to the far right, configuration actions move to `Settings` or `Setup & Registries`, and large cards should render only the top five rows with a clear `View all (N)` drill-through.
- The `School at a Glance` area should not repeat the alert count because the alert badge already lives in the hero/header.
- The normal shell now surfaces AI Assistant and Settings as primary sidenav entries while keeping preview/persona diagnostics out of the production-style sidebar.
- Dashboard cards should follow the shared DashboardCardModel shape with route-ready drill-through metadata (/dashboard/details/:role/:cardKey) even when the implementation currently opens an inline detail panel.

The full Setup & Registries page contains the detailed live registry connections, onboarding wizard, registry-driven overview, registry catalog, field/capability detail, and sync/repair actions. The normal dashboard must not duplicate those detailed cards.

HOD dashboard uses:

- HOD profile / department scope -> `Staff_Directory`, `Department_Scope`
- Repository health -> `NCERT_Chapter_Registry`, `NCERT_Chapter_File_Map`, `Artifact_Registry`, `Lesson_Workspace_Registry`, `Classroom_Publish_Log`
- Teacher activity -> `Teacher_Allocations`, `Planner_Submissions`, `Classroom_Activity`, `Dashboard_Alerts`, `Evidence_Gaps`
- Assessment tracking -> `Assessment_Plan`, `Question_Paper_Registry`, `Marks_Entry`, `Result_Analysis`
- Enrichment / olympiads -> `Schooly_Enrichment_Olympiad_Registry`
- Remedial status / alerts -> `Evidence_Gaps`, `Marks_Entry`, `Result_Analysis`, `Dashboard_Alerts`

Manager dashboard uses:

- Profile / role scope -> `Staff_Directory`, `Academic_Years`, `School_Profile`
- Operational KPIs -> `Dashboard_Metrics`, `Dashboard_Alerts`, `Planner_Submissions`, `Classroom_Activity`, `Assessment_Tracking`
- Strategic operations -> `Budget_Utilization`, `Strategic_Milestones`, `Operational_Checklist`
- Compliance / review -> `QA_Checklist_Config`, `QA_Review_Log`, `SQAA_Evidence_Map`, `Compliance_Report_Registry`
- Classroom / assessment health -> `Assessment_Plan`, `Marks_Entry`, `Result_Analysis`, `Classroom_Course_Map`, `Classroom_Assignment_Map`, `Classroom_Submission_Sync`, `Classroom_Sync_Log`
- Announcements / source health -> `Classroom_Announcement_Sync`, `Dashboard_Source_Log`

Planned manager-only tabs:

- `Schooly_Strategic_Operations_Registry`
- `Invigilation_Olympiad_Duties` in the assessment/result registry workbook
- `Schooly_Teacher_CPD_Renewal_Registry` in the HR/CPD workbook

For the manager dashboard, the app must resolve all cards from live rows only. If a strategic operations workbook is missing, the dashboard must show setup-required states rather than reusing hardcoded KPI samples or inherited role mock cards.

## Empty-State Behavior

If the sheet is missing, unreadable, unpublished, blocked by permissions, or missing tabs, the resolver returns empty dashboard structures and shows a visible connection warning. Dashboards must not silently read local mock JSON for production-like metrics.
