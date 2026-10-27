import { flushPromises, mount } from '@vue/test-utils';
import { register } from 'swiper/element';
import { afterEach, describe, expect, it } from 'vitest';

import ImageViewer from './ImageViewer.vue';

import { registerImageViewer, type ImageViewer as ImageViewerApi } from '@/js/vue-plugins/image-viewer';

register();

const image = (id: number) => ({
  document_id: id,
  filename: `${id}.jpg`,
  locales: [{ title: `image ${id}` }],
  available_langs: [],
});

describe('ImageViewer', () => {
  afterEach(() => registerImageViewer(null));

  it('starts Swiper with the keyboard (arrows) and the zoom enabled', async () => {
    const wrapper = mount(ImageViewer, {
      attachTo: document.body,
      global: {
        stubs: {
          DocumentLink: true,
          EditLink: true,
          FaIcon: true,
          ImageInfo: { template: '<div />', methods: { hide() {}, toggle() {} } },
        },
        config: { globalProperties: { $screen: { isMobile: false } } as never },
      },
    });
    // what the pages call through $imageViewer
    const viewer = wrapper.vm as unknown as ImageViewerApi;
    viewer.push(image(1));
    viewer.show(image(2));
    await flushPromises();

    const { params } = (
      wrapper.find('swiper-container').element as unknown as {
        swiper: { params: { keyboard: { enabled: boolean }; zoom: { enabled: boolean } } };
      }
    ).swiper;
    expect(params.keyboard.enabled).toBe(true);
    expect(params.zoom.enabled).toBe(true);
    wrapper.unmount();
  });
});
