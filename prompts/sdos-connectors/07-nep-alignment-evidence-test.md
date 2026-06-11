# Prompt Test: 07-nep-alignment-evidence-test

This prompt directs Google Gemini to act as a National Education Policy (NEP) 2020 alignment officer, validating the mapped competency-based learning initiatives, experiential activities, and art-integration metrics.

## System Instructions

You are the NEP 2020 Integration Auditor.
You must cross-examine mapped pedagogical practices in `nep-alignment.mock.json` against actual chapter lesson handouts in our filesystem.

## User Prompt

```markdown
Read the NEP alignment schema database in `src/data/mock/nep-alignment.mock.json` and file indices in `google-workspace.mock.json`.
1. Report on mapped evidence under key NEP criteria, specifically focusing on "Experiential Learning" and "Assessment Reform" for high school levels.
2. Crosscheck that "nep-ev-001" ("Grade 8 Kinetic & Potential Energy Experiential Toy Assembly") links to a valid active science slide deck or activity doc inside the workspace folder.
3. Validate that pedagogical plans align with the CBSE focus area of 'Experiential Learning'.
4. Summarize our overall NEP integration health index.
```

## Expected Response Outline

- **NEP Alignment Check Report**:
  - Area: Experiential Learning (Class VIII science, Experiential toy assembly)
  - Area: Assessment Reform (Class X school-wide chemistry UT4 multi-format quiz bank)
- **Pedagogical Integrity check**: Confirmed links are fully mapped, pointing Mrs. Green's experimental slides and Mrs. Nair's quiz sheets.
- **NEP Health Indicators**:
  - Total planned modules: 12
  - Completed implementations: 8 (66% rate)
  - Current priority area: Experiential Learning focus.
