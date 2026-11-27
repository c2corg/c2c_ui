// Going back from an edit page with unsaved changes asks for a confirmation: the guard runs on a real navigation.
// The guard of the view itself, as the router calls it (vue-router 4+ skips beforeRouteLeave of a mixin).
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';

import BookEditionView from './BookEditionView.vue';

import { ApiData } from '@/js/apis/BaseApi';

const api = vi.hoisted(() => ({ get: vi.fn(), getCooked: vi.fn() }));

// the article: banners of the edition container
vi.mock('@/js/apis/c2c', () => ({ default: { book: { get: api.get }, article: { getCooked: api.getCooked } } }));

const response = (data: unknown) => new ApiData(Promise.resolve({ data } as never));

const Empty = { render: () => null };

async function editBook() {
  api.getCooked.mockImplementation(() => new ApiData(new Promise<never>(() => {})));
  api.get.mockImplementation(() =>
    response({ document_id: 12, type: 'b', locales: [{ lang: 'fr', title: 'Premier de cordée' }], associations: {} })
  );
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/books/:id(\\d+)/:lang?', name: 'book', component: Empty },
      { path: '/books/edit/:id(\\d+)/:lang', name: 'book-edit', component: BookEditionView },
    ],
  });
  await router.push('/books/12/fr');
  mount(RouterView, {
    global: {
      plugins: [router],
      stubs: { EditionContainer: true },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $user: { isLogged: true, isModerator: false, id: 7 },
          $documentUtils: {},
        } as never,
      },
    },
  });
  await router.push('/books/edit/12/fr');
  await flushPromises();
  return router;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.head.innerHTML = '';
});

describe('leaving an edit page', () => {
  it('stays on the page when the user cancels going back', async () => {
    const router = await editBook();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    router.back();
    await flushPromises();

    expect(confirm).toHaveBeenCalledExactlyOnceWith('Do you really want to leave? you have unsaved changes!');
    expect(router.currentRoute.value.name).toBe('book-edit');
  });

  it('goes back when the user confirms', async () => {
    const router = await editBook();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    router.back();
    await flushPromises();

    expect(confirm).toHaveBeenCalledOnce();
    expect(router.currentRoute.value.name).toBe('book');
  });
});
