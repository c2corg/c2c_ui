import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import DocumentsView from './DocumentsView.vue';
import DisplayModeSwitch from './utils/DisplayModeSwitch.vue';

import { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { getPreferences } from '@/js/vue-plugins/local-storage';
import { useOfflineStore } from '@/stores/offline';

const mountView = async (documents: object[] = []) => {
  vi.spyOn(c2c.route as DocumentService, 'getAll').mockReturnValue(
    new ApiData(Promise.resolve({ data: { documents, total: documents.length } }) as never) as never
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
  afterEach(() => {
    vi.restoreAllMocks();
    // the list mode is remembered
    window.localStorage.clear();
    getPreferences('DocumentsView').reload();
  });

  // the display mode menu shows the icon of the cards, or of the list
  it('tells the display mode menu whether the results are a list', async () => {
    const wrapper = await mountView();
    const displayModeSwitch = wrapper.findComponent(DisplayModeSwitch);

    expect(displayModeSwitch.props('listMode')).toBe(false);

    await wrapper.find('.header-right > span.has-cursor-pointer').trigger('click');
    expect(displayModeSwitch.props('listMode')).toBe(true);
  });

  it('shows only the documents of the page saved offline, on demand', async () => {
    const offline = useOfflineStore();
    vi.spyOn(offline, 'isOfflineReady').mockImplementation((type, id) => type === 'route' && id === 2);
    const wrapper = await mountView([{ document_id: 1 }, { document_id: 2 }]);
    expect(wrapper.findAll('.card-container')).toHaveLength(2);

    await wrapper.find('[title="Only the ones saved offline"]').trigger('click');
    expect(wrapper.findAll('.card-container')).toHaveLength(1);
  });
});
