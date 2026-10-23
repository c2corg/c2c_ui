import { flushPromises, mount } from '@vue/test-utils';
// eslint-disable-next-line import/no-unresolved
import { register } from 'swiper/element';
import { afterEach, describe, expect, it } from 'vitest';

import ImageViewer from './ImageViewer';

import { registerImageViewer } from '@/js/vue-plugins/image-viewer';

register();

const image = (id) => ({
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
        mocks: { $screen: { isMobile: false } },
      },
    });
    wrapper.vm.push(image(1));
    wrapper.vm.show(image(2));
    await flushPromises();

    const { params } = wrapper.find('swiper-container').element.swiper;
    expect(params.keyboard.enabled).toBe(true);
    expect(params.zoom.enabled).toBe(true);
    wrapper.unmount();
  });
});
