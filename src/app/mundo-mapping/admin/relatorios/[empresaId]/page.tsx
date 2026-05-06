"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  company_name: string | null;
  email: string | null;
  plano: string | null;
  phone: string | null;
  website: string | null;
  created_at: string | null;
};

type ClickRow = {
  produto_id: string;
  creator_id: string;
  created_at: string;
};

type VendaRow = {
  produto_id: string;
  creator_id: string;
  valor: number;
  comissao: number;
  created_at: string;
};

type Nota = {
  id: string;
  conteudo: string;
  created_at: string;
  autor_id: string;
};

type Metrics = {
  totalClicks: number;
  totalVendas: number;
  totalComissao: number;
  totalGMV: number;
  activeCreators: number;
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default function AdminEmpresaRelatorioPage() {
  const router = useRouter();
  const { empresaId } = useParams<{ empresaId: string }>();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    totalClicks: 0,
    totalVendas: 0,
    totalComissao: 0,
    totalGMV: 0,
    activeCreators: 0,
  });
  const [notas, setNotas] = useState<Nota[]>([]);
  const [novaNota, setNovaNota] = useState("");
  const [savingNota, setSavingNota] = useState(false);
  const adminIdRef = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/mundo-mapping/empresa/login"); return; }

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();

      if (myProfile?.user_type !== "admin") {
        setError("Acesso restrito ao time Mundo Mapping.");
        setLoading(false);
        return;
      }

      adminIdRef.current = user.id;
      setAuthorized(true);

      const [{ data: empresa }, { data: clicksData }, { data: vendasData }, { data: notasData }] = await Promise.all([
        supabase.from("profiles").select("id, company_name, email, plano, phone, website, created_at").eq("id", empresaId).single(),
        supabase.from("clicks").select("produto_id, creator_id, created_at").eq("empresa_id", empresaId),
        supabase.from("vendas").select("produto_id, creator_id, valor, comissao, created_at").eq("empresa_id", empresaId),
        supabase.from("anotacoes_admin").select("id, conteudo, created_at, autor_id").eq("empresa_id", empresaId).order("created_at", { ascending: false }),
      ]);

      setProfile(empresa ?? null);
      setNotas((notasData ?? []) as Nota[]);

      const clicks = (clicksData ?? []) as ClickRow[];
      const vendas = (vendasData ?? []) as VendaRow[];
      const creatorsSet = new Set([
        ...clicks.map((c) => c.creator_id),
        ...vendas.map((v) => v.creator_id),
      ]);

      setMetrics({
        totalClicks: clicks.length,
        totalVendas: vendas.length,
        totalComissao: vendas.reduce((s, v) => s + (v.comissao ?? 0), 0),
        totalGMV: vendas.reduce((s, v) => s + (v.valor ?? 0), 0),
        activeCreators: creatorsSet.size,
      });

      setLoading(false);
    }
    load();
  }, [empresaId, router]);

  async function addNota() {
    if (!novaNota.trim() || !adminIdRef.current) return;
    setSavingNota(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("anotacoes_admin")
      .insert({ empresa_id: empresaId, conteudo: novaNota.trim(), autor_id: adminIdRef.current })
      .select()
      .single();

    if (!err && data) {
      setNotas((prev) => [data as Nota, ...prev]);
      setNovaNota("");
    }
    setSavingNota(false);
  }

  async function deleteNota(id: string) {
    const supabase = createClient();
    await supabase.from("anotacoes_admin").delete().eq("id", id);
    setNotas((prev) => prev.filter((n) => n.id !== id));
  }

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
          <Link className="mt-4 inline-block text-sm text-zinc-500 underline" href="/mundo-mapping/admin/relatorios">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {/* Header */}
        <div>
          <Link className="text-xs font-semibold text-zinc-400 hover:text-zinc-600" href="/mundo-mapping/admin/relatorios">
            ← Todas as empresas
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            {profile?.company_name ?? "Empresa"}
          </h1>
          <div className="mt-1 flex flex-wrap gap-4 text-sm text-zinc-500">
            {profile?.email && <span>{profile.email}</span>}
            {profile?.phone && <span>{profile.phone}</span>}
            {profile?.website && (
              <a className="text-red-700 hover:underline" href={profile.website} rel="noreferrer" target="_blank">
                {profile.website}
              </a>
            )}
            {profile?.plano && (
              <span className="capitalize font-semibold text-zinc-700">Plano: {profile.plano}</span>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Cliques totais" value={metrics.totalClicks.toLocaleString("pt-BR")} />
          <MetricCard label="Vendas totais" value={metrics.totalVendas.toLocaleString("pt-BR")} />
          <MetricCard
            label="GMV gerado"
            value={`R$ ${metrics.totalGMV.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          />
          <MetricCard
            label="Comissão paga"
            value={`R$ ${metrics.totalComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            sub={`${metrics.activeCreators} creator${metrics.activeCreators !== 1 ? "s" : ""} ativo${metrics.activeCreators !== 1 ? "s" : ""}`}
          />
        </div>

        {/* Internal notes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-800">Anotações internas</h2>
          <p className="mt-0.5 text-xs text-zinc-400">Só o time Mundo Mapping visualiza estas notas.</p>

          <div className="mt-4 flex gap-3">
            <textarea
              className="flex-1 resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              onChange={(e) => setNovaNota(e.target.value)}
              placeholder="Adicionar anotação…"
              rows={3}
              value={novaNota}
            />
            <button
              className="self-end rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              disabled={!novaNota.trim() || savingNota}
              onClick={addNota}
              type="button"
            >
              {savingNota ? "…" : "Salvar"}
            </button>
          </div>

          {notas.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-400">Nenhuma anotação ainda.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {notas.map((nota) => (
                <li className="flex items-start justify-between gap-4 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3" key={nota.id}>
                  <div>
                    <p className="text-sm text-zinc-700">{nota.conteudo}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(nota.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <button
                    className="shrink-0 text-xs text-zinc-400 transition hover:text-red-600"
                    onClick={() => deleteNota(nota.id)}
                    type="button"
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
