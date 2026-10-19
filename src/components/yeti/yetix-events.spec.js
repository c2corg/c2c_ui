import { afterEach, describe, expect, it, vi } from 'vitest';

import ElevationProfile from './ElevationProfile';
import RouteLayer from './map-layers/RouteLayer';
import yetixEvents from './yetix-events';

// the elevation profile and the route layer only meet through 'elevationProfile' events: check both ends agree
describe('yetix elevationProfile event', () => {
  afterEach(() => yetixEvents.all.clear());

  const routeLayer = () => {
    const layer = {
      elevationPointLayer: { setVisible: vi.fn() },
      elevationPoint: { setGeometry: vi.fn() },
    };
    yetixEvents.on('elevationProfile', (event) => RouteLayer.methods.onElevationProfile.call(layer, event));
    return layer;
  };

  it('shows the point under the cursor of the profile on the map', () => {
    const layer = routeLayer();

    ElevationProfile.methods.emitCursorMoveEvent.call({}, [650000, 5750000]);

    expect(layer.elevationPointLayer.setVisible).toHaveBeenCalledWith(true);
    expect(layer.elevationPoint.setGeometry.mock.calls[0][0].getCoordinates()).toEqual([650000, 5750000]);
  });

  it('hides it when the cursor leaves the profile', () => {
    const layer = routeLayer();

    ElevationProfile.methods.emitCursorEndEvent.call({});

    expect(layer.elevationPointLayer.setVisible).toHaveBeenCalledWith(false);
  });
});
