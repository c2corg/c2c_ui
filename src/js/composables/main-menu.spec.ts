import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useAccountLinks, useMainMenuItems } from './main-menu';

import { ApiData } from '@/js/apis/BaseApi';
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
    expect(keys.account).toContain('moderation');
  });

  it('is shown to a moderator of the forum', () => {
    isForumModerator.value = true;
    const keys = keysFor({ isLogged: true, isModerator: false, id: 1 });
    expect(keys.menu).toContain('moderation');
    expect(keys.account).toContain('moderation');
  });

  it('is hidden from the others, who ask nothing', () => {
    countAccountRemovals.mockClear();
    expect(keysFor({ isLogged: true, isModerator: false, id: 1 }).menu).not.toContain('moderation');
    expect(keysFor({ isLogged: false }).account).not.toContain('moderation');
    expect(countAccountRemovals).not.toHaveBeenCalled();
  });
});
