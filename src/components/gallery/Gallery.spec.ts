import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Gallery from './Gallery.vue';

vi.mock('@/js/swiper-element', () => ({}));

const mountGallery = (images: object[]) =>
  mount(Gallery, {
    props: { images: images as never },
    global: {
      stubs: { Thumbnail: true },
      config: { globalProperties: { $imageViewer: { push: vi.fn(), show: vi.fn(), clear: vi.fn() } } as never },
    },
  });

describe('Gallery', () => {
  it('gives each slide the width of its image at 200 px high, when the API gives the size of the image', () => {
    const wrapper = mountGallery([
      { document_id: 1, locales: [{}], width: 4000, height: 3000 },
      { document_id: 2, locales: [{}], width: 3000, height: 4000 },
      { document_id: 3, locales: [{}] },
    ]);

    const styles = wrapper.findAll('swiper-slide').map((slide) => slide.attributes('style'));
    expect(styles[0]).toBe('height: 200px; width: 267px;');
    expect(styles[1]).toBe('height: 200px; width: 150px;');
    // unknown size: the image sizes the slide when it loads, as before
    expect(styles[2]).toBe('height: 200px;');
  });
});
