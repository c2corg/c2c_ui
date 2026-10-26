import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NearbyStopsSection from './NearbyStopsSection.vue';

const stop = (id: number, stoparea_name: string, line: string) => ({
  id,
  stoparea_name,
  line,
  operator: 'TER',
  distance: 1.2,
});

const mountSection = async () => {
  const wrapper = mount(NearbyStopsSection, {
    props: { document: { type: 'r', document_id: 1, activities: [], associations: { waypoints: [] } } },
    global: {
      stubs: { MapView: true },
      config: {
        globalProperties: {
          $gettext: (value: string) => value,
          $documentUtils: { getDocumentType: () => 'route' },
          $screen: { isMobile: false },
        } as never,
      },
    },
  });
  await wrapper.setData({
    showAccessibilityInfo: true,
    stops: [stop(10, 'Gare', 'L1'), stop(11, 'Gare', 'L2'), stop(20, 'Village', 'L3')],
  });
  return wrapper;
};

describe('NearbyStopsSection', () => {
  // jsdom has no scrollIntoView, which a click on a stop calls: Vue 3 reports its error instead of logging it
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  it('expands and collapses the lines of a stop on click', async () => {
    const wrapper = await mountSection();
    const [gare, village] = wrapper.findAll('.stop-card');

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
    const [gare, village] = wrapper.findAll('.stop-card');

    await gare.trigger('click');
    await village.trigger('click');

    expect(gare.findAll('.line-details')).toHaveLength(2);
    expect(village.findAll('.line-details')).toHaveLength(1);
  });
});
