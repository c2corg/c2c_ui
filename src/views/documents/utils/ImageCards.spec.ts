import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ImageCards from './ImageCards.vue';

import Thumbnail from '@/components/generics/Thumbnail.vue';

// '@/js/config' reads CAMPTOCAMP_CONFIG, a constant injected by Vite (see vite.config.ts)
const config = vi.hoisted(() => ({ urls: { media: 'https://media.example.org', modernThumbnailsTimestamp: 0 } }));
vi.mock('@/js/config', () => ({ default: config }));

const mountCards = (documents: object[]) =>
  mount(ImageCards, {
    props: { documents: { documents } },
    global: {
      mocks: { $documentUtils: { getDocumentTitle: () => 'Arête' } },
      components: { Thumbnail },
      stubs: { DocumentLink: { template: '<a><slot /></a>' } },
    },
  });

describe('ImageCards', () => {
  it('sizes each image from its aspect ratio, and offers BI for the wide ones', () => {
    const wrapper = mountCards([
      { document_id: 1, filename: 'a.jpg', width: 4000, height: 3000 },
      { document_id: 2, filename: 'b.jpg', width: 1000, height: 2000 },
    ]);

    const cards = wrapper.findAll('a');
    expect(cards.map((card) => card.attributes('style'))).toEqual(['--ratio: 1.3333333333333333;', '--ratio: 0.5;']);
    const images = wrapper.findAll('img');
    expect(images.map((img) => img.attributes('sizes'))).toEqual(['auto, 293px', 'auto, 110px']);
    expect(images[0].attributes()).toMatchObject({
      loading: 'lazy',
      srcset: 'https://media.example.org/aMI.jpg 400w, https://media.example.org/aBI.jpg 1500w',
    });
  });

  it('takes a 4:3 ratio for an image whose size is unknown', () => {
    const wrapper = mountCards([{ document_id: 3, filename: 'c.jpg' }]);
    expect(wrapper.find('a').attributes('style')).toBe('--ratio: 1.3333333333333333;');
  });
});
