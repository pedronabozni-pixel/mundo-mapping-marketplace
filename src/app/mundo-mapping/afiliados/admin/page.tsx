import Link from "next/link";
import { MetricCard, PageHeader, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        actions={
          <>
            <Link className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700" href="/mundo-mapping/afiliados/financeiro">
              Exportar relatorio
            </Link>
            <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]" href="/mundo-mapping/afiliados/blueprint">
              Abrir central de risco
            </Link>
          </>
        }
        description="Torre de controle global da plataforma com aprovacoes, sinais de risco, governanca do ecossistema e saude operacional."
        eyebrow="Mundo Mapping / Afiliados / Painel admin"
        title="Operacao global e governanca"
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 xl:grid-cols-4">
          <MetricCard emphasis label="GMV global" meta="Ecossistema Mundo Mapping" value="R$ 2,8 mi" />
          <MetricCard label="Empresas ativas" meta="Com produtos publicados" value="148" />
          <MetricCard label="Influenciadores ativos" meta="Ultimos 30 dias" value="1.920" />
          <MetricCard label="Saude operacional" meta="Score consolidado" value="94/100" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr_1fr]">
          <SectionCard subtitle="Fila de moderacao com criticidade e SLA." title="Aprovacoes pendentes">
            <div className="space-y-4">
              {[
                ["12 produtos aguardando compliance", "Ate 4h", "warning"],
                ["5 empresas aguardando validacao fiscal", "Ate 1d", "neutral"],
                ["18 influenciadores em triagem", "Ate 6h", "warning"],
                ["2 casos de risco alto", "Imediato", "red"]
              ].map(([title, eta, tone]) => (
                <div className="rounded-2xl border border-zinc-200 p-4" key={title}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-zinc-900">{title}</p>
                    <StatusBadge label={eta} tone={tone === "red" ? "red" : tone === "warning" ? "warning" : "neutral"} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard subtitle="Visao de fraude e padroes suspeitos sem perder clareza visual." title="Risco">
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-800">Cluster de chargeback acima do esperado</p>
                <p className="mt-2 text-sm text-red-700">3 afiliados e 1 empresa com concentracao anomala de reembolsos nos ultimos 7 dias.</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-900">Webhook drift monitorado</p>
                <p className="mt-2 text-sm text-zinc-600">Nenhum atraso critico na confirmacao de vendas.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard subtitle="Controles sistemicos, categorias e taxas." title="Governanca">
            <div className="space-y-4">
              <Link className="block w-full rounded-2xl border border-zinc-200 px-4 py-4 text-left text-sm font-semibold text-zinc-700" href="/mundo-mapping/afiliados/shopping">
                Gerir categorias e segmentos
              </Link>
              <Link className="block w-full rounded-2xl border border-zinc-200 px-4 py-4 text-left text-sm font-semibold text-zinc-700" href="/mundo-mapping/afiliados/financeiro">
                Ajustar taxas da plataforma
              </Link>
              <Link className="block w-full rounded-2xl border border-zinc-200 px-4 py-4 text-left text-sm font-semibold text-zinc-700" href="/mundo-mapping/afiliados">
                Auditar vendas e atribuicoes
              </Link>
              <Link className="block w-full rounded-2xl bg-zinc-900 px-4 py-4 text-left text-sm font-semibold text-white" href="/mundo-mapping/afiliados/blueprint">
                Abrir central de logs e eventos
              </Link>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <SectionCard subtitle="Ferramentas para resolver conflito sem depender do time técnico." title="Ações de contingência">
            <div className="space-y-3 text-sm text-zinc-700">
              <div className="rounded-2xl border border-zinc-200 p-4">Congelar saldo de creator ou empresa</div>
              <div className="rounded-2xl border border-zinc-200 p-4">Reprocessar atribuição e webhook</div>
              <div className="rounded-2xl border border-zinc-200 p-4">Bloquear produto, creator ou conta empresarial</div>
            </div>
          </SectionCard>

          <SectionCard subtitle="Permissões e rastreabilidade para operação em escala." title="Permissões e auditoria">
            <div className="space-y-3 text-sm text-zinc-700">
              <div className="rounded-2xl border border-zinc-200 p-4">RBAC por perfil: risco, financeiro, suporte e compliance</div>
              <div className="rounded-2xl border border-zinc-200 p-4">Cada ação manual exige motivo e autor</div>
              <div className="rounded-2xl border border-zinc-200 p-4">Timeline completa por produto, creator, venda e comissão</div>
            </div>
          </SectionCard>

          <SectionCard subtitle="Como a base validada vira vantagem real para as marcas." title="Curadoria dos 16 mil creators">
            <div className="space-y-3 text-sm text-zinc-700">
              <div className="rounded-2xl border border-zinc-200 p-4">Matching por score, nicho, região e histórico de conversão</div>
              <div className="rounded-2xl border border-zinc-200 p-4">Recomendação automática de creators por produto</div>
              <div className="rounded-2xl border border-zinc-200 p-4">Detecção de creators de alto potencial e creators de risco</div>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
