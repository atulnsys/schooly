export type PageConformanceSurface = "standard-layout" | "standard-header" | "registry-shell";

export interface PageConformanceEntry {
  route: string;
  componentPath: string;
  pageId: string;
  surface: PageConformanceSurface;
  requiredTokens: readonly string[];
  browserSelectors: readonly string[];
}

export const PAGE_CONFORMANCE_MANIFEST = [
  {
    route: "/tasks",
    componentPath: "src/components/TaskProductivity.tsx",
    pageId: "tasks-productivity-workspace",
    surface: "standard-layout",
    requiredTokens: [
      "StandardPageLayout",
      "StandardMetricGrid",
      'pageId="tasks-productivity-workspace"',
    ],
    browserSelectors: [
      '[data-schooly-page="tasks-productivity-workspace"]',
      '[data-schooly-page-header="true"]',
      '[data-schooly-metric-grid="true"]',
    ],
  },
  {
    route: "/lesson-plans",
    componentPath: "src/components/LessonPlanner.tsx",
    pageId: "lesson-plan-workspace",
    surface: "standard-header",
    requiredTokens: [
      "StandardPageHeader",
      'data-schooly-page="lesson-plans-page"',
      'data-schooly-page-layout="true"',
    ],
    browserSelectors: [
      '[data-schooly-page="lesson-plans-page"]',
      '[data-schooly-page-header="true"]',
    ],
  },
  {
    route: "/resources",
    componentPath: "src/components/AcademicResourceLibraryPage.tsx",
    pageId: "resources-page",
    surface: "standard-header",
    requiredTokens: [
      "StandardPageHeader",
      "StandardMetricGrid",
      'data-schooly-page="resources-page"',
      'data-schooly-page-layout="true"',
    ],
    browserSelectors: [
      '[data-schooly-page="resources-page"]',
      '[data-schooly-page-header="true"]',
      '[data-schooly-metric-grid="true"]',
    ],
  },
  {
    route: "/classroom",
    componentPath: "src/components/ClassroomManager.tsx",
    pageId: "classroom-page",
    surface: "standard-header",
    requiredTokens: [
      "StandardPageHeader",
      "StandardMetricGrid",
      'data-schooly-page="classroom-page"',
      'data-schooly-page-layout="true"',
    ],
    browserSelectors: [
      '[data-schooly-page="classroom-page"]',
      '[data-schooly-page-header="true"]',
      '[data-schooly-metric-grid="true"]',
    ],
  },
  {
    route: "/students",
    componentPath: "src/components/StudentsRegistryPage.tsx",
    pageId: "students-registry-page",
    surface: "registry-shell",
    requiredTokens: [
      "RegistryPageShell",
      "showListHeader={false}",
    ],
    browserSelectors: [
      '[data-schooly-page="students-registry-page"]',
      '[data-schooly-page-header="true"]',
    ],
  },
  {
    route: "/courses",
    componentPath: "src/components/ClassroomCoursesRegistryPage.tsx",
    pageId: "courses-registry-page",
    surface: "registry-shell",
    requiredTokens: [
      "RegistryPageShell",
      "showListHeader={false}",
    ],
    browserSelectors: [
      '[data-schooly-page="courses-registry-page"]',
      '[data-schooly-page-header="true"]',
    ],
  },
  {
    route: "/assignments",
    componentPath: "src/components/ClassroomAssignmentsRegistryPage.tsx",
    pageId: "assignments-registry-page",
    surface: "registry-shell",
    requiredTokens: [
      "RegistryPageShell",
      "showListHeader={false}",
    ],
    browserSelectors: [
      '[data-schooly-page="assignments-registry-page"]',
      '[data-schooly-page-header="true"]',
    ],
  },
  {
    route: "/textbooks",
    componentPath: "src/components/TextbookIngestor.tsx",
    pageId: "textbook-ingestion-workspace",
    surface: "standard-header",
    requiredTokens: [
      "StandardPageHeader",
      'data-schooly-page="textbooks-page"',
      'data-schooly-page-layout="true"',
    ],
    browserSelectors: [
      '[data-schooly-page="textbooks-page"]',
      '[data-schooly-page-header="true"]',
    ],
  },
  {
    route: "/registries",
    componentPath: "src/components/RegistryExplorerPage.tsx",
    pageId: "registries-registry-page",
    surface: "standard-layout",
    requiredTokens: [
      "StandardPageLayout",
      "StandardMetricGrid",
      'pageId="registries-registry-page"',
    ],
    browserSelectors: [
      '[data-schooly-page="registries-registry-page"]',
      '[data-schooly-page-header="true"]',
      '[data-schooly-metric-grid="true"]',
    ],
  },
  {
    route: "/staff",
    componentPath: "src/components/StaffRegistryPage.tsx",
    pageId: "staff-registry-page",
    surface: "registry-shell",
    requiredTokens: [
      "RegistryPageShell",
      "showListHeader={false}",
    ],
    browserSelectors: [
      '[data-schooly-page="staff-registry-page"]',
      '[data-schooly-page-header="true"]',
    ],
  },
] as const satisfies ReadonlyArray<PageConformanceEntry>;

export const SETTINGS_REGRESSION_SMOKE_ROUTE = "/settings?section=registry";
