# 📁 Google Drive Templates & Dashboard KPI Matching Reference

Welcome to the **Schooly Google Workspace Template Suite**! 

If you connect your actual Google Workspace account (using the **Google SSO / Connect Workspace** tool in the sidebar), our server-side indexer pulls document metadata from your Google Drive (and directories within your configured folder) and parses them to populate the live dashboard KPIs in real-time.

To help you get started, we have provided detailed templates in this folder. You can use these layouts, headers, and schemas in your actual Google Drive spreadsheets and docs, or modify the local simulation registry files to see immediate test impacts!

---

## 🧭 Folder & Naming Hierarchy Guide (Best Practice)

For school-wide clean audits, organize your Google Drive with a structured nested path, such as:

```text
📁 My Drive (or Shared Department Drive)
 ┗ 📁 Science Department (Mapped via Folder URL)
    ┣ 📁 01_Syllabus_and_Pacing
    ┃  ┗ 📝 Science Grade 8 Section A Weekly pacing Planner.xlsx
    ┣ 📁 02_Chapter_Resources
    ┃  ┗ 📝 Grade 8 Science - Ch01_Energy_Resources_Lesson_Plan.docx
    ┣ 📁 03_Assessments_and_Rubrics
    ┃  ┗ 📝 Grade 8 Science Assessment Rubric 2025-2026.docx
    ┗ 📁 04_Notebook_Audit_Logs
       ┗ 📝 Class VIIIA Science Notebook Audit & Corrections Log.xlsx
```

---

## ⚡ The Smart Handshake: How Dashboard KPIs Work

The dashboard computes curriculum compliance KPI indicators using an automated matching algorithm. When examining files, it maps them to active **Google Classroom Courses** by checking two distinct criteria:

### 1. Document Target Category Detectors
The engine looks at the **File Name**, **Folder Path**, or **File Tags** to classify its operational category:

| KPI Category Checked | File Naming Substring Keywords | Associated File Tags |
| :--- | :--- | :--- |
| **Syllabus / Pacing Planners** | `planner`, `planning`, `pacing`, `syllabus` | `Syllabus`, `Planning`, `Weekly Planner` |
| **Academic Assessments** | `assessment`, `rubric`, `exam`, `quiz`, `test` | `Exam`, `Assessment`, `Rubric` |
| **Notebook Review & Corrections** | `notebook`, `correction`, `verification`, `audit` | `Notebook`, `Correction`, `Audit` |

### 2. Classroom Mappings (The Handshake)
To link a classified document to a specific Classroom Course (e.g., *Grade 8 Science* handled by *Dr. Sarah Henderson*), the file's accumulated text block (consisting of its `Name`, `Path`, `Owner`, and `Content Summary`) must match **any** of the following course-derived keywords:
* **Course Name**: e.g., `"grade 8 science"`, `"algebra"`, `"physics"`, `"literature"`
* **Course Section ID**: e.g., `"sectiona"`, `"sectionb-1"`, `"honorsclass"` (whitespace removed for fuzzy detection)
* **Teacher Last Name**: e.g., `"henderson"`, `"vance"`, `"montgomery"`

> **Example**: A file named `Section A Science Weekly Planner.xlsx` owned by `Dr. Sarah Henderson` satisfies both the **Pacing Planner** pattern and matches the keywords `"sectiona"`, `"science"`, and `"henderson"`. It instantly marks **"Planner Posted"** for Grade 8 Science on the dashboard!

---

## 🛠️ Testing Impact Offline (Local Simulator)

If you are running in the sandbox and want to adjust metadata, see new files count, change status scores, or toggle favorite flags inside this browser preview, you can also edit our in-memory local database!

1. Open `/src/data/mock/google-workspace.mock.json` in your file explorer.
2. Under the `"files"` array, you can add or edit document objects.
3. Keep the JSON structure valid:
   ```json
   {
     "id": "custom-user-spreadsheet-001",
     "name": "Class VIII-A Science Quiz & Test Pacing.xlsx",
     "mimeType": "application/vnd.google-apps.spreadsheet",
     "fileType": "sheet",
     "path": "Academic Repository / AY 2026-27 / Middle / Class VIII / Class VIII-A / Science / 03_Assessments / Class VIII-A Science Quiz & Test Pacing.xlsx",
     "folderId": "fld-viii-a-sci-resources",
     "source": "Google Drive",
     "academicYear": "AY 2026-27",
     "schoolArea": "Academic Repository",
     "stage": "Middle",
     "className": "Class VIII",
     "section": "A",
     "subject": "Science",
     "artifactType": "Assessment",
     "owner": "Dr. Sarah Henderson",
     "tags": ["exam", "assessment", "science", "quiz"],
     "access": {
       "visibility": "domain"
     }
   }
   ```
4. Save the file. Our hot reload compiler will automatically reinitialize and update the visual KPI indicators on your dashboard screen!

---

## 📋 Included Template Blueprints
Check the respective files inside `/google_drive_templates/` to view fully formatted mock data representing the files expected by school boards for compliance auditing:
1. `weekly_planner_monitoring_log_ay26_27.csv` — syllabus pacing master reference spreadsheet.
2. `grade_8_science_assessment_rubric.csv` — assessment criteria, grading key, and performance tiers.
3. `algebra_1_notebook_audit_corrections_log.csv` — notebook verification metrics and correction rates.
