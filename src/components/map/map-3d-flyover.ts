// the flyover of a track in the 3D view (MapFlyover.vue): the track resampled at a constant step, the timing of the
// playback and the camera that follows it. No map here: plain numbers, tested on their own.
// Every value to tune after trying it lives in FLYOVER.
import { interp, lonDelta, prepareTrack, wrapLon, type TrackPart } from './map-3d-flight';

export const FLYOVER = {
  // the duration at 1×, in seconds: logarithmic in the length, as the camera also goes farther on a longer track (the
  // speed on screen stays readable): 30 s up to 5 km, 45 s at 10 km, 60 s at 20 km, 75 s at 40 km, 120 s at most
  duration: { base: 45, refLength: 10_000, perDoubling: 15, min: 30, max: 120 },
  // the share of the duration to speed up at the start, and to slow down at the end
  ramp: 0.06,
  speeds: [1, 2, 3, 5, 10],
  // the part of the track not played yet: hidden, or drawn faint
  showAhead: false,
  // the track resampled every step metres, at least minStep, at most maxSamples samples
  minStep: 5,
  maxSamples: 3000,
  // gaussian smoothing of the track (metres: ratio of the length, clamped), for the point the camera looks at and for
  // the direction it looks to: the camera does not follow every zigzag
  positionSigma: { ratio: 0.015, min: 80, max: 500 },
  // the height of the point looked at, smoothed more than its place: the camera does not bob with every bump of the
  // ground (metres, as positionSigma)
  altitudeSigma: { ratio: 0.03, min: 200, max: 800 },
  headingSigma: { ratio: 0.05, min: 300, max: 1500 },
  // the camera: this far behind the point it looks at (metres), seen from this angle above the horizon (degrees), and
  // at least this high above the terrain between it and the point (metres)
  distance: { ratio: 0.08, min: 1200, max: 4000 },
  elevationAngle: 35,
  // farther on a steep slope, which otherwise fills the view: the distance times 1 + steepGain × the slope of the track
  // (rise over run, measured over steepSpan metres on each side), at most steepMax times
  steepGain: 1.5,
  steepSpan: 200,
  steepMax: 2,
  // that factor smoothed along the track over this share of the distance of the camera: measured over a few hundred
  // metres, the slope of a rough ground changes every second, and the camera went back and forth with it
  steepSigma: 0.5,
  clearance: 120,
  // the point looked at, ahead of the playhead (share of the distance of the camera)
  lead: 0.1,
  // the camera turns towards the direction of the track in about bearingTau seconds, at most bearingRate degrees a second
  bearingTau: 2,
  bearingRate: 35,
  // the camera goes up quickly (a ridge ahead), and down slowly
  climbTau: 0.3,
  descentTau: 2,
  // transitions, in milliseconds: to the start, back to the track (recenter), out to the whole track at the end
  intro: 1500,
  recenter: 800,
  outro: 2500,
  outroPitch: 50,
};

export type FlyoverSettings = typeof FLYOVER;

const EARTH = 6371008.8;
// metres: the camera and its line of sight at least this high above the terrain, whatever the smoothing
const MIN_CLEARANCE = 20;
const METRES_PER_DEGREE = (EARTH * Math.PI) / 180;
const toRad = Math.PI / 180;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** The track of a flyover, resampled every `step` metres */
export type FlyoverTrack = {
  length: number;
  step: number;
  // per sample: distance from the start (no distance across two parts), position, altitude as drawn (exaggerated)
  dist: Float64Array;
  lon: Float64Array;
  lat: Float64Array;
  alt: Float64Array;
  // the elevation recorded with the track (metres, not exaggerated), null when it has none: the profile of the bar
  ele: Float64Array | null;
  // the part of the track, and whether the sample is in the air (a paragliding flight)
  part: Int32Array;
  air: Uint8Array;
  // smoothed: where the camera looks, and the direction of the track (degrees, unwrapped: no jump at north)
  smoothLon: Float64Array;
  smoothLat: Float64Array;
  smoothAlt: Float64Array;
  // the distance of the camera, as a factor of cameraDistance: farther on steep slopes, smoothed
  steep: Float64Array;
  heading: Float64Array;
  // [west, south, east, north]
  bounds: [number, number, number, number];
};

