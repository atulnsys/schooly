import React, { useState, useEffect } from "react";
import { ClassroomCourse, ClassroomAssignment, StudentDetails, TeacherDetails } from "../types";
import { loadConnectionConfig, FALLBACK_ALERT_MESSAGES } from "../lib/dataSourceEngine";
import GenericEntityListView from "./generic/GenericEntityListView";
import { createClassroomCourseEntityDefinition } from "../lib/classroomCourseEntityDefinition";
import { createClassroomAssignmentEntityDefinition } from "../lib/classroomAssignmentEntityDefinition";
import { createClassroomStudentEntityDefinition } from "../lib/classroomStudentEntityDefinition";
import { StandardMetricGrid, StandardPageHeader } from "./common/StandardPageSurface";
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
  onOpenStudents?: () => void;
}

export default function ClassroomManager({
  courses,
  assignments,
  students,
  teachers,
  onOpenStudents
}: ClassroomManagerProps) {
  const [activeCourseId, setActiveCourseId] = useState<string | null>(courses[0]?.id || null);
  useEffect(() => {
    if (courses.length === 0) {
      setActiveCourseId(null);
      return;
    }
    if (!activeCourseId || !courses.some((course) => course.id === activeCourseId)) {
      setActiveCourseId(courses[0].id);
    }
  }, [courses, activeCourseId]);
  const selectedCourse = activeCourseId ? courses.find(c => c.id === activeCourseId) || null : null;
  const courseDefinition = createClassroomCourseEntityDefinition();
  const studentDefinition = createClassroomStudentEntityDefinition();

  // Filters assignments for the active course
  const courseAssignments = selectedCourse ? assignments.filter(a => a.courseId === selectedCourse.id) : [];
  const assignmentDefinition = createClassroomAssignmentEntityDefinition({
    courseName: selectedCourse?.name,
    studentCount: selectedCourse?.studentCount,
  });

  const activeStudents = selectedCourse
    ? students.filter((student) => {
        const courseClassLabel = String(selectedCourse.name || "")
          .split("|")[0]
          .trim()
          .replace(/\s+/g, " ");
        const studentGradeLabel = String(student.gradeLevel || "").trim().replace(/\s+/g, " ");
        if (!courseClassLabel || !studentGradeLabel) return false;
        const normalizedCourse = courseClassLabel.toLowerCase();
        const normalizedStudent = studentGradeLabel.toLowerCase();
        return normalizedStudent === normalizedCourse || normalizedStudent.includes(normalizedCourse) || normalizedCourse.includes(normalizedStudent);
      })
    : [];

  const classroomConfig = loadConnectionConfig("google_classroom");
  const isClassroomMock = classroomConfig.mode === "mock";

  return (
    <div className="space-y-6" id="classroom-intelligence-platform" data-schooly-page="classroom-page" data-schooly-page-layout="true">
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

      <StandardPageHeader
        eyebrow="Classroom Sync"
        title="Classroom sync and course roster"
        description="Google Classroom stays connected to the shared course list so teachers can review announcements, assignments, and student progress in one place."
        badges={(
          <>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Topics: admin-owned</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Teacher access: Post and review</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Source: Academic repository</span>
          </>
        )}
        actions={onOpenStudents ? (
          <button
            type="button"
            onClick={onOpenStudents}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-[10.5px] font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 cursor-pointer"
          >
            Open students
          </button>
        ) : null}
      />

      <StandardMetricGrid
        className="lg:grid-cols-4"
        items={[
          { label: "Courses", value: courses.length, tone: "blue" },
          { label: "Assignments in course", value: courseAssignments.length, tone: "amber" },
          { label: "Students in course", value: activeStudents.length, tone: "emerald" },
          { label: "Teachers", value: teachers.length, tone: "violet" },
        ]}
      />

      {/* Course Selector */}
      <div id="courses-tabs-bar">
        {courses.length > 0 ? (
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
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600 shadow-sm">
            Live data source not connected. Connect Google Classroom or the Classroom Sync registry to load course rows.
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="classroom-dashboard-grid">
        {/* Left 2 Columns (Course Material & Assignments Tracker) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Announcements & Information Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="classroom-stream">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-500 font-bold" />
              Classroom stream and announcements
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
            <h3 className="text-sm font-bold text-slate-900 mb-4">Assignments and status</h3>

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
            <h3 className="text-sm font-bold text-slate-900 mb-4 block">Materials</h3>
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
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Student roster</h3>
                <span className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer">
                  <Info size={14} title="Roster syncing via active cloud registers" />
                </span>
              </div>
              {onOpenStudents && (
                <button
                  type="button"
                  onClick={onOpenStudents}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-blue-700 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  Open students
                </button>
              )}
            </div>

            <GenericEntityListView
              definition={studentDefinition}
              rows={activeStudents}
              displayMode="cards"
              showSearch={false}
              showFilters={false}
              showSort={false}
              showDisplayModeToggle={false}
              showPagination={false}
              className="bg-transparent border-0 shadow-none"
              maxVisibleFields={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
