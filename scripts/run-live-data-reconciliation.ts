import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import {
  buildLiveDataReconciliationReport,
  reconciliationResultsToMarkdown,
  reconciliationSummaryLabel,
} from "../src/lib/liveDataReconciliation";
import { loadDashboardData } from "../src/lib/dashboardDataResolver";
import { loadSchoolRegistry } from "../src/lib/schoolRegistry";
import { buildStudentDetailsFromRegistry, buildTeacherDetailsFromStaffDirectory } from "../src/lib/liveSchoolEntityBuilders";
import { saveSeededRegistryConfig } from "../src/lib/seededRegistryConfig";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const artifactsDir = join(repoRoot, "artifacts");
const docsDir = join(repoRoot, "docs");
const serverEntry = join(repoRoot, "dist", "server.cjs");
const baseUrl = "http://127.0.0.1:3001";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function ensureLocalStorageShim() {
  if (typeof globalThis.localStorage !== "undefined") return;
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => store.get(String(key)) || null,
      setItem: (key: string, value: string) => {
        store.set(String(key), String(value));
      },
      removeItem: (key: string) => {
        store.delete(String(key));
      },
      clear: () => {
        store.clear();
      },
      key: (index: number) => Array.from(store.keys())[index] || null,
      get length() {
        return store.size;
      },
    },
    configurable: true,
  });
}

function seedLiveSchoolTestDriveRegistryUrls() {
  saveSeededRegistryConfig({
    masterDataRegistryUrl: "https://docs.google.com/spreadsheets/d/12HRgp9O0mkIh5tWSc1Ev0PRTlGPGhpcxAne-oG6MSNM/edit",
    dashboardDataSourceUrl: "https://docs.google.com/spreadsheets/d/1jz1VHYUKxOJ0Ia0H9J3MZvJVm15lktz7CF4XBI2Tb3Y/edit",
    lessonWorkspaceRegistryUrl: "https://docs.google.com/spreadsheets/d/1ZI4bUwEEfSqfrfsBe4KPf9SJSoleplIuF9yu5nZL_rg/edit",
    qaSqaaRegistryUrl: "https://docs.google.com/spreadsheets/d/1xh8yPWUcHyLPqfsZE66HqLqtRI5rAykKNRhfhxn34xc/edit",
    classroomSyncRegistryUrl: "https://docs.google.com/spreadsheets/d/1tqtChGXTyp04ogHaELJbMF1KR00thCUaOmZej_e6zx8/edit",
    assessmentResultRegistryUrl: "https://docs.google.com/spreadsheets/d/1qt7Tqr1ECpbIUJXd_Z0U_GcEtsTXxcTdp6x5khoMop0/edit",
    ncertRegistryUrl: "https://docs.google.com/spreadsheets/d/1K5YkgmWWK7Br1kdTtjSZQBRnoxRfZu-goHUpH2ArMFk/edit",
    ncertPrivateDriveMapUrl: "https://docs.google.com/spreadsheets/d/14G2oFjZJeLU9ktHDp9IbamolWj3JSZCBm7llZdz-GIg/edit",
    teacherCpdRenewalRegistryUrl: "",
    hodEnrichmentOlympiadRegistryUrl: "",
    schoolyStrategicOperationsRegistryUrl: "",
  });
}

async function serverIsReady(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/classroom/courses`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer(): Promise<{ started: boolean; pid?: number }> {
  if (await serverIsReady()) {
    return { started: false };
  }

  const child = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    stdio: "ignore",
    windowsHide: true,
  });

  const pid = child.pid;
  if (!pid) {
    throw new Error("Unable to start the local server process.");
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await serverIsReady()) {
      return { started: true, pid };
    }
    await sleep(1000);
  }

  throw new Error("Local server did not become ready within 20 seconds.");
}

async function stopServer(pid?: number) {
  if (!pid) return;
  await new Promise<void>((resolve) => {
    const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    killer.on("exit", () => resolve());
    killer.on("error", () => resolve());
  });
}

async function main() {
  await mkdir(artifactsDir, { recursive: true });
  await mkdir(docsDir, { recursive: true });

  const server = await ensureServer();

  try {
    ensureLocalStorageShim();
    seedLiveSchoolTestDriveRegistryUrls();
    const [files, courses, assignments, schoolRegistry, dashboardData] = await Promise.all([
      fetchJson<any[]>(`${baseUrl}/api/workspace/files`),
      fetchJson<any[]>(`${baseUrl}/api/classroom/courses`),
      fetchJson<any[]>(`${baseUrl}/api/classroom/assignments`),
      loadSchoolRegistry(),
      loadDashboardData({ roleView: "principal" }),
    ]);

    const students = buildStudentDetailsFromRegistry(
      schoolRegistry?.studentDirectory || [],
      schoolRegistry?.studentEnrollment || [],
    );
    const teachers = buildTeacherDetailsFromStaffDirectory(
      schoolRegistry?.staffDirectory || [],
      schoolRegistry?.teacherAllocations || [],
    );

    const report = buildLiveDataReconciliationReport({
      files: Array.isArray(files) ? files : [],
      courses: Array.isArray(courses) ? courses : [],
      assignments: Array.isArray(assignments) ? assignments : [],
      students,
      teachers,
      schoolRegistry,
      dashboardSourceState: dashboardData.sourceState,
      principalDashboard: dashboardData.principal,
    });

    const jsonPath = join(artifactsDir, "live-data-reconciliation.json");
    const markdownPath = join(docsDir, "LIVE_DATA_RECONCILIATION_REPORT.md");

    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(
      markdownPath,
      [
        "# Live Data Reconciliation Report",
        "",
        "Read-only verification against the live SchoolyTestDrive-backed sources.",
        "",
        `Summary: ${reconciliationSummaryLabel(report)}`,
        `Totals: ${report.summary.totalChecks} total | ${report.summary.passing} passing | ${report.summary.failing} failing | ${report.summary.blocked} blocked | ${report.summary.notApplicable} not applicable`,
        `Selected session: ${report.summary.selectedSession || "Unknown"}`,
        `Generated at: ${report.summary.generatedAt}`,
        `Source refresh result: ${report.summary.sourceRefreshResult}`,
        `Source discovery: ${report.sourceDiscovery.mappedSources} mapped, ${report.sourceDiscovery.unmappedFiles} unmapped from ${report.sourceDiscovery.discoveredFiles} discovered files.`,
        "",
        ...report.results
          .filter((result) => result.status !== "pass")
          .map((result) => `- ${result.category} / ${result.surfaceName}: ${result.status}${result.mismatchType ? ` (${result.mismatchType})` : ""}`),
        "",
        reconciliationResultsToMarkdown(report),
      ].join("\n"),
      "utf8",
    );

    const failingResults = report.results.filter((result) => result.status === "fail");
    const blockedResults = report.results.filter((result) => result.status === "blocked");

    console.log(`Live data reconciliation complete: ${reconciliationSummaryLabel(report)}`);
    console.log(`Passing: ${report.summary.passing}, Failing: ${report.summary.failing}, Blocked: ${report.summary.blocked}, Not applicable: ${report.summary.notApplicable}`);
    if (failingResults.length > 0) {
      console.log("Mismatches:");
      for (const result of failingResults) {
        console.log(`- ${result.category} / ${result.surfaceName} -> ${result.mismatchType || "mismatch"}`);
      }
    }
    if (blockedResults.length > 0) {
      console.log("Blocked:");
      for (const result of blockedResults) {
        console.log(`- ${result.category} / ${result.surfaceName}`);
      }
    }
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${markdownPath}`);
  } finally {
    if (server.started) {
      await stopServer(server.pid);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
