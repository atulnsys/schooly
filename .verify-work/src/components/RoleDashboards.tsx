import React, { useState } from "react";
import { 
  Database, 
  BarChart2, 
  CheckSquare, 
  Clock, 
  Award, 
  UserCheck, 
  Bell, 
  Calendar, 
  Download, 
  RefreshCw, 
  Sliders, 
  Sparkles, 
  Plus, 
  Check, 
  Send, 
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  BookOpen
} from "lucide-react";
import { WorkspaceFile, ClassroomCourse, TaskItem, StudentDetails } from "../types";

interface RoleDashboardsProps {
  role: "admin" | "manager" | "hr" | "exams" | "parent" | "student";
  currentUser: string;
  currentRole: string;
  files: WorkspaceFile[];
  courses: ClassroomCourse[];
  tasks: TaskItem[];
  students: StudentDetails[];
  renderWelcomeHeader: () => React.ReactNode;
  logAction?: (user: string, role: string, action: string, detail: string, category: string) => void;
}

export default function RoleDashboards({
  role,
  currentUser,
  currentRole,
  files,
  courses,
  tasks,
  students,
  renderWelcomeHeader,
  logAction
}: RoleDashboardsProps) {
  
  const triggerLog = (actionName: string, detail: string, type: string = "task") => {
    if (logAction) {
      logAction(currentUser, currentRole, actionName, detail, type);
    } else {
      console.log(`[Action Logged] ${actionName}: ${detail}`);
    }
  };

  // 1. Parent Dashboard State
  const [parentAdvisoryTickets, setParentAdvisoryTickets] = useState([
    { id: "t-1", subject: "Grade 8 AP Preparatory Classes Coordination", status: "Resolved", date: "May 10" },
    { id: "t-2", subject: "School Bus Transport Route 4 GPS Sync", status: "Resolved", date: "May 15" },
    { id: "t-3", subject: "CBSE Mathematics UT4 Syllabus Alignment Clarification", status: "Open", date: "May 24" }
  ]);
  const [parentNewTicketSubject, setParentNewTicketSubject] = useState("");

  // 2. HR Dashboard State
  const [hrLeaveReview, setHrLeaveReview] = useState([
    { id: "lv-1", name: "Ms. Sunita Mehta", type: "Sick Leave", date: "Wed 27 May", status: "Review Required" },
    { id: "lv-2", name: "Mr. Rahul Kapoor", type: "Casual Leave", date: "Fri 29 May", status: "Approved" }
  ]);

  // 3. Student Dashboard State
  const [studentTasksList, setStudentTasksList] = useState([
    { id: "s-task-1", title: "AP Chemistry assignment 6: Molecular bonding quiz", deadline: "Overdue (Due Monday)", classSec: "Chemistry AP", completed: false },
    { id: "s-task-2", title: "Algebra Chapter 5 Workbook equations 1-20", deadline: "Due Friday", classSec: "Mathematics", completed: false },
    { id: "s-task-3", title: "SST Project submission CBSE Syllabus Stage 1", deadline: "Due in 3 days", classSec: "History / Civics", completed: true }
  ]);

  // 4. Admin Dashboard State
  const [adminSyncActive, setAdminSyncActive] = useState(false);

  // Define each dashboard layout
  if (role === "admin") {
    return (
      <div className="space-y-6 mt-6 animate-fade-in" id="admin-specific-dashboard-zones">
        {renderWelcomeHeader()}
        
        {/* 1. KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-kpi-cards-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">API Gateways</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">12 Integrations</div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Google Drive + Classroom API Linked
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Data Registers</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">8 Core Repos</div>
            </div>
            <div className="mt-2 text-[11.5px] text-slate-500 font-sans leading-tight">
              {files.length + courses.length + tasks.length} records in memory cache
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Active Policies</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">16 Rules Enforced</div>
            </div>
            <div className="mt-2 text-[11.5px] text-indigo-600 font-semibold font-sans leading-tight">
              Real-time file manifest audits
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">System Sync</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">ONLINE</div>
            </div>
            <div className="mt-2 text-[11.5px] text-slate-500 font-sans leading-tight">
              LMS + Cloud Drives healthy
            </div>
          </div>
        </div>

        {/* 2. Detailed Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="admin-dashboard-details">
          {/* Left Card: System Sync Configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="text-red-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">System Governance & API Gateway Sync</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase">Live Scope</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-mono tracking-wider">
                    <th className="py-2.5 font-extrabold">API Service</th>
                    <th className="py-2.5 font-extrabold">Scope</th>
                    <th className="py-2.5 font-extrabold">Sync State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">Google Drive Ingestion</td>
                    <td className="py-3 font-mono text-slate-500 text-[10px]">metadata-only</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] rounded-md uppercase">Connected</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">Google Classroom Sync</td>
                    <td className="py-3 font-mono text-slate-500 text-[10px]">read-write-grade</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] rounded-md uppercase">Connected</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">PowerSchool SIS Node</td>
                    <td className="py-3 font-mono text-slate-500 text-[10px]">bidirectional</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-violet-50 text-violet-750 border border-violet-150 font-bold text-[9px] rounded-md uppercase">Active Synced</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">Schema Agreement Engine</td>
                    <td className="py-3 font-mono text-slate-500 text-[10px]">full-control</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] rounded-md uppercase">Connected</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  alert("Executing system-wide API latency ping...\nAll gateway interfaces responded in < 45ms.\nDiagnostic check succeeded.");
                  triggerLog("Trigger Diagnostic Ping", "Executed API latency response ping diagnostic check", "task");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-3xs border-none"
              >
                Trigger Diagnostic Audit Ping
              </button>
            </div>
          </div>

          {/* Right Card: Database Registry & Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="text-emerald-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">Active Database Collections & File Registries</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-750 px-2 py-0.5 rounded-md font-bold uppercase">Health Validated</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Workspace Files Core Record Set</span>
                  <p className="text-[10px] text-slate-450 font-medium">Mapped files cataloged by workspace ingestor</p>
                </div>
                <span className="font-mono font-bold text-slate-700">{files.length} records</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Google Classrooms Active Map</span>
                  <p className="text-[10px] text-slate-450 font-medium">Synced classroom objects linking teachers & rosters</p>
                </div>
                <span className="font-mono font-bold text-slate-700">{courses.length} courses</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Compliance Administrative Tasks</span>
                  <p className="text-[10px] text-slate-450 font-medium">Task list scheduler containing system alerts</p>
                </div>
                <span className="font-mono font-bold text-slate-700">{tasks.length} tasks</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  alert("Compiling fresh manifest representation and rebuilding local database indices... State synchronized.");
                  triggerLog("Rebuild Indices Triggered", "Recompiled database indices and cleared cache schemas.", "task");
                }}
                className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 border border-slate-200 bg-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Rebuild Schema Indices
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Audit log CSV compiled and dispatched to download spooler.");
                  triggerLog("Audit Logs Exported", "Downloaded secure administrative CSV logging schema events.", "task");
                }}
                className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 border border-slate-200 bg-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Export Administrative Audit Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "manager") {
    return (
      <div className="space-y-6 mt-6 animate-fade-in" id="manager-specific-dashboard-zones">
        {renderWelcomeHeader()}

        {/* 1. KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="manager-kpi-cards-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Operational Excellence</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">94.2% Rating</div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight">
              Meets quarterly strategic targets
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Student Standings</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">3.24 Avg GPA</div>
            </div>
            <div className="mt-2 text-[11.5px] text-slate-500 font-sans leading-tight">
              Grade average on-track across terms
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Budget Allocation</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">84.5% Utilized</div>
            </div>
            <div className="mt-2 text-[11.5px] text-indigo-600 font-semibold font-sans leading-tight">
              OPEX and CAPEX aligned perfectly
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Strategic Milestones</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">14 / 18 Met</div>
            </div>
            <div className="mt-2 text-[11.5px] text-slate-500 font-sans leading-tight">
              Quarterly targets met
            </div>
          </div>
        </div>

        {/* 2. Detailed Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="manager-dashboard-details">
          {/* Left Card: Strategic Analytics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="text-blue-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">Strategic Operational Metrics & Performance Chart</h3>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-750 px-2 py-0.5 rounded-md font-bold uppercase">Quarterly Review</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>Teacher Planner Compliance Ratio</span>
                  <span className="text-emerald-600">92% (Target: 90%)</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "92%" }}></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>Google Classroom Activity Index</span>
                  <span className="text-blue-600">88% (Target: 85%)</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "88%" }}></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>Remedial Class Outreach Success</span>
                  <span className="text-emerald-600">94% (Target: 90%)</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "94%" }}></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>SQAA Quality Evidence Documentation</span>
                  <span className="text-amber-600">80% (Target: 75%)</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "80%" }}></div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  alert("Performance slides and spreadsheet datasets have been compiled successfully.\nQueued for delivery to Board Trustees.");
                  triggerLog("Export Performance Quarterly Report", "Exported strategic operational compliance metrics slide block.", "task");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-3xs"
              >
                Export Performance Quarterly Report
              </button>
            </div>
          </div>

          {/* Right Card: Strategic Tasks Checklist */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="text-indigo-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">Strategic Milestones & Compliance Checklist</h3>
              </div>
              <span className="text-[10px] font-mono bg-violet-50 text-violet-750 px-2 py-0.5 rounded-md font-bold uppercase font-sans">Task Tracker</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <CheckSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 line-through">Quarterly Financial & Audit Review</span>
                  <p className="text-[10.5px] text-slate-500 font-medium">Compliance audited on May 10 by Governance Desk.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <CheckSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 line-through">Establish Advisory Liaison & Meeting Agenda</span>
                  <p className="text-[10.5px] text-slate-500 font-medium">Liaison appointed & strategic brief delivered to CBSE desk.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <Clock size={16} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Submit CBSE SQAA Verification Evidence</span>
                  <p className="text-[10.5px] text-slate-500 font-medium">Review is 80% complete. Stage 2 submissions on-track.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <Clock size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Middle School LMS Activity Scale Up Project</span>
                  <p className="text-[10.5px] text-slate-500 font-medium">Upgrading integration with additional Google Classroom drivers in Class 6.</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-slate-650 font-sans leading-relaxed">
              <strong>Strategic Guidance Notes:</strong> Expand OPEX resource margins into reinforcing preparatory workshops for boards in AP Biology, chemistry practical sets, and Middle School remedial outreach materials.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "hr") {
    return (
      <div className="space-y-6 mt-6 animate-fade-in" id="hr-specific-dashboard-zones">
        {renderWelcomeHeader()}

        {/* 1. KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="hr-kpi-cards-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Registered Workforce</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">54 Instructors</div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight">
              6 academic departments active
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Professional Dev CPD</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">24.5 Hours Avg</div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight">
              Reflected on central certification board
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Substitution Ratio</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">100% Staffed</div>
            </div>
            <div className="mt-2 text-[11.5px] text-slate-500 font-sans leading-tight">
              No active classroom gaps this week
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Workforce Ingestion</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">
                {hrLeaveReview.filter(l => l.status === "Review Required").length} Pending Review
              </div>
            </div>
            <div className="mt-2 text-[11.5px] text-amber-600 font-semibold font-sans leading-tight">
              Instructor leave requests submitted
            </div>
          </div>
        </div>

        {/* 2. Detailed Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="hr-dashboard-details">
          {/* Left Card: CPD Tracker */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="text-rose-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">Faculty Professional Development Hours (CPD)</h3>
              </div>
              <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-bold uppercase font-sans">Yearly Targets</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-mono tracking-wider">
                    <th className="py-2.5 font-extrabold">Faculty Name</th>
                    <th className="py-2.5 font-extrabold">Department</th>
                    <th className="py-2.5 font-extrabold">CPD Hours</th>
                    <th className="py-2.5 font-extrabold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">Dr. Sarah Henderson</td>
                    <td className="py-3 text-slate-500 text-[10px] font-mono">Sciences Node</td>
                    <td className="py-3 font-bold text-slate-700 font-mono text-[11.5px]">28 Hrs (Target: 20)</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] rounded-md uppercase">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">Mr. Matthew Vance</td>
                    <td className="py-3 text-slate-500 text-[10px] font-mono">Mathematics Node</td>
                    <td className="py-3 font-bold text-slate-700 font-mono text-[11.5px]">22 Hrs (Target: 20)</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] rounded-md uppercase">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">Ms. Sunita Mehta</td>
                    <td className="py-3 text-slate-500 text-[10px] font-mono">Humanities</td>
                    <td className="py-3 font-bold text-slate-700 font-mono text-[11.5px]">15 Hrs (Target: 20)</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[9px] rounded-md uppercase font-sans">Ongoing</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">Mr. Vijay Kumar</td>
                    <td className="py-3 text-slate-500 text-[10px] font-mono">Languages</td>
                    <td className="py-3 font-bold text-slate-700 font-mono text-[11.5px]">18 Hrs (Target: 20)</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[9px] rounded-md uppercase font-sans">Ongoing</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  alert("CPD automated achievement certificates signed & dispatched to compliant faculty profiles.");
                  triggerLog("CPD Certificates Dispatched", "Dispatched achievement receipts to compliant faculty registers", "task");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none"
              >
                Issue CPD Compliance Certificates
              </button>
            </div>
          </div>

          {/* Right Card: Leave review & dispatch */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="text-emerald-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">Leave Ingestion & Instructor Dispatch Terminal</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-750 px-2 py-0.5 rounded-md font-bold uppercase">Operational Safety</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              {hrLeaveReview.map((leave, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 text-[11.5px]">{leave.name}</div>
                    <div className="text-[10px] text-slate-450 font-medium font-sans">Type: {leave.type} · Target Term: {leave.date}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 font-bold font-mono text-[9px] border rounded-md uppercase ${
                      leave.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : "bg-amber-50 text-amber-700 border-amber-150 animate-pulse"
                    }`}>
                      {leave.status}
                    </span>
                    {leave.status === "Review Required" && (
                      <button
                        type="button"
                        onClick={() => {
                          setHrLeaveReview(prev => prev.map(l => l.id === leave.id ? { ...l, status: "Approved" } : l));
                          alert(`${leave.name}'s leave request for ${leave.date} approved. Auto-substitution notification dispatched.`);
                          triggerLog("Leave Approved", `Approved leave request for instructor ${leave.name}`, "task");
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-extrabold text-[10px] text-blue-600 cursor-pointer shadow-3xs"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] text-slate-450 font-mono block">Backup Substitution Dispatch Protocol:</span>
              <button
                type="button"
                onClick={() => {
                  alert("Automatic backup teacher allocated. Class timetables rearranged and email dispatch sent to Ms. Priya Nair for secondary coverage.");
                  triggerLog("Backup Sub Assigned", "Assigned backup sub coverage for Grade 8 Science block.", "task");
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors border-none shadow-3xs"
              >
                Allocate Substitute Backup Roster
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "exams") {
    return (
      <div className="space-y-6 mt-6 animate-fade-in" id="exams-specific-dashboard-zones">
        {renderWelcomeHeader()}

        {/* 1. KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="exams-kpi-cards-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Board Candidates</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">142 Candidates</div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight">
              100% CBSE & AP registrations checked
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Syllabus Compliance</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">92% Audited</div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight">
              All 8 active branches aligned
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">Projected Score Avg</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">+2.4% projected</div>
            </div>
            <div className="mt-2 text-[11.5px] text-indigo-600 font-semibold font-sans leading-tight">
              Improvement over previous board session
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">Mock Assessments</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">36 Preps</div>
            </div>
            <div className="mt-2 text-[11.5px] text-slate-500 font-sans leading-tight">
              Mock evaluations concluded
            </div>
          </div>
        </div>

        {/* 2. Detailed Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="exams-dashboard-details">
          {/* Left Card: Exams Analytics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="text-violet-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">AP & CBSE Boards Preparation Analytics Grid</h3>
              </div>
              <span className="text-[10px] font-mono bg-violet-50 text-violet-750 px-2 py-0.5 rounded-md font-bold uppercase font-sans">Subject Stats</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-mono tracking-wider">
                    <th className="py-2.5 font-extrabold">Board Subject</th>
                    <th className="py-2.5 font-extrabold">Registered No.</th>
                    <th className="py-2.5 font-extrabold">Syllabus Completion</th>
                    <th className="py-2.5 font-extrabold">Mock Average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">AP Chemistry</td>
                    <td className="py-3 font-mono text-slate-700">34 candidates</td>
                    <td className="py-3 font-bold text-emerald-600">100% (Audited)</td>
                    <td className="py-3 font-mono font-bold text-slate-800">88.5%</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">AP Biology</td>
                    <td className="py-3 font-mono text-slate-700">28 candidates</td>
                    <td className="py-3 font-bold text-emerald-600">100% (Audited)</td>
                    <td className="py-3 font-mono font-bold text-slate-800">84.0%</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">CBSE Mathematics XI</td>
                    <td className="py-3 font-mono text-slate-700">48 candidates</td>
                    <td className="py-3 font-bold text-amber-600">95% (Audited)</td>
                    <td className="py-3 font-mono font-bold text-slate-800">82.5%</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800 text-[11.5px]">CBSE Sciences XI</td>
                    <td className="py-3 font-mono text-slate-705">32 candidates</td>
                    <td className="py-3 font-bold text-emerald-600">100% (Audited)</td>
                    <td className="py-3 font-mono font-bold text-slate-800">85.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  alert("Official CBSE registration ledger & syllabus alignments compiled into a secure encrypted PDF bundle.");
                  triggerLog("Export LEDGER", "Exported formal board alignment statistics CSV ledger.", "task");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-3xs"
              >
                Export Board Registration Ledgers
              </button>
            </div>
          </div>

          {/* Right Card: Question verification */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Check className="text-emerald-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">Draft Exam Verification & Question Paper Review</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-750 px-2 py-0.5 rounded-md font-bold uppercase">Auditing</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5 whitespace-normal">
                  <span className="font-bold text-slate-800 text-[11.5px]">UT4 Question Paper Draft: Mathematics Class 8</span>
                  <p className="text-[10px] text-slate-500">Submitted by Mr. Matthew Vance. Target: Mid-term assessment.</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 font-mono text-[9px] font-bold rounded-md uppercase shrink-0">APPROVED</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 leading-tight text-[11.5px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse shrink-0"></span>
                    AP Chemistry Mock Assessment paper draft
                  </span>
                  <p className="text-[10px] text-slate-500 truncate max-w-xs">Submitted by Dr. Sarah Henderson. Requires AP syllabus compliance check.</p>
                </div>
                <button
                  onClick={() => {
                    alert("AP Chemistry mock assessment paper draft verified and locked successfully.");
                    triggerLog("Verify Paper Draft", "Verified AP Chemistry examination materials and rubric", "task");
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-bold text-[10px] text-blue-650 shrink-0 cursor-pointer shadow-3xs"
                >
                  Verify & Accept
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-sans leading-relaxed">
              Notice: All approved mid-term papers must be digitally hashed and locked. Verify answer schemes and rubric configurations prior to signing.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "parent") {
    return (
      <div className="space-y-6 mt-6 animate-fade-in" id="parent-specific-dashboard-zones">
        {renderWelcomeHeader()}

        {/* 1. KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="parent-kpi-cards-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">Pupil Engagement Avg</span>
              <div className="text-2xl font-black text-slate-805 leading-tight">96.4% Attendance</div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight">
              High overall attendance in Grade 8 blocks
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">Announcements</span>
              <div className="text-2xl font-black text-slate-805 leading-tight font-sans">8 Active Notices</div>
            </div>
            <div className="mt-2 text-[11.5px] text-slate-500 font-sans leading-tight">
              Broadcasted safely to parents portal
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">Advisory Interactions</span>
              <div className="text-2xl font-black text-slate-850 leading-tight">
                {parentAdvisoryTickets.filter(t => t.status === "Open").length} Open Ticket
              </div>
            </div>
            <div className="mt-2 text-[11.5px] text-indigo-600 font-semibold font-sans leading-tight">
              Responsive advisory council feedback loop
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">Campus Safety Score</span>
              <div className="text-2xl font-black text-slate-805 leading-tight">98% Rating</div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight flex items-center gap-1">
              <span className="w-1.2 h-1.2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Emergency and hygiene checklist verified
            </div>
          </div>
        </div>

        {/* 2. Detailed Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="parent-dashboard-details">
          {/* Left Card: Announcements */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="text-emerald-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">Parent Portal & Principal's Announcements Notice Board</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-750 px-2 py-0.5 rounded-md font-bold uppercase">Latest Updates</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex justify-between items-center font-sans font-bold">
                  <span className="text-slate-800 text-[11.5px]">Secondary Wing Board Preparatory Rosters Drafted</span>
                  <span className="text-[10px] text-slate-400 font-mono">Today</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Schedules and syllabus checklists for Grade VIII and IX CBSE/AP tutorials have been locked and synced.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex justify-between items-center font-sans font-bold">
                  <span className="text-slate-800 text-[11.5px]">GPS Fleet Route 4 Upgrades Approved & Synced</span>
                  <span className="text-[10px] text-slate-400 font-mono">2 days ago</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  New tracking transponders fitted on Route 4 and 11 transport blocks. Real-time locations map synchronized on security nodes.
                </p>
              </div>
            </div>

            {/* Ticket Submission Form */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="text-[10px] text-slate-450 font-mono block uppercase font-bold tracking-wider">File Advisory Ticket to Executive Committee:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={parentNewTicketSubject}
                  onChange={(e) => setParentNewTicketSubject(e.target.value)}
                  placeholder="Enter issue (e.g. feedback regarding bus fleet timings...)"
                  className="w-full text-xs font-sans px-3.5 py-2 ring-1 ring-slate-200 border-none bg-slate-50 focus:bg-white rounded-xl focus:ring-indigo-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!parentNewTicketSubject.trim()) return;
                    const freshId = "t-" + Date.now();
                    setParentAdvisoryTickets(prev => [
                      ...prev,
                      { id: freshId, subject: parentNewTicketSubject, status: "Open", date: "Just now" }
                    ]);
                    setParentNewTicketSubject("");
                    alert("Advisory issue recorded successfully.\nDispatched copy to CBSE Liaisons & Parent Representative Board.");
                    triggerLog("Submit Advisory Ticket", `Submitted parent advisory ticket with subject: ${parentNewTicketSubject}`, "task");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold font-sans text-xs shrink-0 rounded-xl cursor-pointer border-none"
                >
                  Submit Ticket
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-2 mt-2">
                {parentAdvisoryTickets.map((t, index) => (
                  <div key={index} className="flex justify-between items-center text-[11px] p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
                    <span className="text-slate-700 font-medium font-sans truncate pr-2 max-w-[280px] sm:max-w-md select-text">{t.subject} (Logged {t.date})</span>
                    <span className={`px-1.5 py-0.5 rounded-md font-mono text-[9px] font-bold border shrink-0 ${
                      t.status === "Resolved" ? "bg-emerald-50 text-emerald-750 border-emerald-150" : "bg-amber-50 text-amber-700 border-amber-150 animate-pulse"
                    }`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Card: Safety details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="text-emerald-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">Safety Records & Pupil Transport Updates</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-750 px-2 py-0.5 rounded-md font-bold uppercase">Audited</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                  <span>BUS FLEET SECURITY MONITOR</span>
                  <span className="text-emerald-600 font-sans font-bold">12 / 12 ROUTES GPS VERIFIED</span>
                </div>
                <p className="font-sans font-bold text-slate-800 leading-snug text-[11.5px]">All transport speed limiters and panic responses verified healthy by campus operator.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                  <span>ANNUAL FIRE & SAFETY AUDIT</span>
                  <span className="text-emerald-600 font-sans font-bold">STAGE 1 + 2 CLEAR</span>
                </div>
                <p className="font-sans font-bold text-slate-800 leading-snug text-[11.5px]">Clearance pathways, fire extinguishers, and middle wing safety standards certified.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-sans leading-relaxed">
              Emergency Advisory Helpline: +91 990 000 1122 (Available 24/7). Transport desk updates are pushed instantly to parent portal nodes.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "student") {
    return (
      <div className="space-y-6 mt-6 animate-fade-in" id="student-specific-dashboard-zones">
        {renderWelcomeHeader()}

        {/* 1. KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="student-kpi-cards-grid">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">Active Assignments</span>
              <div className="text-2xl font-black text-slate-800 leading-tight">
                {studentTasksList.filter(t => !t.completed).length} Pending
              </div>
            </div>
            <div className="mt-2 text-[11.5px] text-amber-600 font-semibold font-sans leading-tight">
              Homework assignments due soon
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">Homework Submitted</span>
              <div className="text-2xl font-black text-slate-800 leading-tight font-sans">
                {Math.round((studentTasksList.filter(t => t.completed).length / studentTasksList.length) * 100)}% Done
              </div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight">
              Excellent overall academic score
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">Study Files Opened</span>
              <div className="text-2xl font-black text-slate-805 leading-tight">14 Resources</div>
            </div>
            <div className="mt-2 text-[11.5px] text-indigo-600 font-semibold font-sans leading-tight font-sans">
              Mathematics, AP Science materials tracked
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-1">
              <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block font-sans">My Attendance Info</span>
              <div className="text-2xl font-black text-slate-805 leading-tight">95.6% Status</div>
            </div>
            <div className="mt-2 text-[11.5px] text-emerald-600 font-semibold font-sans leading-tight">
              On-track with high attendance metric
            </div>
          </div>
        </div>

        {/* 2. Detailed Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="student-dashboard-details">
          {/* Left Card: Tasks / Homework list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="text-cyan-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">Personal Tasks & Google Classroom Assignments Checklist</h3>
              </div>
              <span className="text-[10px] font-mono bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded-md font-bold uppercase font-sans">To-Do List</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              {studentTasksList.map((t, index) => (
                <div key={index} className={`p-3.5 border rounded-xl flex items-center justify-between transition-colors ${
                  t.completed ? "bg-emerald-50/20 border-emerald-100" : "bg-slate-50 border-slate-100"
                }`}>
                  <div className="space-y-0.5 whitespace-normal pr-3 select-text">
                    <span className={`font-bold leading-tight flex items-baseline gap-1.5 ${t.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                      <span className="text-[9.5px] font-mono uppercase bg-slate-200/80 rounded-md font-bold text-slate-600 font-sans px-1.5 shrink-0 select-none">{t.classSec}</span>
                      {t.title}
                    </span>
                    <p className="text-[10px] text-slate-450 font-medium">Class Deadlines: {t.deadline}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStudentTasksList(prev => prev.map(item => item.id === t.id ? { ...item, completed: !item.completed } : item));
                      triggerLog("Student Task Progress", `Toggled compliance state for task item: ${t.title}`, "task");
                    }}
                    className={`px-3 py-1.5 font-sans font-bold text-xs rounded-lg border cursor-pointer shrink-0 shadow-3xs hover:shadow-2xs transition-all ${
                      t.completed ? "bg-emerald-105 text-emerald-800 border-emerald-205 hover:bg-emerald-150" : "bg-white text-slate-700 border-slate-250 hover:bg-slate-50"
                    }`}
                  >
                    {t.completed ? "Submitted" : "Mark Done"}
                  </button>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-550 font-sans leading-relaxed select-text bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              💡 <strong>Class VIII Study Hint:</strong> Use the sidebar <strong>Classrooms</strong> index nodes to browse detailed digital guides or submit files directly to chemistry instructors.
            </div>
          </div>

          {/* Right Card: Class schedule */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="text-cyan-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">My Grade VIII-A Active Timetable & Daily Schedule</h3>
              </div>
              <span className="text-[10px] font-mono bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded-md font-bold uppercase font-sans">Active Classes</span>
            </div>

            <div className="space-y-2 font-sans text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between opacity-65">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Classroom Science: Grade VIII</span>
                  <p className="text-[10px] text-slate-500">Period 1 · 8:00 AM · Room 102 (Lab)</p>
                </div>
                <span className="px-2 py-0.5 font-bold font-mono text-[9px] border bg-slate-100 border-slate-200 text-slate-450 rounded-md">CONCLUDED</span>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5 leading-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0"></span>
                    AP Biology Lecture block
                  </span>
                  <p className="text-[10px] text-emerald-800">Period 4 · 10:30 AM · Room A-202</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    alert("Opening secure classroom meet session... Joint confirmation verified.");
                    triggerLog("Student Join Lecture", "Joined live lecture meeting thread via class meet button", "auth");
                  }}
                  className="px-3 shrink-0 py-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-lg text-xs cursor-pointer shadow-3xs"
                >
                  Join Lecture Meet
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between animate-pulse">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">AP Chemistry Discussion Block</span>
                  <p className="text-[10px] text-slate-500">Period 6 · 1:00 PM · Lab C-301</p>
                </div>
                <span className="px-2 py-0.5 font-bold font-mono text-[9px] border bg-slate-100 border-slate-150 text-slate-500 rounded-md">UPCOMING</span>
              </div>
            </div>

            {/* Quick materials link */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block select-none">Study Files Quick Access Folder:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert("Algebra workbook worksheet PDF compiled successfully. Download started.");
                  }}
                  className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                >
                  <Download size={11} className="text-slate-400" /> Math Workbook 5
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("Science cell division cell diagram sheet image compiled. Opened successfully.");
                  }}
                  className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                >
                  <Download size={11} className="text-slate-400" /> Cell Division Chapter Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
