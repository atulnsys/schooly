import React, { useMemo, useState } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import type { ClassroomAssignment, ClassroomCourse, StudentDetails, TeacherDetails, WorkspaceFile } from "../types";
import type { DashboardSourceState } from "../lib/dashboardDataResolver";
import type { SchoolRegistryState } from "../lib/schoolRegistry";
import {
  buildLiveDataReconciliationReport,
  reconciliationResultsToCsv,
  reconciliationResultsToMarkdown,
  reconciliationSummaryLabel,
  type LiveDataReconciliationReport,
} from "../lib/liveDataReconciliation";

interface LiveDataReconciliationPanelProps {
  files: WorkspaceFile[];
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  students: StudentDetails[];
  teachers: TeacherDetails[];
  schoolRegistry: SchoolRegistryState | null;
  dashboardSourceState: DashboardSourceState;
  principalDashboard: any;
  onRefreshSources?: () => Promise<void> | void;
}

function statusTone(status: LiveDataReconciliationReport["results"][number]["status"]): string {
  if (status === "pass") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "fail") return "bg-rose-50 text-rose-700 border-rose-100";
  if (status === "blocked") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function downloadText(filename: string, content: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function LiveDataReconciliationPanel({
  files,
  courses,
  assignments,
  students,
  teachers,
  schoolRegistry,
  dashboardSourceState,
  principalDashboard,
  onRefreshSources,
}: LiveDataReconciliationPanelProps) {
  const [report, setReport] = useState<LiveDataReconciliationReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const visibleResults = useMemo(
    () => report?.results.filter((result) => selectedCategory === "all" || result.category === selectedCategory) || [],
    [report, selectedCategory],
  );

  const categories = useMemo(() => Array.from(new Set(report?.results.map((result) => result.category) || [])), [report]);

  const runChecks = () => {
    setIsRunning(true);
    try {
      const nextReport = buildLiveDataReconciliationReport({
        files,
        courses,
        assignments,
        students,
        teachers,
        schoolRegistry,
        dashboardSourceState,
        principalDashboard,
      });
      setReport(nextReport);
    } finally {
      setIsRunning(false);
    }
  };

  const refreshSources = async () => {
    if (!onRefreshSources) return;
    setIsRefreshing(true);
    try {
      await onRefreshSources();
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportReport = (format: "json" | "csv" | "md") => {
    if (!report) return;
    if (format === "json") {
      downloadText("live-data-reconciliation.json", JSON.stringify(report, null, 2));
      return;
    }
    if (format === "csv") {
      downloadText("live-data-reconciliation.csv", reconciliationResultsToCsv(report));
      return;
    }
    downloadText("live-data-reconciliation.md", reconciliationResultsToMarkdown(report));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">Live Data Reconciliation</div>
          <h3 className="text-base font-extrabold text-slate-900">Verify KPI and list counts against registries</h3>
          <p className="text-xs text-slate-600 max-w-3xl">
            Read-only checks compare the live SchoolyTestDrive-backed sources with the values currently rendered by the app.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runChecks}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Search size={12} />
            {isRunning ? "Running..." : "Run Checks"}
          </button>
          <button
            type="button"
            onClick={refreshSources}
            disabled={isRefreshing || !onRefreshSources}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={12} />
            {isRefreshing ? "Refreshing..." : "Refresh Sources"}
          </button>
          <button
            type="button"
            onClick={() => exportReport("json")}
            disabled={!report}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Download size={12} />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => exportReport("csv")}
            disabled={!report}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              ["Total checks", report.summary.totalChecks],
              ["Passing", report.summary.passing],
              ["Failing", report.summary.failing],
              ["Blocked", report.summary.blocked],
              ["Not applicable", report.summary.notApplicable],
              ["Selected session", report.summary.selectedSession || "Pending"],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400">{label}</div>
                <div className="mt-0.5 text-sm font-bold text-slate-900">{String(value)}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              {reconciliationSummaryLabel(report)}
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              Last checked {new Date(report.summary.generatedAt).toLocaleString()}
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              Sources {report.sourceDiscovery.mappedSources}/{report.sourceDiscovery.discoveredFiles}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Category
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
              >
                <option value="all">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider font-mono text-slate-400">
                  <th className="py-2 pr-2">Page / KPI</th>
                  <th className="py-2 pr-2">Route</th>
                  <th className="py-2 pr-2">Registry source</th>
                  <th className="py-2 pr-2">Source rows</th>
                  <th className="py-2 pr-2">Eligible rows</th>
                  <th className="py-2 pr-2">UI value</th>
                  <th className="py-2 pr-2">Result</th>
                  <th className="py-2 pr-2">Mismatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleResults.map((result) => (
                  <tr key={result.id} className="align-top">
                    <td className="py-3 pr-2">
                      <div className="font-semibold text-slate-900">{result.surfaceName}</div>
                      <div className="text-[10px] text-slate-500">{result.category}</div>
                    </td>
                    <td className="py-3 pr-2 font-mono text-[10px] text-slate-600">{result.route}</td>
                    <td className="py-3 pr-2 text-[10px] text-slate-600">{result.sourceLabels.join(" / ")}</td>
                    <td className="py-3 pr-2 text-[10px] text-slate-600">{result.sourceRowCount ?? ""}</td>
                    <td className="py-3 pr-2 text-[10px] text-slate-600">{result.eligibleSourceRowCount ?? ""}</td>
                    <td className="py-3 pr-2 text-[10px] text-slate-600">{String(result.actualValue ?? "")}</td>
                    <td className="py-3 pr-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusTone(result.status)}`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2">
                      <div className="text-[10px] text-slate-600">
                        {result.mismatchType || "-"}
                      </div>
                      {result.notes && result.notes.length > 0 && (
                        <div className="mt-1 text-[10px] text-slate-500">{result.notes[0]}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
            <div className="font-bold text-slate-900 mb-1">Summary</div>
            <div>Source refresh result: {report.summary.sourceRefreshResult}</div>
            <div>Source discovery: {report.sourceDiscovery.mappedSources} mapped, {report.sourceDiscovery.unmappedFiles} unmapped.</div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Run the checks to compare the live registries against the current UI values.
        </div>
      )}
    </div>
  );
}
