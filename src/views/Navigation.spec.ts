import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h, reactive } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import Navigation from './Navigation.vue';

import type { BackendHealth } from '@/js/backend-health';
import config from '@/js/config';

const forumNotifications = reactive({ unread: 0, unreadHighPriority: 0, start: vi.fn(), stop: vi.fn() });
vi.mock('@/stores/forum-notifications', () => ({ useForumNotificationsStore: () => forumNotifications }));

const getBackendHealth = vi.fn<(api: string) => Promise<BackendHealth>>();
vi.mock('@/js/backend-health', () => ({ getBackendHealth: (api: string) => getBackendHealth(api) }));

beforeEach(() => {
  Object.assign(forumNotifications, { unread: 0, unreadHighPriority: 0 });
  vi.clearAllMocks();
});

// an edit page: auth required, its leave guard asks to confirm
const mountNavigation = async (leave = true) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { render: () => h('div') } },
      {
        path: '/routes/edit/12',
        name: 'route-edit',
        meta: { requiresAuth: true },
        component: { render: () => h('div') },
      },
    ],
  });
  router.beforeEach((to, from) => from.name !== 'route-edit' || leave);
  await router.push('/routes/edit/12');

  const user = { isLogged: true, id: 1, forumUsername: 'alice', signout: vi.fn() };
  const wrapper = mount(Navigation, {
    global: {
      plugins: [router],
      directives: { translate: {} },
      stubs: {
        DfmAdLarge: true,
        InputDocument: true,
        DropdownButton: { template: '<div><slot name="button" /><slot /></div>' },
        FaIcon: true,
        RouterLink: true,
        IconHelp: true,
        IconJoinUs: true,
        JoinUsLink: true,
        IconOuting: true,
      },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
          $screen: { isMobile: false, isTablet: false, isDesktop: true },
          $user: user,
          $documentUtils: { getDocumentType: () => 'route', getCreationTitle: (type: string) => type },
          $language: { current: 'fr' },
        } as never,
      },
    },
  });
  return { wrapper, router, user };
};

const signout = (wrapper: Awaited<ReturnType<typeof mountNavigation>>['wrapper']) =>
  wrapper
    .findAll('.dropdown-item')
    .find((link) => link.text().includes('Logout'))!
    .trigger('click');

describe('Navigation', () => {
  it('signs out once it left a page requiring authentication', async () => {
    const { wrapper, router, user } = await mountNavigation(true);

    await signout(wrapper);
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('home');
    expect(user.signout).toHaveBeenCalledOnce();
  });

  // the edit page asks to confirm leaving with unsaved changes
  it('stays signed in when the page is not left', async () => {
    const { wrapper, router, user } = await mountNavigation(false);

    await signout(wrapper);
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('route-edit');
    expect(user.signout).not.toHaveBeenCalled();
  });

  it('follows the forum notifications of the signed in user', async () => {
    const { wrapper, user } = await mountNavigation();
    await flushPromises();

    expect(forumNotifications.start).toHaveBeenCalledWith('alice');

    user.isLogged = false;
    await wrapper.setProps({});
    wrapper.unmount();
    expect(forumNotifications.stop).toHaveBeenCalled();
  });

  it('shows no forum badge nor link without unread notifications', async () => {
    const { wrapper } = await mountNavigation();

    expect(wrapper.find('.forum-badge').exists()).toBe(false);
    expect(wrapper.find('.forum-link').exists()).toBe(false);
  });

  it('shows the unread forum notifications on the avatar and in the menu', async () => {
    Object.assign(forumNotifications, { unread: 12, unreadHighPriority: 2 });
    const { wrapper } = await mountNavigation();
    await flushPromises();

    expect(wrapper.findAll('.forum-badge.is-on-avatar').map((badge) => [badge.classes(), badge.text()])).toEqual([
      [expect.arrayContaining(['is-messages']), '2'],
      [expect.arrayContaining(['is-notifications']), '9+'],
    ]);
    expect(
      wrapper.findAll('a.forum-link').map((link) => [link.attributes('href'), link.attributes('target'), link.text()])
    ).toEqual([
      ['https://forum.camptocamp.org/u/alice/messages', '_blank', 'Forum messages 2'],
      ['https://forum.camptocamp.org/u/alice/notifications', '_blank', 'Forum notifications 12'],
    ]);
  });

  it('shows only the forum counts that are not zero', async () => {
    Object.assign(forumNotifications, { unread: 3, unreadHighPriority: 0 });
    const { wrapper } = await mountNavigation();
    await flushPromises();

    expect(wrapper.findAll('.forum-badge.is-on-avatar').map((badge) => badge.text())).toEqual(['3']);
    expect(wrapper.findAll('a.forum-link').map((link) => link.text())).toEqual(['Forum notifications 3']);
  });

  describe('backend drop-down', () => {
    const backends = () => Object.values(config.urlsConfigurations);
    const versions = (wrapper: Awaited<ReturnType<typeof mountNavigation>>['wrapper']) =>
      wrapper.findAll('.backend-menu .dropdown-item').map((item) => {
        const version = item.find('.backend-version');
        return version.exists()
          ? [version.text(), version.attributes('title') ?? null, version.classes('has-text-danger')]
          : null;
      });

    it('fetches the health of the backends only when opened', async () => {
      getBackendHealth.mockResolvedValue({ ok: true, label: '96def4e' });
      const { wrapper } = await mountNavigation();
      await flushPromises();

      expect(backends().length).toBeGreaterThan(1);
      expect(getBackendHealth).not.toHaveBeenCalled();
      expect(versions(wrapper).every((version) => version === null)).toBe(true);

      await wrapper.find('.backend-menu').trigger('mouseenter');
      await flushPromises();

      expect(getBackendHealth.mock.calls.map(([api]) => api)).toEqual(backends().map(({ api }) => api));
      expect(versions(wrapper).every((version) => version?.[0] === '96def4e')).toBe(true);
    });

    it('shows the version, the commit date as tooltip, or the error in red', async () => {
      const [first, second, ...others] = backends();
      getBackendHealth.mockImplementation(async (api) => {
        if (api === first.api) {
          return { ok: true, label: 'v6.2.0-12-g96def4e', commitDate: '2026-11-20T10:00:00Z' };
        }
        if (api === second.api) {
          return { ok: false, error: 'http', status: 429 };
        }
        return { ok: false, error: 'timeout' };
      });
      const { wrapper } = await mountNavigation();

      await wrapper.find('.backend-menu').trigger('focusin');
      await flushPromises();

      expect(versions(wrapper)).toEqual([
        ['v6.2.0-12-g96def4e', '2026-11-20T10:00:00Z', false],
        ['HTTP 429', null, true],
        ...others.map(() => ['timeout', null, true]),
      ]);
    });
  });
});
