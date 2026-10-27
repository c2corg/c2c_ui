import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import Gallery from './gallery/Gallery.vue';
import OlMap from './map/OlMap.vue';

// Vue 2 array watchers ran when the array was changed in place: the watchers below must still run then (deep: 1)
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  }
);

describe('array watchers', () => {
  it('Gallery: an image added to the list goes to the image viewer', async () => {
    const images = reactive<{ document_id: number; filename: string; locales: { title: string }[] }[]>([]);
    const push = vi.fn();
    mount(Gallery, {
      props: { images },
      // Gallery reads $imageViewer in its script: a global property, not a mock
      global: {
        config: { globalProperties: { $imageViewer: { push } } as never },
        stubs: { Thumbnail: true, Swiper: true },
      },
    });

    images.push({ document_id: 1, filename: 'a.jpg', locales: [{ title: 'A' }] });
    await nextTick();

    expect(push).toHaveBeenCalledWith(images[0], 0, images);
  });

  it('OlMap: a document added to the list is drawn', async () => {
    const documents = reactive<Record<string, unknown>[]>([]);
    const draw = vi
      .spyOn((OlMap as unknown as { methods: { drawDocumentMarkers(): void } }).methods, 'drawDocumentMarkers')
      .mockImplementation(() => {});
    const wrapper = mount(OlMap, {
      props: { documents },
      attachTo: document.body,
      global: {
        mocks: {
          $gettext: (text: string) => text,
          $user: { isLogged: false },
          $route: { name: 'routes', query: {} },
          $router: { push: () => {}, resolve: () => ({ href: '' }) },
          $language: { current: 'fr' },
          $documentUtils: { getDocumentTitle: () => '', hasSameGeolocation: () => false },
          $dateUtils: {},
        },
        stubs: { FaIcon: true, InputSlider: true, BiodivInformation: true, SwissProtectionAreaInformation: true },
        directives: { translate: {} },
      },
    });
    draw.mockClear();

    documents.push({
      document_id: 1,
      type: 'w',
      geometry: { geom: '{"type":"Point","coordinates":[650000,5750000]}' },
    });
    await nextTick();

    expect(draw).toHaveBeenCalled();
    wrapper.unmount();
    draw.mockRestore();
  });
});
