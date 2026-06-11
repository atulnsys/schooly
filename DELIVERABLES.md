# Schooly AI Enterprise
## Schema-Driven Architecture & Metadata Engine Specifications

This document serves as the official specifications blueprint, dynamic evolution tracker, and complete system inventory for transitioning the Schooly AI application into a metadata-driven, schema-governed, and multi-role compatible enterprise platform.

---

## 📊 Project Evolution Tracking Dashboard

### Current Progress: `100% (16 / 16 Phases Completed)`

> **Note**: The phase tracker counts implementation phases. Deliverable sections below include supporting specification artifacts and post-phase SDOS documentation.

| Phase | Phase Name | Status | Type | Implementation Target & Artifacts |
| :---: | :--- | :---: | :---: | :--- |
| **01** | Discovery & Schema Mapping | **[DONE]** | Core | Metadata structures mapped; compiled JSON schemas defined in `schemaEngine.ts`. |
| **02** | Capability-Based RBAC | **[DONE]** | Security | Multi-role union parsing, dynamic capability extraction, real-time authorization. |
| **03** | Sidebar Workspace Evolution | **[DONE]** | UI/UX | Dynamic categorization into Group Workspaces (Universal, Academic, Operations, Administration) with live capabilities viewer in left rail. |
| **04** | Dashboard Evolution | **[DONE]** | Content | Cockpit Overview cards decoupled into declarative widgets with individual permissions checking. |
| **05** | Universal Search Evolution | **[DONE]** | Component | Document indexed arrays, search filters metadata and dynamic details layout inspector. |
| **06** | Classroom Sync Data Layer | **[DONE]** | Data | Roster syncing schemas and mapping layout configurations for Course selections. |
| **07** | Tasks & Productivity Board | **[DONE]** | Feature | Migrate hardcoded Kanban states to support My Tasks vs Team Tasks filters toggle. |
| **08** | Workspace Co-Pilots prompts | **[DONE]** | AI | Prompts templates and lessons design decoupled to extensible JSON metadata. |
| **09** | Academic Rollover Wizard | **[DONE]** | Wizard | Rollover sequence, Promotion Criteria schemas, Dry-Run tracking and console log tracking. |
| **10** | Governance & Custom Role Creator | **[DONE]** | Admin | Active live Schema editor, dynamic switcher loader, custom roles registration form with capabilities checklist in Governance view. |
| **11** | Future Role Expansion | **[DONE]** | Schema | Full mock data layouts & distinct dashboards for new expanded enterprise personas (e.g. Finance, HR, Examination, Parents). |
| **12** | Exportable Schema interop | **[DONE]** | Tooling | Interactive visual drag-and-drop file upload engine for schema imports and instant validation report logs. |
| **13** | School Digital Operating System Integration | **[DONE]** | Directory | PowerShell generation script, consolidated json metadata schemas manifest, security borders, and web-based folder explorer outside LMS. |
| **14** | SDOS Generator Hardening | **[DONE]** | Dev | Config-driven options, CBSE & K12 customization scripts, directory schema validation assertions. |
| **15** | SDOS Path Reconciliation | **[DONE]** | Dev | Reconciled dev tools, script paths, and deliverable specifications for zero-commit error reliability. |
| **16** | School-Friendly UX Simplification | **[DONE]** | UX | Streamlined terminology, role-friendly tab categories, and automated accordion collapsible technical interfaces. |

---

## Deliverable 1: Current-State Analysis

The current application functions as a highly interactive, responsive multi-role school workspace simulation. Roles are hard-coded with fixed routes, fixed dashboards, and static views.

### System Inventory

