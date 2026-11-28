// The outings of the partner sites close to a route or a waypoint, for the "Last outings" box of their page
// (use-close-partner-outings.ts).
//
// "Close" is a distance on the ground: the API stores no link from a partner outing to a c2c document, only a point
// (where the outing started, its summit, or the c2c summit it was resolved to by name: `summit_match`, which is then
// the very point of the waypoint). So the box asks GET /partner-outings for the extent of the document widened by
// `CLOSE_RADIUS`, and keeps the outings whose point is within `CLOSE_RADIUS` of a point of the document: the waypoint;
// for a route its point, the points of its track and of its waypoints (summits, huts, accesses...).
import type { PartnerOuting, PartnerOutingsQuery } from '@/js/apis/partner-outings-service';
import { extentFromLonLat, toLonLat } from '@/js/geo/projection';
import { outingPosition } from '@/views/portals/metaskirando/partner-outings-map';

// metres on the ground
export const CLOSE_RADIUS = 2000;
// the last days listed; the API allows one query of 32 days at most
export const CLOSE_DAYS = 30;
// the rows of the box
export const CLOSE_MAX = 10;
// the rows asked to the API: c2c outings and outings in the corners of the extent are dropped after
const QUERY_LIMIT = 100;

// the centre of an area is no place: an outing located there is not "close" to anything
const FAR_QUALITIES = ['area_centroid', 'none'];

const EARTH_RADIUS = 6371008.8;
const METRES_PER_DEGREE = (Math.PI * EARTH_RADIUS) / 180;

type LonLat = [number, number];

type Coordinates = number | Coordinates[];

type DocumentLike = {
  type?: string;
  activities?: string[] | null;
  geometry?: { geom?: string | null; geom_detail?: string | null } | null;
  associations?: unknown;
};

// every position of GeoJSON coordinates, in EPSG:3857
function positionsOf(coordinates: Coordinates | undefined, into: number[][] = []): number[][] {
  if (!Array.isArray(coordinates)) {
    return into;
  }
  if (typeof coordinates[0] === 'number') {
    if (coordinates.length >= 2 && (coordinates as number[]).every(Number.isFinite)) {
      into.push(coordinates as number[]);
    }
    return into;
  }
  for (const child of coordinates) {
    positionsOf(child, into);
  }
  return into;
}

// the positions of a GeoJSON string of the API (EPSG:3857) in longitude, latitude; none when it does not parse
function lonLatsOf(geojson: string | null | undefined): LonLat[] {
  if (!geojson) {
    return [];
  }
  try {
    const geometry = JSON.parse(geojson) as { coordinates?: Coordinates };
    return positionsOf(geometry.coordinates)
      .map((position) => toLonLat(position).slice(0, 2) as LonLat)
      .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lat) < 85);
  } catch {
    return [];
  }
}

/**
 * The points an outing must be close to: the point of the document and the positions of its track, and for a route the
 * points of its waypoints. In longitude, latitude.
 */
export function referencePoints(document: DocumentLike): LonLat[] {
  const points = [...lonLatsOf(document.geometry?.geom), ...lonLatsOf(document.geometry?.geom_detail)];
  if (document.type === 'r') {
    const waypoints = (document.associations as { waypoints?: DocumentLike[] } | undefined)?.waypoints ?? [];
    for (const waypoint of waypoints) {
      points.push(...lonLatsOf(waypoint.geometry?.geom));
    }
  }
  return points;
}

/** The distance on the ground between two points, in metres (haversine) */
export function distance([lon1, lat1]: LonLat, [lon2, lat2]: LonLat): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** The extent of the points widened by `radius` metres, as the bbox parameter of the API (EPSG:3857, in metres) */
export function closeBbox(points: LonLat[], radius = CLOSE_RADIUS): number[] | null {
  if (!points.length) {
    return null;
  }
  const lons = points.map(([lon]) => lon);
  const lats = points.map(([, lat]) => lat);
  const [west, east, south, north] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const dLat = radius / METRES_PER_DEGREE;
  // a degree of longitude is shortest at the latitude furthest from the equator
  const widest = Math.max(Math.abs(south), Math.abs(north)) + dLat;
  const dLon = radius / (METRES_PER_DEGREE * Math.cos((Math.min(widest, 85) * Math.PI) / 180));
  const extent = extentFromLonLat([west - dLon, south - dLat, east + dLon, north + dLat]);
  return [Math.floor(extent[0]), Math.floor(extent[1]), Math.ceil(extent[2]), Math.ceil(extent[3])];
}

/** YYYY-MM-DD of a date, in UTC as the API counts the days */
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** The query of the outings close to the points: the last `CLOSE_DAYS` days, the activities of a route if given */
export function closeQuery(
  points: LonLat[],
  { activities, lang, now = new Date() }: { activities?: string[]; lang?: string; now?: Date } = {}
): PartnerOutingsQuery | null {
  const bbox = closeBbox(points);
  if (!bbox) {
    return null;
  }
  const start = new Date(now.getTime() - CLOSE_DAYS * 24 * 3600 * 1000);
  return {
    bbox,
    date: `${isoDay(start)},${isoDay(now)}`,
    act: activities?.length ? activities : undefined,
    pl: lang,
    limit: QUERY_LIMIT,
  };
}

export type CloseOuting = { outing: PartnerOuting; distance: number };

/**
 * The partner outings within `radius` metres of one of the points, with their distance to the nearest one, in the order
 * of the API (the newest first), `max` at most. The outings of c2c are left out (the page lists them already), and
 * those located only by the centre of their area.
 */
export function closeOutings(
  items: PartnerOuting[],
  points: LonLat[],
  { radius = CLOSE_RADIUS, max = CLOSE_MAX } = {}
): CloseOuting[] {
  const result: CloseOuting[] = [];
  for (const outing of items) {
    if (result.length >= max) {
      break;
    }
    if (outing.source === 'c2c' || !outing.geometry || FAR_QUALITIES.includes(outing.geometry.quality)) {
      continue;
    }
    const position = outingPosition(outing);
    if (!position) {
      continue;
    }
    const nearest = Math.min(...points.map((point) => distance(position, point)));
    if (nearest <= radius) {
      result.push({ outing, distance: nearest });
    }
  }
  return result;
}
