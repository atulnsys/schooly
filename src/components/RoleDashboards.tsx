import React from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import type { RegistryHealthSummary } from "../types";

type StripMode = "full" | "warning" | "chip";

interface RoleDashboardsProps {
  role: string;
  summary: RegistryHealthSummary | null;
  mode?: StripMode;
  onOpenSetupCentre?: () => void;
}

export default function RoleDashboards({
  summary,
  mode = "chip"
}: RoleDashboardsProps) {
  if (!summary) return null;
  if (mode !== "chip") return null;

  const hasIssues = summary.criticalRegistries > 0 || summary.warningRegistries > 0 || summary.onboardingStatus === "Setup incomplete";
  const statusTone = hasIssues
    ? summary.criticalRegistries > 0
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-amber-200 bg-amber-50 text-amber-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusTone}`}>
      {hasIssues ? <AlertTriangle size={12} /> : <Sparkles size={12} />}
      <span>{hasIssues ? "Setup incomplete" : summary.onboardingStatus}</span>
    </div>
  );
}
