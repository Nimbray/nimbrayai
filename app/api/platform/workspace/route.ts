import { NextResponse } from "next/server";
import { sanitizeWorkspace } from "../../../../lib/platform";
import { isSupabaseReady, supabaseInsert } from "../../../../lib/supabase-rest";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const snapshot = sanitizeWorkspace(body || {});
    if (!isSupabaseReady()) {
      return NextResponse.json({ ok: true, mode: "local", saved: false, snapshot, message: "Mode local actif : export prêt, Supabase non activé." });
    }
    const result = await supabaseInsert("workspaces", {
      owner_ref: body?.owner_ref || "guest",
      title: body?.title || "Workspace NimbrayAI",
      snapshot,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: result.ok, mode: "cloud", result, snapshot });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Erreur workspace" }, { status: 500 });
  }
}
