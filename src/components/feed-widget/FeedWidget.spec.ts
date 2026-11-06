import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import FeedWidget from './FeedWidget.vue';

import { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';

const mountFeed = async (answer: Promise<unknown>) => {
  // the first page, then nothing more (the next page is asked at once: the list does not fill the test's empty page)
  vi.spyOn(c2c.feed, 'getDefaultFeed')
    .mockReturnValueOnce(new ApiData(answer as never) as never)
    .mockReturnValue(new ApiData(Promise.resolve({ data: { feed: [] } }) as never) as never);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { render: () => null } }],
  });
  await router.push('/');
  return mount(FeedWidget, {
    props: { type: 'default' },
    global: {
      plugins: [router],
      stubs: { FeedCard: { template: '<div class="feed-card stub" />' } },
      config: { globalProperties: { $gettext: (text: string) => text, $language: { current: 'fr' } } as never },
    },
  });
};

describe('FeedWidget', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows grey cards while the first page loads, then the cards', async () => {
    let answer!: (value: unknown) => void;
    const wrapper = await mountFeed(new Promise((resolve) => (answer = resolve)));
    await flushPromises();
    expect(wrapper.findAll('.feed-skeleton')).toHaveLength(2);

    answer({ data: { feed: [{ id: 1, document: { type: 'o' }, image1: null }], pagination_token: 'next' } });
    await flushPromises();
    expect(wrapper.findAll('.feed-skeleton')).toHaveLength(0);
    expect(wrapper.findAll('.feed-card.stub')).toHaveLength(1);
  });
});
