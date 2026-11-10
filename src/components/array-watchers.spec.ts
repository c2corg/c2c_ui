import { mount } from '@vue/test-utils';
import type VectorLayer from 'ol/layer/Vector';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import Gallery from './gallery/Gallery.vue';
import { mountMap } from './map/test-utils';

// the point markers draw Font Awesome icons, which the specs don't load: plain styles instead
vi.mock('@/components/map/map-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/map/map-utils')>()),
  getDocumentPointStyle: () => [],
}));

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
    const { wrapper, vm } = await mountMap({ documents });
    const drawn = () =>
      vm.map
        .getLayers()
        .getArray()
        .some((layer) => (layer as VectorLayer).getSource?.()?.getFeatureById?.(1));
    expect(drawn()).toBe(false);

    documents.push({
      document_id: 1,
      type: 'w',
      geometry: { geom: '{"type":"Point","coordinates":[650000,5750000]}' },
    });
    await nextTick();

    expect(drawn()).toBe(true);
    wrapper.unmount();
  });
});
