import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import BottomNav from './BottomNav.vue';

import config from '@/js/config';
import { useForumNotificationsStore } from '@/stores/forum-notifications';

const page = { render: () => h('div') };

const mountNav = async (user: { isLogged: boolean; forumUsername: string | null }) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['home', 'topoguide', 'offline'].map((name) => ({ path: `/${name}`, name, component: page })),
  });
  await router.push('/home');
  const wrapper = mount(BottomNav, {
    global: {
      plugins: [router],
      stubs: { FaIcon: true },
      config: { globalProperties: { $gettext: (text: string) => text, $user: user } as never },
    },
  });
  await vi.dynamicImportSettled();
  await flushPromises();
  return wrapper;
};

const forumTab = (wrapper: Awaited<ReturnType<typeof mountNav>>) =>
  wrapper.findAll('a.bottom-nav-link').find((link) => link.text().includes('Forum'))!;

describe('BottomNav', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('links the forum tab to the forum itself, without a badge for visitors', async () => {
    const wrapper = await mountNav({ isLogged: false, forumUsername: null });

    expect(forumTab(wrapper).attributes('href')).toBe(config.urls.forum);
    expect(forumTab(wrapper).find('.bottom-nav-badge').exists()).toBe(false);
  });

  it.each([
    { unread: 0, unreadHighPriority: 0, text: null, kind: null },
    { unread: 3, unreadHighPriority: 0, text: '3', kind: 'is-forum-notifications' },
    { unread: 3, unreadHighPriority: 2, text: '2', kind: 'is-forum-messages' },
    { unread: 23, unreadHighPriority: 0, text: '9+', kind: 'is-forum-notifications' },
  ])('shows $unread notifications and $unreadHighPriority messages as $text', async (counts) => {
    const wrapper = await mountNav({ isLogged: true, forumUsername: 'lionel' });
    useForumNotificationsStore().$patch({ unread: counts.unread, unreadHighPriority: counts.unreadHighPriority });
    await flushPromises();

    const badge = forumTab(wrapper).find('.bottom-nav-badge');
    expect(forumTab(wrapper).attributes('href')).toBe(config.urls.forum);
    if (counts.text === null) {
      expect(badge.exists()).toBe(false);
    } else {
      expect(badge.text()).toBe(counts.text);
      expect(badge.classes()).toContain(counts.kind);
    }
  });
});
