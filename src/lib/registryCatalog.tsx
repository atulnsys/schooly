import type { ComponentType } from "react";
import { BookOpen, FileText, FolderOpen, User, Users } from "lucide-react";
import type { ClassroomAssignment, ClassroomCourse, StudentDetails, TeacherDetails } from "../types";
import type { GenericEntityDefinition, GenericEntityDisplayMode } from "./genericEntityView";
import { createStudentEntityDefinition } from "./studentEntityDefinition";
import { createTeacherEntityDefinition } from "./teacherEntityDefinition";
import { createClassroomCourseEntityDefinition } from "./classroomCourseEntityDefinition";
import { createClassroomAssignmentEntityDefinition } from "./classroomAssignmentEntityDefinition";

export type RegistryStatus = "active" | "deferred";
export type RegistryIconName = "Users" | "User" | "BookOpen" | "FileText" | "FolderOpen";

export interface RegistryControlDefaults {
  showSearch: boolean;
  showFilters: boolean;
  showSort: boolean;
  showDisplayModeToggle: boolean;
  showPagination: boolean;
  displayMode: GenericEntityDisplayMode;
  maxVisibleFields?: number;
}

export interface RegistryCatalogEntry<T extends object = object> {
  id: string;
  label: string;
  navLabel: string;
  description: string;
  route: string;
  iconName: RegistryIconName;
  dataSourceType: "prop" | "api" | "embedded";
  endpoint?: string;
  createEntityDefinition?: () => GenericEntityDefinition<T>;
  allowedRoles?: string[];
  allowedCapabilities?: string[];
  emptyStateTitle: string;
  emptyStateDescription: string;
  firstClassPageEnabled: boolean;
  drillThroughEnabled: boolean;
  status: RegistryStatus;
  statusReason?: string;
  group: "People & Classroom" | "Embedded" | "Deferred";
  sourceLabel: string;
  controlDefaults: RegistryControlDefaults;
  iconComponent: ComponentType<{ size: number; className?: string }>;
}

