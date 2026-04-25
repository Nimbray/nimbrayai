import { NextResponse } from "next/server";
import { isSupabaseReady, supabaseInsert } from "../../../../lib/supabase-rest";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const feedback = {
      owner_ref: body?.owner_ref || "guest",
      type: body?.type || "general",
      message: String(body?.message || "").slice(0, 5000),
      page: body?.page || "app",
      severity: body?.severity || "normal",
      created_at: new Date().toISOString(),
    };
    if (!feedback.message.trim()) return NextResponse.json({ ok: false, error: "Feedback vide." }, { status: 400 });
    if (!isSupabaseReady()) return NextResponse.json({ ok: true, mode: "local", saved: false, feedback });
    const result = await supabaseInsert("beta_feedback", feedback);
    return NextResponse.json({ ok: result.ok, mode: "cloud", result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Erreur feedback" }, { status: 500 });
  }
}
