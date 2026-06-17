/**
 * Schooly AI - Schema-Driven Architecture & Metadata Engine
 * This script serves as the sole declarative interface to govern roles, capabilities,
 * navigation routes, dynamic dashboard dashboard widgets, and user layout priorities.
 */

export type Capability =
  | "Administration"
  | "Governance"
  | "Academic Leadership"
  | "Teaching"
  | "Student Services"
  | "Operations"
  | "Analytics"
  | "AI Usage"
  | "Reporting"
  | "Academic Year Management"
  | "Workflow Management";

export interface NavigationItemSchema {
  id: string;
  label: string;
  icon: string; // Dynamic icon mapper identifier (e.g. "Command", "Search")
  route: string;
  displayOrder: number;
  visibilityRules: {
    roles?: string[];
    capabilities?: string[];
    featureFlag?: string;
  };
  capabilityRequirements: string[];
  parentGroup: "My Workspace" | "Teaching & Learning" | "Registers" | "School Operations" | "Leadership & Governance" | "Settings";
  helperText?: string;
}

export interface PageLayoutSchema {
  pageId: string;
  pageTitle: string;
  layoutType: "bento" | "grid" | "split" | "full";
  sections: string[];
  widgets: string[];
  actions: string[];
  filters: string[];
}

export interface RoleSchema {
  roleId: string;
  roleName: string;
  defaultEmail?: string;
  description?: string;
  capabilities: Capability[];
  navigationAccess: string[]; // Navigation item IDs
  pageAccess: string[]; // Page Layout IDs
}

export interface DashboardWidgetSchema {
  id: string;
  title: string;
  type: string;
  defaultVisible: boolean;
  displayOrder: number;
  section: "left" | "right" | "top";
  permissions: {
    capabilities?: string[];
    roles?: string[];
  };
  layoutSize: "full" | "half" | "third" | "two-thirds";
}

/**
 * Full compliance export schema model containing versioning, status flags, and compliance hashes
 */
export interface ExportableSchoolySchema {
  schemaId: string;
  schemaVersion: string;
  status: "draft" | "validated" | "published" | "archived";
  createdBy: string;
  updatedBy: string;
  organizationId: string;
  updatedAt: string;
  navigation: NavigationItemSchema[];
  roles: RoleSchema[];
  pages: PageLayoutSchema[];
  widgets: DashboardWidgetSchema[];
}

// Phase 3 Schema Aliases: Initial mapping of routes to legacy categories or placeholder actions
export const DRAFT_FUTURE_STRUCTURES = {
  "My Workspace": [
    { id: "overview", label: "Dashboard", route: "overview" },
    { id: "search", label: "Search", route: "search" },
    { id: "documents", label: "School Files", route: "search" },
    { id: "tasks", label: "Tasks", route: "tasks" }
  ],
  "Teaching & Learning": [
    { id: "classroom", label: "Classroom Sync", route: "classroom" },
    { id: "students", label: "Students", route: "students" },
    { id: "ai-assistant", label: "AI Assistant", route: "ai-assistant" }
  ],
  "Registers": [
    { id: "registers", label: "Registers", route: "registers" },
    { id: "registries", label: "Registries", route: "registries" },
    { id: "teachers", label: "Teachers", route: "teachers" },
    { id: "staff", label: "Staff", route: "staff" },
    { id: "courses", label: "Classroom Courses", route: "courses" },
    { id: "assignments", label: "Assignments", route: "assignments" }
  ],
  "School Operations": [
    { id: "rollover", label: "Academic Year", route: "rollover" }
  ],
  "Leadership & Governance": [
    { id: "governance", label: "Governance", route: "governance" }
  ],
  "Settings": [
    { id: "settings", label: "Settings", route: "settings" }
  ]
};

