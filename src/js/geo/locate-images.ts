/*
 * The location of the images of an outing, read on its GPS track at the time they were shot (#4259): many images have
 * no GPS position (cameras without GPS, phones stripping it), and got the location of the outing instead.
 *
 * Positions are in EPSG:3857, the times of the track in seconds since 1970 (its 4th coordinate).
 */

export type TrackPoint = { x: number; y: number; z: number; t: number };

// the image as the matching reads it
export type LocatableImage = {
  // GeoJSON point, as the API gives it
  geom?: string | null;
  // ISO 8601 with its offset, as the API gives it
  date_time?: string | null;
  // the images of a camera share the shift of its clock
  camera_name?: string | null;
};

export type ImageLocation = { geom: string; elevation?: number };

// photos shot before starting the GPS (at the car, on the approach), or after stopping it, are put at its ends
const END_MARGIN = 60 * 60;
// the clock shift of a camera puts its images within the time of the track, give or take this
const SHIFT_MARGIN = 15 * 60;
// a gap of the track is interpolated when short in time or in distance (a pause), else the nearest point is taken
const MAX_GAP = 10 * 60;
const MAX_GAP_DISTANCE = 300;
const MAX_NEAREST = 5 * 60;
// the clock of a camera is shifted by a time zone (or a summer time), up to 14 hours
const MAX_SHIFT = 14 * 3600;
const SHIFT_STEP = 15 * 60;
// an image this close to a former location of the outing (meters in EPSG:3857) was put there, not shot there
const SAME_LOCATION = 1;
const DAY = 24 * 3600;
const EARTH_RADIUS = 6378137;

const pointOf = (geom: string | null | undefined): number[] | null => {
  if (!geom) {
    return null;
  }
  try {
    const { type, coordinates } = JSON.parse(geom) as { type: string; coordinates: number[] };
    return type === 'Point' && Number.isFinite(coordinates?.[0]) && Number.isFinite(coordinates?.[1])
      ? coordinates
      : null;
  } catch {
    return null;
  }
};

/** The timed points of a track (a geom_detail), in time order: none when it has no times */
export function readTrack(geomDetail: string | null | undefined): TrackPoint[] {
  if (!geomDetail) {
    return [];
  }
  let geometry: { type: string; coordinates: unknown };
  try {
    geometry = JSON.parse(geomDetail);
  } catch {
    return [];
  }
  const lines =
    geometry.type === 'LineString'
      ? [geometry.coordinates as number[][]]
      : geometry.type === 'MultiLineString'
        ? (geometry.coordinates as number[][][])
        : [];
  return lines
    .flat()
    .filter(([x, y, , t]) => Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(t) && t! > 0)
    .map(([x, y, z, t]) => ({ x: x!, y: y!, z: z ?? 0, t: t! }))
    .sort((a, b) => a.t - b.t);
}

/** Whether the image has no location of its own: none, or one of the locations given to it (the outing's, its routes') */
export function hasDefaultLocation(geom: string | null | undefined, defaultGeoms: (string | null | undefined)[]) {
  const point = pointOf(geom);
  if (!point) {
    return true;
  }
  return defaultGeoms
    .map(pointOf)
    .some((other) => other && Math.hypot(other[0]! - point[0]!, other[1]! - point[1]!) < SAME_LOCATION);
}

const toSeconds = (dateTime: string | null | undefined) => {
  const time = dateTime ? Date.parse(dateTime) : NaN;
  return Number.isFinite(time) ? time / 1000 : null;
};

/**
 * The time of the image, in seconds, when it may be the time of the outing: around its days or its track (a time zone
 * apart at most), not the default date of a camera (1980, 2000...)
 */
export function usableTime(
  dateTime: string | null | undefined,
  track: TrackPoint[],
  dates: { date_start?: string | null; date_end?: string | null } = {}
): number | null {
  const time = toSeconds(dateTime);
  if (time === null || !track.length) {
    return null;
  }
  const start = Math.min(track[0]!.t, toSeconds(dates.date_start) ?? Infinity);
  const end = Math.max(track[track.length - 1]!.t, (toSeconds(dates.date_end ?? dates.date_start) ?? -Infinity) + DAY);
  return time >= start - MAX_SHIFT && time <= end + MAX_SHIFT ? time : null;
}

// the number of times within the track, once shifted, give or take the margin
const fitCount = (times: number[], track: TrackPoint[], shift: number, margin: number) => {
  const first = track[0]!.t - margin;
  const last = track[track.length - 1]!.t + margin;
  return times.filter((time) => time + shift >= first && time + shift <= last).length;
};

/**
 * The seconds to add to the times of the images to read them on the track: their camera may be set to another time zone
 * than the GPS (or to winter time). The shift puts most images within the time of the track, the smallest one,
 * preferably whole hours (time zones): none when they already are.
 */
