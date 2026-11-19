import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import MobileMenu from './MobileMenu.vue';

import { useMobileMenuStore } from '@/stores/mobile-menu';

const page = { render: () => h('div') };

const mountMenu = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/other', component: page },
      // the entries of the menu: a plain link (Itinevert) resolves its route. The forum is another site
      ...['topoguide', 'outings', 'serac', 'articles', 'yeti', 'itinevert', 'offline', 'app-settings'].map((name) => ({
        path: `/${name}`,
        name,
        component: page,
      })),
    ],
  });
  await router.push('/');
  const wrapper = mount(MobileMenu, {
    attachTo: document.body,
    global: {
      plugins: [router],
      stubs: { RouterLink: true, FaIcon: true, MenuFooter: true },
      // a visitor: the menu has no moderation entry
      config: { globalProperties: { $gettext: (text: string) => text, $user: { isLogged: false } } as never },
    },
  });
  return { wrapper, router };
};

describe('MobileMenu', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('is there only while the menu is open, with the entries of the side menu and its footer', async () => {
    const { wrapper } = await mountMenu();
    expect(wrapper.find('#mobile-menu').exists()).toBe(false);

    useMobileMenuStore().toggle();
    await flushPromises();

    expect(wrapper.find('#mobile-menu').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'MenuEntries' }).props('items').length).toBeGreaterThan(5);
    expect(wrapper.findComponent({ name: 'MenuFooter' }).exists()).toBe(true);
  });

  it('closes with the page and with Escape', async () => {
    const { wrapper, router } = await mountMenu();
    const menu = useMobileMenuStore();

    menu.toggle();
    await router.push('/other');
    await flushPromises();
    expect(menu.isOpen).toBe(false);

    menu.toggle();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await flushPromises();
    expect(menu.isOpen).toBe(false);
    expect(wrapper.find('#mobile-menu').exists()).toBe(false);
  });

  it('closes on a link, also the one of the page already shown, but not elsewhere in the panel', async () => {
    const { wrapper } = await mountMenu();
    const menu = useMobileMenuStore();

    menu.toggle();
    await flushPromises();
    await wrapper.find('#mobile-menu').trigger('click');
    expect(menu.isOpen).toBe(true);

    // the plain link of Itinevert: the route does not change
    await wrapper.find('#mobile-menu a[href="/itinevert"]').trigger('click');
    await flushPromises();
    expect(menu.isOpen).toBe(false);
  });
});
