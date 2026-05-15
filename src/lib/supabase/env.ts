// Reads a Supabase env var and strips any leading '=' that can appear when
// the Railway/Docker env is configured as KEY==VALUE instead of KEY=VALUE.
export function readSupabaseEnv(key: string, fallback: string): string {
  const raw = process.env[key] ?? fallback;
  return raw.replace(/^=+/, "").trim();
}

export const SUPABASE_URL = readSupabaseEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  "https://qaqbpjfbxyqtduxroitc.supabase.co"
);

export const SUPABASE_ANON_KEY = readSupabaseEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhcWJwamZieHlxdGR1eHJvaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDMxNjgsImV4cCI6MjA5MzU3OTE2OH0.gOw-I_hKsK41N6EvdNxBrzFkwTEPoo156RORLVaIgdE"
);
