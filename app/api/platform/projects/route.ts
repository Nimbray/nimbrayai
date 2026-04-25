import { NextResponse } from "next/server";
import { isSupabaseReady, supabaseInsert, supabaseSelect } from "../../../../lib/supabase-rest";

export async function GET() {
  if (!isSupabaseReady()) {
    return NextResponse.json({ ok: true, mode: "local", projects: [] });
  }
  const result = await supabaseSelect("projects", "select=*&order=updated_at.desc&limit=50");
  return NextResponse.json({ ok: result.ok, mode: "cloud", result });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const project = {
      owner_ref: body?.owner_ref || "guest",
      name: String(body?.name || "Nouveau projet").slice(0, 120),
      description: String(body?.description || "").slice(0, 2000),
      status: body?.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (!isSupabaseReady()) return NextResponse.json({ ok: true, mode: "local", saved: false, project });
    const result = await supabaseInsert("projects", project);
    return NextResponse.json({ ok: result.ok, mode: "cloud", result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Erreur projet" }, { status: 500 });
  }
}
