import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LessonPlayer from "./lesson-player";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ produto: string; moduloId: string; aulaId: string }>;
};

export default async function AulaPage({ params }: Props) {
  const { produto: slug, moduloId, aulaId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/membros");

  // Produto
  const { data: produtoData } = await supabase
    .from("produtos")
    .select("id, slug, nome")
    .eq("slug", slug)
    .maybeSingle();

  if (!produtoData) notFound();

  // Verifica acesso
  const { data: acesso } = await supabase
    .from("acessos_membros")
    .select("id")
    .eq("produto_id", produtoData.id)
    .eq("comprador_email", user.email!)
    .eq("ativo", true)
    .maybeSingle();

  if (!acesso) redirect("/membros/cursos");

  // Aula atual
  const { data: aulaAtual } = await supabase
    .from("aulas")
    .select("id, titulo, descricao, video_url, duracao_minutos, ordem, modulo_id")
    .eq("id", aulaId)
    .eq("modulo_id", moduloId)
    .maybeSingle();

  if (!aulaAtual) notFound();

  // Verifica drip
  const agora = new Date();

  // Materiais da aula
  const { data: materiais } = await supabase
    .from("materiais_aula")
    .select("id, titulo, url, tipo")
    .eq("aula_id", aulaId)
    .order("titulo");

  // Módulos + aulas para sidebar
  const { data: modulos } = await supabase
    .from("modulos")
    .select(`
      id, titulo, ordem,
      aulas (
        id, titulo, ordem, liberado_em
      )
    `)
    .eq("produto_id", produtoData.id)
    .order("ordem");

  // Progresso do usuário
  const { data: progressoData } = await supabase
    .from("progresso_aulas")
    .select("aula_id, concluida")
    .eq("user_id", user.id)
    .eq("produto_id", produtoData.id);

  const progressoMap = new Map(
    (progressoData ?? []).map((p) => [p.aula_id, p.concluida])
  );

  const aulaConcluida = progressoMap.get(aulaId) === true;

  // Aula anterior e próxima
  const todasAulas: { id: string; moduloId: string }[] = [];
  for (const mod of modulos ?? []) {
    const sorted = [...(mod.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
    for (const a of sorted) todasAulas.push({ id: a.id, moduloId: mod.id });
  }
  const idx = todasAulas.findIndex((a) => a.id === aulaId);
  const aulaAnterior = idx > 0 ? todasAulas[idx - 1] : null;
  const proximaAula = idx < todasAulas.length - 1 ? todasAulas[idx + 1] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <header style={{
        background: "#1a1a1a",
        borderBottom: "1px solid #2a2a2a",
        padding: "0.875rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexShrink: 0,
        zIndex: 10,
      }}>
        <Link href={`/membros/${slug}`} style={{
          color: "#6b7280",
          textDecoration: "none",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          whiteSpace: "nowrap",
        }}>
          ← {produtoData.nome}
        </Link>
        <span style={{ color: "#2a2a2a" }}>|</span>
        <span style={{
          fontWeight: 600,
          fontSize: "0.9rem",
          color: "#d1d5db",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {aulaAtual.titulo}
        </span>
      </header>

      {/* Body: sidebar + conteúdo */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside style={{
          width: "320px",
          flexShrink: 0,
          background: "#111",
          borderRight: "1px solid #1f1f1f",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid #1f1f1f" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Conteúdo do Curso
            </span>
          </div>
          {(modulos ?? []).map((mod, modIdx) => {
            const aulasOrdenadas = [...(mod.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
            return (
              <div key={mod.id}>
                <div style={{
                  padding: "0.75rem 1rem",
                  background: "#161616",
                  borderBottom: "1px solid #1f1f1f",
                }}>
                  <span style={{ fontSize: "0.7rem", color: "#4b5563", fontWeight: 600 }}>
                    MÓDULO {modIdx + 1}
                  </span>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e5e7eb", margin: "0.15rem 0 0" }}>
                    {mod.titulo}
                  </p>
                </div>
                {aulasOrdenadas.map((a, aIdx) => {
                  const isAtiva = a.id === aulaId;
                  const isConcluida = progressoMap.get(a.id) === true;
                  const isLiberada = !a.liberado_em || new Date(a.liberado_em) <= agora;
                  return (
                    <div key={a.id}>
                      {isLiberada ? (
                        <Link
                          href={`/membros/${slug}/${mod.id}/${a.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem 1rem",
                            textDecoration: "none",
                            background: isAtiva ? "#1e1b4b" : "transparent",
                            borderLeft: isAtiva ? "3px solid #6366f1" : "3px solid transparent",
                            borderBottom: "1px solid #1a1a1a",
                            transition: "background 0.15s",
                          }}
                        >
                          <div style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: isConcluida ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : isAtiva ? "#3730a3" : "#1f1f1f",
                            border: isConcluida ? "none" : "2px solid #2a2a2a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem",
                            color: isConcluida ? "#fff" : isAtiva ? "#a5b4fc" : "#4b5563",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {isConcluida ? "✓" : aIdx + 1}
                          </div>
                          <span style={{
                            fontSize: "0.825rem",
                            color: isAtiva ? "#e0e7ff" : isConcluida ? "#6b7280" : "#9ca3af",
                            fontWeight: isAtiva ? 600 : 400,
                            lineHeight: 1.35,
                          }}>
                            {a.titulo}
                          </span>
                        </Link>
                      ) : (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.75rem 1rem",
                          borderLeft: "3px solid transparent",
                          borderBottom: "1px solid #1a1a1a",
                          opacity: 0.4,
                        }}>
                          <span style={{ fontSize: "0.75rem" }}>🔒</span>
                          <span style={{ fontSize: "0.825rem", color: "#6b7280" }}>{a.titulo}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </aside>

        {/* Conteúdo principal */}
        <main style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
          <LessonPlayer
            userId={user.id}
            produtoId={produtoData.id}
            aulaId={aulaId}
            aulaAtual={{
              titulo: aulaAtual.titulo,
              descricao: aulaAtual.descricao,
              video_url: aulaAtual.video_url,
              duracao_minutos: aulaAtual.duracao_minutos,
            }}
            aulaConcluida={aulaConcluida}
            materiais={materiais ?? []}
            aulaAnterior={aulaAnterior ? { id: aulaAnterior.id, slug, moduloId: aulaAnterior.moduloId } : null}
            proximaAula={proximaAula ? { id: proximaAula.id, slug, moduloId: proximaAula.moduloId } : null}
          />
        </main>
      </div>
    </div>
  );
}
