export const SEEDED_REGISTRY_STORAGE_KEYS = {
  masterDataRegistryUrl: "schooly_seeded_master_data_registry_sheet_url",
  ncertPrivateDriveMapUrl: "schooly_ncert_private_drive_map_sheet_url",
  lessonWorkspaceRegistryUrl: "schooly_seeded_lesson_workspace_registry_sheet_url",
  qaSqaaRegistryUrl: "schooly_seeded_qa_sqaa_registry_sheet_url",
  dashboardDataSourceUrl: "schooly_dashboard_sheet_url",
  assessmentResultRegistryUrl: "schooly_seeded_assessment_result_registry_sheet_url",
  classroomSyncRegistryUrl: "schooly_seeded_classroom_sync_registry_sheet_url",
  teacherCpdRenewalRegistryUrl: "schooly_teacher_cpd_renewal_registry_sheet_url",
  ncertRegistryUrl: "schooly_ncert_english_medium_registry_sheet_url",
  hodEnrichmentOlympiadRegistryUrl: "schooly_hod_enrichment_olympiad_registry_sheet_url",
  schoolyStrategicOperationsRegistryUrl: "schooly_strategic_operations_registry_sheet_url"
};

export const CANONICAL_DASHBOARD_SOURCE_DISPLAY_NAME = "Schooly_Dashboard_Source_SEEDED";
export const LEGACY_DASHBOARD_SOURCE_DISPLAY_NAME = "Schooly_Dashboard_Data_Source_SEEDED";

export const SEEDED_REGISTRY_DISPLAY_NAMES = {
  masterDataRegistry: "Schooly_Master_Data_Registry_SEEDED",
  ncertPrivateDriveMap: "Schooly_NCERT_Private_Drive_Map_SEEDED",
  lessonWorkspaceRegistry: "Schooly_Lesson_Workspace_Registry_SEEDED",
  qaSqaaRegistry: "Schooly_QA_SQAA_Registry_SEEDED",
  dashboardDataSource: CANONICAL_DASHBOARD_SOURCE_DISPLAY_NAME,
  assessmentResultRegistry: "Schooly_Assessment_Result_Registry_SEEDED",
  classroomSyncRegistry: "Schooly_Google_Classroom_Sync_Registry_SEEDED",
  teacherCpdRenewalRegistry: "Schooly_Teacher_CPD_Renewal_Registry_SEEDED",
  ncertRegistry: "Schooly_NCERT_English_Medium_Registry",
  schoolyStrategicOperationsRegistry: "Schooly_Strategic_Operations_Registry"
};

export interface SeededRegistryConfig {
  masterDataRegistryUrl: string;
  ncertPrivateDriveMapUrl: string;
  lessonWorkspaceRegistryUrl: string;
  qaSqaaRegistryUrl: string;
  dashboardDataSourceUrl: string;
  assessmentResultRegistryUrl: string;
  classroomSyncRegistryUrl: string;
  teacherCpdRenewalRegistryUrl: string;
  ncertRegistryUrl: string;
  hodEnrichmentOlympiadRegistryUrl: string;
  schoolyStrategicOperationsRegistryUrl: string;
}

export const DEFAULT_SEEDED_REGISTRY_CONFIG: SeededRegistryConfig = {
  masterDataRegistryUrl: "https://docs.google.com/spreadsheets/d/12HRgp9O0mkIh5tWSc1Ev0PRTlGPGhpcxAne-oG6MSNM/edit",
  ncertPrivateDriveMapUrl: "https://docs.google.com/spreadsheets/d/14G2oFjZJeLU9ktHDp9IbamolWj3JSZCBm7llZdz-GIg/edit",
  lessonWorkspaceRegistryUrl: "https://docs.google.com/spreadsheets/d/1W6qMty3KeA8v1-sSXgHoyaNnxSXcyU9hyMQGdz2LmKY/edit",
  qaSqaaRegistryUrl: "https://docs.google.com/spreadsheets/d/1xh8yPWUcHyLPqfsZE66HqLqtRI5rAykKNRhfhxn34xc/edit",
  dashboardDataSourceUrl: "https://docs.google.com/spreadsheets/d/1jz1VHYUKxOJ0Ia0H9J3MZvJVm15lktz7CF4XBI2Tb3Y/edit",
  assessmentResultRegistryUrl: "https://docs.google.com/spreadsheets/d/1qt7Tqr1ECpbIUJXd_Z0U_GcEtsTXxcTdp6x5khoMop0/edit",
  classroomSyncRegistryUrl: "https://docs.google.com/spreadsheets/d/1tqtChGXTyp04ogHaELJbMF1KR00thCUaOmZej_e6zx8/edit",
  teacherCpdRenewalRegistryUrl: "",
  ncertRegistryUrl: "https://docs.google.com/spreadsheets/d/1K5YkgmWWK7Br1kdTtjSZQBRnoxRfZu-goHUpH2ArMFk/edit",
  hodEnrichmentOlympiadRegistryUrl: "",
  schoolyStrategicOperationsRegistryUrl: ""
};

