"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

async function checkAdminRole(access_token: string, user_id: string): Promise<boolean> {
  const res = await fetch("/api/mundo-mapping/admin/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token, user_id }),
  });
  if (!res.ok) return false;
  const json = await res.json();
  return json.isAdmin === true;
}

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // If already logged in as admin, redirect straight to panel
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const isAdmin = await checkAdminRole(session.access_token, session.user.id);
      if (isAdmin) window.location.href = "/mundo-mapping/admin";
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

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.session) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    const isAdmin = await checkAdminRole(data.session.access_token, data.session.user.id);

    if (!isAdmin) {
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
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">Mundo Mapping</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Painel Admin</h1>
          <p className="mt-1 text-sm text-zinc-500">Acesso restrito a administradores</p>
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
