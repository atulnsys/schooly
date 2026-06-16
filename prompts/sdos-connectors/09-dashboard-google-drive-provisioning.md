# Schooly Dashboard Source Alignment Prompt

Use this prompt with Gemini, Apps Script, or a Google Drive automation agent to align the live Schooly dashboard source. Do not create new Google Drive folders, duplicate workbooks, XLSX files, or template files. Reuse the existing uploaded Drive structure and native Google Sheets.

## Existing Drive Structure

Use the current structure exactly:

```text
SchoolyTestDrive/
  00_School_Setup_and_Registries/
    01_Live_Master_Data/
    02_Lesson_Workspace_Registries/
    03_QA_SQAA_Compliance/
    04_Curriculum_Reference_Data/
    05_Dashboard_Data/
```

## Canonical Sources

- Master Data Registry: `00_School_Setup_and_Registries/01_Live_Master_Data/Schooly_Master_Data_Registry_SEEDED`
- Dashboard Source: `00_School_Setup_and_Registries/05_Dashboard_Data/Schooly_Dashboard_Source_SEEDED`
- Lesson Workspace Registry: `00_School_Setup_and_Registries/02_Lesson_Workspace_Registries/Schooly_Lesson_Workspace_Registry_SEEDED`
- QA/SQAA Registry: `00_School_Setup_and_Registries/03_QA_SQAA_Compliance/Schooly_QA_SQAA_Registry_SEEDED`
- Curriculum/NCERT Reference Data: `00_School_Setup_and_Registries/04_Curriculum_Reference_Data/...`

Treat `Schooly_Dashboard_Source_SEEDED` as the canonical dashboard workbook.

Treat `Schooly_Dashboard_Data_Source_SEEDED` as legacy. Do not delete it automatically. It can be archived after confirming no app/localStorage configuration points at it.

If an `.xlsx` copy exists under `00_School_Setup_and_Registries`, treat it as an upload artifact only. Use the native Google Sheet URL, not the raw `.xlsx` upload.

## Required Dashboard Tabs

Verify that the native Google Sheet `Schooly_Dashboard_Source_SEEDED` contains these tabs:

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

Legacy aliases may be read only as fallback:

- `KPI_Definitions` -> `Dashboard_KPI_Definitions`
- `Dashboard_KPI_Source` -> `Dashboard_Metrics`
- `Curriculum_Coverage` -> `Syllabus_Coverage`
- `Compliance_Evidence` -> `Compliance_Evidence_Summary`
- `Alert_Log` -> `Dashboard_Alerts`

If legacy aliases are found, report:

```text
Legacy dashboard workbook detected. Use Schooly_Dashboard_Source_SEEDED or update tab names.
```

## Meaningful Starter Rows

If the canonical workbook is empty and you are explicitly allowed to edit it, use rows like these. Otherwise only report gaps.

### Dashboard_KPI_Definitions

```csv
kpi_id,role,metric,title,details,percentage,source_tab,owner
kpi-planner-principal,principal,Weekly Planners Submitted,Weekly planners,Planner submissions across active sections,80,Planner_Submissions,Principal Office
kpi-classroom-principal,principal,Classrooms Active,Classroom activity,Google Classroom activity by class and teacher,75,Classroom_Activity,Academic Coordinator
kpi-assessment-teacher,teacher,Assessment Completion,Assessment completion,Teacher-scoped assessment completion,86,Assessment_Tracking,Assessment Cell
kpi-evidence-coordinator,coordinator,Evidence Gaps,Evidence gaps,Open evidence and remedial follow-up rows,3,Evidence_Gaps,Coordinator
```

### Dashboard_Metrics

```csv
role,teacher,subject,class,metric,value,percentage,status,details,date
principal,,All,All,Classrooms Active,4/5,80,watch,One classroom inactive this week,2026-06-12
teacher,Ms. Priya Nair,Mathematics,Class VIII-B,Teacher Average,79,79,on_track,Four posting days completed,2026-06-12
coordinator,,Middle School,Classes VI-VIII,Planner Follow-up,2 pending,60,watch,Two planner rows need follow-up,2026-06-12
```

### Planner_Submissions

```csv
class,section,subject,teacher,submitted,total,overdue,status,last_submitted,date
Class VIII,A,Science,Dr. Sarah Henderson,1,1,0,complete,2026-06-10,2026-06-10
Class VIII,B,Mathematics,Ms. Priya Nair,1,1,0,complete,2026-06-10,2026-06-10
Class IX,C,Social Science,Mr. Rahul Kapoor,0,1,1,missing,,2026-06-10
```

### Classroom_Activity

