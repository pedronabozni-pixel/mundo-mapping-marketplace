import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ produto: string }>;
};

export default async function CursoOverviewPage({ params }: Props) {
  const { produto: slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/membros");

  // Verifica se o produto existe e o membro tem acesso
  const { data: produtoData } = await supabase
    .from("produtos")
    .select("id, slug, nome, capa_url, checkout_headline, checkout_subheadline")
    .eq("slug", slug)
    .maybeSingle();

  if (!produtoData) notFound();

  const { data: acesso } = await supabase
    .from("acessos_membros")
    .select("id, expira_em")
    .eq("produto_id", produtoData.id)
    .eq("comprador_email", user.email!)
    .eq("ativo", true)
    .maybeSingle();

  if (!acesso) {
    redirect("/membros/cursos");
  }

  // Busca módulos com aulas
  const { data: modulos } = await supabase
    .from("modulos")
    .select(`
      id, titulo, descricao, ordem,
      aulas (
        id, titulo, duracao_minutos, ordem, liberado_em
      )
    `)
    .eq("produto_id", produtoData.id)
    .order("ordem");

  // Busca progresso do usuário
  const { data: progressoData } = await supabase
    .from("progresso_aulas")
    .select("aula_id, concluida")
    .eq("user_id", user.id)
    .eq("produto_id", produtoData.id);

  const progressoMap = new Map(
    (progressoData ?? []).map((p) => [p.aula_id, p.concluida])
  );

  const totalAulas = modulos?.reduce((acc, m) => acc + (m.aulas?.length ?? 0), 0) ?? 0;
  const concluidas = Array.from(progressoMap.values()).filter(Boolean).length;
  const percentual = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;

  // Primeira aula não concluída para o botão "Continuar"
  let primeiraAulaPendente: { produto: string; moduloId: string; aulaId: string } | null = null;
  outer: for (const mod of modulos ?? []) {
    for (const aula of (mod.aulas ?? [])) {
      if (!progressoMap.get(aula.id)) {
        primeiraAulaPendente = { produto: slug, moduloId: mod.id, aulaId: aula.id };
        break outer;
      }
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#fff",
    }}>
      <header style={{
        background: "#1a1a1a",
        borderBottom: "1px solid #2a2a2a",
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}>
        <Link href="/membros/cursos" style={{
          color: "#6b7280",
          textDecoration: "none",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}>
          ← Meus Cursos
        </Link>
        <span style={{ color: "#2a2a2a" }}>|</span>
        <span style={{ fontWeight: 700, fontSize: "0.975rem", color: "#fff" }}>
          {produtoData.nome}
        </span>
      </header>

      {/* Hero */}
      <div style={{
        background: produtoData.capa_url
          ? `linear-gradient(to bottom, #0f0f0f00 0%, #0f0f0f 100%), url(${produtoData.capa_url}) center/cover`
          : "linear-gradient(135deg, #1e1b4b, #0f0f0f)",
        padding: "3rem 2rem",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          {produtoData.nome}
        </h1>
        {produtoData.checkout_headline && (
          <p style={{ color: "#9ca3af", maxWidth: "600px", margin: "0 auto 1.5rem" }}>
            {produtoData.checkout_headline}
          </p>
        )}

        {/* Barra de progresso */}
        <div style={{ maxWidth: "400px", margin: "0 auto 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
            <span>{concluidas} de {totalAulas} aulas concluídas</span>
            <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{percentual}%</span>
          </div>
          <div style={{ height: "6px", background: "#2a2a2a", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${percentual}%`,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              borderRadius: "3px",
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>

        {primeiraAulaPendente && (
          <Link
            href={`/membros/${primeiraAulaPendente.produto}/${primeiraAulaPendente.moduloId}/${primeiraAulaPendente.aulaId}`}
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "0.75rem 2rem",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            {concluidas === 0 ? "Começar curso" : "Continuar"}
          </Link>
        )}
        {totalAulas > 0 && concluidas === totalAulas && (
          <div style={{
            display: "inline-block",
            background: "#14532d33",
            border: "1px solid #22c55e44",
            color: "#86efac",
            borderRadius: "10px",
            padding: "0.75rem 2rem",
            fontWeight: 700,
            fontSize: "0.95rem",
          }}>
            ✓ Curso concluído!
          </div>
        )}
      </div>

      {/* Conteúdo do curso */}
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem", color: "#e5e7eb" }}>
          Conteúdo do curso
        </h2>

        {!modulos || modulos.length === 0 ? (
          <div style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
            color: "#6b7280",
          }}>
            As aulas ainda estão sendo preparadas. Em breve!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {modulos.map((mod, modIdx) => {
              const aulasOrdenadas = [...(mod.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
              const aulasConcluidas = aulasOrdenadas.filter((a) => progressoMap.get(a.id)).length;
              return (
                <div key={mod.id} style={{
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "1rem 1.25rem",
                    borderBottom: aulasOrdenadas.length > 0 ? "1px solid #2a2a2a" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <span style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 600 }}>
                        MÓDULO {modIdx + 1}
                      </span>
                      <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "0.975rem", margin: "0.15rem 0 0" }}>
                        {mod.titulo}
                      </h3>
                    </div>
                    <span style={{ color: "#6b7280", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {aulasConcluidas}/{aulasOrdenadas.length} aulas
                    </span>
                  </div>
                  {aulasOrdenadas.map((aula, aulaIdx) => {
                    const concluida = progressoMap.get(aula.id) === true;
                    const agora = new Date();
                    const liberada = !aula.liberado_em || new Date(aula.liberado_em) <= agora;
                    return (
                      <div key={aula.id}>
                        {liberada ? (
                          <Link
                            href={`/membros/${slug}/${mod.id}/${aula.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              padding: "0.875rem 1.25rem",
                              textDecoration: "none",
                              borderBottom: aulaIdx < aulasOrdenadas.length - 1 ? "1px solid #1f1f1f" : "none",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#111")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <div style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              border: concluida ? "none" : "2px solid #2a2a2a",
                              background: concluida ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              fontSize: "0.75rem",
                              color: concluida ? "#fff" : "#6b7280",
                              fontWeight: 700,
                            }}>
                              {concluida ? "✓" : aulaIdx + 1}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{
                                color: concluida ? "#9ca3af" : "#e5e7eb",
                                fontSize: "0.9rem",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}>
                                {aula.titulo}
                              </span>
                            </div>
                            {aula.duracao_minutos && (
                              <span style={{ color: "#4b5563", fontSize: "0.775rem", flexShrink: 0 }}>
                                {aula.duracao_minutos}min
                              </span>
                            )}
                          </Link>
                        ) : (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            padding: "0.875rem 1.25rem",
                            borderBottom: aulaIdx < aulasOrdenadas.length - 1 ? "1px solid #1f1f1f" : "none",
                            opacity: 0.5,
                          }}>
                            <div style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              border: "2px solid #2a2a2a",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.85rem",
                            }}>
                              🔒
                            </div>
                            <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>{aula.titulo}</span>
                            <span style={{ color: "#4b5563", fontSize: "0.75rem", marginLeft: "auto" }}>
                              Disponível {new Date(aula.liberado_em!).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
