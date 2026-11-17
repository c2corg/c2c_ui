import { describe, expect, it } from 'vitest';

import { baseLayers, slopeLayers } from './map-layers';
import { parseMapUrl, withMapUrl, type MapUrlState } from './map-url-state';

const DEFAULT = baseLayers[0].title;
const state = (change: Partial<MapUrlState> = {}): MapUrlState => ({
  base: DEFAULT,
  slopes: [],
  overlays: [],
  protection: true,
  pin: '',
  ...change,
});

describe('parseMapUrl', () => {
  it('reads nothing from a query without map settings', () => {
    expect(parseMapUrl({ bbox: '1,2,3,4' })).toEqual({});
  });

  it('reads the layers, the overlays, the protection areas and the pinned side', () => {
    expect(
      parseMapUrl({ layer: 'swiss', slopes: 'ign,swiss', overlays: 'route,outing', protection: '0', pin: 'right' })
    ).toEqual({
      base: 'SwissTopo',
      slopes: ['IGN Slopes', 'SwissTopo Slopes'],
      overlays: ['outing', 'route'],
      protection: false,
      pin: 'right',
    });
  });

  it('ignores what it does not know', () => {
    expect(parseMapUrl({ layer: 'nope', slopes: 'nope,ign', overlays: 'nope', protection: '1', pin: 'left' })).toEqual({
      slopes: ['IGN Slopes'],
      overlays: [],
    });
  });

  it('takes the first of a repeated parameter', () => {
    expect(parseMapUrl({ layer: ['ign', 'swiss'], pin: ['top', 'right'] })).toEqual({ base: 'IGN maps', pin: 'top' });
  });
});

describe('withMapUrl', () => {
  it('writes only what differs from the default', () => {
    expect(withMapUrl({}, state(), DEFAULT)).toEqual({});
    expect(
      withMapUrl(
        {},
        state({
          base: 'SwissTopo',
          slopes: ['IGN Slopes'],
          overlays: ['outing', 'route'],
          protection: false,
          pin: 'top',
        }),
        DEFAULT
      )
    ).toEqual({ layer: 'swiss', slopes: 'ign', overlays: 'outing,route', protection: '0', pin: 'top' });
  });

  it('keeps the other parameters and removes the settings that are back to the default', () => {
    expect(withMapUrl({ bbox: '1,2,3,4', overlays: 'outing', layer: 'ign' }, state(), DEFAULT)).toEqual({
      bbox: '1,2,3,4',
    });
  });

  it('gives an id to every layer, and one that comes back', () => {
    for (const layer of baseLayers) {
      const { layer: id } = withMapUrl({}, state({ base: layer.title }), '');
      expect(parseMapUrl({ layer: id as string }).base).toBe(layer.title);
    }
    for (const layer of slopeLayers) {
      const { slopes } = withMapUrl({}, state({ slopes: [layer.title] }), DEFAULT);
      expect(parseMapUrl({ slopes: slopes as string }).slopes).toEqual([layer.title]);
    }
  });
});