```csv
class,section,subject,teacher,status,active,posts,assignments_created,submission_rate,meet_sessions_held,last_activity_date
Class VIII,A,Science,Dr. Sarah Henderson,active,yes,8,4,91,2,2026-06-12
Class VIII,B,Mathematics,Ms. Priya Nair,active,yes,6,3,86,1,2026-06-12
Class IX,C,Social Science,Mr. Rahul Kapoor,inactive,no,0,0,54,0,2026-06-02
```

### Assessment_Tracking

```csv
subject,class,section,teacher,assessment,completion,percentage,score,average,due_date,status
Science,Class VIII,A,Dr. Sarah Henderson,UT1 Practical Rubric,92,92,92,81,2026-06-14,on_track
Mathematics,Class VIII,B,Ms. Priya Nair,Algebra Quiz 2,86,86,86,78,2026-06-14,on_track
Social Science,Class IX,C,Mr. Rahul Kapoor,Civics Formative Check,58,58,58,64,2026-06-13,late
```

### Notebook_Monitoring

```csv
class,section,subject,teacher,submitted,total,overdue,percent,status,last_checked,posting_warning
Class VIII,A,Science,Dr. Sarah Henderson,36,38,2,95,complete,2026-06-11,3
Class VIII,B,Mathematics,Ms. Priya Nair,33,37,4,89,complete,2026-06-11,3
Class IX,C,Social Science,Mr. Rahul Kapoor,20,39,19,51,critical,2026-06-08,3
```

### Attendance_Summary

```csv
class,section,teacher,attendance_rate,absent_count,status,date
Class VIII,A,Dr. Sarah Henderson,94,2,on_track,2026-06-12
Class VIII,B,Ms. Priya Nair,90,4,on_track,2026-06-12
Class IX,C,Mr. Rahul Kapoor,78,9,watch,2026-06-12
```

### Syllabus_Coverage

```csv
level,class,subject,teacher,coverage,planner_rate,percentage,chapter_current,expected_chapter
Middle,Class VIII,Science,Dr. Sarah Henderson,82,100,82,Energy Resources,Energy Transformations
Middle,Class VIII,Mathematics,Ms. Priya Nair,78,100,78,Linear Equations,Quadratic Equations
Secondary,Class IX,Social Science,Mr. Rahul Kapoor,61,0,61,Constitutional Design,Electoral Politics
```

### Compliance_Evidence_Summary

```csv
category,score,percentage,owner,evidence_folder,due_date,status
Committee records,88,88,Principal Office,School Governance/Committee Records,2026-06-20,on_track
Safety records,76,76,Estate Manager,School Governance/Safety Records,2026-06-18,watch
SQAA evidence,79,79,Internal Quality Liaison,School Governance/SQAA Evidence,2026-06-25,on_track
```

### Evidence_Gaps

```csv
student,class,section,subject,teacher,risk,status,score,issue,action_plan,guardian_contacted
Aarav Mehta,Class VIII,B,Mathematics,Ms. Priya Nair,high,active,82,Missed two algebra checkpoints,Weekly concept clinic and parent update,yes
Dev Sharma,Class IX,C,Social Science,Mr. Rahul Kapoor,high,unassigned,88,Map work and civics test gaps,Assign remedial mentor,no
Meher Gupta,Class VIII,A,Science,Dr. Sarah Henderson,medium,active,64,Lab record corrections pending,Notebook correction review,yes
```

### Dashboard_Alerts

```csv
id,severity,text,source,category,date
alert-001,High,Class IX-C has zero Classroom posts this week,Google Classroom,lms,2026-06-12
alert-002,High,Two weekly planners are missing for the current cycle,Planner Submissions,planning,2026-06-12
alert-003,Medium,Safety records folder needs renewal evidence before 18 June,Compliance Evidence,governance,2026-06-12
```

### Dashboard_Source_Log

```csv
name,teacher,subject,class,count,score,status,drive_folder
Energy Resources Chapter Pack,Dr. Sarah Henderson,Science,Class VIII-A,6,92,approved,Academic Repository/Class VIII/A/Science/Ch01_Energy
Linear Equations Practice Set,Ms. Priya Nair,Mathematics,Class VIII-B,4,84,approved,Academic Repository/Class VIII/B/Mathematics/Linear Equations
Civics Remedial Map Set,Mr. Rahul Kapoor,Social Science,Class IX-C,1,58,needs_review,Academic Repository/Class IX/C/Social Science/Remedial
```

## Validation Checklist

- Use `Schooly_Dashboard_Source_SEEDED`; do not create `Schooly_Dashboard_Data_Source_SEEDED`.
- Use native Google Sheets URLs, not raw `.xlsx` uploads.
- Keep the folder under `00_School_Setup_and_Registries/05_Dashboard_Data`.
- Do not create `04_Classroom_and_Communication`, `01_Google_Drive_Live_Index`, or `03_Governance_and_Compliance` unless those already exist and are explicitly used.
- Dashboards must show visible missing, legacy, or wrong-source states instead of mock data.
