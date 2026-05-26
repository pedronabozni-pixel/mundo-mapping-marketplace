// Strips any leading '=' that can appear when the Railway/Docker env is
// configured as KEY==VALUE instead of KEY=VALUE.
//
// IMPORTANT: env vars must be referenced by LITERAL keys (process.env.FOO),
// not dynamic ones (process.env[key]). Next.js only inlines NEXT_PUBLIC_* into
// the client bundle when the key is statically analyzable — dynamic access
// resolves at runtime in the browser, where process.env is empty and reads
// silently return undefined, breaking the client.
function clean(value: string | undefined): string {
  return (value ?? "").replace(/^=+/, "").trim();
}

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
