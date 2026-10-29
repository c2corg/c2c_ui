import { flushPromises, shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import DocumentsPrintingView from './DocumentsPrintingView.vue';

import { ApiData } from '@/js/apis/BaseApi';
import MapView from '@/views/document/MapView.vue';
import RouteView from '@/views/document/RouteView.vue';

const api = vi.hoisted(() => ({ getAll: vi.fn(), getCooked: vi.fn() }));

vi.mock('@/js/apis/c2c', () => ({ default: new Proxy({}, { get: () => api }) }));

const response = (data: unknown) => new ApiData(Promise.resolve({ data } as never));

async function print(documentType: string) {
  api.getAll.mockImplementation(() => response({ documents: [{ document_id: 5 }], total: 1 }));
  api.getCooked.mockImplementation(() => response({ document_id: 5, type: documentType[0] }));
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:type/print', name: `${documentType}s-print`, component: { render: () => null } }],
  });
  await router.push(`/${documentType}s/print`);
  const wrapper = shallowMount(DocumentsPrintingView, {
    global: {
      plugins: [router],
      config: {
        globalProperties: { $gettext: (text: string) => text, $language: { current: 'fr' } } as never,
      },
      directives: { translate: {} },
    },
  });
  await flushPromises();
  return wrapper;
}

describe('DocumentsPrintingView', () => {
  it('shows each document with the view of its type', async () => {
    const wrapper = await print('route');

    expect(api.getCooked).toHaveBeenCalledWith(5, 'fr');
    expect(wrapper.findComponent(RouteView).exists()).toBe(true);
  });

  // "map-view" is also the name of the global map component (OlMap)
  it('shows the maps with the map document view, not the map component', async () => {
    const wrapper = await print('map');

    expect(wrapper.findComponent(MapView).exists()).toBe(true);
  });
});
