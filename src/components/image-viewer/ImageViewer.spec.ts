import { flushPromises, mount } from '@vue/test-utils';
import { register } from 'swiper/element';
import { afterEach, describe, expect, it } from 'vitest';

import ImageViewer from './ImageViewer.vue';

import { registerImageViewer, type ImageViewer as ImageViewerApi } from '@/js/vue-plugins/image-viewer';

// jsdom has no Element.part (CSS shadow parts), that Swiper 10+ fills in with part.add() when it renders
if (!('part' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'part', {
    get(this: Element) {
      return {
        add: (token: string) => this.setAttribute('part', `${this.getAttribute('part') ?? ''} ${token}`.trim()),
      };
    },
  });
}

register();

const image = (id: number) => ({
  document_id: id,
  filename: `${id}.jpg`,
  locales: [{ title: `image ${id}` }],
  available_langs: [],
});

type SwiperElement = HTMLElement & {
  swiper: {
    params: { keyboard: { enabled: boolean }; zoom: { enabled: boolean } };
    slideTo(index: number, speed: number): void;
    emit(event: string, ...args: unknown[]): void;
  };
};

// shows image 2 after image 1 was pushed, as the pages do through $imageViewer
async function showViewer({ isMobile = false } = {}) {
  const wrapper = mount(ImageViewer, {
    attachTo: document.body,
    global: {
      stubs: {
        DocumentLink: true,
        EditLink: true,
        FaIcon: true,
        ImageInfo: { template: '<div />', methods: { hide() {}, toggle() {} } },
      },
      config: { globalProperties: { $screen: { isMobile } } as never },
    },
  });
  const viewer = wrapper.vm as unknown as ImageViewerApi;
  viewer.push(image(1));
  viewer.show(image(2));
  await flushPromises();
  return { wrapper, swiperElement: wrapper.find('swiper-container').element as SwiperElement };
}

describe('ImageViewer', () => {
  afterEach(() => registerImageViewer(null));

  it('starts Swiper with the keyboard (arrows) and the zoom enabled', async () => {
    const { wrapper, swiperElement } = await showViewer();

    const { params } = swiperElement.swiper;
    expect(params.keyboard.enabled).toBe(true);
    expect(params.zoom.enabled).toBe(true);
    wrapper.unmount();
  });

  it('shows the title of the active slide', async () => {
    const { wrapper, swiperElement } = await showViewer();
    expect(wrapper.find('.image-viewer-title').text()).toBe('image 2');

    swiperElement.swiper.slideTo(0, 0);
    await flushPromises();

    expect(wrapper.find('.image-viewer-title').text()).toBe('image 1');
    wrapper.unmount();
  });

  it('closes on mouse wheel', async () => {
    const { wrapper } = await showViewer();
    expect(wrapper.find('.image-viewer').exists()).toBe(true);

    window.dispatchEvent(new WheelEvent('wheel'));
    await flushPromises();

    expect(wrapper.find('.image-viewer').exists()).toBe(false);
    wrapper.unmount();
  });

  it('hides and shows the buttons on tap, on mobile', async () => {
    const { wrapper, swiperElement } = await showViewer({ isMobile: true });

    // what Swiper emits on a tap (a click without a swipe)
    swiperElement.swiper.emit('click', { target: swiperElement });
    await flushPromises();
    expect(wrapper.find('.image-viewer').classes()).toContain('hide-buttons');

    swiperElement.swiper.emit('click', { target: swiperElement });
    await flushPromises();
    expect(wrapper.find('.image-viewer').classes()).not.toContain('hide-buttons');
    wrapper.unmount();
  });
});
