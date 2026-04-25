type SupabaseInsertResult = { ok: boolean; status: number; data?: unknown; error?: string };

function supabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return { url, key };
}

export function isSupabaseReady() {
  const { url, key } = supabaseEnv();
  return Boolean(url && key && process.env.ENABLE_SERVER_STORAGE === "true");
}

export async function supabaseInsert(table: string, payload: Record<string, unknown>): Promise<SupabaseInsertResult> {
  const { url, key } = supabaseEnv();
  if (!url || !key) return { ok: false, status: 503, error: "Supabase n'est pas configuré." };

  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: unknown = undefined;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  return res.ok ? { ok: true, status: res.status, data } : { ok: false, status: res.status, error: typeof data === "string" ? data : JSON.stringify(data) };
}

export async function supabaseSelect(table: string, query = "select=*"): Promise<SupabaseInsertResult> {
  const { url, key } = supabaseEnv();
  if (!url || !key) return { ok: false, status: 503, error: "Supabase n'est pas configuré." };

  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = undefined;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  return res.ok ? { ok: true, status: res.status, data } : { ok: false, status: res.status, error: typeof data === "string" ? data : JSON.stringify(data) };
}