export function loadSeededRegistryConfig(): SeededRegistryConfig {
  try {
    return {
      masterDataRegistryUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.masterDataRegistryUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.masterDataRegistryUrl,
      ncertPrivateDriveMapUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.ncertPrivateDriveMapUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.ncertPrivateDriveMapUrl,
      lessonWorkspaceRegistryUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.lessonWorkspaceRegistryUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.lessonWorkspaceRegistryUrl,
      qaSqaaRegistryUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.qaSqaaRegistryUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.qaSqaaRegistryUrl,
      dashboardDataSourceUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.dashboardDataSourceUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.dashboardDataSourceUrl,
      assessmentResultRegistryUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.assessmentResultRegistryUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.assessmentResultRegistryUrl,
      classroomSyncRegistryUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.classroomSyncRegistryUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.classroomSyncRegistryUrl,
      teacherCpdRenewalRegistryUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.teacherCpdRenewalRegistryUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.teacherCpdRenewalRegistryUrl,
      ncertRegistryUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.ncertRegistryUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.ncertRegistryUrl,
      hodEnrichmentOlympiadRegistryUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.hodEnrichmentOlympiadRegistryUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.hodEnrichmentOlympiadRegistryUrl,
      schoolyStrategicOperationsRegistryUrl: localStorage.getItem(SEEDED_REGISTRY_STORAGE_KEYS.schoolyStrategicOperationsRegistryUrl) || DEFAULT_SEEDED_REGISTRY_CONFIG.schoolyStrategicOperationsRegistryUrl
    };
  } catch {
    return DEFAULT_SEEDED_REGISTRY_CONFIG;
  }
}

export function saveSeededRegistryConfig(config: Partial<SeededRegistryConfig>): void {
  try {
    Object.entries(config).forEach(([key, value]) => {
      const storageKey = SEEDED_REGISTRY_STORAGE_KEYS[key as keyof SeededRegistryConfig];
      if (storageKey) {
        localStorage.setItem(storageKey, String(value || "").trim());
      }
    });
  } catch (error) {
    console.warn("[SEEDED REGISTRY] Unable to persist seeded registry config.", error);
  }
}

export function getSavedSeededRegistryOverrides(): Partial<Record<keyof SeededRegistryConfig, string>> {
  const overrides: Partial<Record<keyof SeededRegistryConfig, string>> = {};
  try {
    Object.entries(SEEDED_REGISTRY_STORAGE_KEYS).forEach(([key, storageKey]) => {
      const saved = localStorage.getItem(storageKey)?.trim();
      const defaultValue = DEFAULT_SEEDED_REGISTRY_CONFIG[key as keyof SeededRegistryConfig]?.trim();
      if (saved && saved !== defaultValue) {
        overrides[key as keyof SeededRegistryConfig] = saved;
      }
    });
  } catch (error) {
    console.warn("[SEEDED REGISTRY] Unable to inspect saved registry overrides.", error);
  }
  return overrides;
}

export function resetSavedRegistryUrlsToDefaults(): void {
  try {
    Object.values(SEEDED_REGISTRY_STORAGE_KEYS).forEach((storageKey) => {
      localStorage.removeItem(storageKey);
    });
  } catch (error) {
    console.warn("[SEEDED REGISTRY] Unable to reset saved registry URLs.", error);
  }
}
