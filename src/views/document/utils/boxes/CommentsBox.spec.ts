import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import CommentsBox from './CommentsBox.vue';

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

const mountCommentsBox = async (isLogged: boolean) =>
  mount(CommentsBox, {
    props: { document: { type: 'r', document_id: 1, cooked: { lang: 'fr', topic_id: 370873 } } },
    global: {
      plugins: [await routeRouter()],
      stubs: { LoginButton: true },
      directives: { translate: {} },
      mocks: {
        $gettext: (value: string) => value,
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
    // the answer, as the API client gives it (only its data is read)
    vi.spyOn(forum, 'getTopic').mockReturnValue({ data } as unknown as ReturnType<typeof forum.getTopic>);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = await mountCommentsBox(isLogged);
    await flushPromises();

    // a computed that mutated the topic re-rendered endlessly, prepending the forum url each time
    expect(wrapper.find('a.mention').attributes('href')).toBe(forum.url + '/u/arthurpdf');
    expect(data.post_stream.posts[1].cooked).toBe(topic().post_stream.posts[1].cooked);
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Maximum recursive updates'), expect.anything());
  });

  it('offers a new topic when the forum answers 404 for the topic', async () => {
    // the topic was deleted in the forum: the API replaces it
    const error = Object.assign(new Error('Request failed with status code 404'), { response: { status: 404 } });
    vi.spyOn(forum, 'getTopic').mockReturnValue({ error } as unknown as ReturnType<typeof forum.getTopic>);

    const wrapper = await mountCommentsBox(true);
    await flushPromises();

    expect(wrapper.find('.notification.is-danger').exists()).toBe(false);
    expect(wrapper.find('button.is-primary').exists()).toBe(true);
  });

  it('shows other forum errors', async () => {
    const error = Object.assign(new Error('Request failed with status code 502'), { response: { status: 502 } });
    vi.spyOn(forum, 'getTopic').mockReturnValue({ error } as unknown as ReturnType<typeof forum.getTopic>);

    const wrapper = await mountCommentsBox(true);
    await flushPromises();

    expect(wrapper.find('.notification.is-danger').text()).toContain('status code 502');
    expect(wrapper.find('button.is-primary').exists()).toBe(false);
  });
});
