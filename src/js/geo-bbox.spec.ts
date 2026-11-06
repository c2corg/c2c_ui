import { fromLonLat } from 'ol/proj';
import { describe, expect, it } from 'vitest';

import { bboxAround } from './geo-bbox';

describe('bboxAround', () => {
  it('centers on the position, in web mercator as OpenLayers projects it', () => {
    const [minX, minY, maxX, maxY] = bboxAround(6.87, 45.92, 10).split(',').map(Number);
    const [x, y] = fromLonLat([6.87, 45.92]);
    expect(Math.abs((minX + maxX) / 2 - x)).toBeLessThan(2);
    expect(Math.abs((minY + maxY) / 2 - y)).toBeLessThan(2);
  });

  it('covers the radius on the ground, wider in mercator meters far from the equator', () => {
    const [minX, , maxX] = bboxAround(6.87, 45.92, 10).split(',').map(Number);
    // 10 km on the ground at 45.92° N: about 14.4 km of mercator meters each side
    expect(Math.round((maxX - minX) / 2 / 100) / 10).toBe(14.4);
  });
});