// Default Navigation items matching legacy structure meticulously to guarantee perfect visual backward compatibility
export const DEFAULT_NAVIGATION_ITEMS: NavigationItemSchema[] = [
  {
    id: "overview",
    label: "Dashboard",
    icon: "Command",
    route: "overview",
    displayOrder: 1,
    visibilityRules: { capabilities: ["Analytics", "AI Usage"] },
    capabilityRequirements: ["Analytics", "Teaching", "Student Services", "Operations", "Reporting"],
    parentGroup: "My Workspace",
    helperText: "Your school snapshot for today."
  },
  {
    id: "search",
    label: "Search",
    icon: "Search",
    route: "search",
    displayOrder: 2,
    visibilityRules: { capabilities: ["AI Usage"] },
    capabilityRequirements: ["AI Usage"],
    parentGroup: "My Workspace",
    helperText: "Find files, classes, tasks, and records you can access."
  },
  {
    id: "role-cards",
    label: "Role Cards",
    icon: "LayoutGrid",
    route: "role-cards",
    displayOrder: 2.5,
    visibilityRules: { capabilities: ["Analytics", "Teaching", "Student Services", "Operations", "Reporting", "Administration", "Governance", "Academic Leadership"] },
    capabilityRequirements: ["Analytics", "Teaching", "Student Services", "Operations", "Reporting", "Administration", "Governance", "Academic Leadership"],
    parentGroup: "My Workspace",
    helperText: "Open compact role-specific cards."
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: "CheckSquare",
    route: "tasks",
    displayOrder: 3,
    visibilityRules: { capabilities: ["Operations"] },
    capabilityRequirements: ["Operations"],
    parentGroup: "My Workspace",
    helperText: "See pending work and follow-ups."
  },
  {
    id: "classroom",
    label: "Classroom Sync",
    icon: "GraduationCap",
    route: "classroom",
    displayOrder: 5,
    visibilityRules: { capabilities: ["Teaching"] },
    capabilityRequirements: ["Teaching"],
    parentGroup: "Teaching & Learning",
    helperText: "Review Google Classroom activity and class materials."
  },
  {
    id: "students",
    label: "Students",
    icon: "Users",
    route: "students",
    displayOrder: 5.5,
    visibilityRules: { capabilities: ["Teaching", "Student Services", "Analytics", "Reporting"] },
    capabilityRequirements: ["Teaching", "Student Services", "Analytics", "Reporting"],
    parentGroup: "Teaching & Learning",
    helperText: "View student registry, risk, and enrollment details."
  },
  {
    id: "registries",
    label: "Registries",
    icon: "FolderOpen",
    route: "registries",
    displayOrder: 5.55,
    visibilityRules: { capabilities: ["Administration", "Academic Leadership"] },
    capabilityRequirements: ["Administration", "Academic Leadership"],
    parentGroup: "Registers",
    helperText: "Explore the master registry catalog and live registry routes."
  },
  {
    id: "teachers",
    label: "Teachers",
    icon: "User",
    route: "teachers",
    displayOrder: 5.6,
    visibilityRules: { capabilities: ["Administration", "Academic Leadership", "Analytics", "Reporting"] },
    capabilityRequirements: ["Administration", "Academic Leadership", "Analytics", "Reporting"],
    parentGroup: "Registers",
    helperText: "View teacher roster derived from Staff Directory."
  },
  {
    id: "staff",
    label: "Staff",
    icon: "UserCheck",
    route: "staff",
    displayOrder: 5.65,
    visibilityRules: { capabilities: ["Administration", "Operations", "Analytics", "Reporting"] },
    capabilityRequirements: ["Administration", "Operations", "Analytics", "Reporting"],
    parentGroup: "Registers",
    helperText: "View staff directory and role load."
  },
  {
    id: "courses",
    label: "Classroom Courses",
    icon: "BookOpen",
    route: "courses",
    displayOrder: 5.7,
    visibilityRules: { capabilities: ["Teaching", "Academic Leadership", "Analytics", "Reporting"] },
    capabilityRequirements: ["Teaching", "Academic Leadership", "Analytics", "Reporting"],
    parentGroup: "Registers",
    helperText: "Browse live classroom course records."
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: "FileText",
    route: "assignments",
    displayOrder: 5.8,
    visibilityRules: { capabilities: ["Teaching", "Academic Leadership", "Analytics", "Reporting"] },
    capabilityRequirements: ["Teaching", "Academic Leadership", "Analytics", "Reporting"],
    parentGroup: "Registers",
    helperText: "Browse class assignments and status."
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    icon: "Sparkles",
    route: "ai-assistant",
    displayOrder: 4,
    visibilityRules: { capabilities: ["AI Usage"] },
    capabilityRequirements: ["AI Usage"],
    parentGroup: "Teaching & Learning",
    helperText: "Create lesson resources, summaries, and school drafts."
  },
  {
    id: "lesson-plans",
    label: "Lesson Plans",
    icon: "BookOpen",
    route: "lesson-plans",
    displayOrder: 4.5,
    visibilityRules: { capabilities: ["Teaching"] },
    capabilityRequirements: ["Teaching"],
    parentGroup: "Teaching & Learning",
    helperText: "Create, search, reuse and manage structured lesson plans."
  },
  {
    id: "resources",
    label: "Academic Resources",
    icon: "BookOpen",
    route: "resources",
    displayOrder: 4.6,
    visibilityRules: { capabilities: ["Teaching"] },
    capabilityRequirements: ["Teaching"],
    parentGroup: "Teaching & Learning",
    helperText: "Browse lesson-linked resource packs and source materials."
  },
  {
    id: "registers",
    label: "Registers",
    icon: "FolderOpen",
    route: "registers",
    displayOrder: 4.2,
    visibilityRules: { capabilities: ["Analytics", "Operations", "Teaching", "Student Services", "Reporting"] },
    capabilityRequirements: ["Analytics", "Operations", "Teaching", "Student Services", "Reporting"],
    parentGroup: "Registers",
    helperText: "Open live student, teacher, class, and staff registers."
  },
  {
    id: "rollover",
    label: "Academic Year",
    icon: "RefreshCw",
    route: "rollover",
    displayOrder: 6,
    visibilityRules: { capabilities: ["Academic Year Management"] },
    capabilityRequirements: ["Academic Year Management"],
    parentGroup: "School Operations",
    helperText: "Manage rollover, classes, sections, and academic-year setup."
  },
  {
    id: "governance",
    label: "Governance",
    icon: "ShieldAlert",
    route: "governance",
    displayOrder: 7,
    visibilityRules: { capabilities: ["Governance"] },
    capabilityRequirements: ["Governance"],
    parentGroup: "Leadership & Governance",
    helperText: "Review roles, audit logs, school structure, and policies."
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Settings",
    route: "settings",
    displayOrder: 8,
    visibilityRules: { capabilities: ["Administration", "Governance", "Operations", "Academic Leadership"] },
    capabilityRequirements: ["Administration", "Governance", "Operations", "Academic Leadership"],
    parentGroup: "Settings",
    helperText: "Configure data sources, setup, and registry details."
  }
];

