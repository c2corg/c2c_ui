import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { pullRefresh, usePullRefresh } from './pull-refresh';

const page = (refresh: () => unknown) =>
  defineComponent({
    setup() {
      usePullRefresh(refresh);
      return () => h('div');
    },
  });

describe('pull to refresh', () => {
  it('refreshes the pages shown, even when one fails, and only them', async () => {
    const feed = vi.fn(async () => {});
    const broken = vi.fn(async () => Promise.reject(new Error('network')));
    const shown = mount(page(feed));
    const other = mount(page(broken));

    expect(await pullRefresh()).toBe(true);
    expect(feed).toHaveBeenCalledTimes(1);
    expect(broken).toHaveBeenCalledTimes(1);

    shown.unmount();
    other.unmount();
    expect(await pullRefresh()).toBe(false);
    expect(feed).toHaveBeenCalledTimes(1);
  });
});
