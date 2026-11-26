/**
 * The maths of the inclinometer (InclinometerView.vue), an experiment.
 *
 * The phone gives the "up" direction in its own axes (W3C device frame: x to the right of the screen, y to its top, z
 * out of the screen). At rest, `accelerationIncludingGravity` of `devicemotion` is that vector (some browsers report it
 * reversed: every angle below uses absolute values, so the sign does not matter). Where only `deviceorientation` is
 * there (Chrome DevTools sensor emulation), the vector is computed from its beta and gamma angles.
 */

export interface Vector {
  x: number;
  y: number;
  z: number;
}

const DEGREES = 180 / Math.PI;

/** The "up" direction in the phone's axes, from the beta and gamma angles of deviceorientation, in degrees. */
export function upFromOrientation(beta: number, gamma: number): Vector {
  const b = beta / DEGREES;
  const g = gamma / DEGREES;
  return { x: -Math.cos(b) * Math.sin(g), y: Math.sin(b), z: Math.cos(b) * Math.cos(g) };
}

/**
 * Phone lying flat on the slope: the angle between the back of the phone and the vertical, the steepest slope whatever
 * the direction the phone points to.
 */
export function surfaceSlope(up: Vector): number {
  return Math.atan2(Math.hypot(up.x, up.y), Math.abs(up.z)) * DEGREES;
}

/**
 * Phone on a pole: the angle of the long side of the phone with the horizontal. Rolling the phone around the pole does
 * not change it, unlike surfaceSlope.
 */
export function poleSlope(up: Vector): number {
  return Math.atan2(Math.abs(up.y), Math.hypot(up.x, up.z)) * DEGREES;
}

/**
 * Sighting through the rear camera: the angle of the camera axis (-z) with the horizontal. Rolling the phone around
 * that axis does not change it.
 */
export function sightingAngle(up: Vector): number {
  return Math.atan2(Math.abs(up.z), Math.hypot(up.x, up.y)) * DEGREES;
}

/** The angle between two directions, in degrees. */
export function angleBetween(a: Vector, b: Vector): number {
  const cross = Math.hypot(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  return Math.atan2(cross, dot) * DEGREES;
}

interface Sample {
  time: number;
  up: Vector;
}

export interface Reading {
  /** The mean direction of the samples */
  up: Vector;
  /** The largest angle between a sample and the mean, in degrees: how still the phone was */
  spread: number;
  count: number;
}

/** The samples of the last seconds, averaged over a window to smooth the noise of the sensor and of the hand. */
export class GravitySampler {
  private samples: Sample[] = [];

  constructor(private readonly keep = 3000) {}

  add(up: Vector, time: number): void {
    const length = Math.hypot(up.x, up.y, up.z);
    if (!length || !Number.isFinite(length)) {
      return;
    }
    this.samples.push({ time, up: { x: up.x / length, y: up.y / length, z: up.z / length } });
    while (this.samples.length && this.samples[0]!.time < time - this.keep) {
      this.samples.shift();
    }
  }

  clear(): void {
    this.samples = [];
  }

  /** The mean of the samples of the `window` milliseconds before `end`, or null without any. */
  reading(window: number, end = this.samples.at(-1)?.time ?? 0): Reading | null {
    const samples = this.samples.filter((sample) => sample.time > end - window && sample.time <= end);
    if (!samples.length) {
      return null;
    }
    const sum = samples.reduce((acc, { up }) => ({ x: acc.x + up.x, y: acc.y + up.y, z: acc.z + up.z }), {
      x: 0,
      y: 0,
      z: 0,
    });
    const up = { x: sum.x / samples.length, y: sum.y / samples.length, z: sum.z / samples.length };
    const spread = Math.max(...samples.map((sample) => angleBetween(sample.up, up)));
    return { up, spread, count: samples.length };
  }
}

/**
 * Two readings at the same spot, the phone turned end for end between them: the error of the phone adds to one and
 * takes from the other, so their mean is the slope and half their difference the error of the phone.
 */
export function flipCheck(first: number, second: number): { slope: number; offset: number } {
  return { slope: (first + second) / 2, offset: Math.abs(first - second) / 2 };
}
