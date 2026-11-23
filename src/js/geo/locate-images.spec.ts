import { describe, expect, it } from 'vitest';

import {
  CONFIDENT_FIT,
  estimateClockShift,
  hasDefaultLocation,
  locateImages,
  positionAt,
  readTrack,
} from './locate-images';

// 2026-11-21T09:00:00Z
const T0 = Date.UTC(2026, 10, 21, 9) / 1000;
const iso = (seconds: number) => new Date(seconds * 1000).toISOString();
const point = (x: number, y: number) => JSON.stringify({ type: 'Point', coordinates: [x, y] });

// 09:00 to 14:00 UTC, one point a minute going east 10 m a minute, 2000 m up
const coordinates = Array.from({ length: 301 }, (_, i) => [700000 + i * 10, 5600000, 2000 + i, T0 + i * 60]);
const geomDetail = JSON.stringify({ type: 'LineString', coordinates });
const track = readTrack(geomDetail);
const outingGeom = point(701500, 5600000);

describe('readTrack', () => {
  it('reads the timed points of all the segments, in time order', () => {
    const multi = JSON.stringify({
      type: 'MultiLineString',
      coordinates: [
        [
          [3, 3, 0, 300],
          [4, 4, 0, 400],
        ],
        [
          [1, 1, 0, 100],
          [2, 2, 0, 0],
        ],
      ],
    });
    expect(readTrack(multi).map((p) => p.t)).toEqual([100, 300, 400]);
    expect(readTrack(JSON.stringify({ type: 'LineString', coordinates: [[1, 1, 0]] }))).toEqual([]);
  });
});

describe('hasDefaultLocation', () => {
  it('is true without location, or on a location the image was given', () => {
    expect(hasDefaultLocation(null, [outingGeom])).toBe(true);
    expect(hasDefaultLocation(point(701500.0000001, 5600000), [null, outingGeom])).toBe(true);
    expect(hasDefaultLocation(point(701510, 5600000), [outingGeom])).toBe(false);
  });
});

describe('estimateClockShift', () => {
  it('keeps the times that fit the track', () => {
    expect(estimateClockShift([T0 + 600, T0 + 4 * 3600], track)).toBe(0);
  });

  it('shifts a camera left on summer time by the hour, not by the smallest shift that fits', () => {
    // shot from 10:30 to 15:00 by the clock of the camera, one hour late: -45 min would fit too
    expect(estimateClockShift([T0 + 1.5 * 3600, T0 + 3 * 3600, T0 + 6 * 3600], track)).toBe(-3600);
  });

  it('shifts a camera set to another time zone', () => {
    expect(estimateClockShift([T0 + 8 * 3600 + 600, T0 + 12 * 3600 + 3000], track)).toBe(-8 * 3600);
  });
});

describe('positionAt', () => {
  it('interpolates between the points', () => {
    expect(positionAt(track, T0 + 90)).toEqual({ x: 700015, y: 5600000, z: 2001.5 });
  });

  it('puts a photo shot before the start (at the car, on the approach) at the start, not long before', () => {
    expect(positionAt(track, T0 - 45 * 60)).toMatchObject({ x: 700000 });
    expect(positionAt(track, T0 - 2 * 3600)).toBeNull();
  });

  it('does not interpolate a long gap between far points', () => {
    const gapped = readTrack(
      JSON.stringify({
        type: 'LineString',
        coordinates: [
          [0, 0, 0, T0],
          [10000, 0, 0, T0 + 3600],
        ],
      })
    );
    expect(positionAt(gapped, T0 + 120)).toMatchObject({ x: 0 });
    expect(positionAt(gapped, T0 + 1800)).toBeNull();
  });

  it('interpolates a long pause on the spot', () => {
    const pause = readTrack(
      JSON.stringify({
        type: 'LineString',
        coordinates: [
          [0, 0, 0, T0],
          [100, 0, 0, T0 + 3600],
        ],
      })
    );
    expect(positionAt(pause, T0 + 1800)).toMatchObject({ x: 50 });
  });
});

describe('locateImages', () => {
  it('locates the images without a location of their own, with the clock shift of their camera', () => {
    const images = [
      // a phone with its GPS, on time: kept
      { geom: point(700100, 5600100), date_time: iso(T0 + 600), camera_name: 'phone' },
      // a camera two hours ahead
      { geom: outingGeom, date_time: iso(T0 + 2 * 3600 + 600), camera_name: 'camera' },
      { geom: outingGeom, date_time: iso(T0 + 2 * 3600 + 3600), camera_name: 'camera' },
      { geom: outingGeom, date_time: iso(T0 + 2 * 3600 + 4.5 * 3600), camera_name: 'camera' },
      // the clock of the camera was reset
      { geom: outingGeom, date_time: '1980-01-01T00:00:00+00:00', camera_name: 'camera' },
      { geom: null, date_time: null },
    ];
    const locations = locateImages(images, track, [outingGeom], { date_start: '2026-11-21', date_end: '2026-11-21' });

    expect(locations).toEqual([
      null,
      { geom: point(700100, 5600000), elevation: 2010 },
      { geom: point(700600, 5600000), elevation: 2060 },
      { geom: point(702700, 5600000), elevation: 2270 },
      null,
      null,
    ]);
  });

  it('leaves an image of a camera with GPS that happens to be on the route point', () => {
    const phone = (x: number, minutes: number) => ({
      geom: point(x, 5600000),
      date_time: iso(T0 + minutes * 60),
      camera_name: 'phone',
    });
    // shot at the summit, the route point: its other images have their own location
    const images = [phone(700100, 10), phone(700200, 20), phone(701500, 150)];
    expect(locateImages(images, track, [outingGeom])).toEqual([null, null, null]);
  });

  it('locates without being asked only the cameras whose images fit the track', () => {
    // two images during the track, two the evening before: the camera may be on another day
    const images = [-12, 1, 2, -10].map((hours) => ({
      geom: outingGeom,
      date_time: iso(T0 + hours * 3600),
      camera_name: 'camera',
    }));
    expect(locateImages(images, track, [outingGeom]).filter(Boolean)).toHaveLength(2);
    expect(locateImages(images, track, [outingGeom], {}, { minFit: CONFIDENT_FIT })).toEqual([null, null, null, null]);
  });

  it('does not guess the shift of a camera whose images fit the track with any of many shifts', () => {
    // camera glasses stamping their images when synced to the phone, hours after the track ended
    const images = [5.5, 6, 7, 8].map((hours) => ({
      geom: outingGeom,
      date_time: iso(T0 + hours * 3600),
      camera_name: 'glasses',
    }));
    expect(locateImages(images, track, [outingGeom])).toEqual([null, null, null, null]);
  });
});
