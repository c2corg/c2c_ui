import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({ default: { get: vi.fn(() => Promise.resolve({ data: 'got' })), post: vi.fn() } }));

const stored = () => JSON.parse(window.localStorage.getItem('Yeti.preferences') ?? '{}');

// fresh modules for each test, as for each page load: Yetix is a singleton, and local-storage caches what it read
const loadYetix = async () => {
  vi.resetModules();
  const { mount } = await import('@vue/test-utils');
  const { default: Yetix } = await import('./Yetix');
  const { default: ol } = await import('@/js/libs/ol');
  const { default: axios } = await import('axios');
  const { h, nextTick } = await import('vue');
  return { Yetix, ol, axios, h, mount, nextTick };
};

describe('Yetix store', () => {
  beforeEach(() => window.localStorage.clear());

  it('exposes the default state', async () => {
    const { Yetix } = await loadYetix();

    expect(Yetix.BLEND_MODES_MAX_ZOOM).toBe(10);
    expect(Yetix.VALID_MINIMUM_MAP_ZOOM).toBe(13);
    expect(Yetix.featuresTitle).toBe('New route');
    expect(Yetix.hasFeatures).toBe(false);
    expect(Yetix.showYeti).toBe(false);
    expect(Yetix.method).toEqual({ type: null, orientation: [], potentialDanger: null, wetSnow: false, groupSize: 1 });
  });

  it('changes its state through its setters', async () => {
    const { Yetix } = await loadYetix();

    Yetix.setMethod('groupSize', 4);
    Yetix.setBra('high', 3);
    Yetix.setYetiOk(true);
    Yetix.setWinterRoutes([{ id: 1 }]);

    expect(Yetix.method.groupSize).toBe(4);
    expect(Yetix.bra.high).toBe(3);
    expect(Yetix.yetiOk).toBe(true);
    expect(Yetix.showYeti).toBe(true);
    expect(Yetix.hasWinterRoutes).toBe(true);
  });

  it('stores the drawn route, rounded to the meter, and its title', async () => {
    const { Yetix, ol } = await loadYetix();

    Yetix.setFeatures([
      new ol.Feature(
        new ol.geom.LineString([
          [650000.4, 5750000.6, 1200.2],
          [650100, 5750100, 1300],
        ])
      ),
    ]);
    Yetix.setFeaturesTitle('Pointe Percée');

    expect(Yetix.hasFeatures).toBe(true);
    expect(stored()['yeti-map-features']).toEqual([
      [
        [650000, 5750001, 1200],
        [650100, 5750100, 1300],
      ],
    ]);
    expect(stored()['yeti-map-features-title']).toBe('Pointe Percée');
  });

  it('keeps the OpenLayers features of the route as they are, not proxied', async () => {
    const { Yetix, ol } = await loadYetix();
    const { isProxy } = await import('vue');
    const feature = new ol.Feature(
      new ol.geom.LineString([
        [650000, 5750000, 1200],
        [650100, 5750100, 1300],
      ])
    );

    Yetix.setFeatures([feature]);

    expect(isProxy(Yetix.features[0])).toBe(false);
    expect(Yetix.features[0]).toBe(feature);
  });

  it('stores the overlays shown', async () => {
    const { Yetix } = await loadYetix();

    Yetix.setShowNivoses(true);
    Yetix.setShowFfvl(false);

    expect(Yetix.showNivoses).toBe(true);
    expect(stored()['yeti-map-layers-overlays']).toEqual({ nivoses: true, ffvl: false });
  });

  it('resets to defaults, then restores the stored overlays and route', async () => {
    window.localStorage.setItem(
      'Yeti.preferences',
      JSON.stringify({
        'yeti-map-layers-overlays': { avalanche: true, romma: true },
        'yeti-map-features': [
          [
            [1, 2, 3],
            [4, 5, 6],
          ],
        ],
        'yeti-map-features-title': 'Saved route',
      })
    );
    const { Yetix } = await loadYetix();
    Yetix.setMethod('groupSize', 4);
    Yetix.setMapZoom(12);

    Yetix.setDefault();

    expect(Yetix.method.groupSize).toBe(1);
    expect(Yetix.mapZoom).toBe(0);
    expect(Yetix.showAvalancheBulletins).toBe(true);
    expect(Yetix.showRomma).toBe(true);
    expect(Yetix.showNivoses).toBe(undefined);
    expect(Yetix.features).toHaveLength(1);
    expect(Yetix.features[0].getGeometry().getCoordinates()).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    expect(Yetix.featuresTitle).toBe('Saved route');
  });

  it('turns edit mode off while simplifying, and back on after', async () => {
    const { Yetix } = await loadYetix();
    Yetix.setEditMode(true);

    Yetix.setValidSimplifyTolerance(true);
    expect(Yetix.editMode).toBe(false);

    Yetix.setValidSimplifyTolerance(false);
    expect(Yetix.editMode).toBe(true);
  });

  it('calls the yeti API', async () => {
    const { Yetix, axios } = await loadYetix();

    await expect(Yetix.fetchBulletins()).resolves.toEqual({ data: 'got' });
    expect(axios.get).toHaveBeenCalledWith('https://api.ensg.eu/bra');
  });

  it('updates the components using it', async () => {
    const { Yetix, h, mount, nextTick } = await loadYetix();
    const wrapper = mount({ render: () => h('p', Yetix.showYeti ? `zoom ${Yetix.mapZoom}` : 'off') });
    expect(wrapper.text()).toBe('off');

    Yetix.setShowYeti(true);
    Yetix.setMapZoom(14);
    await nextTick();

    expect(wrapper.text()).toBe('zoom 14');
  });
});