export const DEFAULT_ROLES: RoleSchema[] = [
  {
    roleId: "principal",
    roleName: "Principal",
    defaultEmail: "principal@school.org",
    description: "Oversee operational operational risks & curriculum planners alignment",
    capabilities: [
      "Academic Leadership",
      "Analytics",
      "AI Usage",
      "Reporting",
      "Operations",
      "Teaching"
    ],
    navigationAccess: ["overview", "search", "students", "teachers", "staff", "courses", "assignments", "registries", "tasks", "ai-assistant", "lesson-plans", "resources"],
    pageAccess: ["overview", "search", "students", "teachers", "staff", "courses", "assignments", "registries", "tasks", "ai-assistant", "lesson-plans", "resources"]
  },
  {
    roleId: "coordinator",
    roleName: "School Coordinator",
    defaultEmail: "coordinator@school.org",
    description: "Manage Department curricula alignments, class sync indices, and teacher assignments",
    capabilities: [
      "Academic Leadership",
      "Teaching",
      "Operations",
      "Analytics",
      "AI Usage",
      "Academic Year Management"
    ],
    navigationAccess: ["overview", "search", "classroom", "students", "teachers", "staff", "courses", "assignments", "registries", "tasks", "ai-assistant", "rollover", "lesson-plans", "resources"],
    pageAccess: ["overview", "search", "classroom", "students", "teachers", "staff", "courses", "assignments", "registries", "tasks", "ai-assistant", "rollover", "lesson-plans", "resources"]
  },
  {
    roleId: "hod",
    roleName: "HOD",
    defaultEmail: "hod@school.org",
    description: "Manage Mathematics Department-level monitoring, resources completion gaps, and teacher activities",
    capabilities: [
      "Academic Leadership",
      "Teaching",
      "Operations",
      "Analytics",
      "AI Usage"
    ],
    navigationAccess: ["overview", "classroom", "students", "teachers", "staff", "courses", "assignments", "registries", "tasks", "ai-assistant", "lesson-plans", "resources"],
    pageAccess: ["overview", "classroom", "students", "teachers", "staff", "courses", "assignments", "registries", "tasks", "ai-assistant", "lesson-plans", "resources"]
  },
  {
    roleId: "teacher",
    roleName: "Teacher",
    defaultEmail: "teacher@school.org",
    description: "Track Grade 8 classroom course syllabi, assignments and student risks indicators",
    capabilities: [
      "Teaching",
      "Operations",
      "AI Usage"
    ],
    navigationAccess: ["overview", "classroom", "students", "courses", "assignments", "tasks", "ai-assistant", "lesson-plans", "resources"],
    pageAccess: ["overview", "classroom", "students", "courses", "assignments", "tasks", "ai-assistant", "lesson-plans", "resources"]
  },
  {
    roleId: "admin",
    roleName: "School Admin",
    defaultEmail: "academic.admin@school.org",
    description: "Full administrative controls across workspace parameters & year-end rollover Wizards",
    capabilities: [
      "Administration",
      "Governance",
      "Academic Leadership",
      "Teaching",
      "Student Services",
      "Operations",
      "Analytics",
      "AI Usage",
      "Reporting",
      "Academic Year Management",
      "Workflow Management"
    ],
    navigationAccess: ["overview", "search", "classroom", "students", "teachers", "staff", "courses", "assignments", "registries", "tasks", "ai-assistant", "rollover", "governance", "resources"],
    pageAccess: ["overview", "search", "classroom", "students", "teachers", "staff", "courses", "assignments", "registries", "tasks", "ai-assistant", "rollover", "governance", "resources"]
  },
  {
    roleId: "manager",
    roleName: "Manager",
    defaultEmail: "hq.manager@school.org",
    description: "Inspect performance indices, review overall school operations, administrative reports, and strategic workflows",
    capabilities: [
      "Administration",
      "Operations",
      "Analytics",
      "Reporting",
      "Workflow Management"
    ],
    navigationAccess: ["overview", "search", "tasks"],
    pageAccess: ["overview", "search", "tasks"]
  },
  {
    roleId: "hr",
    roleName: "HR",
    defaultEmail: "workforce.hr@school.org",
    description: "Coordinate teacher rosters, supervisor credentials, administrative and operation logs",
    capabilities: [
      "Administration",
      "Operations",
      "Reporting"
    ],
    navigationAccess: ["overview", "staff", "tasks"],
    pageAccess: ["overview", "staff", "tasks"]
  },
  {
    roleId: "student",
    roleName: "Student",
    defaultEmail: "david.chen@school.org",
    description: "Examine personal deadlines & homework progress worksheets",
    capabilities: [
      "Student Services",
      "Teaching" // Allow dynamic class viewing
    ],
    navigationAccess: ["overview", "classroom", "tasks"],
    pageAccess: ["overview", "classroom", "tasks"]
  },
  {
    roleId: "exams",
    roleName: "Examination Chair",
    defaultEmail: "exams.chair@school.org",
    description: "Audit AP/board exam certifications, align academic curriculum planners, risk scores, and grade syncs",
    capabilities: [
      "Academic Leadership",
      "Analytics",
      "AI Usage",
      "Teaching"
    ],
    navigationAccess: ["overview", "search", "classroom", "students", "teachers", "courses", "assignments", "registries", "tasks", "ai-assistant", "resources"],
    pageAccess: ["overview", "search", "classroom", "students", "teachers", "courses", "assignments", "registries", "tasks", "ai-assistant", "resources"]
  },
  {
    roleId: "parent",
    roleName: "Parent Representative",
    defaultEmail: "parents.liaison@school.org",
    description: "View recent school-wide announcements, homework deadlines, student risk overview logs",
    capabilities: [
      "Student Services",
      "Reporting"
    ],
    navigationAccess: ["overview", "search", "tasks"],
    pageAccess: ["overview", "search", "tasks"]
  }
];export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetSchema[] = [
  {
    id: "metrics_grid",
    title: "Overview Metrics Grid",
    type: "metrics",
    defaultVisible: true,
    displayOrder: 1,
    section: "top",
    permissions: { capabilities: ["Analytics"] },
    layoutSize: "full"
  },
  {
    id: "favorite_files",
    title: "Favorite Workspace Materials",
    type: "favorites",
    defaultVisible: true,
    displayOrder: 2,
    section: "left",
    permissions: { capabilities: ["AI Usage"] },
    layoutSize: "two-thirds"
  },
  {
    id: "classroom_announcements",
    title: "Recent Classroom Announcements",
    type: "classroom_posts",
    defaultVisible: true,
    displayOrder: 3,
    section: "left",
    permissions: { capabilities: ["Teaching"] },
    layoutSize: "two-thirds"
  },
  {
    id: "ai_recommendations",
    title: "AI Productivity Recommendations",
    type: "ai_panel",
    defaultVisible: true,
    displayOrder: 4,
    section: "right",
    permissions: { capabilities: ["AI Usage"] },
    layoutSize: "third"
  },
  {
    id: "integrations_tracker",
    title: "Student Records Sync",
    type: "sis_sync",
    defaultVisible: true,
    displayOrder: 5,
    section: "right",
    permissions: { capabilities: ["Operations"] },
    layoutSize: "third"
  }
];

