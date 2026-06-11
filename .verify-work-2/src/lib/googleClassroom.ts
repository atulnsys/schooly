export const GOOGLE_CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.topics",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials",
  "https://www.googleapis.com/auth/classroom.announcements",
] as const;

const CLASSROOM_API_BASE = "https://classroom.googleapis.com/v1";

export type ClassroomConnectionState =
  | "not_connected"
  | "connecting"
  | "connected"
  | "missing_permissions"
  | "expired"
  | "error";

export interface ClassroomConnectionStatus {
  state: ClassroomConnectionState;
  message: string;
  expiresAt?: number;
}

export interface ClassroomCourseTarget {
  id: string;
  name: string;
  section?: string;
  alternateLink?: string;
  courseState?: string;
}

export interface ClassroomTopic {
  topicId: string;
  name: string;
  updateTime?: string;
}

export interface ClassroomPublishResult {
  id: string;
  alternateLink?: string;
  postType: "material" | "assignment" | "announcement";
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
  scope?: string;
}

interface GoogleTokenClient {
  callback: (response: GoogleTokenResponse) => void;
  requestAccessToken(options?: { prompt?: string }): void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }): GoogleTokenClient;
          revoke(token: string, callback?: () => void): void;
        };
      };
    };
  }
}

let gisPromise: Promise<void> | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity Services failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity Services failed to load."));
    document.head.appendChild(script);
  });

  return gisPromise;
}

function parseApiError(status: number, body: unknown): Error {
  const apiMessage =
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error
      ? String(body.error.message)
      : `Google Classroom request failed (${status}).`;

  if (status === 401) return new Error(`TOKEN_EXPIRED: ${apiMessage}`);
  if (status === 403) return new Error(`MISSING_PERMISSIONS: ${apiMessage}`);
  return new Error(apiMessage);
}

export function extractGoogleDriveFileId(urlOrId: string): string | null {
  const value = urlOrId.trim();
  if (!value) return null;
  if (!value.includes("/") && !value.includes("?")) return value;

  const pathMatch = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (pathMatch?.[1]) return pathMatch[1];

  try {
    const url = new URL(value);
    return url.searchParams.get("id") || url.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] || null;
  } catch {
    return null;
  }
}

export class GoogleClassroomService {
  private accessToken: string | null = null;
  private expiresAt = 0;
  private tokenClient: GoogleTokenClient | null = null;

  constructor(private readonly clientId: string) {}

  async connect(): Promise<ClassroomConnectionStatus> {
    if (!this.clientId) {
      return {
        state: "error",
        message: "Google Classroom OAuth is not configured. Set VITE_GOOGLE_CLIENT_ID.",
      };
    }

    await loadGoogleIdentityServices();
    const oauth = window.google?.accounts?.oauth2;
    if (!oauth) throw new Error("Google Identity Services is unavailable.");

    return new Promise((resolve) => {
      this.tokenClient = oauth.initTokenClient({
        client_id: this.clientId,
        scope: GOOGLE_CLASSROOM_SCOPES.join(" "),
        callback: (response) => {
          if (response.error || !response.access_token) {
            resolve({
              state: response.error === "access_denied" ? "missing_permissions" : "error",
              message: response.error_description || response.error || "Google Classroom connection failed.",
            });
            return;
          }

          this.accessToken = response.access_token;
          this.expiresAt = Date.now() + Math.max(0, (response.expires_in || 3600) - 60) * 1000;
          resolve({
            state: "connected",
            message: "Google Classroom connected for this browser session.",
            expiresAt: this.expiresAt,
          });
        },
        error_callback: () => {
          resolve({
            state: "error",
            message: "Google sign-in could not open. Allow popups and try again.",
          });
        },
      });
      this.tokenClient.requestAccessToken({ prompt: "consent" });
    });
  }

