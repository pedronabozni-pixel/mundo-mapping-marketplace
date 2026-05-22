// Reads a Supabase env var and strips any leading '=' that can appear when
// the Railway/Docker env is configured as KEY==VALUE instead of KEY=VALUE.
export function readSupabaseEnv(key: string, fallback = ""): string {
  const raw = process.env[key] ?? fallback;
  return raw.replace(/^=+/, "").trim();
}

export const SUPABASE_URL = readSupabaseEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = readSupabaseEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