export const DEFAULT_PAGES_SCHEMAS: PageLayoutSchema[] = [
  {
    pageId: "overview",
    pageTitle: "Dashboard",
    layoutType: "bento",
    sections: ["KPIs", "Workspace", "Stream", "AI Advisor", "Integration"],
    widgets: ["metrics_grid", "favorite_files", "classroom_announcements", "ai_recommendations", "integrations_tracker"],
    actions: ["drill_down", "export_csv", "export_png", "edit_card", "sis_sync_classroom"],
    filters: ["date_range", "drill_priority", "drill_risk"]
  },
  {
    pageId: "search",
    pageTitle: "Search",
    layoutType: "full",
    sections: ["source_filters", "results_table", "file_context_inspector", "gpt_summary"],
    widgets: ["google_drive_folder_link", "search_filtering_bar", "workspace_documents_grid", "smart_abstract_q_and_a"],
    actions: ["search_query", "toggle_favorite", "tag_editor", "fetch_suggested_tags", "gemini_copilot_summarize"],
    filters: ["source_category", "department_sharing_rule"]
  },
  {
    pageId: "registries",
    pageTitle: "Registries Explorer",
    layoutType: "split",
    sections: ["registry_catalog", "registry_detail"],
    widgets: ["registry_catalog_list", "registry_catalog_detail"],
    actions: ["search_query", "toggle_display_mode", "open_registry_page", "open_registry_route"],
    filters: ["source_kind", "registry_status", "group"]
  },
  {
    pageId: "classroom",
    pageTitle: "Classroom Sync",
    layoutType: "split",
    sections: ["active_courses", "student_rosters", "curricula_assignments", "tagging_audits"],
    widgets: ["classroom_courses_grid", "courses_assignments_list", "roster_risk_badge", "performance_charts"],
    actions: ["sync_grades", "fetch_active_courses", "audit_curriculum_gaps"],
    filters: ["course_selection", "enrollment_status"]
  },
  {
    pageId: "students",
    pageTitle: "Students",
    layoutType: "split",
    sections: ["student_registry", "student_detail"],
    widgets: ["student_registry_list", "student_detail_card"],
    actions: ["search_query", "toggle_display_mode", "filter_by_grade", "filter_by_status"],
    filters: ["grade_level", "enrollment_status", "risk_band"]
  },
  {
    pageId: "teachers",
    pageTitle: "Teachers",
    layoutType: "split",
    sections: ["teacher_registry", "teacher_detail"],
    widgets: ["teacher_registry_list", "teacher_detail_card"],
    actions: ["search_query", "filter_by_department", "toggle_display_mode"],
    filters: ["department", "current_courses"]
  },
  {
    pageId: "staff",
    pageTitle: "Staff",
    layoutType: "split",
    sections: ["staff_registry", "staff_detail"],
    widgets: ["staff_registry_list", "staff_detail_card"],
    actions: ["search_query", "filter_by_role", "filter_by_department", "toggle_display_mode"],
    filters: ["role", "department", "status"]
  },
  {
    pageId: "courses",
    pageTitle: "Classroom Courses",
    layoutType: "split",
    sections: ["course_registry", "course_detail"],
    widgets: ["course_registry_list", "course_detail_card"],
    actions: ["search_query", "toggle_display_mode"],
    filters: ["teacher_name", "student_count"]
  },
  {
    pageId: "assignments",
    pageTitle: "Assignments",
    layoutType: "split",
    sections: ["assignment_registry", "assignment_detail"],
    widgets: ["assignment_registry_list", "assignment_detail_card"],
    actions: ["search_query", "filter_by_status", "toggle_display_mode"],
    filters: ["status", "course_name", "due_date"]
  },
  {
    pageId: "tasks",
    pageTitle: "Tasks",
    layoutType: "grid",
    sections: ["scannable_kpi_counters", "kanban_board", "creation_drawer"],
    widgets: ["kanban_columns", "kanban_task_card", "gantt_due_date_alerts"],
    actions: ["create_task", "toggle_status", "change_priority", "delete_task"],
    filters: ["assigned_operator", "priority_level"]
  },
  {
    pageId: "ai-assistant",
    pageTitle: "AI Assistant",
    layoutType: "split",
    sections: ["educational_designer", "workflow_automations", "active_triggers"],
    widgets: ["ai_prompt_playground", "structured_automation_blueprint", "automation_rules_list"],
    actions: ["query_gemini_assist", "compile_syllabus_blueprint", "draft_parent_newsletter", "toggle_automation", "spawn_new_trigger"],
    filters: ["assistant_category"]
  },
  {
    pageId: "rollover",
    pageTitle: "Academic Year",
    layoutType: "full",
    sections: ["migration_timeline", "promotions_rubric", "archiving_logs"],
    widgets: ["academic_year_selector", "promotional_strategy_form", "rollover_execution_terminal"],
    actions: ["dry_run", "trigger_academic_rollover", "clone_workflow_rules"],
    filters: ["school_year_level"]
  },
  {
    pageId: "governance",
    pageTitle: "Governance",
    layoutType: "split",
    sections: ["active_role_simulation", "immutable_audit_logs", "architecture_schema_editor"],
    widgets: ["role_swapper_cards", "audit_log_compliance_table", "schema_engine_manager"],
    actions: ["inspect_schemas", "modify_navigation_order", "publish_draft_schema", "export_metadata_json", "import_metadata_json"],
    filters: ["operator_category", "audit_compliance_flag"]
  }
];

