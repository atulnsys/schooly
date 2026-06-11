import React, { useState, useRef } from "react";
import { AutomationRule, WorkspaceFile } from "../types";
import { schoolyFetch } from "../lib/safeFetch";
import { 
  Sparkles, 
  BookOpen, 
  Zap, 
  DraftingCompass, 
  Loader2, 
  Lightbulb, 
  ShieldCheck, 
  Plus, 
  Send, 
  Check, 
  ToggleLeft, 
  ToggleRight,
  UserCheck,
  Paperclip,
  Upload,
  X,
  File,
  FileText
} from "lucide-react";

interface AIAssistantsProps {
  automations: AutomationRule[];
  onToggleAutomation: (id: string) => void;
  onAddAutomation: (rule: Partial<AutomationRule>) => void;
  currentUser: string;
  currentRole: string;
  files: WorkspaceFile[];
  activeCapabilities?: string[];
}

export default function AIAssistants({
  automations,
  onToggleAutomation,
  onAddAutomation,
  currentUser,
  currentRole,
  files,
  activeCapabilities = []
}: AIAssistantsProps) {
  const [activeTab, setActiveTab] = useState<"curriculum" | "automation">("curriculum");

  // Lesson Planner inputs
  const [subject, setSubject] = useState("Science");
  const [gradeLevel, setGradeLevel] = useState("Grade 8");
  const [lessonLength, setLessonLength] = useState("1-week unit plan");
  const [specificTopic, setSpecificTopic] = useState("");
  const [academicRepoPath, setAcademicRepoPath] = useState("None (Generic Plan)");
  const [parentNotificationDraft, setParentNotificationDraft] = useState(false);

  const handleRepoPathChange = (path: string) => {
    setAcademicRepoPath(path);
    if (!path || path === "None (Generic Plan)") return;
    if (path.includes("English")) {
      setSubject("English Literature");
      setGradeLevel("Grade 11 (AP Course)");
    } else if (path.includes("Science")) {
      setSubject("Science");
      setGradeLevel("Grade 8");
    } else if (path.includes("Artificial Intelligence") || path.includes("Information Technology")) {
      setSubject("Science");
      setGradeLevel("Grade 9 (HS Freshmen)");
    } else if (path.includes("Mathematics")) {
      setSubject("Mathematics");
      setGradeLevel("Grade 9 (HS Freshmen)");
    }
  };

  // Lesson Planner outputs
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [lessonOutline, setLessonOutline] = useState("");
  const [lessonError, setLessonError] = useState("");

  // Co-Pilot dynamic file attachments state and handlers
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; size: string; type: string; isDrive: boolean }[]>([]);
  const [showDriveAttach, setShowDriveAttach] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen || chosen.length === 0) return;
    const items = Array.from(chosen).map((file: any) => ({
      id: Math.random().toString(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || "Document",
      isDrive: false
    }));
    setAttachedFiles((prev) => [...prev, ...items]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAttachDriveFile = (file: WorkspaceFile) => {
    if (attachedFiles.some(f => f.id === file.id)) {
      setShowDriveAttach(false);
      return;
    }
    setAttachedFiles((prev) => [
      ...prev,
      {
        id: file.id,
        name: file.name,
        size: file.size || "indexed cloud",
        type: file.type || "pdf",
        isDrive: true
      }
    ]);
    setShowDriveAttach(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Workflow builder inputs
  const [naturalCommand, setNaturalCommand] = useState("");
  const [parsingWorkflow, setParsingWorkflow] = useState(false);
  const [workflowBlueprint, setWorkflowBlueprint] = useState("");
  const [extractedRule, setExtractedRule] = useState<{title: string, triggerType: any, actionType: any, triggerDesc: string, actionDesc: string} | null>(null);
  const [workflowError, setWorkflowError] = useState("");
  const [ruleSaved, setRuleSaved] = useState(false);

  // Quick Lesson templates presets
  const handleApplyPreset = (topic: string, sub: string, gr: string) => {
    setSpecificTopic(topic);
    setSubject(sub);
    setGradeLevel(gr);
  };

  // 1. Generate Lesson Plan / Curriculum Outline
  const handleGenerateOutline = async () => {
    console.log("[DEBUG] handleGenerateOutline clicked. Subject:", subject, "Pacing:", lessonLength, "Topic:", specificTopic);
    console.log("[DEBUG] Count of attachments compiled for Curriculum Co-Pilot:", attachedFiles.length, attachedFiles);
    setGeneratingLesson(true);
    setLessonOutline("");
    setLessonError("");

    const attachmentContext = attachedFiles.length > 0 
      ? `\n\n[Included Reference Attachments: ${attachedFiles.map(f => `${f.name} (${f.type}, ${f.size})`).join(", ")}]` 
      : "";

    const repoContext = academicRepoPath !== "None (Generic Plan)" 
      ? `\n\n[Academic Repository Context Mapping Path Destination Folder: ${academicRepoPath}]` 
      : "";

    const corePrompt = parentNotificationDraft 
      ? `Draft a professional parent announcement notification and progress tracking report update for ${gradeLevel} ${subject} regarding "${specificTopic}". Outlining learning timelines, achievement checkpoints, and home tutoring strategies.${attachmentContext}${repoContext}`
      : `Create an executive ${lessonLength} syllabus structure & lesson outline for ${gradeLevel} ${subject} focusing on: "${specificTopic}". 
         Please structure your answers into clean markdown sections including:
         1. Objectives and Standards mapping.
         2. Vocabulary list.
         3. Daily pacing notes (5 days outline).
         4. Standard exit slips quizzes questions.
         5. Homework and grading rubric thresholds.${attachmentContext}${repoContext}`;

    try {
      console.log("[DEBUG] Contacting backend proxy /api/gemini/assistant for curricular design...");
      const res = await schoolyFetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantType: "education",
          prompt: corePrompt,
          extraContext: `Request initiated by active Academic Teacher: ${currentUser}. Source Path Context: ${academicRepoPath}. Attached sources count: ${attachedFiles.length}. Names: ${attachedFiles.map(f => f.name).join("; ")}`,
          user: currentUser,
          role: currentRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        console.log("[DEBUG] Gemini curricular outline response obtained successfully.");
        setLessonOutline(data.text);
      } else {
        console.error("[DEBUG] Gemini error response payload:", data);
        setLessonError(data.error || "Unable to parse lesson outline.");
      }
    } catch (err: any) {
      console.error("[DEBUG] Exception in curricular planner fetch lifecycle:", err);
      setLessonError("LLM lesson creation pipeline timed out. Ensure API secret key availability.");
    } finally {
      setGeneratingLesson(false);
    }
  };

  // 2. Parse Natural Language Workflow Blueprint
  const handleParseWorkflow = async () => {
    if (!naturalCommand.trim()) return;
    console.log("[DEBUG] handleParseWorkflow clicked. Command text:", naturalCommand);
    console.log("[DEBUG] Count of attachments compiled for Automation Co-Pilot:", attachedFiles.length, attachedFiles);
    setParsingWorkflow(true);
    setWorkflowBlueprint("");
    setWorkflowError("");
    setExtractedRule(null);
    setRuleSaved(false);

    const attachmentContext = attachedFiles.length > 0 
      ? `\n\n[Included Reference Attachments: ${attachedFiles.map(f => `${f.name} (${f.type}, ${f.size})`).join(", ")}]` 
      : "";

    try {
      console.log("[DEBUG] Querying backend translation pipeline /api/gemini/assistant...");
      const res = await schoolyFetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantType: "automation",
          prompt: `Parse this natural language instruction for a school automation script: "${naturalCommand}"${attachmentContext}. 
                   Determine the optimal Trigger Type (one of: "file_created", "assignment_overdue", "class_rollover", "task_escalation") 
                   and Action Type (one of: "email_notify", "create_task", "alert_slack").
                   
                   Format your final answer showing:
                   ===SCHEMA===
                   Title: Brief name for this rule
                   Trigger: the specific trigger selected
                   Trigger Description: Human friendly trigger description
                   Action: the action selected
                   Action Description: Human friendly action description
                   ============
                   followed by an architectural analysis text of the trigger loop.`,
          user: currentUser,
          role: currentRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        console.log("[DEBUG] Gemini automation blueprint parsed successfully.");
        setWorkflowBlueprint(data.text);

        // Try extracting keys dynamically from Schema text
        const text = data.text;
        const schemaBlock = text.match(/===SCHEMA===([\s\S]*?)============/);
        if (schemaBlock) {
          const lines = schemaBlock[1].split("\n").filter((l: string) => l.includes(":"));
          const metadata: any = {};
          lines.forEach((line: string) => {
            const parts = line.split(":");
            const key = parts[0].trim().toLowerCase();
            const val = parts.slice(1).join(":").trim();
            metadata[key] = val;
          });

          // Determine triggerType mapping
          let triggerType: any = "file_created";
          if (metadata.trigger?.toLowerCase().includes("overdue") || metadata.trigger?.toLowerCase().includes("assign")) triggerType = "assignment_overdue";
          else if (metadata.trigger?.toLowerCase().includes("rollover") || metadata.trigger?.toLowerCase().includes("class")) triggerType = "class_rollover";
          else if (metadata.trigger?.toLowerCase().includes("escalate")) triggerType = "task_escalation";

          let actionType: any = "email_notify";
          if (metadata.action?.toLowerCase().includes("task") || metadata.action?.toLowerCase().includes("create")) actionType = "create_task";
          else if (metadata.action?.toLowerCase().includes("slack") || metadata.action?.toLowerCase().includes("alert")) actionType = "alert_slack";

          console.log("[DEBUG] Extracted Automation JSON rule parameters:", { title: metadata.title, triggerType, actionType });
          setExtractedRule({
            title: metadata.title || "Custom AI Workflow",
            triggerType,
            actionType,
            triggerDesc: metadata["trigger description"] || "Conditions met",
            actionDesc: metadata["action description"] || "Automated actions dispatched"
          });
        }
      } else {
        console.error("[DEBUG] Gemini automation error payload:", data);
        setWorkflowError(data.error);
      }
    } catch (err: any) {
      console.error("[DEBUG] Exception in workflow translator fetch lifecycle:", err);
      setWorkflowError("Failed to outline workflow blueprint. Check server status.");
    } finally {
      setParsingWorkflow(false);
    }
  };

  // Save the extracted rule to the active automation system on the backend
  const handleSaveAutomation = () => {
    if (!extractedRule) return;
    onAddAutomation(extractedRule);
    setRuleSaved(true);
  };

  const canManageWorkflow = 
    activeCapabilities.includes("Workflow Management") || 
    currentUser === "academic.admin@school.org" || 
    currentRole === "School Admin" ||
    currentRole === "Principal";

  return (
    <div className="space-y-6" id="ai-intelligence-studio">
      
      {/* Category selector panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 gap-2" id="ai-toolsets-tabs">
        <div className="flex flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("curriculum")}
            className={`px-5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === "curriculum"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-705 font-semibold"
            }`}
          >
            <BookOpen size={14} />
            Educational Curriculum Copilot
          </button>
          
          {canManageWorkflow && (
            <button
              type="button"
              onClick={() => setActiveTab("automation")}
              className={`px-5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
                activeTab === "automation"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-705 font-semibold"
              }`}
            >
              <Zap size={14} />
              Workflow Automation Builder
            </button>
          )}
        </div>

        {!canManageWorkflow && (
          <div className="px-5 py-2.5 sm:py-0 text-[10.5px] text-slate-400 italic flex items-center gap-1.5 font-sans" id="plain-staff-workflow-warning">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span>This is a configuration tool for administrative users.</span>
          </div>
        )}
      </div>

      {activeTab === "curriculum" ? (
        /* Lesson Planner & Curriculum Assistant Panel */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="lesson-planner-workspace">
          
          {/* Inputs Section */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5.5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <DraftingCompass size={16} className="text-blue-505" />
              Syllabus Outline Credentials
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5 font-semibold">CHOOSE SUBJECT</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
                >
                  <option value="Science">Physical/Environmental Sciences</option>
                  <option value="Mathematics">Algebra & quantitative Trigonometry</option>
                  <option value="English Literature">AP English Lit & Composition</option>
                  <option value="World History">Social Studies & World History</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5 font-semibold">GRADE CONTEXT</label>
                <select 
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
                >
                  <option value="Grade 8">Grade 8 Middle School</option>
                  <option value="Grade 9 (HS Freshmen)">High School Freshmen</option>
                  <option value="Grade 11 (AP Course)">K11/AP Honors Courses</option>
                  <option value="Undergraduate">College Level Higher-Ed</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5 font-semibold">CURRICULUM LIFESPAN</label>
                <select 
                  value={lessonLength}
                  onChange={(e) => setLessonLength(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
                >
                  <option value="1-period class schedule">Single 50-minute Class session</option>
                  <option value="1-week unit plan">1-Week Unit Block</option>
                  <option value="4-week comprehensive module">4-Week Extended Modules</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5 font-semibold">SPECIFIC TOPIC OR OBJECTIVE *</label>
                <input 
                  type="text"
                  placeholder="e.g. Chemical molecular bond volatility, or Hamlet tragedies soliloquy Socratic seminars"
                  value={specificTopic}
                  onChange={(e) => setSpecificTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5 font-semibold tracking-wide">ACADEMIC REPOSITORY SOURCE PATH</label>
                <select 
                  value={academicRepoPath}
                  onChange={(e) => handleRepoPathChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs text-slate-700 focus:outline-hidden font-mono text-[10px]"
                >
                  <option value="None (Generic Plan)">None (Generic Syllabus Plan)</option>
                  <option value="/Academic Repository/AY 2026-27/Secondary/Class X/Class X-A/English/02_Chapter_Resources">/Academic Repository/.../Class X-A/English/02_Chapter_Resources</option>
                  <option value="/Academic Repository/AY 2026-27/Secondary/Class X/Class X-B/English/05_Remedial">/Academic Repository/.../Class X-B/English/05_Remedial</option>
                  <option value="/Academic Repository/AY 2026-27/Middle/Class VIII/Class VIII-A/Science/02_Chapter_Resources">/Academic Repository/.../Class VIII-A/Science/02_Chapter_Resources</option>
                  <option value="/Academic Repository/AY 2026-27/Middle/Class VIII/Class VIII-C/Science/03_Assessments">/Academic Repository/.../Class VIII-C/Science/03_Assessments</option>
                  <option value="/Academic Repository/AY 2026-27/Secondary/Class IX/Class IX-D/Artificial Intelligence/06_Enrichment">/Academic Repository/.../Class IX-D/Artificial_Intelligence/06_Enrichment</option>
                </select>
                <span className="text-[9.5px] text-slate-400 font-sans block mt-1 leading-normal font-medium">
                  Maps the Copilot generator to your standardized CBSE Digital Operating system knowledge folder.
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-1.5">
                <input 
                  type="checkbox" 
                  id="parent-notif"
                  checked={parentNotificationDraft}
                  onChange={(e) => setParentNotificationDraft(e.target.checked)}
                  className="rounded border-slate-300 text-blue-650 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="parent-notif" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                  Draft Parent Announcement Circular
                </label>
              </div>

              {/* Dynamic attachments zone handles both workspace drive files and local sources */}
              <div className="pt-2 border-t border-slate-100 space-y-2" id="copilot-attachments-panel">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] text-slate-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Paperclip size={11} className="text-slate-400" />
                    Resource Attachments ({attachedFiles.length})
                  </label>
                  <div className="flex items-center gap-1.5 text-[10.5px]">
                    <span className="text-slate-350">Add:</span>
                    <button
                      type="button"
                      onClick={() => setShowDriveAttach(!showDriveAttach)}
                      className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      Drive File
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      Local File
                    </button>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAttachLocalFile}
                      multiple
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Dropdown to attach from existing indexed Drive files */}
                {showDriveAttach && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 max-h-40 overflow-y-auto space-y-1 text-xs shadow-inner animate-fade-in relative z-20">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 pb-1.5 border-b border-slate-200 mb-1 font-mono font-bold">
                      <span>SELECT DRIVE DOCUMENT</span>
                      <button type="button" onClick={() => setShowDriveAttach(false)} className="text-slate-400 hover:text-slate-600">close</button>
                    </div>
                    {files.length === 0 ? (
                      <div className="text-[10.5px] text-slate-450 text-center py-2 italic font-medium">No files indexed in Google Workspace</div>
                    ) : (
                      files.map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleAttachDriveFile(f)}
                          className="w-full text-left py-1 px-1.5 hover:bg-white rounded-lg text-[10.5px] hover:text-blue-600 transition-all font-sans flex items-center justify-between gap-1"
                        >
                          <span className="truncate max-w-[170px] font-medium text-slate-700">{f.name}</span>
                          <span className="text-[8px] font-mono text-slate-450 uppercase">({f.source})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Render attached files container list */}
                {attachedFiles.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto pt-1 font-mono text-[10px]">
                    {attachedFiles.map(file => (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-1.5"
                        id={`attached-${file.id}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 font-sans text-xs">
                          {file.isDrive ? (
                            <FileText size={12} className="text-blue-550 shrink-0" />
                          ) : (
                            <File size={12} className="text-slate-500 shrink-0" />
                          )}
                          <span className="truncate text-slate-700 font-medium" title={file.name}>{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] font-mono text-slate-400">{file.size}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(file.id)}
                            className="p-0.5 hover:bg-slate-200 text-slate-450 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 py-2.5 px-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center font-sans">
                    No attachments linked
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerateOutline}
                disabled={generatingLesson || !specificTopic.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
              >
                {generatingLesson ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Assembling Curriculum Outlines...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    {parentNotificationDraft ? "Draft Announcement" : "Generate Syllabi Draft"}
                  </>
                )}
              </button>
            </div>

            {/* Presets segment */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">QUICK EXEMPLAR PRESETS</span>
              <div className="space-y-1 text-[11px]">
                <button 
                  type="button"
                  onClick={() => handleApplyPreset("Eco-system balance & bio-dome dynamics", "Science", "Grade 8")}
                  className="block w-full text-left p-1.5 hover:bg-slate-50 font-semibold text-slate-650 hover:text-blue-600 transition-all rounded-lg"
                >
                  → Biological Bio-dome Dynamics (Grade 8)
                </button>
                <button 
                  type="button"
                  onClick={() => handleApplyPreset("Shakespeare drama soliloquy & Socratic power seminars", "English Literature", "Grade 11 (AP Course)")}
                  className="block w-full text-left p-1.5 hover:bg-slate-50 font-semibold text-slate-650 hover:text-blue-600 transition-all rounded-lg"
                >
                  → Hamlet Tragic Soliloquy (AP English)
                </button>
              </div>
            </div>

          </div>

          {/* Outputs Section (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[520px] flex flex-col">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Syllabus Pacing & Curriculum Outline Workspace</span>
                <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">RENDERED MARKDOWN LAYOUT</span>
              </div>

              <div className="flex-1 overflow-y-auto pt-4 leading-relaxed font-sans text-xs text-slate-700 select-text">
                {generatingLesson ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-xs">
                      Connecting with Google Gemini models to construct comprehensive, aligned instructional blueprints. This might take 3-5 seconds...
                    </p>
                  </div>
                ) : lessonOutline ? (
                  <div className="space-y-3 prose-xs">
                    <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[11.5px] text-blue-800 mb-4 flex items-start gap-2.5 font-sans leading-relaxed">
                      <Lightbulb size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        This operational curriculum was dynamically tailored by Gemini using pedagogical paradigms mapped against regional criteria.
                      </div>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed font-sans select-text">
                      {lessonOutline}
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 max-w-sm mx-auto space-y-2.5">
                    <BookOpen size={36} className="text-slate-300" />
                    <h4 className="font-bold text-slate-700 font-sans">Copilot Blank Workspace</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Select teaching parameters, goals, and standards metrics on the sidebar controls directory, then hit "Generate Syllabi Draft" to run classroom templates creations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Automation Workflow builder Panel */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="nlp-automation-studio">
          
          {/* Workspace Left (Builder Input & Active Items) */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5.5 shadow-sm space-y-5">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">
                {canManageWorkflow ? "Workflow Automation Builder" : "Automation suggestions"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                {canManageWorkflow 
                  ? "Create and manage school-wide workflow rules."
                  : "Get reminders and suggested follow-ups created by your school."}
              </p>
            </div>

            {canManageWorkflow ? (
              <>
                <div className="space-y-3.5">
                  <textarea
                placeholder="e.g. When Algebra Course worksheets are modified on Drives, automatically create high urgency tasks to Grade assessments assigned to Teacher Marcus Vance."
                value={naturalCommand}
                onChange={(e) => setNaturalCommand(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white resize-none leading-relaxed shadow-inner"
              />

              {/* Shared attachments panel for automation commands */}
              <div className="pt-2 border-t border-slate-100 space-y-2" id="copilot-automation-attachments-panel">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] text-slate-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Paperclip size={11} className="text-slate-400" />
                    Resource Attachments ({attachedFiles.length})
                  </label>
                  <div className="flex items-center gap-1.5 text-[10.5px]">
                    <span className="text-slate-350">Add:</span>
                    <button
                      type="button"
                      onClick={() => setShowDriveAttach(!showDriveAttach)}
                      className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      Drive File
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      Local File
                    </button>
                  </div>
                </div>

                {/* Dropdown to attach from existing indexed Drive files */}
                {showDriveAttach && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 max-h-40 overflow-y-auto space-y-1 text-xs shadow-inner animate-fade-in relative z-20">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 pb-1.5 border-b border-slate-200 mb-1 font-mono font-bold">
                      <span>SELECT DRIVE DOCUMENT</span>
                      <button type="button" onClick={() => setShowDriveAttach(false)} className="text-slate-400 hover:text-slate-600">close</button>
                    </div>
                    {files.length === 0 ? (
                      <div className="text-[10.5px] text-slate-450 text-center py-2 italic font-medium">No files indexed in Google Workspace</div>
                    ) : (
                      files.map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleAttachDriveFile(f)}
                          className="w-full text-left py-1 px-1.5 hover:bg-white rounded-lg text-[10.5px] hover:text-blue-600 transition-all font-sans flex items-center justify-between gap-1"
                        >
                          <span className="truncate max-w-[170px] font-medium text-slate-700">{f.name}</span>
                          <span className="text-[8px] font-mono text-slate-450 uppercase">({f.source})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Render attached files container list */}
                {attachedFiles.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto pt-1 font-mono text-[10px]">
                    {attachedFiles.map(file => (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-1.5"
                        id={`automation-attached-${file.id}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 font-sans text-xs font-semibold">
                          {file.isDrive ? (
                            <FileText size={12} className="text-blue-550 shrink-0" />
                          ) : (
                            <File size={12} className="text-slate-500 shrink-0" />
                          )}
                          <span className="truncate text-slate-700 font-medium" title={file.name}>{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] font-mono text-slate-400">{file.size}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(file.id)}
                            className="p-0.5 hover:bg-slate-200 text-slate-450 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 py-2.5 px-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center font-sans">
                    No active blueprint materials attached
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleParseWorkflow}
                disabled={parsingWorkflow || !naturalCommand.trim()}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
              >
                {parsingWorkflow ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Translating Workflow Blueprint...
                  </>
                ) : (
                  <>
                    <Zap size={13} className="text-amber-400 fill-amber-400 animate-pulse" />
                    Submit Automation Blueprint
                  </>
                )}
              </button>
            </div>

            {/* Quick NLP prompts examples */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-40 tracking-wider block mb-1.5 font-mono">PROMPT EXAMPLES</span>
              <ul className="text-[10.5px] text-slate-500 space-y-2 font-mono leading-relaxed">
                <li className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-150" onClick={() => setNaturalCommand('Notify principal Linda Torres every Friday when student GPA falls below 2.0 risk thresholds in Math.')}>
                  → Weekly GPA risk summary notification
                </li>
                <li className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-150" onClick={() => setNaturalCommand('When orientation policy slides folder publishes in Google Drive, generate urgent checklist task for CTOAlbert to verify SSO permissions.')}>
                  → SSO check trigger on File Publication
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="space-y-4 pt-1.5 font-sans">
            <div className="p-4 bg-blue-50/50 text-blue-800 border border-blue-100 rounded-2xl space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-blue-700 block">How automations help you</span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Your school administrators configure automatic workflows to sync materials, send notifications, and align Classroom documents with curriculum guidelines automatically.
              </p>
            </div>
            <div className="space-y-3 pt-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">POPULAR REMINDERS FOR TEACHERS</span>
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-600">
                  <div className="font-bold text-slate-705 mb-0.5">Syllabus Progress Tracker</div>
                  Auto-tracks when uploaded outline PDFs match active curriculum plans.
                </div>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-600">
                  <div className="font-bold text-slate-705 mb-0.5">Classroom Sync Alert</div>
                  Sends automatic notifications when classroom resources are modified.
                </div>
              </div>
            </div>
          </div>
        )}

          </div>

          {/* Workspace Right (Parsed schema, active list) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Parsing Display */}
            {workflowBlueprint && (
              <div className="bg-white border border-slate-202 rounded-2xl p-5.5 shadow-sm space-y-4" id="ai-blueprint-card">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600" />
                    Parsed Operational Blueprint
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">GEMINI TRANSLATION</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Detailed Analysis Output */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto leading-relaxed text-xs text-slate-605 font-sans border border-slate-100 p-3 rounded-xl select-text bg-slate-50/50">
                    <span className="font-bold tracking-wide uppercase text-[9px] text-slate-400 block font-mono">AI LOG REPORT</span>
                    <p className="whitespace-pre-line text-[11px] font-mono leading-relaxed">{workflowBlueprint}</p>
                  </div>

                  {/* Schema Preview & Inject Button */}
                  {extractedRule && (
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="font-bold tracking-wide uppercase text-[9px] text-blue-650 block font-mono">Blueprinted Rule</span>
                        <div className="text-xs font-bold text-slate-805 font-sans">{extractedRule.title}</div>
                        <div className="text-[10px] text-slate-500 leading-relaxed font-sans">
                          <span className="font-bold text-slate-400 font-mono text-[9px]">TRIGGER:</span> {extractedRule.triggerDesc} <span className="text-blue-600 font-bold font-mono">({extractedRule.triggerType})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-relaxed font-sans">
                          <span className="font-bold text-slate-400 font-mono text-[9px]">ACTION:</span> {extractedRule.actionDesc} <span className="text-blue-600 font-bold font-mono font-mono">({extractedRule.actionType})</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveAutomation}
                        disabled={ruleSaved}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          ruleSaved 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {ruleSaved ? (
                          <>
                            <Check size={14} /> Rule Saved in Active Loop!
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Inject Rule into Active Stream
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Workspace Automation Streams */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5.5 shadow-sm space-y-4" id="active-automations-list-card">
              <h3 className="text-sm font-bold text-slate-800">
                Active Unified Automation Stream ({automations.length})
              </h3>
              
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto space-y-3">
                {automations.map(rule => (
                  <div key={rule.id} className="pt-3 flex items-start justify-between gap-4" id={`auto-rule-${rule.id}`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{rule.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          rule.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-400"
                        }`}>
                          {rule.isActive ? "ACTIVE" : "STANDBY"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans leading-relaxed">
                        <span className="text-slate-400 font-bold uppercase text-[9px] font-mono">ON:</span> {rule.triggerDesc}
                        <br />
                        <span className="text-slate-400 font-bold uppercase text-[9px] font-mono">DO:</span> {rule.actionDesc}
                      </div>

                      {rule.lastTriggered && (
                        <div className="text-[9px] text-slate-400 font-mono pt-0.5">
                          Last operational trigger log at: {new Date(rule.lastTriggered).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleAutomation(rule.id)}
                      className={`text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors`}
                    >
                      {rule.isActive ? (
                        <ToggleRight size={28} className="text-blue-600" />
                      ) : (
                        <ToggleLeft size={28} className="text-slate-300" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
