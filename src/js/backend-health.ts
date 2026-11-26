/**
 * The API version of each backend of the drop-down of the builds where it is selectable (see backend-selection.ts),
 * from its `/health`: fetched when the drop-down opens only, since the production API rate-limits (HTTP 429).
 *
 * The requests run in parallel, time out after a few seconds and are not retried; their results, errors included, are
 * kept for a minute.
 */

export const HEALTH_TIMEOUT_MS = 5000;
export const HEALTH_CACHE_MS = 60 * 1000;

export type BackendHealth =
  // label: `describe` (e.g. v6.2.0-12-g96def4e) when the API gives it, else the short commit SHA
  | { ok: true; label: string; commitDate?: string }
  // status: the HTTP status, when the API answered
  | { ok: false; error: 'http'; status: number }
  | { ok: false; error: 'timeout' | 'unreachable' | 'invalid' };

type HealthResponse = { version?: unknown; describe?: unknown; commit_date?: unknown };

export function parseHealth(body: HealthResponse): BackendHealth {
  const describe = typeof body.describe === 'string' && body.describe ? body.describe : undefined;
  const version = typeof body.version === 'string' && body.version ? body.version.slice(0, 7) : undefined;
  const label = describe ?? version;
  if (!label) {
    return { ok: false, error: 'invalid' };
  }
  const commitDate = typeof body.commit_date === 'string' && body.commit_date ? body.commit_date : undefined;
  return { ok: true, label, ...(commitDate ? { commitDate } : {}) };
}

export async function fetchHealth(
  api: string,
  fetchFn: typeof fetch = fetch,
  timeoutMs = HEALTH_TIMEOUT_MS
): Promise<BackendHealth> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetchFn(`${api.replace(/\/+$/, '')}/health`, {
      signal: controller.signal,
      // a fresh answer: the point is to see what runs now
      cache: 'no-store',
    });
    if (!response.ok) {
      return { ok: false, error: 'http', status: response.status };
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { ok: false, error: 'invalid' };
    }
    return body && typeof body === 'object' ? parseHealth(body as HealthResponse) : { ok: false, error: 'invalid' };
  } catch {
    // network error, CORS refusal (the browser gives no detail), or our abort
    return { ok: false, error: timedOut ? 'timeout' : 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

type CacheEntry = { at: number; health: Promise<BackendHealth> };

/** Fetches the health of an API, or gives the one fetched less than `HEALTH_CACHE_MS` ago (or still in flight) */
export function createHealthCache(fetchFn: typeof fetch = fetch, now: () => number = Date.now) {
  const entries = new Map<string, CacheEntry>();
  return (api: string): Promise<BackendHealth> => {
    const entry = entries.get(api);
    if (entry && now() - entry.at < HEALTH_CACHE_MS) {
      return entry.health;
    }
    const health = fetchHealth(api, fetchFn);
    entries.set(api, { at: now(), health });
    return health;
  };
}

// one cache for the page: the drop-down may be opened many times
export const getBackendHealth = createHealthCache((...args) => fetch(...args));
