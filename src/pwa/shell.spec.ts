// The page of the app kept for the offline starts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { keepShell, shellKey } from './shell';

const SCOPE = 'https://www.camptocamp.org/';

// a Cache Storage with one cache, the copy it may already hold, and the server's answer
const setUp = (kept: boolean, ok = true) => {
  const cache = { match: vi.fn(async () => (kept ? new Response('copy') : undefined)), put: vi.fn(async () => {}) };
  vi.stubGlobal('caches', { open: vi.fn(async () => cache) });
  const fetch = vi.fn(async () => new Response('<html>', { status: ok ? 200 : 503 }));
  vi.stubGlobal('fetch', fetch);
  return { cache, fetch };
};

describe('keepShell', () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the server's page as index.html, when no copy is kept", async () => {
    const { cache, fetch } = setUp(false);
    expect(await keepShell(SCOPE)).toBe(true);
    expect(fetch).toHaveBeenCalledWith(SCOPE, { credentials: 'same-origin' });
    expect(cache.put).toHaveBeenCalledWith('https://www.camptocamp.org/index.html', expect.any(Response));
  });

  it('asks nothing when a copy is kept', async () => {
    const { fetch } = setUp(true);
    expect(await keepShell(SCOPE)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps nothing from an error of the server', async () => {
    const { cache } = setUp(false, false);
    expect(await keepShell(SCOPE)).toBe(false);
    expect(cache.put).not.toHaveBeenCalled();
  });

  it('is the same key for every route of the app', () => {
    expect(shellKey('https://sixtedsm.github.io/c2c_ui/mobile-app/')).toBe(
      'https://sixtedsm.github.io/c2c_ui/mobile-app/index.html'
    );
  });
});