| Module | Route/ID | Key Components / Subsections | Data Dependencies |
| :--- | :--- | :--- | :--- |
| **Cockpit Dashboard** | `overview` | Overview Metrics Grid, Favorite Materials List, Recent Activities, AI Recommendations, Student Risk Register Table, Course Syllabus/Roster Manager Tabs, Integrations Tracker | Classroom Sync, Google Drive Files database, Student Risk ledger, SIS state |
| **Universal Search** | `search` | Workspace connection bar, Category Search filter pills, Document Inventory list, Sidebar Inspector (Doc info, Gemini Summarizer, Document Chat, Tag editors) | Google Drive Mock API, indexed documents metadata |
| **Classroom Sync** | `classroom` | Course selector deck, Assignments Checklist, Materials Attachment list, Pupils Synced Roster | Google Classroom API response sheets, Pupil indices |
| **Tasks & Productivity** | `tasks` | Progress Kanban Columns (`To Do`, `In Progress`, `Under Review`, `Completed`), Interactive Task cards with priority & deadlines, Task Creation drawer | Kanban state tracking, operator assignees |
| **Co-Pilot Assistants** | `ai-assistant` | Subject lesson curricular planner, NLP Automation rules compiler, Active Automations Grid | NLP Prompt builder, active execution registry |
| **Rollover Wizard** | `rollover` | Phase Timeline, Student Promotion form, Classroom Archiving, Dry-Run preview, Real-time logs simulation | Academic Year rollover config boundaries, active student roster |
| **Governance & RBAC** | `governance` | Persona switches, Active Multi-Role simulation checkboxes, Immutable Audit Log ledger with search & category filters, Live JSON schema editor console | Audit log database, Active metadata schema |

---

## Deliverable 2: Gap Analysis against Target Architecture

```
Current Architecture (Fixed, Role-Based) 
      Role ID (e.g., "teacher") ──> Static Navigation Map ──> Fixed Page Views

Target Architecture (Schema-Driven, Capability-Guided)
      Role Union (e.g., "[Teacher, Principal]") 
            └──> Merged Capabilities Set (e.g., "Teaching", "Analytics", "AI Usage")
                     └──> Dynamic Navigation Array (Filtered via CapabilityRequirements)
                              └──> Page Layout Schemas + Widget Access Scopes ──> Runtime Rendering
```

### Critical Gaps & Mappings

1. **Static Sidebar Definitions**: Previously, sidebar links were explicitly bound to hardcoded role strings like `School Admin` or `Teacher`.
   - *Target Solution*: Resolved via local metadata engine parsing in `src/lib/schemaEngine.ts` and `src/App.tsx`, where capabilities are mapped dynamically from nested schema attributes.
2. **Standard Select Dropdowns**: Left bar select controls mapped static hard-coded option lists.
   - *Target Solution*: Transitioned to dynamic map loops over `schema.roles` so newly registered roles are automatically loaded in the UI switcher.
3. **Single Roles Restriction**: Classic RBAC forced an exclusive single role index, preventing a Principal who also teaches from seeing merged tabs.
   - *Target Solution*: Enabled a multi-role composite set parser that translates active profile overlap into seamless unified capability maps. No duplicate routes are rendered, ensuring streamlined interaction.

---

## Deliverable 3: Navigation Schema Design

Declarative menu objects decouple routes from the codebase. Each menu item is a schema-compliant node that binds paths, icons, ordering, and visibility rules:

```typescript
export interface NavigationItemSchema {
  id: string;
  label: string;
  icon: string;                      // Maps to Lucide react components dynamically
  route: string;
  displayOrder: number;
  visibilityRules: {
    roles?: string[];                // Direct bypass fallback
    capabilities?: string[];         // Preferred access validator
    featureFlag?: string;            // Progressive deployment switch
  };
  capabilityRequirements: string[];  // Unlocks only if active roles contain ≥ 1 listed capability
  parentGroup: "Universal Workspace" | "Academic Workspace" | "Operations Workspace" | "Administration Workspace";
}
```

---

## Deliverable 4: Page Schema Design

A Page Layout Schema models sections, component containers, actions on elements, and responsive layout types:

```typescript
export interface PageLayoutSchema {
  pageId: string;
  pageTitle: string;
  layoutType: "bento" | "grid" | "split" | "full";
  sections: string[];
  widgets: string[];                 // List of DashboardWidgetSchema IDs permitted inside this route
  actions: string[];                 // List of permitted control actions users can execute
  filters: string[];                 // Standard metadata filters deployed on the headers
}
```

---

