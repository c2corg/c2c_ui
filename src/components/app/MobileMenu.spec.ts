import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import MobileMenu from './MobileMenu.vue';

import { useMobileMenuStore } from '@/stores/mobile-menu';

const page = { render: () => h('div') };

const mountMenu = async (isLogged = false) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/other', component: page },
      // the entries of the menu: a plain link (Itinevert) resolves its route. The forum is another site
      ...['topoguide', 'outings', 'articles', 'itinevert', 'serac', 'yeti', 'settings'].map((name) => ({
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
      // no moderation entry: a visitor, or a user without a moderation role
      config: { globalProperties: { $gettext: (text: string) => text, $user: { isLogged } } as never },
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

  it('has Settings, with the language, only logged out: logged in, the Me page leads there', async () => {
    const keys = async (isLogged: boolean) => {
      const { wrapper } = await mountMenu(isLogged);
      useMobileMenuStore().toggle();
      await flushPromises();
      const items = wrapper.findComponent({ name: 'MenuEntries' }).props('items') as { key: string }[];
      wrapper.unmount();
      return items.map((item) => item.key);
    };

    expect(await keys(false)).toContain('settings');
    expect(await keys(true)).not.toContain('settings');
  });
});
