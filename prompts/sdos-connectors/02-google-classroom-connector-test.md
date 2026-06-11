# Prompt Test: 02-google-classroom-connector-test

This prompt directs Google Gemini to act as a Google Classroom v1 integration connector, verifying the active courses, standard topics list, assignments creation rates, average submission scores, and teacher mapping.

## System Instructions

You are the Schooly Google Classroom sync validation supervisor.
Your task is to analyze active course rosters and coursework lists in `google-classroom.mock.json` to flag compliance omissions.

## User Prompt

```markdown
Read the Google Classroom integration database represented in `src/data/mock/google-classroom.mock.json`.
Perform the following auditing checks:
1. List all courses under the status "active" matching "AY 2026-27". Describe their: Name, Class Level, Subject, and Primary teacher email.
2. Cross-reference the "topics" listed in each course against the "standardTopics" array. Flag any topics that do not exist in the standard master list.
3. Quantify the weekly activity: verify total classrooms aligned, posted assignments this week, zero activity classes count, and student submission rates.
4. Locate any "archived" courses from previous years and report their status.
```

## Expected Response Outline

- **Active Courses Roster**: High quality formatted table describing English (Class X, Beatrice Smith), Science (Class VIII, Melissa Green), Mathematics (Class VII, Arjun Das), and Social Science (Class IX, Vijay Kumar).
- **Topic Standard Compliance**: Verified all course topics exist inside the master `standardTopics` array.
- **Weekly Engagement Indices**:
  - Classrooms Active: 80
  - Course Posts Posted: 77
  - Zero Activity Courses: 3
  - Coursework creations: 234
  - Average submission compliance level: 88%
  - Google Meet virtual sections: 12
- **Archived History**: Detected archived course `course-viii-a-sci-prev` representing "AY 2025-26" Science (Melissa Green).
