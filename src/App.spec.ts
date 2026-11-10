import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import App from './App.vue';

const page = { render: () => h('div') };

const mountApp = async (path = '/routes', { width = 1300, screen = 'isWidescreen' } = {}) => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(width);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/routes', component: page },
      { path: '/outings', component: page },
    ],
  });
  await router.push(path);

  const wrapper = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [router],
      // the windows, menus and banners of the app, stubbed: Navigation emits toggle-side-menu
      stubs: {
        SideMenu: true,
        Navigation: { name: 'Navigation', template: '<nav />', emits: ['toggle-side-menu'] },
        DfmAdSmall: true,
        SiteNotice: true,
        ImageViewer: true,
        HelperWindow: true,
        AlertWindow: true,
        GdprBanner: true,
      },
      config: { globalProperties: { $screen: { [screen]: true } } as never },
    },
  });
  await flushPromises();
  return { wrapper, router };
};

describe('App', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="splashscreen"></div>';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hides the splash screen once mounted', async () => {
    await mountApp();

    expect(document.getElementById('splashscreen')!.style.display).toBe('none');
  });

  it.each([
    [400, 'mobile'],
    [900, 'tablet'],
    [1300, 'desktop'],
  ])('at %ipx wide, sets the width to %s', async (width, expected) => {
    const { wrapper } = await mountApp('/routes', { width });

    expect(wrapper.attributes('data-width')).toBe(expected);
  });

  it('follows the window resizes', async () => {
    const { wrapper } = await mountApp('/routes', { width: 1300 });

    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(400);
    window.dispatchEvent(new Event('resize'));

    expect(wrapper.attributes('data-width')).toBe('mobile');
  });

  it('opens the side menu from the navigation, and closes it on the next page', async () => {
    const { wrapper, router } = await mountApp();

    wrapper.findComponent({ name: 'Navigation' }).vm.$emit('toggle-side-menu');
    await flushPromises();
    expect(wrapper.find('.alternative-side-menu').exists()).toBe(true);
    expect(wrapper.find('.alternative-side-menu-shader').exists()).toBe(true);

    await router.push('/outings');
    await flushPromises();

    expect(wrapper.find('.alternative-side-menu').exists()).toBe(false);
  });

  it('tells the home page from the others, and leaves room for the ad on large screens', async () => {
    expect((await mountApp('/')).wrapper.classes()).toEqual(['home-topoguide']);
    expect((await mountApp('/routes')).wrapper.classes()).toEqual(['nav-dfm']);
    expect((await mountApp('/routes', { screen: 'isMobile' })).wrapper.classes()).toEqual([]);
  });
});
