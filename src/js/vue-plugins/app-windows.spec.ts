import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import helperWindow, { registerHelperWindow } from './helper-window';
import imageViewer, { registerImageViewer } from './image-viewer';

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

    expect(wrapper.vm.$helper).toBe(helper);
    expect(wrapper.vm.$imageViewer).toBe(viewer);
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
        mocks: {
          $gettext: (s: string) => s,
          $gdpr: { get: () => null },
          $documentUtils: {
            getDocumentTitle: (document: { locales: { title: string }[] }) => document.locales[0].title,
          },
        },
      },
    });

    await wrapper.find('span[title=Share]').trigger('click');

    expect(share).toHaveBeenCalledWith({ title: 'Face nord', url: window.location.href });
  });
});
