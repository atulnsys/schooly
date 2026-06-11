import React, { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Link2,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";
import {
  ClassroomConnectionStatus,
  ClassroomCourseTarget,
  ClassroomPublishResult,
  ClassroomTopic,
  extractGoogleDriveFileId,
  GoogleClassroomService,
} from "../lib/googleClassroom";

type ArtifactType =
  | "OUTLINE"
  | "SLIDES"
  | "QUIZ"
  | "ACTIVITY_SHEET"
  | "QUESTION_BANK"
  | "ASSESSMENT_BANK"
  | "HOMEWORK"
  | "PARENT_DISCUSSION"
  | "WORKSHEET"
  | "RAW_MARKDOWN"
  | "SQAA_LINKS"
  | "RUBRICS";

type ClassroomTargetType = "material" | "assignment" | "announcement" | "teacher_reference_material";
type PublishStatus = "ready" | "publishing" | "published" | "failed";

interface ArtifactPublishRecord {
  artifactKey: string;
  artifactType: ArtifactType;
  artifactTitle: string;
  driveFileId?: string;
  driveFileUrl: string;
  classroomCourseId: string;
  classroomCourseName: string;
  classroomTopicId?: string;
  classroomPostType: ClassroomTargetType;
  classroomPostId: string;
  classroomPostUrl?: string;
  publishedBy: string;
  publishedAt: string;
  publishStatus: "published";
  chapterId?: string;
  bookId?: string;
  cbseTags: string[];
  ncertTags: string[];
  nepTags: string[];
  sqaaTags: string[];
}

interface ClassroomPublisherProps {
  driveFile?: { id: string; name: string; webViewLink?: string };
  chapterName: string;
  className: string;
  subjectName: string;
  bookName: string;
  currentUser: string;
  sqaaTags: string[];
}

const STORAGE_KEY = "schooly_classroom_publish_records_v1";
const TEACHER_ONLY = new Set<ArtifactType>([
  "QUESTION_BANK",
  "ASSESSMENT_BANK",
  "RAW_MARKDOWN",
  "SQAA_LINKS",
]);

const CLASSROOM_ARTIFACT_MAPPING: Record<ArtifactType, ClassroomTargetType> = {
  OUTLINE: "material",
  SLIDES: "material",
  QUIZ: "assignment",
  ACTIVITY_SHEET: "assignment",
  QUESTION_BANK: "teacher_reference_material",
  ASSESSMENT_BANK: "teacher_reference_material",
  HOMEWORK: "assignment",
  PARENT_DISCUSSION: "announcement",
  WORKSHEET: "assignment",
  RAW_MARKDOWN: "teacher_reference_material",
  SQAA_LINKS: "teacher_reference_material",
  RUBRICS: "assignment",
};

const ARTIFACTS: Array<{ type: ArtifactType; label: string; description: string }> = [
  { type: "OUTLINE", label: "Outline", description: "Chapter lesson outline as course material." },
  { type: "SLIDES", label: "Slides", description: "Presentation view as course material." },
  { type: "QUIZ", label: "Quiz", description: "Concept check as an assignment." },
  { type: "ACTIVITY_SHEET", label: "Activity Sheet", description: "Class activity as an assignment." },
  { type: "QUESTION_BANK", label: "Question Bank", description: "Teacher reference; never selected by default." },
  { type: "ASSESSMENT_BANK", label: "Assessment Bank", description: "Teacher reference; never selected by default." },
  { type: "HOMEWORK", label: "Homework", description: "Homework task set as an assignment." },
  { type: "PARENT_DISCUSSION", label: "Parent Discussion", description: "Home discussion prompt as an announcement." },
  { type: "WORKSHEET", label: "Worksheets", description: "Student worksheet as an assignment." },
  { type: "RAW_MARKDOWN", label: "Raw Markdown", description: "Teacher reference; never selected by default." },
  { type: "SQAA_LINKS", label: "SQAA Evidence Links", description: "Teacher reference; never selected by default." },
  { type: "RUBRICS", label: "Rubrics", description: "Drive rubric attached to an assignment." },
];

function loadRecords(): ArtifactPublishRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function artifactKey(driveId: string, chapterName: string, type: ArtifactType) {
  return `${driveId}:${chapterName}:${type}`;
}

function errorState(error: unknown): ClassroomConnectionStatus | null {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith("TOKEN_EXPIRED")) {
    return { state: "expired", message: "Google Classroom session expired. Reconnect to continue." };
  }
  if (message.startsWith("MISSING_PERMISSIONS")) {
    return { state: "missing_permissions", message: message.replace("MISSING_PERMISSIONS:", "").trim() };
  }
  return null;
}

