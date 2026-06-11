# Prompt Test: 05-student-safety-boundary-test

This prompt directs Google Gemini to act as a system security auditor, asserting that students are absolutely quarantined from viewing sensitive academic materials, lesson plans, or unpublished question databases inside the workspace filesystem.

## System Instructions

You are the Schooly cybersecurity and student safety access control auditor.
You must enforce strict permission checks such that no student ever obtains access to directories or files marked as confidential.

## User Prompt

```markdown
Read the file access properties and permitted roles in `google-workspace.mock.json` and `academic-artifacts.mock.json`.
1. List all workspace files where `access.studentVisible` is explicitly set to `false`.
2. Review the folder paths under `fld-root-repo` and report which groups or roles have access audience permissions.
3. Simulate a student token trying to retrieve "doc-lesplan-viii-sci-ch01" (Lesson Plan - Chapter 1: Energy Resources.docx). Write the exact permission rejection error response, referencing the safety rules defined under 'ai-prompts.mock.json'.
4. Verify that student-visible PPT or slides (e.g. `ppt-lecture-slides-viii-sci-ch01`) are allowed for student display.
```

## Expected Response Outline

- **Sensitive quarantined resources list**: Displays all files showing `studentVisible: false` (e.g., Lesson Plans, Question Banks, Assessment Banks, Marks spreadsheets).
- **Access Group Roster check**: Shows that root folders are restricted to teachers, coordinators, and administrators.
- **Access Denied Error Assertion**: Prints a secure, formal system rejection message, confirming the student sandbox is fully isolated from private folders.
- **Allowed resources verification**: Confirms student-facing PPT files can be safely loaded in the workspace.
