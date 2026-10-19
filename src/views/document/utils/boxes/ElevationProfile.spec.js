import { afterEach, describe, expect, it } from 'vitest';

import ElevationProfile from './ElevationProfile';
import MapBox from './MapBox';

import bus from '@/js/event-bus';

// the elevation profile and the map box only meet through 'elevation_profile' events: check both ends agree
describe('elevation_profile event', () => {
  afterEach(() => bus.all.clear());

  const mapBox = () => {
    const box = { elevationProfileHidden: false };
    bus.on('elevation_profile', (event) => MapBox.methods.onElevationProfile.call(box, event));
    return box;
  };

  it('hides and shows the profile of the map box with the full screen toggle', () => {
    const box = mapBox();

    ElevationProfile.methods.emitToggleFullScreenEvent.call({}, true);
    expect(box.elevationProfileHidden).toBe(true);

    ElevationProfile.methods.emitToggleFullScreenEvent.call({}, false);
    expect(box.elevationProfileHidden).toBe(false);
  });

  it('ignores the cursor events', () => {
    const box = mapBox();

    ElevationProfile.methods.emitCursorMoveEvent.call({}, [1, 2]);
    ElevationProfile.methods.emitCursorEndEvent.call({});

    expect(box.elevationProfileHidden).toBe(false);
  });
});