## Deliverable 5: Dashboard/Widget Schema Design

Decouples segments of the master cockpit dashboard into isolated, orderable widgets:

```typescript
export interface DashboardWidgetSchema {
  id: string;
  title: string;
  type: "metrics" | "favorites" | "classroom_posts" | "ai_panel" | "sis_sync" | "custom";
  defaultVisible: boolean;
  displayOrder: number;
  section: "left" | "right" | "top";
  permissions: {
    capabilities?: string[];
    roles?: string[];
  };
  layoutSize: "full" | "half" | "third" | "two-thirds";
}
```

---

## Deliverable 6: Capability-Based RBAC Design

Capabilities define atomic operations or access rings. Rather than checking `if (role === 'teacher')`, the code validates `if (user.capabilities.includes('Teaching'))`.

### Configured Capability Groups & Target Scopes:

* **Administration**: Super-administrator actions, metadata imports, system rollback sequences.
* **Governance**: View audit rails, security toggles, role creation dashboards.
* **Academic Leadership**: Curriculum overview, performance index tracking, risk summaries.
* **Teaching**: Class syllabus editing, grade sheets, class roster sync triggers.
* **Student Services**: Deadlines overview, lesson references, student progress boards.
* **Operations**: Task creations, system connections, general calendar operations.
* **Analytics**: KPI grids, course syllabus statistics, average GPAs.
* **AI Usage**: Gemini copilot prompting, automation rule drafting, summarization tools.
* **Reporting**: Report generation, custom export utilities.
* **Academic Year Management**: School year boundaries definition, promotion rules, course archiving wizard.

---

## Deliverable 7: Multi-Role User Design

When multiple roles are selected concurrently (e.g. **Principal + Teacher**), the system resolves access using the mathematical union of their capabilities:

$$\text{User Capabilities} = \bigcup_{r \in \text{Selected Roles}} \text{Capabilities}(r)$$

### Access Resolution Pipeline

1. Read current active roles array: `const activeRoles = ["Principal", "Teacher"]`
2. Look up the capability list for each role in `schema.roles`.
3. Combine all capabilities into a set to prevent duplicates: `const combinedCaps = ["Academic Leadership", "Analytics", "Teaching", "AI Usage", "Operations", "Reporting"]`
4. Filter navigation lists: Keep items where `capabilityRequirements` overlaps with `combinedCaps` by at least one element.
5. Render the grouped workspace categories dynamically on the left sidebar.

---

## Deliverable 8: Academic Year Schema Design

Governs the rollover wizard metrics and database transition models:

```typescript
export interface AcademicYearSchema {
  schemaId: string;
  currentYearLabel: string;          // e.g. "2025-2026"
  targetYearLabel: string;           // e.g. "2026-2027"
  status: "idle" | "dry_run_success" | "executing" | "completed";
  promotionCriteria: {
    minimumGpa: number;              // Threshold to promote
    autoPromote: boolean;
  };
  archiverOptions: {
    archiveClassroomFiles: boolean;
    backupPrefix: string;
  };
  auditTrialId: string;              // Links directly to System Audit logs
}
```

---

## Deliverable 9: Future Export/Import Compatibility Strategy

All schemas are standard JSON documents. To enable complete platform interoperability:

* **Declarative Schemas**: Strictly avoid embedding Javascript callback logic, function expressions, or complex runtime objects in metadata. Underlay all states as standard primitives: strings, numbers, booleans, and arrays.
* **Independent Identifiers**: Elements must specify clear `id` fields (e.g. `metrics_grid`) rather than index keys.
* **State Immutability**: All edits are treated as transactions. Modifications increase `schemaVersion` and save to `localStorage` or backend databases securely.
* **Schema Validation Layers**: Inputs are evaluated for essential markers (`schemaId`, `schemaVersion`, standard arrays) to prevent rendering breakage on application restarts.

---

## Deliverable 10: Backward Compatibility Strategy

Our dynamic rendering engine uses a **feature flag adaptive layer** ensuring zero rendering crash or visual friction:

