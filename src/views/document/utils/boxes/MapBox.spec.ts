import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MapBox from './MapBox.vue';

describe('MapBox', () => {
  it('separates the areas with spaces', () => {
    const areas = ['France', 'Isère', 'Vercors'].map((name, i) => ({ document_id: i, name }));
    const wrapper = mount(MapBox, {
      props: { document: { type: 'r', document_id: 1, areas } },
      global: {
        stubs: {
          DocumentLink: { props: ['document'], template: '<a>{{ document.name }}</a>' },
          IconArea: true,
          MapView: true,
          MapLinks: true,
          ElevationProfile: true,
          FaIcon: true,
        },
        config: {
          globalProperties: {
            $gettext: (value: string) => value,
            $documentUtils: { getDocumentType: () => 'route' },
            $screen: { isMobile: false },
          } as never,
        },
      },
    });

    expect(wrapper.find('.has-text-centered').text()).toBe('France Isère Vercors');
  });
});
