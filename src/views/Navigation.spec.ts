import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h, reactive } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import Navigation from './Navigation.vue';

import c2c from '@/js/apis/c2c';

const forumNotifications = reactive({ unread: 0, unreadHighPriority: 0, start: vi.fn(), stop: vi.fn() });
vi.mock('@/stores/forum-notifications', () => ({ useForumNotificationsStore: () => forumNotifications }));

beforeEach(() => {
  Object.assign(forumNotifications, { unread: 0, unreadHighPriority: 0 });
  vi.clearAllMocks();
});

// an edit page: auth required, its leave guard asks to confirm
const mountNavigation = async (leave = true, roles: Record<string, boolean> = {}) => {
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

  const user = { isLogged: true, id: 1, forumUsername: 'alice', signout: vi.fn(), ...roles };
  const wrapper = mount(Navigation, {
    global: {
      plugins: [router],
      directives: { translate: {} },
      stubs: {
        DfmAdLarge: true,
        InputDocument: true,
        DropdownButton: { template: '<div><slot name="button" /><slot /></div>' },
        FaIcon: true,
        RouterLink: { template: '<a><slot /></a>' },
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
    .findAll('a.dropdown-item')
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

  describe('account removals', () => {
    it.each([
      ['a moderator of the topoguide', { isModerator: true, canManageRemovals: true }],
      ['a moderator of the forum only', { isModerator: false, canManageRemovals: true }],
    ])('are in the menu, with the number of those in progress, for %s', async (_name, roles) => {
      const count = vi.spyOn(c2c.moderator, 'countAccountRemovals').mockResolvedValue({ data: { open: 2 } } as never);
      const { wrapper } = await mountNavigation(true, roles);
      await flushPromises();

      expect(count).toHaveBeenCalled();
      expect(wrapper.find('.removals-badge').exists()).toBe(true);
      expect(wrapper.text()).toContain('Account removals');
    });

    it('are not for the others', async () => {
      const count = vi.spyOn(c2c.moderator, 'countAccountRemovals');
      const { wrapper } = await mountNavigation(true, { isModerator: false, canManageRemovals: false });
      await flushPromises();

      expect(count).not.toHaveBeenCalled();
      expect(wrapper.find('.removals-badge').exists()).toBe(false);
      expect(wrapper.text()).not.toContain('Account removals');
    });
  });

  it('shows only the forum counts that are not zero', async () => {
    Object.assign(forumNotifications, { unread: 3, unreadHighPriority: 0 });
    const { wrapper } = await mountNavigation();
    await flushPromises();

    expect(wrapper.findAll('.forum-badge.is-on-avatar').map((badge) => badge.text())).toEqual(['3']);
    expect(wrapper.findAll('a.forum-link').map((link) => link.text())).toEqual(['Forum notifications 3']);
  });
});
