import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, readSupabaseEnv } from "./env";

const SERVICE_ROLE_KEY = readSupabaseEnv("SUPABASE_SERVICE_ROLE_KEY", "");

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
