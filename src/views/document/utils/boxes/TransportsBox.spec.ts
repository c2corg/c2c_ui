import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NearbyStopsSection from './NearbyStopsSection.vue';
import TransportsBox from './TransportsBox.vue';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const FRANCE = { document_id: 14274 };
const access = { type: 'w', document_id: 2, waypoint_type: 'access', maps: [{ type: 'w' }] };

const mountBox = (document: C2cDocument) =>
  shallowMount(TransportsBox, {
    props: { document },
    global: {
      stubs: { FaIcon: true },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $documentUtils: { getDocumentType: (type: string) => ({ r: 'route', w: 'waypoint' })[type] },
        } as never,
      },
    },
  });

describe('TransportsBox', () => {
  it('is shown for documents in France with an access waypoint', () => {
    const route = { type: 'r', areas: [FRANCE], associations: { waypoints: [access] } };

    expect(mountBox(route).find('.public-transports-box').exists()).toBe(true);
    expect(
      mountBox({ ...route, areas: [{ document_id: 1 }] })
        .find('.public-transports-box')
        .exists()
    ).toBe(false);
    expect(
      mountBox({ ...route, areas: [] })
        .find('.public-transports-box')
        .exists()
    ).toBe(false);
    expect(
      mountBox({ ...route, associations: { waypoints: [] } })
        .find('.public-transports-box')
        .exists()
    ).toBe(false);
  });

  it('gives the access waypoints as access points to the map, with the stops found', async () => {
    const wrapper = mountBox({ ...access, areas: [FRANCE] });
    const section = wrapper.findComponent(NearbyStopsSection);

    expect(section.props('mapDocuments')).toMatchObject([{ document_id: 2, type: 'z', maps: [{ type: 'z' }] }]);
    // the document itself is not changed
    expect(access.type).toBe('w');

    await section.vm.$emit('stops-updated', [{ type: 'stop', document_id: 3 }]);
    expect(section.props('mapDocuments')).toHaveLength(2);
  });

  it('opens once the stops have accessibility info, and shows its section buttons', async () => {
    const wrapper = mountBox({ ...access, areas: [FRANCE] });

    await wrapper.findComponent(NearbyStopsSection).vm.$emit('accessibility-info-changed', true);

    expect(wrapper.find('.hide-box-content').exists()).toBe(false);
    expect(wrapper.findAll('.public-transports-button')).toHaveLength(2);
  });
});
