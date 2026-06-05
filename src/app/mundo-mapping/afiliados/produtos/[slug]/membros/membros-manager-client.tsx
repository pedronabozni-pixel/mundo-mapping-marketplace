"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Aula = {
  id: string;
  titulo: string;
  descricao: string | null;
  video_url: string | null;
  duracao_minutos: number | null;
  ordem: number;
  liberado_em: string | null;
};

type Modulo = {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  aulas: Aula[];
};

type Acesso = {
  id: string;
  comprador_email: string;
  comprador_nome: string | null;
  ativo: boolean;
  expira_em: string | null;
  created_at: string;
};

type MaterialDraft = { titulo: string; url: string };

type NovaAulaState = {
  moduloId: string;
  titulo: string;
  videoUrl: string;
  duracao: string;
  liberadoEm: string;
  materiais: MaterialDraft[];
};

type Props = {
  produto: { id: string; slug: string; nome: string; tipo_entregavel: string | null };
  empresaId: string;
  modulosIniciais: Modulo[];
  acessosIniciais: Acesso[];
};

type Tab = "conteudo" | "acessos";

function inferTipo(url: string): string {
  const u = url.toLowerCase();
  if (u.endsWith(".pdf")) return "pdf";
  if (/\.(zip|rar|7z)$/.test(u)) return "arquivo";
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(u)) return "imagem";
  return "link";
}

