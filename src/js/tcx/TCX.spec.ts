import { describe, expect, it } from 'vitest';

import { TCX } from './TCX';

const trackpoint = (lat: number, lon: number, alt?: number, time?: string) =>
  `<Trackpoint>${time ? `<Time>${time}</Time>` : ''}<Position><LatitudeDegrees>${lat}</LatitudeDegrees>` +
  `<LongitudeDegrees>${lon}</LongitudeDegrees></Position>${alt === undefined ? '' : `<AltitudeMeters>${alt}</AltitudeMeters>`}</Trackpoint>`;

const tcx = (body: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">${body}</TrainingCenterDatabase>`;

const coordinatesOf = (source: string) =>
  new TCX()
    .readFeatures(source)
    .map((feature) => (feature.getGeometry() as unknown as { getCoordinates(): unknown }).getCoordinates());

describe('TCX', () => {
  it('reads the track of a lap: longitude, latitude, altitude and time', () => {
    const source = tcx(
      `<Activities><Activity><Lap><Track>` +
        trackpoint(45.1, 5.7, 1200, '2026-01-10T08:00:00Z') +
        trackpoint(45.2, 5.8, 1300, '2026-01-10T09:00:00Z') +
        `</Track></Lap></Activity></Activities>`
    );

    expect(coordinatesOf(source)).toEqual([
      [
        [5.7, 45.1, 1200, Date.parse('2026-01-10T08:00:00Z') / 1000],
        [5.8, 45.2, 1300, Date.parse('2026-01-10T09:00:00Z') / 1000],
      ],
    ]);
  });

  it('reads several tracks of a lap as a multi line, and a course too', () => {
    const track = `<Track>${trackpoint(45.1, 5.7)}${trackpoint(45.2, 5.8)}</Track>`;
    const source = tcx(
      `<Activities><Activity><Lap>${track}${track}</Lap></Activity></Activities>` +
        `<Courses><Course>${track}</Course></Courses>`
    );

    const features = new TCX().readFeatures(source);

    expect(features.map((feature) => feature.getGeometry()?.getType())).toEqual(['MultiLineString', 'LineString']);
  });

  it('skips the tracks with less than two points or without position, and other XML', () => {
    expect(
      coordinatesOf(
        tcx(`<Activities><Activity><Lap><Track>${trackpoint(45.1, 5.7)}</Track></Lap></Activity></Activities>`)
      )
    ).toEqual([]);
    expect(
      coordinatesOf(
        tcx(
          `<Activities><Activity><Lap><Track>${trackpoint(45.1, 5.7)}<Trackpoint></Trackpoint></Track></Lap></Activity></Activities>`
        )
      )
    ).toEqual([]);
    expect(coordinatesOf('<gpx></gpx>')).toEqual([]);
    expect(() => new TCX().readFeatures('')).toThrow('Source is not defined');
  });
});
