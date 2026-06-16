import React, { useMemo, useState } from "react";
import { Users, Info } from "lucide-react";
import { TeacherDetails } from "../types";
import GenericEntityPage from "./generic/GenericEntityPage";
import { createTeacherEntityDefinition } from "../lib/teacherEntityDefinition";

interface TeachersRegistryPageProps {
  teachers: TeacherDetails[];
  currentRole: string;
}

export default function TeachersRegistryPage({ teachers, currentRole }: TeachersRegistryPageProps) {
  const definition = useMemo(() => createTeacherEntityDefinition(), []);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDetails | null>(null);

  const liveCount = teachers.length;

  return (
    <div className="space-y-6 animate-fade-in" id="teachers-registry-page">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
              Teachers Registry
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              Live teacher roster
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl">
              Browse the live teacher feed as a first-class registry page. It uses the existing `/api/teachers` state that also powers the Classroom dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-sans font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              {liveCount} {liveCount === 1 ? "record" : "records"}
            </span>
            <span className="text-[10px] font-sans font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              Role: {currentRole}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <p>
            Data source: <span className="font-mono font-bold text-slate-700">/api/teachers</span>. If this feed is empty, the registry will show the generic empty state instead of synthetic rows.
          </p>
        </div>
      </div>

      <GenericEntityPage
        definition={definition}
        rows={teachers}
        selectedRow={selectedTeacher}
        onSelectRow={setSelectedTeacher}
        permissionContext={{ currentRole }}
        showSearch={true}
        showFilters={false}
        showSort={true}
        showDisplayModeToggle={false}
        showPagination={true}
      />
    </div>
  );
}
