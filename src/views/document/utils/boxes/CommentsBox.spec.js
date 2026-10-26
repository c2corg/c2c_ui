import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CommentsBox from './CommentsBox';

import forum from '@/js/apis/forum';

const topic = () => ({
  slug: 'geant-dans-l-ame',
  posts_count: 2,
  post_stream: {
    posts: [
      {
        id: 1,
        name: 'system',
        username: 'system',
        avatar_template: '/a/{size}.png',
        cooked: '<p>link to the route</p>',
      },
      {
        id: 2,
        username: 'contributor',
        avatar_template: '/a/{size}.png',
        cooked: '<p><a class="mention" href="/u/arthurpdf">@ArthurPDF</a> si vous avez envie de compléter</p>',
      },
    ],
  },
});

const mountCommentsBox = (isLogged) =>
  mount(CommentsBox, {
    props: { document: { type: 'r', document_id: 1, cooked: { lang: 'fr', topic_id: 370873 } } },
    global: {
      stubs: { LoginButton: true },
      directives: { translate: {} },
      mocks: {
        $gettext: (value) => value,
        $route: { name: 'route' },
        $user: { isLogged },
        $dateUtils: { timeAgo: () => '' },
      },
    },
  });

describe('CommentsBox', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([false, true])('links the mentions to the forum once, logged in: %s', async (isLogged) => {
    const data = topic();
    vi.spyOn(forum, 'getTopic').mockReturnValue({ data });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mountCommentsBox(isLogged);
    await flushPromises();

    // a computed that mutated the topic re-rendered endlessly, prepending the forum url each time
    expect(wrapper.find('a.mention').attributes('href')).toBe(forum.url + '/u/arthurpdf');
    expect(data.post_stream.posts[1].cooked).toBe(topic().post_stream.posts[1].cooked);
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Maximum recursive updates'), expect.anything());
  });
});
