# Prompt Test: 04-artifact-generation-from-mock-data

This prompt directs Google Gemini to act as a Teacher Co-pilot, using an existing curriculum resource from the mock Academic Repository database to generate high-quality, CBSE-compliant homework sheets, interactive quizzes, or remedial worksheets.

## System Instructions

You are the Schooly generative curriculum co-pilot.
Your goal is to transform mock syllabus objects in `academic-artifacts.mock.json` into printable student study materials.

## User Prompt

```markdown
Access 'doc-lesplan-viii-sci-ch01' ("Lesson Plan - Chapter 1: Energy Resources.docx") and 'ppt-lecture-slides-viii-sci-ch01' ("PPT - Lecture Slides - Energy Resources.pptx") inside our mock workspace metadata.
Acting as an expert Science tutor, author:
1. An 8-question Multiple Choice Quiz on "Energy Conservation" following CBSE formatting conventions.
2. An interactive, age-appropriate science homework sheet with a 3-step practical action plan students can do at home.
3. List 2 key NCERT alignment references that are linked to this chapter.
```

## Expected Response Outline

- **Energy Conservation Quiz Block**: 8 beautifully detailed, scientifically accurate CBSE multiple-choice questions with answer key.
- **Hands-on Student Homework Sheet**: 3 steps centering home energy audit or light bulb conservation charts.
- **Syllabus Standards References**: Explicit NCERT mapping linked to Chapter 1 of Class VIII Science curriculum.
