import React, { useState } from "react";
import { TaskItem, WorkspaceFile } from "../types";
import { schoolyFetch } from "../lib/safeFetch";
import { 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  FileText,
  CheckCircle2, 
  ArrowRight,
  Maximize2
} from "lucide-react";

interface TaskProductivityProps {
  tasks: TaskItem[];
  files: WorkspaceFile[];
  onAddTask: (task: Partial<TaskItem>) => void;
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (id: string) => void;
  currentUser: string;
  currentRole: string;
}

export default function TaskProductivity({
  tasks,
  files,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  currentUser,
  currentRole
}: TaskProductivityProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [showAddForm, setShowAddForm] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'individual' | 'team' | 'department' | 'school'>('all');
  const [newScope, setNewScope] = useState<'individual' | 'team' | 'department' | 'school'>('individual');
  
  // New Task Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [linkedFileId, setLinkedFileId] = useState("");

  // AI classifier states
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");

  // Submit New Task
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const linkedFile = files.find(f => f.id === linkedFileId);

    onAddTask({
      title,
      description,
      priority,
      status: "todo",
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      assignedTo: assignedTo || "Unassigned",
      fileId: linkedFileId || undefined,
      fileTitle: linkedFile ? linkedFile.name : undefined,
      scope: newScope
    });

    // Reset Form
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setAssignedTo("");
    setLinkedFileId("");
    setNewScope("individual");
    setShowAddForm(false);
    setAiFeedback("");
  };

  // Move task status
  const handleMoveTask = (id: string, currentStatus: 'todo' | 'in_progress' | 'done') => {
    let nextStatus: 'todo' | 'in_progress' | 'done' = 'in_progress';
    if (currentStatus === 'todo') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'done';
    else nextStatus = 'todo';

    onUpdateTask(id, { status: nextStatus });
  };

  // Run Gemini Productivity Urgency recommendations
  const handleAiCategorize = async () => {
    if (!title.trim()) return;
    setAiClassifying(true);
    setAiFeedback("");
    
    try {
      const res = await schoolyFetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantType: "productivity",
          prompt: `Classify the following school task and suggest priority level (Critical, High, Medium, Low) and due date rationale: Task Title: "${title}", Task Description: "${description || "No description provided"}". Return a short professional suggestion.`,
          extraContext: `Logged as ${currentUser} (${currentRole})`,
          user: currentUser,
          role: currentRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAiFeedback(data.text);
        
        // Auto select suggested priority based on output wording
        const txt = data.text.toLowerCase();
        if (txt.includes("critical")) setPriority("critical");
        else if (txt.includes("high")) setPriority("high");
        else if (txt.includes("low")) setPriority("low");
        else setPriority("medium");
      }
    } catch {
      setAiFeedback("AI prioritization failed. Check Gemini SDK config.");
    } finally {
      setAiClassifying(false);
    }
  };

  // Filter by scope first
  const filteredTasks = tasks.filter(t => {
    if (scopeFilter === 'all') return true;
    return (t.scope || 'individual') === scopeFilter;
  });

  // Kanban Columns
  const todoTasks = filteredTasks.filter(t => t.status === "todo");
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress");
  const doneTasks = filteredTasks.filter(t => t.status === "done");

  return (
    <div className="space-y-6" id="tasks-productivity-workspace">
      
      {/* Top action bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 border border-slate-150 p-1 rounded-xl bg-slate-50/50">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "kanban" ? "bg-slate-800 text-white shadow-xs" : "bg-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              Kanban Boards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "list" ? "bg-slate-800 text-white shadow-xs" : "bg-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              Tabular Tasks List
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-250 hidden md:block" />

          {/* Scope Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "All Board" },
              { id: "individual", label: "My Tasks" },
              { id: "team", label: "Team Tasks" },
              { id: "department", label: "Department Tasks" },
              { id: "school", label: "School Tasks" }
            ].map(scope => (
              <button
                key={scope.id}
                type="button"
                onClick={() => setScopeFilter(scope.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                  scopeFilter === scope.id 
                    ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" 
                    : "bg-white border-slate-150 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0 md:self-end xl:self-auto"
        >
          <Plus size={14} />
          {showAddForm ? "Hide Task Form" : "Create Workspace Task"}
        </button>
      </div>

      {/* Task Creation Drawer/Form Panel */}
      {showAddForm && (
        <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6" id="task-creation-form">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-850 block">Task Details</span>
            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1.5 font-semibold">TASK TITLE *</label>
              <input 
                type="text" 
                placeholder="Enter workspace task action..."
                 value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1.5 font-semibold">DESCRIPTION</label>
              <textarea 
                placeholder="Details, specifications or outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white resize-none shadow-inner"
              />
            </div>

            {/* AI Urgency classification block */}
            <div className="p-4 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-300 uppercase flex items-center gap-1.5 tracking-wider font-mono">
                  <Sparkles size={12} className="animate-pulse" />
                  AI Task Optimizer Co-Pilot
                </span>
                <button
                  type="button"
                  onClick={handleAiCategorize}
                  disabled={aiClassifying || !title.trim()}
                  className="text-[10px] text-blue-200 hover:text-white underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  {aiClassifying ? <Loader2 size={10} className="animate-spin" /> : "Analyse with Gemini"}
                </button>
              </div>

              {aiFeedback ? (
                <p className="text-[11px] text-slate-350 leading-relaxed font-sans select-text">
                  {aiFeedback}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-sans italic">
                  Enter task credentials above and click Analyze to receive priority audits and optimal categorization advice.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-850 block">Governance Parameters</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1.5 font-semibold">TASK PRIORITY</label>
                <select 
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
                >
                  <option value="critical">Critical Urgency</option>
                  <option value="high">High priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1.5 font-semibold">TASK SCOPE</label>
                <select 
                  value={newScope}
                  onChange={(e: any) => setNewScope(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
                >
                  <option value="individual">My Tasks (Individual)</option>
                  <option value="team">Team Tasks</option>
                  <option value="department">Department Tasks</option>
                  <option value="school">School / Campus Tasks</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1.5 font-semibold">DUE DATE</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 h-10"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1.5 font-semibold">ASSIGNED TO</label>
                <input 
                  type="text" 
                  placeholder="Advisor name..."
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1.5 font-semibold">LINK ASSOCIATED WORKSPACE DOCUMENT</label>
              <select 
                value={linkedFileId}
                onChange={(e) => setLinkedFileId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
              >
                <option value="">-- No linked files --</option>
                {files.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide transition-colors cursor-pointer shadow-xs"
              >
                Insert Task
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task Visualizations list views */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="kanban-grid-layout">
          {/* Todo Column */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-4" id="board-todo">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 font-bold"></span>
                TODO BACKLOG ({todoTasks.length})
              </span>
            </div>

            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
              {todoTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No tasks in backlog.</p>
              ) : (
                todoTasks.map(task => (
                  <TaskCard key={task.id} task={task} onMove={handleMoveTask} onDelete={onDeleteTask} />
                ))
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-4" id="board-in-progress">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 font-bold"></span>
                ACTIVE EXECUTION ({inProgressTasks.length})
              </span>
            </div>

            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
              {inProgressTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No tasks in progress.</p>
              ) : (
                inProgressTasks.map(task => (
                  <TaskCard key={task.id} task={task} onMove={handleMoveTask} onDelete={onDeleteTask} />
                ))
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-4" id="board-done">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 font-bold"></span>
                COMPLETED ARCHIVE ({doneTasks.length})
              </span>
            </div>

            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
              {doneTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No completed tasks yet.</p>
              ) : (
                doneTasks.map(task => (
                  <TaskCard key={task.id} task={task} onMove={handleMoveTask} onDelete={onDeleteTask} />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List Tabular representation */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="tasks-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono tracking-wider bg-slate-50/75 uppercase">
                  <th className="p-3.5 font-semibold text-slate-450">Priority</th>
                  <th className="p-3.5 font-semibold text-slate-450">Scope</th>
                  <th className="p-3.5 font-semibold text-slate-450">Task Details</th>
                  <th className="p-3.5 font-semibold text-slate-450">Linked Workspace Doc</th>
                  <th className="p-3.5 font-semibold text-slate-450">Assigned To</th>
                  <th className="p-3.5 font-semibold text-slate-450">Due-by</th>
                  <th className="p-3.5 font-semibold text-slate-450">Status</th>
                  <th className="p-3.5 font-semibold text-right text-slate-450 cursor-pointer">Modify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50" id={`task-item-row-${task.id}`}>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-block ${
                        task.priority === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        task.priority === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                        task.priority === 'low' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-150 text-slate-800 text-[10px] font-semibold border border-slate-200 uppercase font-mono">
                        {task.scope || 'individual'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{task.title}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-sm">{task.description}</div>
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[10px] truncate max-w-xs">
                      {task.fileTitle ? (
                        <span className="flex items-center gap-1.5 text-blue-600 font-semibold leading-none">
                           <FileText size={12} className="text-blue-500" />
                          {task.fileTitle}
                        </span>
                      ) : "--"}
                    </td>
                    <td className="p-3.5 text-slate-600 font-sans font-medium">{task.assignedTo}</td>
                    <td className="p-3.5 text-slate-500 font-mono">{task.dueDate}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        task.status === 'in_progress' ? 'bg-amber-50 text-amber-750 border border-amber-100' :
                        'bg-blue-50 text-blue-750 border border-blue-100'
                      }`}>
                        {task.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-1.5 bg-transparent">
                        <button
                          onClick={() => handleMoveTask(task.id, task.status)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer text-slate-705"
                        >
                          Convert State
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 hover:bg-rose-50 rounded-lg text-rose-500 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Kanban single task Card subcomponent
function TaskCard({ 
  task, 
  onMove, 
  onDelete 
}: { 
  key?: string;
  task: TaskItem; 
  onMove: (id: string, current: 'todo' | 'in_progress' | 'done') => void; 
  onDelete: (id: string) => void;
}) {

  return (
    <div className="p-4.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3.5 hover:border-blue-300 hover:shadow-sm transition-all text-xs" id={`card-${task.id}`}>
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
            task.priority === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
            task.priority === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
            task.priority === 'low' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700 border border-blue-100'
          }`}>
            {task.priority.toUpperCase()}
          </span>

          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-205 uppercase font-mono">
            {task.scope || 'individual'}
          </span>
        </div>

        <button 
          onClick={() => onDelete(task.id)}
          className="text-slate-300 hover:text-rose-550 p-1 rounded-md cursor-pointer transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="space-y-1">
        <h4 className="font-bold text-slate-800 leading-snug">{task.title}</h4>
        {task.description && <p className="text-slate-400 text-[10px] font-sans line-clamp-2 leading-relaxed">{task.description}</p>}
      </div>

      {/* Associated document attachment */}
      {task.fileTitle && (
        <div className="p-2 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-1.5 text-[10px] text-blue-700 font-mono font-semibold">
          <FileText size={12} className="shrink-0 text-blue-500" />
          <span className="truncate" title={task.fileTitle}>{task.fileTitle}</span>
        </div>
      )}

      {/* Schedule Meta info footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1"><User size={10} /> {task.assignedTo}</span>
        <span className="flex items-center gap-1"><Calendar size={10} /> {task.dueDate}</span>
      </div>

      {/* Status control */}
      <button
        onClick={() => onMove(task.id, task.status)}
        className="w-full mt-1.5 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-605 rounded-xl text-[10px] font-bold border border-slate-150 transition-colors flex items-center justify-center gap-1 cursor-pointer"
      >
        <span>
          {task.status === 'todo' ? "Start Task" : task.status === 'in_progress' ? "Complete Task" : "Reset Backlog"}
        </span>
        <ArrowRight size={10} />
      </button>

    </div>
  );
}
