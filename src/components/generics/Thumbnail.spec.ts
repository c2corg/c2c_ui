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
});

describe('Thumbnail fallback', () => {
  it('falls back to the basic image when the modern one fails', async () => {
    config.urls.modernThumbnailsTimestamp = 1;
    // uploaded after modernThumbnailsTimestamp: it has avif and webp versions
    const wrapper = mount(Thumbnail, {
      props: { img: { document_id: 2, filename: '1588000000_123456.jpg' }, size: 'MI' },
    });
    const img = wrapper.find('img');

    await img.trigger('error');

    const sources = wrapper.findAll('source');
    expect(sources[0].attributes('srcset')).toBe(img.attributes('src'));
    expect(sources[1].attributes('srcset')).toBe(img.attributes('src'));
    config.urls.modernThumbnailsTimestamp = 0;
  });
});
