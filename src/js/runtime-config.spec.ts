import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyRuntimeConfig } from './runtime-config';

function buildConfig(overrides: Partial<BuildConfiguration> = {}): BuildConfiguration {
  const url = (name: string, api: string, media: string, forum = ''): UrlsConfiguration => ({
    name,
    api,
    media,
    forum,
    imageBackend: '',
    modernThumbnailsTimestamp: 0,
    modernThumbnailsId: 0,
  });
  const prod = url('prod', 'https://api.example.org', 'https://media.example.org', 'https://f.org');
  const demo = url('demo', 'https://api.demo.example.org', 'https://media.demo.example.org');

  return {
    isBackendSelectable: false,
    ordnanceSurveyApiKey: '',
    addthisPublicId: '',
    googleAnalyticsKey: '',
    publicPath: '/',
    urlsConfigurations: { prod, demo },
    urls: prod,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('applyRuntimeConfig', () => {
  it('keeps the build configuration without runtime configuration', () => {
    const config = buildConfig();

    expect(applyRuntimeConfig(config, undefined).urls).toBe(config.urlsConfigurations.prod);
    expect(applyRuntimeConfig(config, {}).urls).toBe(config.urlsConfigurations.prod);
    expect(applyRuntimeConfig(config, { urls: {} }).urls).toEqual(config.urlsConfigurations.prod);
  });

  it('overrides single urls and keeps the others', () => {
    const config = buildConfig();

    applyRuntimeConfig(config, { urls: { api: 'https://api.test.example.org' } });

    expect(config.urls.api).toBe('https://api.test.example.org');
    expect(config.urls.media).toBe('https://media.example.org');
    expect(config.urls.forum).toBe('https://f.org');
  });

  it('does not modify the shared entries of urlsConfigurations', () => {
    const config = buildConfig();

    applyRuntimeConfig(config, { urls: { api: 'https://api.test.example.org' } });

    expect(config.urlsConfigurations.prod.api).toBe('https://api.example.org');
  });

  it('starts from the requested backend, then applies the overrides', () => {
    const config = buildConfig();

    applyRuntimeConfig(config, { backend: 'demo', urls: { media: 'https://m.test.example.org' } });

    expect(config.urls.name).toBe('demo');
    expect(config.urls.api).toBe('https://api.demo.example.org');
    expect(config.urls.media).toBe('https://m.test.example.org');
  });

  it('warns and keeps the current backend when the requested one does not exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = buildConfig();

    applyRuntimeConfig(config, { backend: 'nope' });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"nope"'));
    expect(config.urls).toBe(config.urlsConfigurations.prod);
  });

  it('is ignored when the user chooses the backend in the interface', () => {
    const config = buildConfig({ isBackendSelectable: true });

    applyRuntimeConfig(config, { backend: 'demo', urls: { api: 'https://api.test.example.org' } });

    expect(config.urls).toBe(config.urlsConfigurations.prod);
  });
});
