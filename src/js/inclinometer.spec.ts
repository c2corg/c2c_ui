import { describe, expect, it } from 'vitest';

import {
  GravitySampler,
  angleBetween,
  flipCheck,
  poleSlope,
  sightingAngle,
  surfaceSlope,
  upFromOrientation,
  type Vector,
} from './inclinometer';

const RAD = Math.PI / 180;

// the "up" direction seen by a phone lying on a slope of `slope` degrees, its top turned `heading` degrees away from
// the fall line (0: top up the slope), then rolled `roll` degrees around its long side
function upOnSlope(slope: number, heading = 0, roll = 0): Vector {
  // slope normal tilted toward -y (the top of the phone points up the slope)
  let up: Vector = { x: 0, y: Math.sin(slope * RAD), z: Math.cos(slope * RAD) };
  // turning the phone on the slope rotates the in-plane part around z
  const h = heading * RAD;
  up = { x: up.x * Math.cos(h) - up.y * Math.sin(h), y: up.x * Math.sin(h) + up.y * Math.cos(h), z: up.z };
  // rolling around the long side (y)
  const r = roll * RAD;
  return { x: up.x * Math.cos(r) + up.z * Math.sin(r), y: up.y, z: -up.x * Math.sin(r) + up.z * Math.cos(r) };
}

describe('inclinometer maths', () => {
  it('reads the slope under a phone lying flat, whatever its direction', () => {
    expect(surfaceSlope(upOnSlope(35))).toBeCloseTo(35, 6);
    expect(surfaceSlope(upOnSlope(35, 70))).toBeCloseTo(35, 6);
    expect(surfaceSlope({ x: 0, y: 0, z: -9.81 })).toBeCloseTo(0, 6);
  });

  it('reads the slope of a pole whatever the roll of the phone on it', () => {
    expect(poleSlope(upOnSlope(35))).toBeCloseTo(35, 6);
    expect(poleSlope(upOnSlope(35, 0, 25))).toBeCloseTo(35, 6);
    // the surface formula counts the roll as slope
    expect(surfaceSlope(upOnSlope(35, 0, 25))).toBeGreaterThan(40);
  });

  it('reads less than the slope with a pole off the fall line', () => {
    // the pole turned 20° on the slope plane: asin(sin 35° cos 20°)
    expect(poleSlope(upOnSlope(35, 20))).toBeCloseTo(32.61, 1);
  });

  it('reads the angle of the camera axis with the horizontal', () => {
    // phone upright, camera level
    expect(sightingAngle({ x: 0, y: 9.81, z: 0 })).toBeCloseTo(0, 6);
    // camera 34° up, then the phone rolled around the camera axis
    const up = { x: 0, y: Math.cos(34 * RAD), z: -Math.sin(34 * RAD) };
    expect(sightingAngle(up)).toBeCloseTo(34, 6);
    expect(sightingAngle({ x: up.y * Math.sin(0.4), y: up.y * Math.cos(0.4), z: up.z })).toBeCloseTo(34, 6);
  });

  it('gives the up direction from the orientation angles', () => {
    expect(upFromOrientation(0, 0)).toEqual({ x: -0, y: 0, z: 1 });
    expect(poleSlope(upFromOrientation(30, 0))).toBeCloseTo(30, 6);
    expect(surfaceSlope(upFromOrientation(20, 15))).toBeGreaterThan(20);
    expect(sightingAngle(upFromOrientation(90 - 34, 0))).toBeCloseTo(34, 6);
  });

  it('measures the angle between two directions', () => {
    expect(angleBetween({ x: 1, y: 0, z: 0 }, { x: 0, y: 2, z: 0 })).toBeCloseTo(90, 6);
    expect(angleBetween({ x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).toBeCloseTo(0, 6);
  });

  it('cancels the error of the phone with a flip check', () => {
    expect(flipCheck(37.4, 36.2).slope).toBeCloseTo(36.8, 6);
    expect(flipCheck(37.4, 36.2).offset).toBeCloseTo(0.6, 6);
  });
});

describe('GravitySampler', () => {
  it('averages the samples of the window and tells how still the phone was', () => {
    const sampler = new GravitySampler();
    sampler.add(upOnSlope(34), 0);
    sampler.add(upOnSlope(36), 100);
    sampler.add(upOnSlope(35), 200);
    const reading = sampler.reading(1000)!;
    expect(reading.count).toBe(3);
    expect(poleSlope(reading.up)).toBeCloseTo(35, 1);
    expect(reading.spread).toBeCloseTo(1, 1);
  });

  it('reads the window before a given time, and forgets the old samples', () => {
    const sampler = new GravitySampler(1000);
    sampler.add(upOnSlope(10), 0);
    sampler.add(upOnSlope(30), 900);
    sampler.add(upOnSlope(50), 1500);
    expect(sampler.reading(500, 1000)!.count).toBe(1);
    expect(poleSlope(sampler.reading(500, 1000)!.up)).toBeCloseTo(30, 6);
    // the sample at 0 is older than 1000 ms
    expect(sampler.reading(5000)!.count).toBe(2);
  });

  it('ignores empty vectors and has no reading without samples', () => {
    const sampler = new GravitySampler();
    sampler.add({ x: 0, y: 0, z: 0 }, 0);
    sampler.add({ x: NaN, y: 0, z: 1 }, 0);
    expect(sampler.reading(1000)).toBeNull();
  });
});