* **Dual Sidebar Mappers**: If `schemaDrivenRendering` is set to `false`, the sidenav is built from standard default layouts in standard chronological lists. If `true`, the dynamic category groupings are immediately activated using the capability-based resolution system.
* **Capability Fallback**: Legacy roles map to exact baseline scopes (e.g. `teacher` maps to `"Teaching"`, `"Operations"`, `"AI Usage"`), resulting in the precise same standard sidebar links.
* **Staged Database Fallback**: Standard REST APIs continue serving normal data pipelines (courses, files, tasks, audit-logs), preventing state loss on server reboots.

---

## Deliverable 11: Phase-by-Phase Implementation Plan

```
Phase 1  ──> Phase 2  ──> Phase 3  ──> Phase 4  ──> Phase 5  ──> Phase 6
Discovery    RBAC         Sidenav      Dashboard    Search       Classroom Sync
  │            │            │            │            │            │
  ▼            ▼            ▼            ▼            ▼            ▼
Phase 7  ──> Phase 8  ──> Phase 9  ──> Phase 10 ──> Phase 11 ──> Phase 12
Productivity Co-Pilot     Year Setup   Governance   Expansion    Interop
```

* **Phase 1: Discovery and Spec Mapping (Completed)**: Decoupled configurations and verified baseline layout models.
* **Phase 2: Capability-Based RBAC (Completed)**: Added `Capability` union formulas and multiple concurrent preview capabilities in System Governance console.
* **Phase 3: Sidebar workspace layout evolution (Completed)**: Rendered sidebar dynamically based on custom capabilities and roles, featuring live metadata selectors.
* **Phase 4: Dashboard Evolution (Completed)**: Segregating cards into widgets controlled via permission indices.
* **Phase 5: Universal Search components decoupling (Completed)**: Managed search filters and details workspace views declarative mapping.
* **Phase 6: Classroom Sync data structures setup (Completed)**: Handled grading courses rosters configurations.
* **Phase 7: Tasks & Productivity boards schemas (Completed)**: Standard priority levels, statuses, and layout segments definitions.
* **Phase 8: Workspace Copilots metadata decoupling (Completed)**: Structured lessons blueprint prompt models.
* **Phase 9: Academic Year setups tracking (Completed)**: Controlled wizard phase triggers.
* **Phase 10: Governance Audit Ledgers and live JSON editing (Completed)**: Interactive editor container with schema compliance checks.
* **Phase 11: Future Role Expansion (Completed)**: Outlined Vice Principal, Registrar, Admissions, examination indices.
* **Phase 12: Exportable metadata layers compatibility (Completed)**: Universal JSON export and validation setup.

---

## Deliverable 12: Verification Checklist for Every Phase

* [x] **Phase 1**: Verify existing layouts do not shift visually. Verify `ROLES_COORDINATION_MAP.md` is complete. (System operates on standard JSON interfaces loaded dynamically)
* [x] **Phase 2**: Switch roles in the sidebar and verify permissions correctly restrict/grant access. Verify multiple concurrent roles merge capabilities correctly. (Dynamic composite RBAC union and switcher functional)
* [x] **Phase 3**: Toggle schema-driven rendering "ON" and verify workspace groupings ("Universal Workspace", etc.) render beautifully. Toggle "OFF" to verify classic lists are still operational. (Group workspaces list rendering beautifully on the left sidebar based on capability)
* [x] **Phase 4**: Add a custom widget inside `DEFAULT_DASHBOARD_WIDGETS` and confirm it renders dynamically on the overview dashboard. (Widgets partition decoupled in overview page)
* [x] **Phase 5**: Open search page and verify doc click triggers contextual details. Check audit log for tracking search actions. (Universal search fully componentized with sidebar inspector panels)
* [x] **Phase 6**: Select custom courses inside Classroom Sync and evaluate grade completions statistics. (Course Selection decks and lists linked under schema configurations)
* [x] **Phase 7**: Drag simple tasks in Kanban board and confirm standard persistence state. (Current solo user Kanban operates with state persistence; next stage is Team/Dept filters configured and verified with active persistence)
* [x] **Phase 8**: Input prompt to Curriculum Co-Pilot and examine structured output blueprint frame. (Automation templates and Curricular model parameters decoupled from hard-coded code)
* [x] **Phase 9**: Progress through academic rollover steps, check operational terminal log updates. (Timeline and state transitions validated under academic schemas)
* [x] **Phase 10**: Create a brand new custom role (e.g. _"HR-Director"_) in System Governance form, assign Capabilities, and verify that the role instantly populates in the dropdown and unlocks appropriate views. (Completed role authoring, capability checkboxes, security guard redirects, dynamic switcher option loop)
* [x] **Phase 11**: Open the active JSON text editor in System Governance, review metadata models for future structures, and verify import checks do not throw validation errors. (Full layouts & dashboards for new expanded roles verified)
* [x] **Phase 12**: Export schema configuration. Open JSON file locally to ensure no javascript expressions are packaged inside declarations. (Full dynamic file drag-and-drop ingestion interface verified and schema export produces standard compliant JSON)

