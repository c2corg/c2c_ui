import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import DocumentsView from './DocumentsView.vue';
import DisplayModeSwitch from './utils/DisplayModeSwitch.vue';
import PageNavigation from './utils/PageNavigation.vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

const mountView = async (url = '/routes', total = 0) => {
  // what the API service returns: the response once loaded, and then(), which gives the object back, to be told when
  const apiData = {
    data: { documents: [], total },
    then(callback: (loaded: { data: { total: number } }) => void) {
      callback(apiData);
      return apiData;
    },
  };
  const getAll = vi.spyOn(c2c.route as DocumentService, 'getAll').mockReturnValue(apiData as never);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/routes', name: 'routes', component: { render: () => null } }],
  });
  await router.push(url);
  const wrapper = shallowMount(DocumentsView, {
    global: {
      plugins: [router],
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
        } as never,
      },
      directives: { translate: {} },
    },
  });
  await flushPromises();
  return { wrapper, router, getAll };
};

describe('DocumentsView', () => {
  afterEach(() => vi.restoreAllMocks());

  // the display mode menu shows the icon of the cards, or of the list
  it('tells the display mode menu whether the results are a list', async () => {
    const { wrapper } = await mountView();
    const displayModeSwitch = wrapper.findComponent(DisplayModeSwitch);

    expect(displayModeSwitch.props('listMode')).toBe(false);

    await wrapper.find('.header-right > span.has-cursor-pointer').trigger('click');
    expect(displayModeSwitch.props('listMode')).toBe(true);
  });

  it('shows the pagination below the results, when there are several pages', async () => {
    const { wrapper } = await mountView('/routes', 100);

    expect(wrapper.findComponent(PageNavigation).props('documents')).toMatchObject({ total: 100 });
  });

  it('goes to the page an offset in the middle of a page belongs to, before loading it', async () => {
    const { router, getAll } = await mountView('/routes?offset=45', 100);

    expect(router.currentRoute.value.query).toEqual({ offset: '30', limit: '30' });
    expect(getAll).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenCalledWith({ offset: '30', limit: '30' });
  });

  it('goes to the last page when the offset is past the results', async () => {
    const { router } = await mountView('/routes?offset=240&limit=30', 45);

    expect(router.currentRoute.value.query).toEqual({ offset: '30', limit: '30' });
  });
});
