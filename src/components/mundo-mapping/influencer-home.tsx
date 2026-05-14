"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart,
  MetricCard,
  SectionCard,
  StatusBadge,
} from "@/components/mundo-mapping/affiliate-ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type DashData = {
  linksAtivos: number;
  totalCliques: number;
  totalVendas: number;
  comissaoAcumulada: number;
};

// ─── Live dashboard (InfluencerHome) ─────────────────────────────────────────

export function InfluencerHome() {
  const [dash, setDash] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: linksData } = await supabase
        .from("links_afiliados")
        .select("cliques, ativo")
        .eq("creator_id", user.id);

      const links = linksData ?? [];
      const linksAtivos = links.filter((l) => l.ativo).length;
      const totalCliques = links.reduce((s, l) => s + (l.cliques ?? 0), 0);

      let totalVendas = 0;
      let comissaoAcumulada = 0;

      // Tabela vendas pode ainda não ter sido criada
      const { data: vendasData } = await supabase
        .from("vendas")
        .select("comissao")
        .eq("creator_id", user.id);

      if (vendasData) {
        totalVendas = vendasData.length;
        comissaoAcumulada = vendasData.reduce((s, v) => s + (v.comissao ?? 0), 0);
      }

      if (!cancelled) {
        setDash({ linksAtivos, totalCliques, totalVendas, comissaoAcumulada });
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  const isEmpty = !dash || (dash.linksAtivos === 0 && dash.totalCliques === 0 && dash.totalVendas === 0);

  return (
    <div className="space-y-6 p-6">
      {/* Hero banner */}
      <section className="rounded-[28px] border border-zinc-200 bg-[linear-gradient(135deg,#1f2937_0%,#b91c1c_100%)] p-7 text-white shadow-[0_26px_80px_-52px_rgba(185,28,28,0.45)]">
        <StatusBadge label="Portal do influenciador" tone="danger" />
        <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight">
          Seu desempenho vem dos seus links. Cada produto aprovado libera um link próprio para vender.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
          Aqui você acompanha cliques, vendas, comissão e materiais — separado do painel da empresa.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950"
            href="/mundo-mapping/influenciadores/shopping"
          >
            Acessar shopping
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white"
            href="/mundo-mapping/influenciadores/meus-links"
          >
            Ver meus links
          </Link>
        </div>
      </section>

      {/* Empty state */}
      {isEmpty && (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Você ainda não tem movimentações.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Acesse o shopping e escolha produtos para divulgar.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
            href="/mundo-mapping/influenciadores/shopping"
          >
            Ir para o shopping
          </Link>
        </section>
      )}

      {/* KPIs */}
      {!isEmpty && dash && (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Links ativos"
              meta="Com código de rastreio"
              value={String(dash.linksAtivos)}
            />
            <MetricCard
              label="Cliques totais"
              meta="Em todos os links"
              value={dash.totalCliques.toLocaleString("pt-BR")}
            />
            <MetricCard
              label="Vendas geradas"
              meta="Rastreadas pela plataforma"
              value={String(dash.totalVendas)}
            />
            <MetricCard
              emphasis
              label="Comissão acumulada"
              meta="Total histórico"
              value={`R$ ${dash.comissaoAcumulada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
            <SectionCard subtitle="Evolução dos cliques nos seus links de afiliado." title="Performance dos links">
              <LineChart />
            </SectionCard>

            <SectionCard subtitle="Regras do modelo de afiliação." title="Como funciona">
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Origem da venda</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    A empresa cadastra o produto. A venda acontece pelo seu link de afiliado exclusivo.
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Comissão</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    A comissão entra como pendente, respeita a janela de garantia e depois fica disponível para saque.
                  </p>
                </div>
                <Link
                  className="inline-flex text-sm font-semibold text-red-700"
                  href="/mundo-mapping/influenciadores/meus-links"
                >
                  Ver meus links →
                </Link>
              </div>
            </SectionCard>
          </section>
        </>
      )}
    </div>
  );
}

// ─── Seções usadas em sub-páginas (dados estáticos / legado) ─────────────────

export function InfluencerLinksSection() {
  return (
    <SectionCard
      action={
        <Link
          className="inline-flex rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          href="/mundo-mapping/influenciadores/meus-links"
        >
          Ver dados reais
        </Link>
      }
      subtitle="Acesse 'Meus links' no menu para ver seus links com dados reais do Supabase."
      title="Meus links de afiliado"
    >
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
        Esta página foi substituída por{" "}
        <Link className="font-semibold text-red-700 underline-offset-2 hover:underline" href="/mundo-mapping/influenciadores/meus-links">
          Meus links
        </Link>
        , que exibe dados reais do Supabase.
      </div>
    </SectionCard>
  );
}

export function InfluencerProductsSection() {
  return (
    <SectionCard
      action={
        <Link
          className="inline-flex rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700"
          href="/mundo-mapping/influenciadores/shopping"
        >
          Buscar produtos
        </Link>
      }
      subtitle="Produtos disponíveis para afiliação."
      title="Produtos afiliados"
    >
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">Você ainda não tem produtos afiliados.</p>
        <p className="mt-2 text-sm text-zinc-500">Acesse o shopping e solicite afiliação aos produtos disponíveis.</p>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
          href="/mundo-mapping/influenciadores/shopping"
        >
          Ir para o shopping
        </Link>
      </div>
    </SectionCard>
  );
}

export function InfluencerMaterialsSection() {
  return (
    <SectionCard
      action={
        <Link
          className="inline-flex rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700"
          href="/mundo-mapping/influenciadores/meus-links"
        >
          Ver produtos afiliados
        </Link>
      }
      subtitle="Materiais liberados pela empresa para cada produto aprovado na sua operação."
      title="Biblioteca de materiais"
    >
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">Nenhum material disponível ainda.</p>
        <p className="mt-2 text-sm text-zinc-500">Quando uma empresa liberar materiais para os seus produtos afiliados, eles aparecerão aqui.</p>
      </div>
    </SectionCard>
  );
}

export function InfluencerFinanceSection() {
  return (
    <SectionCard subtitle="Resumo financeiro do influenciador." title="Financeiro">
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">Módulo financeiro em construção.</p>
        <p className="mt-2 text-sm text-zinc-500">
          Acompanhe seus cliques e links em{" "}
          <Link className="font-semibold text-red-700" href="/mundo-mapping/influenciadores/meus-links">
            Meus links
          </Link>
          .
        </p>
      </div>
    </SectionCard>
  );
}