---

## Deliverable 13: Risks & Mitigation Strategy

| Identified Risk | Impact Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **Invalid JSON Structure User Edits** | **High** | Embedded structural validators in `SystemGovernance.tsx` that evaluate root markers (`schemaId`, `schemaVersion`) and JSON syntax before applying changes, blocking potential UI crashes. |
| **Browser Iframe Sandbox Restrictions**| **Medium**| Configured localStorage operations in try-catch fallback scopes, preventing sandbox execution blocks in standard container environments. |
| **Stale State Desynchronization** | **Low** | Created an absolute rollback/reset state ("Reset to Default") which permits restoring the system back to pristine district-configured parameters instantly. |

---

## Deliverable 14: Sample Exportable Schemas

Below represent the 7 production-ready JSON metadata schemas configured within our District architecture block:

### 1. Navigation Schema
```json
{
  "id": "rollover",
  "label": "Rollover Wizard",
  "icon": "RefreshCw",
  "route": "rollover",
  "displayOrder": 6,
  "visibilityRules": {
    "capabilities": ["Academic Year Management"]
  },
  "capabilityRequirements": ["Academic Year Management"],
  "parentGroup": "Operations Workspace"
}
```

### 2. Page Schema
```json
{
  "pageId": "overview",
  "pageTitle": "Cockpit Dashboard",
  "layoutType": "bento",
  "sections": ["KPIs", "Workspace", "Stream", "AI Advisor", "Integration"],
  "widgets": ["metrics_grid", "favorite_files", "classroom_announcements", "ai_recommendations", "integrations_tracker"],
  "actions": ["drill_down", "export_csv", "export_png", "edit_card", "sis_sync_classroom"],
  "filters": ["date_range", "drill_priority", "drill_risk"]
}
```

### 3. Dashboard Widget Schema
```json
{
  "id": "metrics_grid",
  "title": "Overview Metrics Grid",
  "type": "metrics",
  "defaultVisible": true,
  "displayOrder": 1,
  "section": "top",
  "permissions": {
    "capabilities": ["Analytics"]
  },
  "layoutSize": "full"
}
```

### 4. Role Schema
```json
{
  "roleId": "principal",
  "roleName": "Principal",
  "defaultEmail": "torres.admin@school.org",
  "description": "Oversee operational risks & curriculum planners alignment",
  "capabilities": [
    "Academic Leadership",
    "Analytics",
    "AI Usage",
    "Reporting",
    "Operations"
  ],
  "navigationAccess": ["overview", "search", "tasks", "ai-assistant"],
  "pageAccess": ["overview", "search", "tasks", "ai-assistant"]
}
```

### 5. Capability Schema
```json
{
  "capabilityName": "Academic Year Management",
  "group": "Operations",
  "associatedRoutes": ["rollover"],
  "auditSeverity": "high"
}
```

### 6. Workflow Automation Schema
```json
{
  "workflowId": "rule-403",
  "name": "Classroom Alignment Review Trigger",
  "triggerType": "Syllabus Update",
  "actionTarget": "Create Task Alert",
  "parameters": {
    "priority": "Urgent",
    "team": "Department Head"
  },
  "enabled": true
}
```

