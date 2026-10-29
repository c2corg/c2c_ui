import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SiteNotice from './SiteNotice.vue';

import forum from '@/js/apis/forum';

const mountSiteNotice = () =>
  mount(SiteNotice, {
    global: {
      config: { globalProperties: { $user: { lang: 'fr' } } as never },
    },
  });

// let pending promises settle, and node report unhandled rejections
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('SiteNotice', () => {
  const onUnhandledRejection = vi.fn();

  beforeEach(() => {
    onUnhandledRejection.mockClear();
    // stub the HTTP layer only, so that requests go through the real ApiData wrapper
    vi.spyOn(forum.axios, 'get');
    process.on('unhandledRejection', onUnhandledRejection);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandledRejection);
    vi.restoreAllMocks();
  });

  it('shows a visible announcement', async () => {
    vi.mocked(forum.axios.get).mockResolvedValue({
      data: {
        tags: ['visible'],
        post_stream: { posts: [{ updated_at: '2026-10-18', cooked: '<p>Header</p><p>Content</p>' }] },
      },
    });

    const wrapper = mountSiteNotice();
    await flush();

    expect(wrapper.isVisible()).toBe(true);
    expect(wrapper.text()).toContain('Header');
  });

  it('shows nothing, and throws nothing, when the forum is unreachable', async () => {
    vi.mocked(forum.axios.get).mockRejectedValue(new Error('Network Error'));

    const wrapper = mountSiteNotice();
    await flush();

    expect(onUnhandledRejection).not.toHaveBeenCalled();
    expect(wrapper.isVisible()).toBe(false);
  });

  it('remembers a closed announcement, under the key existing users have', async () => {
    vi.mocked(forum.axios.get).mockResolvedValue({
      data: {
        tags: ['visible'],
        post_stream: { posts: [{ updated_at: '2026-10-19', cooked: '<p>Closed header</p>' }] },
      },
    });
    const wrapper = mountSiteNotice();
    await flush();

    await wrapper.find('button.delete').trigger('click');

    expect(wrapper.isVisible()).toBe(false);
    expect(JSON.parse(window.localStorage.getItem('SiteNotice.preferences')!)).toMatchObject({
      'readdenPostKey.fr': '2026-10-19',
    });

    const next = mountSiteNotice();
    await flush();
    expect(next.isVisible()).toBe(false);
  });
});
