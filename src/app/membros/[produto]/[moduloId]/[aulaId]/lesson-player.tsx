"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

function embedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
}

function tipoIcon(tipo: string) {
  if (tipo === "pdf") return "📄";
  if (tipo === "link") return "🔗";
  return "📁";
}

export default function LessonPlayer({
  produtoId,
  aulaId,
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
          router.push(
            `/membros/${proximaAula.slug}/${proximaAula.moduloId}/${proximaAula.id}`
          );
        } else {
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const videoSrc = aulaAtual.video_url ? embedUrl(aulaAtual.video_url) : null;

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      {/* Player */}
      {videoSrc ? (
        <div className="overflow-hidden rounded-2xl bg-black shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={videoSrc}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <span className="text-3xl">🎬</span>
          </div>
          <p className="text-sm text-white/30">Vídeo em breve</p>
        </div>
      )}

      {/* Título e botão concluir */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{aulaAtual.titulo}</h1>
          {aulaAtual.duracao_minutos && (
            <p className="mt-1 text-sm text-white/40">
              ⏱ {aulaAtual.duracao_minutos} min
            </p>
          )}
        </div>

        <button
          onClick={toggleConcluida}
          disabled={loading}
          className={`inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-bold text-white shadow-[0_12px_30px_-20px_rgba(220,38,38,0.8)] transition disabled:opacity-60 ${
            concluida
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-none"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading ? "…" : concluida ? "✓ Concluída" : "Marcar como concluída"}
        </button>
      </div>

      {/* Descrição */}
      {aulaAtual.descricao && (
        <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#1a1a1a] px-5 py-4 text-sm leading-6 text-white/60 whitespace-pre-wrap">
          {aulaAtual.descricao}
        </div>
      )}

      {/* Materiais */}
      {materiais.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-white/50 uppercase tracking-[0.12em]">
            Material de apoio
          </h2>
          <div className="space-y-2">
            {materiais.map((mat) => (
              <a
                key={mat.id}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#1a1a1a] px-4 py-3 transition hover:border-red-600/40 hover:bg-red-600/5"
              >
                <span className="text-xl">{tipoIcon(mat.tipo)}</span>
                <span className="flex-1 text-sm text-white/70">{mat.titulo}</span>
                <span className="text-xs text-white/30">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Navegação entre aulas */}
      <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-6">
        {aulaAnterior ? (
          <a
            href={`/membros/${aulaAnterior.slug}/${aulaAnterior.moduloId}/${aulaAnterior.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white"
          >
            ← Aula anterior
          </a>
        ) : (
          <div />
        )}

        {proximaAula && (
          <a
            href={`/membros/${proximaAula.slug}/${proximaAula.moduloId}/${proximaAula.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-[0_12px_30px_-20px_rgba(220,38,38,0.8)] transition hover:bg-red-700"
          >
            Próxima aula →
          </a>
        )}
      </div>
    </div>
  );
}
