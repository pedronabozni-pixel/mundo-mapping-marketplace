import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qaqbpjfbxyqtduxroitc.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhcWJwamZieHlxdGR1eHJvaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDMxNjgsImV4cCI6MjA5MzU3OTE2OH0.gOw-I_hKsK41N6EvdNxBrzFkwTEPoo156RORLVaIgdE";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
