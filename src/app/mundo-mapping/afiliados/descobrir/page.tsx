"use client";

// Vitrine "Encontrar creators" — 3 estados por tier (free/pago/elite).
// O gating REAL é no servidor: esta página apenas reflete o que a rota
// /api/empresa/creators devolve para o plano do usuário logado.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const RED = "#C8102E";
const CARD = "rounded-2xl border border-white/[0.06] bg-white/[0.02]";
const INPUT =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-[#555] focus:border-[#C8102E]";
const RED_GRADIENT =
  "linear-gradient(135deg, rgba(200,16,46,0.08), rgba(200,16,46,0.02), transparent)";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Creator = {
  id: string;
  nome: string | null;
  cidade: string | null;
  estado: string | null;
  rede_principal: string | null;
  instagram_seguidores: number | null;
  tiktok_seguidores: number | null;
  youtube_inscritos: number | null;
  taxa_engajamento: number | null;
  ativado: boolean | null;
};

type ListResponse = {
  tier: "free" | "pago" | "elite";
  total: number;
  page?: number;
  per_page?: number;
  creators?: Creator[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSeguidoresLabel(n: number | null | undefined): string {
  if (!n || n <= 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return n.toLocaleString("pt-BR");
}

function initials(nome: string | null): string {
  if (!nome) return "?";
  const parts = nome.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function maiorAudiencia(c: Creator): number {
  return Math.max(c.instagram_seguidores ?? 0, c.tiktok_seguidores ?? 0, c.youtube_inscritos ?? 0);
}

// ─── Ícones (SVG inline) ──────────────────────────────────────────────────────

function IconLock({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function RedeIcon({ rede, className = "h-4 w-4" }: { rede: string; className?: string }) {
  if (rede === "instagram") {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect height="18" rx="5" width="18" x="3" y="3" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" fill="currentColor" r="1" stroke="none" />
      </svg>
    );
  }
  if (rede === "tiktok") {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.6 7.1a5 5 0 0 1-3.6-1.6v8.1a6 6 0 1 1-6-6c.2 0 .5 0 .7.1v3a3 3 0 1 0 2.3 2.9V2h3a5 5 0 0 0 3.6 4z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z" />
    </svg>
  );
}

// ─── Selo / badge do creator ──────────────────────────────────────────────────

function CreatorBadge({ ativado }: { ativado: boolean | null }) {
  if (ativado) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider" style={{ backgroundColor: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
        ✓ ATIVO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#888]">
      MUNDO MAPPING
    </span>
  );
}

// ─── Card do creator ──────────────────────────────────────────────────────────

function CreatorCard({ creator, tier }: { creator: Creator; tier: "pago" | "elite" }) {
  const seg = maiorAudiencia(creator);
  const local = [creator.cidade, creator.estado].filter(Boolean).join(" · ");
  return (
    <div className={`flex flex-col p-5 transition hover:bg-white/[0.04] ${CARD}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white" style={{ background: RED_GRADIENT, border: "1px solid rgba(200,16,46,0.15)" }}>
          {initials(creator.nome)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{creator.nome ?? "Creator"}</p>
          <p className="truncate text-xs text-[#555]">{local || "Brasil"}</p>
          <div className="mt-1.5"><CreatorBadge ativado={creator.ativado} /></div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[#888]">
            <RedeIcon className="h-3.5 w-3.5" rede={(creator.rede_principal ?? "instagram").toLowerCase()} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{creator.rede_principal ?? "Rede"}</span>
          </div>
          <p className="mt-1 text-sm font-extrabold text-white">{fmtSeguidoresLabel(seg)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888]">Engajamento</p>
          <p className="mt-1 text-sm font-extrabold text-white">
            {creator.taxa_engajamento != null ? `${Number(creator.taxa_engajamento).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        {tier === "elite" ? (
          <Link
            className="block w-full rounded-xl py-2.5 text-center text-xs font-bold text-white transition hover:opacity-90"
            href={`/mundo-mapping/afiliados/descobrir/${creator.id}`}
            style={{ backgroundColor: RED }}
          >
            Convidar para se afiliar
          </Link>
        ) : (
          <Link
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-xs font-semibold text-[#888] transition hover:text-white"
            href={`/mundo-mapping/afiliados/descobrir/${creator.id}`}
          >
            <IconLock />
            Contato disponível no Elite
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Teaser FREE (placeholders FICTÍCIOS — nunca dados reais borrados) ────────

const FAKE_PLACEHOLDERS = [
  { nome: "Mariana S.", local: "São Paulo · SP", seg: "120 mil" },
  { nome: "João Pedro L.", local: "Rio de Janeiro · RJ", seg: "85 mil" },
  { nome: "Camila R.", local: "Belo Horizonte · MG", seg: "210 mil" },
  { nome: "Lucas F.", local: "Curitiba · PR", seg: "64 mil" },
  { nome: "Beatriz M.", local: "Salvador · BA", seg: "150 mil" },
  { nome: "Rafael T.", local: "Porto Alegre · RS", seg: "98 mil" },
];

function FreeTeaser({ total }: { total: number }) {
  return (
    <div className="relative">
      <div className="pointer-events-none grid select-none gap-4 blur-[6px] md:grid-cols-2 xl:grid-cols-3" aria-hidden>
        {FAKE_PLACEHOLDERS.map((p) => (
          <div className={`p-5 ${CARD}`} key={p.nome}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-sm font-extrabold text-white">
                {p.nome[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{p.nome}</p>
                <p className="text-xs text-[#555]">{p.local}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888]">Instagram</p>
                <p className="mt-1 text-sm font-extrabold text-white">{p.seg}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888]">Engajamento</p>
                <p className="mt-1 text-sm font-extrabold text-white">4,2%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card central de upgrade */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="mx-4 w-full max-w-md rounded-2xl p-8 text-center" style={{ background: "#141414", border: "1px solid rgba(200,16,46,0.15)", boxShadow: "0 24px 80px -20px rgba(0,0,0,0.8)" }}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: RED_GRADIENT, border: "1px solid rgba(200,16,46,0.15)", color: RED }}>
            <IconLock className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {total.toLocaleString("pt-BR")} creators esperando seus produtos
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#888]">
            Assine um plano para navegar pela base, ver audiência e engajamento, e convidar creators para se afiliarem.
          </p>
          <Link
            className="mt-5 inline-block w-full rounded-xl py-3.5 text-sm font-bold text-white transition hover:opacity-90"
            href="/mundo-mapping/afiliados"
            style={{ backgroundColor: RED }}
          >
            Conhecer os planos
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Painel de filtros (Elite) ────────────────────────────────────────────────

type Filtros = {
  q: string;
  estado: string;
  cidade: string;
  rede: string;
  min_seguidores: string;
  max_seguidores: string;
};

const FILTROS_VAZIOS: Filtros = { q: "", estado: "", cidade: "", rede: "", min_seguidores: "", max_seguidores: "" };

function FiltrosElite({ onApply }: { onApply: (f: Filtros) => void }) {
  const [f, setF] = useState<Filtros>(FILTROS_VAZIOS);
  const set = (k: keyof Filtros, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="rounded-2xl p-5" style={{ background: RED_GRADIENT, border: "1px solid rgba(200,16,46,0.15)" }}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-white">Filtros disponíveis</p>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-widest text-white" style={{ backgroundColor: RED }}>
          ELITE
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">Sobre o influencer</p>
          <input className={INPUT} onChange={(e) => set("q", e.target.value)} placeholder="Nome do creator" value={f.q} />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">Localização</p>
          <div className="flex gap-2">
            <input className={`${INPUT} w-20`} maxLength={2} onChange={(e) => set("estado", e.target.value.toUpperCase())} placeholder="UF" value={f.estado} />
            <input className={INPUT} onChange={(e) => set("cidade", e.target.value)} placeholder="Cidade" value={f.cidade} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">Redes sociais</p>
          <div className="flex items-center gap-2">
            {(["instagram", "tiktok", "youtube"] as const).map((r) => (
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border transition"
                key={r}
                onClick={() => set("rede", f.rede === r ? "" : r)}
                style={{
                  borderColor: f.rede === r ? RED : "rgba(255,255,255,0.08)",
                  backgroundColor: f.rede === r ? "rgba(200,16,46,0.15)" : "rgba(255,255,255,0.03)",
                  color: f.rede === r ? "#fff" : "#888",
                }}
                title={r}
                type="button"
              >
                <RedeIcon rede={r} />
              </button>
            ))}
            <input className={INPUT} inputMode="numeric" onChange={(e) => set("min_seguidores", e.target.value.replace(/\D/g, ""))} placeholder="Mín." value={f.min_seguidores} />
            <input className={INPUT} inputMode="numeric" onChange={(e) => set("max_seguidores", e.target.value.replace(/\D/g, ""))} placeholder="Máx." value={f.max_seguidores} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#888] transition hover:text-white"
          onClick={() => { setF(FILTROS_VAZIOS); onApply(FILTROS_VAZIOS); }}
          type="button"
        >
          Limpar
        </button>
        <button
          className="rounded-xl px-5 py-2 text-xs font-bold text-white transition hover:opacity-90"
          onClick={() => onApply(f)}
          style={{ backgroundColor: RED }}
          type="button"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DescobrirCreatorsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [buscaPago, setBuscaPago] = useState("");

  const load = useCallback(async (p: number, f: Filtros) => {
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (f.q) params.set("q", f.q);
      if (f.estado) params.set("estado", f.estado);
      if (f.cidade) params.set("cidade", f.cidade);
      if (f.rede) params.set("rede", f.rede);
      if (f.min_seguidores) params.set("min_seguidores", f.min_seguidores);
      if (f.max_seguidores) params.set("max_seguidores", f.max_seguidores);
      const res = await fetch(`/api/empresa/creators?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
    } catch {
      setErro("Não foi possível carregar a base de creators. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, filtros); }, [page, filtros, load]);

  const tier = data?.tier;
  const total = data?.total ?? 0;
  const creators = data?.creators ?? [];
  const totalPages = data?.per_page ? Math.max(1, Math.ceil(total / data.per_page)) : 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-white">Encontrar creators</h1>
        {data && (
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: RED_GRADIENT, border: "1px solid rgba(200,16,46,0.15)", color: RED }}>
            {total.toLocaleString("pt-BR")} creators
          </span>
        )}
      </div>

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      {/* Loading inicial */}
      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#C8102E]" />
        </div>
      )}

      {/* FREE: teaser com placeholders fictícios */}
      {tier === "free" && <FreeTeaser total={total} />}

      {/* ELITE: painel de filtros */}
      {tier === "elite" && (
        <FiltrosElite onApply={(f) => { setPage(1); setFiltros(f); }} />
      )}

      {/* PAGO não-elite: busca por nome + aviso */}
      {tier === "pago" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"><IconSearch /></span>
            <input
              className={`${INPUT} pl-9`}
              onChange={(e) => setBuscaPago(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); setFiltros({ ...FILTROS_VAZIOS, q: buscaPago }); } }}
              placeholder="Buscar por nome..."
              value={buscaPago}
            />
          </div>
          <button
            className="rounded-xl px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
            onClick={() => { setPage(1); setFiltros({ ...FILTROS_VAZIOS, q: buscaPago }); }}
            style={{ backgroundColor: RED }}
            type="button"
          >
            Buscar
          </button>
          <span className="flex items-center gap-1.5 text-xs text-[#555]">
            <IconLock />
            Filtros avançados são exclusivos do Elite
          </span>
        </div>
      )}

      {/* Grid (pago/elite) */}
      {(tier === "pago" || tier === "elite") && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#C8102E]" />
            </div>
          ) : creators.length === 0 ? (
            <div className={`p-12 text-center ${CARD}`}>
              <p className="text-sm font-semibold text-white">Nenhum creator encontrado</p>
              <p className="mt-1 text-xs text-[#888]">Ajuste a busca ou os filtros e tente de novo.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {creators.map((c) => (
                <CreatorCard creator={c} key={c.id} tier={tier} />
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#888] transition hover:text-white disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                ← Anterior
              </button>
              <span className="text-xs text-[#555]">Página {page} de {totalPages.toLocaleString("pt-BR")}</span>
              <button
                className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#888] transition hover:text-white disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                type="button"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
