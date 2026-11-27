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

describe('adSlotHeight', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const withUserAgent = (userAgent: string) => vi.stubGlobal('navigator', { userAgent });

  it('follows the ad units of the ad script, chosen from the user agent', async () => {
    const { adSlotHeight } = await import('./ad-script');

    withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36');
    expect(adSlotHeight(false)).toBe(90);
    expect(adSlotHeight(true)).toBe(250);

    withUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36');
    expect(adSlotHeight(false)).toBe(250);
    withUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148');
    expect(adSlotHeight(false)).toBe(250);
  });
});

describe('watchAdSlot', () => {
  type Listener = (event: { isEmpty: boolean; slot: { getSlotElementId(): string } }) => void;

  beforeEach(() => {
    vi.resetModules();
    delete window.googletag;
    setReadyState('complete');
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => callback());
  });

  afterEach(() => {
    adScript()?.remove();
    delete window.googletag;
    vi.unstubAllGlobals();
  });

  // what Google Publisher Tag does once loaded: runs the queued commands, then the new ones right away
  const loadGoogleTag = () => {
    const listeners = new Set<Listener>();
    const pubads = () => ({
      addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
    });
    const queued = window.googletag!.cmd as Array<() => void>;
    window.googletag = { cmd: { push: (callback: () => void) => callback() }, pubads } as never;
    queued.forEach((callback) => callback());
    return {
      listeners,
      render: (divId: string, isEmpty: boolean) =>
        listeners.forEach((listener) => listener({ isEmpty, slot: { getSlotElementId: () => divId } })),
    };
  };

  it('tells whether its slot gets an ad, until stopped', async () => {
    const { watchAdSlot } = await import('./ad-script');
    const onRender = vi.fn();

    const stop = watchAdSlot('camptocamp_htd', onRender);
    const googletag = loadGoogleTag();
    googletag.render('camptocamp_htd', true);
    googletag.render('camptocamp_htad', false);
    googletag.render('camptocamp_htd', false);
    expect(onRender.mock.calls).toEqual([[false], [true]]);

    stop();
    expect(googletag.listeners.size).toBe(0);
  });

  it('tells there is no ad when the ad script does not load', async () => {
    const { loadAdScript, watchAdSlot } = await import('./ad-script');
    const onRender = vi.fn();
    watchAdSlot('camptocamp_htd', onRender);

    loadAdScript();
    adScript()!.dispatchEvent(new Event('error'));
    expect(onRender).toHaveBeenCalledWith(false);

    // a slot shown afterwards is told at once
    const later = vi.fn();
    watchAdSlot('camptocamp_htd', later);
    expect(later).toHaveBeenCalledWith(false);
  });

  it('tells there is no ad when Google Publisher Tag does not load (blocked by address)', async () => {
    const { loadAdScript, watchAdSlot } = await import('./ad-script');
    const onRender = vi.fn();
    watchAdSlot('camptocamp_htd', onRender);
    loadAdScript();
    adScript()!.dispatchEvent(new Event('load'));

    // what the ad script adds to the page; another script of the ad stack failing is not enough
    const addScript = (src: string) => {
      const script = document.createElement('script');
      script.src = src;
      document.head.appendChild(script);
      script.dispatchEvent(new Event('error'));
      script.remove();
    };
    addScript('https://static.admysports.com/hb/lib/prebid/prebidams.js');
    expect(onRender).not.toHaveBeenCalled();
    addScript('https://securepubads.g.doubleclick.net/tag/js/gpt.js');
    expect(onRender).toHaveBeenCalledExactlyOnceWith(false);

    const later = vi.fn();
    watchAdSlot('camptocamp_htd', later);
    expect(later).toHaveBeenCalledWith(false);
  });

  describe('when nothing is told about the slot', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('tells there is no ad 5 s after the ad script has loaded, and still an ad coming later', async () => {
      const { loadAdScript, watchAdSlot } = await import('./ad-script');
      const onRender = vi.fn();
      watchAdSlot('camptocamp_htd', onRender);
      loadAdScript();

      // the time the ad script takes to load does not count
      vi.advanceTimersByTime(10_000);
      expect(onRender).not.toHaveBeenCalled();

      adScript()!.dispatchEvent(new Event('load'));
      vi.advanceTimersByTime(4_999);
      expect(onRender).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onRender).toHaveBeenCalledExactlyOnceWith(false);

      loadGoogleTag().render('camptocamp_htd', false);
      expect(onRender).toHaveBeenLastCalledWith(true);
    });

    it('counts from the call once the ad script has loaded (a new page)', async () => {
      const { loadAdScript, watchAdSlot } = await import('./ad-script');
      loadAdScript();
      adScript()!.dispatchEvent(new Event('load'));
      vi.advanceTimersByTime(60_000);

      const onRender = vi.fn();
      watchAdSlot('camptocamp_htd', onRender);
      vi.advanceTimersByTime(4_999);
      expect(onRender).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onRender).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('does not tell anything more once the slot has been told in time, or once stopped', async () => {
      const { loadAdScript, watchAdSlot } = await import('./ad-script');
      loadAdScript();
      adScript()!.dispatchEvent(new Event('load'));

      const onRender = vi.fn();
      watchAdSlot('camptocamp_htd', onRender);
      const stopped = vi.fn();
      const stop = watchAdSlot('camptocamp_htd', stopped);
      stop();
      loadGoogleTag().render('camptocamp_htd', false);

      vi.advanceTimersByTime(60_000);
      expect(onRender).toHaveBeenCalledExactlyOnceWith(true);
      expect(stopped).not.toHaveBeenCalled();
    });
  });
});