export const INITIAL_EXPORTABLE_SCHEMA: ExportableSchoolySchema = {
  schemaId: "schooly-enterprise-core-meta-v1",
  schemaVersion: "1.1.0",
  status: "published",
  createdBy: "academic.admin@school.org",
  updatedBy: "academic.admin@school.org",
  organizationId: "schooly-k12-district-09",
  updatedAt: new Date().toISOString(),
  navigation: DEFAULT_NAVIGATION_ITEMS,
  roles: DEFAULT_ROLES,
  pages: DEFAULT_PAGES_SCHEMAS,
  widgets: DEFAULT_DASHBOARD_WIDGETS
};

function ensureStudentsSchemaCoverage(schema: ExportableSchoolySchema): ExportableSchoolySchema {
  const studentsNav: NavigationItemSchema = {
    id: "students",
    label: "Students",
    icon: "Users",
    route: "students",
    displayOrder: 5.5,
    visibilityRules: { capabilities: ["Teaching", "Student Services", "Analytics", "Reporting"] },
    capabilityRequirements: ["Teaching", "Student Services", "Analytics", "Reporting"],
    parentGroup: "Teaching & Learning",
    helperText: "View student registry, risk, and enrollment details."
  };

  const registriesNav: NavigationItemSchema = {
    id: "registries",
    label: "Registries",
    icon: "FolderOpen",
    route: "registries",
    displayOrder: 5.55,
    visibilityRules: { capabilities: ["Administration", "Academic Leadership"] },
    capabilityRequirements: ["Administration", "Academic Leadership"],
    parentGroup: "Registers",
    helperText: "Explore the master registry catalog and live registry routes."
  };

  const teachersNav: NavigationItemSchema = {
    id: "teachers",
    label: "Teachers",
    icon: "User",
    route: "teachers",
    displayOrder: 5.6,
    visibilityRules: { capabilities: ["Administration", "Academic Leadership", "Analytics", "Reporting"] },
    capabilityRequirements: ["Administration", "Academic Leadership", "Analytics", "Reporting"],
    parentGroup: "Registers",
    helperText: "View teacher roster derived from Staff Directory."
  };

  const staffNav: NavigationItemSchema = {
    id: "staff",
    label: "Staff",
    icon: "UserCheck",
    route: "staff",
    displayOrder: 5.65,
    visibilityRules: { capabilities: ["Administration", "Operations", "Analytics", "Reporting"] },
    capabilityRequirements: ["Administration", "Operations", "Analytics", "Reporting"],
    parentGroup: "Registers",
    helperText: "View staff directory and role load."
  };

  const coursesNav: NavigationItemSchema = {
    id: "courses",
    label: "Classroom Courses",
    icon: "BookOpen",
    route: "courses",
    displayOrder: 5.7,
    visibilityRules: { capabilities: ["Teaching", "Academic Leadership", "Analytics", "Reporting"] },
    capabilityRequirements: ["Teaching", "Academic Leadership", "Analytics", "Reporting"],
    parentGroup: "Registers",
    helperText: "Browse live classroom course records."
  };

  const assignmentsNav: NavigationItemSchema = {
    id: "assignments",
    label: "Assignments",
    icon: "FileText",
    route: "assignments",
    displayOrder: 5.8,
    visibilityRules: { capabilities: ["Teaching", "Academic Leadership", "Analytics", "Reporting"] },
    capabilityRequirements: ["Teaching", "Academic Leadership", "Analytics", "Reporting"],
    parentGroup: "Registers",
    helperText: "Browse class assignments and status."
  };

  const studentsPage: PageLayoutSchema = {
    pageId: "students",
    pageTitle: "Students",
    layoutType: "split",
    sections: ["student_registry", "student_detail"],
    widgets: ["student_registry_list", "student_detail_card"],
    actions: ["search_query", "toggle_display_mode", "filter_by_grade", "filter_by_status"],
    filters: ["grade_level", "enrollment_status", "risk_band"]
  };

  const registriesPage: PageLayoutSchema = {
    pageId: "registries",
    pageTitle: "Registries Explorer",
    layoutType: "split",
    sections: ["registry_catalog", "registry_detail"],
    widgets: ["registry_catalog_list", "registry_catalog_detail"],
    actions: ["search_query", "toggle_display_mode", "open_registry_page", "open_registry_route"],
    filters: ["source_kind", "registry_status", "group"]
  };

  const teachersPage: PageLayoutSchema = {
    pageId: "teachers",
    pageTitle: "Teachers",
    layoutType: "split",
    sections: ["teacher_registry", "teacher_detail"],
    widgets: ["teacher_registry_list", "teacher_detail_card"],
    actions: ["search_query", "filter_by_department", "toggle_display_mode"],
    filters: ["department", "current_courses"]
  };

  const staffPage: PageLayoutSchema = {
    pageId: "staff",
    pageTitle: "Staff",
    layoutType: "split",
    sections: ["staff_registry", "staff_detail"],
    widgets: ["staff_registry_list", "staff_detail_card"],
    actions: ["search_query", "filter_by_role", "filter_by_department", "toggle_display_mode"],
    filters: ["role", "department", "status"]
  };

  const coursesPage: PageLayoutSchema = {
    pageId: "courses",
    pageTitle: "Classroom Courses",
    layoutType: "split",
    sections: ["course_registry", "course_detail"],
    widgets: ["course_registry_list", "course_detail_card"],
    actions: ["search_query", "toggle_display_mode"],
    filters: ["teacher_name", "student_count"]
  };

  const assignmentsPage: PageLayoutSchema = {
    pageId: "assignments",
    pageTitle: "Assignments",
    layoutType: "split",
    sections: ["assignment_registry", "assignment_detail"],
    widgets: ["assignment_registry_list", "assignment_detail_card"],
    actions: ["search_query", "filter_by_status", "toggle_display_mode"],
    filters: ["status", "course_name", "due_date"]
  };

  const ensureArrayItem = <T,>(items: T[], matcher: (item: T) => boolean, item: T): T[] => {
    return items.some(matcher) ? items : [...items, item];
  };

  const normalizedNavigation = ensureArrayItem(
    schema.navigation || [],
    (item) => item.id === "students" || item.route === "students",
    studentsNav,
  );
  const normalizedRegistriesNavigation = ensureArrayItem(
    normalizedNavigation,
    (item) => item.id === "registries" || item.route === "registries",
    registriesNav,
  );
  const normalizedTeachersNavigation = ensureArrayItem(
    normalizedRegistriesNavigation,
    (item) => item.id === "teachers" || item.route === "teachers",
    teachersNav,
  );
  const normalizedStaffNavigation = ensureArrayItem(
    normalizedTeachersNavigation,
    (item) => item.id === "staff" || item.route === "staff",
    staffNav,
  );
  const normalizedPages = ensureArrayItem(
    schema.pages || [],
    (page) => page.pageId === "students",
    studentsPage,
  );
  const normalizedRegistriesPages = ensureArrayItem(
    normalizedPages,
    (page) => page.pageId === "registries",
    registriesPage,
  );
  const normalizedTeachersPages = ensureArrayItem(
    normalizedRegistriesPages,
    (page) => page.pageId === "teachers",
    teachersPage,
  );
  const normalizedStaffPages = ensureArrayItem(
    normalizedTeachersPages,
    (page) => page.pageId === "staff",
    staffPage,
  );
  const normalizedCoursesPages = ensureArrayItem(
    normalizedStaffPages,
    (page) => page.pageId === "courses",
    coursesPage,
  );
  const normalizedAssignmentsPages = ensureArrayItem(
    normalizedCoursesPages,
    (page) => page.pageId === "assignments",
    assignmentsPage,
  );
  const ensureRoleAccess = (role: RoleSchema, ids: string[]): RoleSchema => {
    const navigationAccess = [...(role.navigationAccess || [])];
    const pageAccess = [...(role.pageAccess || [])];

    ids.forEach((id) => {
      if (!navigationAccess.includes(id)) navigationAccess.push(id);
      if (!pageAccess.includes(id)) pageAccess.push(id);
    });

    return {
      ...role,
      navigationAccess,
      pageAccess,
    };
  };
  const normalizeRoleAccess = (role: RoleSchema): RoleSchema => {
    const roleKey = String(role.roleId || role.roleName || "").toLowerCase();

    if (["principal", "coordinator", "hod", "admin", "exams"].includes(roleKey)) {
      return ensureRoleAccess(role, ["students", "registries", "teachers", "staff", "courses", "assignments", "resources"]);
    }
    if (roleKey === "teacher") {
      return ensureRoleAccess(role, ["students", "courses", "assignments", "resources"]);
    }
    if (roleKey === "hr") {
      return ensureRoleAccess(role, ["staff"]);
    }
    return role;
  };

  return {
    ...schema,
    navigation: normalizedStaffNavigation,
    pages: normalizedAssignmentsPages,
    roles: (schema.roles || []).map(normalizeRoleAccess),
  };
}

