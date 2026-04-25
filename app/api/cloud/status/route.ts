import { NextResponse } from "next/server";

export async function GET() {
  const auth = (process.env.ENABLE_AUTH || "false").toLowerCase() === "true";
  const storage = (process.env.ENABLE_SERVER_STORAGE || "false").toLowerCase() === "true";
  const hasSupabaseUrl = !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    ok: true,
    version: "28",
    authEnabled: auth,
    serverStorageEnabled: storage,
    supabaseConfigured: hasSupabaseUrl && (hasAnon || hasService),
    localModeAvailable: true,
    message: auth || storage
      ? "Mode cloud préparé. Vérifie que les variables Supabase sont configurées."
      : "Mode local actif. Aucun paiement ni service externe obligatoire."
  });
}