/** The flights of a paragliding track: [first, last] vertex of each, and the altitude as drawn of each vertex */
export type FlyoverAir = { flights: [number, number][]; alt: ArrayLike<number> };

/** The duration of the flyover at 1×, in seconds */
export function durationAt1x(length: number, settings: FlyoverSettings = FLYOVER): number {
  const { base, refLength, perDoubling, min, max } = settings.duration;
  if (!(length > 0)) return min;
  return clamp(base + perDoubling * Math.log2(length / refLength), min, max);
}

/**
 * The share of the length played at the share u of the duration: the speed rises over the first `ramp` of the duration,
 * stays constant, and falls over the last one (a trapezoid, integrated)
 */
export function distanceFraction(u: number, ramp = FLYOVER.ramp): number {
  const t = clamp(u, 0, 1);
  if (ramp <= 0) return t;
  const vmax = 1 / (1 - ramp);
  if (t < ramp) return (vmax * t * t) / (2 * ramp);
  if (t <= 1 - ramp) return vmax * (t - ramp / 2);
  return 1 - (vmax * (1 - t) ** 2) / (2 * ramp);
}

/** The inverse of distanceFraction: the share of the duration at which a share of the length is played */
export function timeFraction(f: number, ramp = FLYOVER.ramp): number {
  const x = clamp(f, 0, 1);
  if (ramp <= 0) return x;
  const vmax = 1 / (1 - ramp);
  const edge = (vmax * ramp) / 2;
  if (x < edge) return Math.sqrt((2 * ramp * x) / vmax);
  if (x <= 1 - edge) return x / vmax + ramp / 2;
  return 1 - Math.sqrt((2 * ramp * (1 - x)) / vmax);
}

// gaussian moving average of values, sigma in samples, the window shrunk at the ends
function gaussian(values: ArrayLike<number>, sigma: number): Float64Array {
  const n = values.length;
  const out = new Float64Array(n);
  if (sigma < 0.5) {
    for (let i = 0; i < n; i++) out[i] = values[i];
    return out;
  }
  const half = Math.ceil(3 * sigma);
  const weights = Float64Array.from({ length: half + 1 }, (_, k) => Math.exp(-(k * k) / (2 * sigma * sigma)));
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let total = 0;
    for (let k = -half; k <= half; k++) {
      const j = i + k;
      if (j < 0 || j >= n) continue;
      const w = weights[Math.abs(k)];
      sum += w * values[j];
      total += w;
    }
    out[i] = sum / total;
  }
  return out;
}

/** The bearing from a to b [lon, lat], in degrees clockwise from north */
export function bearingOf(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const dx = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * toRad);
  const dy = lat2 - lat1;
  return Math.atan2(dx, dy) / toRad;
}

/** Angles without the jumps of 360°: each one the closest to the previous */
export function unwrap(angles: ArrayLike<number>): Float64Array {
  const out = new Float64Array(angles.length);
  for (let i = 0; i < angles.length; i++) {
    if (i === 0) {
      out[i] = angles[i];
      continue;
    }
    const delta = ((((angles[i] - out[i - 1]) % 360) + 540) % 360) - 180;
    out[i] = out[i - 1] + delta;
  }
  return out;
}

/**
 * The track resampled at a constant step, with its altitudes: on the ground, from `ground` (terrain elevation, metres)
 * times the exaggeration; on a flight, its altitude as drawn. Null when there is no length to play.
 */
