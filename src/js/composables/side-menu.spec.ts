import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import { CLOSE_DELAY, OPEN_DELAY, useSideMenu } from './side-menu';

function sideMenu() {
  let menu!: ReturnType<typeof useSideMenu>;
  mount(defineComponent({ setup: () => ((menu = useSideMenu()), () => h('div')) }));
  return menu;
}

const pointer = (pointerType: string) => ({ pointerType }) as PointerEvent;

// the screen store's media queries, for a window this wide
const screenWidth = (width: number) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: width <= Number(query.match(/max-width: (\d+)px/)![1]),
    addEventListener: () => {},
  }));

describe('useSideMenu', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    screenWidth(1280);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens once the pointer rests on it, and closes a while after it left', () => {
    const menu = sideMenu();

    menu.onPointerEnter(pointer('mouse'));
    vi.advanceTimersByTime(OPEN_DELAY - 1);
    expect(menu.expanded.value).toBe(false);
    vi.advanceTimersByTime(1);
    expect(menu.expanded.value).toBe(true);

    menu.onPointerLeave(pointer('mouse'));
    vi.advanceTimersByTime(CLOSE_DELAY - 1);
    expect(menu.expanded.value).toBe(true);
    // back in time: it stays open
    menu.onPointerEnter(pointer('mouse'));
    vi.advanceTimersByTime(CLOSE_DELAY);
    expect(menu.expanded.value).toBe(true);

    menu.onPointerLeave(pointer('mouse'));
    vi.advanceTimersByTime(CLOSE_DELAY);
    expect(menu.expanded.value).toBe(false);
  });

  it('does not open for a pointer crossing it, nor for a finger', () => {
    const menu = sideMenu();

    menu.onPointerEnter(pointer('mouse'));
    menu.onPointerLeave(pointer('mouse'));
    vi.advanceTimersByTime(OPEN_DELAY + CLOSE_DELAY);
    expect(menu.expanded.value).toBe(false);

    menu.onPointerEnter(pointer('touch'));
    vi.advanceTimersByTime(OPEN_DELAY);
    expect(menu.expanded.value).toBe(false);
  });

  it('closed on purpose, does not open again before the pointer left it', () => {
    const menu = sideMenu();
    menu.onPointerEnter(pointer('mouse'));
    vi.advanceTimersByTime(OPEN_DELAY);

    menu.close();
    expect(menu.expanded.value).toBe(false);
    menu.onPointerEnter(pointer('mouse'));
    vi.advanceTimersByTime(OPEN_DELAY);
    expect(menu.expanded.value).toBe(false);

    menu.onPointerLeave(pointer('mouse'));
    menu.onPointerEnter(pointer('mouse'));
    vi.advanceTimersByTime(OPEN_DELAY);
    expect(menu.expanded.value).toBe(true);
  });

  it('closed from the keyboard, with the pointer away, opens on the next hover', () => {
    const menu = sideMenu();
    menu.close();
    menu.onPointerEnter(pointer('mouse'));
    vi.advanceTimersByTime(OPEN_DELAY);
    expect(menu.expanded.value).toBe(true);
  });

  it('opens for the keyboard, not for a click, until the focus leaves it', () => {
    const menu = sideMenu();
    const aside = document.createElement('aside');
    const link = aside.appendChild(document.createElement('a'));
    const focusIn = (focusVisible: boolean) =>
      menu.onFocusIn({ target: { matches: () => focusVisible } } as unknown as FocusEvent);

    focusIn(false);
    expect(menu.expanded.value).toBe(false);
    focusIn(true);
    expect(menu.expanded.value).toBe(true);

    menu.onFocusOut({ currentTarget: aside, relatedTarget: link } as unknown as FocusEvent);
    expect(menu.expanded.value).toBe(true);
    menu.onFocusOut({ currentTarget: aside, relatedTarget: document.body } as unknown as FocusEvent);
    expect(menu.expanded.value).toBe(false);
  });

  it('pinned, stays open and is kept on the device, and the page is told it changed width', async () => {
    const menu = sideMenu();
    const resize = vi.fn();
    window.addEventListener('resize', resize);

    menu.togglePinned();
    expect(menu.pinned.value).toBe(true);
    expect(menu.expanded.value).toBe(true);
    expect(JSON.parse(localStorage.getItem('SideMenu.preferences')!)).toEqual({ pinned: true });
    await nextTick();
    expect(resize).toHaveBeenCalledTimes(1);

    // unpinned under the pointer: it closes
    menu.onPointerEnter(pointer('mouse'));
    vi.advanceTimersByTime(OPEN_DELAY);
    menu.togglePinned();
    expect(menu.expanded.value).toBe(false);
    expect(JSON.parse(localStorage.getItem('SideMenu.preferences')!)).toEqual({ pinned: false });

    window.removeEventListener('resize', resize);
  });

  it('reads the pinned menu from the device', async () => {
    localStorage.setItem('SideMenu.preferences', JSON.stringify({ pinned: true }));
    vi.resetModules();
    const { useSideMenuPinned } = await import('./side-menu');
    expect(useSideMenuPinned().value).toBe(true);
    localStorage.removeItem('SideMenu.preferences');
  });

  it('is not pinned open under the desktop width, even when kept so on the device', async () => {
    localStorage.setItem('SideMenu.preferences', JSON.stringify({ pinned: true }));
    screenWidth(1023);
    vi.resetModules();
    const { useSideMenuCanPin, useSideMenuPinned } = await import('./side-menu');
    expect(useSideMenuPinned().value).toBe(false);
    expect(useSideMenuCanPin().value).toBe(false);
    localStorage.removeItem('SideMenu.preferences');
  });
});
