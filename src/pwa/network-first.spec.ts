// The network first, the copy without it: and a storage that fails is never an error of the page
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NETWORK_TIMEOUT_MS, networkFirst } from './network-first';

const request = new Request('https://www.camptocamp.org/routes');
const page = (body: string) => new Response(body, { status: 200 });

describe('networkFirst', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("gives the server's answer, and keeps it", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => page('online'))
    );
    const keep = vi.fn(async () => {});
    const response = await networkFirst(request, async () => undefined, keep);
    expect(await response.text()).toBe('online');
    expect(keep).toHaveBeenCalledOnce();
  });

  it("gives the server's answer even when it cannot be kept (storage full)", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => page('online'))
    );
    const keep = vi.fn(async () => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const response = await networkFirst(request, async () => undefined, keep);
    expect(response.ok).toBe(true);
    expect(await response.text()).toBe('online');
  });

  it('gives the copy without a network, and the error of the browser without a copy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('offline')))
    );
    const withCopy = await networkFirst(request, async () => page('copy'), vi.fn());
    expect(await withCopy.text()).toBe('copy');

    // a storage that fails to read is no copy either
    const unreadable = await networkFirst(request, async () => Promise.reject(new Error('cleared')), vi.fn());
    expect(unreadable.type).toBe('error');
  });

  it('gives the copy when the network is slow', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {}))
    );
    const answer = networkFirst(request, async () => page('copy'), vi.fn());
    await vi.advanceTimersByTimeAsync(NETWORK_TIMEOUT_MS);
    expect(await (await answer).text()).toBe('copy');
  });
});
