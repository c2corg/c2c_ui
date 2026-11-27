import { describe, expect, it } from 'vitest';

import {
  bodyChunk,
  cameraFor,
  cameraPath,
  distanceFraction,
  durationAt1x,
  FLYOVER,
  followStep,
  headingAt,
  playedLines,
  playedSplit,
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

describe('playedSplit', () => {
  // 10 km north, then a gap, then 2 km
  const parts = [
    [
      [6, 45, 0],
      [6, 45 + 10 * KM, 0],
    ],
    [
      [6, 45 + 15 * KM, 0],
      [6, 45 + 17 * KM, 0],
    ],
  ];

  it('is the played line, in a body that moves by chunks and a tip', async () => {
    const track = (await prepareFlyover(parts, flat, 1))!;
    const chunk = bodyChunk(track);
    const flatten = (lines: number[][][]) => lines.flat().map((point) => point.join(','));
    for (const d of [0, 2 * chunk * track.step + 1, 0.5 * track.length, 9999, 10_001, track.length]) {
      const { bodyEnd, body, tip } = playedSplit(track, d);
      expect(bodyEnd % chunk).toBe(0);
      expect(bodyEnd).toBeLessThanOrEqual(Math.floor(d / track.step));
      // the same points as the whole line, the sample where they meet in both
      const whole = flatten(playedLines(track, d));
      const joined = [...flatten(body()), ...flatten(tip)];
      expect(new Set(joined)).toEqual(new Set(whole));
      expect(joined.length - whole.length).toBeLessThanOrEqual(1);
    }
    // across the gap: no line from a part to the other
    const { body, tip } = playedSplit(track, track.length);
    for (const line of [...body(), ...tip]) {
      const lats = line.map(([, lat]) => (lat - 45) / KM);
      expect(lats.every((lat) => lat <= 10 + 1e-6) || lats.every((lat) => lat >= 15 - 1e-6)).toBe(true);
    }
  });

  it('keeps the body until it moves by a chunk', async () => {
    const track = (await prepareFlyover(parts, flat, 1))!;
    const step = track.step;
    const chunk = bodyChunk(track);
    expect(playedSplit(track, chunk * step + 1).bodyEnd).toBe(chunk);
    expect(playedSplit(track, (2 * chunk - 1) * step).bodyEnd).toBe(chunk);
    expect(playedSplit(track, 2 * chunk * step + 1).bodyEnd).toBe(2 * chunk);
  });
});

describe('cameraPath', () => {
  it('follows the track as played, one camera a second, to the end', async () => {
    const parts = [
      [
        [6, 45, 0],
        [6, 45 + 5 * KM, 0],
        [6 + (5 * KM) / Math.cos((45 * Math.PI) / 180), 45 + 5 * KM, 0],
      ],
    ];
    const track = (await prepareFlyover(parts, flat, 1))!;
    const path = cameraPath(track);
    const duration = durationAt1x(track.length);
    expect(path.length).toBeGreaterThanOrEqual(duration);
    expect(path.length).toBeLessThanOrEqual(duration + 2);
    expect(path[0].at).toBe(0);
    expect(path.at(-1)!.at).toBeCloseTo(track.length, 6);
    path.slice(1).forEach(({ at }, i) => expect(at).toBeGreaterThan(path[i].at));
    // the same camera as the player at the start
    const state = { bearing: 0, cameraAlt: 0 };
    expect(path[0].camera).toEqual(followStep(state, track, 0, 0, true));
    // behind the track: south of it while it goes north
    const north = path.find(({ at }) => at > 1000 && at < 3000)!;
    expect(headingAt(track, north.at)).toBeCloseTo(0, 0);
    expect(north.camera.camera[1]).toBeLessThan(north.camera.target[1]);
  });
});

describe('the camera on a hilly ground', () => {
  // 10 km north: hills of 40 m every 600 m, then a slope of 30 % from 5 km on
  const north = (lat: number) => (lat - 45) / KM;
  const height = (lat: number) =>
    40 * Math.sin((2 * Math.PI * north(lat) * 1000) / 600) + 300 * Math.max(north(lat) - 5, 0);
  const rough = (points: [number, number][]) => Promise.resolve(Float64Array.from(points, ([, lat]) => height(lat)));
  const parts = [
    [
      [6, 45, 0],
      [6, 45 + 10 * KM, 0],
    ],
  ];

  // how much the distance of the camera varies over the hills (share of it)
  const breathing = async (settings = FLYOVER) => {
    const track = (await prepareFlyover(parts, rough, 1, null, settings))!;
    const distances = Array.from({ length: 20 }, (_, i) => {
      const { camera, target } = cameraFor(track, 1000 + i * 100, 0, undefined, settings);
      return target[1] - camera[1];
    });
    return (Math.max(...distances) - Math.min(...distances)) / distances[0];
  };

  it('keeps its distance over the hills, and goes farther on the slope', async () => {
    const track = (await prepareFlyover(parts, rough, 1))!;
    const steepAt = (d: number) => track.steep[Math.round(d / track.step)];
    expect(steepAt(2500)).toBeLessThan(1.1);
    expect(steepAt(8500)).toBeCloseTo(1 + FLYOVER.steepGain * 0.3, 1);
    expect(await breathing()).toBeLessThan(0.01);
    // measured over 200 m and not smoothed, as it was: the camera went back and forth with the hills
    const unsmoothed = { ...FLYOVER, steepSigma: 0, altitudeSigma: FLYOVER.positionSigma };
    expect(await breathing(unsmoothed)).toBeGreaterThan(0.025);
  });

  it('looks at a height smoothed more than the hills', async () => {
    const track = (await prepareFlyover(parts, rough, 1))!;
    const heights = Array.from({ length: 30 }, (_, i) => cameraFor(track, 1000 + i * 100, 0).targetAlt);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(5);
  });
});
