import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SiteNotice from './SiteNotice';

import forum from '@/js/apis/forum';

vi.mock('@/js/apis/forum', () => ({ default: { readAnnouncement: vi.fn() } }));

const mountSiteNotice = () =>
  mount(SiteNotice, {
    mocks: {
      $user: { lang: 'fr' },
      $localStorage: { get: vi.fn(), set: vi.fn() },
    },
  });

// let pending promises settle, and node report unhandled rejections
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('SiteNotice', () => {
  const onUnhandledRejection = vi.fn();

  beforeEach(() => {
    onUnhandledRejection.mockClear();
    process.on('unhandledRejection', onUnhandledRejection);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandledRejection);
  });

  it('shows a visible announcement', async () => {
    forum.readAnnouncement.mockResolvedValue({
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
    forum.readAnnouncement.mockRejectedValue(new Error('Network Error'));

    const wrapper = mountSiteNotice();
    await flush();

    expect(onUnhandledRejection).not.toHaveBeenCalled();
    expect(wrapper.isVisible()).toBe(false);
  });
});
