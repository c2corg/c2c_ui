import { afterEach, describe, expect, it } from 'vitest';

import { baseLayers, slopeLayers } from './map-layers';
import {
  parseMapUrl,
  storedLayerCategory,
  storedMapSettings,
  storedPin,
  storeMapSettings,
  storePin,
  withMapUrl,
  type MapUrlState,
} from './map-url-state';

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
    expect(parseMapUrl({ pin: 'window' })).toEqual({ pin: 'window' });
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

describe('settings stored on this device', () => {
  afterEach(() => window.localStorage.removeItem('DocumentMap.preferences'));

  it('stores what differs from the default, with the ids of the URL, but no overlays nor pinned side', () => {
    storeMapSettings({ category: 'national', slopes: ['IGN Slopes'] }, DEFAULT);
    storeMapSettings({ protection: false }, DEFAULT);

    expect(JSON.parse(window.localStorage.getItem('DocumentMap.preferences')!)).toEqual({
      settings: { category: 'national', slopes: 'ign', protection: '0' },
    });
    expect(storedMapSettings()).toEqual({ slopes: ['IGN Slopes'], protection: false });
    expect(storedLayerCategory()).toBe('national');

    // the category of the default layer is the default
    storeMapSettings({ category: 'topo' }, DEFAULT);
    expect(JSON.parse(window.localStorage.getItem('DocumentMap.preferences')!).settings.category).toBeUndefined();
    expect(storedLayerCategory()).toBeUndefined();
  });

  it('reads the category of the layer stored before the categories, and stores it as a category', () => {
    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { layer: 'swiss-ortho' } }));
    expect(storedLayerCategory()).toBe('ortho');
    // the layer itself is not a stored setting any more
    expect(storedMapSettings()).toEqual({});

    storeMapSettings({ slopes: ['IGN Slopes'] }, DEFAULT);
    expect(JSON.parse(window.localStorage.getItem('DocumentMap.preferences')!)).toEqual({
      settings: { category: 'ortho', slopes: 'ign' },
    });
  });

  it('stores the pinned side apart, keeps it when the other settings change, but not the whole window', () => {
    storeMapSettings({ slopes: ['IGN Slopes'] }, DEFAULT);
    storePin('top');
    storeMapSettings({ protection: false }, DEFAULT);
    expect(JSON.parse(window.localStorage.getItem('DocumentMap.preferences')!)).toEqual({
      settings: { slopes: 'ign', protection: '0', pin: 'top' },
    });
    expect(storedPin()).toBe('top');

    storePin('window');
    expect(storedPin()).toBe('top');
    storePin('');
    expect(storedPin()).toBe('');
    expect(JSON.parse(window.localStorage.getItem('DocumentMap.preferences')!)).toEqual({
      settings: { slopes: 'ign', protection: '0' },
    });

    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { pin: 'window' } }));
    expect(storedPin()).toBe('');
  });

  it('ignores an unknown category', () => {
    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { category: 'relief' } }));
    expect(storedLayerCategory()).toBeUndefined();
    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { category: ['ortho'] } }));
    expect(storedLayerCategory()).toBe('ortho');
    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { category: 42 } }));
    expect(storedLayerCategory()).toBeUndefined();
  });

  it('ignores the overlays a device stored before, and drops them at the next change', () => {
    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { overlays: 'outing,route' } }));
    expect(storedMapSettings()).toEqual({});

    storeMapSettings({ protection: false }, DEFAULT);
    expect(JSON.parse(window.localStorage.getItem('DocumentMap.preferences')!)).toEqual({
      settings: { protection: '0' },
    });
  });

  it('reads nothing when nothing, or something unknown, is stored', () => {
    expect(storedMapSettings()).toEqual({});
    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { layer: 'nope', pin: 'top' } }));
    expect(storedMapSettings()).toEqual({});
  });

  it('ignores the values that are not strings, and keeps the others', () => {
    window.localStorage.setItem(
      'DocumentMap.preferences',
      JSON.stringify({ settings: { layer: 'ign', slopes: 42, overlays: { a: 1 }, protection: false } })
    );
    expect(storedMapSettings()).toEqual({ slopes: [] });
    expect(storedLayerCategory()).toBe('national');
    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: 42 }));
    expect(storedMapSettings()).toEqual({});
  });
});
