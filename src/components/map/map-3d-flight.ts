// the flights of a paragliding track, to draw them in the air in the 3D view while the walk stays draped.
// Port of the research script (scratchpad paragliding/scripts/detect.py, 21 real tracks, 20 right, 1 doubtful):
// - height above ground (GPS altitude minus the terrain, corrected by the track's own altitude offset) is the backbone,
//   it works without time;
// - with time, the speed of each edge (not of a run: a logger stopped in flight leaves one slow straight edge);
// - an edge "glued" to the terrain (steady height above ground) is a walk with an altitude offset, not a flight;
// - one long straight edge dropping steeply cannot be walked: a flight with a recording gap.
// Two passes: the second one with an offset measured locally on each ground part (GPS and barometric drift).

/** One part of a track: [lon, lat, z, unix time?] */
export type TrackPart = number[][];

/** The terrain elevation (metres) at points [lon, lat] */
export type GroundSampler = (points: [number, number][]) => Promise<Float64Array>;

export type FlightSplit = {
  // [first, last] vertex of each flight, indices in the concatenated parts
  flights: [number, number][];
  // the track vertices (concatenated parts), z despiked, and the part of each
  vertices: number[][];
  part: number[];
  // per vertex: GPS altitude minus terrain on the ground, to remove so that the flight meets the terrain
  offset: Float64Array;
  hasTime: boolean;
};

const P = {
  aglLo: 30, // edge mean height above ground to be a flight candidate (m)
  aglHi: 80, // a candidate run must reach this somewhere (m)
  minLen: 400, // min horizontal length of a flight (m)
  minDur: 60, // min duration of a flight when time exists (s)
  walkSpeed: 8, // km/h: an edge slower than this is not flying (unless sinking fast)
  sink: -1.5, // m/s: edge sinking faster than this counts as flying whatever the speed
  fast: 18, // km/h: edge this fast and a bit above ground counts for flight
  fastAgl: 15, // m: the 'a bit above ground' for fast edges
  gapMerge: 150, // merge two flights separated by a short ground blip (m)
  edgeSnap: 12, // m: extend flight ends while above this (launch run, final approach)
  snapMax: 300, // m: max extension when time is unknown
  ntAglHi: 120, // no time: stricter peak height
  ntMean: 45, // no time: min length-weighted mean height of a run
  chordLen: 800, // m: a straight edge this long ...
  chordSlope: -0.25, // ... dropping this steeply cannot be walked: a flight with a recording gap
  gapDt: 300, // s: an edge this long in time and longer than gapLen is a recording gap, speed meaningless
  gapLen: 500,
  runSpeed: 12, // km/h: a launch run / flare edge low above ground still belongs to the flight
  runMax: 150, // m: ... but at most this far (do not swallow a car ride after landing)
  trimAgl: 25, // m: flight ends this low and this flat are trimmed back to ground
  trimSlope: 0.1,
  glueHalf: 250, // m: half window to measure how steady the height above ground is
  glueStd: 4.5, // m: steadier than this = walking with an altitude offset, not flying
  step: 20, // m: the terrain is sampled along the track every this
};

const EARTH = 6371008.8;
const toRad = Math.PI / 180;

function groundDistance(a: number[], b: number[]): number {
  const lat = ((a[1] + b[1]) / 2) * toRad;
  const dx = (b[0] - a[0]) * toRad * Math.cos(lat);
  const dy = (b[1] - a[1]) * toRad;
  return Math.hypot(dx, dy) * EARTH;
}

// linear interpolation of ys over increasing xs, clamped (numpy.interp)
function interp(x: number, xs: ArrayLike<number>, ys: ArrayLike<number>): number {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= x) lo = mid;
    else hi = mid;
  }
  const span = xs[hi] - xs[lo];
  return span > 0 ? ys[lo] + ((ys[hi] - ys[lo]) * (x - xs[lo])) / span : ys[hi];
}

