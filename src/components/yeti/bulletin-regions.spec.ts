import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findBulletinRegions } from './bulletin-regions';

import yetiService from '@/js/apis/yeti-service';

const square = (west: number, south: number) => ({
  type: 'Polygon',
  coordinates: [
    [
      [west, south],
      [west + 0.3, south],
      [west + 0.3, south + 0.2],
      [west, south + 0.2],
      [west, south],
    ],
  ],
});
const zone = (name: string, west: number, south: number) => ({
  type: 'Feature',
  properties: { name, country: 'France' },
  geometry: square(west, south),
});
const summary = (name: string) => ({ zone: name, country: 'France', name, urls: [], danger: { max: 2 } });
// points in EPSG:3857: Chamonix (Mont-Blanc), Grenoble area (Belledonne), the middle of nowhere
const chamonix = { geom: JSON.stringify({ type: 'Point', coordinates: [765000, 5767000] }) };
const belledonne = { geom: JSON.stringify({ type: 'Point', coordinates: [673000, 5670000] }) };
const nowhere = { geom: JSON.stringify({ type: 'Point', coordinates: [0, 0] }) };

describe('findBulletinRegions', () => {
  beforeEach(() => {
    vi.spyOn(yetiService, 'zonesBra').mockResolvedValue({
      data: {
        type: 'FeatureCollection',
        features: [zone('Mont-Blanc', 6.7, 45.8), zone('Belledonne', 5.9, 45.2), zone('Vanoise', 6.5, 45.3)],
      },
    } as never);
    vi.spyOn(yetiService, 'bra').mockResolvedValue({
      data: { zones: [summary('Mont-Blanc'), summary('Belledonne'), summary('Vanoise'), summary('Elsewhere')] },
    } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  it('maps the zones a geometry crosses to their EAWS region', async () => {
    const regions = await findBulletinRegions([chamonix]);
    expect(regions.map((region) => [region.bra.name, region.regionId])).toEqual([['Mont-Blanc', 'FR-03']]);
    expect(regions[0].failed).toBe(false);
  });

  it('gives the union of the regions of several geometries', async () => {
    const regions = await findBulletinRegions([chamonix, belledonne, null]);
    expect(regions.map((region) => region.regionId).sort()).toEqual(['FR-03', 'FR-08']);
  });

  it('gives none without geometry, nor zone', async () => {
    expect(await findBulletinRegions([])).toEqual([]);
    expect(await findBulletinRegions([null, {}])).toEqual([]);
    expect(await findBulletinRegions([nowhere])).toEqual([]);
    expect(yetiService.bra).not.toHaveBeenCalled();
  });
});
