import React, { useState, useEffect } from "react";
import { ClassroomCourse, ClassroomAssignment, StudentDetails, TeacherDetails } from "../types";
import { loadConnectionConfig, FALLBACK_ALERT_MESSAGES } from "../lib/dataSourceEngine";
import GenericEntityListView from "./generic/GenericEntityListView";
import { createClassroomCourseEntityDefinition } from "../lib/classroomCourseEntityDefinition";
import { createClassroomAssignmentEntityDefinition } from "../lib/classroomAssignmentEntityDefinition";
import { 
  BookOpen, 
  AlertTriangle, 
  ExternalLink,
  Info
} from "lucide-react";

interface ClassroomManagerProps {
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  students: StudentDetails[];
  teachers: TeacherDetails[];
}

export default function ClassroomManager({
  courses,
  assignments,
  students,
  teachers
}: ClassroomManagerProps) {
  const [activeCourseId, setActiveCourseId] = useState<string>("course-sci-8");
  const selectedCourse = courses.find(c => c.id === activeCourseId) || courses[0];
  const courseDefinition = createClassroomCourseEntityDefinition();

  // Filters assignments for the active course
  const courseAssignments = assignments.filter(a => a.courseId === activeCourseId);
  const assignmentDefinition = createClassroomAssignmentEntityDefinition({
    courseName: selectedCourse?.name,
    studentCount: selectedCourse?.studentCount,
  });

  // Filters students associated with the specific course grade level
  // Let's assume all Grade 8 students belong to Grade 8 Science course-sci-8
  const activeStudents = selectedCourse?.id === "course-sci-8" 
    ? students.filter(s => s.gradeLevel.includes("Grade 8") || s.gradeLevel.includes("Grade 9"))
    : students.slice(0, 4); // otherwise show basic slice

  const classroomConfig = loadConnectionConfig("google_classroom");
  const isClassroomMock = classroomConfig.mode === "mock";

  return (
    <div className="space-y-6" id="classroom-intelligence-platform">
      {isClassroomMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3.5 items-start text-left animate-fade-in" id="classroom-fallback-banner">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5 shrink-0 shadow-2xs select-none">
            <AlertTriangle size={18} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-amber-900 uppercase font-sans tracking-tight">
              {FALLBACK_ALERT_MESSAGES.BANNER_HEADING}
            </h4>
            <p className="text-[11px] leading-relaxed text-amber-800 select-text font-sans">
              Google Classroom Streams are not connected yet. Add a Classroom setup link in Settings to sync current course modules and announcements.
            </p>
          </div>
        </div>
      )}

      {/* Decoupled School Digital Drive Governance Banner */}
      <div className="bg-slate-50 border border-slate-205 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between text-left font-sans">
        <div className="space-y-1">
          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wide">
            <Info size={14} className="text-blue-600 uppercase" />
            LMS DELIVERY LAYER STANDARDS
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
            Google Classroom acts as the interactive <strong>Delivery Layer</strong> synchronizing with core blueprints. 
            All standard classroom topics (<em>Weekly Planner, Remedial, Assessments</em>) utilize mandated template designations.
          </p>
        </div>
        <div className="text-[10px] font-mono text-slate-450 bg-white border border-slate-150 rounded-xl p-2 font-medium space-y-0.5 shrink-0">
          <div><strong className="text-slate-700">Topic Standards:</strong> admin-owned topics</div>
          <div><strong className="text-slate-700">Teacher Permission:</strong> Posting only (No creates/renames)</div>
          <div><strong className="text-slate-700">Knowledge Source:</strong> Academic Repository Root</div>
        </div>
      </div>

      {/* Course Selector */}
      <div id="courses-tabs-bar">
        <GenericEntityListView
          definition={courseDefinition}
          rows={courses}
          selectedRow={selectedCourse}
          onSelectRow={(course) => setActiveCourseId(course.id)}
          displayMode="table"
          showSearch={false}
          showFilters={false}
          showSort={false}
          showDisplayModeToggle={false}
          showPagination={false}
          className="bg-transparent border-0 shadow-none"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="classroom-dashboard-grid">
        {/* Left 2 Columns (Course Material & Assignments Tracker) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Announcements & Information Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="classroom-stream">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-500 font-bold" />
              Classroom Stream & Announcements
            </h3>
            
            <div className="space-y-3">
              {selectedCourse?.announcements.map((ann, index) => (
                <div key={index} className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-xl flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">{ann}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments Status and Grading Tracking */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="assignments-tracker-panel">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Classroom Assignments & Grade Status</h3>

            {courseAssignments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No assignments synchronized for this folder.</p>
            ) : (
              <GenericEntityListView
                definition={assignmentDefinition}
                rows={courseAssignments}
                displayMode="table"
                showSearch={false}
                showFilters={false}
                showSort={false}
                showDisplayModeToggle={false}
                showPagination={false}
                className="bg-transparent border-0 shadow-none"
              />
            )}
          </div>

          {/* Reference Materials & Course Folders */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="materials-indexer-panel">
            <h3 className="text-sm font-bold text-slate-900 mb-4 block">Material Indexes & Assets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-35">
              {selectedCourse?.materials.map((mat, idx) => (
                <div key={idx} className="p-3.5 border border-slate-150 rounded-xl hover:border-slate-300 hover:bg-slate-50/40 flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-2.5">
                    <BookOpen size={16} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">{mat.name}</span>
                  </div>
                  <a href={mat.url} className="text-blue-550 hover:text-blue-700 p-1">
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side Column (LMS Student Roster & SIS sync Indicators) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="student-risks-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Synced SIS Pupil Roster</h3>
              <span className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer">
                <Info size={14} title="Roster syncing via active cloud registers" />
              </span>
            </div>

            <div className="space-y-3">
              {activeStudents.map(std => (
                <div 
                  key={std.id}
                  className={`p-3.5 border rounded-xl transition-all space-y-2 ${
                    std.riskFactor === 'high' ? 'bg-rose-50/40 border-rose-100' :
                    std.riskFactor === 'medium' ? 'bg-amber-50/40 border-amber-100' :
                    'bg-slate-50/50 border-slate-100'
                  }`}
                  id={`std-item-${std.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{std.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{std.email}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-705 block font-mono">GPA {std.gpa.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">{std.gradeLevel}</span>
                    </div>
                  </div>

                  {/* Operational Risk alert */}
                  {std.riskScore && std.riskScore > 30 && (
                    <div className="flex items-center justify-between bg-white border border-slate-100 rounded-lg p-2 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                        <AlertTriangle size={12} className={std.riskFactor === 'high' ? "text-rose-500" : "text-amber-500"} />
                        <span>Risk Index: {std.riskScore}%</span>
                      </div>
                      <span className={`font-bold ${std.riskFactor === 'high' ? "text-rose-600" : "text-amber-600"} uppercase`}>
                        {std.riskFactor} Flag
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