export async function prepareFlyover(
  parts: TrackPart[],
  ground: (points: [number, number][]) => Promise<Float64Array>,
  exaggeration: number,
  air: FlyoverAir | null = null,
  settings: FlyoverSettings = FLYOVER
): Promise<FlyoverTrack | null> {
  const track = prepareTrack(parts.filter((part) => part.length));
  const { vertices, dist: vertexDist } = track;
  const length = vertexDist[vertexDist.length - 1] ?? 0;
  if (vertices.length < 2 || !(length > 0)) return null;
  const step = Math.max(settings.minStep, length / settings.maxSamples);
  const n = Math.floor(length / step) + (length % step > 1e-6 ? 2 : 1);
  const dist = new Float64Array(n);
  const lon = new Float64Array(n);
  const lat = new Float64Array(n);
  const part = new Int32Array(n);
  const airFlags = new Uint8Array(n);
  const airAlt = new Float64Array(n).fill(NaN);
  const inFlight = (i: number) => !!air?.flights.some(([a, b]) => a <= i && i < b);
  // a track without elevations has none, or 0 everywhere (the API fills the missing ones with 0)
  const z = (j: number) => (Number.isFinite(vertices[j][2]) ? vertices[j][2] : NaN);
  const zs = vertices.map((_, j) => z(j)).filter((value) => Number.isFinite(value) && value !== 0);
  const ele = zs.length && Math.max(...zs) - Math.min(...zs) >= 1 ? new Float64Array(n) : null;

  // longitudes without the jump of 360° at the antimeridian: interpolated and smoothed the short way
  const vertexLon = new Float64Array(vertices.length);
  vertices.forEach(([x], j) => (vertexLon[j] = j ? vertexLon[j - 1] + lonDelta(vertices[j - 1][0], x) : x));

  let i = 0;
  for (let k = 0; k < n; k++) {
    const d = Math.min(k * step, length);
    // the edge i..i+1 with the distance d, skipping the edges of no length (a gap between two parts)
    while (i < vertices.length - 2 && (vertexDist[i + 1] < d || vertexDist[i + 1] === vertexDist[i])) i++;
    const span = vertexDist[i + 1] - vertexDist[i];
    const f = span > 0 ? clamp((d - vertexDist[i]) / span, 0, 1) : 0;
    dist[k] = d;
    lon[k] = vertexLon[i] + f * (vertexLon[i + 1] - vertexLon[i]);
    if (ele) ele[k] = z(i) + f * (z(i + 1) - z(i));
    lat[k] = vertices[i][1] + f * (vertices[i + 1][1] - vertices[i][1]);
    part[k] = track.part[f < 1 ? i : i + 1];
    if (air && inFlight(i)) {
      airFlags[k] = 1;
      airAlt[k] = air.alt[i] + f * (air.alt[i + 1] - air.alt[i]);
    }
  }

  const terrain = await ground(Array.from(lon, (x, k) => [wrapLon(x), lat[k]] as [number, number]));
  const alt = new Float64Array(n);
  let last = 0;
  for (let k = 0; k < n; k++) {
    const value = airFlags[k] ? airAlt[k] : terrain[k] * exaggeration;
    // a tile that could not be read: the altitude of the sample before
    alt[k] = Number.isFinite(value) ? value : last;
    last = alt[k];
  }
  // the first samples without terrain: that of the first one read
  const firstFinite = Array.from(alt).findIndex((_, k) => Number.isFinite(airFlags[k] ? airAlt[k] : terrain[k]));
  if (firstFinite > 0) alt.fill(alt[firstFinite], 0, firstFinite);

  const sigmaOf = ({ ratio, min, max }: { ratio: number; min: number; max: number }) =>
    clamp(ratio * length, min, max) / step;
  const positionSigma = sigmaOf(settings.positionSigma);
  const smoothLon = gaussian(lon, positionSigma);
  const smoothLat = gaussian(lat, positionSigma);
  const smoothAlt = gaussian(alt, sigmaOf(settings.altitudeSigma));
  // farther on steep slopes: the rise over run around each sample, smoothed
  const span = Math.max(1, Math.round(settings.steepSpan / step));
  const factor = Float64Array.from(smoothAlt, (_, k) => {
    const a = Math.max(0, k - span);
    const b = Math.min(n - 1, k + span);
    const slope = b > a ? Math.abs(smoothAlt[b] - smoothAlt[a]) / (dist[b] - dist[a] || 1) : 0;
    return Math.min(1 + settings.steepGain * slope, settings.steepMax);
  });
  const baseDistance = clamp(settings.distance.ratio * length, settings.distance.min, settings.distance.max);
  const steep = gaussian(factor, (settings.steepSigma * baseDistance) / step);
  const headingSigma = sigmaOf(settings.headingSigma);
  const headingLon = gaussian(lon, headingSigma);
  const headingLat = gaussian(lat, headingSigma);
  // the direction across the smoothed track, from sigma behind to sigma ahead
  const reach = Math.max(1, Math.round(headingSigma));
  const raw = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const a = Math.max(0, k - reach);
    const b = Math.min(n - 1, k + reach);
    const same = headingLon[a] === headingLon[b] && headingLat[a] === headingLat[b];
    raw[k] = same && k > 0 ? raw[k - 1] : bearingOf(headingLon[a], headingLat[a], headingLon[b], headingLat[b]);
  }

  let bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let k = 0; k < n; k++) {
    bounds = [
      Math.min(bounds[0], lon[k]),
      Math.min(bounds[1], lat[k]),
      Math.max(bounds[2], lon[k]),
      Math.max(bounds[3], lat[k]),
    ];
  }

  return {
    length,
    step,
    dist,
    lon,
    lat,
    alt,
    ele,
    part,
    air: airFlags,
    smoothLon,
    smoothLat,
    smoothAlt,
    steep,
    heading: unwrap(raw),
    bounds,
  };
}

