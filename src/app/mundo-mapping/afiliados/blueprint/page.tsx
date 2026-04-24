import Link from "next/link";
import { BlueprintBlock, PageHeader, SectionCard } from "@/components/mundo-mapping/affiliate-ui";

export default function BlueprintPage() {
  return (
    <>
      <PageHeader
        actions={
          <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]" href="/mundo-mapping/afiliados/produtos/novo">
            Base para implementacao
          </Link>
        }
        description="Camada estrategica do redesign, convertendo o prompt em diagnostico, IA, UX, design system, dados, stack e fases de entrega dentro do proprio ambiente."
        eyebrow="Mundo Mapping / Afiliados / Blueprint"
        title="Visao de produto e arquitetura"
      />

      <div className="space-y-6 p-6">
        <SectionCard subtitle="Leitura critica da interface atual com foco em percepcao de valor, clareza e confianca." title="Diagnostico senior">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">O que enfraquece o produto hoje</p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">
                <li>Hierarquia visual rasa, com muitos elementos de peso parecido.</li>
                <li>Cadastro com cara de CRUD administrativo, sem onboarding orientado.</li>
                <li>Dashboard pouco analitico e sem leitura executiva.</li>
                <li>Detalhe de produto estatico, sem papel de hub operacional.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">O que deve ser preservado</p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">
                <li>Sidebar com contraste forte em relacao ao conteudo.</li>
                <li>Base clara, vermelho como cor principal de acao e linguagem corporativa.</li>
                <li>Tipografia sans-serif neutra e composicao comercial.</li>
                <li>Cards, tabelas e badges como estrutura central do produto.</li>
              </ul>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <BlueprintBlock
            index="1"
            title="Nova visao de produto"
            items={[
              "O modulo passa a ser percebido como infraestrutura comercial e financeira de afiliados, nao apenas painel administrativo.",
              "A experiencia combina performance comercial, clareza financeira, rastreabilidade e confianca operacional.",
              "Os tres perfis centrais sao empresa, influenciador e admin global."
            ]}
          />
          <BlueprintBlock
            index="2"
            title="Direcao visual baseada na identidade atual"
            items={[
              "Preserva sidebar forte, base clara, vermelho controlado e linguagem corporativa da Mundo Mapping.",
              "Reduz excesso de vermelho decorativo e usa a cor com mais criterio em CTA, highlights e estados criticos.",
              "Evolui espacamento, contraste, proporcao e refinamento sem rebranding."
            ]}
          />
          <BlueprintBlock
            index="3"
            title="Arquitetura da informacao"
            items={[
              "Navegacao agrupada por dominio: produtos, afiliados, vendas, financeiro, materiais, relatorios e configuracoes.",
              "Detalhe de produto vira hub com abas e ferramentas contextuais.",
              "Financeiro ganha identidade propria, separado de catalogo e marketing."
            ]}
          />
          <BlueprintBlock
            index="4"
            title="Design system sugerido"
            items={[
              "Grid de 12 colunas, espacamento 4/8/12/16/24/32/40/48 e superficies com raio entre 10 e 24.",
              "Tipografia sans-serif profissional, com escala clara para titulos, KPI e texto auxiliar.",
              "Componentes base: cards, tabelas, tabs, filtros, badges, toasts, drawers e highlights de dados."
            ]}
          />
          <BlueprintBlock
            index="5"
            title="Regras funcionais e operacionais"
            items={[
              "Fluxo principal: produto criado, aprovado, afiliado, vendido, comissao elegivel, saldo disponivel e repasse.",
              "Estados centrais para produto, afiliacao, venda, comissao e risco.",
              "Chargeback, cancelamento, ajuste manual e saque sempre geram log auditavel."
            ]}
          />
          <BlueprintBlock
            index="6"
            title="Banco e entidades"
            items={[
              "Entidades principais: tenants, users, companies, influencers, offers, assets, affiliate_links, orders, commissions, payouts e audit_logs.",
              "Modelo multi-tenant com rastreabilidade por evento e ledger financeiro.",
              "Atribuicao por link e cupom como camada separada da venda."
            ]}
          />
          <BlueprintBlock
            index="7"
            title="Stack recomendada"
            items={[
              "Frontend com Next.js, TypeScript, Tailwind e componentizacao consistente.",
              "Backend modular com NestJS ou Fastify, PostgreSQL, Redis/BullMQ e storage em S3/R2.",
              "Observabilidade com OpenTelemetry, Sentry e analytics com PostHog."
            ]}
          />
          <BlueprintBlock
            index="8"
            title="Plano em fases"
            items={[
              "MVP: shell novo, dashboard empresa, cadastro de produto em etapas, hub do produto, shopping basico e ledger essencial.",
              "V2: cupons, campanhas, reconcilacao, antifraude inicial e exportacoes.",
              "V3: motor avancado de comissao, health score do ecossistema e inteligencia operacional."
            ]}
          />
          <BlueprintBlock
            index="9"
            title="Prompts adicionais"
            items={[
              "Frontend: gerar telas preservando identidade visual atual da Mundo Mapping.",
              "Backend: modelar entidades, RBAC, eventos, ledger e webhooks do modulo de afiliados.",
              "Dashboard/design system: detalhar componentes, estados e visual premium sem rebranding."
            ]}
          />
        </div>

        <SectionCard subtitle="Camadas que precisavam sair do discurso e virar regra concreta para o produto evoluir de prototipo para plataforma." title="Lacunas agora fechadas no modelo">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {[
              [
                "Atribuição",
                "Modelo de atribuição, janela de conversão, uso de cupom e prioridade entre sinais agora fazem parte do cadastro da oferta."
              ],
              [
                "Financeiro",
                "Base de cálculo da comissão, prazo de liberação, split ou ledger e estados do repasse passaram a ser explícitos."
              ],
              [
                "Elegibilidade",
                "Score mínimo, seguidores mínimos, região elegível, whitelist e exigência de creator validado saíram da ideia e entraram na regra."
              ],
              [
                "Tipos de produto",
                "Logística, estoque, agenda, frete e política de execução agora variam por modelo operacional do produto."
              ],
              [
                "Admin",
                "Override, congelamento de saldo, reprocessamento e auditoria ficaram visíveis como ferramental de operação manual."
              ],
              [
                "Diferencial MM",
                "A base de 16 mil creators validados passou a aparecer como insumo de score, curadoria e matching no produto."
              ]
            ].map(([title, text]) => (
              <div className="rounded-2xl border border-zinc-200 p-5" key={title}>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">{title}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
