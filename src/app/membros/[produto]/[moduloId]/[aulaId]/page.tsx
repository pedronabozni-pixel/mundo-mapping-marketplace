import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LessonPlayer from "./lesson-player";
import { MembrosPlayerNavbar } from "@/components/mundo-mapping/membros-shell";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ produto: string; moduloId: string; aulaId: string }>;
};

export default async function AulaPage({ params }: Props) {
  const { produto: slug, moduloId, aulaId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/membros");

  const { data: produtoData } = await supabase
    .from("produtos")
    .select("id, slug, nome")
    .eq("slug", slug)
    .maybeSingle();

  if (!produtoData) notFound();

  const { data: acesso } = await supabase
    .from("acessos_membros")
    .select("id")
    .eq("produto_id", produtoData.id)
    .eq("comprador_email", user.email!)
    .eq("ativo", true)
    .maybeSingle();

  if (!acesso) redirect("/membros/cursos");

  const { data: aulaAtual } = await supabase
    .from("aulas")
    .select("id, titulo, descricao, video_url, duracao_minutos, ordem, modulo_id, liberado_em")
    .eq("id", aulaId)
    .eq("modulo_id", moduloId)
    .maybeSingle();

  if (!aulaAtual) notFound();

  // Drip: aula bloqueada → volta para o detalhe do curso
  const agora = new Date();
  if (aulaAtual.liberado_em && new Date(aulaAtual.liberado_em) > agora) {
    redirect(`/membros/${slug}`);
  }

  const { data: materiais } = await supabase
    .from("materiais_aula")
    .select("id, titulo, url, tipo")
    .eq("aula_id", aulaId)
    .order("titulo");

  const { data: modulos } = await supabase
    .from("modulos")
    .select(`
      id, titulo, ordem,
      aulas (
        id, titulo, ordem, liberado_em, duracao_minutos
      )
    `)
    .eq("produto_id", produtoData.id)
    .order("ordem");

  const { data: progressoData } = await supabase
    .from("progresso_aulas")
    .select("aula_id, concluida")
    .eq("user_id", user.id)
    .eq("produto_id", produtoData.id);

  const progressoMap = new Map(
    (progressoData ?? []).map((p) => [p.aula_id, p.concluida])
  );

  const aulaConcluida = progressoMap.get(aulaId) === true;

  // Índice global de aulas (para navegação) + nº do módulo/aula para o eyebrow
  const todasAulas: { id: string; moduloId: string }[] = [];
  let moduloNum = 0;
  let aulaNum = 0;
  const modulosSorted = [...(modulos ?? [])].sort((a, b) => a.ordem - b.ordem);
  modulosSorted.forEach((mod, mIdx) => {
    const sorted = [...(mod.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
    sorted.forEach((a, aIdx) => {
      todasAulas.push({ id: a.id, moduloId: mod.id });
      if (a.id === aulaId) {
        moduloNum = mIdx + 1;
        aulaNum = aIdx + 1;
      }
    });
  });
  const idx = todasAulas.findIndex((a) => a.id === aulaId);
  const aulaAnterior = idx > 0 ? todasAulas[idx - 1] : null;
  const proximaAula = idx < todasAulas.length - 1 ? todasAulas[idx + 1] : null;

  // Progresso geral
  const totalAulas = todasAulas.length;
  const concluidasCount = Array.from(progressoMap.values()).filter(Boolean).length;
  const percentual = totalAulas > 0 ? Math.round((concluidasCount / totalAulas) * 100) : 0;

  return (
    <div className="flex h-screen flex-col" style={{ background: "#0a0a0a" }}>
      <MembrosPlayerNavbar
        voltarHref={`/membros/${slug}`}
        voltarLabel={produtoData.nome}
        titulo={aulaAtual.titulo}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto">
          <LessonPlayer
            userId={user.id}
            produtoId={produtoData.id}
            aulaId={aulaId}
            moduloNum={moduloNum}
            aulaNum={aulaNum}
            aulaAtual={{
              titulo: aulaAtual.titulo,
              descricao: aulaAtual.descricao,
              video_url: aulaAtual.video_url,
              duracao_minutos: aulaAtual.duracao_minutos,
            }}
            aulaConcluida={aulaConcluida}
            materiais={materiais ?? []}
            aulaAnterior={
              aulaAnterior ? { id: aulaAnterior.id, slug, moduloId: aulaAnterior.moduloId } : null
            }
            proximaAula={
              proximaAula ? { id: proximaAula.id, slug, moduloId: proximaAula.moduloId } : null
            }
          />
        </main>

        {/* Sidebar de navegação — dark */}
        <aside
          className="hidden w-[320px] shrink-0 flex-col overflow-y-auto xl:flex"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", background: "#060606" }}
        >
          <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#555" }}>
              Conteúdo do curso
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span style={{ color: "#888" }}>{concluidasCount} de {totalAulas} aulas</span>
              <span className="font-semibold" style={{ color: percentual === 100 ? "#4ADE80" : "#C8102E" }}>{percentual}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentual}%`, background: percentual === 100 ? "#4ADE80" : "#C8102E" }}
              />
            </div>
          </div>

          {modulosSorted.map((mod, modIdx) => {
            const aulasOrdenadas = [...(mod.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
            return (
              <div key={mod.id}>
                <div
                  className="px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#555" }}>
                    Módulo {modIdx + 1}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{mod.titulo}</p>
                </div>

                {aulasOrdenadas.map((a, aIdx) => {
                  const isAtiva = a.id === aulaId;
                  const isConcluida = progressoMap.get(a.id) === true;
                  const isLiberada = !a.liberado_em || new Date(a.liberado_em) <= agora;

                  if (!isLiberada) {
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: 0.4 }}
                      >
                        <span className="text-xs">🔒</span>
                        <span className="text-sm" style={{ color: "#888" }}>{a.titulo}</span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={a.id}
                      href={`/membros/${slug}/${mod.id}/${a.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition last:border-b-0"
                      style={
                        isAtiva
                          ? { borderBottom: "1px solid rgba(255,255,255,0.04)", borderLeft: "2px solid #C8102E", background: "rgba(200,16,46,0.08)" }
                          : { borderBottom: "1px solid rgba(255,255,255,0.04)" }
                      }
                    >
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={
                          isConcluida
                            ? { background: "rgba(74,222,128,0.15)", color: "#4ADE80" }
                            : isAtiva
                              ? { background: "rgba(200,16,46,0.15)", color: "#C8102E" }
                              : { border: "1px solid rgba(255,255,255,0.15)", color: "#555" }
                        }
                      >
                        {isConcluida ? "✓" : isAtiva ? "▶" : aIdx + 1}
                      </div>
                      <span
                        className="flex-1 text-sm leading-5"
                        style={{
                          color: isAtiva ? "#fff" : isConcluida ? "#555" : "#888",
                          fontWeight: isAtiva ? 600 : 400,
                          textDecoration: isConcluida ? "line-through" : "none",
                        }}
                      >
                        {a.titulo}
                      </span>
                      {a.duracao_minutos && !isConcluida && (
                        <span className="text-[11px]" style={{ color: "#555" }}>{a.duracao_minutos}min</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
