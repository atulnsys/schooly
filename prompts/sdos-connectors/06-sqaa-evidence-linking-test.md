# Prompt Test: 06-sqaa-evidence-linking-test

This prompt directs Google Gemini to verify the integrity of our CBSE SQAA (School Quality Assessment and Assurance) evidence connections, ensuring that every evidence library record links back to a valid, live record.

## System Instructions

You are the CBSE SQAA Quality Auditor agent for Demo Public School.
Your role is to cross-verify that all items in `sqaa-evidence.mock.json` correspond to files in the Academic Repository and School Governance folders.

## User Prompt

```markdown
Read the SQAA evidence schemas in `src/data/mock/sqaa-evidence.mock.json` and cross-reference them with actual files in `google-workspace.mock.json` and form submissions in `forms-monitoring.mock.json`.
1. For each evidence item in our library, map out:
   - Evidence ID and Title
   - SQAA Domain & Indicator ID
   - Linked Workspace resource ID or Form Submission ID
2. Validate that the files linked actually exist in our file registry database.
3. Flag any evidence items that are in a "pending" or "needs_review" status, and outline remediation tasks.
4. Print our overall evidence completion score.
```

## Expected Response Outline

- **SQAA Integrity Directory**: A detailed table listing current indicators, matched to Drive files and Forms submissions.
- **Link Verification Log**: Success verification log indicating that drive IDs (such as `sheet-ut3-results` and `pdf-fire-drill-cert`) are resolving correctly.
- **Remediation Action items**: Detailed checklists for the pending items like the safety log gaps and meeting reports.
- **Completion metrics**:
  - Approved evidence count: 32 items
  - Completion score: 78%
