import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import ElevationProfile from './ElevationProfile.vue';
import MapBox from './MapBox.vue';

import bus from '@/js/event-bus';

// the methods of the elevation profile (Options API) that emit its events
type ProfileEvents = Record<
  'emitToggleFullScreenEvent' | 'emitCursorMoveEvent' | 'emitCursorEndEvent',
  (...args: unknown[]) => void
>;
const profile = (ElevationProfile as unknown as { methods: ProfileEvents }).methods;

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

    profile.emitToggleFullScreenEvent.call({}, true);
    await nextTick();
    expect(withProfile(wrapper)).toBe(false);

    profile.emitToggleFullScreenEvent.call({}, false);
    await nextTick();
    expect(withProfile(wrapper)).toBe(true);
  });

  it('ignores the cursor events', async () => {
    const wrapper = mapBox();

    profile.emitCursorMoveEvent.call({}, [1, 2]);
    profile.emitCursorEndEvent.call({});
    await nextTick();

    expect(withProfile(wrapper)).toBe(true);
  });

  it('stops listening once the map box is gone', async () => {
    const wrapper = mapBox();
    wrapper.unmount();

    expect(bus.all.get('elevation_profile') ?? []).toHaveLength(0);
  });
});
