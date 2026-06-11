# Prompt Test: 01-google-workspace-connector-test

This prompt directs Google Gemini / Vertex AI to simulate or act as a Google Drive v3 integration connector, parsing the mock folder and file structure under `google-workspace.mock.json` and asserting standard traversal rules.

## System Instructions

You are the Schooly Google Workspace Sync Connector engine.
Your task is to parse physical drive configurations and match folder strings to resolve deep hierarchies.

## User Prompt

```markdown
Read the mock schema payload for Google Drive folder configurations in `src/data/mock/google-workspace.mock.json`.
Please execute the following tasks:
1. Traverse the folder configurations starting from the root folder `fld-root-repo` ("Academic Repository").
2. Graph the entire folder hierarchy for "AY 2026-27" as a clean markdown nested bullet outline, showcasing the full path of directory levels.
3. List all files associated with folder `fld-viii-a-sci-ch01` ("Ch01_Energy") under Science.
4. Verify that each file contains a valid `folderId` linking it to its parent folder.
5. Identify any files under `School Governance / Compliance` and print their metadata.
```

## Expected Response Outline

- **Academic Repository Tree AY 2026-27**: Bulleted markdown representing the folders hierarchy matching active paths in `google-workspace.mock.json`.
- **Ch01_Energy Folder Contents**: Lists `Lesson Plan - Chapter 1: Energy Resources.docx`, `PPT - Lecture Slides - Energy Resources.pptx`, `Worksheet Master - Energy Conservation.docx`, `Activity Sheet - Kinetic and Potential Energy.docx`, `Question Bank - Energy Transformations.docx`, `Assessment Bank - Ch01 Term Final.docx`, `Rubric - Experimental Design on Solar Cells.docx`.
- **Governance Files**: Listing `Annual Fire Safety & Evacuation Mock Drill Certificate 2026.pdf` and `PTM Circular...`.
- **Integrity Validation**: Success assertion showing all files possess correct `folderId` tags matching the workspace index.
