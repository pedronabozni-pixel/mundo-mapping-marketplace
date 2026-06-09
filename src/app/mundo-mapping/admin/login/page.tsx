"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // If already logged in as admin, redirect straight to panel
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();
      if (data?.user_type === "admin") window.location.href = "/mundo-mapping/admin";
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUnauthorized(false);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    // Use a single client instance throughout — a new instance won't share
    // in-memory session state with the one that just signed in.
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.session) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Query profile using the same client instance that has the fresh session
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", data.session.user.id)
      .single();

    if (profile?.user_type !== "admin") {
      setUnauthorized(true);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    window.location.href = "/mundo-mapping/admin";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: "#0a0a0a" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <MappingPartnersLogo onDark size="lg" subtitle="Admin" variant="stacked" />
          <p className="text-sm" style={{ color: "#888" }}>Acesso restrito a administradores</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "#888" }} htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="w-full bg-transparent border-b border-white/10 py-3 text-[15px] text-white placeholder:text-[#333] outline-none transition-colors focus:border-[#C8102E]"
              id="email"
              name="email"
              placeholder="admin@exemplo.com"
              required
              type="email"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "#888" }} htmlFor="password">
              Senha
            </label>
            <input
              autoComplete="current-password"
              className="w-full bg-transparent border-b border-white/10 py-3 text-[15px] text-white placeholder:text-[#333] outline-none transition-colors focus:border-[#C8102E]"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              type="password"
            />
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(200,16,46,0.12)", border: "1px solid rgba(200,16,46,0.2)", color: "#C8102E" }}>
              {error}
            </div>
          )}

          {unauthorized && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)", color: "#FBBF24" }}>
              Acesso não autorizado. Esta conta não possui permissão de administrador.
            </div>
          )}

          <button
            className="w-full rounded-lg bg-[#C8102E] px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#A30D24] disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
