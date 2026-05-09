import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qaqbpjfbxyqtduxroitc.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhcWJwamZieHlxdGR1eHJvaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDMxNjgsImV4cCI6MjA5MzU3OTE2OH0.gOw-I_hKsK41N6EvdNxBrzFkwTEPoo156RORLVaIgdE";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Returns a Supabase client that bypasses RLS (service role) when the key is
// available, otherwise falls back to anon key with the provided access token.
export function createAdminClient(userAccessToken?: string) {
  if (SERVICE_ROLE_KEY) {
    return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(userAccessToken
      ? { global: { headers: { Authorization: `Bearer ${userAccessToken}` } } }
      : {}),
  });
}