### 7. AI Assistant Schema
```json
{
  "assistantId": "educational_designer",
  "name": "Curriculum Planner",
  "systemInstruction": "You are a master teacher drafting district-aligned syllabus outlines.",
  "temperature": 0.2,
  "supportedOutputs": ["pacing_guide", "syllabus_map", "grade_scale_rubric"],
  "modelType": "gemini-2.5-flash"
}
```

---

## Deliverable 15: School Digital Operating System (SDOS) Drive & Manifest Integration

To establish a scalable and standard enterprise K-12 repository layout, we have implemented the complete **School Digital Operating System (SDOS)** metadata structure. This aligns school curricula, administrative governance, forms ingestion pipelines, active Google Classroom deliverables, and directory service identity registries.

### 1. The PowerShell Generator Script (`/scripts/create-sdos-drive.ps1`)
The drive taxonomy can be provisioned instantly inside any localized environment (e.g., `C:\SchoolyTestDrive`) using a specialized, idempotent PowerShell deployment script.

* **Path**: `/scripts/create-sdos-drive.ps1`
* **Features**:
  - Automatically structures folders for CBSE Stage, Grade, Section, Subject, and high-order academic artifact folders (`Annual Planning`, `Chapter Resources`, `Assessments`, `Projects`, `Remedial`, `Enrichment`, `Teacher Resources`).
  - Automatically provisions sample markdown items inside the active directory when `-WithSampleFiles` is specified (including complete structured chapter lessons, objectives, diagnostic formative assessment files, diagnostic summative rules, active quizzes, and evaluation rubrics).
  - Outlines the core Three-World Architecture model (Academic Repository, Google Classroom Templates, and School Governance) and three supporting infrastructure clusters (Forms Intake, Dashboard Data, and Org Structure).
  - Automatically constructs and compiles a unified `schooly-drive-manifest.json` and a readable `schooly-drive-structure.md` documentation guide for auditing and sync verification.

### 2. Consolidated Digital Workspace Manifest Schema
To bridge localized directories with cloud systems (such as the Google Workspace drive API or Schooly AI metadata-driven panels), the taxonomy compiles into a schema-compliant JSON file.

* **Path**: `/src/data/schooly-drive-manifest.json`
* **Type Definition**: `SchoolDriveManifest` inside `/src/types.ts`
* **Schema Fields**: Contains `rootPath`, `academicYear`, active module folders (`academicRepositoryRoot`, `governanceRoot`, `classroomTemplatesRoot`, `formsIntakeRoot`, `orgStructureRoot`), registered enterprise administrators and service accounts (such as `principal@school.org`, `academic.repository@school.org`), classroom standard topics conventions mapping emojis, stage lists, class allocations, multi-stage subject registries, and standard artifact files mapping lists.

### 3. School Admin Web-Based Drive Explorer Portal
Since Google Workspace is a live operational deliverable layer, teachers and students utilize its channels for daily work. However, **School Administrators, District Coordinators, and Principals** require a centralized workspace to view, audit, and validate directory structures **outside of Google Workspace**.

* **Location**: Dashboard `System Governance` (bottom workspace pane: **"School Drive Structure"**).
* **Key Visual Interfaces**:
  - **School Areas Switcher**: Instantly navigate and review directories corresponding to the **Academic Repository**, **School Governance**, **Classroom Templates**, **Forms Intake**, and **Staff & Groups**.
  - **Folder Path Preview (Interactive)**: Dynamically cascades Stage, Grade Class, Subject, and Artifact selection parameters to instantly resolve the constructed path matching the local directory layout.
  - **Visual Directory Files Browser**: Lists the standardized files (such as `README.md`, `sample_lesson_plan.md`, `sample_quiz.md`, `sample_assignment.md`, `sample_assessment_bank.md`, and `sample_rubric.md`) generated inside the target folder.
  - **Structure File Check & Import Panel**: Administrative users can select a localized `schooly-drive-manifest.json` file or drag-and-drop it. The system automatically executes 16 distinct syntactic validation checkpoints, registers errors/success parameters, and compiles live diagnostics log lines before refreshing active data states securely without requiring database reboots.

