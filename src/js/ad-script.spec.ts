import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const adScript = () => document.getElementById('ad_script') as HTMLScriptElement | null;

const setReadyState = (state: DocumentReadyState) =>
  Object.defineProperty(document, 'readyState', { configurable: true, get: () => state });

describe('loadAdScript', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    // jsdom has no requestIdleCallback: the fallback runs on a timer
    vi.stubGlobal('requestIdleCallback', undefined);
    delete (window as { requestIdleCallback?: unknown }).requestIdleCallback;
  });

  afterEach(() => {
    adScript()?.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setReadyState('complete');
  });

  it('adds the ad script only after the load event, once', async () => {
    setReadyState('loading');
    const { loadAdScript } = await import('./ad-script');

    loadAdScript();
    loadAdScript();
    vi.runAllTimers();
    expect(adScript()).toBeNull();

    window.dispatchEvent(new Event('load'));
    vi.runAllTimers();
    expect(adScript()?.src).toBe('https://static.admysports.com/hb/site/camptocamp/hb_camptocamp.js');
    expect(document.querySelectorAll('#ad_script')).toHaveLength(1);
  });

  it('adds the ad script when the browser is idle, if the page has already loaded', async () => {
    setReadyState('complete');
    const requestIdleCallback = vi.fn((callback: () => void) => callback());
    vi.stubGlobal('requestIdleCallback', requestIdleCallback);
    const { loadAdScript } = await import('./ad-script');

    loadAdScript();
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 });
    expect(adScript()).not.toBeNull();
  });
});
