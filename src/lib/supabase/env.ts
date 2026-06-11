// Strips any leading '=' that can appear when the Railway/Docker env is
// configured as KEY==VALUE instead of KEY=VALUE.
//
// IMPORTANT: env vars must be referenced by LITERAL keys (process.env.FOO),
// not dynamic ones (process.env[key]). Next.js only inlines NEXT_PUBLIC_* into
// the client bundle when the key is statically analyzable.
function clean(value: string | undefined): string {
  return (value ?? "").replace(/^=+/, "").trim();
}

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Runtime diagnostic — fires the first time a missing var is observed in the
// browser. Helps distinguish "code bug" from "missing build-time env var".
if (typeof window !== "undefined" && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
   
  console.error(
    "[Supabase env] NEXT_PUBLIC_SUPABASE_URL/ANON_KEY ausentes no bundle do client.\n" +
    "Causa: as variáveis não estavam disponíveis durante `next build`.\n" +
    "Fix no Railway: garantir que as vars estejam definidas como BUILD-TIME (não só runtime) e disparar um Redeploy completo.\n" +
    "URL presente: " + Boolean(SUPABASE_URL) + " | KEY presente: " + Boolean(SUPABASE_ANON_KEY)
  );
}
