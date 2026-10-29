import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import DocumentsView from './DocumentsView.vue';
import DisplayModeSwitch from './utils/DisplayModeSwitch.vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

const mountView = async () => {
  vi.spyOn(c2c.route as DocumentService, 'getAll').mockReturnValue(
    Promise.resolve({ data: { documents: [], total: 0 } }) as never
  );
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/routes', name: 'routes', component: { render: () => null } }],
  });
  await router.push('/routes');
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
  return wrapper;
};

describe('DocumentsView', () => {
  afterEach(() => vi.restoreAllMocks());

  // the display mode menu shows the icon of the cards, or of the list
  it('tells the display mode menu whether the results are a list', async () => {
    const wrapper = await mountView();
    const displayModeSwitch = wrapper.findComponent(DisplayModeSwitch);

    expect(displayModeSwitch.props('listMode')).toBe(false);

    await wrapper.find('.header-right > span.has-cursor-pointer').trigger('click');
    expect(displayModeSwitch.props('listMode')).toBe(true);
  });
});
