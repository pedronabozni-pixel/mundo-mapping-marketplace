"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AdminSection, AdminBadge, PlanBadge, Skeleton, ConfirmDialog, PlanModal, NoteForm,
} from "@/components/mundo-mapping/admin-ui";

type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  plano: string | null;
  status: string | null;
  created_at: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
};

type LinkRow = { id: string; creator_nome: string; produto_nome: string; cliques: number; ativo: boolean; criado_em: string };
type VendaRow = { id: string; creator_nome: string | null; produto_nome: string | null; comissao: number; status: string | null; criado_em: string };
type Nota = { id: string; texto: string; autor_email: string | null; criado_em: string };

function fmtBRL(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

async function logAction(
  supabase: ReturnType<typeof createClient>,
  action: string,
  targetId: string,
  details?: Record<string, unknown>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("admin_actions").insert({
    admin_id: user.id, admin_email: user.email,
    action, target_type: "empresa", target_id: targetId, details,
  });
}

export default function AdminEmpresaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [vendas, setVendas] = useState<VendaRow[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNota, setAddingNota] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [confirm, setConfirm] = useState<"ativar" | "desativar" | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [
        { data: prof },
        { data: linksData },
        { data: vendasData },
        { data: notasData },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, company_name, email, plano, status, created_at, phone, city, state").eq("id", id).single(),
        supabase.from("links_afiliados").select("id, creator_nome, produto_nome, cliques, ativo, criado_em").eq("empresa_id", id).order("criado_em", { ascending: false }).limit(20),
        supabase.from("vendas").select("id, creator_nome, produto_nome, comissao, status, criado_em").eq("empresa_id", id).order("criado_em", { ascending: false }).limit(20),
        supabase.from("anotacoes_admin").select("id, texto, autor_email, criado_em").eq("empresa_id", id).order("criado_em", { ascending: false }),
      ]);
      setProfile(prof as Profile | null);
      setLinks((linksData ?? []) as LinkRow[]);
      setVendas((vendasData ?? []) as VendaRow[]);
      setNotas((notasData ?? []) as Nota[]);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleToggleStatus(action: "ativar" | "desativar") {
    const supabase = createClient();
    const newStatus = action === "ativar" ? "ativo" : "inativo";
    await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
    setProfile((p) => p ? { ...p, status: newStatus } : p);
    await logAction(supabase, `status_${newStatus}`, id);
    setConfirm(null);
  }

  async function handlePlanSave(plan: string) {
    const supabase = createClient();
    await supabase.from("profiles").update({ plano: plan }).eq("id", id);
    await logAction(supabase, "plano_alterado", id, { plano_anterior: profile?.plano, plano_novo: plan });
    setProfile((p) => p ? { ...p, plano: plan } : p);
    setPlanModal(false);
  }

  async function handleAddNota(texto: string) {
    setAddingNota(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: nova } = await supabase.from("anotacoes_admin").insert({
      empresa_id: id, texto, autor_email: user?.email ?? null,
    }).select().single();
    if (nova) setNotas((prev) => [nova as Nota, ...prev]);
    await logAction(supabase, "nota_adicionada", id);
    setAddingNota(false);
  }

  async function handleDeleteNota(notaId: string) {
    const supabase = createClient();
    await supabase.from("anotacoes_admin").delete().eq("id", notaId);
    setNotas((prev) => prev.filter((n) => n.id !== notaId));
  }

  if (loading) {
    return (
      <div className="space-y-6 p-7">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0,1,2].map(i => <Skeleton className="h-24" key={i} />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-7">
        <p className="text-[#888]">Empresa não encontrada.</p>
        <Link className="mt-4 inline-block text-sm text-[#C8102E] hover:text-[#A30D24]" href="/mundo-mapping/admin/empresas">← Voltar</Link>
      </div>
    );
  }

  const ativo = (profile.status ?? "ativo") === "ativo";
  const totalComissao = vendas.reduce((s, v) => s + (v.comissao ?? 0), 0);

  return (
    <div className="space-y-6 p-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <Link className="mb-2 inline-block text-xs text-[#555] hover:text-[#888]" href="/mundo-mapping/admin/empresas">
            ← Empresas
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {profile.company_name ?? profile.full_name ?? "Empresa"}
          </h1>
          <p className="mt-1 text-sm text-[#888]">{profile.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <PlanBadge plano={profile.plano} />
          <AdminBadge label={ativo ? "Ativo" : "Inativo"} tone={ativo ? "success" : "danger"} />
        </div>
      </div>

      {/* Info + actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#555]">Cadastro</p>
          <p className="mt-2 text-sm text-[#aaa]">{profile.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "—"}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#555]">Comissão gerada</p>
          <p className="mt-2 text-sm font-semibold text-white">{fmtBRL(totalComissao)}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#555]">Localização</p>
          <p className="mt-2 text-sm text-[#aaa]">{[profile.city, profile.state].filter(Boolean).join(", ") || "—"}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2.5">
        <button
          className="rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#888] transition hover:border-[rgba(255,255,255,0.12)] hover:text-white"
          onClick={() => setPlanModal(true)}
          type="button"
        >
          Editar plano
        </button>
        <button
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
            ativo
              ? "border-[rgba(200,16,46,0.15)] text-[#C8102E] hover:bg-[rgba(200,16,46,0.18)]"
              : "border-[rgba(74,222,128,0.2)] text-[#4ADE80] hover:bg-[rgba(74,222,128,0.18)]"
          }`}
          onClick={() => setConfirm(ativo ? "desativar" : "ativar")}
          type="button"
        >
          {ativo ? "Desativar conta" : "Ativar conta"}
        </button>
      </div>

      {/* Creators afiliados */}
      <AdminSection subtitle={`${links.length} links gerados para produtos desta empresa.`} title="Creators afiliados">
        {links.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#555]">Nenhum creator afiliado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs font-semibold uppercase tracking-[0.1em] text-[#555]">
                  <th className="pb-3">Creator</th>
                  <th className="pb-3">Produto</th>
                  <th className="pb-3 text-right">Cliques</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {links.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 text-[#aaa]">{l.creator_nome || "—"}</td>
                    <td className="py-2.5 text-[#888]">{l.produto_nome}</td>
                    <td className="py-2.5 text-right font-semibold text-[#aaa]">{l.cliques.toLocaleString("pt-BR")}</td>
                    <td className="py-2.5">
                      <AdminBadge label={l.ativo ? "Ativo" : "Inativo"} tone={l.ativo ? "success" : "neutral"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      {/* Vendas */}
      <AdminSection subtitle={`${vendas.length} vendas registradas.`} title="Histórico de vendas">
        {vendas.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#555]">Nenhuma venda registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs font-semibold uppercase tracking-[0.1em] text-[#555]">
                  <th className="pb-3">Produto</th>
                  <th className="pb-3">Creator</th>
                  <th className="pb-3 text-right">Comissão</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {vendas.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 text-[#aaa]">{v.produto_nome ?? "—"}</td>
                    <td className="py-2.5 text-[#888]">{v.creator_nome ?? "—"}</td>
                    <td className="py-2.5 text-right font-semibold text-[#aaa]">{fmtBRL(v.comissao ?? 0)}</td>
                    <td className="py-2.5">
                      <AdminBadge label={v.status ?? "pendente"} tone={v.status === "pago" || v.status === "aprovado" ? "success" : v.status === "revertido" ? "danger" : "warning"} />
                    </td>
                    <td className="py-2.5 text-xs text-[#888]">{new Date(v.criado_em).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      {/* Notas internas */}
      <AdminSection subtitle="Visíveis apenas para o time admin." title="Anotações internas">
        <NoteForm loading={addingNota} onAdd={handleAddNota} />
        {notas.length > 0 && (
          <div className="mt-4 space-y-3">
            {notas.map((nota) => (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3" key={nota.id}>
                <div>
                  <p className="text-sm text-[#aaa]">{nota.texto}</p>
                  <p className="mt-1 text-xs text-[#555]">{nota.autor_email ?? "admin"} · {new Date(nota.criado_em).toLocaleDateString("pt-BR")}</p>
                </div>
                <button
                  className="shrink-0 text-xs text-[#555] transition hover:text-[#C8102E]"
                  onClick={() => handleDeleteNota(nota.id)}
                  type="button"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminSection>

      {planModal && (
        <PlanModal currentPlan={profile.plano} onCancel={() => setPlanModal(false)} onSave={handlePlanSave} />
      )}
      {confirm && (
        <ConfirmDialog
          danger={confirm === "desativar"}
          message={`Tem certeza que deseja ${confirm} a conta desta empresa?`}
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleToggleStatus(confirm)}
          title={confirm === "desativar" ? "Desativar empresa" : "Ativar empresa"}
        />
      )}
    </div>
  );
}