/**
 * The profile of the elevation recorded with the track, for the bar of the player: about `points` points [x, y], x the
 * share of the bar (the share of the duration: the speed is not constant at the start and the end), y the share of the
 * height between the lowest and the highest; null when the track has no elevation
 */
export function elevationProfile(track: FlyoverTrack, ramp = FLYOVER.ramp, points = 200): [number, number][] | null {
  const ele = track.ele;
  if (!ele) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const value of ele) {
    if (!Number.isFinite(value)) continue;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (!(max - min >= 1)) return null;
  const profile: [number, number][] = [];
  let last = min;
  for (let p = 0; p <= points; p++) {
    const d = (p / points) * track.length;
    const value = interp(d, track.dist, ele);
    // a vertex without elevation: the point before
    if (Number.isFinite(value)) last = value;
    profile.push([timeFraction(d / track.length, ramp), (last - min) / (max - min)]);
  }
  return profile;
}

/** The index of the sample at or just before the distance d */
export function sampleIndex(track: FlyoverTrack, d: number): number {
  return clamp(Math.floor(d / track.step), 0, track.dist.length - 1);
}

export type FlyoverPoint = { lon: number; lat: number; alt: number; air: boolean };

/** The point of the track at the distance d */
export function pointAt(track: FlyoverTrack, d: number): FlyoverPoint {
  const i = sampleIndex(track, d);
  const j = Math.min(i + 1, track.dist.length - 1);
  const span = track.dist[j] - track.dist[i];
  const f = span > 0 ? clamp((d - track.dist[i]) / span, 0, 1) : 0;
  // across a gap between two parts: no point in between
  if (track.part[i] !== track.part[j]) {
    const k = f < 0.5 ? i : j;
    return { lon: track.lon[k], lat: track.lat[k], alt: track.alt[k], air: !!track.air[k] };
  }
  return {
    lon: track.lon[i] + f * (track.lon[j] - track.lon[i]),
    lat: track.lat[i] + f * (track.lat[j] - track.lat[i]),
    alt: track.alt[i] + f * (track.alt[j] - track.alt[i]),
    air: !!track.air[i] && !!track.air[j],
  };
}

/** The direction of the track at the distance d (degrees, unwrapped) */
export const headingAt = (track: FlyoverTrack, d: number): number => interp(d, track.dist, track.heading);

/**
 * The lines of the track up to the distance d, by part, ending at the playhead; only the samples matching `keep`. From
 * the sample `from` on, and up to the sample `to` instead of the playhead when given (a played line drawn in two parts:
 * playedSplit)
 */
