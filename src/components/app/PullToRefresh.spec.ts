import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import PullToRefresh from './PullToRefresh.vue';

import { usePullRefresh } from '@/js/composables/pull-refresh';

const page = (refresh: () => unknown) =>
  defineComponent({
    setup() {
      usePullRefresh(refresh);
      return () => h('div');
    },
  });

// a touch on the element, as the browser sends it: it bubbles up to the window, where the component listens
const touch = (element: Element, type: string, clientY?: number) => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'touches', { value: clientY === undefined ? [] : [{ clientY }] });
  element.dispatchEvent(event);
};

const pull = async (element: Element) => {
  touch(element, 'touchstart', 10);
  touch(element, 'touchmove', 110);
  touch(element, 'touchend');
  await flushPromises();
};

const mounted: Array<{ unmount(): void }> = [];
const mountOnPage = (component: ReturnType<typeof defineComponent> | typeof PullToRefresh) => {
  const wrapper = mount(component, { attachTo: document.body, global: { stubs: { FaIcon: true } } });
  mounted.push(wrapper);
  return wrapper;
};

const content = (className: string) => {
  const element = document.createElement('div');
  element.className = className;
  element.appendChild(document.createElement('canvas'));
  document.body.appendChild(element);
  return element.firstElementChild!;
};

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('PullToRefresh', () => {
  it('refreshes the page pulled from its top', async () => {
    const refresh = vi.fn();
    mountOnPage(page(refresh));
    mountOnPage(PullToRefresh);

    await pull(content('card'));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('lets a finger pan a map down, without refreshing the page', async () => {
    const refresh = vi.fn();
    mountOnPage(page(refresh));
    const arrow = mountOnPage(PullToRefresh);
    const map = content('c2c-map');

    touch(map, 'touchstart', 10);
    touch(map, 'touchmove', 110);
    await flushPromises();
    expect(arrow.classes()).not.toContain('is-pulling');
    touch(map, 'touchend');
    await flushPromises();

    expect(refresh).not.toHaveBeenCalled();
  });

  it('does not refresh a pull the system cancels', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    const arrow = mountOnPage(PullToRefresh);
    const element = content('card');

    touch(element, 'touchstart', 10);
    touch(element, 'touchmove', 110);
    touch(element, 'touchcancel');
    await flushPromises();

    expect(reload).not.toHaveBeenCalled();
    expect(arrow.classes()).not.toContain('is-pulling');
  });

  it('turns the arrow until the page is refreshed', async () => {
    let done!: () => void;
    mountOnPage(page(() => new Promise<void>((resolve) => (done = resolve))));
    const arrow = mountOnPage(PullToRefresh);

    await pull(content('card'));
    expect(arrow.find('fa-icon-stub').attributes('icon')).toBe('rotate');

    done();
    await flushPromises();
    expect(arrow.find('fa-icon-stub').attributes('icon')).toBe('arrow-down');
  });

  it('reloads a page that refreshes nothing, the arrow turning until it goes', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    const arrow = mountOnPage(PullToRefresh);

    await pull(content('card'));

    expect(reload).toHaveBeenCalledTimes(1);
    expect(arrow.find('fa-icon-stub').attributes('icon')).toBe('rotate');
  });
});
