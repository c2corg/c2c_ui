import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import Navigation from './Navigation.vue';

// an edit page: auth required, its leave guard asks to confirm
const mountNavigation = async (leave: boolean) => {
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
});