export function playedLines(
  track: FlyoverTrack,
  d: number,
  keep: (k: number) => boolean = () => true,
  withAlt = false,
  from = 0,
  to?: number
): number[][][] {
  const lines: number[][][] = [];
  let line: number[][] = [];
  const position = (k: number) => (withAlt ? [track.lon[k], track.lat[k], track.alt[k]] : [track.lon[k], track.lat[k]]);
  const end = to ?? sampleIndex(track, d);
  const flush = () => {
    if (line.length > 1) lines.push(line);
    line = [];
  };
  for (let k = from; k <= end; k++) {
    if (!keep(k) || (k > from && track.part[k] !== track.part[k - 1])) flush();
    // the edge into a kept sample from one not kept: the line starts at the sample before (no hole at the switch)
    if (keep(k)) {
      if (!line.length && k > from && track.part[k] === track.part[k - 1]) line.push(position(k - 1));
      line.push(position(k));
    }
  }
  // up to the playhead itself, when its edge is kept
  const next = Math.min(end + 1, track.dist.length - 1);
  if (to === undefined && line.length && next > end && keep(next) && track.part[next] === track.part[end]) {
    const point = pointAt(track, d);
    line.push(withAlt ? [point.lon, point.lat, point.alt] : [point.lon, point.lat]);
  }
  flush();
  return lines;
}

/** The samples by which the body of a played line moves (playedSplit): about 50 times over the track */
export const bodyChunk = (track: FlyoverTrack): number => Math.max(32, Math.ceil(track.dist.length / 50));

/**
 * The played line in two parts, so that the most of it is not drawn again at each frame: the body, up to the sample
 * `bodyEnd`, which moves by bodyChunk samples, and the tip, from there to the playhead
 */
export function playedSplit(
  track: FlyoverTrack,
  d: number,
  keep: (k: number) => boolean = () => true,
  withAlt = false
): { bodyEnd: number; body: () => number[][][]; tip: number[][][] } {
  const chunk = bodyChunk(track);
  const bodyEnd = Math.floor(sampleIndex(track, d) / chunk) * chunk;
  return {
    bodyEnd,
    // built when the body moved only
    body: () => playedLines(track, d, keep, withAlt, 0, bodyEnd),
    tip: playedLines(track, d, keep, withAlt, bodyEnd),
  };
}

export type FlyoverCamera = {
  camera: [number, number];
  cameraAlt: number;
  target: [number, number];
  targetAlt: number;
  // the lowest altitude from which the terrain between the camera and the target does not hide it
  minAlt: number;
};

/** The distance from the camera to the point it looks at, for this track (metres) */
export const cameraDistance = (track: FlyoverTrack, settings: FlyoverSettings = FLYOVER): number =>
  clamp(settings.distance.ratio * track.length, settings.distance.min, settings.distance.max);

/** A point `metres` away from [lon, lat] towards `bearing` */
export function offsetPoint(lon: number, lat: number, bearing: number, metres: number): [number, number] {
  const dy = metres * Math.cos(bearing * toRad);
  const dx = metres * Math.sin(bearing * toRad);
  return [lon + dx / (METRES_PER_DEGREE * Math.cos(lat * toRad)), lat + dy / METRES_PER_DEGREE];
}

/**
 * The camera at the distance d of the track, looking towards `bearing`: behind and above the smoothed track a little
 * ahead of the playhead, and high enough above the terrain (`terrainAt`, altitude as drawn, null when unknown) to see
 * that point over what lies between
 */
