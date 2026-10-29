import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

import NearbyStopsSection from './NearbyStopsSection.vue';

import transportService from '@/js/apis/transport-service';

vi.mock('@/js/apis/transport-service', () => ({ default: { getStopareasForDocuments: vi.fn() } }));

const stop = (id: number, stoparea_name: string, line: string, x: number) => ({
  id,
  stoparea_name,
  line,
  operator: 'TER',
  distance: 1.2,
  coordinates: { x, y: 5750000 },
});

const accessWaypoint = {
  document_id: 2,
  type: 'w',
  waypoint_type: 'access',
  locales: [{ lang: 'fr', title: 'Parking' }],
};

// the map, its methods spied
const highlightStop = vi.fn();
const MapViewStub = defineComponent({
  name: 'MapView',
  emits: ['highlight-document'],
  setup(_, { expose }) {
    expose({ highlightStop, goAndZoomOnStop: vi.fn(), resetStopStyles: vi.fn() });
    return () => null;
  },
});

const mountSection = async () => {
  vi.mocked(transportService.getStopareasForDocuments).mockResolvedValue({
    // two lines at the station, one line in the village
    stopareas: [stop(10, 'Gare', 'L1', 650000), stop(11, 'Gare', 'L2', 650001), stop(20, 'Village', 'L3', 651000)],
    missingTransportForWaypoint: false,
    documentResults: { 2: true },
  } as never);

  const wrapper = mount(NearbyStopsSection, {
    props: {
      document: { type: 'r', document_id: 1, activities: [], associations: { waypoints: [accessWaypoint] } } as never,
    },
    global: {
      stubs: { MapView: MapViewStub },
      config: {
        globalProperties: {
          $gettext: (value: string) => value,
          $documentUtils: { getDocumentType: () => 'route' },
          $screen: { isMobile: false },
        } as never,
      },
    },
  });
  await flushPromises();
  return wrapper;
};

describe('NearbyStopsSection', () => {
  // jsdom has no scrollIntoView nor scrollTo on elements, which a click on a stop or a highlight call
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
    delete (Element.prototype as Partial<Element>).scrollTo;
    vi.restoreAllMocks();
  });

  it('shows the stops near the access points, by stop area', async () => {
    const wrapper = await mountSection();

    expect(wrapper.findAll('.stop-card').map((card) => card.find('.stop-header p').text())).toEqual([
      'Stop :  Gare',
      'Stop :  Village',
    ]);
    expect(wrapper.emitted('accessibility-info-changed')).toEqual([[true]]);
    // one stop document per stop location, for the map
    expect(
      (wrapper.emitted('stops-updated')![0][0] as { document_id: number }[]).map((doc) => doc.document_id)
    ).toEqual([10, 11, 20]);
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

  it('scrolls to the card of a stop highlighted on the map, though not the first of its area', async () => {
    const wrapper = await mountSection();
    const container = wrapper.find('.stop-cards').element;
    container.getBoundingClientRect = () => ({ top: 0, bottom: 100 }) as DOMRect;
    // the card of the station is below the visible part of the list
    wrapper.findAll('.stop-card')[0].element.getBoundingClientRect = () => ({ top: 150, bottom: 200 }) as DOMRect;

    wrapper.findComponent(MapViewStub).vm.$emit('highlight-document', { document_id: 11, isStopPoint: true });
    await flushPromises();

    expect(highlightStop).toHaveBeenCalledWith(11);
    expect(wrapper.find('.stop-card').classes()).toContain('selected-stop');
    expect(container.scrollTo).toHaveBeenCalledWith({ top: 110, behavior: 'smooth' });
  });
});
