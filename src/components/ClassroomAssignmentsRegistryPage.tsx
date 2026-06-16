import React, { useMemo, useState } from "react";
import { FileText, Info } from "lucide-react";
import { ClassroomAssignment } from "../types";
import GenericEntityPage from "./generic/GenericEntityPage";
import { createClassroomAssignmentEntityDefinition } from "../lib/classroomAssignmentEntityDefinition";

interface ClassroomAssignmentsRegistryPageProps {
  assignments: ClassroomAssignment[];
  currentRole: string;
}

export default function ClassroomAssignmentsRegistryPage({ assignments, currentRole }: ClassroomAssignmentsRegistryPageProps) {
  const definition = useMemo(
    () => createClassroomAssignmentEntityDefinition({ showCourseName: true }),
    [],
  );
  const [selectedAssignment, setSelectedAssignment] = useState<ClassroomAssignment | null>(null);

  return (
    <div className="space-y-6 animate-fade-in" id="classroom-assignments-registry-page">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider font-mono text-blue-600 font-bold">
              Assignments
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Live assignment registry
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl">
              Browse the live assignment feed as a first-class registry page. It reuses the same data that powers the classroom assignment tracker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-sans font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              {assignments.length} {assignments.length === 1 ? "record" : "records"}
            </span>
            <span className="text-[10px] font-sans font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              Role: {currentRole}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <p>
            Data source: <span className="font-mono font-bold text-slate-700">/api/classroom/assignments</span>. If this feed is empty, the registry will show the generic empty state instead of synthetic rows.
          </p>
        </div>
      </div>

      <GenericEntityPage
        definition={definition}
        rows={assignments}
        selectedRow={selectedAssignment}
        onSelectRow={setSelectedAssignment}
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