/**
 * Loads the active config from localStorage if available, otherwise sets and returns initial defaults
 */
export function loadActiveMetadata(): ExportableSchoolySchema {
  try {
    const serialized = localStorage.getItem("schooly_active_metadata_schemas");
    if (serialized) {
      const parsed = JSON.parse(serialized);
      const normalizedParsed = ensureStudentsSchemaCoverage(parsed);
      // Auto-upgrade stale or older configurations (e.g., pre-1.0.1 without dynamic fields/capabilities/roles)
      if (!normalizedParsed.schemaVersion || normalizedParsed.schemaVersion !== "1.1.0") {
        console.log("[SCHEMA SYSTEM] Stale or legacy schema version detected. Upgrading database configuration to v1.1.0...");
        const upgraded = ensureStudentsSchemaCoverage(INITIAL_EXPORTABLE_SCHEMA);
        localStorage.setItem("schooly_active_metadata_schemas", JSON.stringify(upgraded));
        return upgraded;
      }
      if (normalizedParsed.navigation.length !== parsed.navigation?.length ||
          normalizedParsed.pages.length !== parsed.pages?.length ||
          normalizedParsed.roles.some((role, index) =>
            role.navigationAccess.length !== parsed.roles?.[index]?.navigationAccess?.length ||
            role.pageAccess.length !== parsed.roles?.[index]?.pageAccess?.length)) {
        localStorage.setItem("schooly_active_metadata_schemas", JSON.stringify(normalizedParsed));
      }
      return normalizedParsed;
    }
  } catch (e) {
    console.warn("[SCHEMA SERVER] Failed reading active metadata from localStorage, falling back to static config.", e);
  }
  // Initialize defaults
  try {
    const initialized = ensureStudentsSchemaCoverage(INITIAL_EXPORTABLE_SCHEMA);
    localStorage.setItem("schooly_active_metadata_schemas", JSON.stringify(initialized));
  } catch (e) {
    console.warn("[SCHEMA SYSTEM] LocalStorage writing restricted.");
  }
  return ensureStudentsSchemaCoverage(INITIAL_EXPORTABLE_SCHEMA);
}