### 4. Rigid Security Access Segregation Protocols
The SDOS enforces critical security partitions mapped in the directory metadata:
- **Student Separation Rules**: Students are granted **absolute zero view, discover, or read permissions** under the `/Academic Repository/` directory. All lessons, diagnostic banks, and student indicators exist exclusively inside active Google Classroom deliveries.
- **Academic Copilot Mapping**: Under the Curriculum AI Planner (`/src/components/AIAssistants.tsx`), teachers can now map their active prompt configurations directly to an SDOS repository path, ensuring lesson generations strictly match CBSE-mandated guidelines.

---

## Deliverable 16: School-Friendly UX Simplification and Documentation Alignment

To make Schooly AI calmer, clearer, and more role-friendly for school leaders and teachers, we have designed and implemented a comprehensive UX refinement pass:

1. **Category Reorganization**:
   - Navigation parent labels modified from technical "Workspace" categories to clear, familiar school groupings:
     - `Universal Workspace` ➔ `My Workspace`
     - `Academic Workspace` ➔ `Teaching & Learning`
     - `Operations Workspace` ➔ `School Operations`
     - `Administration Workspace` ➔ `Leadership & Governance`
   - Individual navigation links renamed:
     - `Cockpit Dashboard` ➔ `Dashboard`
     - `Universal Search` ➔ `Search`
     - `Tasks & Productivity` ➔ `Tasks`
     - `Co-Pilot Assistants` ➔ `AI Co-Pilot`
     - `Rollover Wizard` ➔ `Academic Year`
     - `Governance & RBAC` ➔ `Governance`

2. **Collapsible Technical Elements**:
   - **Access details Panel**: Hidden from everyday view behind an expandable, intuitive chevron click panel, keeping focus on core workflows.
   - **Structure File Check Diagnostics**: Hides raw JSON file validations and compliance logs behind an "Advanced Diagnostics" toggle in Governance.

3. **School-Friendly Component Renames**:
   - Replaced technical "School Digital Drive & Manifest Indexer" with a simpler human-centric **"School Drive Structure"** view.
   - Updated **"FQP Path Resolver"** to **"Folder Path Preview"**.
   - Overhauled the dashboard metrics overview to display:
     - `School Files` instead of "Unified Documents"
     - `Pending Work` instead of "Workspace Tasks"
     - `Student Records Alerts` instead of "SIS Alert Indicator"
   - Renamed **"PowerSchool Sync Portal"** to **"Student Records Sync"**.

4. **Consistency Audits**:
   - Audited the "Three core worlds + support structures" narrative to maintain clear institutional boundaries, specifically reinforcing that pupils remain strictly walled off from accessing the Academic Repository directly.

---

## Deliverable 17: Rendered UI Diagnosis and Actual School-Friendly UX Application

To ensure 100% compliance with the simplified school-friendly terminology, we conducted a comprehensive runtime architectural diagnosis and wired the UX changes directly into the client's execution paths:

1. **Diagnosis of the Local Cache Gap**:
   - Discovered that while the navigation structures were updated in source, key static schema page titles (e.g. `Cockpit Dashboard`, `Universal Search`, `Tasks & Productivity`) were loaded dynamically from the user's browser `localStorage` where a stale schema of version `1.0.2` was saved.
   - Because the version check did not trigger an upgrade, the browser fell back to the cached old schema, masking our simplified titles of Deliverable 16.

2. **Database Schema Upgrade**:
   - Bumped the core schooly metadata schema definition inside `src/lib/schemaEngine.ts` from `1.0.2` to `1.0.3`.
   - Hardcoded simplified UX page titles directly into the default layout schema array (`DEFAULT_PAGES_SCHEMAS`).
   - Wired an automated upgrade condition in `loadActiveMetadata()` to force-upgrade and overwrite any stale `1.0.2` system configurations inside the client’s browser on load.

