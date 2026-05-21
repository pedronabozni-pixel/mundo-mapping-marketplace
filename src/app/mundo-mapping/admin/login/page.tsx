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
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <MappingPartnersLogo onDark size="lg" subtitle="Admin" variant="stacked" />
          <p className="text-sm text-zinc-500">Acesso restrito a administradores</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-0"
              id="email"
              name="email"
              placeholder="admin@exemplo.com"
              required
              type="email"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400" htmlFor="password">
              Senha
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-0"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              type="password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {unauthorized && (
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-400">
              Acesso não autorizado. Esta conta não possui permissão de administrador.
            </div>
          )}

          <button
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-50"
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