export function cameraFor(
  track: FlyoverTrack,
  d: number,
  bearing: number,
  terrainAt: (lon: number, lat: number) => number | null = () => null,
  settings: FlyoverSettings = FLYOVER
): FlyoverCamera {
  const distance = cameraDistance(track, settings) * interp(d, track.dist, track.steep);
  const at = clamp(d + settings.lead * distance, 0, track.length);
  const target: [number, number] = [interp(at, track.dist, track.smoothLon), interp(at, track.dist, track.smoothLat)];
  const targetAlt = interp(at, track.dist, track.smoothAlt);
  const camera = offsetPoint(target[0], target[1], bearing + 180, distance);
  let cameraAlt = targetAlt + distance * Math.tan(settings.elevationAngle * toRad);
  let minAlt = -Infinity;
  // the line of sight above the terrain: at the camera (t = 0), and on the way to the point; by `clearance` for the
  // altitude wanted, just above it for the lowest one
  for (const t of [0, 0.25, 0.5, 0.75]) {
    const ground = terrainAt(camera[0] + t * (target[0] - camera[0]), camera[1] + t * (target[1] - camera[1]));
    if (ground === null || !Number.isFinite(ground)) continue;
    cameraAlt = Math.max(cameraAlt, (ground + settings.clearance - t * targetAlt) / (1 - t));
    minAlt = Math.max(minAlt, (ground + MIN_CLEARANCE - t * targetAlt) / (1 - t));
  }
  return { camera, cameraAlt, target, targetAlt, minAlt };
}

/** One step of an exponential smoothing towards an angle (degrees), at most `rate` degrees a second */
export function smoothAngle(current: number, wanted: number, dt: number, tau: number, rate: number): number {
  const delta = ((((wanted - current) % 360) + 540) % 360) - 180;
  const step = delta * (1 - Math.exp(-dt / tau));
  const max = rate * dt;
  return current + clamp(step, -max, max);
}

/** One step of an exponential smoothing towards a value */
export const smoothValue = (current: number, wanted: number, dt: number, tau: number): number =>
  current + (wanted - current) * (1 - Math.exp(-dt / tau));

/** The camera from a frame to the next: its bearing and its altitude, smoothed */
export type FollowState = { bearing: number; cameraAlt: number };

/**
 * The camera that follows the track at the distance d, dt seconds after the last frame (`state`, updated); snap: no
 * smoothing (the start, a seek)
 */
export function followStep(
  state: FollowState,
  track: FlyoverTrack,
  d: number,
  dt: number,
  snap: boolean,
  terrainAt: (lon: number, lat: number) => number | null = () => null,
  settings: FlyoverSettings = FLYOVER
): FlyoverCamera {
  const wanted = headingAt(track, d);
  state.bearing = snap ? wanted : smoothAngle(state.bearing, wanted, dt, settings.bearingTau, settings.bearingRate);
  const camera = cameraFor(track, d, state.bearing, terrainAt, settings);
  if (snap) {
    state.cameraAlt = camera.cameraAlt;
  } else {
    const tau = camera.cameraAlt > state.cameraAlt ? settings.climbTau : settings.descentTau;
    // smoothed, but never in the terrain, nor below a ridge that would hide the point looked at
    state.cameraAlt = Math.max(smoothValue(state.cameraAlt, camera.cameraAlt, dt, tau), camera.minAlt);
  }
  return { ...camera, cameraAlt: state.cameraAlt };
}

/**
 * The cameras of a play at 1×, one every `every` seconds, at the distance `at` along the track: where the camera will
 * be, to fetch the tiles it will show before it gets there. Followed at `fps` frames a second, as played.
 */
export function cameraPath(
  track: FlyoverTrack,
  terrainAt: (lon: number, lat: number) => number | null = () => null,
  settings: FlyoverSettings = FLYOVER,
  every = 1,
  fps = 20
): { at: number; camera: FlyoverCamera }[] {
  const duration = durationAt1x(track.length, settings);
  const state: FollowState = { bearing: 0, cameraAlt: 0 };
  const path: { at: number; camera: FlyoverCamera }[] = [];
  const frames = Math.ceil(duration * fps);
  let next = 0;
  for (let frame = 0; frame <= frames; frame++) {
    const t = Math.min(frame / fps, duration);
    const at = distanceFraction(t / duration, settings.ramp) * track.length;
    const camera = followStep(state, track, at, 1 / fps, frame === 0, terrainAt, settings);
    if (t >= next || frame === frames) {
      path.push({ at, camera });
      next += every;
    }
  }
  return path;
}
