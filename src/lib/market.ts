export async function getMarketSnapshot() {
  const base = process.env.COINGECKO_API_BASE ?? "https://api.coingecko.com/api/v3";

  const response = await fetch(
    `${base}/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true`,
    { next: { revalidate: 120 } }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export type TopCoinForTv = {
  id: string;
  name: string;
  symbol: string;
  tvSymbol: string;
};

const tvSymbolOverrides: Record<string, string> = {
  bitcoin: "BINANCE:BTCUSDT",
  ethereum: "BINANCE:ETHUSDT",
  solana: "BINANCE:SOLUSDT",
  binancecoin: "BINANCE:BNBUSDT"
};

export async function getTopCoinsForTradingView(): Promise<TopCoinForTv[]> {
  const base = process.env.COINGECKO_API_BASE ?? "https://api.coingecko.com/api/v3";
  try {
    const coinsResponse = await fetch(
      `${base}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`,
      { next: { revalidate: 300 } }
    );

    if (!coinsResponse.ok) return [];

    const rows = (await coinsResponse.json()) as Array<{ id: string; name: string; symbol: string }>;

    const seen = new Set<string>();
    const filtered = rows
      .map((row) => {
        const upper = row.symbol.toUpperCase();
        const override = tvSymbolOverrides[row.id];
        const tvSymbol = override ?? `BINANCE:${upper}USDT`;
        return {
          id: row.id,
          name: row.name,
          symbol: upper,
          tvSymbol
        };
      })
      .filter((item) => {
        if (seen.has(item.tvSymbol)) return false;
        seen.add(item.tvSymbol);
        return true;
      })
      .slice(0, 50);

    return filtered;
  } catch {
    return [];
  }
}

type CmcIndicators = {
  fearGreed: number | null;
  fearGreedSeries: number[];
  altcoinSeason: number | null;
  altcoinSeasonSeries: number[];
  averageCryptoRsi: number | null;
  averageCryptoRsiSeries: number[];
};

async function fetchCmc(paths: string[]) {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) return null;

  const base = process.env.CMC_API_BASE ?? "https://pro-api.coinmarketcap.com";

  for (const path of paths) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: {
          Accept: "application/json",
          "X-CMC_PRO_API_KEY": apiKey
        },
        next: { revalidate: 60 }
      });

      if (!response.ok) continue;
      return response.json();
    } catch {
      continue;
    }
  }

  return null;
}

type CmcPageSnapshot = {
  fearGreed: number | null;
  altcoinSeason: number | null;
};

