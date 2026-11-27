import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import DropdownButton from './DropdownButton.vue';

const VIEWPORT_WIDTH = 400;
const BUTTON_WIDTH = 40;

let viewportWidth = VIEWPORT_WIDTH;
let resizeCallbacks: (() => void)[] = [];

// jsdom has no layout: the button and its menu get the boxes they would have in a browser
const mountDropdown = ({
  buttonLeft,
  menuWidth,
  isRight = false,
}: {
  buttonLeft: number;
  menuWidth: number;
  isRight?: boolean;
}) => {
  const wrapper = mount(DropdownButton, {
    attrs: { class: isRight ? 'is-right' : '' },
    slots: { button: '<span>button</span>', default: '<div>item</div>' },
    attachTo: document.body,
  });
  const menu = wrapper.find('.dropdown-menu').element as HTMLElement;
  const buttonRight = buttonLeft + BUTTON_WIDTH;
  // where the CSS puts the menu, moved by the shift of the component
  const menuLeft = () => (isRight ? buttonRight - menuWidth : buttonLeft) + shiftOf(menu);
  vi.spyOn(wrapper.find('.dropdown-trigger').element, 'getBoundingClientRect').mockReturnValue({
    left: buttonLeft,
    right: buttonRight,
    width: BUTTON_WIDTH,
  } as DOMRect);
  vi.spyOn(menu, 'getBoundingClientRect').mockImplementation(
    () => ({ left: menuLeft(), right: menuLeft() + menuWidth, width: menuWidth }) as DOMRect
  );
  const open = async () => {
    await wrapper.find('.dropdown-trigger').trigger('click');
    await nextTick();
    await nextTick();
  };
  return { wrapper, menuLeft, open };
};

const shiftOf = (menu: HTMLElement) => Number(/translateX\((-?[\d.]+)px\)/.exec(menu.style.transform)?.[1] ?? 0);

const openMenu = async (options: { buttonLeft: number; menuWidth: number; isRight?: boolean }) => {
  const { wrapper, menuLeft, open } = mountDropdown(options);
  await open();
  const left = menuLeft();
  wrapper.unmount();
  return left;
};

describe('DropdownButton', () => {
  beforeEach(() => {
    viewportWidth = VIEWPORT_WIDTH;
    resizeCallbacks = [];
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockImplementation(() => viewportWidth);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resizeCallbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens the menu on the left edge of its button when it fits', async () => {
    expect(await openMenu({ buttonLeft: 100, menuWidth: 200 })).toBe(100);
  });

  it('opens the menu on the right edge of its button when it overflows on the right', async () => {
    // 300 + 200 > 400 - 8: aligned on the right edge of the button (340)
    expect(await openMenu({ buttonLeft: 300, menuWidth: 200 })).toBe(140);
  });

  it('keeps a menu with is-right on the right edge of its button when it fits', async () => {
    expect(await openMenu({ buttonLeft: 300, menuWidth: 200, isRight: true })).toBe(140);
  });

  it('opens a menu with is-right on the left edge of its button when it overflows on the left', async () => {
    expect(await openMenu({ buttonLeft: 20, menuWidth: 200, isRight: true })).toBe(20);
  });

  it('puts a menu fitting under neither edge of its button against the viewport edge', async () => {
    // left-aligned: 150 + 300 > 392; right-aligned: 190 - 300 < 8
    expect(await openMenu({ buttonLeft: 150, menuWidth: 300 })).toBe(VIEWPORT_WIDTH - 8 - 300);
    expect(await openMenu({ buttonLeft: 150, menuWidth: 300, isRight: true })).toBe(8);
  });

  it('places the open menu again when the page is resized', async () => {
    const { wrapper, menuLeft, open } = mountDropdown({ buttonLeft: 200, menuWidth: 150 });
    await open();
    expect(menuLeft()).toBe(200);

    // narrower: 200 + 150 > 300 - 8, aligned on the right edge of the button (240 - 150)
    viewportWidth = 300;
    resizeCallbacks.forEach((callback) => callback());
    await nextTick();
    expect(menuLeft()).toBe(90);

    // wider again: back on the left edge of the button
    viewportWidth = VIEWPORT_WIDTH;
    resizeCallbacks.forEach((callback) => callback());
    await nextTick();
    expect(menuLeft()).toBe(200);

    wrapper.unmount();
  });
});
