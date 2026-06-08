// Rate limiting in-memory (sliding window). Para escalar com múltiplas
// instâncias, trocar a implementação interna por Upstash Redis
// (@upstash/ratelimit) mantendo a mesma assinatura da função rateLimit().
//
// Como é in-memory, a contagem é por processo: cada instância tem seu próprio
// Map. Em deploy single-instance (Railway padrão) isso é suficiente; ao escalar
// horizontalmente, migrar para um store compartilhado (Redis).

// chave = identificador (ex: "payment:1.2.3.4"), valor = timestamps (ms) das
// requisições que ainda estão dentro da janela.
const store = new Map<string, number[]>();

// Limpeza periódica para não vazar memória: a cada intervalo, remove timestamps
// velhos e descarta chaves que ficaram sem nenhum timestamp recente. Usamos a
// maior janela plausível (10 min) como corte para o GC oportunístico global.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 10 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanupScheduled() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - MAX_AGE_MS;
    for (const [key, timestamps] of store) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) {
        store.delete(key);
      } else if (fresh.length !== timestamps.length) {
        store.set(key, fresh);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Não impedir o processo de encerrar por causa do timer.
  if (typeof cleanupTimer.unref === "function") cleanupTimer.unref();
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number; // epoch ms em que a janela libera o request mais antigo
}

/**
 * Sliding window rate limit, in-memory.
 *
 * @param identifier chave única (recomendado prefixar por rota, ex: "payment:<ip>")
 * @param limit      máximo de requisições permitidas dentro da janela
 * @param windowMs   tamanho da janela em milissegundos
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  ensureCleanupScheduled();

  const now = Date.now();
  const windowStart = now - windowMs;

  // Mantém só os timestamps ainda dentro da janela (limpeza oportunística).
  const previous = store.get(identifier) ?? [];
  const recent = previous.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    // Bloqueado: a janela libera quando o request mais antigo "sai" da janela.
    const oldest = recent[0];
    store.set(identifier, recent);
    return { success: false, remaining: 0, resetAt: oldest + windowMs };
  }

  recent.push(now);
  store.set(identifier, recent);
  return {
    success: true,
    remaining: limit - recent.length,
    resetAt: now + windowMs,
  };
}

/**
 * Wrapper FAIL-OPEN para uso nos handlers. Nunca lança: se a checagem de rate
 * limit falhar por qualquer motivo, loga e deixa a requisição passar (não
 * derruba checkout/login por causa do limiter).
 *
 * @returns `limited: true` + segundos até liberar quando estourou o limite.
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): { limited: boolean; retryAfter: number } {
  try {
    const result = rateLimit(identifier, limit, windowMs);
    if (result.success) return { limited: false, retryAfter: 0 };
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return { limited: true, retryAfter };
  } catch (err) {
    console.warn("[rate-limit] fail-open:", err instanceof Error ? err.message : err);
    return { limited: false, retryAfter: 0 };
  }
}

/**
 * Extrai o IP real do cliente atrás do proxy do Railway.
 * x-forwarded-for pode trazer "client, proxy1, proxy2" — pegamos o primeiro.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
