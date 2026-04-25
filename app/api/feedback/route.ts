import { NextResponse } from "next/server";

function storageConfig() {
  return {
    enabled: (process.env.ENABLE_SERVER_STORAGE || "false").toLowerCase() === "true" && (process.env.ENABLE_BETA_FEEDBACK || "true").toLowerCase() !== "false",
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    table: process.env.SUPABASE_FEEDBACK_TABLE || "nimbray_feedback"
  };
}

function headers(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body?.text || "").trim();
    if (!text) return NextResponse.json({ ok: false, error: "Feedback vide." }, { status: 400 });

    const cfg = storageConfig();
    if (!cfg.enabled || !cfg.url || !cfg.key) {
      return NextResponse.json({ ok: true, enabled: false, message: "Feedback enregistré localement. Supabase n’est pas configuré." });
    }

    const record = {
      workspace_id: body?.workspaceId || null,
      profile: body?.profile || {},
      feedback: text,
      context: body?.context || {},
      created_at: new Date().toISOString()
    };

    const res = await fetch(`${cfg.url}/rest/v1/${cfg.table}`, {
      method: "POST",
      headers: { ...headers(cfg.key), Prefer: "return=representation" },
      body: JSON.stringify(record)
    });

    if (!res.ok) return NextResponse.json({ ok: false, error: await res.text() }, { status: res.status });
    return NextResponse.json({ ok: true, enabled: true, message: "Feedback envoyé côté serveur." });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Erreur feedback." }, { status: 500 });
  }
}