export const REGISTRY_CATALOG: RegistryCatalogEntry[] = [
  {
    id: "students",
    label: "Students",
    navLabel: "Students",
    description: "View student registry, risk, and enrollment details.",
    route: "students",
    iconName: "Users",
    iconComponent: Users,
    dataSourceType: "api",
    endpoint: "/api/students",
    createEntityDefinition: () => createStudentEntityDefinition(),
    allowedRoles: ["Principal", "School Admin", "School Coordinator", "HOD", "Teacher", "Examination Chair"],
    allowedCapabilities: ["Teaching", "Student Services", "Analytics", "Reporting"],
    emptyStateTitle: "No student records are available.",
    emptyStateDescription: "The live /api/students feed did not return any rows for the selected context.",
    firstClassPageEnabled: true,
    drillThroughEnabled: true,
    status: "active",
    group: "People & Classroom",
    sourceLabel: "/api/students",
    controlDefaults: {
      showSearch: true,
      showFilters: true,
      showSort: true,
      showDisplayModeToggle: true,
      showPagination: true,
      displayMode: "table",
    },
  },
  {
    id: "teachers",
    label: "Teachers",
    navLabel: "Teachers",
    description: "View teacher roster and staff load.",
    route: "teachers",
    iconName: "User",
    iconComponent: User,
    dataSourceType: "api",
    endpoint: "/api/teachers",
    createEntityDefinition: () => createTeacherEntityDefinition(),
    allowedRoles: ["Principal", "School Admin", "School Coordinator", "HOD", "Examination Chair"],
    allowedCapabilities: ["Administration", "Academic Leadership", "Analytics", "Reporting"],
    emptyStateTitle: "No teacher records are available.",
    emptyStateDescription: "The live /api/teachers feed did not return any rows for the selected context.",
    firstClassPageEnabled: true,
    drillThroughEnabled: true,
    status: "active",
    group: "People & Classroom",
    sourceLabel: "/api/teachers",
    controlDefaults: {
      showSearch: true,
      showFilters: false,
      showSort: true,
      showDisplayModeToggle: false,
      showPagination: true,
      displayMode: "table",
    },
  },
  {
    id: "courses",
    label: "Classroom Courses",
    navLabel: "Courses",
    description: "Browse live classroom course records.",
    route: "courses",
    iconName: "BookOpen",
    iconComponent: BookOpen,
    dataSourceType: "api",
    endpoint: "/api/classroom/courses",
    createEntityDefinition: () => createClassroomCourseEntityDefinition(),
    allowedRoles: ["Principal", "School Admin", "School Coordinator", "HOD", "Teacher", "Examination Chair"],
    allowedCapabilities: ["Teaching", "Academic Leadership", "Analytics", "Reporting"],
    emptyStateTitle: "No classroom courses are available.",
    emptyStateDescription: "The live /api/classroom/courses feed did not return any rows for the selected context.",
    firstClassPageEnabled: true,
    drillThroughEnabled: true,
    status: "active",
    group: "People & Classroom",
    sourceLabel: "/api/classroom/courses",
    controlDefaults: {
      showSearch: true,
      showFilters: false,
      showSort: true,
      showDisplayModeToggle: false,
      showPagination: true,
      displayMode: "table",
    },
  },
  {
    id: "assignments",
    label: "Assignments",
    navLabel: "Assignments",
    description: "Browse class assignments and status.",
    route: "assignments",
    iconName: "FileText",
    iconComponent: FileText,
    dataSourceType: "api",
    endpoint: "/api/classroom/assignments",
    createEntityDefinition: () => createClassroomAssignmentEntityDefinition({ showCourseName: true }),
    allowedRoles: ["Principal", "School Admin", "School Coordinator", "HOD", "Teacher", "Examination Chair"],
    allowedCapabilities: ["Teaching", "Academic Leadership", "Analytics", "Reporting"],
    emptyStateTitle: "No assignments synchronized for this folder.",
    emptyStateDescription: "The selected course does not have any assignments yet.",
    firstClassPageEnabled: true,
    drillThroughEnabled: true,
    status: "active",
    group: "People & Classroom",
    sourceLabel: "/api/classroom/assignments",
    controlDefaults: {
      showSearch: true,
      showFilters: false,
      showSort: true,
      showDisplayModeToggle: false,
      showPagination: true,
      displayMode: "table",
    },
  },
  {
    id: "classroom-roster",
    label: "Classroom Roster",
    navLabel: "Roster",
    description: "Embedded SIS pupil roster inside Classroom Sync.",
    route: "classroom",
    iconName: "Users",
    iconComponent: Users,
    dataSourceType: "embedded",
    emptyStateTitle: "Roster stays embedded in Classroom Sync.",
    emptyStateDescription: "This list is intentionally kept inside the classroom page rather than promoted to a separate first-class registry page.",
    firstClassPageEnabled: false,
    drillThroughEnabled: false,
    status: "deferred",
    statusReason: "Embedded roster already has a safe classroom surface and does not need a separate page yet.",
    group: "Embedded",
    sourceLabel: "Classroom Sync",
    controlDefaults: {
      showSearch: false,
      showFilters: false,
      showSort: false,
      showDisplayModeToggle: false,
      showPagination: false,
      displayMode: "cards",
    },
  },
  {
    id: "workspace-files",
    label: "Workspace Files",
    navLabel: "Files",
    description: "Existing Search / UniversalSearch surface for workspace files.",
    route: "search",
    iconName: "FolderOpen",
    iconComponent: FolderOpen,
    dataSourceType: "embedded",
    emptyStateTitle: "Workspace files remain available in Search.",
    emptyStateDescription: "The files registry is already safely surfaced through the Search experience rather than a separate page.",
    firstClassPageEnabled: false,
    drillThroughEnabled: false,
    status: "deferred",
    statusReason: "Already covered by the Search / UniversalSearch surface.",
    group: "Embedded",
    sourceLabel: "Search",
    controlDefaults: {
      showSearch: true,
      showFilters: true,
      showSort: true,
      showDisplayModeToggle: true,
      showPagination: true,
      displayMode: "table",
    },
  },
  {
    id: "lesson-plans",
    label: "Lesson Plans",
    navLabel: "Lesson Plans",
    description: "Selection-driven lesson workspace and AI-assisted planning flow.",
    route: "lesson-plans",
    iconName: "BookOpen",
    iconComponent: BookOpen,
    dataSourceType: "embedded",
    emptyStateTitle: "Lesson Plans stay in the lesson workspace.",
    emptyStateDescription: "This surface is tightly coupled to editing and planning flows, so it should remain specialized for now.",
    firstClassPageEnabled: false,
    drillThroughEnabled: false,
    status: "deferred",
    statusReason: "Tightly coupled to LessonPlanner internals and AI flow.",
    group: "Deferred",
    sourceLabel: "LessonPlanner",
    controlDefaults: {
      showSearch: false,
      showFilters: false,
      showSort: false,
      showDisplayModeToggle: false,
      showPagination: false,
      displayMode: "table",
    },
  },
  {
    id: "textbooks",
    label: "Textbooks",
    navLabel: "NCERT Textbooks",
    description: "NCERT ingestion and audit workspace.",
    route: "textbooks",
    iconName: "BookOpen",
    iconComponent: BookOpen,
    dataSourceType: "embedded",
    emptyStateTitle: "NCERT ingestion stays in the textbook workspace.",
    emptyStateDescription: "This surface is tightly coupled to NCERT import and audit flows and should remain specialized for now.",
    firstClassPageEnabled: false,
    drillThroughEnabled: false,
    status: "deferred",
    statusReason: "Tightly coupled to TextbookIngestor / NCERT flows.",
    group: "Deferred",
    sourceLabel: "TextbookIngestor",
    controlDefaults: {
      showSearch: false,
      showFilters: false,
      showSort: false,
      showDisplayModeToggle: false,
      showPagination: false,
      displayMode: "table",
    },
  },
];

export function getRegistryCatalogEntry(registryId: string): RegistryCatalogEntry | undefined {
  return REGISTRY_CATALOG.find((entry) => entry.id === registryId);
}

export function getActiveRegistryCatalogEntries(): RegistryCatalogEntry[] {
  return REGISTRY_CATALOG.filter((entry) => entry.status === "active" && entry.firstClassPageEnabled);
}