export function estimateClockShift(times: number[], track: TrackPoint[]): number {
  if (!times.length || !track.length) {
    return 0;
  }
  const score = (shift: number) => fitCount(times, track, shift, SHIFT_MARGIN);

  let best = 0;
  let bestScore = score(0);
  const better = (shift: number, shiftScore: number) => {
    if (shiftScore !== bestScore) {
      return shiftScore > bestScore;
    }
    const wholeHours = (value: number) => value % 3600 === 0;
    if (wholeHours(shift) !== wholeHours(best)) {
      return wholeHours(shift);
    }
    return Math.abs(shift) < Math.abs(best);
  };
  for (let shift = -MAX_SHIFT; shift <= MAX_SHIFT; shift += SHIFT_STEP) {
    const shiftScore = score(shift);
    if (better(shift, shiftScore)) {
      best = shift;
      bestScore = shiftScore;
    }
  }
  return bestScore ? best : 0;
}

// meters on the ground between two points of EPSG:3857, which stretches them by 1 / cos(latitude)
const groundDistance = (a: TrackPoint, b: TrackPoint) => {
  const latitude = Math.atan(Math.sinh((a.y + b.y) / 2 / EARTH_RADIUS));
  return Math.hypot(a.x - b.x, a.y - b.y) * Math.cos(latitude);
};

/** Where the track was at that time, or null when it was not recorded then */
export function positionAt(track: TrackPoint[], time: number): Omit<TrackPoint, 't'> | null {
  if (!track.length) {
    return null;
  }
  const first = track[0]!;
  const last = track[track.length - 1]!;
  if (time <= first.t) {
    return first.t - time <= END_MARGIN ? first : null;
  }
  if (time >= last.t) {
    return time - last.t <= END_MARGIN ? last : null;
  }

  // the last point before the time
  let low = 0;
  let high = track.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (track[middle]!.t <= time) {
      low = middle;
    } else {
      high = middle;
    }
  }
  const before = track[low]!;
  const after = track[high]!;
  const gap = after.t - before.t;
  if (gap <= MAX_GAP || groundDistance(before, after) <= MAX_GAP_DISTANCE) {
    const ratio = gap ? (time - before.t) / gap : 0;
    const at = (from: number, to: number) => from + (to - from) * ratio;
    return { x: at(before.x, after.x), y: at(before.y, after.y), z: at(before.z, after.z) };
  }
  const nearest = time - before.t <= after.t - time ? before : after;
  return Math.abs(nearest.t - time) <= MAX_NEAREST ? nearest : null;
}

// A camera without GPS has (nearly) all its images on a default location; one with GPS may have an image shot right at the
// route point (a summit): such a coincidence is not moved
const MIN_DEFAULT_SHARE = 0.5;
// to locate the images without the user asking for it, most images of their camera must fit the track
export const CONFIDENT_FIT = 0.8;

type Camera = { times: number[]; images: number; defaults: number; shift: number; fit: number };

/**
 * The locations of the images on the track, in their order: null for an image that has its own location, a time out of
 * the outing, or shot when the track was not recorded.
 *
 * DefaultGeoms are the locations an image without one got: the outing's (now and before) and its routes'. With minFit,
 * only the images of the cameras with that share of their images within the time of the track are located.
 */
export function locateImages(
  images: LocatableImage[],
  track: TrackPoint[],
  defaultGeoms: (string | null | undefined)[],
  dates: { date_start?: string | null; date_end?: string | null } = {},
  { minFit = 0 } = {}
): (ImageLocation | null)[] {
  const times = images.map((image) => usableTime(image.date_time, track, dates));
  const onDefault = images.map((image) => hasDefaultLocation(image.geom, defaultGeoms));
  // all the images of a camera tell whether it has a GPS, and those with a time the shift of its clock
  const cameras = new Map<string, Camera>();
  const cameraOf = (image: LocatableImage) => image.camera_name ?? '';
  images.forEach((image, i) => {
    const camera = cameras.get(cameraOf(image)) ?? { times: [], images: 0, defaults: 0, shift: 0, fit: 0 };
    camera.images++;
    camera.defaults += onDefault[i] ? 1 : 0;
    if (times[i] !== null) {
      camera.times.push(times[i]!);
    }
    cameras.set(cameraOf(image), camera);
  });
  for (const camera of cameras.values()) {
    if (camera.times.length && track.length) {
      camera.shift = estimateClockShift(camera.times, track);
      camera.fit = fitCount(camera.times, track, camera.shift, END_MARGIN) / camera.times.length;
    }
  }

  return images.map((image, i) => {
    const time = times[i];
    const camera = cameras.get(cameraOf(image))!;
    if (time === null || !onDefault[i] || camera.defaults / camera.images < MIN_DEFAULT_SHARE || camera.fit < minFit) {
      return null;
    }
    const position = positionAt(track, time + camera.shift);
    if (!position) {
      return null;
    }
    const location: ImageLocation = {
      geom: JSON.stringify({ type: 'Point', coordinates: [position.x, position.y] }),
    };
    if (position.z) {
      location.elevation = Math.round(position.z);
    }
    return location;
  });
}
