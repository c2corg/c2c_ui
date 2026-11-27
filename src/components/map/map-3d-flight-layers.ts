// paragliding tracks in the 3D view. The walk stays draped on the terrain (the documents line layer), the
// flights are drawn in the air with deck.gl (MapLibre has no 3D line), with thin vertical lines down to the terrain
// so that the height reads, and their shadow draped on the ground.
// deck.gl is only downloaded when a paragliding track is shown. All of it starts when the 3D view opens, in
// parallel with the map: the terrain tiles are read directly, not through the map.
import type { Feature, FeatureCollection, MultiLineString, Position } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';

import { type FlightSplit, splitFlights, type TrackPart } from './map-3d-flight';
import { sampleTerrain } from './map-3d-terrain';

// the casing of the lines, as on the 2D map (getDocumentLineStyle)
export const CASING_COLOR: [number, number, number] = [64, 64, 64];
// the flights in light cyan (#33ccff): apart from the yellow walk, also for the red-green colour blind (a red or an
// orange looks like a dark olive or a mustard to them, lost in the forests or close to the yellow)
export const FLIGHT_COLOR: [number, number, number] = [51, 204, 255];
// the point under the profile cursor, on the ground under a flight
const CURSOR_GROUND_COLOR: [number, number, number] = [70, 70, 70];

type Flights = {
  // the documents with the paragliding tracks reduced to their walk
  documents: FeatureCollection;
  // the flights, on the ground (their shadow)
  shadows: FeatureCollection;
  // the flights in the air, [lon, lat, elevation as drawn]
  paths: Position[][];
  // vertical lines from the terrain to the flight, every ~150 m
  drops: [Position, Position][];
  // the flight vertices in the air, by their place (cursorKey): where the profile cursor is in the air
  air: Map<string, Position>;
  exaggeration: number;
  // the flights found, by track: for the flyover (map-3d-flyover.ts), which follows them in the air
  splits: FlightSplit[];
};

/** The paths played: the body, the same array until it moves, and the tip, up to the playhead */
export type PlayedPaths = { body: Position[][]; tip: Position[][] };

/** What the flight layers show and do */
export type FlightLayers = {
  remove: () => void;
  // the profile cursor at [lon, lat]: drawn in the air when it is on a flight (true), else nothing (false)
  cursor: (lonLat: [number, number] | null) => Promise<boolean>;
  // the flyover: the flights of the first track, and their altitude as drawn per vertex
  air: () => { flights: [number, number][]; alt: Float64Array } | null;
  // the flyover: the flights faint, those played so far ([lon, lat, altitude as drawn]) in full, and the playhead in
  // the air with its line down to the terrain; null: back to the flights as they were. The played paths in two parts
  // (playedSplit): deck.gl computes again the paths of a part only when its array changes, the body seldom
  progress: (played: PlayedPaths | null, head: Position | null, ground?: number, ahead?: boolean) => void;
};

// the place of a vertex, to about a metre: the profile and the 3D view read the same track
const cursorKey = (lon: number, lat: number) => `${lon.toFixed(5)},${lat.toFixed(5)}`;

const isTrack = (feature: Feature) =>
  !!feature.properties?.paragliding &&
  (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString');

/** Whether the documents have a paragliding track: then the 3D view looks for its flights */
export const hasParaglidingTrack = (documents: FeatureCollection): boolean => documents.features.some(isTrack);

/** The documents without their paragliding tracks: what the 3D view shows while it looks for the flights */
export const withoutParaglidingTracks = (documents: FeatureCollection): FeatureCollection => ({
  ...documents,
  features: documents.features.filter((feature) => !isTrack(feature)),
});

// deck.gl, downloaded once, as soon as a paragliding track is to be shown (in parallel with the terrain reads)
let deckModules: Promise<[typeof import('@deck.gl/mapbox'), typeof import('@deck.gl/layers')]> | undefined;
export const loadFlightLayers = () =>
  (deckModules ??= Promise.all([import('@deck.gl/mapbox'), import('@deck.gl/layers')]));

const partsOf = (feature: Feature): TrackPart[] =>
  feature.geometry.type === 'LineString'
    ? [feature.geometry.coordinates]
    : feature.geometry.type === 'MultiLineString'
      ? feature.geometry.coordinates
      : [];

// the lines of the vertices a..b of each run, never across two parts of the track
function lines(split: FlightSplit, ranges: [number, number][]): Position[][] {
  const out: Position[][] = [];
  for (const [a, b] of ranges) {
    let line: Position[] = [];
    for (let i = a; i <= b; i++) {
      if (i > a && split.part[i] !== split.part[i - 1]) {
        if (line.length > 1) out.push(line);
        line = [];
      }
      line.push(split.vertices[i].slice(0, 2));
    }
    if (line.length > 1) out.push(line);
  }
  return out;
}

const groundRanges = (split: FlightSplit): [number, number][] => {
  const ranges: [number, number][] = [];
  let start = 0;
  for (const [a, b] of split.flights) {
    if (a > start) ranges.push([start, a]);
    start = b;
  }
  if (start < split.vertices.length - 1) ranges.push([start, split.vertices.length - 1]);
  return ranges;
};

const multiLine = (coordinates: Position[][]): Feature<MultiLineString> => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'MultiLineString', coordinates },
});

