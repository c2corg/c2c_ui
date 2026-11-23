import { describe, expect, it } from 'vitest';

import { fixElevations, fixGeometryElevations } from './elevation';
import { fromLonLat } from './projection';

describe('fixElevations', () => {
  it('takes all the elevations from the DEM when the track has none', () => {
    const result = fixElevations([undefined, 0, 0], [1000.4, 1010.6, 1020]);
    expect(result).toMatchObject({ elevations: [1000, 1011, 1020], filled: true, replaced: 3, offset: 0 });
  });

  it('removes a constant offset of the GPS', () => {
    const dem = [1000, 1100, 1200, 1300];
    const result = fixElevations(
      dem.map((e) => e + 80),
      dem
    );
    expect(result).toMatchObject({ elevations: dem, offset: 80, replaced: 0, filled: false });
  });

  it('keeps the GPS elevations when it is close to the DEM', () => {
    const result = fixElevations([1003, 1104, 1195], [1000, 1100, 1200]);
    expect(result).toMatchObject({ elevations: [1003, 1104, 1195], offset: 0, replaced: 0 });
  });

  it('replaces the spikes and the points without elevation by the DEM', () => {
    const result = fixElevations([1000, 1500, 0, 1030], [1000, 1010, 1020, 1030]);
    expect(result.elevations).toEqual([1000, 1010, 1020, 1030]);
    expect(result.replaced).toBe(2);
  });

  it('falls back on the nearest elevation where the DEM has none', () => {
    const result = fixElevations([undefined, undefined, undefined], [NaN, 500, NaN]);
    expect(result.elevations).toEqual([0, 500, 500]);
  });
});

describe('fixGeometryElevations', () => {
  const [x1, y1] = fromLonLat([6, 45]);
  const [x2, y2] = fromLonLat([6.01, 45.01]);

  it('keeps the nesting and the times', async () => {
    const sample = async (points: [number, number][]) => {
      expect(points[0][0]).toBeCloseTo(6);
      expect(points[0][1]).toBeCloseTo(45);
      return points.map(() => 2000);
    };
    const result = await fixGeometryElevations(
      [
        [
          [x1, y1, 0, 1600000000],
          [x2, y2, 0, 1600000010],
        ],
      ],
      sample
    );
    expect(result.coordinates).toEqual([
      [
        [x1, y1, 2000, 1600000000],
        [x2, y2, 2000, 1600000010],
      ],
    ]);
    expect(result.filled).toBe(true);
  });

  it('reads a third value as a time when it cannot be an elevation (XYM)', async () => {
    const result = await fixGeometryElevations(
      [
        [x1, y1, 1600000000],
        [x2, y2, 1600000010],
      ],
      async (points) => points.map(() => 1500)
    );
    expect(result.coordinates).toEqual([
      [x1, y1, 1500, 1600000000],
      [x2, y2, 1500, 1600000010],
    ]);
  });
});
