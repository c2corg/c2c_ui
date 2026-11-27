import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import DropdownButton from './DropdownButton.vue';

const VIEWPORT_WIDTH = 400;

// jsdom has no layout: the button and its menu get the boxes they would have in a browser, before any shift
const openMenu = async ({
  buttonLeft,
  menuWidth,
  isRight = false,
}: {
  buttonLeft: number;
  menuWidth: number;
  isRight?: boolean;
}) => {
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(VIEWPORT_WIDTH);
  const wrapper = mount(DropdownButton, {
    attrs: { class: isRight ? 'is-right' : '' },
    slots: { button: '<span>button</span>', default: '<div>item</div>' },
    attachTo: document.body,
  });
  const buttonRight = buttonLeft + 40;
  const menuLeft = isRight ? buttonRight - menuWidth : buttonLeft;
  const box = (left: number, width: number) => ({ left, right: left + width, width }) as DOMRect;
  vi.spyOn(wrapper.find('.dropdown-trigger').element, 'getBoundingClientRect').mockReturnValue(box(buttonLeft, 40));
  vi.spyOn(wrapper.find('.dropdown-menu').element, 'getBoundingClientRect').mockReturnValue(box(menuLeft, menuWidth));
  await wrapper.find('.dropdown-trigger').trigger('click');
  await nextTick();
  await nextTick();
  const shift = /translateX\((-?[\d.]+)px\)/.exec(
    (wrapper.find('.dropdown-menu').element as HTMLElement).style.transform
  );
  const left = menuLeft + (shift ? Number(shift[1]) : 0);
  wrapper.unmount();
  return left;
};

describe('DropdownButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it('places the open menu again once the window is resized', async () => {
    vi.useFakeTimers();
    const clientWidth = vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(VIEWPORT_WIDTH);
    const wrapper = mount(DropdownButton, {
      slots: { button: '<span>button</span>', default: '<div>item</div>' },
      attachTo: document.body,
    });
    const menu = wrapper.find('.dropdown-menu').element as HTMLElement;
    vi.spyOn(wrapper.find('.dropdown-trigger').element, 'getBoundingClientRect').mockReturnValue({
      left: 200,
      right: 240,
      width: 40,
    } as DOMRect);
    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({ left: 200, right: 350, width: 150 } as DOMRect);
    await wrapper.find('.dropdown-trigger').trigger('click');
    await vi.runAllTimersAsync();
    expect(menu.style.transform).toBe('');

    // narrower: 200 + 150 > 300 - 8, aligned on the right edge of the button (240 - 150 = 90)
    clientWidth.mockReturnValue(300);
    window.dispatchEvent(new Event('resize'));
    expect(menu.style.transform).toBe('');
    await vi.runAllTimersAsync();
    expect(menu.style.transform).toBe('translateX(-110px)');

    wrapper.unmount();
    vi.useRealTimers();
  });
});
