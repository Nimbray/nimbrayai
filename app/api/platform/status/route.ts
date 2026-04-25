import { NextResponse } from "next/server";
import { getPublicPlatformStatus } from "../../../../lib/platform";
import { isSupabaseReady } from "../../../../lib/supabase-rest";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ...getPublicPlatformStatus(),
    supabaseRestReady: isSupabaseReady(),
    aiProvider: process.env.AI_PROVIDER || "demo",
    groqReady: Boolean(process.env.GROQ_API_KEY),
  });
}
