import { flushPromises, shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import ItinevertResultView from '@/components/itinevert/ItinevertResultView.vue';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import DocumentsView from '@/views/documents/DocumentsView.vue';

// The documents table is loaded lazily. Vue 3 needs an async component (defineAsyncComponent): a plain function
// returning the import, as Vue 2 accepted, is not rendered (the table stayed empty).
describe('lazy documents table', () => {
  it('is an async component in DocumentsView', async () => {
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

    // the list mode shows the table
    (wrapper.vm as unknown as { listMode: boolean }).listMode = true;
    await flushPromises();

    // loaded once shown
    expect(wrapper.findComponent({ name: 'DocumentsTable' }).exists()).toBe(true);
    vi.restoreAllMocks();
  });

  it('is an async component in ItinevertResultView', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: () => null } }],
    });
    await router.push('/');
    const wrapper = shallowMount(ItinevertResultView, {
      props: { documentType: 'route', documents: { documents: [], total: 0 } },
      global: {
        plugins: [router],
        config: { globalProperties: { $gettext: (text: string) => text } as never },
        mocks: { $filters: { uppercaseFirstLetter: (text: string) => text } },
        directives: { translate: {} },
      },
    });

    // the list mode shows the table
    (wrapper.vm as unknown as { listMode: boolean }).listMode = true;
    await flushPromises();

    // loaded once shown
    expect(wrapper.findComponent({ name: 'DocumentsTable' }).exists()).toBe(true);
  });
});
