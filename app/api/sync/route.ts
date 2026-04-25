import { NextResponse } from "next/server";

type SyncPayload = {
  workspaceId?: string;
  threads?: unknown;
  memory?: unknown;
  knowledge?: unknown;
  profile?: unknown;
};

function storageConfig() {
  return {
    enabled: (process.env.ENABLE_SERVER_STORAGE || "false").toLowerCase() === "true",
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    table: process.env.SUPABASE_TABLE || "nimbray_workspaces"
  };
}

function missingStorageResponse() {
  return NextResponse.json({
    ok: false,
    enabled: false,
    message: "Stockage serveur non configuré. L'application utilise la sauvegarde locale du navigateur.",
    requiredEnv: ["ENABLE_SERVER_STORAGE=true", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
  }, { status: 200 });
}

function headers(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
}

export async function GET(req: Request) {
  const cfg = storageConfig();
  if (!cfg.enabled || !cfg.url || !cfg.key) return missingStorageResponse();

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") || "";
  if (!workspaceId) return NextResponse.json({ ok: false, error: "workspaceId manquant" }, { status: 400 });

  const endpoint = `${cfg.url}/rest/v1/${cfg.table}?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=data,updated_at&limit=1`;
  const res = await fetch(endpoint, { headers: headers(cfg.key), cache: "no-store" });
  if (!res.ok) return NextResponse.json({ ok: false, error: await res.text() }, { status: res.status });
  const rows = await res.json();
  return NextResponse.json({ ok: true, enabled: true, data: rows?.[0]?.data || null, updatedAt: rows?.[0]?.updated_at || null });
}

export async function POST(req: Request) {
  const cfg = storageConfig();
  if (!cfg.enabled || !cfg.url || !cfg.key) return missingStorageResponse();

  const body = (await req.json()) as SyncPayload;
  const workspaceId = body.workspaceId || "";
  if (!workspaceId) return NextResponse.json({ ok: false, error: "workspaceId manquant" }, { status: 400 });

  const record = {
    workspace_id: workspaceId,
    data: {
      threads: body.threads || [],
      memory: body.memory || [],
      knowledge: body.knowledge || [],
      profile: body.profile || {},
      savedAt: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  };

  const endpoint = `${cfg.url}/rest/v1/${cfg.table}?on_conflict=workspace_id`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...headers(cfg.key),
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(record)
  });

  if (!res.ok) return NextResponse.json({ ok: false, error: await res.text() }, { status: res.status });
  const rows = await res.json();
  return NextResponse.json({ ok: true, enabled: true, updatedAt: rows?.[0]?.updated_at || record.updated_at });
}
