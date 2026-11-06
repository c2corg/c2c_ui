import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSettingsStore } from './app-settings';

import { getPreferences } from '@/js/vue-plugins/local-storage';

// window.matchMedia answering the dark scheme and the desktop width, which a test can change
const fakeMedia = (initial: { dark: boolean; desktop: boolean }) => {
  const current = { ...initial };
  const listeners: Record<string, ((event: { matches: boolean }) => void)[]> = {};
  vi.stubGlobal('matchMedia', (query: string) => {
    const key = query.includes('prefers-color-scheme') ? 'dark' : 'desktop';
    return {
      get matches() {
        return current[key];
      },
      addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) =>
        (listeners[key] ??= []).push(listener),
    };
  });
  return {
    set(key: 'dark' | 'desktop', value: boolean) {
      current[key] = value;
      listeners[key]?.forEach((listener) => listener({ matches: value }));
    },
  };
};

const html = () => document.documentElement;

describe('app settings', () => {
  // the preferences object is cached for the page: read the storage again after changing it
  const resetStorage = (stored?: object) => {
    window.localStorage.clear();
    if (stored) {
      window.localStorage.setItem('AppSettings.preferences', JSON.stringify(stored));
    }
    getPreferences('AppSettings').reload();
  };

  beforeEach(() => resetStorage());
  afterEach(() => vi.unstubAllGlobals());

  it('defaults to auto, followed from the system and the screen', () => {
    const media = fakeMedia({ dark: false, desktop: false });
    const settings = useAppSettingsStore();

    expect(settings.theme).toBe('auto');
    expect(html().getAttribute('data-theme')).toBe('light');
    expect(html().getAttribute('data-shell')).toBe('mobile');
    expect(html().getAttribute('data-text-size')).toBe('normal');

    media.set('dark', true);
    expect(html().getAttribute('data-theme')).toBe('dark');

    media.set('desktop', true);
    expect(html().getAttribute('data-shell')).toBe('desktop');
    expect(settings.isMobileShell).toBe(false);
    // the theme is the same in both layouts
    expect(html().getAttribute('data-theme')).toBe('dark');
  });

  it('keeps an explicit theme whatever the system says, and remembers it', () => {
    const media = fakeMedia({ dark: true, desktop: false });
    const settings = useAppSettingsStore();
    settings.setTheme('light');
    // what the page reads follows the change (a getter would be copied once by Pinia)
    expect(settings.theme).toBe('light');
    media.set('dark', true);
    expect(html().getAttribute('data-theme')).toBe('light');

    const stored = JSON.parse(window.localStorage.getItem('AppSettings.preferences')!);
    expect(stored).toMatchObject({ theme: 'light' });
  });

  it('takes its layout from the width only, whatever a former version stored', () => {
    resetStorage({ shellMode: 'desktop' });
    const media = fakeMedia({ dark: false, desktop: false });
    const settings = useAppSettingsStore();
    expect(settings.isMobileShell).toBe(true);
    expect(html().getAttribute('data-shell')).toBe('mobile');

    media.set('desktop', true);
    expect(html().getAttribute('data-shell')).toBe('desktop');
  });

  it('ignores a stored value it does not know', () => {
    fakeMedia({ dark: false, desktop: false });
    resetStorage({ theme: 'purple', textSize: 'large', units: 'cubits' });
    const settings = useAppSettingsStore();
    expect(settings.theme).toBe('auto');
    expect(settings.textSize).toBe('large');
    expect(settings.units).toBe('metric');
  });

  it('remembers the units chosen', () => {
    fakeMedia({ dark: false, desktop: false });
    const settings = useAppSettingsStore();
    settings.setUnits('imperial');
    expect(settings.units).toBe('imperial');
    expect(JSON.parse(window.localStorage.getItem('AppSettings.preferences')!).units).toBe('imperial');
  });
});
