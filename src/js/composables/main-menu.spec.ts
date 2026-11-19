import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { useAccountLinks, useMainMenuItems } from './main-menu';

import { isForumModerator } from '@/stores/forum-role';

// the keys of the main menu and of the account links, for a user
const keysFor = (user: { isLogged: boolean; isModerator?: boolean; id?: number }) => {
  let keys: { menu: string[]; account: string[] } = { menu: [], account: [] };
  mount(
    defineComponent({
      setup() {
        const items = useMainMenuItems();
        const links = useAccountLinks();
        keys = { menu: items.value.map((i) => i.key), account: links.value.map((l) => l.key) };
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
  return keys;
};

describe('the moderation link of the menus', () => {
  afterEach(() => {
    isForumModerator.value = false;
  });

  it('is shown to a moderator of the topoguide', () => {
    const keys = keysFor({ isLogged: true, isModerator: true, id: 1 });
    expect(keys.menu).toContain('moderation');
    expect(keys.account).toContain('moderation');
  });

  it('is shown to a moderator of the forum', () => {
    isForumModerator.value = true;
    const keys = keysFor({ isLogged: true, isModerator: false, id: 1 });
    expect(keys.menu).toContain('moderation');
    expect(keys.account).toContain('moderation');
  });

  it('is hidden from the others', () => {
    expect(keysFor({ isLogged: true, isModerator: false, id: 1 }).menu).not.toContain('moderation');
    expect(keysFor({ isLogged: false }).account).not.toContain('moderation');
  });
});
