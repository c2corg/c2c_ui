import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import infiniteScroll from './infinite-scroll';

// jsdom has no layout: the list bottom is set by the test, the window is 800px high
let listBottom;

const mountList = (options) =>
  mount(
    {
      directives: { infiniteScroll },
      data: () => ({ options }),
      render(h) {
        return h('div', { directives: [{ name: 'infinite-scroll', value: this.options }], class: 'list' });
      },
    },
    { attachTo: document.body }
  );

describe('v-infinite-scroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('innerHeight', 800);
    listBottom = 2000;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return { bottom: this.classList.contains('list') ? listBottom : 0 };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads at once when the bottom of the list is already near', () => {
    listBottom = 850;
    const load = vi.fn();

    mountList({ load, distance: 100 });

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not load while the bottom of the list is far', () => {
    const load = vi.fn();

    mountList({ load, distance: 100 });
    window.dispatchEvent(new Event('scroll'));

    expect(load).not.toHaveBeenCalled();
  });

  it('loads when scrolling near the bottom, at most once per 200ms', () => {
    const load = vi.fn();
    mountList({ load, distance: 500 });

    listBottom = 1200;
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(load).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(load).toHaveBeenCalledTimes(2); // the last scroll of the burst
  });

  it('does not load while disabled, and checks again once enabled', async () => {
    listBottom = 850;
    const load = vi.fn();
    const wrapper = mountList({ load, distance: 100, disabled: true });
    window.dispatchEvent(new Event('scroll'));
    expect(load).not.toHaveBeenCalled();

    wrapper.vm.options = { load, distance: 100, disabled: false };
    await nextTick();

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('stops listening once the list is destroyed', () => {
    const load = vi.fn();
    const wrapper = mountList({ load, distance: 100 });

    wrapper.destroy();
    listBottom = 850;
    vi.advanceTimersByTime(200);
    window.dispatchEvent(new Event('scroll'));

    expect(load).not.toHaveBeenCalled();
  });

  it('listens to the nearest scrolling container', () => {
    const container = document.createElement('div');
    container.style.overflowY = 'auto';
    document.body.appendChild(container);
    const load = vi.fn();
    const wrapper = mount(
      {
        directives: { infiniteScroll },
        render: (h) =>
          h('div', { directives: [{ name: 'infinite-scroll', value: { load, distance: 0 } }], class: 'list' }),
      },
      { attachTo: container.appendChild(document.createElement('div')) }
    );
    // container: getBoundingClientRect().bottom is 0 (not .list); the list ends 10px below it
    listBottom = 10;

    window.dispatchEvent(new Event('scroll'));
    expect(load).not.toHaveBeenCalled();

    listBottom = 0;
    container.dispatchEvent(new Event('scroll'));
    expect(load).toHaveBeenCalledTimes(1);

    wrapper.destroy();
    container.remove();
  });
});