/** The flights of the paragliding tracks of the documents, null when there is none */
export async function findFlights(documents: FeatureCollection, exaggeration: number): Promise<Flights | null> {
  const tracks = documents.features.filter(isTrack);
  if (!tracks.length) return null;
  const splits = new Map<Feature, FlightSplit | null>(
    await Promise.all(tracks.map(async (track) => [track, await splitFlights(partsOf(track), sampleTerrain)] as const))
  );
  if (![...splits.values()].some((split) => split?.flights.length)) return null;

  const flights: Flights = {
    documents: { type: 'FeatureCollection', features: [] },
    shadows: { type: 'FeatureCollection', features: [] },
    paths: [],
    drops: [],
    air: new Map(),
    exaggeration,
    splits: [],
  };
  for (const feature of documents.features) {
    const split = splits.get(feature);
    if (!split?.flights.length) {
      flights.documents.features.push(feature);
      continue;
    }
    flights.splits.push(split);
    flights.documents.features.push(multiLine(lines(split, groundRanges(split))));
    flights.shadows.features.push(multiLine(lines(split, split.flights)));
    // in the air: the GPS altitude minus the offset of the track to the terrain, so that the flight leaves and meets
    // the terrain where it does; exaggerated as the terrain is
    const air = (i: number): Position => [
      split.vertices[i][0],
      split.vertices[i][1],
      (split.vertices[i][2] - split.offset[i]) * exaggeration,
    ];
    for (const [a, b] of split.flights) {
      const path: Position[] = [];
      for (let i = a; i <= b; i++) {
        path.push(air(i));
        flights.air.set(cursorKey(split.vertices[i][0], split.vertices[i][1]), air(i));
      }
      flights.paths.push(path);
    }
    const tops: Position[] = [];
    for (const [a, b] of split.flights) {
      let walked = Infinity;
      for (let i = a; i < b; i++) {
        const [lon, lat] = split.vertices[i];
        const [lon2, lat2] = split.vertices[i + 1];
        walked += Math.hypot((lon2 - lon) * Math.cos((lat * Math.PI) / 180), lat2 - lat) * 111_195;
        if (walked >= 150) {
          tops.push(air(i));
          walked = 0;
        }
      }
    }
    const grounds = await sampleTerrain(tops.map(([lon, lat]) => [lon, lat]));
    tops.forEach((top, k) => {
      if (Number.isFinite(grounds[k])) flights.drops.push([[top[0], top[1], grounds[k] * exaggeration], top]);
    });
  }
  return flights;
}

// deck.gl 9.4 reads map.transform (the camera of mapbox-gl and of MapLibre up to 5), which MapLibre 6 moved to its
// camera: it is given back from there. False when neither has it (another MapLibre): no flight in the air then.
export function exposeTransform(map: MapLibreMap): boolean {
  if ('transform' in map) return true;
  const camera = (map as unknown as { _camera?: object })._camera;
  if (!camera || !('transform' in camera)) return false;
  Object.defineProperty(map, 'transform', {
    get: () => (camera as { transform: unknown }).transform,
    configurable: true,
  });
  return true;
}

