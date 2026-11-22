import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import WaypointsMapView from './WaypointsMapView.vue';

import { EUROPE_BBOX, WIDE_BBOX } from '@/components/map/default-extents';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

// the requests of the waypoints, answered when the test says
type Answer = (documents: object[], total: number) => void;
const mockRequests = () => {
  const answers: Answer[] = [];
  const getAll = vi.spyOn(c2c.waypoint as DocumentService, 'getAll').mockImplementation(() => {
    const request = {
      then(callback: (response: { data: { documents: object[]; total: number } }) => void) {
        answers.push((documents, total) => callback({ data: { documents, total } }));
        return request;
      },
    };
    return request as never;
  });
  return { getAll, answers };
};

const mountView = async (url: string, isMobile = false) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/map', name: 'waypoints-map', component: { render: () => null } },
      { path: '/routes', name: 'routes', component: { render: () => null } },
    ],
  });
  await router.push(url);
  const wrapper = shallowMount(WaypointsMapView, {
    global: {
      plugins: [router],
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $language: { current: 'fr' },
          $screen: { isMobile },
        } as never,
      },
      stubs: {
        MapView: {
          name: 'MapView',
          props: { documents: Array, forceFilter: Boolean, compactMarkers: Boolean, monochromeMarkers: Boolean },
          render: () => null,
        },
      },
    },
  });
  await flushPromises();
  const map = () => wrapper.findComponent({ name: 'MapView' });
  const zoomTo = async (zoom: number) => {
    map().vm.$emit('zoom', zoom);
    await flushPromises();
  };
  const hint = () => (wrapper.find('.map-hint').exists() ? wrapper.find('.map-hint').text() : null);
  return { wrapper, router, map, zoomTo, hint };
};

const waypoint = (id: number) => ({ document_id: id, type: 'w' });

describe('WaypointsMapView', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens on a large area without an extent in its link: Europe on a phone', async () => {
    mockRequests();
    expect((await mountView('/map?overlays=outing')).router.currentRoute.value.query).toEqual({
      overlays: 'outing',
      bbox: WIDE_BBOX,
    });
    expect((await mountView('/map', true)).router.currentRoute.value.query).toEqual({ bbox: EUROPE_BBOX });
  });

  it('shows the waypoints of the view from zoom 11 (OpenLayers, 10 of MapLibre), up to 500, with the filters of the link', async () => {
    const { getAll, answers } = mockRequests();
    const { map, zoomTo, hint } = await mountView('/map?bbox=1,2,3,4&wtyp=summit&overlays=outing');
    expect(map().props()).toMatchObject({ forceFilter: true, compactMarkers: true, monochromeMarkers: false });

    await zoomTo(9.4);
    expect(getAll).not.toHaveBeenCalled();
    expect(hint()).toBe('Zoom in to see the waypoints');

    await zoomTo(9.5);
    expect(getAll).toHaveBeenCalledWith({ bbox: '1,2,3,4', wtyp: 'summit', limit: 500, pl: 'fr' });
    answers[0]([waypoint(1), waypoint(2)], 2);
    await flushPromises();
    expect(map().props('documents')).toEqual([waypoint(1), waypoint(2)]);
    expect(hint()).toBeNull();

    // zoomed in further: the same search
    await zoomTo(13);
    expect(getAll).toHaveBeenCalledTimes(1);

    await zoomTo(8);
    expect(map().props('documents')).toEqual([]);
  });

  it('keeps the waypoints shown until those of the last move come, and says when some are missing', async () => {
    const { answers } = mockRequests();
    const { router, map, zoomTo, hint } = await mountView('/map?bbox=1,2,3,4&monochrome=true');
    // the markers all in the colour of the site, as asked
    expect(map().props('monochromeMarkers')).toBe(true);
    await zoomTo(12);
    answers[0]([waypoint(1)], 1);
    await router.replace({ query: { bbox: '5,6,7,8' } });
    await router.replace({ query: { bbox: '9,10,11,12' } });
    await flushPromises();
    expect(map().props('documents')).toEqual([waypoint(1)]);

    answers[2]([waypoint(3), waypoint(4)], 900);
    // a late answer to a previous move
    answers[1]([waypoint(5)], 1);
    await flushPromises();
    expect(map().props('documents')).toEqual([waypoint(3), waypoint(4)]);
    expect(hint()).toBe('Zoom in to see all the waypoints (2 / 900)');
  });
});
