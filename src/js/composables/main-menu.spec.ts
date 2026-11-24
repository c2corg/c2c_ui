import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useAccountLinks, useMainMenuItems, type MainMenuItem } from './main-menu';

import { ApiData } from '@/js/apis/BaseApi';
import config from '@/js/config';
import { isForumModerator } from '@/stores/forum-role';
import { clearModerationCount } from '@/stores/moderation-count';

const countAccountRemovals = vi.hoisted(() => vi.fn());
vi.mock('@/js/apis/c2c', () => ({ default: { moderator: { countAccountRemovals } } }));
countAccountRemovals.mockImplementation(
  () =>
    new ApiData(
      Promise.resolve({ data: { open: 2, actionable: 1, roles: { topoguide: true, forum: false } } } as never)
    )
);

// the keys of the main menu and of the account links, for a user
const keysFor = (user: { isLogged: boolean; isModerator?: boolean; id?: number }) => {
  let keys: { menu: string[]; account: string[] } = { menu: [], account: [] };
  let badge: () => number | undefined = () => undefined;
  mount(
    defineComponent({
      setup() {
        const items = useMainMenuItems();
        const links = useAccountLinks();
        keys = { menu: items.value.map((i) => i.key), account: links.value.map((l) => l.key) };
        badge = () => items.value.find((i) => i.key === 'moderation')?.badge;
        return () => h('div');
      },
    }),
    {
      global: {
        config: {
          globalProperties: { $gettext: (text: string) => text, $user: user } as never,
        },
      },
    }
  );
  return { ...keys, badge: () => badge() };
};

describe('the moderation link of the menus', () => {
  afterEach(() => {
    isForumModerator.value = false;
    clearModerationCount();
    sessionStorage.clear();
  });

  it('carries the number of requests the moderator can validate', async () => {
    const keys = keysFor({ isLogged: true, isModerator: true, id: 1 });
    await flushPromises();
    expect(keys.badge()).toBe(1);
  });

  it('is shown to a moderator of the topoguide', () => {
    const keys = keysFor({ isLogged: true, isModerator: true, id: 1 });
    expect(keys.menu).toContain('moderation');
    // once: not in the user menu too
    expect(keys.account).not.toContain('moderation');
  });

  it('is shown to a moderator of the forum', () => {
    isForumModerator.value = true;
    const keys = keysFor({ isLogged: true, isModerator: false, id: 1 });
    expect(keys.menu).toContain('moderation');
    // once: not in the user menu too
    expect(keys.account).not.toContain('moderation');
  });

  it('is hidden from the others, who ask nothing', () => {
    countAccountRemovals.mockClear();
    expect(keysFor({ isLogged: true, isModerator: false, id: 1 }).menu).not.toContain('moderation');
    expect(keysFor({ isLogged: false }).account).not.toContain('moderation');
    expect(countAccountRemovals).not.toHaveBeenCalled();
  });
});

describe('the settings and the favourites in the menus', () => {
  // the main menu lists the sections of the site; what belongs to the user is in the user menu
  it('are not in the main menu', () => {
    const keys = keysFor({ isLogged: true, id: 1 });
    expect(keys.menu).not.toContain('offline');
    expect(keys.menu).not.toContain('app-settings');
  });

  // one page each: the former "My preferences" and "My bookmarks" are part of them
  it('are in the user menu, in place of the preferences and the bookmarks', () => {
    const keys = keysFor({ isLogged: true, id: 1 });
    expect(keys.account).toEqual(expect.arrayContaining(['favourites', 'settings']));
    expect(keys.account).not.toContain('preferences');
    expect(keys.account).not.toContain('bookmarks');
  });
});

describe('the map in the main menu', () => {
  afterEach(() => {
    clearModerationCount();
    sessionStorage.clear();
  });

  it('is followed by Metaskirando, before the moderation', () => {
    expect(keysFor({ isLogged: false }).menu.slice(-2)).toEqual(['map', 'metaskirando']);
    expect(keysFor({ isLogged: true, isModerator: true, id: 1 }).menu.slice(-3)).toEqual([
      'map',
      'metaskirando',
      'moderation',
    ]);
  });
});

describe('the Metaskirando entry of the main menu', () => {
  const { urls, isBackendSelectable } = config;
  afterEach(() => {
    config.urls = urls;
    config.isBackendSelectable = isBackendSelectable;
  });

  const entry = () => {
    let found: MainMenuItem | undefined;
    mount(
      defineComponent({
        setup() {
          const items = useMainMenuItems();
          found = items.value.find((i) => i.key === 'metaskirando');
          return () => h('div');
        },
      }),
      { global: { config: { globalProperties: { $gettext: (t: string) => t, $user: { isLogged: false } } as never } } }
    );
    return found;
  };

  it('links the page, with the mountain icon', () => {
    config.urls = { ...urls, name: 'demo' };
    expect(entry()).toMatchObject({ to: { name: 'metaskirando' }, match: ['metaskirando'], icon: 'mountain' });
  });

  it('is hidden on the production backend', () => {
    config.isBackendSelectable = false;
    config.urls = { ...urls, name: 'prod' };
    expect(entry()).toBeUndefined();
  });

  it('is shown on production when the backend can be selected', () => {
    config.isBackendSelectable = true;
    config.urls = { ...urls, name: 'prod' };
    expect(entry()).toBeDefined();
  });
});