// first index where xs[i] >= x (numpy.searchsorted, side left)
function searchsorted(xs: ArrayLike<number>, x: number): number {
  let lo = 0;
  let hi = xs.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const finite = (values: number[]) => values.filter((v) => Number.isFinite(v));
const mean = (values: number[]) => {
  const v = finite(values);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN;
};
const median = (values: number[]) => {
  const v = finite(values).sort((a, b) => a - b);
  if (!v.length) return NaN;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const std = (values: number[]) => {
  const v = finite(values);
  const m = mean(v);
  return v.length ? Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length) : NaN;
};

/**
 * GPS altitude minus terrain on the ground: the lowest well-populated peak of the histogram (not the median: most
 * points of a flight track are in the air)
 */
export function modeOffset(values: number[]): number {
  const a = values.filter((v) => Number.isFinite(v) && Math.abs(v) < 150);
  if (a.length < 5) return 0;
  const bins = 60; // -150..150 by 5 m
  const raw = new Array<number>(bins).fill(0);
  for (const v of a) raw[Math.min(bins - 1, Math.floor((v + 150) / 5))]++;
  const kernel = [1, 2, 3, 2, 1];
  const h = raw.map((_, k) => kernel.reduce((s, w, j) => s + w * (raw[k + j - 2] ?? 0), 0));
  const max = Math.max(...h);
  const peaks = h
    .map((_, k) => k)
    .filter((k) => h[k] > 0 && h[k] >= h[Math.max(k - 1, 0)] && h[k] >= h[Math.min(k + 1, bins - 1)]);
  const k = Math.min(...peaks.filter((p) => h[p] >= 0.3 * max));
  const edge = -150 + 5 * k;
  const near = a.filter((v) => v > edge - 15 && v < edge + 20);
  return near.length ? median(near) : edge + 2.5;
}

/** Replace 1-2 point altitude spikes (out and back), keep real steps such as a gap chord */
export function despike(z: number[], threshold = 40): number[] {
  const out = [...z];
  for (const w of [1, 2]) {
    for (let i = 1; i < out.length - w; i++) {
      const left = out[i - 1];
      const right = out[i + w];
      if (Math.abs(left - right) > threshold) continue;
      const ref = (left + right) / 2;
      const seg = out.slice(i, i + w);
      if (seg.every((v) => v - ref > threshold) || seg.every((v) => ref - v > threshold)) {
        for (let j = i; j < i + w; j++) out[j] = ref;
      }
    }
  }
  return out;
}

/** The track, ready for the detection: vertices, distances, and the points where the terrain is sampled */
export type Track = {
  vertices: number[][];
  part: number[];
  dist: number[]; // ground distance from the start, no distance across parts
  dense: number[]; // distance of the terrain samples, every P.step metres
  densePoints: [number, number][];
};

export function prepareTrack(parts: TrackPart[]): Track {
  const vertices: number[][] = [];
  const part: number[] = [];
  parts.forEach((coordinates, k) =>
    coordinates.forEach((c) => {
      vertices.push(c);
      part.push(k);
    })
  );
  const dist = [0];
  for (let i = 1; i < vertices.length; i++) {
    dist.push(dist[i - 1] + (part[i] === part[i - 1] ? groundDistance(vertices[i - 1], vertices[i]) : 0));
  }
  const dense: number[] = [];
  const densePoints: [number, number][] = [];
  for (let d = 0; d < dist[dist.length - 1]; d += P.step) {
    dense.push(d);
    const i = Math.min(Math.max(searchsorted(dist, d) - 1, 0), vertices.length - 2);
    const span = dist[i + 1] - dist[i];
    const f = span > 0 ? (d - dist[i]) / span : 0;
    densePoints.push([
      vertices[i][0] + f * (vertices[i + 1][0] - vertices[i][0]),
      vertices[i][1] + f * (vertices[i + 1][1] - vertices[i][1]),
    ]);
  }
  return { vertices, part, dist, dense, densePoints };
}

type Features = {
  n: number;
  hasTime: boolean;
  offset: Float64Array;
  globalOffset: number;
  agl: Float64Array;
  edgeAgl: Float64Array;
  edgeStd: Float64Array;
  ds: number[];
  dz: number[];
  dt: number[];
  speed: number[]; // km/h
  vz: number[]; // m/s
  jump: boolean[];
};

function features(
  track: Track,
  z: number[],
  time: number[],
  ground: Float64Array,
  groundDense: Float64Array,
  useTime: boolean,
  offsetIn?: Float64Array
): Features {
  const { dist, dense, part } = track;
  const n = z.length;
  const hasTime = useTime && time.filter((t) => Number.isFinite(t)).length > 0.9 * n;
  const raw = z.map((v, i) => v - ground[i]);
  const ds: number[] = [];
  const dz: number[] = [];
  const dt: number[] = [];
  const speed: number[] = [];
  const vz: number[] = [];
  const jump: boolean[] = [];
  for (let i = 0; i < n - 1; i++) {
    ds.push(dist[i + 1] - dist[i]);
    dz.push(z[i + 1] - z[i]);
    jump.push(part[i + 1] !== part[i]);
    const d = time[i + 1] - time[i];
    dt.push(hasTime ? d : NaN);
    speed.push(hasTime && d > 0 ? (ds[i] / d) * 3.6 : NaN);
    vz.push(hasTime && d > 0 ? dz[i] / d : NaN);
  }
  let offset = offsetIn;
  if (!offset) {
    let ref = raw;
    if (hasTime) {
      const slow = raw.map((_, i) => (i < n - 1 && speed[i] < 6) || (i > 0 && speed[i - 1] < 6));
      if (slow.filter(Boolean).length > 10) ref = raw.filter((_, i) => slow[i]);
    }
    offset = new Float64Array(n).fill(modeOffset(ref));
  }
  const agl = Float64Array.from(raw, (v, i) => v - offset[i]);
  const aglDense = Float64Array.from(dense, (d, j) => interp(d, dist, z) - groundDense[j] - interp(d, dist, offset));
  const idx = dist.map((d) => searchsorted(dense, d));
  const edgeAgl = new Float64Array(n - 1);
  const edgeStd = new Float64Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    edgeAgl[i] = mean([agl[i], agl[i + 1], ...aglDense.subarray(idx[i], idx[i + 1])]);
    const mid = (dist[i] + dist[i + 1]) / 2;
    const lo = searchsorted(dense, mid - P.glueHalf);
    const hi = searchsorted(dense, mid + P.glueHalf);
    edgeStd[i] = hi - lo > 5 ? std([...aglDense.subarray(lo, hi)]) : NaN;
  }
  return {
    n,
    hasTime,
    offset,
    globalOffset: median([...offset]),
    agl,
    edgeAgl,
    edgeStd,
    ds,
    dz,
    dt,
    speed,
    vz,
    jump,
  };
}

