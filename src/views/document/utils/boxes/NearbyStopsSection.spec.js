import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NearbyStopsSection from './NearbyStopsSection';

const stop = (id, stoparea_name, line) => ({ id, stoparea_name, line, operator: 'TER', distance: 1.2 });

const mountSection = async () => {
  const wrapper = mount(NearbyStopsSection, {
    propsData: { document: { type: 'r', document_id: 1, activities: [], associations: { waypoints: [] } } },
    stubs: { MapView: true },
    mocks: {
      $gettext: (value) => value,
      $documentUtils: { getDocumentType: () => 'route' },
      $screen: { isMobile: false },
    },
  });
  await wrapper.setData({
    showAccessibilityInfo: true,
    stops: [stop(10, 'Gare', 'L1'), stop(11, 'Gare', 'L2'), stop(20, 'Village', 'L3')],
  });
  return wrapper;
};

describe('NearbyStopsSection', () => {
  it('expands and collapses the lines of a stop on click', async () => {
    const wrapper = await mountSection();
    const [gare, village] = wrapper.findAll('.stop-card').wrappers;

    await gare.trigger('click');
    expect(gare.findAll('.line-details')).toHaveLength(2);
    expect(village.find('.stop-details').exists()).toBe(false);

    // same stop again: only the expanded state changes
    await gare.trigger('click');
    expect(gare.find('.stop-details').exists()).toBe(false);
    expect(gare.text()).toContain('See lines details');
  });

  it('keeps each stop expanded independently', async () => {
    const wrapper = await mountSection();
    const [gare, village] = wrapper.findAll('.stop-card').wrappers;

    await gare.trigger('click');
    await village.trigger('click');

    expect(gare.findAll('.line-details')).toHaveLength(2);
    expect(village.findAll('.line-details')).toHaveLength(1);
  });
});
