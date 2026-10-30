import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(dir, entry.name))
      : /\.(js|ts|vue)$/.test(entry.name)
        ? [join(dir, entry.name)]
        : []
  );

// the preferences each component reads and writes, as existing users have them in their browser
const STORED_UNDER: Record<string, string> = {
  'src/components/itinevert/ItinevertResultView.vue': 'ItinevertResultView',
  'src/components/yeti/SubPanelLayers.vue': 'Yeti',
  'src/components/yeti/YetiMap.vue': 'Yeti',
  'src/components/yeti/map-layers/BaseLayers.vue': 'Yeti',
  'src/components/yeti/map-layers/SlopesLayers.vue': 'Yeti',
  'src/views/SiteNotice.vue': 'SiteNotice',
  'src/views/documents/DocumentsView.vue': 'DocumentsView',
  'src/views/portals/ItinevertView.vue': 'ItinevertView',
  'src/views/portals/HomeView.vue': 'HomeView',
  'src/views/portals/YetiView.vue': 'Yeti',
  'src/views/portals/utils/BoardAnnoucementWidget.vue': 'BoardAnnouncementWidget',
};

// the name a component's preferences are stored under: its own name with this.$localStorage, the one it passes to
// getPreferences() otherwise
const storageName = (source: string) =>
  source.includes('$localStorage')
    ? source.match(/\n {2}name: '([^']+)'/)![1]
    : source.match(/getPreferences\('([^']+)'\)/)?.[1];

describe('local storage', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
  });

  it('reads and writes preferences under "<name>.preferences"', async () => {
    window.localStorage.setItem('HomeView.preferences', JSON.stringify({ feed: true }));
    const { getPreferences } = await import('./local-storage');

    const preferences = getPreferences('HomeView');
    expect(preferences.get('feed')).toBe(true);
    expect(preferences.get('isPersonal', false)).toBe(false);

    preferences.set('isPersonal', true);
    expect(JSON.parse(window.localStorage.getItem('HomeView.preferences')!)).toEqual({ feed: true, isPersonal: true });
  });

  it('starts empty from what is not a preferences record', async () => {
    window.localStorage.setItem('Yeti.preferences', 'null');
    window.localStorage.setItem('HomeView.preferences', '[1, 2]');
    window.localStorage.setItem('SiteNotice.preferences', '{not json');
    const { getPreferences } = await import('./local-storage');

    for (const name of ['Yeti', 'HomeView', 'SiteNotice']) {
      expect(getPreferences(name).get('anything')).toBeUndefined();
      expect(getPreferences(name).get('anything', 'default')).toBe('default');
    }
    getPreferences('Yeti').set('yeti-disclaimer', 'validated');
    expect(JSON.parse(window.localStorage.getItem('Yeti.preferences')!)).toEqual({ 'yeti-disclaimer': 'validated' });
  });

  it('gives the same preferences to everyone using a name', async () => {
    const { getPreferences } = await import('./local-storage');

    getPreferences('Yeti').set('yeti-disclaimer', 'validated');

    expect(getPreferences('Yeti').get('yeti-disclaimer')).toBe('validated');
  });

  it('keeps each component on the preferences existing users have', () => {
    const used = Object.fromEntries(
      Object.keys(STORED_UNDER).map((file) => [file, storageName(readFileSync(file, 'utf8'))])
    );

    expect(used).toEqual(STORED_UNDER);
  });

  it('is not reached through this.$localStorage, which gets the wrong this in Vue 3', () => {
    // Vue 3 reads Vue.prototype getters on app.config.globalProperties: `this` is not the component any more
    const uses = sourceFiles('src').filter(
      (file) => !file.endsWith('local-storage.spec.ts') && readFileSync(file, 'utf8').includes('$localStorage')
    );

    expect(uses).toEqual([]);
  });
});
