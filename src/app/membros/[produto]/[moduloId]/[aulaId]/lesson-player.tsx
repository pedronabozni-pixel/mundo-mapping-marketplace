"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getEmbedUrl } from "@/lib/video-embed";

type Material = {
  id: string;
  titulo: string;
  url: string;
  tipo: string;
};

type Props = {
  userId: string;
  produtoId: string;
  aulaId: string;
  moduloNum: number;
  aulaNum: number;
  aulaAtual: {
    titulo: string;
    descricao: string | null;
    video_url: string | null;
    duracao_minutos: number | null;
  };
  aulaConcluida: boolean;
  materiais: Material[];
  aulaAnterior: { id: string; slug: string; moduloId: string } | null;
  proximaAula: { id: string; slug: string; moduloId: string } | null;
};

function tipoIcon(tipo: string) {
  if (tipo === "pdf") return "📄";
  if (tipo === "link") return "🔗";
  return "📁";
}

export default function LessonPlayer({
  produtoId,
  aulaId,
  moduloNum,
  aulaNum,
  aulaAtual,
  aulaConcluida: initialConcluida,
  materiais,
  aulaAnterior,
  proximaAula,
}: Props) {
  const router = useRouter();
  const [concluida, setConcluida] = useState(initialConcluida);
  const [loading, setLoading] = useState(false);

  async function toggleConcluida() {
    setLoading(true);
    try {
      const res = await fetch("/api/membros/progresso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aula_id: aulaId,
          produto_id: produtoId,
          concluida: !concluida,
        }),
      });
      if (res.ok) {
        const nova = !concluida;
        setConcluida(nova);
        if (nova && proximaAula) {
          router.push(`/membros/${proximaAula.slug}/${proximaAula.moduloId}/${proximaAula.id}`);
        } else {
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const embed = aulaAtual.video_url ? getEmbedUrl(aulaAtual.video_url) : null;

  return (
    <div className="mx-auto max-w-[920px] px-6 py-8">
      {/* Player */}
      {embed ? (
        <div className="overflow-hidden rounded-2xl bg-black shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embed.embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
      ) : (
        <div
          className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <span className="text-3xl">🎬</span>
          </div>
          <p className="text-sm" style={{ color: "#555" }}>Vídeo em breve</p>
        </div>
      )}

      {/* Título e botões */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#555" }}>
            Módulo {moduloNum} · Aula {aulaNum}
          </p>
          <h1 className="mt-1 font-serif text-[24px] text-white">{aulaAtual.titulo}</h1>
          {aulaAtual.duracao_minutos && (
            <p className="mt-1 text-sm" style={{ color: "#555" }}>⏱ {aulaAtual.duracao_minutos} min</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={toggleConcluida}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition disabled:opacity-60"
            style={
              concluida
                ? { background: "rgba(74,222,128,0.15)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.3)" }
                : { background: "#C8102E" }
            }
          >
            {loading ? "…" : concluida ? "Concluída ✓" : "Marcar como concluída"}
          </button>
          {proximaAula && (
            <a
              href={`/membros/${proximaAula.slug}/${proximaAula.moduloId}/${proximaAula.id}`}
              className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Próxima aula →
            </a>
          )}
        </div>
      </div>

      {/* Descrição */}
      {aulaAtual.descricao && (
        <div
          className="mt-5 whitespace-pre-wrap rounded-xl px-5 py-4 text-sm leading-6"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#888" }}
        >
          {aulaAtual.descricao}
        </div>
      )}

      {/* Materiais */}
      {materiais.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: "#888" }}>
            Materiais da aula
          </h2>
          <div className="space-y-2">
            {materiais.map((mat) => (
              <a
                key={mat.id}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-xl">{tipoIcon(mat.tipo)}</span>
                <span className="flex-1 text-sm text-white">{mat.titulo}</span>
                <span className="text-xs font-semibold" style={{ color: "#C8102E" }}>Baixar ↓</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Navegação entre aulas */}
      <div className="mt-8 flex items-center justify-between pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {aulaAnterior ? (
          <a
            href={`/membros/${aulaAnterior.slug}/${aulaAnterior.moduloId}/${aulaAnterior.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}
          >
            ← Aula anterior
          </a>
        ) : (
          <div />
        )}

        {proximaAula && (
          <a
            href={`/membros/${proximaAula.slug}/${proximaAula.moduloId}/${proximaAula.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#C8102E] px-5 text-sm font-bold text-white transition hover:bg-[#A30D24]"
          >
            Próxima aula →
          </a>
        )}
      </div>
    </div>
  );
}
