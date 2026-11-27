import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Thumbnail from './Thumbnail.vue';

// '@/js/config' reads CAMPTOCAMP_CONFIG, a constant injected by Vite (see vite.config.ts)
const config = vi.hoisted(() => ({ urls: { media: 'https://media.example.org', modernThumbnailsTimestamp: 0 } }));
vi.mock('@/js/config', () => ({ default: config }));

const image = { document_id: 1, filename: 'photo.jpg' };

describe('Thumbnail', () => {
  it('puts the classes and style on the picture, the other attributes on the image', () => {
    const wrapper = mount(Thumbnail, {
      props: { img: image, size: 'MI' },
      attrs: { class: 'is-pulled-right', style: 'width: 10px;', alt: 'Arête', title: 'Arête', loading: 'lazy' },
    });

    const picture = wrapper.find('picture');
    const img = wrapper.find('img');
    expect(picture.classes()).toEqual(['is-pulled-right']);
    expect(picture.attributes('style')).toBe('width: 10px;');
    expect(img.attributes()).toMatchObject({ alt: 'Arête', title: 'Arête', loading: 'lazy' });
    expect(img.attributes('class')).toBeUndefined();
    expect(img.attributes('style')).toBeUndefined();
  });

  it('calls a click listener once, from the image', async () => {
    const onClick = vi.fn();
    const wrapper = mount(Thumbnail, { props: { img: image, size: 'MI' }, attrs: { onClick } });

    await wrapper.find('img').trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('reserves the size of the thumbnail on the image when asked, from the size of the original', () => {
    const photo = { ...image, width: 3000, height: 4000 };
    const reserved = mount(Thumbnail, { props: { img: photo, size: 'BI', reserveSize: true } }).find('img');
    expect(reserved.attributes()).toMatchObject({ width: '1125', height: '1500' });

    // not asked, or the original's size unknown: nothing, CSS sizes the image
    expect(
      mount(Thumbnail, { props: { img: photo, size: 'BI' } })
        .find('img')
        .attributes('width')
    ).toBeUndefined();
    const unknown = mount(Thumbnail, { props: { img: image, size: 'BI', reserveSize: true } }).find('img');
    expect(unknown.attributes('width')).toBeUndefined();
  });

  it('offers BI too when given sizes, for an image shown bigger than its thumbnail', () => {
    const photo = { ...image, width: 4000, height: 3000 };
    const img = mount(Thumbnail, { props: { img: photo, size: 'MI', sizes: 'auto, 293px' } }).find('img');
    expect(img.attributes()).toMatchObject({
      src: 'https://media.example.org/photoMI.jpg',
      srcset: 'https://media.example.org/photoMI.jpg 400w, https://media.example.org/photoBI.jpg 1500w',
      sizes: 'auto, 293px',
    });

    // without sizes: the thumbnail only
    const plain = mount(Thumbnail, { props: { img: photo, size: 'MI' } }).find('img');
    expect(plain.attributes('srcset')).toBeUndefined();
    expect(plain.attributes('sizes')).toBeUndefined();
  });
});

describe('Thumbnail fallback', () => {
  it('falls back to the basic image when the modern one fails', async () => {
    config.urls.modernThumbnailsTimestamp = 1;
    // uploaded after modernThumbnailsTimestamp: it has an AVIF version, and no WebP one (c2corg/c2c_images#1160)
    const wrapper = mount(Thumbnail, {
      props: { img: { document_id: 2, filename: '1588000000_123456.jpg' }, size: 'MI' },
    });
    const img = wrapper.find('img');
    const sources = wrapper.findAll('source');
    expect(sources.map((source) => source.attributes('type'))).toEqual(['image/avif']);

    await img.trigger('error');

    expect(sources[0].attributes('srcset')).toBe(img.attributes('src'));
    config.urls.modernThumbnailsTimestamp = 0;
  });

  it('offers the AVIF thumbnail and BI of a responsive image', () => {
    config.urls.modernThumbnailsTimestamp = 1;
    const wrapper = mount(Thumbnail, {
      props: {
        img: { document_id: 2, filename: '1588000000_123456.jpg', width: 4000, height: 3000 },
        size: 'MI',
        sizes: 'auto, 293px',
      },
    });
    expect(wrapper.find('source').attributes()).toMatchObject({
      srcset:
        'https://media.example.org/1588000000_123456MI.avif 400w, https://media.example.org/1588000000_123456BI.avif 1500w',
      sizes: 'auto, 293px',
    });
    config.urls.modernThumbnailsTimestamp = 0;
  });
});
