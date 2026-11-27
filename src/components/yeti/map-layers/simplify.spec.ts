import { describe, expect, it } from 'vitest';

import simplify from './simplify';

describe('simplify', () => {
  it('removes the points of a straight line', () => {
    const line = [0, 1, 2, 3, 4].map((x) => [x * 100, x * 50, x * 10]);

    expect(simplify(line, 1, true)).toEqual([line[0], line[4]]);
  });

  it('keeps the points away from the line more than the tolerance', () => {
    const points = [
      [0, 0, 0],
      [100, 0, 0],
      [200, 150, 0],
      [300, 0, 0],
      [400, 0, 0],
    ];

    expect(simplify(points, 100, true)).toEqual([points[0], points[2], points[4]]);
    expect(simplify(points, 200, true)).toEqual([points[0], points[4]]);
  });

  it('measures the distances with the elevation', () => {
    const points = [
      [0, 0, 1000],
      [100, 0, 1500],
      [200, 0, 1000],
    ];

    expect(simplify(points, 100, true)).toEqual(points);
  });

  it('first removes the points too close to the previous one, unless at the highest quality', () => {
    const points = [
      [0, 0, 0],
      [50, 5, 0],
      // 5 from the previous point, 9 from the line
      [53, 9, 0],
      [100, 0, 0],
    ];

    expect(simplify(points, 6)).toEqual([points[0], points[3]]);
    expect(simplify(points, 6, true)).toEqual([points[0], points[2], points[3]]);
  });

  it('keeps a single point', () => {
    expect(simplify([[1, 2, 3]], 10, true)).toEqual([[1, 2, 3]]);
    expect(simplify([[1, 2, 3]], 10)).toEqual([[1, 2, 3]]);
  });
});
