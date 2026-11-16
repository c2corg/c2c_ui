// EPSG:3857 (Web Mercator, the projection of the API geometries) <-> EPSG:4326 (longitude, latitude, the one of
// MapLibre and of the other services), with the formulas of OpenLayers (same results to the last digit). The
// coordinates may carry an elevation and a time after x and y: they are kept.

const RADIUS = 6378137;
const HALF_SIZE = Math.PI * RADIUS;

/** [west, south, east, north] */
export type Extent = [number, number, number, number];

/** A position of a GeoJSON geometry, at any depth of nesting */
type Positions = number[] | Positions[];

export function fromLonLat([lon, lat, ...rest]: number[]): number[] {
  return [(HALF_SIZE * lon) / 180, RADIUS * Math.log(Math.tan((Math.PI * (lat + 90)) / 360)), ...rest];
}

export function toLonLat([x, y, ...rest]: number[]): number[] {
  return [(180 * x) / HALF_SIZE, (360 * Math.atan(Math.exp(y / RADIUS))) / Math.PI - 90, ...rest];
}

export const extentToLonLat = ([west, south, east, north]: number[]): Extent =>
  [...toLonLat([west, south]), ...toLonLat([east, north])] as Extent;

export const extentFromLonLat = ([west, south, east, north]: number[]): Extent =>
  [...fromLonLat([west, south]), ...fromLonLat([east, north])] as Extent;

/** The positions of a geometry (or of its coordinates array) transformed by `transform`, the nesting kept */
export function mapPositions<T extends Positions>(positions: T, transform: (position: number[]) => number[]): T {
  return (
    typeof positions[0] === 'number'
      ? transform(positions as number[])
      : (positions as Positions[]).map((child) => mapPositions(child, transform))
  ) as T;
}

type Geometry = { type: string; coordinates?: Positions; geometries?: Geometry[] };

function mapGeometry<T extends Geometry>(geometry: T, transform: (position: number[]) => number[]): T {
  if (geometry.geometries) {
    return { ...geometry, geometries: geometry.geometries.map((child) => mapGeometry(child, transform)) };
  }
  return { ...geometry, coordinates: mapPositions(geometry.coordinates!, transform) };
}

/** A GeoJSON geometry of the API (EPSG:3857) in longitude, latitude */
export const geometryToLonLat = <T extends Geometry>(geometry: T): T => mapGeometry(geometry, toLonLat);

/** A GeoJSON geometry in longitude, latitude, in the projection of the API (EPSG:3857) */
export const geometryFromLonLat = <T extends Geometry>(geometry: T): T => mapGeometry(geometry, fromLonLat);
