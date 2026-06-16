import React from "react";
import { ExternalLink, Star } from "lucide-react";
import { WorkspaceFile } from "../types";
import { GenericEntityDefinition } from "./genericEntityView";

export function sanitizeWorkspaceFileText(text: string, isStudent: boolean): string {
  if (!isStudent) return text;

  return text
    .replace(/Academic Repository/gi, "Study materials")
    .replace(/School Drive Structure/gi, "Class materials")
    .replace(/Governance/gi, "Class feedback")
    .replace(/Manifest/gi, "Assignments")
    .replace(/Schema/gi, "Assessments")
    .replace(/Workflow Automation Builder/gi, "Class updates");
}

export function getWorkspaceFileVisibilityDetails(file: WorkspaceFile) {
  const source = file.source || "Drive";
  let accessContext = "Shared with you";
  let schoolArea = "Google Drive";

  if (file.source === "Classroom" || file.type === "classroom_material") {
    accessContext = "Class material";
    schoolArea = "Google Classroom";
  } else if (
    file.sharingRule?.toLowerCase().includes("private") ||
    file.sharingRule?.toLowerCase().includes("only") ||
    file.sharingRule?.toLowerCase().includes("department")
  ) {
    accessContext = "Leadership/Admin";
    schoolArea = "School files";
  } else if (file.sharingRule?.toLowerCase().includes("public")) {
    accessContext = "Shared with you";
    schoolArea = "School files";
  } else if (file.source === "Shared Drive" || file.source === "Drive") {
    accessContext = "Shared with you";
    schoolArea = "Google Drive";
  }

  return { source, accessContext, schoolArea };
}

interface WorkspaceFileEntityDefinitionOptions {
  currentRole: string;
  onToggleFavorite?: (id: string) => void;
}

export function createWorkspaceFileEntityDefinition({
  currentRole,
  onToggleFavorite,
}: WorkspaceFileEntityDefinitionOptions): GenericEntityDefinition<WorkspaceFile> {
  const isStudent = currentRole === "Student";

  return {
    entityName: "Workspace File",
    entityNamePlural: "Workspace Files",
    description: "Indexed files and classroom materials available to the current user.",
    getId: (file) => file.id,
    getTitle: (file) => sanitizeWorkspaceFileText(file.name, isStudent),
    getSubtitle: (file) => `${file.source} · ${file.type}`,
    getSummary: (file) => sanitizeWorkspaceFileText(file.contentSum, isStudent),

    searchPlaceholder: "Search metadata, documents, folders, owners, and tags...",
    emptyTitle: "No workspace files found.",
    emptyDescription: "Adjust search terms, source filters, or tag filters and try again.",

    defaultDisplayMode: "cards",
    defaultPageSize: 20,
    defaultSort: {
      fieldKey: "modifiedAt",
      direction: "desc",
    },

    fields: [
      {
        key: "name",
        label: "Title",
        type: "text",
        searchable: true,
        sortable: true,
        listVisible: false,
        detailVisible: true,
        required: true,
        getValue: (file) => sanitizeWorkspaceFileText(file.name, isStudent),
      },
      {
        key: "type",
        label: "Type",
        type: "badge",
        searchable: true,
        filterable: true,
        sortable: true,
      },
      {
        key: "source",
        label: "Source",
        type: "badge",
        searchable: true,
        filterable: true,
        sortable: true,
        getBadgeVariant: (file) => {
          if (file.source === "Classroom") return "success";
          if (file.source === "Shared Drive") return "info";
          if (file.source === "Gmail") return "warning";
          return "default";
        },
      },
      {
        key: "path",
        label: "Path",
        type: "text",
        searchable: true,
        maxListChars: 80,
        getValue: (file) => sanitizeWorkspaceFileText(file.path, isStudent),
      },
      {
        key: "owner",
        label: "Owner",
        type: "text",
        searchable: true,
        filterable: true,
        sortable: true,
      },
      {
        key: "modifiedAt",
        label: "Modified",
        type: "date",
        sortable: true,
      },
      {
        key: "sharingRule",
        label: "Sharing",
        type: "badge",
        searchable: true,
        filterable: true,
        getBadgeVariant: (file) => {
          if (file.sharingRule === "Public") return "success";
          if (file.sharingRule === "Private") return "danger";
          if (file.sharingRule === "Department Only") return "warning";
          return "info";
        },
      },
      {
        key: "size",
        label: "Size",
        type: "text",
      },
      {
        key: "contentSum",
        label: "Summary",
        type: "longText",
        searchable: true,
        listVisible: false,
        detailVisible: true,
        required: true,
        getValue: (file) => sanitizeWorkspaceFileText(file.contentSum, isStudent),
      },
      {
        key: "tags",
        label: "Tags",
        type: "tags",
        searchable: true,
        filterable: true,
        getFilterValues: (file) => file.tags,
      },
      {
        key: "accessContext",
        label: "Access Context",
        type: "badge",
        listVisible: true,
        detailVisible: true,
        searchable: true,
        filterable: true,
        getValue: (file) => getWorkspaceFileVisibilityDetails(file).accessContext,
        getBadgeVariant: (file) => {
          const access = getWorkspaceFileVisibilityDetails(file).accessContext;
          if (access === "Class material") return "success";
          if (access === "Leadership/Admin") return "warning";
          return "info";
        },
      },
      {
        key: "schoolArea",
        label: "Workspace Area",
        type: "badge",
        listVisible: true,
        detailVisible: true,
        searchable: true,
        filterable: true,
        getValue: (file) =>
          sanitizeWorkspaceFileText(getWorkspaceFileVisibilityDetails(file).schoolArea, isStudent),
      },
      {
        key: "webViewLink",
        label: "Open Link",
        type: "link",
        listVisible: false,
        detailVisible: true,
      },
    ],

    sections: [
      {
        id: "basic",
        title: "Basic Details",
        fields: ["type", "source", "owner", "modifiedAt", "sharingRule", "size"],
      },
      {
        id: "location",
        title: "Location and Access",
        fields: ["path", "accessContext", "schoolArea", "webViewLink"],
      },
      {
        id: "content",
        title: "Content Summary",
        fields: ["contentSum"],
      },
    ],

    getRowIssues: (file) => {
      const issues = [];

      if (!file.tags || file.tags.length === 0) {
        issues.push({
          id: "missing_tags",
          message: "No metadata tags assigned.",
          severity: "warning" as const,
          fieldKey: "tags",
        });
      }

      if (!file.webViewLink && file.source === "Drive") {
        issues.push({
          id: "missing_drive_link",
          message: "Drive file does not have an openable web link.",
          severity: "info" as const,
          fieldKey: "webViewLink",
        });
      }

      return issues;
    },

    actions: [
      {
        id: "favorite",
        label: "Mark Favorite",
        getLabel: (file) => (file.isFavorite ? "Favorite" : "Mark Favorite"),
        icon: <Star size={12} className="shrink-0" />,
        placement: "both",
        variant: "secondary",
        hidden: () => !onToggleFavorite,
        onClick: (file) => onToggleFavorite?.(file.id),
      },
      {
        id: "open",
        label: "Open File",
        icon: <ExternalLink size={12} className="shrink-0" />,
        placement: "detail",
        variant: "primary",
        hidden: (file) => !file.webViewLink,
        getHref: (file) => file.webViewLink,
        target: "_blank",
      },
    ],
  };
}
