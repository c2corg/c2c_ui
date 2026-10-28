// the yeti map layers stop listening to the map once the page is left
import { describe, expect, it, vi } from 'vitest';

import AreaLayer from './AreaLayer.vue';
import AvalancheBulletinsLayer from './AvalancheBulletinsLayer.vue';
import MapLayers from './MapLayers.vue';
import OverlaysLayers from './OverlaysLayers.vue';
import { mountInMap } from './test-utils';

import ElevationProfile from '@/components/yeti/ElevationProfile.vue';
import yetixEvents from '@/components/yeti/yetix-events';

vi.mock('@/components/yeti/Yetix.vue', async (importOriginal) => {
  const { default: Yetix } = await importOriginal<{ default: Record<string, unknown> }>();
  // no request for the areas
  Yetix.fetchAreas = () => new Promise(() => {});
  return { default: Yetix };
});

const handlers = (event: string) => yetixEvents.all.get(event)?.length ?? 0;

describe('yeti map layers events', () => {
  it.each([
    ['OverlaysLayers', OverlaysLayers, ['map-click', 'map-pointermove']],
    ['MapLayers', MapLayers, ['map-moveend']],
    ['AreaLayer', AreaLayer, ['map-moveend']],
    ['AvalancheBulletinsLayer', AvalancheBulletinsLayer, ['map-moveend']],
    ['ElevationProfile', ElevationProfile, ['showFeature', 'hideFeature']],
  ] as const)('%s removes its map handlers on unmount', (_, component, events) => {
    yetixEvents.all.clear();
    const { wrapper } = mountInMap(component, {
      stubs: {
        BaseLayers: true,
        SlopesLayers: true,
        ProtectedAreasLayer: true,
        MeteoLayer: true,
        WinterRouteLayer: true,
        AvalancheBulletinsLayer: true,
        DataAvalancheLayer: true,
        FfvlLayer: true,
        FlowcaptLayer: true,
        NivosesLayer: true,
        RommaLayer: true,
        RouteLayer: true,
        DropdownContent: true,
        DangerLevel: true,
        Info: true,
        InputCheckbox: true,
      },
      props: component === ElevationProfile ? { features: [] } : {},
    });
    events.forEach((event) => expect(handlers(event)).toBe(1));

    wrapper.unmount();

    events.forEach((event) => expect(handlers(event)).toBe(0));
  });
});
