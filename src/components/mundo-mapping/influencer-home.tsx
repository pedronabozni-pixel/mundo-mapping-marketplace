import Link from "next/link";
import { DataTable, LineChart, MetricCard, ProductVisualCard, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";

const linkRows = [
  ["Mapa 360 Pro", "mm.link/ana/mapa360", "1.240", "38", "R$ 7.840", "Ativo"],
  ["O Que as Marcas Querem", "mm.link/ana/marcas", "890", "64", "R$ 1.274", "Ativo"],
  ["Mentoria Comercial MM", "mm.link/ana/mentoria", "214", "0", "R$ 0", "Pendente"]
];

const materialRows = [
  ["Mapa 360 Pro", "Story pack", "ZIP + legenda", "Atualizado hoje", "Disponível"],
  ["O Que as Marcas Querem", "Feed 4:5", "Imagem + CTA", "Atualizado ontem", "Disponível"],
  ["Mentoria Comercial MM", "Landing hero", "Banner principal", "Em revisão", "Pendente"]
];

export function InfluencerHero() {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
      <div className="rounded-[28px] border border-zinc-200 bg-[linear-gradient(135deg,#1f2937_0%,#b91c1c_100%)] p-7 text-white shadow-[0_26px_80px_-52px_rgba(185,28,28,0.45)]">
        <StatusBadge label="Portal do influenciador" tone="danger" />
        <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight">Seu desempenho vem dos seus links. Cada produto aprovado libera um link próprio para vender.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
          Aqui o influenciador opera como afiliado: acompanha cliques, vendas, comissão, materiais e saques em um ambiente separado do painel da empresa.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950" href="/mundo-mapping/influenciadores/marketplace">
            Abrir marketplace
          </Link>
          <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950" href="/mundo-mapping/influenciadores/links">
            Ver meus links
          </Link>
          <Link className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white" href="/mundo-mapping/influenciadores/produtos">
            Ver meus produtos
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <MetricCard emphasis label="Saldo disponível" meta="Pronto para saque" value="R$ 4.820" />
        <MetricCard label="Saldo pendente" meta="Em janela de garantia" value="R$ 1.940" />
        <MetricCard label="Links ativos" meta="Um por produto aprovado" value="12" />
      </div>
    </section>
  );
}

export function InfluencerKpis() {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <MetricCard label="Comissão total" meta="Acumulado no período" value="R$ 22.640" />
      <MetricCard label="Cliques" meta="Últimos 30 dias" value="6.482" />
      <MetricCard label="Vendas" meta="Últimos 30 dias" value="38" />
      <MetricCard label="Conversão" meta="Média dos meus links" value="3,8%" />
    </section>
  );
}

export function InfluencerOverviewSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
      <div>
        <SectionCard subtitle="Leitura simples da evolução dos meus links ao longo do período." title="Performance dos links">
          <LineChart values={[18, 24, 31, 28, 36, 42, 45, 48, 54, 58, 63, 67]} />
        </SectionCard>
      </div>

      <div>
        <SectionCard subtitle="Regras claras para operar sem ruído." title="Como funciona">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Origem da venda</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">A empresa cadastra o produto. A venda acontece pelo meu link de afiliado, não por um link próprio da empresa.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Comissão</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">A comissão entra como pendente, respeita a janela de garantia e depois fica disponível para saque.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Materiais</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">Cada produto aprovado libera checkout, criativos e orientações prontas para divulgação.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </section>
  );
}

export function InfluencerLinksSection() {
  return (
    <SectionCard
      action={<StatusBadge label="Links individuais por influenciador" tone="success" />}
      subtitle="Cada linha representa um link próprio do afiliado para um produto específico."
      title="Meus links de afiliado"
    >
      <DataTable columns={["Produto", "Link", "Cliques", "Vendas", "GMV", "Status"]} rows={linkRows} />
    </SectionCard>
  );
}

export function InfluencerProductsSection() {
  return (
    <SectionCard
      action={
        <Link className="inline-flex rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700" href="/mundo-mapping/influenciadores/marketplace">
          Buscar novos produtos
        </Link>
      }
      subtitle="Produtos já aprovados para divulgação, com leitura enxuta para ação."
      title="Produtos afiliados"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Link href="/mundo-mapping/influenciadores/links">
          <ProductVisualCard commission="20% por venda" price="R$ 890,00" status="Público" title="Mapa 360 Pro" />
        </Link>
        <Link href="/mundo-mapping/influenciadores/links">
          <ProductVisualCard commission="50% por venda" price="R$ 19,90" status="Público" title="O Que as Marcas Querem" />
        </Link>
        <Link href="/mundo-mapping/influenciadores/links">
          <ProductVisualCard commission="25% por venda" price="R$ 1.290,00" status="Pendente" title="Mentoria Comercial MM" />
        </Link>
      </div>
    </SectionCard>
  );
}

export function InfluencerMaterialsSection() {
  return (
    <SectionCard
      action={
        <Link className="inline-flex rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700" href="/mundo-mapping/influenciadores/produtos">
          Ver produtos afiliados
        </Link>
      }
      subtitle="Materiais liberados pela empresa para cada produto já aprovado na sua operação."
      title="Biblioteca de materiais"
    >
      <DataTable columns={["Produto", "Material", "Formato", "Atualização", "Status"]} rows={materialRows} />
    </SectionCard>
  );
}

export function InfluencerFinanceSection() {
  return (
    <SectionCard subtitle="Resumo rápido do financeiro do parceiro." title="Financeiro do influenciador">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-500">Próximo saque elegível</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">R$ 4.820</p>
          <p className="mt-2 text-sm text-zinc-500">Disponível após fechamento do período atual.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-500">Comissões pendentes</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">R$ 1.940</p>
          <p className="mt-2 text-sm text-zinc-500">Aguardando fim da janela de garantia.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-500">Ação rápida</p>
          <Link className="mt-3 inline-flex text-sm font-semibold text-red-700" href="/mundo-mapping/influenciadores/links">
            Revisar meus links
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}

export function InfluencerHome() {
  return (
    <div className="space-y-6 p-6">
      <InfluencerHero />
      <InfluencerKpis />
      <InfluencerOverviewSection />
    </div>
  );
}
