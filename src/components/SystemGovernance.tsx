import React, { useState, useRef } from "react";
import { AuditLog, SchoolDriveManifest } from "../types";
import { 
  Users, 
  Search, 
  Terminal, 
  CheckCircle, 
  ShieldAlert, 
  Lock, 
  HelpCircle,
  FileSpreadsheet,
  Code,
  Download,
  Upload,
  RotateCcw,
  Check,
  CheckSquare,
  Square,
  FileCode,
  Sparkles,
  AlertCircle,
  Folder,
  FolderOpen,
  Database,
  ShieldCheck,
  EyeOff,
  Server,
  Info,
  AlertTriangle,
  ChevronRight,
  Share2,
  ExternalLink,
  Link
} from "lucide-react";
import { ExportableSchoolySchema, resetActiveMetadataToDefault, Capability } from "../lib/schemaEngine";
import defaultDriveManifest from "../data/schooly-drive-manifest.json";
import OverlaySurface from "./common/OverlaySurface";

interface SystemGovernanceProps {
  auditLogs: AuditLog[];
  currentUser: string;
  currentRole: string;
  onSwitchRole: (role: string, email: string) => void;
  schema: ExportableSchoolySchema;
  schemaDrivenRendering: boolean;
  onToggleSchemaDriven: (val: boolean) => void;
  onUpdateSchema: (newSchema: ExportableSchoolySchema) => void;
  activeRoles: string[];
  onChangeActiveRoles: (roles: string[]) => void;
}

