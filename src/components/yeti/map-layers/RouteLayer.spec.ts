// the route of the yeti portal: drawn on the map, and shown on the elevation profile
import { mount } from '@vue/test-utils';
import { containsExtent } from 'ol/extent';
import type Point from 'ol/geom/Point';
import type VectorLayer from 'ol/layer/Vector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import RouteLayer from './RouteLayer.vue';
import { getSortedFeatures } from './route-features';

import ElevationProfile from '@/components/yeti/ElevationProfile.vue';
import yetixEvents from '@/components/yeti/yetix-events';
import ol from '@/js/libs/ol';

// not implemented in jsdom, needed by ol.Map
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  }
);

const line = (...coords: number[][]) => new ol.Feature(new ol.geom.LineString(coords));

const mountRouteLayer = async () => {
  const map = new ol.Map({ view: new ol.View({ center: [0, 0], resolution: 1 }) });
  vi.spyOn(map, 'getSize').mockReturnValue([1000, 1000]);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { render: () => null } }],
  });
  await router.push('/');
  const wrapper = mount(RouteLayer, {
    global: {
      plugins: [router],
      provide: { yetiMap: { map, getExtent: () => map.getView().calculateExtent([1000, 1000]) } },
      config: { globalProperties: { $gettext: (text: string) => text, $language: { current: 'fr' } } as never },
      stubs: { FaIcon: true },
    },
  });
  return { wrapper, map };
};

afterEach(() => {
  yetixEvents.all.clear();
  vi.restoreAllMocks();
});

describe('RouteLayer', () => {
  it('shows the whole route on the map, however long', async () => {
    const { wrapper, map } = await mountRouteLayer();

    yetixEvents.emit('addFeature', line([0, 0], [200000, 200000]));
    yetixEvents.emit('fit-map-to-features');

    // the extent of the route fits in the view: no minimum zoom cuts it
    const extent = map.getView().calculateExtent([1000, 1000]);
    expect(containsExtent(extent, [0, 0, 200000, 200000])).toBe(true);
    wrapper.unmount();
  });

  it('shows on the map the point under the cursor of the elevation profile', async () => {
    const { wrapper, map } = await mountRouteLayer();
    const profile = mount(ElevationProfile, {
      props: { features: [] },
      global: {
        config: { globalProperties: { $gettext: (text: string) => text } as never },
        stubs: { Info: true, InputCheckbox: true },
      },
    });
    // the elevation point layer: the last one added, with one feature
    const pointLayer = map.getLayers().getArray().at(-1) as VectorLayer;
    const { emitCursorMoveEvent, emitCursorEndEvent } = profile.vm as unknown as {
      emitCursorMoveEvent(coord: number[]): void;
      emitCursorEndEvent(): void;
    };

    emitCursorMoveEvent([650000, 5750000]);
    expect(pointLayer.getVisible()).toBe(true);
    expect((pointLayer.getSource()!.getFeatures()[0].getGeometry() as Point).getCoordinates()).toEqual([
      650000, 5750000,
    ]);

    emitCursorEndEvent();
    expect(pointLayer.getVisible()).toBe(false);
    profile.unmount();
    wrapper.unmount();
  });

  it('stops listening to the panels and the profile once the page is left', async () => {
    const { wrapper } = await mountRouteLayer();
    const events = ['addFeature', 'removeFeature', 'gpx', 'simplify', 'elevationProfile', 'fit-map-to-features'];
    events.forEach((event) => expect(yetixEvents.all.get(event)).toHaveLength(1));

    wrapper.unmount();

    events.forEach((event) => expect(yetixEvents.all.get(event) ?? []).toHaveLength(0));
  });
});

describe('getSortedFeatures', () => {
  it('sorts the line chunks in their order of creation', () => {
    const [first, second, third] = [line([0, 0], [1, 1]), line([1, 1], [2, 2]), line([2, 2], [3, 3])];

    expect(getSortedFeatures([third, first, second])).toEqual([first, second, third]);
  });
});
