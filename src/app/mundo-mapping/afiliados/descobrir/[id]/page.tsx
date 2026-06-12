"use client";

// Perfil do creator — o que aparece aqui é exatamente o que a rota de detalhe
// devolve para o tier do usuário (gating no servidor). Handles só chegam para
// Elite; e-mail/telefone não chegam para ninguém.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const RED = "#C8102E";
const CARD = "rounded-2xl border border-white/[0.06] bg-white/[0.02]";
const RED_GRADIENT =
  "linear-gradient(135deg, rgba(200,16,46,0.08), rgba(200,16,46,0.02), transparent)";

type CreatorDetail = {
  id: string;
  nome: string | null;
  bio: string | null;
  cidade: string | null;
  estado: string | null;
  rede_principal: string | null;
  instagram_seguidores: number | null;
  tiktok_seguidores: number | null;
  youtube_inscritos: number | null;
  taxa_engajamento: number | null;
  ativado: boolean | null;
  // SÓ presentes quando o servidor decide (Elite):
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
};

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

function IconLock({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Velocímetro de qualidade de engajamento (SVG inline) ─────────────────────
// Classificação: fraco < 1% | regular 1–3% | bom 3–6% | ótimo > 6%

function classificarEngajamento(taxa: number | null): { label: string; cor: string; frac: number } {
  const t = taxa ?? 0;
  if (t <= 0) return { label: "Sem dados", cor: "#555", frac: 0 };
  if (t < 1) return { label: "Fraco", cor: "#EF4444", frac: Math.min(t / 1, 1) * 0.25 };
  if (t <= 3) return { label: "Regular", cor: "#FBBF24", frac: 0.25 + ((t - 1) / 2) * 0.25 };
  if (t <= 6) return { label: "Bom", cor: "#4ADE80", frac: 0.5 + ((t - 3) / 3) * 0.3 };
  return { label: "Ótimo", cor: "#4ADE80", frac: Math.min(0.8 + ((t - 6) / 6) * 0.2, 1) };
}

function arcPath(cx: number, cy: number, r: number, fracStart: number, fracEnd: number): string {
  // 0 → 180° (esquerda), 1 → 0° (direita); semicírculo superior
  const a0 = Math.PI * (1 - fracStart);
  const a1 = Math.PI * (1 - fracEnd);
  const x0 = cx + r * Math.cos(a0), y0 = cy - r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

function GaugeEngajamento({ taxa }: { taxa: number | null }) {
  const { label, cor, frac } = classificarEngajamento(taxa);
  const cx = 100, cy = 92, r = 72;
  // ponteiro
  const ang = Math.PI * (1 - frac);
  const px = cx + (r - 14) * Math.cos(ang);
  const py = cy - (r - 14) * Math.sin(ang);

  return (
    <div className="flex flex-col items-center">
      <svg height="104" viewBox="0 0 200 104" width="200">
        {/* faixas: vermelho 0–25%, âmbar 25–50%, verde 50–100% */}
        <path d={arcPath(cx, cy, r, 0, 0.25)} fill="none" stroke="#EF4444" strokeLinecap="round" strokeWidth="12" opacity="0.85" />
        <path d={arcPath(cx, cy, r, 0.27, 0.5)} fill="none" stroke="#FBBF24" strokeLinecap="round" strokeWidth="12" opacity="0.85" />
        <path d={arcPath(cx, cy, r, 0.52, 1)} fill="none" stroke="#4ADE80" strokeLinecap="round" strokeWidth="12" opacity="0.85" />
        {/* ponteiro */}
        <line stroke="#fff" strokeLinecap="round" strokeWidth="3" x1={cx} x2={px} y1={cy} y2={py} />
        <circle cx={cx} cy={cy} fill="#fff" r="5" />
      </svg>
      <p className="text-lg font-extrabold" style={{ color: cor }}>{label}</p>
      <p className="text-xs text-[#888]">
        {taxa != null ? `${Number(taxa).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% de engajamento` : "engajamento não informado"}
      </p>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PerfilCreatorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<{ tier: "pago" | "elite"; creator: CreatorDetail } | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [convite, setConvite] = useState<"idle" | "enviando" | "registrado" | "ja_convidado" | "limite">("idle");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/empresa/creators/${id}`);
        if (res.status === 403) { router.replace("/mundo-mapping/afiliados/descobrir"); return; }
        if (!res.ok) throw new Error(String(res.status));
        setData(await res.json());
      } catch {
        setErro("Não foi possível carregar o perfil.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const convidar = useCallback(async () => {
    setConvite("enviando");
    try {
      const res = await fetch(`/api/empresa/creators/${id}/convidar`, { method: "POST" });
      const body = await res.json();
      // Limite diário (server-side é a fonte da verdade): mostra estado próprio.
      if (res.status === 429 && body?.limite) {
        setConvite("limite");
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? "erro");
      setConvite(body.ja_convidado ? "ja_convidado" : "registrado");
    } catch {
      setConvite("idle");
      setErro("Não foi possível registrar o convite. Tente novamente.");
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#C8102E]" />
      </div>
    );
  }

  if (erro && !data) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{erro}</div>;
  }
  if (!data) return null;

  const { tier, creator } = data;
  const isElite = tier === "elite";
  const redes = [
    { nome: "Instagram", handle: creator.instagram, seguidores: creator.instagram_seguidores, unidade: "seguidores" },
    { nome: "TikTok", handle: creator.tiktok, seguidores: creator.tiktok_seguidores, unidade: "seguidores" },
    { nome: "YouTube", handle: creator.youtube, seguidores: creator.youtube_inscritos, unidade: "inscritos" },
  ];
  const totalSeguidores = Math.max(
    creator.instagram_seguidores ?? 0,
    creator.tiktok_seguidores ?? 0,
    creator.youtube_inscritos ?? 0,
  );

  return (
    <div className="space-y-5">
      {/* Topo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-xs text-[#555] transition hover:text-white" href="/mundo-mapping/afiliados/descobrir">
          ← Voltar para a base
        </Link>
        {isElite ? (
          convite === "limite" ? (
            <span className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-[#555]">
              <IconLock />
              Limite diário atingido
            </span>
          ) : convite === "registrado" || convite === "ja_convidado" ? (
            <span className="rounded-xl px-5 py-2.5 text-xs font-bold" style={{ backgroundColor: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
              {convite === "registrado" ? "✓ Convite registrado" : "✓ Já convidado"}
            </span>
          ) : (
            <button
              className="rounded-xl px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              disabled={convite === "enviando"}
              onClick={convidar}
              style={{ backgroundColor: RED }}
              type="button"
            >
              {convite === "enviando" ? "Registrando..." : "Convidar para se afiliar"}
            </button>
          )
        ) : (
          <span className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-[#888]">
            <IconLock />
            Convites são exclusivos do Elite
          </span>
        )}
      </div>

      {erro && data && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* ── Coluna esquerda: identidade ── */}
        <div className={`p-6 ${CARD}`}>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-extrabold text-white" style={{ background: RED_GRADIENT, border: "1px solid rgba(200,16,46,0.15)" }}>
              {initials(creator.nome)}
            </div>
            <h1 className="mt-4 text-xl font-extrabold text-white">{creator.nome ?? "Creator"}</h1>
            <div className="mt-2">
              {creator.ativado ? (
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider" style={{ backgroundColor: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>✓ ATIVO</span>
              ) : (
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#888]">MUNDO MAPPING</span>
              )}
            </div>
          </div>

          {creator.bio && (
            <p className="mt-5 text-sm leading-6 text-[#888]">{creator.bio}</p>
          )}

          <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#555]">Cidade</p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {[creator.cidade, creator.estado].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#555]">Rede principal</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{creator.rede_principal ?? "—"}</p>
            </div>
          </div>

          <p className="mt-5 rounded-xl bg-white/[0.03] px-4 py-3 text-xs leading-5 text-[#555]">
            O contato acontece pela plataforma; e-mail e telefone não são exibidos.
          </p>
        </div>

        {/* ── Coluna direita ── */}
        <div className="space-y-5">
          <div className={`p-6 ${CARD}`}>
            <p className="mb-5 text-sm font-bold text-white">Conteúdo e audiência</p>
            <div className="grid items-center gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-white/[0.03] px-4 py-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Seguidores totais</p>
                <p className="mt-1 text-2xl font-extrabold text-white">{fmtSeguidoresLabel(totalSeguidores)}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] px-4 py-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Engajamento by Mapping</p>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  {creator.taxa_engajamento != null ? `${Number(creator.taxa_engajamento).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "—"}
                </p>
              </div>
              <GaugeEngajamento taxa={creator.taxa_engajamento} />
            </div>
          </div>

          <div className={`p-6 ${CARD}`}>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-bold text-white">Redes sociais</p>
              {!isElite && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#555]">
                  <IconLock className="h-3 w-3" />
                  HANDLES NO ELITE
                </span>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {redes.map((r) => (
                <div className="rounded-xl bg-white/[0.03] px-4 py-4" key={r.nome}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">{r.nome}</p>
                  <p className="mt-1 text-lg font-extrabold text-white">{fmtSeguidoresLabel(r.seguidores)}</p>
                  <p className="text-[10px] text-[#555]">{r.unidade}</p>
                  {isElite && r.handle && (
                    <p className="mt-2 flex items-center gap-1.5 truncate text-xs font-semibold" style={{ color: RED }}>
                      <span className="rounded px-1 py-0.5 text-[8px] font-extrabold tracking-widest text-white" style={{ backgroundColor: RED }}>ELITE</span>
                      {r.handle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
