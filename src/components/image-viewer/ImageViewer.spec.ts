import { flushPromises, mount } from '@vue/test-utils';
import { register } from 'swiper/element';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ImageViewer from './ImageViewer.vue';

import {
  registerImageViewer,
  type ImageViewer as ImageViewerApi,
  type ViewerImage,
} from '@/js/vue-plugins/image-viewer';

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

// '@/js/config' reads CAMPTOCAMP_CONFIG, a constant injected by Vite (see vite.config.ts)
const config = vi.hoisted(() => ({
  urls: { api: 'https://api.example.org', media: 'https://media.example.org', modernThumbnailsTimestamp: 0 },
}));
vi.mock('@/js/config', () => ({ default: config }));

const image = (id: number) => ({
  document_id: id,
  filename: `1588000000_${id}.jpg`,
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
async function showViewer({ isMobile = false, shown = image(2) as ViewerImage } = {}) {
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
  viewer.show(shown);
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

  it('offers the AVIF image of the recent images, and no WebP', async () => {
    config.urls.modernThumbnailsTimestamp = 1;
    try {
      const { wrapper } = await showViewer();
      const sources = wrapper.findAll('picture source');
      expect(sources.map((source) => source.attributes('type'))).toEqual(['image/avif', 'image/avif']);
      expect(sources[0].attributes('srcset')).toBe('https://media.example.org/1588000000_1BI.avif');
      wrapper.unmount();
    } finally {
      config.urls.modernThumbnailsTimestamp = 0;
    }
  });

  it('offers only the JPG image of a just uploaded image, whose AVIF one may not be built yet', async () => {
    config.urls.modernThumbnailsTimestamp = 1;
    try {
      const { wrapper } = await showViewer({ shown: { ...image(2), modernThumbnailsPending: true } });
      const pictures = wrapper.findAll('picture');
      expect(pictures[0].findAll('source')).toHaveLength(1);
      expect(pictures[1].findAll('source')).toHaveLength(0);
      expect(pictures[1].find('img').attributes('src')).toBe('https://media.example.org/1588000000_2BI.jpg');
      wrapper.unmount();
    } finally {
      config.urls.modernThumbnailsTimestamp = 0;
    }
  });

  it('shows the JPG image when the AVIF one fails', async () => {
    config.urls.modernThumbnailsTimestamp = 1;
    try {
      const { wrapper } = await showViewer();
      const picture = wrapper.findAll('picture')[1].element;
      // as the browser does: on the image, without bubbling
      picture.querySelector('img')!.dispatchEvent(new Event('error'));

      expect(picture.querySelector('source')!.srcset).toBe('https://media.example.org/1588000000_2BI.jpg');
      wrapper.unmount();
    } finally {
      config.urls.modernThumbnailsTimestamp = 0;
    }
  });
});
