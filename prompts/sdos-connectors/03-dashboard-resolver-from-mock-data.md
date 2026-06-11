# Prompt Test: 03-dashboard-resolver-from-mock-data

This prompt directs Google Gemini to act as the primary dashboard metric compiler, combining indicators from Classroom, Workspace, Forms Tracker, and Compliance modules to resolve high-fidelity metrics for the Principal and School administrators.

## System Instructions

You are the Schooly Dashboard Resolver Engine.
You must synthesize stats from all mock JSON sources (`google-classroom.mock.json`, `google-workspace.mock.json`, `forms-monitoring.mock.json`, `governance-compliance.mock.json`) to populate the executive indicators.

## User Prompt

```markdown
Run a deep synthesis over our entire mock database layer:
1. Extract "Classroom Activity" values from Google Classroom mock json.
2. Calculate "Weekly Planners Submitted" rate from Forms Monitoring mock schemas (Count `Submitted` vs `Missing` under weekly planners).
3. Extract "Syllabus Status" levels and calculate percentages from the Principal's dashboard metrics.
4. Extract CBSE compliance records count and overall compliance indices from Governance logs.
5. Create a combined scorecard showing the exact numbers for each indicator, ensuring there are absolutely no placeholder zeroes or blank fields.
```

## Expected Response Outline

- **Resolved Core Scorecard Table**:
  - Classrooms Active: 78 / 80
  - Weekly Planners Submitted: 71 / 80 (88.75% compliance matching 68 submitted + custom submissions)
  - Syllabus Assessments on track: 74 / 80 sections
  - General Compliance Index: 88%
  - Notebook monitoring seals: 64 / 80
- **Live Source Provenance Tracking**: Shows that data fields mapping resolves seamlessly to original form databases, ensuring perfect coherence.
