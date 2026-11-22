import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import App from './App.vue';

const page = { render: () => h('div') };

// window.matchMedia for a window this wide: the screen and app settings stores read it (no dark scheme)
const screenWidth = (width: number) =>
  vi.stubGlobal('matchMedia', (query: string) => {
    const min = query.match(/min-width: (\d+)px/);
    const max = query.match(/max-width: (\d+)px/);
    return {
      matches: (!!min || !!max) && (!min || width >= Number(min[1])) && (!max || width <= Number(max[1])),
      addEventListener() {},
    };
  });

const mountApp = async (path = '/routes', { screen = 'isWidescreen' } = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: page },
      { path: '/routes', name: 'routes', component: page },
      { path: '/routes/:id', name: 'route', component: page },
      { path: '/routes/edit/:id', name: 'route-edit', component: page },
      { path: '/outings', name: 'outings', component: page },
    ],
  });
  await router.push(path);

  const wrapper = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [router],
      // the windows, menus and banners of the app, stubbed
      stubs: {
        SideMenu: true,
        Navigation: true,
        DfmAdSmall: true,
        SiteNotice: true,
        ImageViewer: true,
        HelperWindow: true,
        AlertWindow: true,
        GdprBanner: true,
        MobileTopBar: true,
        MobileMenu: true,
        BottomNav: true,
        OnboardingTour: true,
        PullToRefresh: true,
        DeviceFavouritesPrompt: true,
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
    screenWidth(1280);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('hides the splash screen once mounted', async () => {
    await mountApp();

    expect(document.getElementById('splashscreen')!.style.display).toBe('none');
  });

  it('shows the top ad on the views of the documents only, in the navigation on large screens', async () => {
    const topAd = async (path: string, screen = 'isWidescreen') => {
      const { wrapper } = await mountApp(path, { screen });
      return { classes: wrapper.classes(), band: wrapper.findComponent({ name: 'DfmAdSmall' }).exists() };
    };

    expect(await topAd('/routes/1')).toEqual({ classes: ['nav-dfm'], band: false });
    expect(await topAd('/routes/1', 'isMobile')).toEqual({ classes: [], band: true });
    expect(await topAd('/routes/1', 'isDesktop')).toEqual({ classes: [], band: true });

    // the home page has its own, the lists, the edition... none
    expect(await topAd('/')).toEqual({ classes: ['home-topoguide', 'no-top-ad', 'is-menu-pinned'], band: false });
    for (const path of ['/routes', '/routes/edit/1', '/outings']) {
      expect(await topAd(path)).toEqual({ classes: ['no-top-ad'], band: false });
      expect(await topAd(path, 'isMobile')).toEqual({ classes: ['no-top-ad'], band: false });
    }
  });

  it('shows the bars of the app on a phone held upright only', async () => {
    // the layout follows the width (src/stores/app-settings.ts): a phone on its side
    screenWidth(640);
    let { wrapper } = await mountApp();
    expect(wrapper.findComponent({ name: 'MobileTopBar' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'BottomNav' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'MobileMenu' }).exists()).toBe(false);
    // the welcome page leaves the menu a rail: kept open, it would squeeze the page
    ({ wrapper } = await mountApp('/'));
    expect(wrapper.classes()).not.toContain('is-menu-pinned');

    // a phone held upright, with a new store reading it
    screenWidth(390);
    setActivePinia(createPinia());
    ({ wrapper } = await mountApp());
    expect(wrapper.findComponent({ name: 'MobileTopBar' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'BottomNav' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'MobileMenu' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'OnboardingTour' }).exists()).toBe(true);
  });
});
