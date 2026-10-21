import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import helperWindow, { registerHelperWindow } from './helper-window';
import imageViewer, { registerImageViewer } from './image-viewer';

import SocialNetworkSharing from '@/views/document/utils/SocialNetworkSharing';

const plugins = [helperWindow, imageViewer];

// the windows of App.vue, reached from any component without $root.$children
describe('$helper and $imageViewer', () => {
  afterEach(() => {
    registerHelperWindow(null);
    registerImageViewer(null);
  });

  it('give the registered window to every component', () => {
    const helper = { show: vi.fn() };
    const viewer = { push: vi.fn() };
    registerHelperWindow(helper);
    registerImageViewer(viewer);

    const wrapper = mount({ render: (h) => h('div') }, { global: { plugins } });

    expect(wrapper.vm.$helper).toBe(helper);
    expect(wrapper.vm.$imageViewer).toBe(viewer);
  });

  it('are registered by the windows themselves while mounted', async () => {
    const { default: HelperWindow } = await import('@/components/helper/HelperWindow');
    const window = mount(HelperWindow, {
      global: { plugins, stubs: { ModalCard: true }, mocks: { $gettext: (s) => s } },
    });
    const component = mount({ render: (h) => h('div') }, { global: { plugins } });

    expect(component.vm.$helper).toBe(window.vm);

    window.unmount();
    expect(component.vm.$helper).toBe(null);
  });
});

describe('$helper and $imageViewer in App.vue', () => {
  afterEach(() => registerHelperWindow(null));

  it('are usable by the pages while they are created, as in App.vue', async () => {
    const { default: HelperWindow } = await import('@/components/helper/HelperWindow');
    let seenByPage;
    // App.vue: the windows, then the router view; document views use $imageViewer in their created()
    const Page = {
      created() {
        seenByPage = this.$helper;
      },
      render: (h) => h('div'),
    };

    mount(
      {
        components: { HelperWindow, Page },
        render: (h) => h('div', [h('helper-window', { ref: 'helper' }), h('page')]),
      },
      { global: { plugins, stubs: { ModalCard: true }, mocks: { $gettext: (s) => s } } }
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
          $gettext: (s) => s,
          $gdpr: { get: () => null },
          $documentUtils: { getDocumentTitle: (document) => document.locales[0].title },
        },
      },
    });

    await wrapper.find('span[title=Share]').trigger('click');

    expect(share).toHaveBeenCalledWith({ title: 'Face nord', url: window.location.href });
  });
});
