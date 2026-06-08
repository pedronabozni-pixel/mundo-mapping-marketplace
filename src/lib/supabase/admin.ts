import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

// Returns a Supabase client that bypasses RLS using the service role key.
//
// IMPORTANT: a chave é validada DENTRO da função (runtime), nunca no top-level
// do módulo — assim `next build` (que importa os módulos durante o build) não
// quebra quando a env var ainda não está disponível.
//
// O parâmetro `_userAccessToken` é mantido por compatibilidade com chamadas
// existentes; o client service-role não precisa dele.
export function createAdminClient(_userAccessToken?: string) {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").replace(/^=+/, "").trim();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  }
  return createSupabaseClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
