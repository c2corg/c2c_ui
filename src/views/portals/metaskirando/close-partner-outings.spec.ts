import { describe, expect, it } from 'vitest';

import {
  CLOSE_MAX,
  CLOSE_RADIUS,
  closeBbox,
  closeOutings,
  closeQuery,
  distance,
  referencePoints,
} from './close-partner-outings';
import { c2cOuting, geometry, partnerOuting } from './fixtures';

import { fromLonLat, toLonLat } from '@/js/geo/projection';

// the Grand Van (Belledonne) and points around it, in EPSG:3857 as the API gives them
const SUMMIT: [number, number] = [5.93, 45.11];
const at = ([lon, lat]: number[]) => fromLonLat([lon, lat]) as [number, number];
const point = (lonLat: number[]) => JSON.stringify({ type: 'Point', coordinates: at(lonLat) });
// north of the summit, by metres on the ground
const north = (metres: number): [number, number] => [SUMMIT[0], SUMMIT[1] + metres / 111195];

describe('distance', () => {
  it('measures on the ground, not in projected metres', () => {
    // one degree of latitude
    expect(distance([6, 45], [6, 46])).toBeCloseTo(111195, -1);
    // one degree of longitude at 45°N: cos(45°) of it
    expect(distance([6, 45], [7, 45])).toBeCloseTo(111195 * Math.cos(Math.PI / 4), -2);
    expect(distance(SUMMIT, north(1000))).toBeCloseTo(1000, 0);
  });
});

describe('referencePoints', () => {
  it('takes the point of a waypoint', () => {
    const points = referencePoints({ type: 'w', geometry: { geom: point(SUMMIT) } });
    expect(points).toHaveLength(1);
    expect(points[0][0]).toBeCloseTo(SUMMIT[0], 6);
    expect(points[0][1]).toBeCloseTo(SUMMIT[1], 6);
  });

  it('takes the point and the track of a route, and the points of its waypoints', () => {
    const track = JSON.stringify({ type: 'LineString', coordinates: [at([5.9, 45.1]), at([5.91, 45.105])] });
    const points = referencePoints({
      type: 'r',
      geometry: { geom: point([5.92, 45.1]), geom_detail: track },
      associations: {
        waypoints: [{ geometry: { geom: point(SUMMIT) } }, { geometry: null }, { geometry: { geom: 'not json' } }],
      },
    });
    expect(points.map(([lon]) => Number(lon.toFixed(4)))).toEqual([5.92, 5.9, 5.91, 5.93]);
  });

  it('leaves out the waypoints of another document than a route, and what does not parse', () => {
    expect(
      referencePoints({
        type: 'w',
        geometry: { geom: '{"type":"Point","coordinates":[]}' },
        associations: { waypoints: [{ geometry: { geom: point(SUMMIT) } }] },
      })
    ).toEqual([]);
    expect(referencePoints({ type: 'w', geometry: null })).toEqual([]);
  });
});

describe('closeBbox', () => {
  it('widens the extent of the points by the radius on the ground', () => {
    const [xmin, ymin, xmax, ymax] = closeBbox([SUMMIT])!;
    const [west, south] = toLonLat([xmin, ymin]);
    const [east, northEdge] = toLonLat([xmax, ymax]);
    // at least the radius on each side, not much more
    expect(distance(SUMMIT, [SUMMIT[0], south])).toBeGreaterThanOrEqual(CLOSE_RADIUS - 1);
    expect(distance(SUMMIT, [SUMMIT[0], northEdge])).toBeLessThan(CLOSE_RADIUS + 50);
    expect(distance(SUMMIT, [west, SUMMIT[1]])).toBeGreaterThanOrEqual(CLOSE_RADIUS - 1);
    expect(distance(SUMMIT, [east, SUMMIT[1]])).toBeLessThan(CLOSE_RADIUS + 50);
    expect([xmin, ymin, xmax, ymax].every(Number.isInteger)).toBe(true);
  });

  it('has no extent without a point', () => {
    expect(closeBbox([])).toBeNull();
  });
});

describe('closeQuery', () => {
  it('asks for the last 30 days in the extent, with the activities and the language', () => {
    const query = closeQuery([SUMMIT], {
      activities: ['skitouring'],
      lang: 'fr',
      now: new Date('2026-11-28T10:00:00Z'),
    })!;
    expect(query.date).toBe('2026-10-29,2026-11-28');
    expect(query.act).toEqual(['skitouring']);
    expect(query.pl).toBe('fr');
    expect(query.bbox).toEqual(closeBbox([SUMMIT]));
    expect(query.sources).toBeUndefined();
  });

  it('leaves out an empty list of activities, and asks nothing without a point', () => {
    expect(closeQuery([SUMMIT], { activities: [] })!.act).toBeUndefined();
    expect(closeQuery([])).toBeNull();
  });
});

describe('closeOutings', () => {
  const located = (id: string, lonLat: number[], quality = 'start', date = '2026-11-27') =>
    partnerOuting({ id, date, geometry: { geom: point(lonLat), quality } });

  it('keeps the partner outings within the radius, in the order of the API, with their distance', () => {
    const items = [
      located('a', north(10), 'summit_match'),
      located('b', north(CLOSE_RADIUS + 300)),
      located('c', north(1500), 'summit', '2026-11-20'),
    ];
    const close = closeOutings(items, [SUMMIT]);
    expect(close.map(({ outing }) => outing.id)).toEqual(['a', 'c']);
    expect(close[0].distance).toBeCloseTo(10, 0);
    expect(close[1].distance).toBeCloseTo(1500, 0);
  });

  it('measures to the nearest point of the document', () => {
    const close = closeOutings([located('a', north(3000))], [SUMMIT, north(2500)]);
    expect(close[0].distance).toBeCloseTo(500, 0);
  });

  it('leaves out the c2c outings, the centres of areas and the outings without a location', () => {
    const items = [
      c2cOuting({ geometry: { geom: point(SUMMIT), quality: 'start' } }),
      located('centroid', SUMMIT, 'area_centroid'),
      partnerOuting({ id: 'nowhere', geometry: null }),
      partnerOuting({ id: 'bad', geometry: geometry('start', 1e308, 0) }),
    ];
    expect(closeOutings(items, [SUMMIT])).toEqual([]);
  });

  it('keeps the first ones only', () => {
    const items = Array.from({ length: CLOSE_MAX + 5 }, (_, i) => located(`o${i}`, north(i)));
    expect(closeOutings(items, [SUMMIT])).toHaveLength(CLOSE_MAX);
    expect(closeOutings(items, [SUMMIT], { max: 3 }).map(({ outing }) => outing.id)).toEqual(['o0', 'o1', 'o2']);
  });
});
