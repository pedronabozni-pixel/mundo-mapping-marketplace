"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Company = {
  id: string;
  company_name: string | null;
  email: string | null;
  plano: "partner" | "elite";
  created_at: string | null;
};

const PLAN_BADGE: Record<string, string> = {
  partner: "bg-blue-100 text-blue-700 ring-blue-200",
  elite: "bg-purple-100 text-purple-700 ring-purple-200",
};

export default function AdminRelatoriosPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/mundo-mapping/empresa/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();

      if (profile?.user_type !== "admin") {
        setError("Acesso restrito ao time Mundo Mapping.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("id, company_name, email, plano, created_at")
        .in("plano", ["partner", "elite"])
        .order("created_at", { ascending: false });

      if (fetchError) { setError(fetchError.message); setLoading(false); return; }
      setCompanies((data ?? []) as Company[]);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <Link className="mt-4 inline-block text-sm text-zinc-500 underline" href="/mundo-mapping/afiliados">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Admin / Mundo Mapping
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
            Relatórios de empresas
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Visão interna de todas as empresas nos planos Partner e Elite.
          </p>
        </div>

        {companies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            Nenhuma empresa nos planos Partner ou Elite ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3">Desde</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {companies.map((c) => (
                  <tr className="transition hover:bg-zinc-50" key={c.id}>
                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {c.company_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">{c.email ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${PLAN_BADGE[c.plano] ?? ""}`}
                      >
                        {c.plano.charAt(0).toUpperCase() + c.plano.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        className="font-semibold text-red-700 hover:text-red-800"
                        href={`/mundo-mapping/admin/relatorios/${c.id}`}
                      >
                        Ver relatório →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
