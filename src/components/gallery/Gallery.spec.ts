import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Gallery from './Gallery.vue';

vi.mock('@/js/swiper-element', () => ({}));

const mountGallery = (images: object[], priority = false, isMobile = false) =>
  mount(Gallery, {
    props: { images: images as never, priority },
    global: {
      stubs: { Thumbnail: true },
      config: {
        globalProperties: {
          $imageViewer: { push: vi.fn(), show: vi.fn(), clear: vi.fn() },
          $screen: { isMobile },
        } as never,
      },
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

  const sixImages = Array.from({ length: 6 }, (_, i) => ({ document_id: i + 1, locales: [{}] }));

  it('loads its images lazily by default', () => {
    const thumbnails = mountGallery(sixImages).findAll('thumbnail-stub');
    expect(thumbnails.map((thumbnail) => thumbnail.attributes('loading'))).toEqual(Array(6).fill('lazy'));
    expect(thumbnails.some((thumbnail) => thumbnail.attributes('fetchpriority'))).toBe(false);
  });

  it('with priority, loads its first 2 images right away on a phone', () => {
    const thumbnails = mountGallery(sixImages, true, true).findAll('thumbnail-stub');
    expect(thumbnails.map((thumbnail) => thumbnail.attributes('loading'))).toEqual([
      'eager',
      'eager',
      'lazy',
      'lazy',
      'lazy',
      'lazy',
    ]);
    expect(thumbnails[0].attributes('fetchpriority')).toBe('high');
  });

  it('with priority, loads its first 4 images right away on a wider screen, the first one with a high priority', () => {
    const thumbnails = mountGallery(sixImages, true).findAll('thumbnail-stub');
    expect(thumbnails.map((thumbnail) => thumbnail.attributes('loading'))).toEqual([
      'eager',
      'eager',
      'eager',
      'eager',
      'lazy',
      'lazy',
    ]);
    expect(thumbnails.map((thumbnail) => thumbnail.attributes('fetchpriority'))).toEqual([
      'high',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});
