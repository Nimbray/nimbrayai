export type PlatformMode = "local" | "cloud";

export type WorkspaceSnapshot = {
  profile?: Record<string, unknown>;
  conversations?: unknown[];
  memory?: string[];
  sources?: unknown[];
  projects?: unknown[];
  feedback?: unknown[];
  exportedAt: string;
  version: "45.0.0";
};

export function getPlatformMode(): PlatformMode {
  return process.env.ENABLE_SERVER_STORAGE === "true" && !!process.env.SUPABASE_URL ? "cloud" : "local";
}

export function getPublicPlatformStatus() {
  const cloudReady = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;
  const serverStorage = process.env.ENABLE_SERVER_STORAGE === "true";
  const auth = process.env.ENABLE_AUTH === "true";
  return {
    version: "45.0.0",
    name: "NimbrayAI Product Platform Edition",
    mode: getPlatformMode(),
    authEnabled: auth,
    serverStorageEnabled: serverStorage,
    supabaseConfigured: cloudReady,
    localModeAvailable: true,
    guestModeAvailable: true,
  };
}

export function sanitizeWorkspace(input: Partial<WorkspaceSnapshot>): WorkspaceSnapshot {
  return {
    profile: input.profile || {},
    conversations: Array.isArray(input.conversations) ? input.conversations.slice(0, 200) : [],
    memory: Array.isArray(input.memory) ? input.memory.slice(0, 200) : [],
    sources: Array.isArray(input.sources) ? input.sources.slice(0, 200) : [],
    projects: Array.isArray(input.projects) ? input.projects.slice(0, 50) : [],
    feedback: Array.isArray(input.feedback) ? input.feedback.slice(0, 500) : [],
    exportedAt: new Date().toISOString(),
    version: "45.0.0",
  };
}
