import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

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

// on a route page: the box reads its view mode from the router (useViewMode)
const routeRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/routes/:id', name: 'route', component: { render: () => h('div') } }],
  });
  await router.push('/routes/1');
  return router;
};

const mountCommentsBox = async (isLogged) =>
  mount(CommentsBox, {
    props: { document: { type: 'r', document_id: 1, cooked: { lang: 'fr', topic_id: 370873 } } },
    global: {
      plugins: [await routeRouter()],
      stubs: { LoginButton: true },
      directives: { translate: {} },
      mocks: {
        $gettext: (value) => value,
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

    const wrapper = await mountCommentsBox(isLogged);
    await flushPromises();

    // a computed that mutated the topic re-rendered endlessly, prepending the forum url each time
    expect(wrapper.find('a.mention').attributes('href')).toBe(forum.url + '/u/arthurpdf');
    expect(data.post_stream.posts[1].cooked).toBe(topic().post_stream.posts[1].cooked);
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Maximum recursive updates'), expect.anything());
  });
});
