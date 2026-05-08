"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminSection, AdminBadge, Skeleton, ConfirmDialog, NoteForm } from "@/components/mundo-mapping/admin-ui";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  niche: string | null;
  status: string | null;
  status_aprovacao: string | null;
  is_verified: boolean | null;
  instagram_handle: string | null;
  instagram_followers: number | null;
  tiktok_handle: string | null;
  tiktok_followers: number | null;
  youtube_handle: string | null;
  youtube_subscribers: number | null;
  twitter_handle: string | null;
  twitter_followers: number | null;
  engagement_rate: number | null;
  created_at: string | null;
};

type LinkRow = { id: string; produto_nome: string; empresa_nome: string; cliques: number; ativo: boolean };
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
    action, target_type: "influenciador", target_id: targetId, details,
  });
}

const APROVACAO_TONE: Record<string, "success" | "warning" | "danger"> = {
  aprovado: "success",
  pendente: "warning",
  reprovado: "danger",
};

export default function AdminInfluenciadorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [comissaoTotal, setComissaoTotal] = useState(0);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNota, setAddingNota] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [
        { data: prof },
        { data: linksData },
        { data: vendasData },
        { data: notasData },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("links_afiliados").select("id, produto_nome, empresa_nome, cliques, ativo").eq("creator_id", id),
        supabase.from("vendas").select("comissao").eq("creator_id", id),
        supabase.from("anotacoes_admin").select("id, texto, autor_email, criado_em").eq("empresa_id", id).order("criado_em", { ascending: false }),
      ]);
      setProfile(prof as Profile | null);
      setLinks((linksData ?? []) as LinkRow[]);
      setComissaoTotal((vendasData ?? []).reduce((s, v) => s + ((v as Record<string, number>).comissao ?? 0), 0));
      setNotas((notasData ?? []) as Nota[]);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleAction(action: string) {
    const supabase = createClient();
    const updates: Record<string, string | boolean> = {};
    if (action === "aprovar") { updates.status_aprovacao = "aprovado"; updates.is_verified = true; }
    else if (action === "reprovar") updates.status_aprovacao = "reprovado";
    else if (action === "ativar") updates.status = "ativo";
    else if (action === "desativar") updates.status = "inativo";

    await supabase.from("profiles").update(updates).eq("id", id);
    setProfile((p) => p ? { ...p, ...updates } as Profile : p);
    await logAction(supabase, action, id);
    setConfirm(null);
  }

  async function handleAddNota(texto: string) {
    setAddingNota(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: nova } = await supabase.from("anotacoes_admin").insert({
      empresa_id: id, texto, autor_email: user?.email ?? null,
    }).select().single();
    if (nova) setNotas((prev) => [nova as Nota, ...prev]);
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
        <p className="text-zinc-500">Influenciador não encontrado.</p>
        <Link className="mt-4 inline-block text-sm text-red-400" href="/mundo-mapping/admin/influenciadores">← Voltar</Link>
      </div>
    );
  }

  const ativo = (profile.status ?? "ativo") === "ativo";
  const aprovacao = profile.status_aprovacao ?? "pendente";
  const totalCliques = links.reduce((s, l) => s + l.cliques, 0);

  return (
    <div className="space-y-6 p-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <Link className="mb-2 inline-block text-xs text-zinc-600 hover:text-zinc-400" href="/mundo-mapping/admin/influenciadores">
            ← Influenciadores
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{profile.full_name ?? "Creator"}</h1>
          <p className="mt-1 text-sm text-zinc-500">{profile.email}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AdminBadge label={aprovacao.charAt(0).toUpperCase() + aprovacao.slice(1)} tone={APROVACAO_TONE[aprovacao] ?? "neutral"} />
          <AdminBadge label={ativo ? "Ativo" : "Inativo"} tone={ativo ? "success" : "danger"} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Links ativos", value: String(links.filter(l => l.ativo).length) },
          { label: "Cliques totais", value: totalCliques.toLocaleString("pt-BR") },
          { label: "Comissão acumulada", value: fmtBRL(comissaoTotal) },
          { label: "Nicho", value: profile.niche ?? "—" },
        ].map((item) => (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4" key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2.5">
        {aprovacao === "pendente" && (
          <button
            className="rounded-xl border border-emerald-900/60 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-950/30"
            onClick={() => setConfirm("aprovar")}
            type="button"
          >
            Aprovar cadastro
          </button>
        )}
        {aprovacao !== "reprovado" && (
          <button
            className="rounded-xl border border-red-900/60 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-950/30"
            onClick={() => setConfirm(aprovacao === "pendente" ? "reprovar" : (ativo ? "desativar" : "ativar"))}
            type="button"
          >
            {aprovacao === "pendente" ? "Reprovar" : (ativo ? "Desativar conta" : "Ativar conta")}
          </button>
        )}
      </div>

      {/* Social */}
      <AdminSection subtitle="Métricas de audiência declaradas pelo creator." title="Redes sociais">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { platform: "Instagram", handle: profile.instagram_handle, followers: profile.instagram_followers },
            { platform: "TikTok", handle: profile.tiktok_handle, followers: profile.tiktok_followers },
            { platform: "YouTube", handle: profile.youtube_handle, followers: profile.youtube_subscribers },
            { platform: "Twitter/X", handle: profile.twitter_handle, followers: profile.twitter_followers },
          ].map((s) => (
            <div className="rounded-xl border border-zinc-800 px-4 py-3" key={s.platform}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">{s.platform}</p>
              <p className="mt-1 text-sm text-zinc-300">{s.handle ? `@${s.handle}` : "—"}</p>
              {s.followers && (
                <p className="text-xs text-zinc-500">{s.followers.toLocaleString("pt-BR")} seguidores</p>
              )}
            </div>
          ))}
        </div>
        {profile.engagement_rate && (
          <p className="mt-3 text-xs text-zinc-500">Taxa de engajamento média: {profile.engagement_rate}%</p>
        )}
      </AdminSection>

      {/* Links */}
      <AdminSection subtitle={`${links.length} links gerados.`} title="Links de afiliado">
        {links.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-600">Nenhum link gerado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="pb-3">Produto</th>
                  <th className="pb-3">Empresa</th>
                  <th className="pb-3 text-right">Cliques</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {links.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 text-zinc-300">{l.produto_nome}</td>
                    <td className="py-2.5 text-zinc-400">{l.empresa_nome || "—"}</td>
                    <td className="py-2.5 text-right font-semibold text-zinc-300">{l.cliques.toLocaleString("pt-BR")}</td>
                    <td className="py-2.5"><AdminBadge label={l.ativo ? "Ativo" : "Inativo"} tone={l.ativo ? "success" : "neutral"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      {/* Notas */}
      <AdminSection subtitle="Visíveis apenas para o time admin." title="Anotações internas">
        <NoteForm loading={addingNota} onAdd={handleAddNota} />
        {notas.length > 0 && (
          <div className="mt-4 space-y-3">
            {notas.map((nota) => (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3" key={nota.id}>
                <div>
                  <p className="text-sm text-zinc-300">{nota.texto}</p>
                  <p className="mt-1 text-xs text-zinc-600">{nota.autor_email ?? "admin"} · {new Date(nota.criado_em).toLocaleDateString("pt-BR")}</p>
                </div>
                <button className="shrink-0 text-xs text-zinc-700 hover:text-red-400 transition" onClick={() => handleDeleteNota(nota.id)} type="button">Remover</button>
              </div>
            ))}
          </div>
        )}
      </AdminSection>

      {confirm && (
        <ConfirmDialog
          danger={["desativar", "reprovar"].includes(confirm)}
          message={`Tem certeza que deseja ${confirm} este influenciador?`}
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleAction(confirm)}
          title={`${confirm.charAt(0).toUpperCase() + confirm.slice(1)} influenciador`}
        />
      )}
    </div>
  );
}
