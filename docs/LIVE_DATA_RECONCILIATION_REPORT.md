# Live Data Reconciliation Report

Read-only verification against the live SchoolyTestDrive-backed sources.

Summary: Data matching test: Passing
Totals: 27 total | 25 passing | 0 failing | 0 blocked | 2 not applicable
Selected session: Unknown
Generated at: 2026-06-19T19:02:43.890Z
Source refresh result: 0/11 connected
Source discovery: 0 mapped, 4 unmapped from 4 discovered files.

- Other registry-backed pages / Lesson Plans: not_applicable
- Other registry-backed pages / Textbooks: not_applicable

# Live Data Reconciliation Report

Generated at: 2026-06-19T19:02:43.890Z
Selected session: Unknown
Source refresh result: 0/11 connected
Total checks: 27 | Passing: 25 | Failing: 0 | Blocked: 0 | Not applicable: 2

| Category | Page / KPI | Route | Registry source | Source rows | Eligible rows | UI value | Result | Mismatch |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Dashboard KPIs | Active Students | / | Master Registry / Student_Directory | 0 | 0 | 0 | PASS |  |
| Dashboard KPIs | Active Staff | / | Master Registry / Staff_Directory | 0 | 0 | 0 | PASS |  |
| Dashboard KPIs | Active Class Sections | / | Master Registry / Classes_Sections | 0 | 0 | 0 | PASS |  |
| Dashboard KPIs | Teacher Allocation Coverage | / | Dashboard Data Source / Planner_Submissions / Master Registry / Teacher_Allocations | 0 | 0 | 0% | PASS |  |
| Dashboard KPIs | Google Classroom Courses | / | Google Classroom Sync Registry / Classroom_Course_Map | 5 | 5 | 5 | PASS |  |
| Dashboard KPIs | Attendance / Engagement | / | Dashboard Data Source / Attendance_Summary | 0 | 0 | 0% | PASS |  |
| Dashboard KPIs | Alerts | / | Dashboard Data Source / Alert_Log | 0 | 0 | 0 | PASS |  |
| Dashboard KPIs | Assessments | / | Assessment/Result Registry / Assessment_Plan | 0 | 0 | 0 | PASS |  |
| Dashboard KPIs | Lesson Workspace | / | Lesson Workspace Registry / Lesson_Workspace_Registry | 0 | 0 | 0 | PASS |  |
| Dashboard KPIs | SQAA Evidence | / | QA/SQAA Registry / SQAA_Evidence_Map | 0 | 0 | 0 | PASS |  |
| Students and SIS | Students | /students | Master Registry / Student_Directory + Student_Enrollment | 0 | 0 | 0 | PASS |  |
| Staff and Teachers | Staff | /staff | Master Registry / Staff_Directory | 0 | 0 | 0 | PASS |  |
| Staff and Teachers | Teachers | /teachers | Master Registry / Staff_Directory + Teacher_Allocations | 0 | 0 | 0 | PASS |  |
| Classroom Courses and Assignments | Classroom Courses | /courses | Google Classroom Sync Registry / Classroom_Course_Map | 5 | 5 | 5 | PASS |  |
| Classroom Courses and Assignments | Assignments | /assignments | Google Classroom Sync Registry / Classroom_Assignment_Map | 1 | 1 | 1 | PASS |  |
| Students and SIS | Synced SIS Pupil Roster | /students | Master Registry / Student_Directory / Google Classroom Sync Registry / Classroom_Submission_Sync | 0 | 0 | 0 | PASS |  |
| Registry readiness | Registry Explorer | /registries | Registry Catalog / Registry Schema | 79 | 79 | 79 | PASS |  |
| Registry readiness | REG_STAFF_DIRECTORY | /registries/REG_STAFF_DIRECTORY | Master Registry / Staff_Directory | 0 | 0 | 0 | PASS |  |
| Registry readiness | REG_TEACHER_ALLOCATIONS | /registries/REG_TEACHER_ALLOCATIONS | Master Registry / Teacher_Allocations | 0 | 0 | 0 | PASS |  |
| Registry readiness | Classes Sections registry | /registries/REG_CLASSES_SECTIONS | Master Registry / Classes_Sections | 0 | 0 | 0 | PASS |  |
| Registry readiness | Subjects registry | /registries/REG_SUBJECTS | Master Registry / Subjects | 0 | 0 | 0 | PASS |  |
| Other registry-backed pages | Resources | /resources | Workspace files / Lesson Workspace Registry / NCERT English Medium Registry / QA/SQAA Registry | 19 | 19 | 19 | PASS |  |
| Other registry-backed pages | Lesson Plans | /lesson-plans | Lesson Workspace Registry / lesson plan archive | 0 | 0 | 0 | NOT_APPLICABLE |  |
| Other registry-backed pages | Textbooks | /textbooks | NCERT English Medium Registry / NCERT Private Map | 0 | 0 | 0 | NOT_APPLICABLE |  |
| Registry readiness | Settings ready count | /settings?section=drive-sync | All configured registries | 11 | 0 | 0/11 | PASS |  |
| Registry readiness | Setup Centre ready count | /setup-registries | All configured registries | 11 | 0 | 0/11 | PASS |  |
| Registry readiness | Registry Explorer ready/empty/missing totals | /registries | Registry Catalog / Registry Schema | 79 | 79 | 4/43 | PASS |  |
