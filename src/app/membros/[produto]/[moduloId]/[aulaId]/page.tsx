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
    .select("id, titulo, descricao, video_url, duracao_minutos, ordem, modulo_id")
    .eq("id", aulaId)
    .eq("modulo_id", moduloId)
    .maybeSingle();

  if (!aulaAtual) notFound();

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
        id, titulo, ordem, liberado_em
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

  const todasAulas: { id: string; moduloId: string }[] = [];
  for (const mod of modulos ?? []) {
    const sorted = [...(mod.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
    for (const a of sorted) todasAulas.push({ id: a.id, moduloId: mod.id });
  }
  const idx = todasAulas.findIndex((a) => a.id === aulaId);
  const aulaAnterior = idx > 0 ? todasAulas[idx - 1] : null;
  const proximaAula = idx < todasAulas.length - 1 ? todasAulas[idx + 1] : null;

  const agora = new Date();

  return (
    <div className="flex h-screen flex-col bg-[#0f0f0f]">
      {/* Navbar Mapping Partners */}
      <MembrosPlayerNavbar
        voltarHref={`/membros/${slug}`}
        voltarLabel={produtoData.nome}
        titulo={aulaAtual.titulo}
      />

      {/* Layout: sidebar + player */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — tema escuro */}
        <aside className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] bg-[#111] xl:flex">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
              Conteúdo do Curso
            </span>
          </div>

          {(modulos ?? []).map((mod, modIdx) => {
            const aulasOrdenadas = [...(mod.aulas ?? [])].sort(
              (a, b) => a.ordem - b.ordem
            );
            return (
              <div key={mod.id}>
                <div className="border-b border-white/[0.06] bg-[#161616] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
                    Módulo {modIdx + 1}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white/80">{mod.titulo}</p>
                </div>

                {aulasOrdenadas.map((a, aIdx) => {
                  const isAtiva = a.id === aulaId;
                  const isConcluida = progressoMap.get(a.id) === true;
                  const isLiberada =
                    !a.liberado_em || new Date(a.liberado_em) <= agora;

                  if (!isLiberada) {
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 opacity-35"
                      >
                        <span className="text-xs">🔒</span>
                        <span className="text-sm text-white/50">{a.titulo}</span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={a.id}
                      href={`/membros/${slug}/${mod.id}/${a.id}`}
                      className={`flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 transition last:border-b-0 ${
                        isAtiva
                          ? "border-l-2 border-l-red-600 bg-red-600/10"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          isConcluida
                            ? "bg-red-600 text-white"
                            : isAtiva
                            ? "border border-red-500 text-red-400"
                            : "border border-white/20 text-white/30"
                        }`}
                      >
                        {isConcluida ? "✓" : aIdx + 1}
                      </div>
                      <span
                        className={`flex-1 text-sm leading-5 ${
                          isAtiva
                            ? "font-semibold text-white"
                            : isConcluida
                            ? "text-white/35 line-through"
                            : "text-white/60"
                        }`}
                      >
                        {a.titulo}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto">
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
            aulaAnterior={
              aulaAnterior
                ? { id: aulaAnterior.id, slug, moduloId: aulaAnterior.moduloId }
                : null
            }
            proximaAula={
              proximaAula
                ? { id: proximaAula.id, slug, moduloId: proximaAula.moduloId }
                : null
            }
          />
        </main>
      </div>
    </div>
  );
}
