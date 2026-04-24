import Link from "next/link";
import { DataTable, financeRows, MetricCard, PageHeader, SectionCard } from "@/components/mundo-mapping/affiliate-ui";

export default function FinanceiroPage() {
  return (
    <>
      <PageHeader
        actions={
          <>
            <Link className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700" href="/mundo-mapping/afiliados/admin">
              Exportar CSV
            </Link>
            <button className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]" type="button">
              Solicitar saque
            </button>
          </>
        }
        description="Modulo financeiro com cara de sistema serio: extrato detalhado, conciliacao, previsao de recebimento, chargebacks e trilha auditavel."
        eyebrow="Mundo Mapping / Afiliados / Financeiro"
        title="Ledger, repasses e conciliacao"
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 xl:grid-cols-5">
          <MetricCard emphasis label="Saldo liquidado" meta="Apto para repasse" value="R$ 84.112" />
          <MetricCard label="Previsto a receber" meta="Proximos 15 dias" value="R$ 16.480" />
          <MetricCard label="Saques pagos" meta="Mar 2026" value="R$ 42.900" />
          <MetricCard label="Chargebacks" meta="Ultimos 30 dias" value="R$ 1.780" />
          <MetricCard label="Taxa de conciliacao" meta="Transacoes reconciliadas" value="99,2%" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <SectionCard
            action={
              <div className="flex gap-2">
                <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600" href="/mundo-mapping/afiliados">
                  Filtros
                </Link>
                <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600" href="/mundo-mapping/afiliados/admin">
                  Colunas
                </Link>
              </div>
            }
            subtitle="Extrato detalhado com status por evento financeiro."
            title="Ledger e conciliacao"
          >
            <DataTable columns={["Data", "Evento", "Referencia", "Valor", "Status"]} rows={financeRows} />
          </SectionCard>

          <SectionCard subtitle="Blocos executivos para previsao e operacao." title="Resumo financeiro">
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-500">Proximo repasse</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">21 mar 2026</p>
                <p className="mt-2 text-sm text-zinc-500">Volume previsto de R$ 18.900 para 64 afiliados elegiveis.</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-500">Estados financeiros</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                  <li>Pendente: venda aprovada, mas ainda em janela de garantia.</li>
                  <li>Aprovado: comissão elegível para liquidação.</li>
                  <li>Pago: repasse finalizado.</li>
                  <li>Revertido: estorno, cancelamento ou chargeback.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-500">Riscos e excecoes</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                  <li>1 chargeback aguardando decisao</li>
                  <li>2 saques com divergencia bancaria</li>
                  <li>0 falhas de webhook financeiro nas ultimas 24h</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-500">Acoes manuais</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                  <li>Override de atribuicao com justificativa obrigatoria</li>
                  <li>Congelamento de saldo em casos de fraude</li>
                  <li>Reprocessamento de webhook e reconciliacao manual</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-500">Logs</p>
                <p className="mt-2 text-sm text-zinc-700">Cada ajuste de comissao, repasse e estorno gera trilha auditavel com autor, motivo e impacto no saldo.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