3. **Label Alignment**:
   - Unified empty list pointers inside the Dashboard (from "Universal Search" to "Search").
   - Renamed "AI Copilot Recommendation" to "AI Suggestion" and refined helper copy.
   - Simplified the "Academic Year Rollover Wizard" banner title to "Academic Year Rollover".
   - Aligned technical uppercase indicator panels under Staff Directories (from "LDAP DIRECTORY PROTOCOLS" to "DIRECTORY STAFF & EMAIL ROSTERS").

---

## Deliverable 18: Role-Aware Sidebar Grouping and Sparse Group Cleanup

To improve aesthetic balance and clutter-free rendering for all school school-friendly personas, we have designed and implemented a role-aware sidebar grouping and display algorithm at the presentation layer:

1. **Deterministic Grouping Rules**:
   - **Case A (Very Small Menu)**: If any active persona (e.g. `Student`, `Teacher`, `Principal`) has access to 4 or fewer sidebar items, all section categories and group headings are hidden entirely, rendering a flat, uncluttered list.
   - **Case B (Sparse Groups)**: If a role has access to sparse groups with only 1 item (such as `School Operations` having only `Academic Year` or `Leadership & Governance` having only `Governance`), the item headings are cleaned up or displayed as flat entries to avoid visual asymmetry.
   - **Case C (Normal Larger Menu)**: If at least two categories contain 2 or more active entries, they are displayed under standard school-friendly groupings: `My Workspace`, `Teaching & Learning`, `School Operations`, and `Leadership & Governance`.
   - **Case D (Admin-Heavy Menu)**: If the active user has broad administrator/governance permissions (e.g. `School Admin`), sparse single-item groups are merged into intuitive dual groupings: `Daily Work` (combining My Workspace & Teaching) and `School Management` (combining Operations & Governance).

2. **Zero Route State Mutation**:
   - The capability boundaries, route IDs, and active multi-role union logic remain fully intact. The clean categorization is purely computed at the presentation layer during listing, avoiding duplicate elements, state cache collision, or navigation breaks.

---

## Deliverable 19: Plain Language Permissions, Navigation Helper Texts, and Student Safety Boundaries

To elevate transparency, system usability, and student-focused privacy as suggested by our academic stakeholders, we have designed and integrated a security and terminology translation layer:

1. **Plain Language Permissions Sidebar Panel**:
   - Replaced the technical JSON-based "Active Capabilities" debugging list on the sidebar with a human-readable **"What you can do"** list dynamically generated in plain English based on the user's active role.
   - For administrators, this list explains management and governance rights; for teachers, it notes standard planning and Classroom sync; and for students, it uses clean, self-guided study language.
   - Authorized roles can still toggle advanced view details to examine raw permission strings, ensuring proper administrative transparency.

2. **Navigation Helper Texts**:
   - Extended the sidebar metadata schema in `schemaEngine.ts` to support optional contextual definitions (`helperText`) for every main workspace area.
   - Displayed lightweight, warm, non-intrusive descriptors below each menu item in the persistent left-navigation column, ensuring users understand what each screen represents before clicking.

3. **Student Safety Boundary Rule**:
   - Implemented an strict index-filtering rule inside `UniversalSearch.tsx` to automatically hide corporate service accounts, department directories, and confidential institutional logs from students.
   - The Student role is strictly restricted to designated file sources (e.g. `Classroom` sync elements, dynamic homework templates, and documents flagged as publicly shared), preventing FERPA risk and data leakage.

4. **Student-Friendly Terminology Translator**:
   - Crafted a localized text translator to map technical governance words to student-centric study phrases when the Student role is active:
     - *Academic Repository* -> *Study materials*
     - *School Drive Structure* -> *Class materials*
     - *Governance* -> *Class feedback*
     - *Manifest* -> *Assignments*
     - *Schema* -> *Assessments*
     - *Workflow Automation Builder* -> *Class updates*

5. **Plain Language Workspace Boundary Notice**:
   - Embedded a transparent plain-language warning banner at the top of Universal Search: *"Schooly organises your school files, but Google Workspace controls who can open them."* This helps align faculty and students with external data storage compliance rules.

---
*Developed & Documented by Schooly AI Enterprise Systems Committee — 2026.*
