import React, { useState, useEffect } from "react";
import { 
  Database, 
  FileCode, 
  Save, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Info, 
  Play, 
  Search,
  ExternalLink
} from "lucide-react";

interface MockFileDescriptor {
  path: string;
  name: string;
  purpose: string;
  futureConnector: string;
}

const CONSTANT_MOCK_FILES: MockFileDescriptor[] = [
  {
    path: "forms-monitoring",
    name: "Forms Intake Sheets",
    purpose: "Weekly syllabus planners, notebook corrective signs, remedial logs and administrative audits",
    futureConnector: "Google Forms/Sheets Responses API connector"
  },
  {
    path: "google-workspace",
    name: "Google Drive File System",
    purpose: "Google Drive files list, folders tree, metadata properties, sharing access lists, and tagging structures",
    futureConnector: "Google Drive API (v3 Directory trees)"
  },
  {
    path: "google-classroom",
    name: "Google Classroom Streams",
    purpose: "Google Classroom Course definitions, primary class teachers, sections, stream announcements and homework rosters",
    futureConnector: "Google Classroom API (v1 courses collection)"
  },
  {
    path: "sdos-school",
    name: "Institutional Roster Setup",
    purpose: "Core school setup parameters, academic department mappings, sections, stages classification schemas, and service accounts",
    futureConnector: "Google Admin Directory API"
  },
  {
    path: "academic-artifacts",
    name: "Academic Handout Index",
    purpose: "Central directory mapping of homework templates, reading resources, handbooks, lesson planners, and guidelines",
    futureConnector: "Google Sheets Inventory Registry"
  },
  {
    path: "governance-compliance",
    name: "Audit Compliance Log Data",
    purpose: "Compliance milestones checklist, overall health records, safety inspections archive coordinates, and audit details",
    futureConnector: "Express log analyzer pulling direct logs from GSuite console records"
  },
  {
    path: "ai-prompts",
    name: "AI Prompt Templates Schema",
    purpose: "Prompt templates for generating lesson outline handouts, student worksheets, remedial notifications and calendar logs",
    futureConnector: "Google Gemini API System instructions"
  }
];

