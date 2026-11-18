import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import ElevationProfile, {
  emitCursorEndEvent,
  emitCursorMoveEvent,
  emitToggleFullScreenEvent,
  pointsByPart,
  profilePoints,
} from './ElevationProfile.vue';
import MapBox from './MapBox.vue';

import bus from '@/js/event-bus';
import d3 from '@/js/libs/d3';

// the elevation profile and the map box only meet through 'elevation_profile' events: check both ends agree
describe('elevation_profile event', () => {
  afterEach(() => bus.all.clear());

  // the map box of an outing, whose profile has data
  const mapBox = () =>
    mount(MapBox, {
      props: { document: { type: 'o', document_id: 1 } },
      global: {
        plugins: [
          createRouter({
            history: createMemoryHistory(),
            routes: [{ path: '/:p(.*)*', component: { render: () => null } }],
          }),
        ],
        stubs: { MapView: true, MapLinks: true, ElevationProfile: true, FaIcon: true },
        config: {
          globalProperties: {
            $gettext: (value: string) => value,
            $documentUtils: { getDocumentType: () => 'outing' },
            $screen: { isMobile: false },
          } as never,
        },
      },
    });
  const withProfile = (wrapper: ReturnType<typeof mapBox>) =>
    wrapper.find('.map-container').classes().includes('with-elevation-profile');

  it('hides and shows the profile of the map box with the full screen toggle', async () => {
    const wrapper = mapBox();
    expect(withProfile(wrapper)).toBe(true);

    emitToggleFullScreenEvent(true);
    await nextTick();
    expect(withProfile(wrapper)).toBe(false);

    emitToggleFullScreenEvent(false);
    await nextTick();
    expect(withProfile(wrapper)).toBe(true);
  });

  it('ignores the cursor events', async () => {
    const wrapper = mapBox();

    emitCursorMoveEvent([1, 2]);
    emitCursorEndEvent();
    await nextTick();

    expect(withProfile(wrapper)).toBe(true);
  });

  it('stops listening once the map box is gone', async () => {
    const wrapper = mapBox();
    wrapper.unmount();

    expect(bus.all.get('elevation_profile') ?? []).toHaveLength(0);
  });
});

describe('ElevationProfile', () => {
  // a track with elevations and times, in EPSG:3857
  const track = (withElevation = true) =>
    JSON.stringify({
      type: 'LineString',
      coordinates: [
        [700000, 5700000, withElevation ? 1000 : 0, 1600000000],
        [700100, 5700100, withElevation ? 1100 : 0, 1600000600],
        [700200, 5700200, withElevation ? 1250 : 0, 1600001200],
      ],
    });

  const mountProfile = (geom_detail: string) =>
    mount(ElevationProfile, {
      props: { document: { type: 'o', geometry: { geom_detail } } },
      attachTo: document.body,
      global: {
        directives: { translate: {} },
        stubs: { FaIcon: true },
        config: { globalProperties: { $gettext: (text: string) => text } as never },
      },
    });

  it('draws the profile of a track with elevations, by distance or time', async () => {
    // jsdom has no layout
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
      }
    );
    const wrapper = mountProfile(track());

    expect(wrapper.emitted('has-data')).toHaveLength(1);
    // drawn once the d3 modules are loaded
    await vi.waitFor(() => expect(wrapper.find('.elevation-profile-chart svg path.line').exists()).toBe(true), {
      timeout: 10000,
    });
    expect(wrapper.findAll('input[type=radio]')).toHaveLength(2);
    wrapper.unmount();
    vi.unstubAllGlobals();
  });

  it('reads a track whose first line is empty', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
      }
    );
    const lines = JSON.parse(track()).coordinates;
    const wrapper = mountProfile(JSON.stringify({ type: 'MultiLineString', coordinates: [[], lines] }));

    expect(wrapper.emitted('has-data')).toHaveLength(1);
    await vi.waitFor(() => expect(wrapper.find('.elevation-profile-chart svg path.line').exists()).toBe(true), {
      timeout: 10000,
    });
    // the 3 points of the second line, and nothing else
    const path = wrapper.find('path.line').attributes('d')!;
    expect(path).not.toContain('NaN');
    expect(path.match(/[ML]/g)).toEqual(['M', 'L', 'L']);
    wrapper.unmount();
    vi.unstubAllGlobals();
  });

  it('shows nothing for a track without elevations', () => {
    const wrapper = mountProfile(track(false));

    expect(wrapper.emitted('has-data')).toBeUndefined();
    expect(wrapper.find('.elevation-profile-container').exists()).toBe(false);
  });

  describe('of a track of several lines', () => {
    // two lines about 100 m long each (100 m east and north in EPSG:3857), 10 km apart, with a 1 hour gap
    const line = (x: number, time: number) => [
      [x, 5700000, 1000, time],
      [x + 100, 5700100, 1100, time + 600],
    ];
    const lines = [line(700000, 1600000000), line(710000, 1600004200)];
    const loaded = () => new Promise<void>((resolve) => d3.then(resolve));

    it('does not count the gap between the lines in the distance', async () => {
      await loaded();
      const points = profilePoints(lines, true);

      const lineLength = points[1].d;
      expect(lineLength).toBeGreaterThan(0.09);
      expect(lineLength).toBeLessThan(0.11);
      // the second line starts where the first one ended
      expect(points[0].d).toBe(0);
      expect(points[2].d).toBe(lineLength);
      expect(points[3].d).toBeCloseTo(2 * lineLength, 9);
      expect(points.map((point) => point.part)).toEqual([0, 0, 1, 1]);
    });

    it('keeps the time of the gap between the lines', async () => {
      await loaded();
      const points = profilePoints(lines, true);

      expect(points.map((point) => point.elapsed! / 60000)).toEqual([0, 10, 70, 80]);
    });

    it('splits the points by line, to draw no line across the gap', async () => {
      await loaded();
      const parts = pointsByPart(profilePoints(lines, false));

      expect(parts.map((part) => part.length)).toEqual([2, 2]);
    });

    it('draws one line per part, in the same path', async () => {
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe() {}
          unobserve() {}
        }
      );
      const wrapper = mountProfile(JSON.stringify({ type: 'MultiLineString', coordinates: lines }));

      await vi.waitFor(() => expect(wrapper.find('.elevation-profile-chart svg path.line').exists()).toBe(true), {
        timeout: 10000,
      });
      // a move to the start of each line
      expect(wrapper.find('path.line').attributes('d')!.match(/M/g)).toHaveLength(2);
      wrapper.unmount();
      vi.unstubAllGlobals();
    });
  });
});
