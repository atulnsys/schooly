# Role-Based Access Control (RBAC) & Navigation Mapping File

This document details the security access parameters, sidebar navigation configurations, and exact page components defined within the school application codebase.

---

## 1. Role-Based Sidebar Navigation Filtering

Access permissions to the platform’s tabs are filtered dynamically in `src/App.tsx` through `getNavigationItems()`. The sidebar menu items are configured under a set of default navigational options, pruned according to the active user's role.

### The Standard Navigation Options (Fully Accessible to Administrators)
1. **Cockpit Dashboard** (`overview`)
2. **Universal Search** (`search`)
3. **Classroom Sync** (`classroom`)
4. **Tasks & Productivity** (`tasks`)
5. **Co-Pilot Assistants** (`ai-assistant`)
6. **Rollover Wizard** (`rollover`)
7. **Governance & RBAC** (`governance`)

---

## 2. Dynamic Sidenav Visibility by Role

### 🛡️ App Admin / School Admin
* **Default Persona Email**: `academic.admin@school.org`
* **Access Scope**: Full administrative capabilities. Exposes all aspects of the application.
* **Sidenav Items Displayed**:
  - 🖥️ **Cockpit Dashboard** (Operations metrics, quick folder lists)
  - 🔍 **Universal Search** (Full document indexes & tagging controllers)
  - 🎓 **Classroom Sync** (Course syllabus sync & Grade status sheets)
  - 📋 **Tasks & Productivity** (Interactive operational Kanban boards)
  - ⚡ **Co-Pilot Assistants** (AI-powered curricular and workflow planners)
  - 🔄 **Rollover Wizard** (Process tracking for new academic year boundaries)
  - 🔑 **Governance & RBAC** (Immured logs repository & live tester role scopes)

### 🧑‍💼 Principal
* **Default Persona Email**: `torres.admin@school.org`
* **Access Scope**: Operational overview, risk assessment, task assignments, and curriculum outline design. Exclusion from direct SIS classroom registers or year-end rolling scripts.
* **Sidenav Items Displayed**:
  - 🖥️ **Cockpit Dashboard**
  - 🔍 **Universal Search**
  - 📋 **Tasks & Productivity**
  - ⚡ **Co-Pilot Assistants**

### 🗺️ School Coordinator
* **Default Persona Email**: `coord.planner@school.org`
* **Access Scope**: Multi-department operations, classroom synergetic reviews, co-pilot planning tools, and rolling configurations.
* **Sidenav Items Displayed**:
  - 🖥️ **Cockpit Dashboard**
  - 🔍 **Universal Search**
  - 🎓 **Classroom Sync**
  - 📋 **Tasks & Productivity**
  - ⚡ **Co-Pilot Assistants**
  - 🔄 **Rollover Wizard**

### 🍎 Teacher
* **Default Persona Email**: `s.henderson@school.org`
* **Access Scope**: Core instructional workflow view. Focus on direct classroom grades management, student behavior risk monitors, productivity tasks, and AI curricular outlining. No search indexing tools or system setup controls.
* **Sidenav Items Displayed**:
  - 🖥️ **Cockpit Dashboard**
  - 🎓 **Classroom Sync**
  - 📋 **Tasks & Productivity**
  - ⚡ **Co-Pilot Assistants**

### 🎓 Student
* **Default Persona Email**: `david.chen@school.org`
* **Access Scope**: Highly customized and protected learning dashboard. Focus purely on specific student operational timelines, pending assignment checkups, due dates, and learning tasks.
* **Sidenav Items Displayed**:
  - 🖥️ **Cockpit Dashboard**
  - 🎓 **Classroom Sync**
  - 📋 **Tasks & Productivity**

### 📁 Office Staff & Other Roles (Dynamic Fallback)
* **Access Scope**: If logged in under a third-party, custom unlisted role, or default personnel settings, the routing logic safely falls back to the master list (`defaultItems`).
* **Sidenav Items Displayed**:
  - 🖥️ **Cockpit Dashboard**
  - 🔍 **Universal Search**
  - 🎓 **Classroom Sync**
  - 📋 **Tasks & Productivity**
  - ⚡ **Co-Pilot Assistants**
  - 🔄 **Rollover Wizard**
  - 🔑 **Governance & RBAC**

---

## 3. Key Page Subsections and Features for Each Sidenav Item

Below is the list of functional features and components rendered respectively inside each active sidebar view context:

