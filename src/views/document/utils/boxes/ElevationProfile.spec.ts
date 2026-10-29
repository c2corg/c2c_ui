import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import ElevationProfile, {
  emitCursorEndEvent,
  emitCursorMoveEvent,
  emitToggleFullScreenEvent,
} from './ElevationProfile.vue';
import MapBox from './MapBox.vue';

import bus from '@/js/event-bus';

// the elevation profile and the map box only meet through 'elevation_profile' events: check both ends agree
describe('elevation_profile event', () => {
  afterEach(() => bus.all.clear());

  // the map box of an outing, whose profile has data
  const mapBox = () =>
    mount(MapBox, {
      props: { document: { type: 'o', document_id: 1 } },
      global: {
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

  it('shows nothing for a track without elevations', () => {
    const wrapper = mountProfile(track(false));

    expect(wrapper.emitted('has-data')).toBeUndefined();
    expect(wrapper.find('.elevation-profile-container').exists()).toBe(false);
  });
});
