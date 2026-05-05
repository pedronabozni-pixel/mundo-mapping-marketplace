import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qaqbpjfbxyqtduxroitc.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhcWJwamZieHlxdGR1eHJvaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDMxNjgsImV4cCI6MjA5MzU3OTE2OH0.gOw-I_hKsK41N6EvdNxBrzFkwTEPoo156RORLVaIgdE";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — cookies are read-only here.
        }
      },
    },
  });
}
