import { afterEach, describe, expect, it, vi } from 'vitest';

import { BACKEND_SESSION_KEY, selectBackend, urlWithBackend } from './backend-selection';

function buildConfig(): BuildConfiguration {
  const url = (name: string): UrlsConfiguration => ({
    name,
    api: `https://api.${name}.example.org`,
    media: '',
    forum: '',
    imageBackend: '',
    modernThumbnailsTimestamp: 0,
    modernThumbnailsId: 0,
  });
  const prod = url('prod');
  return {
    isBackendSelectable: true,
    ordnanceSurveyApiKey: '',
    googleAnalyticsKey: '',
    publicPath: '/',
    urlsConfigurations: { prod, demo: url('demo'), localhost: url('localhost') },
    urls: prod,
  };
}

function session(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
    items,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('selectBackend', () => {
  it('uses the default of the build without choice', () => {
    expect(selectBackend(buildConfig(), '', session())).toBe('prod');
  });

  it('prefers the choice of the tab over the default of the build', () => {
    expect(selectBackend(buildConfig(), '', session({ [BACKEND_SESSION_KEY]: 'demo' }))).toBe('demo');
  });

  it('prefers ?backend= over the choice of the tab, and keeps it in the tab', () => {
    const store = session({ [BACKEND_SESSION_KEY]: 'demo' });
    expect(selectBackend(buildConfig(), '?id=1&backend=localhost', store)).toBe('localhost');
    expect(store.items.get(BACKEND_SESSION_KEY)).toBe('localhost');
  });

  it('ignores the inherited names of the configurations', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = session();
    expect(selectBackend(buildConfig(), '?backend=constructor', store)).toBe('prod');
    expect(store.items.size).toBe(0);
  });

  it('uses ?backend= even when the tab cannot keep it', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = {
      ...session(),
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    };
    expect(selectBackend(buildConfig(), '?backend=demo', store)).toBe('demo');
  });

  it('ignores an unknown backend, and forgets it in the tab', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(selectBackend(buildConfig(), '?backend=nope', session({ [BACKEND_SESSION_KEY]: 'demo' }))).toBe('demo');

    const store = session({ [BACKEND_SESSION_KEY]: 'gone' });
    expect(selectBackend(buildConfig(), '', store)).toBe('prod');
    expect(store.items.has(BACKEND_SESSION_KEY)).toBe(false);
  });
});

describe('urlWithBackend', () => {
  it('sets ?backend= before the hash route of GitHub Pages', () => {
    expect(urlWithBackend('https://c2corg.github.io/c2c_ui/b/?backend=demo#/routes/1?x=1', 'prod')).toBe(
      'https://c2corg.github.io/c2c_ui/b/?backend=prod#/routes/1?x=1'
    );
  });
});
