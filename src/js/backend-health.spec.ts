import { afterEach, describe, expect, it, vi } from 'vitest';

import { HEALTH_CACHE_MS, HEALTH_TIMEOUT_MS, createHealthCache, fetchHealth, parseHealth } from './backend-health';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.useRealTimers();
});

describe('parseHealth', () => {
  it('prefers describe, with the commit date', () => {
    expect(
      parseHealth({ version: '96def4e0123456789', describe: 'v6.2.0-12-g96def4e', commit_date: '2026-11-20T10:00:00Z' })
    ).toEqual({ ok: true, label: 'v6.2.0-12-g96def4e', commitDate: '2026-11-20T10:00:00Z' });
  });

  it('else gives the short commit SHA', () => {
    expect(parseHealth({ version: '96def4e0123456789', pg: 'ok' } as never)).toEqual({ ok: true, label: '96def4e' });
  });

  it('tells an answer without version', () => {
    expect(parseHealth({ pg: 'ok' } as never)).toEqual({ ok: false, error: 'invalid' });
    expect(parseHealth({ version: 12, describe: '' })).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('fetchHealth', () => {
  it('fetches <api>/health', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ version: '96def4e0123456789' }));

    expect(await fetchHealth('https://api.example.org/', fetchFn)).toEqual({ ok: true, label: '96def4e' });
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(fetchFn.mock.calls[0][0]).toBe('https://api.example.org/health');
  });

  it('gives the HTTP status of an error, without retrying a 429', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, 429));

    expect(await fetchHealth('https://api.example.org', fetchFn)).toEqual({ ok: false, error: 'http', status: 429 });
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('tells an unreachable API (network error, CORS refusal)', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await fetchHealth('https://api.example.org', fetchFn)).toEqual({ ok: false, error: 'unreachable' });
  });

  it('tells an answer that is not JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('<html>', { status: 200 }));

    expect(await fetchHealth('https://api.example.org', fetchFn)).toEqual({ ok: false, error: 'invalid' });
  });

  it('gives up after the timeout', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        })
    );

    const health = fetchHealth('https://api.example.org', fetchFn as never);
    await vi.advanceTimersByTimeAsync(HEALTH_TIMEOUT_MS);

    expect(await health).toEqual({ ok: false, error: 'timeout' });
  });
});

describe('createHealthCache', () => {
  it('keeps the results, errors included, for a minute per API', async () => {
    let time = 0;
    const fetchFn = vi.fn().mockImplementation(async () => jsonResponse({}, 429));
    const getHealth = createHealthCache(fetchFn, () => time);

    await getHealth('https://api.a.example.org');
    await getHealth('https://api.a.example.org');
    await getHealth('https://api.b.example.org');
    expect(fetchFn).toHaveBeenCalledTimes(2);

    time = HEALTH_CACHE_MS - 1;
    await getHealth('https://api.a.example.org');
    expect(fetchFn).toHaveBeenCalledTimes(2);

    time = HEALTH_CACHE_MS;
    await getHealth('https://api.a.example.org');
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('shares a request still in flight', () => {
    const fetchFn = vi.fn().mockReturnValue(new Promise(() => {}));
    const getHealth = createHealthCache(fetchFn, () => 0);

    expect(getHealth('https://api.example.org')).toBe(getHealth('https://api.example.org'));
    expect(fetchFn).toHaveBeenCalledOnce();
  });
});
