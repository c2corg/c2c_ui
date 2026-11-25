import { describe, expect, it } from 'vitest';

import { c2cOuting, geometry, partnerOuting } from './fixtures';
import { bboxParam, isApproximate, markersOf, outingPosition, sourceColor, sourceLabel } from './partner-outings-map';

import { fromLonLat } from '@/js/geo/projection';

describe('partner outings map helpers', () => {
  it('reads the position of a point of EPSG:3857 in longitude, latitude', () => {
    const [x, y] = fromLonLat([6.5, 45.5]);
    const [lon, lat] = outingPosition(partnerOuting({ geometry: geometry('start', x, y) }))!;
    expect(lon).toBeCloseTo(6.5, 6);
    expect(lat).toBeCloseTo(45.5, 6);
  });

  it('takes the start of a line, for the outings of c2c', () => {
    const [x, y] = fromLonLat([6.1, 45.9]);
    const line = {
      geom: JSON.stringify({
        type: 'LineString',
        coordinates: [
          [x, y],
          [x + 100, y + 100],
        ],
      }),
      quality: 'route',
    };
    const multi = { geom: JSON.stringify({ type: 'MultiLineString', coordinates: [[[x, y]]] }), quality: 'route' };
    for (const g of [line, multi]) {
      const [lon, lat] = outingPosition(c2cOuting({ geometry: g }))!;
      expect(lon).toBeCloseTo(6.1, 6);
      expect(lat).toBeCloseTo(45.9, 6);
    }
  });

  it('has no position without a usable geometry', () => {
    expect(outingPosition(partnerOuting({ geometry: null }))).toBeNull();
    expect(outingPosition(partnerOuting({ geometry: geometry('none') }))).toBeNull();
    expect(outingPosition(partnerOuting({ geometry: { geom: 'not json', quality: 'start' } }))).toBeNull();
    expect(
      outingPosition(partnerOuting({ geometry: { geom: '{"type":"Point","coordinates":[]}', quality: 'start' } }))
    ).toBeNull();
    expect(outingPosition(partnerOuting({ geometry: { geom: '{"type":"Point"}', quality: 'start' } }))).toBeNull();
  });

  it('tells the approximate locations: the centre of an area, a resolved summit', () => {
    expect(isApproximate(partnerOuting({ geometry: geometry('area_centroid') }))).toBe(true);
    expect(isApproximate(partnerOuting({ geometry: geometry('summit') }))).toBe(true);
    expect(isApproximate(partnerOuting({ geometry: geometry('start') }))).toBe(false);
    expect(isApproximate(partnerOuting({ geometry: geometry('route') }))).toBe(false);
    expect(isApproximate(partnerOuting({ geometry: null }))).toBe(false);
  });

  it('draws the outings with a position and counts the others', () => {
    const outings = [
      partnerOuting({ id: 'a', geometry: geometry('start') }),
      partnerOuting({ id: 'b', geometry: geometry('area_centroid') }),
      partnerOuting({ id: 'c', geometry: null }),
      partnerOuting({ id: 'd', geometry: geometry('none') }),
    ];
    const { markers, withoutLocation } = markersOf(outings);
    expect(markers.map((m) => [m.outing.id, m.approximate])).toEqual([
      ['a', false],
      ['b', true],
    ]);
    expect(withoutLocation).toBe(2);
  });

  it('colours by source, as the badges', () => {
    const known = ['skitour', 'gulliver', 'gipfelbuch', 'bivouak', 'skitourenportal'];
    expect(new Set(known.map(sourceColor)).size).toBe(known.length);
    expect(sourceColor('c2c')).toBe('#f93');
    expect(sourceColor('unknown')).toBe(sourceColor('other'));
  });

  it('labels the sources, falling back on the site name then the id', () => {
    expect(sourceLabel('bivouak', 'x')).toBe('Bivouak');
    expect(sourceLabel('newsite', 'New Site')).toBe('New Site');
    expect(sourceLabel('newsite')).toBe('newsite');
  });

  it('rounds the extent to the metre', () => {
    expect(bboxParam([1.4, 2.6, 3.5, 4.49])).toEqual([1, 3, 4, 4]);
  });
});
