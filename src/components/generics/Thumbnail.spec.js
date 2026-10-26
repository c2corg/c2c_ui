import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Thumbnail from './Thumbnail';

const image = { filename: 'photo.jpg' };

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
