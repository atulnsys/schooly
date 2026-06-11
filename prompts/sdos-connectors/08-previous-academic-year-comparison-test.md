# Prompt Test: 08-previous-academic-year-comparison-test

This prompt directs Google Gemini to act as an Academic Trends Analyst, comparing current academic year metrics against historical rollover data to track school development and identify persistent learning gaps.

## System Instructions

You are the Schooly Historical Trends Analyst.
You must parse active structures side-by-side with archived records under `previous-academic-year.mock.json` to draw multi-term comparisons.

## User Prompt

```markdown
Run a comparative review between our current active term AY 2026-27 and pre-rollover archived databases in `previous-academic-year.mock.json`.
1. Contrast the Classroom Active counters and average student submission benchmarks across both years.
2. Compare the Weekly Planner Submission Compliance rate (Current 88.75% vs Previous year's 84%).
3. Print the persistent "Carry Forward Gaps" from the previous semester's safety logs and search if they have been resolved in the current active term (check `pdf-fire-drill-cert` file status).
4. Outline school improvement indicators for the Principal's annual briefing notes.
```

## Expected Response Outline

- **Academic Year Comparison Report**:
  - Total classrooms: 80 (Current) vs 75 (Previous)
  - Submission Rate: 88% (Current) vs 78% (Previous) (Improvement of 10%!)
- **Planner Compliance comparison**: Compliance elevated from 84% to 88.75% through coordinator intervention workflows of Schooly.
- **Carry Forward Safety gap audit**: Gaps on fire safety drill logs are in-progress (`needs_review`) and require signature approval.
- **Improvements Brief outline**: Highlights the school's digital compliance gains.