/** Draws the flights in the air on the map; null when deck.gl cannot draw on this map */
export async function addFlightLayers(map: MapLibreMap, flights: Flights): Promise<FlightLayers | null> {
  const [{ MapboxOverlay }, { LineLayer, PathLayer, ScatterplotLayer }] = await loadFlightLayers();
  if (!exposeTransform(map)) return null;
  const layers = [
    new LineLayer<[Position, Position]>({
      id: 'flight-drops',
      data: flights.drops,
      getSourcePosition: (drop) => drop[0] as [number, number, number],
      getTargetPosition: (drop) => drop[1] as [number, number, number],
      getColor: [...FLIGHT_COLOR, 120],
      getWidth: 1,
    }),
    // as the lines on the ground: the flight on a wider grey casing
    // 1 px thinner than the walk (4 on 7): the flight faces the camera at full width, while the walk draped on the
    // terrain is foreshortened and blurred, so equal widths made the flight look the wider one
    new PathLayer<Position[]>({
      id: 'flight-casing',
      data: flights.paths,
      getPath: (path) => path as [number, number, number][],
      getColor: CASING_COLOR,
      getWidth: 5,
      widthUnits: 'pixels',
      capRounded: true,
      jointRounded: true,
      billboard: true,
      // at the depth of the flight: without this, the flight drawn next would lose to it in places
      parameters: { depthWriteEnabled: false },
    }),
    new PathLayer<Position[]>({
      id: 'flight-paths',
      data: flights.paths,
      getPath: (path) => path as [number, number, number][],
      getColor: FLIGHT_COLOR,
      getWidth: 3,
      widthUnits: 'pixels',
      capRounded: true,
      jointRounded: true,
      billboard: true,
    }),
  ];
  const overlay = new MapboxOverlay({ interleaved: true, layers });
  map.addControl(overlay);

  // the last cursor asked: the terrain read of an older one is dropped
  let request = 0;
  const cursor = async (lonLat: [number, number] | null) => {
    const asked = ++request;
    const top = lonLat && flights.air.get(cursorKey(...lonLat));
    if (!top) {
      overlay.setProps({ layers });
      return false;
    }
    const [ground] = await sampleTerrain([[top[0], top[1]]]);
    if (asked !== request) return true;
    const bottom: Position = [top[0], top[1], (Number.isFinite(ground) ? ground : 0) * flights.exaggeration];
    overlay.setProps({
      layers: [
        ...layers,
        new LineLayer<[Position, Position]>({
          id: 'flight-cursor-drop',
          data: [[bottom, top]],
          getSourcePosition: (drop) => drop[0] as [number, number, number],
          getTargetPosition: (drop) => drop[1] as [number, number, number],
          getColor: [0, 0, 0, 220],
          getWidth: 1,
        }),
        new ScatterplotLayer<{ position: Position; color: [number, number, number] }>({
          id: 'flight-cursor',
          data: [
            { position: bottom, color: CURSOR_GROUND_COLOR },
            { position: top, color: FLIGHT_COLOR },
          ],
          getPosition: (point) => point.position as [number, number, number],
          getFillColor: (point) => point.color,
          getLineColor: [128, 128, 128],
          radiusUnits: 'pixels',
          getRadius: 5,
          stroked: true,
          lineWidthUnits: 'pixels',
          getLineWidth: 1,
          billboard: true,
          // always drawn: the ground point would sink into the terrain
          parameters: { depthCompare: 'always' },
        }),
      ],
    });
    return true;
  };

  const air = () => {
    const split = flights.splits[0];
    if (!split) return null;
    const alt = Float64Array.from(split.vertices, (v, i) => (v[2] - split.offset[i]) * flights.exaggeration);
    return { flights: split.flights, alt };
  };

  // the flyover: drawn again at each frame, the layers keep their ids (deck.gl only updates the data that changed)
  const faint = layers.map((layer) =>
    layer.clone({ opacity: 0.35, ...(layer.id === 'flight-drops' ? { visible: false } : {}) })
  );
  const progress = (played: PlayedPaths | null, head: Position | null, ground = 0, ahead = true) => {
    if (!played) {
      overlay.setProps({ layers });
      return;
    }
    const playedPaths = (id: string, data: Position[][], color: [number, number, number], width: number) =>
      new PathLayer<Position[]>({
        id,
        data,
        getPath: (path) => path as [number, number, number][],
        getColor: color,
        getWidth: width,
        widthUnits: 'pixels',
        capRounded: true,
        jointRounded: true,
        billboard: true,
        parameters: { depthWriteEnabled: false },
      });
    const bottom: Position | null = head && [head[0], head[1], ground];
    overlay.setProps({
      layers: [
        // the flights not played yet, faint, or not at all
        ...(ahead ? faint : []),
        // the casings under both parts: no seam where they meet
        playedPaths('flyover-flight-casing', played.body, CASING_COLOR, 5),
        playedPaths('flyover-flight-casing-tip', played.tip, CASING_COLOR, 5),
        playedPaths('flyover-flight-paths', played.body, FLIGHT_COLOR, 3),
        playedPaths('flyover-flight-paths-tip', played.tip, FLIGHT_COLOR, 3),
        new LineLayer<[Position, Position]>({
          id: 'flyover-flight-drop',
          data: head && bottom ? [[bottom, head]] : [],
          getSourcePosition: (drop) => drop[0] as [number, number, number],
          getTargetPosition: (drop) => drop[1] as [number, number, number],
          getColor: [0, 0, 0, 200],
          getWidth: 1,
        }),
        new ScatterplotLayer<Position>({
          id: 'flyover-flight-head',
          data: head ? [head] : [],
          getPosition: (position) => position as [number, number, number],
          getFillColor: FLIGHT_COLOR,
          getLineColor: [255, 255, 255],
          radiusUnits: 'pixels',
          getRadius: 7,
          stroked: true,
          lineWidthUnits: 'pixels',
          getLineWidth: 2,
          billboard: true,
          parameters: { depthCompare: 'always' },
        }),
      ],
    });
  };

  return { remove: () => map.removeControl(overlay), cursor, air, progress };
}
