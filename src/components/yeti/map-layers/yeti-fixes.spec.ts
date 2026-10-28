import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import Map from 'ol/Map';
import View from 'ol/View';
import { containsExtent } from 'ol/extent';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DataAvalancheLayer from './DataAvalancheLayer.vue';
import RouteLayer from './RouteLayer.vue';

import ol from '@/js/libs/ol';

// not implemented in jsdom, needed by ol.Map
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  }
);

type Methods = Record<string, (this: object, ...args: unknown[]) => unknown>;
const methodsOf = (component: unknown) => (component as { methods: Methods }).methods;

afterEach(() => {
  vi.useRealTimers();
});

describe('DataAvalancheLayer dates', () => {
  // the dates of the avalanches are days (YYYY-MM-DD): compared to today, not to the time of today
  it('counts the days since an avalanche from today, whatever the time', () => {
    vi.useFakeTimers({ now: new Date('2026-01-15T22:00:00') });
    const wrapper = mount(DataAvalancheLayer, {
      global: {
        provide: { yetiMap: { map: { addLayer() {}, addOverlay() {}, getView: () => null }, getExtent: () => [] } },
        config: {
          globalProperties: {
            $gettext: (text: string) => text,
            $dateUtils: { toLocalizedString: (date: Date, format: string) => dayjs(date).format(format) },
          } as never,
        },
        stubs: { IconLayer: true },
      },
    });
    // Vue Test Utils reaches the <script setup> bindings
    const { dateValid, differenceDays } = wrapper.vm as unknown as {
      dateValid(date: string, days: number): boolean;
      differenceDays(date: string): number;
    };

    expect(differenceDays('2026-01-14')).toBe(1);
    expect(dateValid('2026-01-13', 2)).toBe(false);
    expect(dateValid('2026-01-14', 2)).toBe(true);
  });
});

describe('RouteLayer fitMapToFeatures', () => {
  it('shows the whole route, however long', () => {
    const view = new View({ center: [0, 0], resolution: 1 });
    const map = new Map({ view });
    vi.spyOn(map, 'getSize').mockReturnValue([1000, 1000]);
    const source = new ol.source.Vector();
    source.addFeature(
      new ol.Feature(
        new ol.geom.LineString([
          [0, 0],
          [200000, 200000],
        ])
      )
    );
    const layer = { map, view, featuresLayerSource: source, validMinimumMapZoom: 13, zoomDelta: 0.5 };

    methodsOf(RouteLayer).fitMapToFeatures.call(layer);

    // the extent of the route fits in the view: no minimum zoom cuts it
    const extent = view.calculateExtent([1000, 1000]);
    expect(containsExtent(extent, source.getExtent()!)).toBe(true);
  });
});
