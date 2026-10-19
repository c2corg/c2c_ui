import { createLocalVue, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import screen from './screen';

// a window.matchMedia whose width can change, with the change listeners of the media query lists
const fakeScreen = (initialWidth) => {
  let width = initialWidth;
  const lists = [];
  vi.stubGlobal('matchMedia', (query) => {
    const maxWidth = Number(query.match(/max-width: (\d+)px/)[1]);
    const listeners = [];
    const list = {
      get matches() {
        return width <= maxWidth;
      },
      addEventListener: (type, listener) => listeners.push(listener),
      removeEventListener: vi.fn(),
      fire: () => listeners.forEach((listener) => listener()),
    };
    lists.push(list);
    return list;
  });
  return {
    resize(newWidth) {
      width = newWidth;
      lists.forEach((list) => list.fire());
    },
  };
};

const installScreen = () => {
  const localVue = createLocalVue();
  localVue.use(screen);
  return localVue;
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
    const { $screen } = installScreen().prototype;

    const flags = ['isMobile', 'isTablet', 'isDesktop', 'isWidescreen', 'isFullHD'];
    expect(flags.filter((flag) => $screen[flag])).toEqual([expected]);
  });

  it('follows the window size, and updates the components using it', async () => {
    const browser = fakeScreen(1600);
    const localVue = installScreen();
    const wrapper = mount(
      { render: (h) => h('p', localVue.prototype.$screen.isMobile ? 'mobile' : 'large') },
      { localVue }
    );
    expect(wrapper.text()).toBe('large');

    browser.resize(400);
    await nextTick();

    expect(localVue.prototype.$screen.isMobile).toBe(true);
    expect(wrapper.text()).toBe('mobile');
  });
});