export default function ClassroomPublisher({
  driveFile,
  chapterName,
  className,
  subjectName,
  bookName,
  currentUser,
  sqaaTags,
}: ClassroomPublisherProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const enabled = import.meta.env.VITE_GOOGLE_CLASSROOM_ENABLED !== "false";
  const serviceRef = useRef(new GoogleClassroomService(clientId));
  const [connection, setConnection] = useState<ClassroomConnectionStatus>({
    state: "not_connected",
    message: "Google Classroom not connected.",
  });
  const [courses, setCourses] = useState<ClassroomCourseTarget[]>([]);
  const [courseId, setCourseId] = useState("");
  const [topics, setTopics] = useState<ClassroomTopic[]>([]);
  const [topicId, setTopicId] = useState("");
  const [topicName, setTopicName] = useState(chapterName);
  const [selected, setSelected] = useState<Set<ArtifactType>>(
    new Set(["OUTLINE", "SLIDES", "QUIZ", "HOMEWORK", "PARENT_DISCUSSION", "WORKSHEET"]),
  );
  const [records, setRecords] = useState<ArtifactPublishRecord[]>(loadRecords);
  const [statuses, setStatuses] = useState<Record<ArtifactType, PublishStatus | undefined>>({} as Record<ArtifactType, PublishStatus>);
  const [errors, setErrors] = useState<Record<ArtifactType, string | undefined>>({} as Record<ArtifactType, string>);
  const [busy, setBusy] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [republish, setRepublish] = useState<Set<ArtifactType>>(new Set());

  const driveUrl = driveFile?.webViewLink || "";
  const driveId = extractGoogleDriveFileId(driveUrl) || driveFile?.id || "";
  const selectedCourse = courses.find((course) => course.id === courseId);
  const currentRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.driveFileId === driveId &&
          record.chapterId === chapterName &&
          (!courseId || record.classroomCourseId === courseId),
      ),
    [records, driveId, chapterName, courseId],
  );

  const saveRecord = (record: ArtifactPublishRecord) => {
    setRecords((current) => {
      const next = [...current.filter((item) => item.artifactKey !== record.artifactKey), record];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const connect = async () => {
    setConnection({ state: "connecting", message: "Connecting to Google Classroom..." });
    setGeneralError("");
    const status = await serviceRef.current.connect();
    setConnection(status);
    if (status.state !== "connected") return;
    await loadCourses();
  };

  const loadCourses = async () => {
    setBusy(true);
    setGeneralError("");
    try {
      const result = await serviceRef.current.listCourses();
      setCourses(result);
      if (!result.length) setGeneralError("No active courses writable by this Google account were found.");
    } catch (error) {
      const state = errorState(error);
      if (state) setConnection(state);
      setGeneralError(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : String(error));
    } finally {
      setBusy(false);
    }
  };

  const selectCourse = async (nextCourseId: string) => {
    setCourseId(nextCourseId);
    setTopicId("");
    setGeneralError("");
    if (!nextCourseId) return;
    setBusy(true);
    try {
      setTopics(await serviceRef.current.listTopics(nextCourseId));
    } catch (error) {
      const state = errorState(error);
      if (state) setConnection(state);
      setGeneralError(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : String(error));
    } finally {
      setBusy(false);
    }
  };

  const ensureSelectedTopic = async () => {
    if (topicId) return topicId;
    if (!topicName.trim()) return undefined;
    const topic = await serviceRef.current.ensureTopic(courseId, topicName.trim());
    setTopics((current) => [...current.filter((item) => item.topicId !== topic.topicId), topic]);
    setTopicId(topic.topicId);
    return topic.topicId;
  };

  const publishOne = async (type: ArtifactType, resolvedTopicId?: string) => {
    if (!driveId || !driveUrl || !selectedCourse) throw new Error("Drive artifact or Classroom course is missing.");
    const definition = ARTIFACTS.find((item) => item.type === type)!;
    const title = `${chapterName} - ${definition.label}`;
    const description = `${className} ${subjectName}. Source: ${bookName}. Published from the existing Schooly Google Drive artifact.`;
    const target = CLASSROOM_ARTIFACT_MAPPING[type];

    let result: ClassroomPublishResult;
    if (target === "assignment" || target === "teacher_reference_material") {
      result = await serviceRef.current.publishAssignment({
        courseId,
        topicId: resolvedTopicId,
        title,
        description:
          target === "teacher_reference_material"
            ? `Teacher reference selected explicitly for student publication. ${description}`
            : description,
        driveFileId: driveId,
      });
    } else if (target === "announcement") {
      result = await serviceRef.current.publishAnnouncement({
        courseId,
        text: `${title}\n\n${description}`,
        title,
        driveFileId: driveId,
      });
    } else {
      result = await serviceRef.current.publishMaterial({
        courseId,
        topicId: resolvedTopicId,
        title,
        description,
        driveFileId: driveId,
      });
    }

    const record: ArtifactPublishRecord = {
      artifactKey: artifactKey(driveId, chapterName, type),
      artifactType: type,
      artifactTitle: title,
      driveFileId: driveId,
      driveFileUrl: driveUrl,
      classroomCourseId: courseId,
      classroomCourseName: selectedCourse.name,
      classroomTopicId: resolvedTopicId,
      classroomPostType: target,
      classroomPostId: result.id,
      classroomPostUrl: result.alternateLink,
      publishedBy: currentUser,
      publishedAt: new Date().toISOString(),
      publishStatus: "published",
      chapterId: chapterName,
      bookId: bookName,
      cbseTags: ["CBSE"],
      ncertTags: ["NCERT"],
      nepTags: ["NEP"],
      sqaaTags,
    };
    saveRecord(record);
    return record;
  };

  const publishSelected = async () => {
    if (!courseId || !driveId || !driveUrl) return;
    setBusy(true);
    setGeneralError("");
    let resolvedTopicId: string | undefined;
    try {
      resolvedTopicId = await ensureSelectedTopic();
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : String(error));
      setBusy(false);
      return;
    }

    for (const type of selected) {
      const existing = currentRecords.find((record) => record.artifactType === type);
      if (existing && !republish.has(type)) continue;
      setStatuses((current) => ({ ...current, [type]: "publishing" }));
      setErrors((current) => ({ ...current, [type]: undefined }));
      try {
        await publishOne(type, resolvedTopicId);
        setStatuses((current) => ({ ...current, [type]: "published" }));
      } catch (error) {
        const state = errorState(error);
        if (state) setConnection(state);
        setStatuses((current) => ({ ...current, [type]: "failed" }));
        setErrors((current) => ({
          ...current,
          [type]: error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : String(error),
        }));
      }
    }
    setBusy(false);
  };

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        Google Classroom publishing is disabled by configuration.
      </div>
    );
  }

  return (
    <div className="space-y-5" id="google-classroom-publisher">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <GraduationCap size={17} className="text-blue-600" />
              Google Classroom Connection
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">{connection.message}</p>
          </div>
          <div className="flex gap-2">
            {connection.state === "connected" && (
              <button onClick={loadCourses} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                <RefreshCw size={12} className="mr-1 inline" /> Refresh
              </button>
            )}
            <button
              onClick={connect}
              disabled={connection.state === "connecting" || !clientId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              id="connect-google-classroom"
            >
              {connection.state === "connecting" ? "Connecting..." : connection.state === "connected" ? "Reconnect" : "Connect Google Classroom"}
            </button>
          </div>
        </div>
        {!clientId && (
          <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
            <AlertCircle size={15} className="shrink-0" />
            <span>OAuth setup is missing. Add <strong>VITE_GOOGLE_CLIENT_ID</strong> for a browser OAuth client.</span>
          </div>
        )}
        {(connection.state === "expired" || connection.state === "missing_permissions") && (
          <div className="mt-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-900">
            <ShieldAlert size={15} className="shrink-0" />
            <span>{connection.message}</span>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Course Selection</h3>
          <select
            value={courseId}
            onChange={(event) => selectCourse(event.target.value)}
            disabled={connection.state !== "connected" || busy}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800"
          >
            <option value="">Select a writable course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name}{course.section ? ` - ${course.section}` : ""}</option>
            ))}
          </select>
          <p className="mt-2 text-[10px] text-slate-400">Only active courses where the connected account is a teacher are listed.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Chapter Topic</h3>
          <select
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
            disabled={!courseId || busy}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800"
          >
            <option value="">Create or reuse chapter topic</option>
            {topics.map((topic) => <option key={topic.topicId} value={topic.topicId}>{topic.name}</option>)}
          </select>
          {!topicId && (
            <input
              value={topicName}
              onChange={(event) => setTopicName(event.target.value)}
              disabled={!courseId}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800"
              placeholder="New topic name"
            />
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Artifact Publishing Map</h3>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] text-blue-900">
          <Link2 size={14} className="mt-0.5 shrink-0" />
          <span>
            {driveUrl ? <>Using existing Drive artifact: <a className="font-bold underline" href={driveUrl} target="_blank" rel="noreferrer">{driveFile?.name}</a></> : "Drive artifact missing. Save the plan to Google Drive before publishing."}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {ARTIFACTS.map((artifact) => {
            const existing = currentRecords.find((record) => record.artifactType === artifact.type);
            const isTeacherOnly = TEACHER_ONLY.has(artifact.type);
            return (
              <label key={artifact.type} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(artifact.type)}
                  onChange={(event) => {
                    const next = new Set(selected);
                    event.target.checked ? next.add(artifact.type) : next.delete(artifact.type);
                    setSelected(next);
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800">
                    {artifact.label}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] uppercase text-slate-500">
                      {CLASSROOM_ARTIFACT_MAPPING[artifact.type].replaceAll("_", " ")}
                    </span>
                    {isTeacherOnly && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-700">Explicit opt-in</span>}
                  </span>
                  <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{artifact.description}</span>
                  {existing && (
                    <span className="mt-2 block text-[10px] text-emerald-700">
                      Published {new Date(existing.publishedAt).toLocaleString()}.
                      {existing.classroomPostUrl && <a href={existing.classroomPostUrl} target="_blank" rel="noreferrer" className="ml-1 font-bold underline">Open in Classroom</a>}
                    </span>
                  )}
                  {existing && (
                    <label className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
                      <input
                        type="checkbox"
                        checked={republish.has(artifact.type)}
                        onChange={(event) => {
                          const next = new Set(republish);
                          event.target.checked ? next.add(artifact.type) : next.delete(artifact.type);
                          setRepublish(next);
                        }}
                      />
                      Republish as new copy
                    </label>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Publish Preview</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              {selected.size} artifact views selected for {selectedCourse?.name || "no course selected"}. Existing posts are skipped unless republish is selected.
            </p>
          </div>
          <button
            onClick={publishSelected}
            disabled={busy || connection.state !== "connected" || !courseId || !driveUrl || selected.size === 0}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-40"
            id="publish-to-google-classroom"
          >
            {busy ? <Loader2 size={13} className="mr-1 inline animate-spin" /> : <Send size={13} className="mr-1 inline" />}
            {busy ? "Publishing..." : "Publish Selected"}
          </button>
        </div>
        {generalError && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800">{generalError}</div>}
        <div className="mt-4 space-y-2">
          {Array.from(selected).map((type) => {
            const definition = ARTIFACTS.find((item) => item.type === type)!;
            const existing = currentRecords.find((record) => record.artifactType === type);
            const status = statuses[type] || (existing ? "published" : "ready");
            return (
              <div key={type} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                <span className="font-semibold text-slate-700">{definition.label}</span>
                <span className={status === "failed" ? "text-rose-700" : status === "published" ? "text-emerald-700" : "text-slate-500"}>
                  {status === "publishing" && <Loader2 size={12} className="mr-1 inline animate-spin" />}
                  {status === "published" && <CheckCircle2 size={12} className="mr-1 inline" />}
                  {status === "failed" && <AlertCircle size={12} className="mr-1 inline" />}
                  {errors[type] || status}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-bold text-slate-900">SQAA Evidence Links</h3>
        <p className="mt-1 text-[11px] text-slate-500">
          Published records retain the Drive URL, course/topic/post IDs, publisher, timestamp, CBSE/NCERT/NEP tags, and these SQAA tags:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sqaaTags.map((tag) => <span key={tag} className="rounded-full border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700">{tag}</span>)}
        </div>
        <p className="mt-3 text-[10px] text-slate-500">
          Already published items are not updated automatically. To replace one, publish as a new copy or update it manually in Classroom.
        </p>
      </section>
    </div>
  );
}