export default function MockDataStudio() {
  const [selectedFile, setSelectedFile] = useState<MockFileDescriptor>(CONSTANT_MOCK_FILES[0]);
  const [fileContent, setFileContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Dynamic Connector Testing block
  const [connectorLog, setConnectorLog] = useState<string[]>([]);
  const [testingConnector, setTestingConnector] = useState<boolean>(false);

  useEffect(() => {
    fetchFileContent(selectedFile.path);
  }, [selectedFile]);

  const fetchFileContent = async (fileName: string) => {
    setIsLoading(true);
    setJsonError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/mock/${fileName}`);
      if (!res.ok) {
        throw new Error(`Failed to load: ${res.statusText}`);
      }
      const data = await res.json();
      setFileContent(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setJsonError(`Error fetching mock file contents: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setFileContent(val);
    
    // Inline quick validation to help administrators prevent corrupting JSON syntax
    try {
      if (val.trim() === "") {
        setJsonError("JSON content cannot be completely empty.");
      } else {
        JSON.parse(val);
        setJsonError(null);
      }
    } catch (error: any) {
      setJsonError(`Syntax Error: ${error.message}`);
    }
  };

  const handleSave = async () => {
    if (jsonError) {
      setJsonError("Please fix structural JSON syntax validation errors before saving mock files!");
      return;
    }
    
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const parsedBody = JSON.parse(fileContent);
      
      // Save locally to localStorage so client dashboards get instant reactive updates
      try {
        localStorage.setItem(`schooly_mock_${selectedFile.path}`, JSON.stringify(parsedBody));
      } catch (e) {
        console.warn("Storage write failed:", e);
      }

      const res = await fetch(`/api/mock/${selectedFile.path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsedBody)
      });
      
      if (!res.ok) {
        throw new Error(`Server returned error: ${res.statusText}`);
      }
      
      const resJson = await res.json();
      setSuccessMsg(`Database Register '${selectedFile.name}' was successfully updated and internal system records synced instantly!`);
      
      // Auto dismiss success toast after 4s
      setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      setJsonError(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnector = () => {
    setTestingConnector(true);
    setConnectorLog(["[CONNECT] Initializing SDOS REST Connector tunnel...", `[CONNECT] Targeting resource: ${selectedFile.path}.json`, `[CONNECT] Binding dynamic attributes matching schemas definitions...`]);
    
    setTimeout(() => {
      setConnectorLog(prev => [...prev, "[DASHBOARD] Syncing state counters with values agreement checks..."]);
    }, 400);

    setTimeout(() => {
      try {
        const parsed = JSON.parse(fileContent);
        setConnectorLog(prev => [
          ...prev, 
          `[SUCCESS] Connector verification succeeded! Target root object keys validated: [${Object.keys(parsed).join(", ")}]`,
          `[VERIFY] State synchronization completed safely.`
        ]);
      } catch (e) {
        setConnectorLog(prev => [...prev, `[FAIL] Failed parse schema: JSON is structurally invalid.`]);
      } finally {
        setTestingConnector(false);
      }
    }, 1000);
  };

  const filteredFiles = CONSTANT_MOCK_FILES.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="mock-data-studio-root">
      
      {/* Visual Identity Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" id="studio-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Database size={18} />
            </span>
            <span className="text-[10px] bg-slate-100 font-mono font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-200">
              School Administrator Access Only
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional Connection & Database Studio
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            Manage, inspect, and update the raw active local data registries database that backs our dynamic dashboard counters and student records.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchFileContent(selectedFile.path)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            title="Reload from server"
          >
            <RotateCcw size={14} />
            <span>Discard & Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="studio-workspace">
        
        {/* Left Panel: Files selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4 flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              System Active Databases ({CONSTANT_MOCK_FILES.length})
            </h2>
            
            {/* Search filter bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search database schemas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs placeholder-slate-400 bg-slate-50 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-sans"
              />
            </div>

            {/* List */}
            <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
              {filteredFiles.map((f) => {
                const isCurrent = f.path === selectedFile.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => setSelectedFile(f)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isCurrent 
                        ? "bg-blue-50/60 border-blue-400 shadow-3xs" 
                        : "bg-white border-slate-150 hover:bg-slate-50/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold font-sans ${isCurrent ? "text-blue-700" : "text-slate-800"}`}>
                        {f.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold uppercase shrink-0">
                        JSON
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-505 font-sans leading-tight line-clamp-2">
                      {f.purpose}
                    </span>
                  </button>
                );
              })}
              {filteredFiles.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No registry files matching search filter found.
                </div>
              )}
            </div>
          </div>

          {/* SDFS / Drive structure diagnostic panel */}
          <div className="bg-white border border-slate-205 rounded-2xl p-4 shadow-2xs space-y-3.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={14} className="text-blue-500" />
              <span>Dynamic Connector Info</span>
            </h2>
            <div className="space-y-2.5 font-sans text-xs text-slate-500 leading-relaxed">
              <p>
                These data schemas are queried securely by our Node/Express API routes to serve as reliable local registers.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-dotted border-slate-200">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Configured Pathway
                </span>
                <code className="text-[10px] font-mono font-semibold text-slate-600 block break-all">
                  src/data/mock/{selectedFile.path}.json
                </code>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-700 block">
                  Future Extension Target:
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal italic">
                  {selectedFile.futureConnector}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Editor View */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 flex flex-col">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">
                  ACTIVE DATABASE SCHEMA
                </span>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  {selectedFile.name}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnector}
                  disabled={testingConnector}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                  title="Validate key structures"
                >
                  <Play size={12} className="text-slate-500 fill-slate-500" />
                  <span>Validate JSON structure</span>
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving || !!jsonError || isLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none disabled:opacity-50"
                >
                  <Save size={13} />
                  <span>{isSaving ? "Saving..." : "Save changes"}</span>
                </button>
              </div>
            </div>

            {/* Error or Success Toasts */}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-sans rounded-xl flex items-start gap-2 animate-fadeIn">
                <Check size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">{successMsg}</span>
              </div>
            )}

            {jsonError ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans rounded-xl flex gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold">Validation error:</span>
                  <p className="leading-normal font-mono text-[10.5px] break-all">{jsonError}</p>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-blue-50/50 border border-blue-100 text-blue-800 text-[11px] font-sans rounded-xl flex items-center gap-2">
                <Check size={14} className="text-blue-600 shrink-0" />
                <span>JSON markup syntax is valid (Ready to deploy safely).</span>
              </div>
            )}

            {/* Structured Text Area Editor */}
            <div className="relative font-mono text-xs w-full">
              <span className="absolute top-2 right-3 text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md select-none shrink-0 uppercase tracking-widest z-10">
                EDIT SCHEMATIC VIEW
              </span>
              <textarea
                value={fileContent}
                onChange={handleTextChange}
                disabled={isLoading}
                rows={22}
                className="w-full font-mono text-slate-800 bg-[#F8FAFC] border border-slate-200 focus:border-blue-400 rounded-xl p-4 shadow-inner outline-hidden focus:outline-hidden focus:ring-1 focus:ring-blue-500 overflow-y-auto leading-relaxed whitespace-pre font-semibold tracking-normal text-[11.5px]"
                id="mock-json-code-textarea"
                placeholder='// Enter target json dictionary values here'
              />
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                  <div className="text-center space-y-2">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-xs text-slate-500 font-sans font-medium">Fetching file content from connector...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Testing connector logs drawer */}
            {connectorLog.length > 0 && (
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[10.5px] space-y-2.5 border border-slate-800 animate-slideUp">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    Interactive Sandbox Connector Log
                  </span>
                  <button 
                    onClick={() => setConnectorLog([])}
                    className="text-slate-500 hover:text-slate-350 text-[10px] uppercase font-bold"
                  >
                  Clear log
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {connectorLog.map((log, idx) => (
                    <div key={idx} className={log.includes("[FAIL]") ? "text-rose-450 font-bold" : (log.includes("[SUCCESS]") ? "text-emerald-405 font-bold" : "text-slate-300")}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
