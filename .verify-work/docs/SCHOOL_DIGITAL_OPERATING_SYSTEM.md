# School Digital Operating System (SDOS) — Conceptual & Operational Guide

The School Digital Operating System (SDOS) is a highly standardized, enterprise-grade taxonomy and asset layout structure for K-12 educational systems. It solves the fragmentation of digital school records by separating static organizational knowledge, active daily teaching delivery, and administrative management oversight into distinct, structured logical domains.

---

## 1. The Three-World Architecture Model

The SDOS organizes institutional workflows into **Three Institutional Worlds** that segment users, access rights, and intent:

### 🌟 World 1: Academic Repository (Knowledge Base)
* **Audience**: School Administrators, Subject Matter Leads, Teachers, and Curriculum Planners (Academic Alignment).
* **Scope**: Serves as the school's central, immutable intellectual capital repository. It is structured rigidly by Academic Year, Stage, Class Level, Specific Sections, and Subjects.
* **Security & Perm borders**: Students are granted **absolute zero view, discover, or read access** under this folder hierarchy. This prevents exam leaks and lesson plan tampering, keeping educational blueprints completely separated from the student-facing delivery layer.
* **Layout Structure**: 
  - `Academic Repository` / `[Academic Year]` / `[Stage]` / `[Class]` / `[Class-Section]` / `[Subject]` / `[Artifact Folders]`
  - *Standard Artifacts*:
    - `01_Annual_Planning`: Long-term pacing guides and term objectives.
    - `02_Chapter_Resources`: Core teaching lessons, presentations, study notes, and diagnostic materials.
    - `03_Assessments`: High-stakes formative and summative tests.
    - `04_Projects`: Experiential learning schemas and task descriptions.
    - `05_Remedial`: Intervention resources for students requiring academic support.
    - `06_Enrichment`: Advanced resources and competition prep files (Olympiads).
    - `07_Teacher_Resources`: Grading guides, answer keys, and professional notes.

### 🌟 World 2: Google Classroom Templates (Teaching & Learning Delivery)
* **Audience**: Teachers and Students (Dynamic, active daily delivery).
* **Scope**: This is the live, transaction-based classroom delivery layer. It hosts student rosters, dynamic assignments, ongoing grades, and live communication channels.
* **Standardized Topics Conventions**: To prevent chaos and maintain automatic dashboard index syncing, teachers must use standard, pre-approved titles in their Google Classrooms rather than creating ad-hoc topics. Approved topics map to emojis like 📘, 📅, 📝, and 🎯.
* **Naming Conventions**: Automatically generated classes must match explicit formats: `[Academic Year] | Class [Name]-[Sec] | [Subject]` (e.g., `AY 2026-27 | Class X-A | English`).

### 🌟 World 3: School Governance (Monitoring & Leadership)
* **Audience**: Principal, Vice-Principal, Headmistress, Registrars, and Advisory Coordinators.
* **Scope**: Dedicated exclusively to administrative oversight, dashboard analytics ingestion, policy archives, board meeting logs, HR operations, and strategic plans.
* **Standard Artifacts**:
  - `01_Compliance`: Evidence logs and statutory reports.
  - `02_Academic_Audit`: Audited lesson planning status and feedback sheets.
  - `03_HR`: Teacher performance parameters and training files.
  - `04_Dashboard_Data`: Data streams and ledgers for structural monitoring.

---

## 2. Infrastructure Supporting Clusters

Beyond the three main domains, the SDOS deploys three operational supporting clusters:
1. **Forms Intake Pipeline**: Automated scripts scrape files submitted under custom administrative submission directories (`01_Weekly_Planner_Form`, `02_Notebook_Monitoring_Form`, etc.) to feed the live surveillance indicators inside World 3.
2. **Dashboard Data**: Buffer folders aggregating transient CSV lists from external Student Information Systems (SIS) like PowerSchool.
3. **Org Structure Unit**: Directory schema mappings modeling all staff structures, leadership branches, service account identities, department alias groups, and stage-specific teacher groups.

---

## 3. Invoking the Directory & Manifest Generator Script

A highly customizable, hardened PowerShell script is provided to instantly construct this full taxonomy inside a local sandbox (e.g., `C:\SchoolyTestDrive`) or target file server.

### 🛠️ Execution from PowerShell
Open an elevated PowerShell console and launch the generator:

#### Mode A: Default CBS Fallback Execution
Uses built-in CBSE curriculum stages (Pre-Primary, Primary, Middle, Secondary, Senior Secondary), five sections, and standard subjects:
```powershell
.\scripts\create-sdos-drive.ps1 `
  -Root "C:\SchoolyTestDrive" `
  -AcademicYear "AY 2026-27" `
  -WithSampleFiles
```

#### Mode B: Configuration-Driven Custom School Customization
Load custom setups for any private school, county, or district using a config-driven JSON schema override:
```powershell
.\scripts\create-sdos-drive.ps1 `
  -Root "C:\SchoolyTestDrive" `
  -ConfigPath ".\scripts\configs\school-config.cbse.sample.json" `
  -WithSampleFiles
```

### 💻 Execution from Windows Command Prompt (CMD)
If running inside localized Command Prompt environments, call the script bypassing execution policies safely:

```cmd
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\create-sdos-drive.ps1" -Root "C:\SchoolyTestDrive" -AcademicYear "AY 2026-27" -WithSampleFiles
```

With config paths:
```cmd
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\create-sdos-drive.ps1" -Root "C:\SchoolyTestDrive" -ConfigPath ".\scripts\configs\school-config.cbse.sample.json" -WithSampleFiles
```

---
*Created and compiled by Schooly AI Enterprise Systems Committee — 2026.*