  async disconnect(): Promise<void> {
    const token = this.accessToken;
    this.accessToken = null;
    this.expiresAt = 0;
    if (token && window.google?.accounts?.oauth2) {
      await new Promise<void>((resolve) => window.google!.accounts!.oauth2!.revoke(token, resolve));
    }
  }

  async getConnectionStatus(): Promise<ClassroomConnectionStatus> {
    if (!this.accessToken) {
      return { state: "not_connected", message: "Google Classroom not connected." };
    }
    if (Date.now() >= this.expiresAt) {
      this.accessToken = null;
      return { state: "expired", message: "Google Classroom session expired. Reconnect to continue." };
    }
    return {
      state: "connected",
      message: "Google Classroom connected for this browser session.",
      expiresAt: this.expiresAt,
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const status = await this.getConnectionStatus();
    if (status.state !== "connected" || !this.accessToken) {
      throw new Error("TOKEN_EXPIRED: Reconnect Google Classroom to continue.");
    }

    const response = await fetch(`${CLASSROOM_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw parseApiError(response.status, body);
    return body as T;
  }

  async listCourses(): Promise<ClassroomCourseTarget[]> {
    const result = await this.request<{ courses?: ClassroomCourseTarget[] }>(
      "/courses?courseStates=ACTIVE&teacherId=me&pageSize=100",
    );
    return result.courses || [];
  }

  async listTopics(courseId: string): Promise<ClassroomTopic[]> {
    const result = await this.request<{ topic?: ClassroomTopic[] }>(
      `/courses/${encodeURIComponent(courseId)}/topics?pageSize=100`,
    );
    return result.topic || [];
  }

  async ensureTopic(courseId: string, topicName: string): Promise<ClassroomTopic> {
    const existing = (await this.listTopics(courseId)).find(
      (topic) => topic.name.trim().toLowerCase() === topicName.trim().toLowerCase(),
    );
    if (existing) return existing;
    return this.request<ClassroomTopic>(`/courses/${encodeURIComponent(courseId)}/topics`, {
      method: "POST",
      body: JSON.stringify({ name: topicName.trim() }),
    });
  }

  private driveMaterial(driveFileId: string, title: string) {
    return {
      driveFile: {
        driveFile: { id: driveFileId, title },
        shareMode: "VIEW",
      },
    };
  }

  async publishMaterial(input: {
    courseId: string;
    topicId?: string;
    title: string;
    description: string;
    driveFileId: string;
  }): Promise<ClassroomPublishResult> {
    const result = await this.request<{ id: string; alternateLink?: string }>(
      `/courses/${encodeURIComponent(input.courseId)}/courseWorkMaterials`,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          topicId: input.topicId,
          state: "PUBLISHED",
          materials: [this.driveMaterial(input.driveFileId, input.title)],
        }),
      },
    );
    return { ...result, postType: "material" };
  }

  async publishAssignment(input: {
    courseId: string;
    topicId?: string;
    title: string;
    description: string;
    driveFileId: string;
  }): Promise<ClassroomPublishResult> {
    const result = await this.request<{ id: string; alternateLink?: string }>(
      `/courses/${encodeURIComponent(input.courseId)}/courseWork`,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          topicId: input.topicId,
          state: "PUBLISHED",
          workType: "ASSIGNMENT",
          materials: [this.driveMaterial(input.driveFileId, input.title)],
        }),
      },
    );
    return { ...result, postType: "assignment" };
  }

  async publishAnnouncement(input: {
    courseId: string;
    text: string;
    driveFileId: string;
    title: string;
  }): Promise<ClassroomPublishResult> {
    const result = await this.request<{ id: string; alternateLink?: string }>(
      `/courses/${encodeURIComponent(input.courseId)}/announcements`,
      {
        method: "POST",
        body: JSON.stringify({
          text: input.text,
          state: "PUBLISHED",
          materials: [this.driveMaterial(input.driveFileId, input.title)],
        }),
      },
    );
    return { ...result, postType: "announcement" };
  }
}