function runs(mask: boolean[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    let j = i;
    while (j + 1 < mask.length && mask[j + 1]) j++;
    out.push([i, j]);
    i = j;
  }
  return out;
}

const sum = (values: number[]) => values.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);

// the flight edges of the track
function classify(f: Features): boolean[] {
  const { n, edgeAgl, ds, dz, dt, speed, vz, jump, hasTime: T } = f;
  const chord = ds.map((d, i) => d > P.chordLen && dz[i] / Math.max(d, 1) < P.chordSlope);
  const cand = ds.map((d, i) => {
    let c = edgeAgl[i] > P.aglLo;
    if (T) {
      const gap = dt[i] > P.gapDt && d > P.gapLen;
      c = c && (speed[i] > P.walkSpeed || vz[i] < P.sink || gap);
      c = c || (speed[i] > P.fast && edgeAgl[i] > P.fastAgl);
    }
    c = c && !(f.edgeStd[i] < P.glueStd);
    return (c || chord[i]) && !jump[i];
  });
  const edges = new Array<boolean>(n - 1).fill(false);
  for (const [a, b] of runs(cand)) {
    const range = (values: ArrayLike<number>) => Array.from(values).slice(a, b + 1);
    if (chord.slice(a, b + 1).some(Boolean)) {
      edges.fill(true, a, b + 1);
      continue;
    }
    const length = sum(range(ds));
    const peak = Math.max(...range(edgeAgl));
    let keep = length >= P.minLen;
    if (T) {
      keep = keep && peak >= P.aglHi && sum(range(dt)) >= P.minDur;
    } else {
      const weighted = sum(range(edgeAgl).map((v, k) => v * ds[a + k])) / Math.max(length, 1);
      keep = keep && peak >= P.ntAglHi && weighted >= P.ntMean;
    }
    if (keep) edges.fill(true, a, b + 1);
  }
  // a short ground blip between two flights
  for (const [a, b] of runs(edges.map((e) => !e))) {
    if (a > 0 && b < n - 2 && sum(ds.slice(a, b + 1)) < P.gapMerge && !jump.slice(a, b + 1).some(Boolean)) {
      edges.fill(true, a, b + 1);
    }
  }
  const canSnap = (i: number, used: number) => {
    if (jump[i]) return false;
    // launch run / final approach close to the ground
    if (T && ds[i] < P.gapLen && speed[i] > P.runSpeed && used + ds[i] <= P.runMax) return true;
    if (edgeAgl[i] <= P.edgeSnap) return false;
    if (T && ds[i] < P.gapLen) return speed[i] > 5 || vz[i] < -0.5;
    return used + ds[i] <= P.snapMax;
  };
  const isFlatLow = (i: number) => {
    if (edgeAgl[i] > P.trimAgl || Math.abs(dz[i]) / Math.max(ds[i], 1) > P.trimSlope) return false;
    return !T || speed[i] < P.walkSpeed;
  };
  // trim landed / not yet launched ends
  for (let [a, b] of runs(edges)) {
    while (a <= b && isFlatLow(a)) edges[a++] = false;
    while (b >= a && isFlatLow(b)) edges[b--] = false;
  }
  for (let [a, b] of runs(edges)) {
    let used = 0;
    while (a > 0 && canSnap(a - 1, used)) {
      a--;
      used += ds[a];
      edges[a] = true;
    }
    used = 0;
    while (b < n - 2 && canSnap(b + 1, used)) {
      b++;
      used += ds[b];
      edges[b] = true;
    }
  }
  return edges;
}

