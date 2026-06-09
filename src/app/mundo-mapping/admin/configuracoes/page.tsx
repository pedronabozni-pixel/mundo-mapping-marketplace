"use client";

import { AdminSection } from "@/components/mundo-mapping/admin-ui";

export default function AdminConfiguracoesPage() {
  return (
    <div className="space-y-6 p-7">
      <div className="border-b border-[rgba(255,255,255,0.06)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555]">Admin / Configurações</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Configurações</h1>
      </div>

      <AdminSection subtitle="Parâmetros globais da plataforma." title="Plataforma">
        <div className="space-y-3">
          {[
            { label: "Taxa da plataforma (%)", desc: "Percentual retido pelo Mapping Partners por venda — módulo em implementação." },
            { label: "Janela de garantia padrão (dias)", desc: "Período mínimo antes de liberar comissão para o creator — módulo em implementação." },
            { label: "Score mínimo global", desc: "Score de creator exigido para afiliar-se a qualquer produto — módulo em implementação." },
          ].map((item) => (
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-4" key={item.label}>
              <p className="text-sm font-semibold text-[#aaa]">{item.label}</p>
              <p className="mt-1 text-xs text-[#555]">{item.desc}</p>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection subtitle="Acesso e permissões administrativas." title="Segurança">
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
          <p className="text-sm font-semibold text-[#aaa]">Usuários admin</p>
          <p className="mt-1 text-xs text-[#555]">
            O acesso ao painel admin é controlado pelo campo <code className="text-[#888]">user_type = &apos;admin&apos;</code> na tabela
            <code className="text-[#888]"> profiles</code>. Para promover um usuário, use o SQL Editor do Supabase.
          </p>
        </div>
      </AdminSection>
    </div>
  );
}