### 1. Cockpit Dashboard (`DashboardOverview.tsx`)
* **Overview Metrics Grid**: Real-time counter widgets for active classrooms, indexed files, operational tasks, and student enrollment profiles.
* **Favorite Workspace Materials**: Pinning station displaying marked Google Drive resources, policies, and rosters.
* **Recent Calendar Activity**: Standard agenda schedule for upcoming parent-teacher matches, orientation periods, and board evaluations.
* **AI Copilot Recommendation Engine**: Context-driven alert panel indicating potential actions or resource alignments based on current system risks.
* **SIS Student Risk Register Table**: Highly visual ledger identifying students flagged on academic indicators (low GPA, behavioral trends, syllabus disconnects) for proactive counseling.
* **SIS Course Syllabus & Roster Manager**: Tabbed course control sheets highlighting lesson-plan completion tracks, compliance, and student rosters.
* **System Integrations Tracker**: Diagnostic grid showcasing connection statuses for primary cloud storage routes, Google API interfaces, and system integrity timers.

### 2. Universal Search (`UniversalSearch.tsx`)
* **Workspace Folder Link**: Quick configuration deck to connect targeted Google Drive links, team sharing roots, or local backups.
* **Core Search Dashboard Filter Rules**: Interactive filter buttons allowing deep-indexing by source types (Drive, Team share, Local) and specialized resource tags (Syllabus, Policies, Rosters, Grades).
* **Workspace Inventory List**: Central document hub displaying search indicators, sharing states, size metrics, source metadata, and file taxonomy badges.
* **Context Sidebar Pane (Smart Inspector)**: Opens a details pane on document row click:
  * *Doc Info*: Direct details regarding file path, permissions, size, and type.
  * *AI Smart Summarizer*: Fully automated contextual breakdowns powered by Gemini algorithms.
  * *Contextual Q&A Interface*: Direct chat prompt for asking immediate operations inquiries using specific document text profiles.
  * *Interactive Metadata Editors*: Field controllers to dynamically override tags or star files into favorites.

### 3. Classroom Sync (`ClassroomManager.tsx`)
* **Course Selection Deck**: Left-pane sidebar highlighting individual synced classrooms (e.g. Science AP, Algebra Year 9) with sync action boundaries.
* **Classroom Assignments Dashboard**: Core checklist tracking individual deadlines, submission completion ratios, class average GPAs, and grading scales.
* **Class Materials Index**: Pinned reference attachments, core textbooks, lecture slides, and digital worksheets categorized by topic.
* **Synced SIS Pupil Roster**: Interactive grid tracking active students in the selected class, highlighting their current attendance status, homework completion rate, and sync validity.

### 4. Tasks & Productivity Board (`TaskProductivity.tsx`)
* **Progress Kanban Station**: Modular column lists dividing operational guidelines under `To Do`, `In Progress`, `Under Review`, and `Completed` statuses.
* **Interactive Task Cards**: Draggable item records detailing task priority tags (Urgent, Medium, Low), task details, target assignees, deadlines, and reference workspace files.
* **Task Allocation Module**: Overlay panel for creating tasks, establishing dates, allocating staff, and chaining Google Drive reference links.
* **Performance Counters**: Sub-header layout presenting total items, overdue tasks, completed tasks, and search filters.

### 5. Co-Pilot Assistants (`AIAssistants.tsx`)
* **Curriculum Co-Pilot (Lesson Planner)**:
  * *Setup options*: Select parameters (Subject, Duration lengths, Topic directives) and attach target syllabus folders or draft slides.
  * *AI Output Frame*: Generates highly structured, modular curricular maps, daily schedules, pacing guides, and model grading guides.
* **Automation Co-Pilot (NLP Rules Creator)**:
  * *Form field*: Text area enabling natural language typing (e.g., "When a syllabus is updated, create an urgent audit review task").
  * *Resource Pinning Table*: Embeds specific Workspace materials directly into the trigger prompt contextual environment.
  * *Generated Rule Blueprint*: Automatic translation of raw text statements into live automation cards featuring structured Triggers, Action nodes, and Target paths.
* **Active Operational Automations Grid**: Layout presenting active workflows, visual triggers to toggle rules, triggers counter, and rules garbage triggers.

### 6. Academic Rollover Wizard (`AcademicRollover.tsx`)
* **Rollout Step Tracker (5 Phases)**:
  * *Step 1: Prep & Target Year*: Configuration metrics for target year setting, checking data health checks.
  * *Step 2: Promotion Parameters*: Rules setting for student promotions (GPAs thresholds, automatic grade promotion triggers).
  * *Step 3: Course Archival Controls*: Settings for Google Classroom archival, backup directories creation, and master draft courses setup.
  * *Step 4: Roster Dry-Run Panel*: Action tests to verify student transitions, coordinator alignments, and record matches before writing database modifications.
  * *Step 5: Execute & Monitor*: Master initialization triggers featuring responsive live progress tracking dashboards.
* **Operations Logging Terminals**: Read-only real-time config logs.

### 7. Governance & RBAC Board (`SystemGovernance.tsx`)
* **Access Mode Switch Panel**: Active administrative playground to substitute roles matching App Admin, Principal, Coordinator, Teacher, and Student in real time to test layout rendering safety.
* **System Audit Log Ledger**: Immutable database visualizer documenting administrative milestones, user switches, automation triggers, system rollovers, and database operations.
