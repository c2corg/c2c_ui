import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PAGE_MOVING_DELAY, PAGE_SCROLLING_CLASS, WHEEL_GESTURE_GAP, scrollPassthrough } from './scroll-passthrough';

let root: HTMLElement;
let mapElement: HTMLElement;
let canvas: HTMLElement;
let enabled: boolean;
let stop: () => void;
// what MapLibre would receive: its listeners are on the map element
let received: string[];

const scrollPage = () => document.dispatchEvent(new Event('scroll'));
const wheel = (init: WheelEventInit = {}) => canvas.dispatchEvent(new WheelEvent('wheel', { bubbles: true, ...init }));
const touch = (type: string, touches: number, changed = 1) => {
  const event = new Event(type, { bubbles: true });
  const list = (n: number) => Array.from({ length: n }, () => ({}));
  Object.assign(event, { touches: list(touches), changedTouches: list(changed) });
  canvas.dispatchEvent(event);
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  vi.advanceTimersByTime(10_000);
  root = document.createElement('div');
  mapElement = document.createElement('div');
  canvas = document.createElement('canvas');
  mapElement.append(canvas);
  root.append(mapElement);
  document.body.append(root);
  received = [];
  ['wheel', 'touchstart', 'touchmove', 'touchend'].forEach((type) =>
    mapElement.addEventListener(type, () => received.push(type))
  );
  enabled = true;
  stop = scrollPassthrough(mapElement, root, () => enabled);
});

afterEach(() => {
  stop();
  root.remove();
  vi.useRealTimers();
});

describe('scrollPassthrough', () => {
  it('gives the map the wheel on a still page', () => {
    wheel();
    expect(received).toEqual(['wheel']);
  });

  it('gives the page the wheel gesture that starts while the page moves, until the gesture ends', () => {
    scrollPage();
    wheel();
    // the page reached its end and stopped, the gesture goes on (trackpad inertia)
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(WHEEL_GESTURE_GAP - 50);
      wheel();
    }
    expect(received).toEqual([]);
    // a new gesture on the still page
    vi.advanceTimersByTime(WHEEL_GESTURE_GAP + 1);
    wheel();
    expect(received).toEqual(['wheel']);
  });

  it('always gives the map a trackpad pinch', () => {
    scrollPage();
    wheel({ ctrlKey: true });
    expect(received).toEqual(['wheel']);
  });

  it('marks the root element while the page moves, with one timer per scroll burst', () => {
    scrollPage();
    expect(root.classList.contains(PAGE_SCROLLING_CLASS)).toBe(true);
    vi.advanceTimersByTime(PAGE_MOVING_DELAY - 100);
    scrollPage();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(PAGE_MOVING_DELAY - 1);
    expect(root.classList.contains(PAGE_SCROLLING_CLASS)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(root.classList.contains(PAGE_SCROLLING_CLASS)).toBe(false);
  });

  it('gives the page the touch gesture that starts while the page moves, with all its fingers', () => {
    scrollPage();
    touch('touchstart', 1);
    vi.advanceTimersByTime(PAGE_MOVING_DELAY * 2);
    touch('touchstart', 2);
    touch('touchmove', 2);
    touch('touchend', 0);
    expect(received).toEqual([]);
    touch('touchstart', 1);
    touch('touchmove', 1);
    expect(received).toEqual(['touchstart', 'touchmove']);
  });

  it('ignores the scrolling of a list over the map', () => {
    const list = document.createElement('div');
    root.append(list);
    list.dispatchEvent(new Event('scroll'));
    expect(root.classList.contains(PAGE_SCROLLING_CLASS)).toBe(false);
    wheel();
    expect(received).toEqual(['wheel']);
  });

  it('does nothing when disabled (full screen)', () => {
    enabled = false;
    scrollPage();
    expect(root.classList.contains(PAGE_SCROLLING_CLASS)).toBe(false);
    wheel();
    expect(received).toEqual(['wheel']);
  });

  it('stops', () => {
    scrollPage();
    stop();
    expect(root.classList.contains(PAGE_SCROLLING_CLASS)).toBe(false);
    wheel();
    expect(received).toEqual(['wheel']);
  });
});
