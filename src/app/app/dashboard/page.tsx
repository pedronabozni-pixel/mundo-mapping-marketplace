import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { getCmcIndicators, getMarketSnapshot, getTopCoinsForTradingView } from "@/lib/market";
import { requireMemberSession } from "@/lib/access";
import { CryptoMarketPanel } from "@/components/crypto-market-panel";

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) {
    return <div className="mt-2 h-10 rounded bg-panelSoft/60" />;
  }

  const width = 220;
  const height = 46;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="mt-2 h-10 w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" points={points} stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

function AltcoinSeasonGauge({ value }: { value: number | null }) {
  const safe = value === null ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div className="mt-3">
      <div className="relative h-2 overflow-hidden rounded-full bg-panelSoft">
        <div className="absolute inset-y-0 left-0 w-1/4 bg-red-500/55" />
        <div className="absolute inset-y-0 left-1/4 w-1/2 bg-yellow-500/55" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-brand/70" />
        <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-bg bg-white" style={{ left: `calc(${safe}% - 6px)` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>Bitcoin</span>
        <span>Neutro</span>
        <span>Altcoin</span>
      </div>
    </div>
  );
}

function getFearGreedLabel(value: number | null) {
  if (value === null) return "Sem dados";
  if (value < 20) return "Extreme fear";
  if (value < 40) return "Fear";
  if (value < 60) return "Neutral";
  if (value < 80) return "Greed";
  return "Extreme greed";
}

function getRsiLabel(value: number | null) {
  if (value === null) return "Sem dados";
  if (value >= 70) return "Sobrecomprado";
  if (value <= 30) return "Sobrevendido";
  return "Zona neutra";
}

export default async function DashboardPage() {
  const session = await requireMemberSession();

  const [latestUpdate, latestAnalysis, recentUpdates, subscription, market, cmcIndicators, topCoins] = await Promise.all([
    db.dailyUpdate.findFirst({ where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" } }),
    db.analysis.findFirst({ where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" } }),
    db.dailyUpdate.findMany({ where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, take: 5 }),
    db.subscription.findUnique({ where: { userId: session.user.id }, include: { plan: true } }),
    getMarketSnapshot(),
    getCmcIndicators(),
    getTopCoinsForTradingView()
  ]);

  const cmcConfigured = Boolean(process.env.CMC_API_KEY);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <CryptoMarketPanel
        market={market as Record<string, { usd?: number; usd_24h_change?: number } | undefined> | null}
        topCoins={topCoins}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-muted">Fear & Greed</p>
          <p className="text-2xl font-semibold">
            {cmcIndicators.fearGreed !== null ? cmcIndicators.fearGreed.toFixed(0) : "-"}
          </p>
          <p className="text-xs text-muted">
            {getFearGreedLabel(cmcIndicators.fearGreed)} • valor oficial da página CMC
          </p>
          <Sparkline values={cmcIndicators.fearGreedSeries} />
        </div>
        <div className="card">
          <p className="text-sm text-muted">Altcoin Season</p>
          <p className="text-2xl font-semibold">
            {cmcIndicators.altcoinSeason !== null ? cmcIndicators.altcoinSeason.toFixed(0) : "-"}
          </p>
          <p className="text-xs text-muted">Valor oficial da página CMC</p>
          <AltcoinSeasonGauge value={cmcIndicators.altcoinSeason} />
        </div>
        <div className="card">
          <p className="text-sm text-muted">Average Crypto RSI</p>
          <p className="text-2xl font-semibold">
            {cmcIndicators.averageCryptoRsi !== null ? cmcIndicators.averageCryptoRsi.toFixed(2) : "-"}
          </p>
          <p className="text-xs text-muted">{getRsiLabel(cmcIndicators.averageCryptoRsi)}</p>
          <Sparkline values={cmcIndicators.averageCryptoRsiSeries} />
        </div>
      </div>

      {!cmcConfigured ? (
        <div className="card border-yellow-500/40 bg-yellow-500/10 text-sm text-yellow-200">
          Configure <code>CMC_API_KEY</code> no arquivo <code>.env</code> para carregar Fear &amp; Greed, Altcoin
          Season e Average Crypto RSI.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <article className="card">
          <p className="text-sm text-muted">Última atualização diária</p>
          <h2 className="text-lg font-semibold">{latestUpdate?.title ?? "Sem conteúdo"}</h2>
          <p className="text-sm text-muted">{formatDate(latestUpdate?.publishedAt)}</p>
        </article>

        <article className="card">
          <p className="text-sm text-muted">Última análise exclusiva</p>
          <h2 className="text-lg font-semibold">{latestAnalysis?.title ?? "Sem conteúdo"}</h2>
          <p className="text-sm text-muted">{formatDate(latestAnalysis?.publishedAt)}</p>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h3 className="mb-2 text-lg font-semibold">Conteúdos recentes</h3>
          <ul className="space-y-2 text-sm">
            {recentUpdates.map((item) => (
              <li key={item.id}>
                {item.title} <span className="text-muted">({formatDate(item.publishedAt)})</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3 className="mb-2 text-lg font-semibold">Assinatura</h3>
          <p className="text-sm">Plano: {subscription?.plan.name ?? "-"}</p>
          <p className="text-sm">Status: {subscription?.status ?? "-"}</p>
          <p className="text-sm">Próxima cobrança: {formatDate(subscription?.renewalDate)}</p>
        </section>
      </div>
    </div>
  );
}
