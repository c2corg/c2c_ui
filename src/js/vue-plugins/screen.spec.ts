import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';

import screen from './screen';

// a window.matchMedia whose width can change, with the change listeners of the media query lists
const fakeScreen = (initialWidth: number) => {
  let width = initialWidth;
  const lists: { fire: () => void }[] = [];
  vi.stubGlobal('matchMedia', (query: string) => {
    const maxWidth = Number(query.match(/max-width: (\d+)px/)![1]);
    const listeners: (() => void)[] = [];
    const list = {
      get matches() {
        return width <= maxWidth;
      },
      addEventListener: (type: string, listener: () => void) => listeners.push(listener),
      removeEventListener: vi.fn(),
      fire: () => listeners.forEach((listener) => listener()),
    };
    lists.push(list);
    return list;
  });
  return {
    resize(newWidth: number) {
      width = newWidth;
      lists.forEach((list) => list.fire());
    },
  };
};

const installScreen = () => {
  const app = createApp({});
  app.use(screen);
  return app.config.globalProperties;
};

describe('$screen', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [375, 'isMobile'],
    [768, 'isMobile'],
    [800, 'isTablet'],
    [1100, 'isDesktop'],
    [1300, 'isWidescreen'],
    [1600, 'isFullHD'],
  ])('at %ipx, only %s is true', (width, expected) => {
    fakeScreen(width);
    const { $screen } = installScreen();

    const flags = ['isMobile', 'isTablet', 'isDesktop', 'isWidescreen', 'isFullHD'] as const;
    expect(flags.filter((flag) => $screen[flag])).toEqual([expected]);
  });

  it('follows the window size, and updates the components using it', async () => {
    const browser = fakeScreen(1600);
    const wrapper = mount(
      defineComponent({
        render() {
          return h('p', this.$screen.isMobile ? 'mobile' : 'large');
        },
      }),
      { global: { plugins: [screen] } }
    );
    expect(wrapper.text()).toBe('large');

    browser.resize(400);
    await nextTick();

    expect(wrapper.vm.$screen.isMobile).toBe(true);
    expect(wrapper.text()).toBe('mobile');
  });
});
