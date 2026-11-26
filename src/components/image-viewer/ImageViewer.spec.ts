import { flushPromises, mount } from '@vue/test-utils';
import { register } from 'swiper/element';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

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

// the image as its edit form gets it, and its save: the API is not called
const imageTitle = vi.hoisted(() => ({
  loadEditableImage: vi.fn(),
  saveImageTitle: vi.fn(),
}));
vi.mock('@/js/image-title', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...imageTitle,
}));
vi.mock('@/js/toast', () => ({ toast: vi.fn() }));

// one router for all the tests: a router listens to the history for good
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:path(.*)*', component: { template: '<div />' } }],
});
// the router resets itself when the last app using it is unmounted: an app keeps it for all the tests
createApp({ render: () => null })
  .use(router)
  .mount(document.createElement('div'));

// the popstate of history.back() comes in a task of its own
const popstate = () => new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));

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
// a page of its own for each test
let page = 0;

type User = { isLogged: boolean; isModerator: boolean; id: number | null };
const loggedOut: User = { isLogged: false, isModerator: false, id: null };

async function showViewer({ isMobile = false, shown = image(2) as ViewerImage, user = loggedOut } = {}) {
  await router.push(`/articles/${++page}`);
  const wrapper = mount(ImageViewer, {
    attachTo: document.body,
    global: {
      plugins: [router],
      stubs: {
        DocumentLink: true,
        EditLink: true,
        FaIcon: true,
        ImageInfo: { template: '<div />', methods: { hide() {}, toggle() {} } },
      },
      config: {
        globalProperties: {
          $screen: { isMobile },
          $user: user,
          $language: { current: 'fr' },
          $gettext: (text: string) => text,
        } as never,
      },
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

    const back = popstate();
    window.dispatchEvent(new WheelEvent('wheel'));
    await back;
    await flushPromises();

    expect(wrapper.find('.image-viewer').exists()).toBe(false);
    wrapper.unmount();
  });

  it('closes on back, and the page stays', async () => {
    const { wrapper } = await showViewer();
    const historyLength = history.length;
    const afterEach = vi.fn();
    const removeAfterEach = router.afterEach(afterEach);

    history.back();
    await popstate();
    await flushPromises();

    expect(wrapper.find('.image-viewer').exists()).toBe(false);
    expect(router.currentRoute.value.fullPath).toBe(`/articles/${page}`);
    expect(history.length).toBe(historyLength);
    // the router took no navigation from it
    expect(afterEach).not.toHaveBeenCalled();
    expect(router.listening).toBe(true);
    removeAfterEach();
    wrapper.unmount();
  });

  it('leaves its history entry when closed by Escape, and the page stays', async () => {
    const { wrapper } = await showViewer();
    expect(history.state.c2cImageViewer).toBe(true);
    const afterEach = vi.fn();
    const removeAfterEach = router.afterEach(afterEach);

    const back = popstate();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await back;
    await flushPromises();

    expect(wrapper.find('.image-viewer').exists()).toBe(false);
    expect(history.state.c2cImageViewer).toBeUndefined();
    expect(router.currentRoute.value.fullPath).toBe(`/articles/${page}`);
    expect(afterEach).not.toHaveBeenCalled();
    expect(router.listening).toBe(true);
    removeAfterEach();
    wrapper.unmount();
  });

  it('goes back to the page on forward to the entry of a closed viewer', async () => {
    const { wrapper } = await showViewer();
    const back = popstate();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await back;
    await flushPromises();

    // forward to the viewer's entry, then the router back to the page's one
    const forwardAndBack = popstate().then(popstate);
    history.forward();
    await forwardAndBack;
    await flushPromises();

    expect(history.state.c2cImageViewer).toBeUndefined();
    expect(router.currentRoute.value.fullPath).toBe(`/articles/${page}`);
    expect(wrapper.find('.image-viewer').exists()).toBe(false);
    wrapper.unmount();
  });

  it('closes on a link, whose page takes the place of its history entry', async () => {
    const { wrapper } = await showViewer();
    const historyLength = history.length;

    await router.push('/images/2');
    await flushPromises();

    expect(wrapper.find('.image-viewer').exists()).toBe(false);
    expect(router.currentRoute.value.fullPath).toBe('/images/2');
    expect(history.length).toBe(historyLength);
    expect(history.state.c2cImageViewer).toBeUndefined();
    expect(router.listening).toBe(true);
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

  describe('fullscreen', () => {
    // jsdom has no Fullscreen API: the browser's side, which sets the element and tells it by fullscreenchange
    let fullscreenElement: Element | null = null;
    const setFullscreenElement = (element: Element | null) => {
      fullscreenElement = element;
      document.dispatchEvent(new Event('fullscreenchange'));
    };
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement });
    const requestFullscreen = vi.fn(function (this: Element) {
      setFullscreenElement(this);
      return Promise.resolve();
    });
    const exitFullscreen = vi.fn(() => {
      setFullscreenElement(null);
      return Promise.resolve();
    });
    Element.prototype.requestFullscreen = requestFullscreen;
    document.exitFullscreen = exitFullscreen;

    afterEach(() => {
      fullscreenElement = null;
      requestFullscreen.mockClear();
      exitFullscreen.mockClear();
    });

    const fullscreenIcon = (wrapper: Awaited<ReturnType<typeof showViewer>>['wrapper']) =>
      wrapper.findAll('fa-icon-stub').find((icon) => ['expand', 'compress'].includes(icon.attributes('icon')!))!;

    it('shows the exit icon in fullscreen, and the enter one once left by its icon', async () => {
      const { wrapper } = await showViewer();
      expect(fullscreenIcon(wrapper).attributes('icon')).toBe('expand');

      await fullscreenIcon(wrapper).trigger('click');
      expect(requestFullscreen).toHaveBeenCalledTimes(1);
      expect(fullscreenIcon(wrapper).attributes('icon')).toBe('compress');

      await fullscreenIcon(wrapper).trigger('click');
      expect(exitFullscreen).toHaveBeenCalledTimes(1);
      expect(fullscreenIcon(wrapper).attributes('icon')).toBe('expand');
      wrapper.unmount();
    });

    it('shows the enter icon again when fullscreen is left by the browser (Escape, F11)', async () => {
      const { wrapper } = await showViewer();
      await fullscreenIcon(wrapper).trigger('click');
      expect(fullscreenIcon(wrapper).attributes('icon')).toBe('compress');

      // Escape in fullscreen goes to the browser, the page gets no keydown
      setFullscreenElement(null);
      await flushPromises();

      expect(fullscreenIcon(wrapper).attributes('icon')).toBe('expand');
      expect(wrapper.find('.image-viewer').exists()).toBe(true);
      wrapper.unmount();
    });

    it('keeps the enter icon when the request is refused', async () => {
      requestFullscreen.mockImplementationOnce(() => Promise.reject(new TypeError('refused')));
      const { wrapper } = await showViewer();

      await fullscreenIcon(wrapper).trigger('click');

      expect(fullscreenIcon(wrapper).attributes('icon')).toBe('expand');
      wrapper.unmount();
    });

    it('leaves fullscreen when closed, and opens again with the enter icon', async () => {
      const { wrapper } = await showViewer();
      await fullscreenIcon(wrapper).trigger('click');

      history.back();
      await popstate();
      await flushPromises();

      expect(exitFullscreen).toHaveBeenCalledTimes(1);
      expect(wrapper.find('.image-viewer').exists()).toBe(false);

      (wrapper.vm as unknown as ImageViewerApi).show(image(1));
      await flushPromises();
      expect(fullscreenIcon(wrapper).attributes('icon')).toBe('expand');
      wrapper.unmount();
    });
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

  it('shows the MI image when the BI ones fail, as offline where only the MI ones are saved', async () => {
    config.urls.modernThumbnailsTimestamp = 1;
    try {
      const { wrapper } = await showViewer();
      const picture = wrapper.findAll('picture')[1].element;
      const img = picture.querySelector('img')!;
      const source = picture.querySelector('source')!;
      const fail = () => img.dispatchEvent(new Event('error'));

      fail(); // BI AVIF
      fail(); // BI JPG
      expect(source.srcset).toBe('https://media.example.org/1588000000_2MI.avif');
      expect(img.getAttribute('src')).toBe('https://media.example.org/1588000000_2MI.jpg');
      fail(); // MI AVIF
      expect(source.srcset).toBe('https://media.example.org/1588000000_2MI.jpg');
      fail(); // MI JPG: nothing more to try
      expect(source.srcset).toBe('https://media.example.org/1588000000_2MI.jpg');
      expect(img.getAttribute('src')).toBe('https://media.example.org/1588000000_2MI.jpg');
      wrapper.unmount();
    } finally {
      config.urls.modernThumbnailsTimestamp = 0;
    }
  });

  it('shows the MI JPG image of an image without AVIF ones when the BI one fails', async () => {
    const { wrapper } = await showViewer();
    const img = wrapper.findAll('picture')[1].element.querySelector('img')!;
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe('https://media.example.org/1588000000_2MI.jpg');
    wrapper.unmount();
  });

  describe('title', () => {
    const user: User = { isLogged: true, isModerator: false, id: 7 };

    it('is not offered to change when logged out', async () => {
      imageTitle.loadEditableImage.mockClear();
      const { wrapper } = await showViewer();
      expect(wrapper.find('.image-viewer-edit-title').exists()).toBe(false);
      expect(imageTitle.loadEditableImage).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('is not offered to change when the user may not edit the image', async () => {
      imageTitle.loadEditableImage.mockResolvedValue({ image: {}, editable: false });
      const { wrapper } = await showViewer({ user, shown: image(30) });
      await flushPromises();
      expect(wrapper.find('.image-viewer-edit-title').exists()).toBe(false);
      wrapper.unmount();
    });

    it('is changed in the viewer, and in the page', async () => {
      const loaded = { document_id: 31, locales: [{ lang: 'fr', title: 'image 31' }] };
      imageTitle.loadEditableImage.mockResolvedValue({ image: loaded, editable: true });
      imageTitle.saveImageTitle.mockResolvedValue(undefined);
      const shown = image(31);
      const { wrapper } = await showViewer({ user, shown });
      await flushPromises();
      expect(imageTitle.loadEditableImage).toHaveBeenCalledWith(31, 'fr', user);

      await wrapper.find('.image-viewer-edit-title').trigger('click');
      const input = wrapper.find<HTMLInputElement>('.image-viewer-title-form input');
      expect(input.element.value).toBe('image 31');
      await input.setValue('  Sunrise on the ridge ');
      await wrapper.find('.image-viewer-title-form').trigger('submit');
      await flushPromises();

      expect(imageTitle.saveImageTitle).toHaveBeenCalledWith(loaded, 'Sunrise on the ridge', expect.any(String));
      expect(wrapper.find('.image-viewer-title-form').exists()).toBe(false);
      expect(wrapper.find('.image-viewer-title').text()).toContain('Sunrise on the ridge');
      // the locale of the page's image
      expect(shown.locales[0].title).toBe('Sunrise on the ridge');
      wrapper.unmount();
    });

    it('loads a collaborative image only when its title is changed', async () => {
      imageTitle.loadEditableImage.mockReset();
      imageTitle.loadEditableImage.mockResolvedValue({ image: {}, editable: true });
      const { wrapper } = await showViewer({
        user,
        shown: { ...image(33), image_type: 'collaborative' } as ViewerImage,
      });
      await flushPromises();

      expect(wrapper.find('.image-viewer-edit-title').exists()).toBe(true);
      expect(imageTitle.loadEditableImage).not.toHaveBeenCalled();

      await wrapper.find('.image-viewer-edit-title').trigger('click');
      expect(imageTitle.loadEditableImage).toHaveBeenCalledWith(33, 'fr', user);
      wrapper.unmount();
    });

    it('keeps the arrows and Escape in the field', async () => {
      imageTitle.loadEditableImage.mockResolvedValue({ image: {}, editable: true });
      const { wrapper } = await showViewer({ user, shown: image(32) });
      await flushPromises();
      await wrapper.find('.image-viewer-edit-title').trigger('click');

      await wrapper.find('.image-viewer-title-form input').trigger('keydown', { key: 'Escape' });

      // the edition is cancelled, the viewer stays
      expect(wrapper.find('.image-viewer-title-form').exists()).toBe(false);
      expect(wrapper.find('.image-viewer').exists()).toBe(true);
      wrapper.unmount();
    });
  });
});
