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
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Panda Video
  const pandaMatch = url.match(/player\.pandavideo\.com\.br\/embed\/\?v=([A-Za-z0-9-]+)/);
  if (pandaMatch) return url;

  return url;
}

function tipoIcon(tipo: string) {
  if (tipo === "pdf") return "📄";
  if (tipo === "link") return "🔗";
  return "📁";
}

export default function LessonPlayer({
  userId,
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
          router.push(`/membros/${proximaAula.slug}/${proximaAula.moduloId}/${proximaAula.id}`);
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
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      {/* Player de vídeo */}
      {videoSrc ? (
        <div style={{
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: "14px",
          overflow: "hidden",
          background: "#000",
          marginBottom: "1.5rem",
          boxShadow: "0 8px 32px #00000066",
        }}>
          <iframe
            src={videoSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
      ) : (
        <div style={{
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: "14px",
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
          flexDirection: "column",
          gap: "0.75rem",
        }}>
          <span style={{ fontSize: "3rem" }}>🎬</span>
          <p style={{ color: "#4b5563", fontSize: "0.9rem" }}>Vídeo em breve</p>
        </div>
      )}

      {/* Título e controles */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", marginBottom: "0.25rem" }}>
            {aulaAtual.titulo}
          </h1>
          {aulaAtual.duracao_minutos && (
            <span style={{ fontSize: "0.8rem", color: "#4b5563" }}>
              ⏱ {aulaAtual.duracao_minutos} min
            </span>
          )}
        </div>

        <button
          onClick={toggleConcluida}
          disabled={loading}
          style={{
            background: concluida
              ? "linear-gradient(135deg, #059669, #10b981)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "0.7rem 1.5rem",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "opacity 0.2s",
          }}
        >
          {loading ? "..." : concluida ? "✓ Concluída" : "Marcar como concluída"}
        </button>
      </div>

      {/* Descrição */}
      {aulaAtual.descricao && (
        <div style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          color: "#d1d5db",
          fontSize: "0.9rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}>
          {aulaAtual.descricao}
        </div>
      )}

      {/* Materiais */}
      {materiais.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e5e7eb", marginBottom: "0.75rem" }}>
            Material de apoio
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {materiais.map((mat) => (
              <a
                key={mat.id}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "10px",
                  padding: "0.75rem 1rem",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                  color: "#d1d5db",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
              >
                <span style={{ fontSize: "1.25rem" }}>{tipoIcon(mat.tipo)}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{mat.titulo}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#4b5563" }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Navegação entre aulas */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid #1f1f1f",
        flexWrap: "wrap",
      }}>
        {aulaAnterior ? (
          <a
            href={`/membros/${aulaAnterior.slug}/${aulaAnterior.moduloId}/${aulaAnterior.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              color: "#9ca3af",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "0.65rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            ← Aula anterior
          </a>
        ) : <div />}

        {proximaAula && (
          <a
            href={`/membros/${proximaAula.slug}/${proximaAula.moduloId}/${proximaAula.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "0.65rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 700,
            }}
          >
            Próxima aula →
          </a>
        )}
      </div>
    </div>
  );
}