export function saveActiveMetadata(schema: ExportableSchoolySchema): void {
  try {
    schema.updatedAt = new Date().toISOString();
    localStorage.setItem("schooly_active_metadata_schemas", JSON.stringify(schema));
  } catch (e) {
    console.warn("[SCHEMA CLIENT] Store write failed.", e);
  }
}

export function resetActiveMetadataToDefault(): ExportableSchoolySchema {
  saveActiveMetadata(INITIAL_EXPORTABLE_SCHEMA);
  return INITIAL_EXPORTABLE_SCHEMA;
}

/**
 * Computes dynamic navigation routes based on the union of capabilities from one or multiple combined roles.
 * Satisfies Phase 2 (Multi-role authorization context) and avoids duplicate elements.
 */
export function compileDynamicNavigation(
  activeRoles: string[],
  schema: ExportableSchoolySchema,
  featureFlagEnabled: boolean
): NavigationItemSchema[] {
  // If metadata rendering feature flag is off, we fall back to order matching DEFAULT keys
  if (!featureFlagEnabled) {
    // Generate default legacy map
    const defaultNavs = schema.navigation;
    const combinedCaps = new Set<string>();
    
    activeRoles.forEach(rName => {
      const targetRoleDef = schema.roles.find(r => r.roleName === rName || r.roleId === rName.toLowerCase().replace(/\s+/g, "-"));
      if (targetRoleDef) {
        targetRoleDef.capabilities.forEach(cap => combinedCaps.add(cap));
      }
    });

    // Match legacy filtering behavior
    return defaultNavs.filter(nav => {
      // Admin sees everything
      if (activeRoles.includes("School Admin")) return true;
      // Filter based on nav capability requirements
      return nav.capabilityRequirements.some(req => combinedCaps.has(req as Capability));
    }).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // Schema-driven navigation grouping
  const combinedCapabilities = new Set<Capability>();
  activeRoles.forEach(roleName => {
    const roleDef = schema.roles.find(r => r.roleName === roleName || r.roleId === roleName.toLowerCase().replace(/\s+/g, "-"));
    if (roleDef) {
      roleDef.capabilities.forEach(cap => combinedCapabilities.add(cap));
    }
  });

  // Filter navigation items where at least one capability is satisfied
  return schema.navigation
    .filter(navItem => {
      // Administrative bypass or direct match
      if (combinedCapabilities.has("Administration") || combinedCapabilities.has("Governance")) {
        return true;
      }
      return navItem.capabilityRequirements.some(req => combinedCapabilities.has(req as Capability));
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