// the offset anchored on each ground part (median of GPS minus terrain), interpolated by index across the flights
function localOffset(z: number[], ground: Float64Array, f: Features, edges: boolean[]): Float64Array | null {
  const raw = z.map((v, i) => v - ground[i]);
  const xs: number[] = [];
  const offsets: number[] = [];
  for (const [a, edge] of runs(edges.map((e) => !e))) {
    const b = edge + 1; // ground vertices a..b
    if (b - a < 5) continue;
    // long ground parts in chunks, so that a slow drift is followed
    for (let c0 = a; c0 < b; c0 += 60) {
      const c1 = Math.min(b, c0 + 60);
      if (c1 - c0 < 5) continue;
      const values = raw.slice(c0, c1 + 1);
      // not glued to the ground: maybe a low flight taken for a walk
      if (std(values) > 25) continue;
      xs.push((c0 + c1) / 2);
      offsets.push(Math.min(Math.max(median(values), f.globalOffset - 80), f.globalOffset + 80));
    }
  }
  if (!xs.length) return null;
  return Float64Array.from(z, (_, i) =>
    // past the first/last anchor (after the last flight for example), no extrapolated local offset
    i < xs[0] - 30 || i > xs[xs.length - 1] + 30 ? f.globalOffset : interp(i, xs, offsets)
  );
}

/** The flights of a track: needs altitudes; uses the time when the track has it */
export async function splitFlights(parts: TrackPart[], sampleGround: GroundSampler): Promise<FlightSplit | null> {
  const track = prepareTrack(parts);
  const n = track.vertices.length;
  if (n < 3 || !track.vertices.every((v) => Number.isFinite(v[2]))) return null;
  const z = despike(track.vertices.map((v) => v[2]));
  // 0 or bogus times are missing
  const time = track.vertices.map((v) => (v[3] > 1e8 ? v[3] : NaN));
  const [ground, groundDense] = await Promise.all([
    sampleGround(track.vertices.map((v) => [v[0], v[1]])),
    sampleGround(track.densePoints),
  ]);
  let f = features(track, z, time, ground, groundDense, true);
  let edges = classify(f);
  const offset = localOffset(z, ground, f, edges);
  if (offset) {
    f = features(track, z, time, ground, groundDense, true, offset);
    edges = classify(f);
  }
  return {
    flights: runs(edges).map(([a, b]) => [a, b + 1]),
    vertices: track.vertices.map((v, i) => [v[0], v[1], z[i], v[3]]),
    part: track.part,
    offset: f.offset,
    hasTime: f.hasTime,
  };
}

/** For tests: the same with the terrain given */
export function splitFlightsWithGround(
  parts: TrackPart[],
  ground: Float64Array,
  groundDense: Float64Array,
  useTime = true
): [number, number][] {
  const track = prepareTrack(parts);
  const z = despike(track.vertices.map((v) => v[2]));
  const time = track.vertices.map((v) => (v[3] > 1e8 ? v[3] : NaN));
  let f = features(track, z, time, ground, groundDense, useTime);
  let edges = classify(f);
  const offset = localOffset(z, ground, f, edges);
  if (offset) {
    f = features(track, z, time, ground, groundDense, useTime, offset);
    edges = classify(f);
  }
  return runs(edges).map(([a, b]) => [a, b + 1]);
}
