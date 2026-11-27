import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ForumWidget from './ForumWidget.vue';

import forum from '@/js/apis/forum';

const latest = {
  users: [{ username: 'alice', avatar_template: '/a/alice/{size}.png' }],
  topic_list: {
    topics: [1, 2, 3].map((id) => ({
      id,
      slug: `topic-${id}`,
      title: `Topic ${id}`,
      highest_post_number: 10 + id,
      last_poster_username: 'alice',
    })),
  },
};

const mountWidget = (props = {}) =>
  mount(ForumWidget, {
    props,
    global: {
      directives: { translate: {} },
      stubs: { RouterLink: true, IconForum: true, LoadingNotification: true },
      config: { globalProperties: { $gettext: (text: string) => text } as never },
    },
  });

describe('ForumWidget', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lists the latest topics, up to its message count, with their last poster', async () => {
    const get = vi.spyOn(forum.axios, 'get').mockResolvedValue({ data: structuredClone(latest) });
    const wrapper = mountWidget({ messageCount: 2 });
    await flushPromises();

    expect(get.mock.calls[0][0]).toMatch(/^\/latest\.json\?exclude_category_ids\[\]=29&/);
    const rows = wrapper.findAll('a.forum-row');
    expect(rows.map((row) => row.text())).toEqual(['Topic 1', 'Topic 2']);
    expect(rows[0].attributes('href')).toBe(`${forum.url}/t/topic-1/1/11`);
    expect(rows[0].find('img').attributes('src')).toBe(`${forum.url}/a/alice/20.png`);
  });

  it('lists a topic whose last poster is not among the users of the answer, without avatar', async () => {
    const answer = structuredClone(latest);
    answer.topic_list.topics[0].last_poster_username = 'bob';
    vi.spyOn(forum.axios, 'get').mockResolvedValue({ data: answer });
    const wrapper = mountWidget();
    await flushPromises();

    const rows = wrapper.findAll('a.forum-row');
    expect(rows).toHaveLength(3);
    expect(rows[0].find('img').exists()).toBe(false);
    expect(rows[1].find('img').exists()).toBe(true);
  });
});