export default function MembrosManagerClient({ produto, empresaId, modulosIniciais, acessosIniciais }: Props) {
  const [tab, setTab] = useState<Tab>("conteudo");
  const [modulos, setModulos] = useState<Modulo[]>(modulosIniciais);
  const [acessos, setAcessos] = useState<Acesso[]>(acessosIniciais);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [novoModulo, setNovoModulo] = useState("");
  const [novaAula, setNovaAula] = useState<NovaAulaState | null>(null);
  const [novoMaterial, setNovoMaterial] = useState<MaterialDraft>({ titulo: "", url: "" });

  const [novoAcesso, setNovoAcesso] = useState({ email: "", nome: "", expira: "" });

  const supabase = createClient();

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(""), 3000);
  }

  // ── Módulos ────────────────────────────────────────────────────
  async function criarModulo() {
    if (!novoModulo.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("modulos")
      .insert({
        empresa_id: empresaId,
        produto_id: produto.id,
        titulo: novoModulo.trim(),
        ordem: modulos.length,
      })
      .select("id, titulo, descricao, ordem")
      .single();
    setSaving(false);
    if (error) { flash("Erro ao criar módulo."); return; }
    setModulos((prev) => [...prev, { ...data, aulas: [] }]);
    setNovoModulo("");
    flash("Módulo criado!");
  }

  async function excluirModulo(moduloId: string) {
    if (!confirm("Excluir este módulo e todas as suas aulas?")) return;
    const { error } = await supabase.from("modulos").delete().eq("id", moduloId);
    if (error) { flash("Erro ao excluir módulo."); return; }
    setModulos((prev) => prev.filter((m) => m.id !== moduloId));
    flash("Módulo excluído.");
  }

  // ── Aulas ──────────────────────────────────────────────────────
  function addMaterialDraft() {
    if (!novaAula) return;
    if (!novoMaterial.titulo.trim() || !novoMaterial.url.trim()) return;
    setNovaAula({ ...novaAula, materiais: [...novaAula.materiais, { ...novoMaterial }] });
    setNovoMaterial({ titulo: "", url: "" });
  }

  function removeMaterialDraft(idx: number) {
    if (!novaAula) return;
    setNovaAula({ ...novaAula, materiais: novaAula.materiais.filter((_, i) => i !== idx) });
  }

  async function criarAula() {
    if (!novaAula || !novaAula.titulo.trim()) return;
    setSaving(true);
    const modulo = modulos.find((m) => m.id === novaAula.moduloId);
    const { data, error } = await supabase
      .from("aulas")
      .insert({
        empresa_id: empresaId,
        modulo_id: novaAula.moduloId,
        produto_id: produto.id,
        titulo: novaAula.titulo.trim(),
        video_url: novaAula.videoUrl.trim() || null,
        duracao_minutos: novaAula.duracao ? parseInt(novaAula.duracao) : null,
        liberado_em: novaAula.liberadoEm || null,
        ordem: (modulo?.aulas?.length ?? 0),
      })
      .select("id, titulo, descricao, video_url, duracao_minutos, ordem, liberado_em")
      .single();

    if (error || !data) { setSaving(false); flash("Erro ao criar aula."); return; }

    // Insere materiais (se houver)
    if (novaAula.materiais.length > 0) {
      const rows = novaAula.materiais.map((mat) => ({
        empresa_id: empresaId,
        aula_id: data.id,
        titulo: mat.titulo.trim(),
        url: mat.url.trim(),
        tipo: inferTipo(mat.url),
      }));
      const { error: matError } = await supabase.from("materiais_aula").insert(rows);
      if (matError) flash("Aula criada, mas houve erro ao salvar materiais.");
    }

    setSaving(false);
    setModulos((prev) =>
      prev.map((m) =>
        m.id === novaAula.moduloId ? { ...m, aulas: [...m.aulas, data] } : m
      )
    );
    setNovaAula(null);
    setNovoMaterial({ titulo: "", url: "" });
    flash("Aula criada!");
  }

  async function excluirAula(moduloId: string, aulaId: string) {
    if (!confirm("Excluir esta aula?")) return;
    const { error } = await supabase.from("aulas").delete().eq("id", aulaId);
    if (error) { flash("Erro ao excluir aula."); return; }
    setModulos((prev) =>
      prev.map((m) =>
        m.id === moduloId ? { ...m, aulas: m.aulas.filter((a) => a.id !== aulaId) } : m
      )
    );
    flash("Aula excluída.");
  }

  // ── Acessos ────────────────────────────────────────────────────
  async function concederAcesso() {
    if (!novoAcesso.email.trim()) return;
    setSaving(true);
    const res = await fetch("/api/membros/acesso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produto_id: produto.id,
        comprador_email: novoAcesso.email.trim(),
        comprador_nome: novoAcesso.nome.trim() || null,
        expira_em: novoAcesso.expira || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { flash("Erro ao conceder acesso."); return; }
    setNovoAcesso({ email: "", nome: "", expira: "" });
    const { data } = await supabase
      .from("acessos_membros")
      .select("id, comprador_email, comprador_nome, ativo, expira_em, created_at")
      .eq("produto_id", produto.id)
      .order("created_at", { ascending: false });
    setAcessos(data ?? []);
    flash("Acesso concedido!");
  }

  async function revogarAcesso(email: string) {
    if (!confirm(`Revogar acesso de ${email}?`)) return;
    const res = await fetch("/api/membros/acesso", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produto_id: produto.id, comprador_email: email }),
    });
    if (!res.ok) { flash("Erro ao revogar acesso."); return; }
    setAcessos((prev) =>
      prev.map((a) => a.comprador_email === email ? { ...a, ativo: false } : a)
    );
    flash("Acesso revogado.");
  }

  const s = styles;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <a href={`/mundo-mapping/afiliados/produtos/${produto.slug}`} style={s.back}>
            ← {produto.nome}
          </a>
          <h1 style={s.headerTitle}>Área de Membros</h1>
        </div>
      </header>

      <main style={s.main}>
        {msg && <div style={s.flash}>{msg}</div>}

        {/* Tabs */}
        <div style={s.tabs}>
          {(["conteudo", "acessos"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              ...s.tab,
              background: tab === t ? "#C8102E" : "transparent",
              color: tab === t ? "#fff" : "#888",
              borderColor: tab === t ? "#C8102E" : "rgba(255,255,255,0.08)",
            }}>
              {t === "conteudo" ? "📚 Conteúdo" : "👥 Acessos"}
            </button>
          ))}
        </div>

        {/* ── TAB CONTEÚDO ── */}
        {tab === "conteudo" && (
          <div>
            {/* Novo módulo */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Novo Módulo</h2>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <input
                  value={novoModulo}
                  onChange={(e) => setNovoModulo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && criarModulo()}
                  placeholder="Título do módulo"
                  style={s.input}
                />
                <button onClick={criarModulo} disabled={saving} style={s.btnPrimary}>
                  + Adicionar
                </button>
              </div>
            </div>

            {/* Lista de módulos */}
            {modulos.length === 0 ? (
              <div style={s.empty}>Nenhum módulo criado ainda.</div>
            ) : (
              modulos
                .sort((a, b) => a.ordem - b.ordem)
                .map((mod, modIdx) => {
                  const isExp = expandido === mod.id;
                  const aulasOrdenadas = [...mod.aulas].sort((a, b) => a.ordem - b.ordem);
                  return (
                    <div key={mod.id} style={s.card}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isExp ? "1rem" : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <button
                            onClick={() => setExpandido(isExp ? null : mod.id)}
                            style={{
                              ...s.btnIcon,
                              transform: isExp ? "rotate(90deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                            }}
                          >
                            ▶
                          </button>
                          <div>
                            <span style={{ color: "#555", fontSize: "0.7rem", fontWeight: 600 }}>MÓDULO {modIdx + 1}</span>
                            <p style={{ fontWeight: 700, color: "#fff", margin: 0, fontSize: "0.95rem" }}>{mod.titulo}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <span style={{ color: "#555", fontSize: "0.8rem", alignSelf: "center" }}>
                            {mod.aulas.length} aula{mod.aulas.length !== 1 ? "s" : ""}
                          </span>
                          <button
                            onClick={() => excluirModulo(mod.id)}
                            style={{ ...s.btnDanger, fontSize: "0.75rem" }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>

                      {isExp && (
                        <div>
                          {aulasOrdenadas.map((aula, aulaIdx) => (
                            <div key={aula.id} style={s.aulaRow}>
                              <div style={{ flex: 1 }}>
                                <span style={{ color: "#555", fontSize: "0.75rem" }}>{aulaIdx + 1}. </span>
                                <span style={{ color: "#e5e7eb", fontSize: "0.875rem", fontWeight: 600 }}>{aula.titulo}</span>
                                {aula.video_url && <span style={{ color: "#666", fontSize: "0.75rem", marginLeft: "0.5rem" }}>🎬 com vídeo</span>}
                                {aula.duracao_minutos && <span style={{ color: "#666", fontSize: "0.75rem", marginLeft: "0.5rem" }}>⏱ {aula.duracao_minutos}min</span>}
                                {aula.liberado_em && (
                                  <span style={{ color: "#FBBF24", background: "rgba(251,191,36,0.1)", borderRadius: "4px", fontSize: "0.7rem", padding: "0.1rem 0.4rem", marginLeft: "0.5rem" }}>
                                    Drip: {new Date(aula.liberado_em).toLocaleDateString("pt-BR")}
                                  </span>
                                )}
                              </div>
                              <button onClick={() => excluirAula(mod.id, aula.id)} style={s.btnDanger}>✕</button>
                            </div>
                          ))}

                          {/* Nova aula neste módulo */}
                          {novaAula?.moduloId === mod.id ? (
                            <div style={{ ...s.aulaRow, flexDirection: "column", alignItems: "stretch", gap: "0.75rem", background: "rgba(255,255,255,0.03)" }}>
                              <input
                                value={novaAula.titulo}
                                onChange={(e) => setNovaAula({ ...novaAula, titulo: e.target.value })}
                                placeholder="Título da aula"
                                style={s.input}
                                autoFocus
                              />
                              <input
                                value={novaAula.videoUrl}
                                onChange={(e) => setNovaAula({ ...novaAula, videoUrl: e.target.value })}
                                placeholder="URL do vídeo (YouTube, Vimeo)"
                                style={s.input}
                              />
                              <div style={{ display: "flex", gap: "0.75rem" }}>
                                <input
                                  type="number"
                                  value={novaAula.duracao}
                                  onChange={(e) => setNovaAula({ ...novaAula, duracao: e.target.value })}
                                  placeholder="Duração (min)"
                                  style={{ ...s.input, maxWidth: "150px" }}
                                />
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>
                                    Liberar em (drip — deixe em branco para liberar agora)
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={novaAula.liberadoEm}
                                    onChange={(e) => setNovaAula({ ...novaAula, liberadoEm: e.target.value })}
                                    style={s.input}
                                  />
                                </div>
                              </div>

                              {/* Sub-formulário: materiais */}
                              <div style={s.materiaisBox}>
                                <p style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600, margin: "0 0 0.5rem" }}>
                                  Materiais da aula (opcional)
                                </p>

                                {novaAula.materiais.length > 0 && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.6rem" }}>
                                    {novaAula.materiais.map((mat, i) => (
                                      <div key={i} style={s.materialRow}>
                                        <span style={{ flex: 1, color: "#e5e7eb", fontSize: "0.8rem" }}>
                                          {mat.titulo}
                                          <span style={{ color: "#555", marginLeft: "0.4rem" }}>{mat.url}</span>
                                        </span>
                                        <button onClick={() => removeMaterialDraft(i)} style={s.btnDanger}>✕</button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                  <input
                                    value={novoMaterial.titulo}
                                    onChange={(e) => setNovoMaterial({ ...novoMaterial, titulo: e.target.value })}
                                    placeholder="Título do material"
                                    style={{ ...s.input, flex: 1, minWidth: "140px" }}
                                  />
                                  <input
                                    value={novoMaterial.url}
                                    onChange={(e) => setNovoMaterial({ ...novoMaterial, url: e.target.value })}
                                    placeholder="URL (PDF, link…)"
                                    style={{ ...s.input, flex: 1, minWidth: "140px" }}
                                  />
                                  <button onClick={addMaterialDraft} style={s.btnSecondary} type="button">
                                    + Material
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button onClick={criarAula} disabled={saving} style={s.btnPrimary}>Salvar aula</button>
                                <button onClick={() => { setNovaAula(null); setNovoMaterial({ titulo: "", url: "" }); }} style={s.btnSecondary}>Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setNovaAula({ moduloId: mod.id, titulo: "", videoUrl: "", duracao: "", liberadoEm: "", materiais: [] })}
                              style={s.btnAddAula}
                            >
                              + Nova aula
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* ── TAB ACESSOS ── */}
        {tab === "acessos" && (
          <div>
            {/* Conceder acesso manual */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Conceder Acesso Manual</h2>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <input
                  type="email"
                  value={novoAcesso.email}
                  onChange={(e) => setNovoAcesso({ ...novoAcesso, email: e.target.value })}
                  placeholder="E-mail do aluno"
                  style={{ ...s.input, flex: 2, minWidth: "200px" }}
                />
                <input
                  value={novoAcesso.nome}
                  onChange={(e) => setNovoAcesso({ ...novoAcesso, nome: e.target.value })}
                  placeholder="Nome (opcional)"
                  style={{ ...s.input, flex: 1, minWidth: "150px" }}
                />
                <input
                  type="date"
                  value={novoAcesso.expira}
                  onChange={(e) => setNovoAcesso({ ...novoAcesso, expira: e.target.value })}
                  title="Data de expiração (opcional)"
                  style={{ ...s.input, maxWidth: "160px" }}
                />
                <button onClick={concederAcesso} disabled={saving} style={s.btnPrimary}>
                  Conceder
                </button>
              </div>
              <p style={{ color: "#555", fontSize: "0.775rem", marginTop: "0.5rem" }}>
                O aluno precisará se cadastrar em /membros com este e-mail para acessar o curso.
              </p>
            </div>

            {/* Lista de acessos */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>
                Alunos com Acesso
                <span style={{ fontWeight: 400, color: "#888", marginLeft: "0.5rem", fontSize: "0.875rem" }}>
                  ({acessos.filter((a) => a.ativo).length} ativos)
                </span>
              </h2>

              {acessos.length === 0 ? (
                <div style={s.empty}>Nenhum acesso concedido ainda.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {acessos.map((acesso) => (
                    <div key={acesso.id} style={{
                      ...s.aulaRow,
                      opacity: acesso.ativo ? 1 : 0.5,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, color: "#e5e7eb", fontSize: "0.875rem" }}>
                          {acesso.comprador_nome || acesso.comprador_email}
                        </span>
                        {acesso.comprador_nome && (
                          <span style={{ color: "#555", fontSize: "0.775rem", marginLeft: "0.5rem" }}>
                            {acesso.comprador_email}
                          </span>
                        )}
                        {acesso.expira_em && (
                          <span style={{ color: "#FBBF24", background: "rgba(251,191,36,0.1)", borderRadius: "4px", fontSize: "0.7rem", padding: "0.1rem 0.4rem", marginLeft: "0.5rem" }}>
                            expira {new Date(acesso.expira_em).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: acesso.ativo ? "#4ADE80" : "#888",
                        background: acesso.ativo ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)",
                        borderRadius: "6px",
                        padding: "0.2rem 0.6rem",
                      }}>
                        {acesso.ativo ? "Ativo" : "Revogado"}
                      </span>
                      {acesso.ativo && (
                        <button onClick={() => revogarAcesso(acesso.comprador_email)} style={s.btnDanger}>
                          Revogar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fff",
  },
  header: {
    background: "#060606",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    padding: "1rem 2rem",
  },
  headerInner: {
    maxWidth: "960px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  back: {
    color: "#888",
    textDecoration: "none",
    fontSize: "0.875rem",
  },
  headerTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    margin: 0,
  },
  main: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
  },
  flash: {
    background: "rgba(200,16,46,0.08)",
    border: "1px solid rgba(200,16,46,0.2)",
    color: "#C8102E",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  tab: {
    border: "1px solid",
    borderRadius: "8px",
    padding: "0.5rem 1.25rem",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    transition: "all 0.15s",
  },
  card: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "0.975rem",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#e5e7eb",
  },
  input: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    padding: "0.6rem 0.875rem",
    color: "#fff",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  btnPrimary: {
    background: "#C8102E",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem 1.25rem",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.875rem",
    whiteSpace: "nowrap" as const,
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.04)",
    color: "#888",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    padding: "0.6rem 1.25rem",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  btnDanger: {
    background: "rgba(200,16,46,0.08)",
    color: "#C8102E",
    border: "1px solid rgba(200,16,46,0.2)",
    borderRadius: "6px",
    padding: "0.3rem 0.7rem",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  btnIcon: {
    background: "transparent",
    border: "none",
    color: "#888",
    cursor: "pointer",
    fontSize: "0.7rem",
    padding: "0.25rem",
  },
  btnAddAula: {
    marginTop: "0.75rem",
    background: "rgba(255,255,255,0.03)",
    border: "1px dashed rgba(255,255,255,0.08)",
    color: "#C8102E",
    borderRadius: "8px",
    padding: "0.6rem 1rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    width: "100%",
  },
  aulaRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.6rem 0.75rem",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "8px",
    marginBottom: "0.4rem",
  },
  materiaisBox: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    padding: "0.75rem",
  },
  materialRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.4rem 0.6rem",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "6px",
  },
  empty: {
    color: "#555",
    textAlign: "center" as const,
    padding: "1.5rem",
    fontSize: "0.875rem",
  },
};
