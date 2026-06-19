import type { WorkspaceFile } from "../types";
import {
  CANONICAL_DASHBOARD_SOURCE_DISPLAY_NAME,
  SEEDED_REGISTRY_DISPLAY_NAMES,
  type SeededRegistryConfig,
} from "./seededRegistryConfig";

export interface RegistrySourceDiscoveryMatch {
  key: keyof SeededRegistryConfig;
  label: string;
  fileId: string;
  fileName: string;
  webViewLink: string;
}

export interface RegistrySourceDiscoveryResult {
  discoveredRegistryFiles: WorkspaceFile[];
  mappedSources: RegistrySourceDiscoveryMatch[];
  unmappedRegistryFiles: WorkspaceFile[];
  config: Partial<SeededRegistryConfig>;
}

interface RegistrySourceDiscoveryRule {
  key: keyof SeededRegistryConfig;
  label: string;
  aliases: string[];
}

function normalizeDiscoveryToken(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(candidate: string, alias: string): number {
  const normalizedCandidate = normalizeDiscoveryToken(candidate);
  const normalizedAlias = normalizeDiscoveryToken(alias);
  if (!normalizedCandidate || !normalizedAlias) return 0;
  if (normalizedCandidate === normalizedAlias) return 5;
  if (normalizedCandidate.startsWith(normalizedAlias) || normalizedCandidate.endsWith(normalizedAlias)) return 4;
  if (normalizedCandidate.includes(normalizedAlias)) return 3;
  if (normalizedAlias.includes(normalizedCandidate)) return 2;
  return 0;
}

function getBestRuleMatch(file: WorkspaceFile, rules: RegistrySourceDiscoveryRule[]): RegistrySourceDiscoveryRule | null {
  const candidateText = [file.name, file.path].filter(Boolean).join(" ");
  let bestRule: RegistrySourceDiscoveryRule | null = null;
  let bestScore = 0;

  for (const rule of rules) {
    const ruleScore = rule.aliases.reduce((max, alias) => Math.max(max, scoreMatch(candidateText, alias)), 0);
    if (ruleScore > bestScore) {
      bestScore = ruleScore;
      bestRule = rule;
    }
  }

  return bestScore > 0 ? bestRule : null;
}

const REGISTRY_DISCOVERY_RULES: RegistrySourceDiscoveryRule[] = [
  {
    key: "masterDataRegistryUrl",
    label: "Master Registry",
    aliases: [
      SEEDED_REGISTRY_DISPLAY_NAMES.masterDataRegistry,
      "Schooly_Master_Data_Registry",
      "Schooly_Master_Data_Registry_SEEDED",
      "Master Registry",
      "Master Data Registry",
    ],
  },
  {
    key: "ncertPrivateDriveMapUrl",
    label: "NCERT Private Map",
    aliases: [
      SEEDED_REGISTRY_DISPLAY_NAMES.ncertPrivateDriveMap,
      "Schooly_NCERT_Private_Drive_Map",
      "NCERT Private Map",
      "NCERT Drive Source Folders",
    ],
  },
  {
    key: "lessonWorkspaceRegistryUrl",
    label: "Lesson Workspace Registry",
    aliases: [
      SEEDED_REGISTRY_DISPLAY_NAMES.lessonWorkspaceRegistry,
      "Schooly_Lesson_Workspace_Registry",
      "Lesson Workspace Registry",
      "Lesson Workspace",
    ],
  },
  {
    key: "qaSqaaRegistryUrl",
    label: "QA/SQAA Registry",
    aliases: [
      SEEDED_REGISTRY_DISPLAY_NAMES.qaSqaaRegistry,
      "Schooly_QA_SQAA_Registry",
      "QA/SQAA Registry",
      "QA SQAA Registry",
    ],
  },
  {
    key: "dashboardDataSourceUrl",
    label: "Dashboard Data Source",
    aliases: [
      CANONICAL_DASHBOARD_SOURCE_DISPLAY_NAME,
      "Schooly_Dashboard_Source",
      "Schooly_Dashboard_Source_SEEDED",
      "Schooly_Dashboard_Data_Source_SEEDED",
      "Dashboard Data Source",
      "Dashboard Source",
    ],
  },
  {
    key: "assessmentResultRegistryUrl",
    label: "Assessment/Result Registry",
    aliases: [
      SEEDED_REGISTRY_DISPLAY_NAMES.assessmentResultRegistry,
      "Schooly_Assessment_Result_Registry",
      "Assessment Result Registry",
      "Assessment/Result Registry",
    ],
  },
  {
    key: "classroomSyncRegistryUrl",
    label: "Google Classroom Sync Registry",
    aliases: [
      SEEDED_REGISTRY_DISPLAY_NAMES.classroomSyncRegistry,
      "Schooly_Google_Classroom_Sync_Registry",
      "Google Classroom Sync Registry",
      "Classroom Sync Registry",
      "Classroom Sync",
    ],
  },
  {
    key: "teacherCpdRenewalRegistryUrl",
    label: "Teacher CPD Renewal Registry",
    aliases: [
      SEEDED_REGISTRY_DISPLAY_NAMES.teacherCpdRenewalRegistry,
      "Schooly_Teacher_CPD_Renewal_Registry",
      "Teacher CPD Renewal Registry",
    ],
  },
  {
    key: "ncertRegistryUrl",
    label: "NCERT English Medium Registry",
    aliases: [
      SEEDED_REGISTRY_DISPLAY_NAMES.ncertRegistry,
      "Schooly_NCERT_English_Medium_Registry",
      "NCERT English Medium Registry",
      "NCERT Registry",
    ],
  },
  {
    key: "hodEnrichmentOlympiadRegistryUrl",
    label: "Schooly Enrichment Olympiad Registry",
    aliases: [
      "Schooly_Enrichment_Olympiad_Registry",
      "Enrichment Olympiad Registry",
    ],
  },
  {
    key: "schoolyStrategicOperationsRegistryUrl",
    label: "Schooly Strategic Operations Registry",
    aliases: [
      SEEDED_REGISTRY_DISPLAY_NAMES.schoolyStrategicOperationsRegistry,
      "Schooly_Strategic_Operations_Registry",
      "Strategic Operations Registry",
    ],
  },
];

export function discoverRegistrySources(files: WorkspaceFile[]): RegistrySourceDiscoveryResult {
  const discoveredRegistryFiles = (files || []).filter((file) => file.type === "sheet" && Boolean(file.webViewLink));
  const mappedSources: RegistrySourceDiscoveryMatch[] = [];
  const mappedFileIds = new Set<string>();
  const config: Partial<SeededRegistryConfig> = {};

  for (const rule of REGISTRY_DISCOVERY_RULES) {
    const match = discoveredRegistryFiles
      .filter((file) => !mappedFileIds.has(file.id))
      .map((file) => ({
        file,
        score: getBestRuleMatch(file, [rule]) ? 1 : 0,
      }))
      .filter((entry) => entry.score > 0)
      .map((entry) => entry.file)[0];

    if (!match) continue;

    const webViewLink = String(match.webViewLink || "").trim();
    if (!webViewLink) continue;

    config[rule.key] = webViewLink;
    mappedFileIds.add(match.id);
    mappedSources.push({
      key: rule.key,
      label: rule.label,
      fileId: match.id,
      fileName: match.name,
      webViewLink,
    });
  }

  const unmappedRegistryFiles = discoveredRegistryFiles.filter((file) => !mappedFileIds.has(file.id));

  return {
    discoveredRegistryFiles,
    mappedSources,
    unmappedRegistryFiles,
    config,
  };
}