function parseNumberFromMatch(match: RegExpMatchArray | null): number | null {
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

async function fetchCmcPageSnapshot(): Promise<CmcPageSnapshot> {
  try {
    const response = await fetch("https://coinmarketcap.com/charts/altcoin-season-index/", {
      next: { revalidate: 60 }
    });
    if (!response.ok) return { fearGreed: null, altcoinSeason: null };

    const html = await response.text();

    // Source of truth rendered on CMC page itself.
    const fearGreed = parseNumberFromMatch(
      html.match(/"fearGreedIndexData"\s*:\s*\{\s*"currentIndex"\s*:\s*\{\s*"score"\s*:\s*([0-9]+(?:\.[0-9]+)?)/)
    );
    const altcoinSeason = parseNumberFromMatch(html.match(/"altcoinIndex"\s*:\s*([0-9]+(?:\.[0-9]+)?)/));

    return { fearGreed, altcoinSeason };
  } catch {
    return { fearGreed: null, altcoinSeason: null };
  }
}

function calculateRsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i += 1) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i += 1) {
    const delta = closes[i] - closes[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateRsiSeries(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return [];

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  const values: number[] = [];

  for (let i = period + 1; i < closes.length; i += 1) {
    const delta = closes[i] - closes[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    if (Number.isFinite(rsi)) values.push(rsi);
  }

  return values;
}

async function fetchCmcPublicChartCloses(id: number): Promise<number[]> {
  try {
    const response = await fetch(
      `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail/chart?id=${id}&range=3M`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return [];

    const payload = (await response.json()) as {
      data?: {
        points?: Record<string, { v?: number[] }>;
      };
    };

    const points = payload.data?.points;
    if (!points) return [];

    const entries = Object.entries(points).sort((a, b) => Number(a[0]) - Number(b[0]));
    const daily = new Map<string, number>();

    for (const [timestamp, point] of entries) {
      const close = point.v?.[0];
      if (typeof close !== "number" || !Number.isFinite(close)) continue;

      const dayKey = new Date(Number(timestamp) * 1000).toISOString().slice(0, 10);
      daily.set(dayKey, close);
    }

    return [...daily.values()];
  } catch {
    return [];
  }
}

async function fetchAltcoinSeasonFromPage(): Promise<number | null> {
  try {
    const response = await fetch("https://coinmarketcap.com/charts/altcoin-season-index/", {
      next: { revalidate: 300 }
    });
    if (!response.ok) return null;

    const html = await response.text();
    const match = html.match(/"altcoinIndex":\s*([0-9]+(?:\.[0-9]+)?)/);
    if (!match) return null;

    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export async function getCmcIndicators(): Promise<CmcIndicators> {
  const [pageSnapshot, fearGreedLatest, fearGreedHistorical, altcoinSeasonFromPage, ...charts] = await Promise.all([
    fetchCmcPageSnapshot(),
    fetchCmc(["/v3/fear-and-greed/latest"]),
    fetchCmc(["/v3/fear-and-greed/historical?limit=30"]),
    fetchAltcoinSeasonFromPage(),
    fetchCmcPublicChartCloses(1),
    fetchCmcPublicChartCloses(1027),
    fetchCmcPublicChartCloses(1839),
    fetchCmcPublicChartCloses(5426)
  ]);

  const fearGreedFromApi =
    typeof (fearGreedLatest as { data?: { value?: unknown } } | null)?.data?.value === "number"
      ? ((fearGreedLatest as { data: { value: number } }).data.value ?? null)
      : null;

  const fearGreed = pageSnapshot.fearGreed ?? fearGreedFromApi;

  const fearGreedSeries = Array.isArray((fearGreedHistorical as { data?: unknown[] } | null)?.data)
    ? ((fearGreedHistorical as { data: Array<{ value?: number }> }).data
        .map((item) => (typeof item.value === "number" ? item.value : null))
        .filter((value): value is number => value !== null)
        .reverse())
    : [];

  const altcoinSeason = pageSnapshot.altcoinSeason ?? altcoinSeasonFromPage;
  const altcoinSeasonSeries = altcoinSeason !== null ? [0, 25, 50, 75, altcoinSeason, 100] : [];

  const rsiSeriesByAsset = charts.map((closes) => calculateRsiSeries(closes, 14)).filter((series) => series.length > 0);
  const minLen = rsiSeriesByAsset.reduce((min, series) => Math.min(min, series.length), Number.POSITIVE_INFINITY);

  const averageCryptoRsiSeries =
    minLen === Number.POSITIVE_INFINITY
      ? []
      : Array.from({ length: minLen }, (_, idx) => {
          const sliceValues = rsiSeriesByAsset.map((series) => series[series.length - minLen + idx]);
          return sliceValues.reduce((sum, value) => sum + value, 0) / sliceValues.length;
        });

  const rsiValues = charts
    .map((closes) => calculateRsi(closes, 14))
    .filter((value): value is number => value !== null);

  const averageCryptoRsi =
    rsiValues.length > 0 ? rsiValues.reduce((sum, value) => sum + value, 0) / rsiValues.length : null;

  return {
    fearGreed,
    fearGreedSeries,
    altcoinSeason,
    altcoinSeasonSeries,
    averageCryptoRsi,
    averageCryptoRsiSeries
  };
}
