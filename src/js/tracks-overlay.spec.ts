import { afterEach, describe, expect, it, vi } from 'vitest';

// the module reads the runtime configuration once, when it is loaded
const load = async (runtime?: { tracksOverlay?: boolean }) => {
  vi.resetModules();
  window.CAMPTOCAMP_RUNTIME_CONFIG = runtime;
  return (await import('./tracks-overlay')).tracksOverlayEnabled;
};

describe('tracksOverlayEnabled', () => {
  afterEach(() => {
    window.CAMPTOCAMP_RUNTIME_CONFIG = undefined;
  });

  it('is on by default', async () => {
    expect(await load()).toBe(true);
    expect(await load({})).toBe(true);
  });

  it('is off when the container turned it off', async () => {
    expect(await load({ tracksOverlay: false })).toBe(false);
  });
});
