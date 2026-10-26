import { describe, expect, it } from 'vitest';

import { LOAD_MARGIN, getExtentToLoad } from './load-extent';

const WORLD_SIZE = 2 * 20037508.342789244;
const HALF = WORLD_SIZE / 2;

// Annecy, about 40 km wide: what a map at zoom 12 shows
const VISIBLE = [670000, 5730000, 710000, 5760000];

describe('getExtentToLoad', () => {
  it('goes beyond the visible extent by at least half of its size on each side', () => {
    const [minX, minY, maxX, maxY] = getExtentToLoad(VISIBLE, 12);

    expect(LOAD_MARGIN).toBe(0.5);
    expect(minX).toBeLessThanOrEqual(670000 - 20000);
    expect(minY).toBeLessThanOrEqual(5730000 - 15000);
    expect(maxX).toBeGreaterThanOrEqual(710000 + 20000);
    expect(maxY).toBeGreaterThanOrEqual(5760000 + 15000);
  });

  it('does not go much further than the margin: at most one cell of the grid more on each side', () => {
    const cell = WORLD_SIZE / 2 ** 12;
    const [minX, , maxX] = getExtentToLoad(VISIBLE, 12);

    expect(minX).toBeGreaterThan(670000 - 20000 - cell);
    expect(maxX).toBeLessThan(710000 + 20000 + cell);
  });

  it('is aligned on the grid of the zoom level', () => {
    const cell = WORLD_SIZE / 2 ** 12;

    for (const side of getExtentToLoad(VISIBLE, 12)) {
      const cells = (side + HALF) / cell;
      expect(cells).toBeCloseTo(Math.round(cells), 6);
    }
  });

  it('asks for the same extent from nearby views, and from the same zoom level', () => {
    const wanted = getExtentToLoad(VISIBLE, 12);

    expect(
      getExtentToLoad(
        VISIBLE.map((value) => value + 1),
        12
      )
    ).toEqual(wanted);
    expect(getExtentToLoad(VISIBLE, 12.8)).toEqual(wanted);
    expect(getExtentToLoad(VISIBLE, 13)).not.toEqual(wanted);
  });

  it('contains the views reached by moving the map by a quarter of its width', () => {
    const [minX, minY, maxX, maxY] = getExtentToLoad(VISIBLE, 12);
    const moved = [VISIBLE[0] + 10000, VISIBLE[1] - 7500, VISIBLE[2] + 10000, VISIBLE[3] - 7500];

    expect(minX).toBeLessThanOrEqual(moved[0]);
    expect(minY).toBeLessThanOrEqual(moved[1]);
    expect(maxX).toBeGreaterThanOrEqual(moved[2]);
    expect(maxY).toBeGreaterThanOrEqual(moved[3]);
  });

  it('stays within the world', () => {
    const [minX, minY, maxX, maxY] = getExtentToLoad([-HALF + 100, -HALF + 100, HALF - 100, HALF - 100], 3);

    expect([minX, minY, maxX, maxY]).toEqual([-HALF, -HALF, HALF, HALF]);
  });

  it('takes the margin it is given', () => {
    const none = getExtentToLoad(VISIBLE, 12, 0);

    expect(none[0]).toBeLessThanOrEqual(VISIBLE[0]);
    expect(none[0]).toBeGreaterThan(VISIBLE[0] - WORLD_SIZE / 2 ** 12);
  });
});
