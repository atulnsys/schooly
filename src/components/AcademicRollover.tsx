import React, { useState } from "react";
import { AcademicYearConfig } from "../types";
import { 
  Compass, 
  RotateCw, 
  UserCheck, 
  FolderLock, 
  Sliders, 
  Check, 
  Play, 
  Loader2, 
  CheckCircle, 
  BookMarked,
  ShieldCheck,
  Calendar,
  Layers
} from "lucide-react";

interface AcademicRolloverProps {
  rolloverConfig: AcademicYearConfig;
  onTriggerRollover: (promoStrategy: string, targetYearLabel: string) => void;
  currentUser: string;
  currentRole: string;
}

export default function AcademicRollover({
  rolloverConfig,
  onTriggerRollover,
  currentUser,
  currentRole
}: AcademicRolloverProps) {
  // Wizard state: Step 1 to 5
  const [activeStep, setActiveStep] = useState<number>(1);
  const [promoStrategy, setPromoStrategy] = useState("auto-grade-plus");
  const [selectedTargetYear, setSelectedTargetYear] = useState("2026-2027");
  const [executing, setExecuting] = useState(false);

  const steps = [
    { num: 1, name: "Year Targeting", desc: "Select target years & metadata structures" },
    { num: 2, name: "Student Promotion", desc: "Formulate automated grade promotion rules" },
    { num: 3, name: "Classroom Archival", desc: "Freeze grades, assignments & archive streams" },
    { num: 4, name: "Teacher Slots", desc: "Map department headers & roles" },
    { num: 5, name: "Execute Roll", desc: "Trigger master workspace rollover schemas" }
  ];

  // Map step numbers to UI rendering
  const handleExecuteRollover = () => {
    setExecuting(true);
    onTriggerRollover(promoStrategy, selectedTargetYear);
    
    // Server handles timeout, configure client delay fake progress loader
    setTimeout(() => {
      setExecuting(false);
    }, 1500);
  };

  return (
    <div className="space-y-6" id="academic-year-management-module">
      
      {/* Module Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold text-blue-600 font-mono tracking-wider uppercase">Academic Year Rollover</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Academic Year Rollover</h2>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Transition your digital campus structures, student rosters, PowerSchool gradebooks, and automated triggers cleanly into the upcoming educational calendar cycle.
          </p>
        </div>

        {/* Current status chip */}
        <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-center space-y-1.5 min-w-[170px]">
          <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">ACTIVE ACADEMIC TERM</span>
          <div className="flex items-center gap-1.5 justify-center">
            <Calendar size={14} className="text-blue-600" />
            <span className="text-xs font-bold font-mono text-slate-800">{rolloverConfig.currentYear} School Year</span>
          </div>
        </div>
      </div>

      {/* 5-Step Process Tracker bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5" id="rollover-steps">
        {steps.map(s => (
          <button 
            type="button"
            key={s.num}
            onClick={() => setActiveStep(s.num)}
            className={`p-3.5 border rounded-xl text-left cursor-pointer transition-all select-none ${
              activeStep === s.num
                ? "bg-slate-800 border-slate-950 text-white shadow-sm font-semibold"
                : activeStep > s.num
                  ? "bg-emerald-50/75 border-emerald-150 text-emerald-800"
                  : "bg-white border-slate-155 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] uppercase font-bold tracking-wider font-mono ${activeStep === s.num ? "text-slate-350" : "text-slate-400"}`}>Step 0{s.num}</span>
              {activeStep > s.num && <CheckCircle size={14} className="text-emerald-600 shrink-0" />}
            </div>
            <h4 className="text-xs font-bold font-sans tracking-tight">{s.name}</h4>
          </button>
        ))}
      </div>

      {/* Dynamic Step Content Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col justify-between" id="step-content-card">
        
        {/* Step 1 Content rendering */}
        {activeStep === 1 && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-sans-semibold">
              <Compass size={16} className="text-blue-600" />
              1. Selector targeting the Incoming Year Parameters
            </h3>
            <p className="text-xs text-slate-505 leading-relaxed">
              Define the source workspace academic year and select target calendar namespaces. By default, the transition moves from the current system year to the upcoming year, reserving old structures as immutable archives.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5 font-semibold">SOURCE ACADEMIC TERM</label>
                <input 
                  type="text" 
                  disabled 
                  value={rolloverConfig.currentYear} 
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5 font-semibold">TARGET CALENDAR NAMESPACE</label>
                <select
                  value={selectedTargetYear}
                  onChange={(e) => setSelectedTargetYear(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs rounded-xl focus:outline-hidden"
                >
                  <option value="2026-2027">2026-2027 School Term</option>
                  <option value="2027-2028">2027-2028 School Term</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 Content rendering */}
        {activeStep === 2 && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <UserCheck size={16} className="text-blue-600" />
              2. Student Promotion Rules Mapping
            </h3>
            <p className="text-xs text-slate-505 leading-relaxed font-sans">
              Design the strategies for advancing student profiles within directories. System promotions will synchronize across classroom registrations, SIS PowerSchool directories, and grading trackers.
            </p>

            <div className="space-y-3 pt-1.5">
              <label className="text-[10px] text-slate-400 font-mono block font-semibold">PROMOTION ALGORITHM</label>
              
              <div 
                className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                  promoStrategy === "auto-grade-plus" ? "bg-blue-50/50 border-blue-200 text-blue-900" : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setPromoStrategy("auto-grade-plus")}
              >
                <input 
                  type="radio" 
                  name="prog" 
                  checked={promoStrategy === "auto-grade-plus"} 
                  onChange={()=>{}}
                  className="mt-1 accent-blue-600" 
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold block">Standard Direct Grade Bump (Auto-plus)</span>
                  <span className="text-slate-500 block text-[11px] leading-relaxed">Advancing middle elementary Grade 8 portfolios comprehensively into Freshmen (Grade 9) structures. Resets active risk scores cleanly.</span>
                </div>
              </div>

              <div 
                className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                  promoStrategy === "conditional-gpa" ? "bg-blue-50/50 border-blue-200 text-blue-900" : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setPromoStrategy("conditional-gpa")}
              >
                <input 
                  type="radio" 
                  name="prog" 
                  checked={promoStrategy === "conditional-gpa"} 
                  onChange={()=>{}}
                  className="mt-1 accent-blue-600" 
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold block">Conditional GPA Review Flagging</span>
                  <span className="text-slate-500 block text-[11px] leading-relaxed">Flag students under GPA 2.0 or having High Alert Risk parameters for manual administrative assignment overrides.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 Content rendering */}
        {activeStep === 3 && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FolderLock size={16} className="text-blue-600" />
              3. Classroom freezing & Course Archivals
            </h3>
            <p className="text-xs text-slate-505 leading-relaxed font-sans">
              Archive historical classroom syllabi files and active classroom announcements list. Old materials indices are compressed and preserved within Google drive sub-directories for compliance archiving.
            </p>

            <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl text-amber-900 text-xs flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div className="space-y-1">
                <span className="font-bold font-sans">Historical data preservation notice</span>
                <p className="text-amber-800 text-[11.5px] leading-relaxed font-sans">
                  Academic year rollovers do not erase database indices. Gradebooks, student logins, and secure workflow audits remain immutable inside your enterprise archive files.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 Content rendering */}
        {activeStep === 4 && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sliders size={16} className="text-blue-600" />
              4. Teacher Department Slots mappings
            </h3>
            <p className="text-xs text-slate-505 leading-relaxed font-sans">
              Reassign teacher profiles and manage department allocations for the upcoming school semester.
            </p>

            <div className="space-y-2.5 pt-1.5 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Dr. Sarah Henderson</span>
                  <p className="text-[10px] text-slate-400">Science Faculty Lead</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                  Active (Grade 9 Science)
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Marcus Vance</span>
                  <p className="text-[10px] text-slate-400">Mathematics Lead Advisor</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                  Active (Algebra Trigonometry)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 Content rendering & Roll triggers */}
        {activeStep === 5 && (
          <div className="space-y-5 max-w-xl">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers size={16} className="text-blue-600" />
              5. Final review & Rollover Roll
            </h3>
            <p className="text-xs text-slate-505 leading-relaxed font-sans">
              Initiate the system rollover procedure. The pipeline is automated, updating student grades, resetting workflows, cloning structural directories, and generating secure system audit logs.
            </p>

            {rolloverConfig.status === "completed" ? (
              <div className="p-4 bg-teal-50 border border-teal-150 rounded-xl text-teal-900 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-teal-600 shrink-0" size={18} />
                  <span className="font-bold text-sm font-sans">Rollover completed successfully!</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 text-[11px] font-mono select-text pt-2.5 border-t border-teal-200 text-teal-800">
                  <span>Target school year:</span>
                  <span className="font-bold text-right">{rolloverConfig.targetYear}</span>
                  <span>Promoted Student Ranks:</span>
                  <span className="font-bold text-right">{rolloverConfig.promotionCount} Pupils</span>
                  <span>Archived Classrooms:</span>
                  <span className="font-bold text-right">{rolloverConfig.archivedCoursesCount} Channels</span>
                  <span>Cloned workflows Rules:</span>
                  <span className="font-bold text-right">{rolloverConfig.clonedWorkflowsCount} Rules</span>
                  <span>Completed at timestamp:</span>
                  <span className="font-bold text-right text-[10px]">{new Date(rolloverConfig.completedAt || "").toLocaleString()}</span>
                </div>
              </div>
            ) : rolloverConfig.status === "in_progress" || executing ? (
              <div className="p-8 text-center text-slate-500 space-y-3.5">
                <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
                <h4 className="font-bold text-slate-705 font-sans">Migrating Academic Registries</h4>
                <p className="text-xs max-w-xs mx-auto leading-relaxed font-sans">
                  Updating students, backing up Drive files, freezing gradebooks, and clearing standby workflows registers. Please hold on...
                </p>
              </div>
            ) : (
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={handleExecuteRollover}
                  disabled={executing}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Play size={12} fill="white" className="text-white" />
                  Initiate System Rollover Migration
                </button>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer controls */}
        <div className="pt-5 border-t border-slate-100 flex justify-between items-center text-xs mt-6">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-semibold cursor-pointer disabled:opacity-40"
          >
            Previous Stage
          </button>

          <span className="text-slate-400 font-mono font-medium">Stage {activeStep} of 5</span>

          <button
            type="button"
            disabled={activeStep === 5}
            onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-colors font-semibold cursor-pointer disabled:opacity-40"
          >
            Next Stage
          </button>
        </div>

      </div>
    </div>
  );
}
