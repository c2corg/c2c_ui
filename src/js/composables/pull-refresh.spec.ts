import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { pullRefresh, usePullRefresh } from './pull-refresh';

const page = (refresh: () => unknown) =>
  defineComponent({
    setup() {
      usePullRefresh(refresh);
      return () => h('div');
    },
  });

afterEach(() => vi.unstubAllGlobals());

describe('pull to refresh', () => {
  it('refreshes the pages shown, even when one fails, and reloads a page that refreshes nothing', async () => {
    const feed = vi.fn(async () => {});
    const broken = vi.fn(async () => Promise.reject(new Error('network')));
    const shown = mount(page(feed));
    const other = mount(page(broken));

    await pullRefresh();
    expect(feed).toHaveBeenCalledTimes(1);
    expect(broken).toHaveBeenCalledTimes(1);

    shown.unmount();
    other.unmount();
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    void pullRefresh();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(feed).toHaveBeenCalledTimes(1);
  });
});
