import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import helperWindow, { registerHelperWindow } from './helper-window';
import imageViewer, { imageViewerRequested, registerImageViewer, type ViewerImage } from './image-viewer';

import SocialNetworkSharing from '@/views/document/utils/SocialNetworkSharing.vue';

const plugins = [helperWindow, imageViewer];

// the windows of App.vue, reached from any component without $root.$children
describe('$helper and $imageViewer', () => {
  afterEach(() => {
    registerHelperWindow(null);
    registerImageViewer(null);
  });

  it('give the registered window to every component', () => {
    const helper = { show: vi.fn() };
    const viewer = { push: vi.fn(), show: vi.fn(), clear: vi.fn() };
    registerHelperWindow(helper);
    registerImageViewer(viewer);

    const wrapper = mount({ render: () => h('div') }, { global: { plugins } });
    const image = { document_id: 1, locales: [{}] };
    wrapper.vm.$imageViewer.push(image);
    wrapper.vm.$imageViewer.show(image);
    wrapper.vm.$imageViewer.clear();

    expect(wrapper.vm.$helper).toBe(helper);
    expect(viewer.push).toHaveBeenCalledWith(image);
    expect(viewer.show).toHaveBeenCalledWith(image);
    expect(viewer.clear).toHaveBeenCalledOnce();
  });

  it('are registered by the windows themselves while mounted', async () => {
    const { default: HelperWindow } = await import('@/components/helper/HelperWindow.vue');
    const window = mount(HelperWindow, {
      global: {
        plugins,
        stubs: { ModalCard: true },
        config: { globalProperties: { $gettext: (s: string) => s, $language: { current: 'fr' } } as never },
      },
    });
    const component = mount({ render: () => h('div') }, { global: { plugins } });

    // what the window offers to the pages: show()
    expect(component.vm.$helper).toEqual({ show: expect.any(Function) });

    window.unmount();
    expect(component.vm.$helper).toBe(null);
  });
});

describe('$helper and $imageViewer in App.vue', () => {
  afterEach(() => registerHelperWindow(null));

  it('are usable by the pages while they are created, as in App.vue', async () => {
    const { default: HelperWindow } = await import('@/components/helper/HelperWindow.vue');
    let seenByPage: unknown;
    // App.vue: the windows, then the router view; document views use $imageViewer in their created()
    const Page = defineComponent({
      created() {
        seenByPage = this.$helper;
      },
      render: () => h('div'),
    });

    mount(
      {
        components: { HelperWindow, Page },
        render: () => h('div', [h(HelperWindow, { ref: 'helper' }), h(Page)]),
      },
      {
        global: {
          plugins,
          stubs: { ModalCard: true },
          config: { globalProperties: { $gettext: (s: string) => s, $language: { current: 'fr' } } as never },
        },
      }
    );

    expect(seenByPage).not.toBe(null);
  });
});

describe('SocialNetworkSharing', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shares the title of the document it is given', async () => {
    const share = vi.fn();
    vi.stubGlobal('navigator', { share });
    const wrapper = mount(SocialNetworkSharing, {
      props: { document: { type: 'r', locales: [{ lang: 'fr', title: 'Face nord' }] } },
      global: {
        stubs: { FaIcon: true },
        config: {
          globalProperties: {
            $gettext: (s: string) => s,
            $gdpr: { get: () => null },
            $documentUtils: {
              getDocumentTitle: (document: { locales: { title: string }[] }) => document.locales[0].title,
            },
          } as never,
        },
      },
    });

    await wrapper.find('span[title=Share]').trigger('click');

    expect(share).toHaveBeenCalledWith({ title: 'Face nord', url: window.location.href });
  });
});

// ImageViewer (and Swiper) is loaded with the first image shown (#4877)
describe('$imageViewer before ImageViewer is loaded', () => {
  const image = (document_id: number): ViewerImage => ({ document_id, locales: [{ title: String(document_id) }] });
  const viewer = () => ({ push: vi.fn(), show: vi.fn(), clear: vi.fn() });
  const page = () => mount({ render: () => h('div') }, { global: { plugins } }).vm.$imageViewer;

  afterEach(() => {
    registerImageViewer(null);
    imageViewerRequested.value = false;
  });

  it('keeps the images pushed by the page, and asks App.vue for the viewer on the first image shown', () => {
    const $imageViewer = page();
    $imageViewer.push(image(1));
    $imageViewer.push(image(2));
    expect(imageViewerRequested.value).toBe(false);

    $imageViewer.show(image(2));
    expect(imageViewerRequested.value).toBe(true);

    // the viewer is loaded: it gets the pushed images, then shows the requested one
    const loaded = viewer();
    registerImageViewer(loaded);
    expect(loaded.push.mock.calls).toEqual([[image(1)], [image(2)]]);
    expect(loaded.show).toHaveBeenCalledExactlyOnceWith(image(2));
    expect(loaded.push.mock.invocationCallOrder[1]).toBeLessThan(loaded.show.mock.invocationCallOrder[0]);
  });

  it('forgets the images of the previous page when the page clears them', () => {
    const $imageViewer = page();
    $imageViewer.push(image(1));
    $imageViewer.clear();
    $imageViewer.push(image(3));
    $imageViewer.show(image(3));

    const loaded = viewer();
    registerImageViewer(loaded);
    expect(loaded.push.mock.calls).toEqual([[image(3)]]);
    expect(loaded.clear).not.toHaveBeenCalled();
  });

  it('gives nothing twice to a viewer registered again', () => {
    page().push(image(1));
    const first = viewer();
    registerImageViewer(first);
    registerImageViewer(null);
    const second = viewer();
    registerImageViewer(second);

    expect(first.push).toHaveBeenCalledOnce();
    expect(second.push).not.toHaveBeenCalled();
  });
});
