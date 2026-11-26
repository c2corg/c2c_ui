import { describe, expect, it } from 'vitest';

import {
  cameraFor,
  distanceFraction,
  durationAt1x,
  FLYOVER,
  playedLines,
  pointAt,
  prepareFlyover,
  smoothAngle,
  timeFraction,
  unwrap,
} from './map-3d-flyover';

// 1 km of latitude is about 0.009°
const KM = 1 / 111.195;
const flat = (points: [number, number][]) => Promise.resolve(new Float64Array(points.length).fill(1000));

describe('durationAt1x', () => {
  it('grows by perDoubling for each doubling of the length, within its bounds', () => {
    expect(durationAt1x(10_000)).toBe(45);
    expect(durationAt1x(20_000)).toBe(60);
    expect(durationAt1x(40_000)).toBe(75);
    expect(durationAt1x(2_000)).toBe(FLYOVER.duration.min);
    expect(durationAt1x(5_000_000)).toBe(FLYOVER.duration.max);
    expect(durationAt1x(0)).toBe(FLYOVER.duration.min);
  });

  it('reads its settings', () => {
    const settings = { ...FLYOVER, duration: { ...FLYOVER.duration, base: 90 } };
    expect(durationAt1x(10_000, settings)).toBe(90);
  });
});

describe('distanceFraction', () => {
  it('goes from 0 to 1, increasing, at a constant speed in the middle', () => {
    expect(distanceFraction(0)).toBe(0);
    expect(distanceFraction(1)).toBeCloseTo(1, 12);
    let previous = 0;
    for (let u = 0.01; u <= 1; u += 0.01) {
      const f = distanceFraction(u);
      expect(f).toBeGreaterThanOrEqual(previous);
      previous = f;
    }
    const slope = (u: number) => (distanceFraction(u + 0.001) - distanceFraction(u)) / 0.001;
    expect(slope(0.3)).toBeCloseTo(slope(0.7), 6);
    expect(slope(0.001)).toBeLessThan(0.1);
  });

  it('is undone by timeFraction', () => {
    for (const u of [0, 0.02, 0.06, 0.3, 0.5, 0.95, 0.99, 1]) {
      expect(timeFraction(distanceFraction(u))).toBeCloseTo(u, 9);
    }
  });
});

describe('unwrap and smoothAngle', () => {
  it('unwraps across north', () => {
    // 30 to 340: 50° back, the short way
    expect(Array.from(unwrap([350, 10, 30, 340]))).toEqual([350, 370, 390, 340]);
  });

  it('turns the short way, at most rate degrees a second', () => {
    expect(smoothAngle(350, 10, 100, 1, 1000)).toBeCloseTo(370, 6);
    expect(smoothAngle(0, 180 - 1e-9, 0.1, 0.01, 35)).toBeCloseTo(3.5, 6);
    expect(smoothAngle(0, -90, 0.1, 0.01, 35)).toBeCloseTo(-3.5, 6);
  });
});

describe('prepareFlyover', () => {
  it('resamples at a constant step, without distance across a gap', async () => {
    const parts = [
      [
        [6, 45, 0],
        [6, 45 + KM, 0],
      ],
      // 5 km away: not counted
      [
        [6, 45 + 6 * KM, 0],
        [6, 45 + 7 * KM, 0],
      ],
    ];
    const track = (await prepareFlyover(parts, flat, 1.2))!;
    expect(track.length).toBeCloseTo(2000, -1);
    expect(track.step).toBe(FLYOVER.minStep);
    expect(track.dist[track.dist.length - 1]).toBeCloseTo(track.length, 6);
    expect(track.alt[0]).toBeCloseTo(1200, 6);
    expect(new Set(track.part)).toEqual(new Set([0, 1]));
    // the played lines are cut at the gap
    expect(playedLines(track, track.length)).toHaveLength(2);
    expect(playedLines(track, 500)).toHaveLength(1);
  });

  it('heads along the track, north then east', async () => {
    const parts = [
      [
        [6, 45, 0],
        [6, 45 + 5 * KM, 0],
        [6 + (5 * KM) / Math.cos((45 * Math.PI) / 180), 45 + 5 * KM, 0],
      ],
    ];
    const track = (await prepareFlyover(parts, flat, 1))!;
    const at = (d: number) => track.heading[Math.round(d / track.step)];
    expect(at(1000)).toBeCloseTo(0, 0);
    expect(at(9000)).toBeCloseTo(90, 0);
  });

  it('takes the altitude of the flights in the air', async () => {
    const parts = [
      [
        [6, 45, 0],
        [6, 45 + KM, 0],
        [6, 45 + 2 * KM, 0],
      ],
    ];
    const track = (await prepareFlyover(parts, flat, 1, { flights: [[1, 2]], alt: [1000, 2000, 1000] }))!;
    expect(pointAt(track, 500).air).toBe(false);
    expect(pointAt(track, 500).alt).toBe(1000);
    expect(pointAt(track, 1500).air).toBe(true);
    expect(pointAt(track, 1500).alt).toBeCloseTo(1500, -1);
  });

  it('crosses the antimeridian the short way', async () => {
    const asked: [number, number][] = [];
    const ground = (points: [number, number][]) => {
      asked.push(...points);
      return flat(points);
    };
    const parts = [
      [
        [180 - KM, 0, 0],
        [-180 + KM, 0, 0],
      ],
    ];
    const track = (await prepareFlyover(parts, ground, 1))!;
    expect(track.length).toBeCloseTo(2000, -1);
    // continuous, east of 180°
    for (const lon of track.lon) expect(lon).toBeGreaterThan(180 - 2 * KM);
    for (const [lon] of asked) expect(Math.abs(lon)).toBeGreaterThan(180 - 2 * KM);
    expect(Math.max(...asked.map(([lon]) => lon))).toBeLessThanOrEqual(180);
  });

  it('has nothing to play without length', async () => {
    expect(await prepareFlyover([[[6, 45, 0]]], flat, 1)).toBeNull();
  });
});

describe('cameraFor', () => {
  it('stays behind the track, and above the terrain between it and the track', async () => {
    const parts = [
      [
        [6, 45, 0],
        [6, 45 + 10 * KM, 0],
      ],
    ];
    const track = (await prepareFlyover(parts, flat, 1))!;
    const free = cameraFor(track, 5000, 0);
    // heading north: the camera is south of the point it looks at
    expect(free.camera[1]).toBeLessThan(free.target[1]);
    expect(free.cameraAlt).toBeGreaterThan(free.targetAlt);
    // a ridge 4000 m high under the camera
    const ridge = cameraFor(track, 5000, 0, () => 4000);
    expect(ridge.cameraAlt).toBeGreaterThanOrEqual(4000 + FLYOVER.clearance);
  });
});