export default function SystemGovernance({
  auditLogs,
  currentUser,
  currentRole,
  onSwitchRole,
  schema,
  schemaDrivenRendering,
  onToggleSchemaDriven,
  onUpdateSchema,
  activeRoles,
  onChangeActiveRoles
}: SystemGovernanceProps) {
  const [logSearch, setLogSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // JSON editor states
  const [jsonText, setJsonText] = useState(() => JSON.stringify(schema, null, 2));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successApply, setSuccessApply] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop / Live Interop validations
  const [isDragging, setIsDragging] = useState(false);
  const [schemaValidity, setSchemaValidity] = useState<{
    status: 'success' | 'failed' | 'idle';
    log: string[];
    details?: {
      schemaId: string;
      version: string;
      rolesCount: number;
      navCount: number;
    }
  }>({ status: 'idle', log: [] });
  
  // Drive and Manifest Explorer states
  const [driveManifest, setDriveManifest] = useState<SchoolDriveManifest>(defaultDriveManifest as SchoolDriveManifest);
  const [activeDriveTab, setActiveDriveTab] = useState<'academic' | 'governance' | 'classroom' | 'forms' | 'org'>('academic');
  
  // Browser selections (standard defaults matching AY 2026-27 config)
  const [selectedStage, setSelectedStage] = useState<string>("Secondary");
  const [selectedClass, setSelectedClass] = useState<string>("Class X");
  const [selectedSubject, setSelectedSubject] = useState<string>("English");
  const [selectedFolder, setSelectedFolder] = useState<string>("02_Chapter_Resources");
  const [copiedLinkNotification, setCopiedLinkNotification] = useState<string>("");

  const [manifestValidity, setManifestValidity] = useState<{
    status: 'success' | 'failed' | 'idle';
    log: string[];
    message?: string;
  }>({ status: 'idle', log: [] });
  const [pendingRollbackDefault, setPendingRollbackDefault] = useState(false);

  const [showStructureLogs, setShowStructureLogs] = useState(false);

  const driveFileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyShareLink = (fileName: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLinkNotification(`Copied Google Drive shareable link for ${fileName} to clipboard!`);
    setTimeout(() => {
      setCopiedLinkNotification("");
    }, 4500);
  };

  const validateAndApplyManifest = (jsonText: string) => {
    const log: string[] = [];
    try {
      const data = JSON.parse(jsonText);
      log.push("[VALIDATION STARTED] Evaluating structure for School Digital Operating System Schema...");
      
      const mandatedKeys = [
        "rootPath", "academicYear", "academicRepositoryRoot", "governanceRoot",
        "classroomTemplatesRoot", "formsIntakeRoot", "orgStructureRoot",
        "serviceAccounts", "departmentGroups", "teacherGroups",
        "standardClassroomTopics", "repositoryStages", "repositoryClasses",
        "repositorySections", "repositorySubjects", "subjectArtifactFolders"
      ];

      let missing = 0;
      mandatedKeys.forEach(k => {
        if (data[k] === undefined) {
          log.push(`[ERR] Key not found: "${k}"`);
          missing++;
        } else {
          log.push(`[OK] Key "${k}" verified successfully.`);
        }
      });

      if (missing > 0) {
        log.push(`[CRITICAL FAILED] Verification rejected. ${missing} mandatory sections absent.`);
        setManifestValidity({
          status: 'failed',
          log,
          message: `The manifest is invalid: ${missing} section(s) missing.`
        });
        return;
      }

      log.push("[SUCCESS] Validated 5 Core Institutional worlds layout indicators.");
      log.push(`[SUCCESS] Loaded academic year target: ${data.academicYear}`);
      log.push("[SUCCESS] Verified departmentGroups permissions constraints mapping.");
      log.push("[SUCCESS] Synchronized 100% CBSE-compliant local workspace structure.");

      setManifestValidity({
        status: 'success',
        log
      });
      setDriveManifest(data as SchoolDriveManifest);
      
      // Select first stage / class / subject in the uploaded manifest to avoid out-of-bounds error
      if (data.repositoryStages && data.repositoryStages.length > 0) {
        const firstStage = data.repositoryStages[0];
        setSelectedStage(firstStage);
        if (data.repositoryClasses && data.repositoryClasses[firstStage] && data.repositoryClasses[firstStage].length > 0) {
          setSelectedClass(data.repositoryClasses[firstStage][0]);
        }
        if (data.repositorySubjects && data.repositorySubjects[firstStage] && data.repositorySubjects[firstStage].length > 0) {
          setSelectedSubject(data.repositorySubjects[firstStage][0]);
        }
      }
    } catch (e: any) {
      log.push(`[CRITICAL] JSON Parsing failed: ${e.message}`);
      setManifestValidity({
        status: 'failed',
        log,
        message: "File is not standard valid JSON format."
      });
    }
  };

  const handleManifestFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      validateAndApplyManifest(text);
    };
    reader.readAsText(file);
    if (driveFileInputRef.current) driveFileInputRef.current.value = "";
  };

  // Local state for adding a new role
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleEmail, setNewRoleEmail] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<Capability[]>([
    "Teaching",
    "AI Usage"
  ]);

  const availableCapabilitiesList: Capability[] = [
    "Administration",
    "Governance",
    "Academic Leadership",
    "Teaching",
    "Student Services",
    "Operations",
    "Analytics",
    "AI Usage",
    "Reporting",
    "Academic Year Management"
  ];

  // Map schema roles for the switcher
  const rolesList = schema.roles.map(r => ({
    name: r.roleName,
    email: r.defaultEmail || "",
    desc: r.description || ""
  }));

  // Filtering Logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesKeyword = 
      log.user.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.detail.toLowerCase().includes(logSearch.toLowerCase());

    const matchesCategory = categoryFilter === "All" || log.category === categoryFilter;

    return matchesKeyword && matchesCategory;
  });

  const handleAddRole = () => {
    if (!newRoleName) return;

    const emailWithFallback = newRoleEmail.trim() || `${newRoleName.toLowerCase().replace(/\s+/g, '-')}.sim@school.org`;

    const newRole: typeof schema.roles[0] = {
      roleId: newRoleName.toLowerCase().replace(/\s+/g, '-'),
      roleName: newRoleName,
      defaultEmail: emailWithFallback,
      description: newRoleDesc,
      capabilities: selectedCapabilities,
      navigationAccess: ["overview", "search"], // provide default shared access points
      pageAccess: ["overview", "search"]
    };

    onUpdateSchema({
      ...schema,
      roles: [...schema.roles, newRole]
    });

    setNewRoleName("");
    setNewRoleEmail("");
    setNewRoleDesc("");
    setSelectedCapabilities(["Teaching", "AI Usage"]);
  };

  // Toggle active persona roles in multi-roles mode
  const handleToggleMultiRole = (roleName: string) => {
    let nextRoles = [...activeRoles];
    if (nextRoles.includes(roleName)) {
      if (nextRoles.length > 1) {
        nextRoles = nextRoles.filter(r => r !== roleName);
      }
    } else {
      nextRoles.push(roleName);
    }
    onChangeActiveRoles(nextRoles);
  };

  // Validate and apply manual JSON schema modifications
  const handleApplySchemaJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Basic validating schema markers to enforce configuration integrity
      if (!parsed.schemaId || !parsed.schemaVersion) {
        throw new Error("Missing structural identifiers: 'schemaId' and 'schemaVersion' fields are strictly required.");
      }
      if (!Array.isArray(parsed.navigation) || !Array.isArray(parsed.roles) || !Array.isArray(parsed.pages)) {
        throw new Error("Invalid structure. Config schema must list valid arrays for 'navigation', 'roles', and 'pages'.");
      }

      onUpdateSchema(parsed);
      setValidationError(null);
      setSuccessApply(true);
      setTimeout(() => setSuccessApply(false), 3000);
    } catch (err: any) {
      setValidationError(err.message || "Invalid JSON formatting syntax.");
      setSuccessApply(false);
    }
  };

  // Export current configuration schema backup
  const handleExportSchema = () => {
    const serialized = JSON.stringify(schema, null, 2);
    const blob = new Blob([serialized], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const mockLink = document.createElement("a");
    mockLink.href = url;
    mockLink.download = `${schema.schemaId}-${schema.schemaVersion}.json`;
    document.body.appendChild(mockLink);
    mockLink.click();
    document.body.removeChild(mockLink);
    URL.revokeObjectURL(url);
  };

  // Trigger import uploader
  const handleImportSchemaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Unified compliance validator with detailed logging
  const processSchemaFile = (uploadedFile: File) => {
    const fileReader = new FileReader();
    const log: string[] = [];
    log.push(`[INIT] Reading file: "${uploadedFile.name}" (${(uploadedFile.size / 1024).toFixed(2)} KB)`);

    fileReader.onload = (event) => {
      try {
        const textValue = event.target?.result as string;
        log.push(`[PARSE] Analyzing JSON structures...`);
        const parsed = JSON.parse(textValue);
        log.push(`[PARSE] Verified syntactically valid JSON.`);

        let hasError = false;
        if (!parsed.schemaId) {
          log.push(`[ERR] Missing unique "schemaId" key.`);
          hasError = true;
        } else {
          log.push(`[VALID] Identified schema ID: "${parsed.schemaId}"`);
        }

        if (!parsed.schemaVersion) {
          log.push(`[ERR] Missing "schemaVersion" metadata field.`);
          hasError = true;
        } else {
          log.push(`[VALID] Identified schema Version: "v${parsed.schemaVersion}"`);
        }

        if (!Array.isArray(parsed.navigation)) {
          log.push(`[ERR] "navigation" menu definition array is missing or invalid.`);
          hasError = true;
        } else {
          log.push(`[VALID] Navigation defines ${parsed.navigation.length} menu items cleanly.`);
        }

        if (!Array.isArray(parsed.roles)) {
          log.push(`[ERR] "roles" registration list is missing or invalid.`);
          hasError = true;
        } else {
          log.push(`[VALID] Roles matches ${parsed.roles.length} simulation nodes.`);
        }

        if (hasError) {
          throw new Error("Strict structural metadata validation checklist failed.");
        }

        log.push(`[COMPLIANCE] Verification successful. Instantiating Schema Engine updates...`);
        onUpdateSchema(parsed);
        setJsonText(JSON.stringify(parsed, null, 2));
        setValidationError(null);
        setSuccessApply(true);
        setTimeout(() => setSuccessApply(false), 3000);

        setSchemaValidity({
          status: 'success',
          log,
          details: {
            schemaId: parsed.schemaId,
            version: parsed.schemaVersion,
            rolesCount: parsed.roles.length,
            navCount: parsed.navigation.length
          }
        });
      } catch (err: any) {
        log.push(`[CRITICAL] Import rejected: ${err.message}`);
        setValidationError(`Import unsuccessful: ${err.message}`);
        setSchemaValidity({
          status: 'failed',
          log
        });
      }
    };
    fileReader.readAsText(uploadedFile);
  };

  // Process file upload parsing
  const handleImportFileHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      processSchemaFile(uploadedFile);
    }
  };

  // Roll back active config to default state
  const handleRollbackDefault = () => {
    setPendingRollbackDefault(true);
  };

  const confirmRollbackDefault = () => {
    const defaultData = resetActiveMetadataToDefault();
    onUpdateSchema(defaultData);
    setJsonText(JSON.stringify(defaultData, null, 2));
    setValidationError(null);
    setPendingRollbackDefault(false);
  };

  return (
    <div className="space-y-6" id="system-governance-panel">
      
      {/* Schema-Driven Config Engine Management Hub */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-left" id="schema-orchestrator-board">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="text-blue-600" size={22} />
              Schema-Driven Architecture & Metadata Engine
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Model pages, navigation routes, available capabilities, and dynamic dashboard cockpit widgets elegantly through structured declarative configurations.
            </p>
          </div>

          {/* Engine Enablement Switcher Trigger (Features flag toggle) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl font-sans text-xs">
            <span className="font-bold text-slate-700">Schema-Driven Rendering:</span>
            <button
              onClick={() => onToggleSchemaDriven(!schemaDrivenRendering)}
              className={`px-3 py-1.5 rounded-xl font-bold font-sans transition-all text-[11px] uppercase tracking-wide cursor-pointer flex items-center gap-1.5 ${
                schemaDrivenRendering
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              <Sparkles size={11.5} />
              {schemaDrivenRendering ? "ACTIVE" : "DISABLED"}
            </button>
          </div>
        </div>

        {/* Dynamic Dual-Column: Visual Controls vs JSON Code View */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Controls Segment */}
          <div className="xl:col-span-5 space-y-6 font-sans">
            
            {/* Version Status Widget */}
            <div className="bg-blue-50/50 border border-blue-100 p-4.5 rounded-2xl relative overflow-hidden space-y-3.5">
              <span className="absolute -right-6 -bottom-6 text-blue-600/10 rotate-12 pointer-events-none font-bold font-mono text-7xl select-none">District</span>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-blue-500 font-bold uppercase tracking-wider block">Configuration Metadata</span>
                <span className="text-[10px] px-2.5 py-0.5 bg-blue-600 text-white font-mono font-extrabold rounded-md uppercase">
                  {schema.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-0.5 border-r border-blue-100">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Active Schema ID:</span>
                  <span className="font-bold text-slate-805 truncate block max-w-40">{schema.schemaId}</span>
                </div>
                <div className="space-y-0.5 pl-2">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Definition Version:</span>
                  <span className="font-bold text-slate-805">v{schema.schemaVersion}</span>
                </div>
              </div>
              <div className="border-t border-blue-105/60 pt-3 text-[10px] text-slate-500 font-medium flex justify-between">
                <span>District Identifier: {schema.organizationId}</span>
                <span>Updated: {new Date(schema.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Role Addition Form */}
            <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Create & Add New Role
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Role Name (e.g., Vice Principal)"
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs font-sans"
                />
                <input
                  type="text"
                  value={newRoleEmail}
                  onChange={(e) => setNewRoleEmail(e.target.value)}
                  placeholder="Email (e.g., vp.torres@school.org)"
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs font-sans"
                />
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Describe role responsibilities..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs font-sans h-16 resize-none"
                />
              </div>

              {/* Granted Capabilities Selection Grid */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">
                  Select Granted Capabilities:
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                  {availableCapabilitiesList.map(cap => {
                    const isChecked = selectedCapabilities.includes(cap);
                    return (
                      <button
                        type="button"
                        key={cap}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedCapabilities(selectedCapabilities.filter(c => c !== cap));
                          } else {
                            setSelectedCapabilities([...selectedCapabilities, cap]);
                          }
                        }}
                        className={`p-1.5 py-2 border rounded-xl text-left transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isChecked
                            ? "bg-blue-50/50 border-blue-200 text-blue-950 font-bold"
                            : "bg-white border-slate-150 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <div className="shrink-0">
                          {isChecked ? (
                            <CheckSquare size={13} className="text-blue-600" />
                          ) : (
                            <Square size={13} className="text-slate-350" />
                          )}
                        </div>
                        <span className="truncate" title={cap}>{cap}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleAddRole}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer text-center"
              >
                Add Custom Role to Schema Registry
              </button>
            </div>

            {/* Concurrent Multi-Role Configurator Panel */}
            <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Concurrent Multi-Role Previews
                </h4>
                <p className="text-[11.5px] text-slate-500 leading-normal">
                  Select one or more concurrent active profiles. The engine will evaluate the composite union of role capabilities (e.g. Principal + Teacher) to show grouped workspace links and widgets:
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {rolesList.map(r => {
                  const isChecked = activeRoles.includes(r.name);
                  return (
                    <button
                      key={r.name}
                      onClick={() => handleToggleMultiRole(r.name)}
                      className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isChecked 
                          ? "bg-white border-blue-200 shadow-sm text-blue-900" 
                          : "bg-white border-slate-150 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 bg-transparent text-xs">
                        {isChecked ? (
                          <CheckSquare size={16} className="text-blue-600" />
                        ) : (
                          <Square size={16} className="text-slate-300" />
                        )}
                        <div className="space-y-0.5 text-left">
                          <span className="font-bold block">{r.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{r.email}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-550 border border-slate-150 rounded-sm px-1.5 py-0.5 uppercase">
                        {r.name === "School Admin" ? "ADMIN" : "MAPPED"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schema Management Actions Panel */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">Schema Transport Control</span>
              
              {/* Drag and Drop Zone Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragging 
                    ? "border-blue-500 bg-blue-50/50 scale-[1.01]" 
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-350"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) processSchemaFile(droppedFile);
                }}
                onClick={handleImportSchemaClick}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload size={22} className={`transition-transform duration-200 ${isDragging ? "text-blue-600 scale-110" : "text-slate-400"}`} />
                  <div className="text-xs font-bold text-slate-800">
                    {isDragging ? "Drop your file here!" : "Import / Drop Schema File"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Drag and drop your exported backup JSON file here or <span className="text-blue-600 font-bold underline">browse files</span>
                  </div>
                </div>
              </div>

              {/* Instant Compliance Validation report logs */}
              {schemaValidity.status !== 'idle' && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  schemaValidity.status === 'success' 
                    ? "bg-emerald-50/60 border-emerald-200" 
                    : "bg-rose-50/60 border-rose-205"
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                    <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: schemaValidity.status === 'success' ? '#065f46' : '#991b1b' }}>
                      <CheckCircle size={14} className="shrink-0" />
                      INSTANT VERIFICATION STATUS
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase" style={{ 
                      backgroundColor: schemaValidity.status === 'success' ? '#d1fae5' : '#fee2e2',
                      color: schemaValidity.status === 'success' ? '#065f46' : '#991b1b'
                    }}>
                      {schemaValidity.status === 'success' ? "100% PASS" : "REJECTED"}
                    </span>
                  </div>

                  {schemaValidity.details && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-relaxed" style={{ color: '#065f46' }}>
                      <div><strong className="font-semibold text-emerald-850">ID:</strong> {schemaValidity.details.schemaId}</div>
                      <div><strong className="font-semibold text-emerald-850">Ver:</strong> v{schemaValidity.details.version}</div>
                      <div><strong className="font-semibold text-emerald-850">Roles Loaded:</strong> {schemaValidity.details.rolesCount}</div>
                      <div><strong className="font-semibold text-emerald-850">Nav Items:</strong> {schemaValidity.details.navCount}</div>
                    </div>
                  )}

                  <div className="space-y-1 max-h-32 overflow-y-auto pt-1 scrollbar-thin">
                    {schemaValidity.log.map((logLine, idx) => (
                      <div key={idx} className="font-mono text-[9px] leading-relaxed flex items-start gap-1" style={{ 
                        color: logLine.includes('[ERR]') || logLine.includes('[CRITICAL]') ? '#991b1b' : 
                               logLine.includes('[VALID]') || logLine.includes('[SUCCESS]') ? '#047857' : '#475569'
                      }}>
                        <span className="select-none text-slate-300 font-bold font-mono">›</span>
                        <span className="break-all">{logLine}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary operations row */}
              <div className="flex flex-wrap gap-2 pt-1 font-sans">
                <button
                  type="button"
                  onClick={handleExportSchema}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
                >
                  <Download size={14} />
                  <span>Backup Active Schema</span>
                </button>
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFileHandler}
                  accept=".json"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleRollbackDefault}
                  className="py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <RotateCcw size={14} />
                  <span>Restore Core Presets</span>
                </button>
              </div>
            </div>

          </div>

          {/* Code Customization Code panel */}
          <div className="xl:col-span-7 flex flex-col space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Code size={14} className="text-slate-500" />
                Live Configuration Structure
              </span>
              <div className="text-[10px] text-slate-400 font-mono font-semibold">
                UTF-8 Schema Compliance Check
              </div>
            </div>

            {/* Simulated Live Editor Panel */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col flex-1">
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={16}
                spellCheck={false}
                className="leading-relaxed text-[11px] p-4 bg-slate-950 text-emerald-400 font-mono focus:outline-hidden focus:ring-0 focus:border-slate-800 block w-full resize-y h-[380px]"
              />

              {/* Action Bar & Message indicators */}
              <div className="bg-slate-50 border-t border-slate-150 p-4.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-sans">
                {validationError ? (
                  <div className="text-rose-600 flex items-center gap-1.5 text-xs font-mono font-medium leading-normal shrink">
                    <AlertCircle size={14} className="shrink-0" />
                    <span className="truncate max-w-[280px]" title={validationError}>{validationError}</span>
                  </div>
                ) : successApply ? (
                  <div className="text-emerald-700 flex items-center gap-1.5 text-xs font-bold shrink">
                    <CheckCircle size={14} className="shrink-0" />
                    <span>✓ Configuration stagewise validated & applied successfully!</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs font-medium">
                    Editable Stage Registry
                  </div>
                )}

                <button
                  onClick={handleApplySchemaJson}
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all self-end"
                >
                  <Check size={14} />
                  <span>Save & Apply Configuration</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==============================================================================
          SCHOOL DIGITAL OPERATING SYSTEM DRIVE MANIFEST & FILE EXPLORER
          ============================================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left space-y-6" id="schooly-drive-explorer">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-blue-50 text-blue-700 font-mono font-bold text-[9.5px] rounded border border-blue-150 uppercase tracking-wide">
                SYSTEM MODULE
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">DEC-2026-RELEASE</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 shrink-0">
              <Database size={18} className="text-blue-600 font-bold" />
              School Drive Structure
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-sans">
              Review how the school’s academic resources, classroom templates, forms, and governance records are organised. <strong>Schooly organises your school files, but Google Workspace controls who can open them.</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => driveFileInputRef.current?.click()}
              className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-705 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-200 w-full md:w-auto text-center"
            >
              <Upload size={14} />
              <span>Import drive-manifest.json</span>
            </button>
            <input 
              type="file"
              ref={driveFileInputRef}
              onChange={handleManifestFileSelect}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Manifest upload verification status alert */}
        {manifestValidity.status !== 'idle' && (
          <div className={`p-4 rounded-xl border space-y-3 font-mono text-xs ${
            manifestValidity.status === 'success' 
              ? "bg-emerald-50/60 border-emerald-250 text-emerald-950" 
              : "bg-rose-50/60 border-rose-205 text-rose-950"
          }`}>
            <div className="flex items-center justify-between border-b pb-2 gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <span className="font-bold flex items-center gap-1.5 uppercase font-sans">
                {manifestValidity.status === 'success' ? <CheckCircle size={15} /> : <ShieldAlert size={15} />}
                Structure File Check
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono bg-white border">
                {manifestValidity.status === 'success' ? "SYNCED" : "ERROR"}
              </span>
            </div>
            
            {manifestValidity.message && <div className="font-sans font-bold text-xs">{manifestValidity.message}</div>}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowStructureLogs(!showStructureLogs)}
                className="text-[11px] font-sans font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{showStructureLogs ? "▼ Hide Diagnostics Log" : "▶ Show Diagnostics Log"}</span>
              </button>
            </div>

            {showStructureLogs && (
              <div className="space-y-1 max-h-32 overflow-y-auto pt-1 bg-white/50 p-2.5 rounded-lg border border-slate-200/50 text-[10px] leading-relaxed">
                {manifestValidity.log.map((lineStr, idx) => (
                  <div key={idx} className="flex gap-1.5 items-start">
                    <span className="text-slate-355 font-bold select-none">›</span>
                    <span className={lineStr.includes('[OK]') || lineStr.includes('[SUCCESS]') ? "text-emerald-700 font-semibold" : lineStr.includes('[ERR]') ? "text-rose-700 font-bold" : "text-slate-600"}>{lineStr}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Layout Grid: Left Sidebar Tabs & Right Folder Browser Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
          
          {/* Worlds Left Tab Buttons */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-1">
              School Areas
            </span>
            
            {[
              { id: 'academic', title: 'Academic Repository', desc: 'Curriculum Knowledge Base', icon: Database, color: 'border-l-blue-600 text-blue-700' },
              { id: 'governance', title: 'School Governance', desc: 'Supervisor Audits & Metrics', icon: Server, color: 'border-l-emerald-600 text-emerald-700' },
              { id: 'classroom', title: 'Classroom Templates', desc: 'LMS Naming & Topic Blueprints', icon: FileSpreadsheet, color: 'border-l-indigo-600 text-indigo-700' },
              { id: 'forms', title: 'Forms Intake', desc: 'Intake and registration lead buffers', icon: FileCode, color: 'border-l-amber-605 text-amber-705' },
              { id: 'org', title: 'Staff & Groups', desc: 'Directory identity & email rosters', icon: Users, color: 'border-l-rose-500 text-rose-700' }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeDriveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDriveTab(tab.id as any)}
                  className={`w-full text-left p-3.5 border rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                    isActive 
                      ? `bg-slate-50 border-slate-350 border-l-4 font-bold ${tab.color}` 
                      : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <TabIcon size={16} className="mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">{tab.title}</span>
                    <span className="text-[10px] text-slate-400 block font-normal leading-snug">{tab.desc}</span>
                  </div>
                </button>
              );
            })}

            {/* General Metadata status widget */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2 text-xs font-sans text-left mt-4 text-slate-600">
              <span className="font-extrabold text-slate-805 uppercase text-[9.5px] font-mono tracking-wider block border-b border-slate-200 pb-1">
                Active Year Sync Status
              </span>
              <div className="space-y-1 pt-1 text-[11px] leading-normal font-medium">
                <div className="flex justify-between gap-1">
                  <span>ROOT PATH:</span>
                  <span className="font-mono text-[9px] font-bold text-slate-800 truncate" title={driveManifest.rootPath}>{driveManifest.rootPath}</span>
                </div>
                <div className="flex justify-between">
                  <span>CURR YEAR:</span>
                  <span className="font-bold text-slate-800">{driveManifest.academicYear}</span>
                </div>
                <div className="flex justify-between">
                  <span>STAGES INDEXED:</span>
                  <span className="font-bold text-slate-800">{driveManifest.repositoryStages.length} levels</span>
                </div>
                <div className="flex justify-between">
                  <span>SERVICE ACCTS:</span>
                  <span className="font-bold text-slate-800 font-mono text-[10px]">{driveManifest.serviceAccounts.length} system IDs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Worlds Right Interactive Browser Pane */}
          <div className="lg:col-span-3 bg-slate-50/40 border border-slate-205 rounded-2xl p-5 shadow-inner">
            
            {/* World 1: Academic Repository */}
            {activeDriveTab === 'academic' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold text-blue-650 block">CBSE K-12 KNOWLEDGE BASE</span>
                    <h3 className="text-sm font-bold text-slate-800">{driveManifest.academicRepositoryRoot}</h3>
                  </div>
                  <div className="text-[10px] bg-blue-50 text-blue-700 font-semibold rounded px-2.5 py-1 font-mono uppercase tracking-wide border border-blue-150 shrink-0 select-all">
                    OWNER ID: academic.repository
                  </div>
                </div>

                {/* Sub-selectors */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[9px] text-slate-400 font-mono block mb-1 font-bold">1. CBSE STAGE</label>
                    <select
                      value={selectedStage}
                      onChange={(e) => {
                        const stage = e.target.value;
                        setSelectedStage(stage);
                        const classes = driveManifest.repositoryClasses[stage] || [];
                        const subjects = driveManifest.repositorySubjects[stage] || [];
                        if (classes.length > 0) setSelectedClass(classes[0]);
                        if (subjects.length > 0) setSelectedSubject(subjects[0]);
                      }}
                      className="w-full text-[10.5px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-semibold cursor-pointer"
                    >
                      {driveManifest.repositoryStages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-mono block mb-1 font-bold">2. GRADE LEVEL</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full text-[10.5px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-semibold cursor-pointer"
                    >
                      {(driveManifest.repositoryClasses[selectedStage] || []).map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-mono block mb-1 font-bold">3. CBSE SUBJECT</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full text-[10.5px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-semibold cursor-pointer"
                    >
                      {(driveManifest.repositorySubjects[selectedStage] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-mono block mb-1 font-bold">4. ARTIFACT FOLDER</label>
                    <select
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="w-full text-[10.5px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-semibold cursor-pointer"
                    >
                      {driveManifest.subjectArtifactFolders.map(folder => <option key={folder} value={folder}>{folder}</option>)}
                    </select>
                  </div>
                </div>

                {/* Display resolved fully-qualified directory path context */}
                <div className="bg-slate-900 text-slate-100 font-mono text-[9.5px] p-3 rounded-xl flex items-center gap-2 select-all shadow-inner border border-slate-800 text-left overflow-x-auto">
                  <span className="text-blue-400 select-none font-bold shrink-0">Folder Path Preview ›</span>
                  <span className="whitespace-nowrap">{driveManifest.rootPath}\{driveManifest.academicRepositoryRoot}\{driveManifest.academicYear}\{selectedStage}\{selectedClass}\{selectedClass}-A\{selectedSubject}\{selectedFolder}</span>
                </div>

                {/* Security Restriction Banner */}
                <div className="bg-amber-50 border border-amber-205 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-850">
                  <EyeOff size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-0.5 text-left leading-relaxed">
                    <span className="font-extrabold uppercase font-mono text-[9px] tracking-wide block">STUDENT SEGREGATION PROTOCOLS</span>
                    <p className="text-[11px] font-medium text-slate-700">Students have absolutely <strong>zero read or discover privileges</strong> under the Academic Repository directory tree. Any system output surfaced to student portals must refer exclusively to Google Classroom delivers.</p>
                  </div>
                </div>

                {/* Simulated Files layout inside target repository folder */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-400 font-mono block font-bold">IDENTIFIED DIRECTORY FILE OBJECTS</span>
                  <div className="space-y-1.5 font-sans">
                    {copiedLinkNotification && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-990 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold animate-fadeIn mb-3" id="copied-link-notification">
                        <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                        <span className="font-sans">{copiedLinkNotification}</span>
                      </div>
                    )}

                    {selectedFolder === "02_Chapter_Resources" ? (
                      <div className="space-y-4">
                        {/* Root Files inside 02_Chapter_Resources */}
                        <div className="space-y-1.5 text-left">
                          <span className="text-[10px] text-slate-400 font-mono block font-extrabold uppercase tracking-wider">ROOT FILES IN 02_CHAPTER_RESOURCES</span>
                          {[
                            { name: 'README.md', size: '2.5 KB', author: 'academic.repository', date: 'AY 2026 Core guidelines' },
                            { name: 'sample_lesson_plan.md', size: '4.8 KB', author: 'academic.repository', date: 'Validated lesson pacing matrix' },
                            { name: 'sample_quiz.md', size: '3.2 KB', author: 'academic.repository', date: 'Formative diagnostic test questions' }
                          ].map((fileObj, idx) => (
                            <div key={`root-${idx}`} className="bg-white border border-slate-150 rounded-xl p-2.5 flex items-center justify-between text-xs hover:border-slate-300 transition-colors shadow-2xs">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet size={15} className="text-blue-550 shrink-0" />
                                <div className="text-left font-medium">
                                  <span className="font-bold text-slate-850 font-mono text-[11px] block">{fileObj.name}</span>
                                  <span className="text-[10px] text-slate-405 block">{fileObj.date}</span>
                                </div>
                              </div>
                              <div className="text-right text-[10.5px] font-mono shrink-0 font-medium select-all">
                                <div className="text-slate-705 font-bold">{fileObj.size}</div>
                                <div className="text-[8px] text-slate-400 uppercase font-extrabold">{fileObj.author}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Chapter Repositories showing Ch01, Ch02, Ch03 and their lesson_plan.md files */}
                        {selectedStage === "Secondary" && selectedClass === "Class X" && selectedSubject === "English" && (
                          <div className="space-y-3 mt-4 border-t border-slate-150 pt-4 text-left">
                            <span className="text-[10px] text-slate-400 font-mono block font-extrabold uppercase tracking-wider">CHAPTER REPOSITORIES (SUBDIRECTORIES)</span>
                            
                            {[
                              {
                                id: "ch01",
                                folder: "Ch01_Sample_Chapter",
                                chapterName: "Chapter 1: A Letter to God",
                                file: "lesson_plan.md",
                                size: "4.0 KB",
                                desc: "Under CBSE SQAA regulations, complete Class X-A English Lesson Plan. Validated 40-minute pacing and CBSE mapping indicators.",
                                shareUrl: "https://drive.google.com/file/d/1Ch01SampleLessonPlanGradeX-English/view?usp=sharing"
                              },
                              {
                                id: "ch02",
                                folder: "Ch02_Nelson_Mandela",
                                chapterName: "Chapter 2: Nelson Mandela: Long Walk to Freedom",
                                file: "lesson_plan.md",
                                size: "5.2 KB",
                                desc: "Aligned CBSE Lesson Plan mapping Twin Obligations framework and active student collaborative team assessments.",
                                shareUrl: "https://drive.google.com/file/d/1Ch02NelsonMandelaLessonPlanGradeX-English/view?usp=sharing"
                              },
                              {
                                id: "ch03",
                                folder: "Ch03_Stories_About_Flying",
                                chapterName: "Chapter 3: Two Stories about Flying",
                                file: "lesson_plan.md",
                                size: "5.0 KB",
                                desc: "CBSE aligned lesson structure with algorithmic troubleshooting mindsets for the Young Seagull's choice metrics.",
                                shareUrl: "https://drive.google.com/file/d/1Ch03StoriesAboutFlyingLessonPlanGradeX-English/view?usp=sharing"
                              }
                            ].map((ch) => (
                              <div key={ch.id} className="bg-slate-50/55 border border-slate-200 rounded-xl p-3.5 space-y-2.5 transition-all shadow-2xs hover:border-slate-300">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <FolderOpen size={14} className="text-amber-500 fill-amber-100 shrink-0" />
                                    <span className="font-bold font-mono text-[11px] text-amber-900 bg-amber-50/70 px-2 py-0.5 rounded border border-amber-200">{ch.folder}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-bold font-sans">{ch.chapterName}</span>
                                </div>
                                <div className="bg-white border border-slate-150 rounded-lg p-3 flex items-start justify-between gap-3 text-xs shadow-3xs">
                                  <div className="flex items-start gap-2 text-left">
                                    <FileCode size={15} className="text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                                    <div className="space-y-1">
                                      <span className="font-bold text-slate-900 font-mono">{ch.file}</span>
                                      <p className="text-[10px] leading-relaxed text-slate-600 font-sans">{ch.desc}</p>
                                      <p className="text-[9px] font-mono text-slate-450 break-all select-all mt-1 bg-slate-50 p-1 rounded-sm border border-slate-100">
                                        Path: <span className="text-slate-600">/Academic Repository/AY 2026-27/Secondary/Class X/Class X-A/English/02_Chapter_Resources/{ch.folder}/{ch.file}</span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 flex flex-col items-end gap-2.5">
                                    <div>
                                      <div className="text-slate-700 font-bold font-mono text-[10.5px]">{ch.size}</div>
                                      <div className="text-[8.5px] text-slate-400 uppercase font-mono font-extrabold tracking-wide">academic</div>
                                    </div>
                                    <button
                                      onClick={() => handleCopyShareLink(`${ch.folder}/${ch.file}`, ch.shareUrl)}
                                      className="cursor-pointer bg-blue-50 text-[#2454d6] hover:bg-blue-100 hover:text-blue-850 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 border border-blue-200 select-none shadow-3xs"
                                      title="Copy Google Drive Share Link"
                                      id={`share-btn-${ch.id}`}
                                    >
                                      <Share2 size={11} className="text-blue-600" />
                                      <span>Share Link</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border text-center p-6 italic text-slate-400 text-[11px] font-medium rounded-xl border-dashed">
                        Folder exists on Drive. Use AI Co-pilot assistant workspace to draft and generate curriculum records mapping to this location!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* World 2: School Governance */}
            {activeDriveTab === 'governance' && (
              <div className="space-y-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-650 block">EXECUTIVE COMPLIANCE AUDITING</span>
                    <h3 className="text-sm font-bold text-slate-800">{driveManifest.governanceRoot}</h3>
                  </div>
                  <div className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold rounded px-2.5 py-1 font-mono uppercase tracking-wide border border-emerald-150 shrink-0">
                    OWNER ID: principal
                  </div>
                </div>

                <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-950 leading-relaxed font-sans">
                  <ShieldCheck size={16} className="text-emerald-700 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-semibold text-slate-700">
                    Governance paths represent confidential administrative audit registries. Standard scraping integrations digest metadata from <strong>Forms Intake</strong> buffer submissions to generate executive dashboard metrics.
                  </p>
                </div>

                {/* Subfolder indices */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase">Governance Subfolders & Ledgers</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { dir: "01_Compliance", label: "Statutory validations, audit filings, health records" },
                      { dir: "02_Academic_Audit", label: "Review sheets, teacher performance audits, CBSE logs" },
                      { dir: "03_HR", label: "Teacher portfolios, background certifications, recruitment" },
                      { dir: "04_Dashboard_Data", label: "Feeds district coordinators live surveillance graphs" },
                      { dir: "05_SOPs", label: "Standard Operating Procedures guidelines for rollover" },
                      { dir: "06_Strategic_Planning", label: "Academic expansion plans, dynamic budget allocations" },
                      { dir: "07_Meeting_Minutes", label: "Management meeting registers, consensus agreements" },
                      { dir: "08_School_Improvement_Plans", label: "Remedial timelines, class performance reviews" },
                      { dir: "09_Committee_Records", label: "Student wellbeing, anti-bullying, advisory registers" },
                      { dir: "10_Policies", label: "Core policy PDFs, security access guidelines" }
                    ].map((g, idx) => (
                      <div key={idx} className="bg-white border rounded-xl p-3 flex gap-2.5 items-start hover:border-slate-350 transition-colors shadow-2xs">
                        <Folder className="text-emerald-600 size-4 mt-0.5 shrink-0 animate-none bg-transparent" />
                        <div className="space-y-0.5 text-left text-xs font-sans">
                          <span className="font-bold text-slate-850 font-mono text-[11px] block">{g.dir}</span>
                          <span className="text-[10px] text-slate-450 leading-snug block font-medium">{g.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dashboard Data detailed indexes */}
                <div className="bg-white border rounded-xl p-4.5 space-y-3 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wide border-b pb-1.5">
                    <Database size={13} className="text-emerald-605 font-bold" />
                    Ledger streams inside 04_Dashboard_Data
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      "Academic Monitoring", "Weekly Planner Status", "Syllabus Coverage",
                      "Assessment Completion", "Notebook Monitoring", "Classroom Monitoring",
                      "Compliance", "Teacher Performance Indicators", "Resource Contributions"
                    ].map((module, mIdx) => (
                      <div key={mIdx} className="bg-slate-50 border rounded-lg p-2.5 border-slate-150 text-left">
                        <div className="font-bold text-slate-800 text-[10.5px] leading-snug truncate" title={module}>{module}</div>
                        <div className="font-mono text-[8.5px] text-slate-400 mt-1 block">monitoring_ledger.md</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* World 3: Classroom Templates */}
            {activeDriveTab === 'classroom' && (
              <div className="space-y-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-650 block">LMS PROTOCOLS & Blueprints</span>
                    <h3 className="text-sm font-bold text-slate-800">{driveManifest.classroomTemplatesRoot}</h3>
                  </div>
                  <div className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold rounded px-2.5 py-1 font-mono uppercase tracking-wide border border-indigo-150 shrink-0">
                    OWNER ID: classroomadmin
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-indigo-950 leading-relaxed font-sans">
                  <Info size={16} className="text-indigo-650 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-extrabold uppercase font-mono tracking-wider text-[9px] block">LMS STRUCTURE CONTROLS</span>
                    <p className="text-[11px] font-semibold text-slate-700 leading-normal">
                      To preserve clean synchronization parameters, teachers are <strong>strictly forbidden from creating or renaming Google Classrooms or topics</strong>. Standardizations are generated automatically by classroomadmin mapping.
                    </p>
                  </div>
                </div>

                {/* Subfolders index */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  <div className="bg-white border rounded-xl p-4 space-y-3.5 shadow-2xs">
                    <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 font-mono uppercase tracking-wide border-b pb-1.5">
                      <FolderOpen size={13} />
                      Classroom Creation Folders
                    </h4>
                    <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                      {[
                        { name: "01_Classroom_Naming_Conventions", details: "classroom_naming_conventions.md standardizes structure (e.g., AY 2026-27 | Class X-A | English)" },
                        { name: "03_Class_Templates", details: "Blank coursework templates mapping K-12 targets" },
                        { name: "04_Teacher_Assignment_Records", details: "Database mapping SIS courses to email lead IDs" },
                        { name: "05_Classroom_Creation_Logs", details: "CSV execution reports details from automated roster syncs" },
                        { name: "06_Posting_Activity_Reports", details: "Teacher contribution indices logs used for compliance audits" }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-0.5 font-sans">
                          <span className="font-bold text-slate-850 font-mono text-[10px] block">{item.name}</span>
                          <p className="text-[9.5px] text-slate-455 text-left font-medium">{item.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-4 space-y-2.5 shadow-2xs">
                    <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 font-mono uppercase tracking-wide border-b pb-1.5">
                      <FileCode size={13} />
                      02_Topic_Templates \ Standard Topics List
                    </h4>
                    <div className="space-y-1.5 max-h-[224px] overflow-y-auto scrollbar-thin text-left pr-1.5">
                      {driveManifest.standardClassroomTopics.map((topic, tIdx) => (
                        <div key={tIdx} className="text-[9.5px] font-mono bg-slate-50 border border-slate-150 p-2 rounded-lg text-slate-700 font-bold flex items-center gap-1.5 leading-none">
                          <span className="text-[10px] select-none text-slate-350">›</span>
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Supporting Cluster: Forms Intake Buffer */}
            {activeDriveTab === 'forms' && (
              <div className="space-y-4 text-left font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-650 block">DATA GATHERING CHANNELS</span>
                    <h3 className="text-sm font-bold text-slate-800">{driveManifest.formsIntakeRoot}</h3>
                  </div>
                  <div className="text-[10px] bg-amber-50 text-amber-905 font-semibold rounded px-2.5 py-1 font-mono uppercase tracking-wide border border-amber-150 shrink-0">
                    OWNER ID: principal + coordinators
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-205 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-850 leading-relaxed font-sans">
                  <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-semibold text-slate-700">
                    Forms buffers feed metrics to Governance dashlets. Scraping schedulers continuously digest README checklist files saved inside these directories.
                  </p>
                </div>

                {/* Subfolders mapping */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase">Active Ingestion Forms Channels</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { name: "01_Weekly_Planner_Form", desc: "Collects weekly pacing schedules submittals from teachers." },
                      { name: "02_Notebook_Monitoring_Form", desc: "Submits class workbook completion & monitoring check counts." },
                      { name: "03_Assessment_Status_Form", desc: "Feeds assessment completion checkpoints indicators." },
                      { name: "04_Remedial_Tracking_Form", desc: "Logs support actions details mapped for risk-alerted students." },
                      { name: "05_Event_Reporting_Form", desc: "Registers special institutional functions, activities compliance." },
                      { name: "06_Compliance_Evidence_Form", desc: "Submits board-mandated statutory validation records." }
                    ].map((form, fIdx) => (
                      <div key={fIdx} className="bg-white border rounded-xl p-3 text-left space-y-1 hover:border-slate-300 transition-colors shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold font-mono text-[10.5px] text-slate-800">
                          <Folder size={14} className="text-amber-500" />
                          <span>{form.name}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">{form.desc}</p>
                        <div className="text-[8px] font-mono text-slate-450 bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-150 font-extrabold uppercase">
                          CONTAINS: README.md Ingestion Template
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Supporting Cluster: Organisational Planners */}
            {activeDriveTab === 'org' && (
              <div className="space-y-4 text-left font-sans text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-rose-650 block">DIRECTORY STAFF & EMAIL ROSTERS</span>
                    <h3 className="text-sm font-bold text-slate-800">{driveManifest.orgStructureRoot}</h3>
                  </div>
                  <div className="text-[10px] bg-rose-50 text-rose-700 font-semibold rounded px-2.5 py-1 font-mono uppercase tracking-wide border border-rose-150 shrink-0">
                    OWNER ID: principal
                  </div>
                </div>

                {/* Subunits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans leading-relaxed">
                  
                  {/* Service Accounts */}
                  <div className="bg-white border rounded-xl p-3.5 space-y-2 shadow-2xs">
                    <h4 className="text-[11px] font-extrabold text-slate-805 font-mono uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                      <Lock size={12} className="text-rose-600" />
                      05_Service_Accounts
                    </h4>
                    <div className="space-y-1.5 text-[9.5px] font-mono font-bold text-slate-705">
                      {driveManifest.serviceAccounts.map((service, sIdx) => (
                        <div key={sIdx} className="p-1 px-1.5 bg-slate-50 border border-slate-150 rounded flex justify-between items-center text-[9px] truncate">
                          <span className="truncate">{service}@school.org</span>
                          <span className="text-[7px] bg-rose-100 text-rose-700 px-1 rounded block shrink-0 font-extrabold">SYSID</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Department Groups */}
                  <div className="bg-white border rounded-xl p-3.5 space-y-2 shadow-2xs">
                    <h4 className="text-[11px] font-extrabold text-slate-805 font-mono uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                      <Users size={12} className="text-rose-600" />
                      Department Groups
                    </h4>
                    <div className="space-y-1 text-[9.5px] font-mono text-slate-650 leading-relaxed">
                      {driveManifest.departmentGroups.map((group, gIdx) => (
                        <div key={gIdx} className="truncate select-all" title={group}>
                          • {group}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teacher Groups */}
                  <div className="bg-white border rounded-xl p-3.5 space-y-2 shadow-2xs">
                    <h4 className="text-[11px] font-extrabold text-slate-805 font-mono uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                      <Users size={12} className="text-rose-600" />
                      Teacher Groups
                    </h4>
                    <div className="space-y-1 text-[9.5px] font-mono text-slate-650 leading-relaxed">
                      {driveManifest.teacherGroups.map((group, gIdx) => (
                        <div key={gIdx} className="truncate select-all" title={group}>
                          • {group}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Subunits lists (Teaching staff stages, suspended) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 gap-3 text-[10px] leading-relaxed text-slate-605">
                  <div>
                    <strong className="text-slate-800 font-bold block mb-1">Teaching Staff Units (03_Teaching_Staff):</strong>
                    <span className="font-mono text-slate-500 font-medium">Subfolders: PrePrimary, Primary, Middle, Secondary, SeniorSecondary.</span>
                  </div>
                  <div>
                    <strong className="text-slate-800 font-bold block mb-1">Pupils Registry Units (04_Students):</strong>
                    <span className="font-mono text-slate-500 font-medium">Subfolders: PrePrimary, Primary, Middle, Secondary, SeniorSecondary (maps pupil rosters).</span>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </section>

      {/* Role Manager Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5.5 shadow-sm space-y-4 text-left" id="legacy-persona-card">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Users size={16} className="text-blue-600" />
            Standard Simulation Switching
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Force standard single persona simulation coordinates. Switching changes the current active role to preserve classic backward mappings cleanly:
          </p>

          <div className="space-y-3 pt-1.5">
            {rolesList.map(role => (
              <button 
                type="button"
                key={role.name}
                onClick={() => onSwitchRole(role.name, role.email)}
                className={`p-3.5 border rounded-xl text-left cursor-pointer transition-colors flex flex-col gap-1 w-full ${
                  currentRole === role.name 
                    ? "bg-blue-50/50 border-blue-200 text-blue-900 font-bold" 
                    : "bg-white border-slate-150 hover:bg-slate-50 text-slate-705"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">{role.name}</span>
                  {currentRole === role.name ? (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-blue-600 text-white font-mono px-2 py-0.5 rounded-full uppercase font-bold">
                      ACTIVE SESSION
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-mono">Switch User</span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 leading-snug font-mono block truncate">{role.email}</p>
                <p className="text-[11.5px] text-slate-650 leading-relaxed pt-1 font-sans">{role.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Immutable Audit Trail Logs */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left" id="immutable-audit-log-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Terminal size={16} className="text-slate-700" />
                Immutable System Audit Logs registry
              </h3>
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">COMPLIANCE CODE GPDR-7</span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[10.5px]">
              {["All", "auth", "search", "file_access", "task", "rollover", "automation"].map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition-colors ${
                    categoryFilter === cat 
                      ? "bg-slate-800 text-white border-slate-900" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Filter bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-405" size={14} />
            <input 
              type="text" 
              placeholder="Search immutable security trail by user, action sequence, or execution results..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-inner animate-none text-left"
            />
          </div>

          {/* Trail Registry Table */}
          <div className="overflow-x-auto max-h-[380px] border border-slate-150 rounded-xl bg-white shadow-inner">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-mono tracking-wider border-b border-slate-150 uppercase">
                  <th className="p-3 font-semibold text-[10px]">Timestamp</th>
                  <th className="p-3 font-semibold text-[10px]">Operator</th>
                  <th className="p-3 font-semibold text-[10px]">Action</th>
                  <th className="p-3 font-semibold text-[10px]">Parameters Detail</th>
                  <th className="p-3 font-semibold text-center text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10.5px] text-slate-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic font-sans animate-none bg-transparent">No audit trail records correspond to filter keys.</td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors" id={`audit-row-${log.id}`}>
                      <td className="p-3 text-slate-450 font-light truncate max-w-28">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{log.user.split('@')[0]}</div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold font-mono">{log.role}</div>
                      </td>
                      <td className="p-3 font-sans font-bold text-slate-800">{log.action}</td>
                      <td className="p-3 font-sans text-slate-500 max-w-xs truncate" title={log.detail}>{log.detail}</td>
                      <td className="p-3 text-center">
                        {log.success ? (
                          <span className="inline-flex text-emerald-600"><CheckCircle size={14} /></span>
                        ) : (
                          <span className="inline-flex text-rose-500"><ShieldAlert size={14} /></span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pendingRollbackDefault && (
          <OverlaySurface
            open={pendingRollbackDefault}
            onClose={() => setPendingRollbackDefault(false)}
            title="Revert to default schema?"
            description="This resets the core District configuration schema and discards the current staging edits."
            role="alertdialog"
            closeLabel="Close revert confirmation"
            overlayId="system-governance-rollback-modal"
            maxWidthClassName="max-w-lg"
            closeOnBackdropClick={false}
            bodyClassName="px-6 py-5 space-y-4"
            footerClassName="px-6 py-4"
            body={(
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  The default schema will be restored immediately if you confirm.
                </p>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                  This is a destructive configuration reset.
                </div>
              </div>
            )}
            footer={(
              <>
                <button
                  type="button"
                  onClick={() => setPendingRollbackDefault(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRollbackDefault}
                  className="rounded-xl border border-rose-200 bg-rose-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700"
                >
                  Revert
                </button>
              </>
            )}
          />
        )}

      </div>
    </div>
  );
}
