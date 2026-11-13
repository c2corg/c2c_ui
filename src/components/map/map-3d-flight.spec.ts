import { describe, expect, it } from 'vitest';

import tracks from './fixtures/paragliding-tracks.json';
import { prepareTrack, splitFlights, splitFlightsWithGround, type TrackPart } from './map-3d-flight';

type Fixture = {
  parts: TrackPart[];
  ground: number[];
  dd: number[];
  groundDense: number[];
  total: number;
  hasTime: boolean;
  flights: [number, number][];
  flightsNoTime: [number, number][];
};

// three real public tracks of camptocamp.org, with the terrain under them (z12) and the flights found by the research
// script: 1237417 two flights with recording gaps, 1955604 a hike & fly, 1708263 without time
const fixtures = tracks as unknown as Record<string, Fixture>;

// the terrain samples of the fixture, at the distances of this module (the script measured them a bit differently)
function groundDense(fixture: Fixture): Float64Array {
  const track = prepareTrack(fixture.parts);
  const scale = fixture.total / track.dist[track.dist.length - 1];
  return Float64Array.from(track.dense, (d) => {
    const x = d * scale;
    const i = Math.min(Math.floor(x / 20), fixture.dd.length - 2);
    const f = Math.min(Math.max((x - fixture.dd[i]) / 20, 0), 1);
    return fixture.groundDense[i] + f * (fixture.groundDense[i + 1] - fixture.groundDense[i]);
  });
}

// launch and touchdown within a few vertices of the script
const close = (actual: [number, number][], expected: [number, number][]) => {
  expect(actual.length).toBe(expected.length);
  actual.forEach(([a, b], k) => {
    expect(Math.abs(a - expected[k][0])).toBeLessThanOrEqual(3);
    expect(Math.abs(b - expected[k][1])).toBeLessThanOrEqual(3);
  });
};

describe('splitFlightsWithGround', () => {
  for (const [id, fixture] of Object.entries(fixtures)) {
    it(`finds the flights of ${id}`, () => {
      close(
        splitFlightsWithGround(fixture.parts, Float64Array.from(fixture.ground), groundDense(fixture)),
        fixture.flights
      );
    });
  }

  it('finds the flights of 1237417 without its time', () => {
    const fixture = fixtures['1237417'];
    const flights = splitFlightsWithGround(
      fixture.parts,
      Float64Array.from(fixture.ground),
      groundDense(fixture),
      false
    );
    expect(flights.length).toBe(fixture.flightsNoTime.length);
  });
});

describe('splitFlights', () => {
  it('keeps finite altitudes where the terrain has no tile on a ground part', async () => {
    const fixture = fixtures['1955604'];
    const ground = Float64Array.from(fixture.ground);
    // the start of the walk without terrain: a whole chunk of ground vertices without sample
    ground.fill(NaN, 0, 70);
    const dense = groundDense(fixture);
    const split = await splitFlights(fixture.parts, (points) =>
      Promise.resolve(points.length === ground.length ? ground : dense)
    );
    expect(split!.flights.length).toBeGreaterThan(0);
    expect(split!.offset.every(Number.isFinite)).toBe(true);
  });
});

describe('prepareTrack', () => {
  it('takes the short way across the 180° meridian', () => {
    const track = prepareTrack([
      [
        [179.9999, 0, 0, 0],
        [-179.9999, 0, 0, 0],
      ],
    ]);
    // about 22 m, not around the world
    expect(track.dist[1]).toBeLessThan(30);
    expect(track.densePoints.length).toBeLessThan(3);
    for (const [lon] of track.densePoints) expect(Math.abs(lon)).toBeLessThanOrEqual(180);
  });
});
