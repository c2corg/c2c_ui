// GPX and KML documents of geometries of the API (GeoJSON in EPSG:3857), written as OpenLayers wrote them, so that the
// files downloaded do not change: a line is a GPX route, lines a GPX track, a point a GPX waypoint.
import { mapPositions, toLonLat } from './projection';

type Positions = number[] | Positions[];
export type ExportedFeature = { name?: string; geometry: { type: string; coordinates: Positions } };
// the number of decimals of the coordinates, all of them by default
type WriteOptions = { decimals?: number };

const GPX_OPEN =
  '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
  ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"' +
  ' version="1.1" creator="camptocamp.org"';
const KML_OPEN =
  '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2"' +
  ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
  ' xsi:schemaLocation="http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd"';

// in CDATA when it has to be, as OpenLayers did; else a text with its > escaped
const text = (value: string) =>
  /^\s|\s$|\n|\t|\r|<|&| {2}/.test(value)
    ? `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`
    : value.replaceAll('>', '&gt;');
const name = (feature: ExportedFeature) => (feature.name ? `<name>${text(feature.name)}</name>` : '');
const element = (tag: string, attributes: string, content: string) =>
  content ? `<${tag}${attributes}>${content}</${tag}>` : `<${tag}${attributes}/>`;

// longitude, latitude, then the elevation and the time if any
function lonLat<T extends Positions>(coordinates: T, { decimals }: WriteOptions): T {
  const power = 10 ** (decimals ?? 0);
  return mapPositions(coordinates, (position) => {
    const transformed = toLonLat(position);
    return decimals === undefined ? transformed : transformed.map((value) => Math.round(value * power) / power);
  });
}

// seconds since 1970, as 2020-09-13T12:26:40Z
const dateTime = (time: number) => new Date(time * 1000).toISOString().replace(/\.\d+Z$/, 'Z');

function gpxPoint(tag: string, [lon, lat, ele, time]: number[], content = '') {
  const children =
    (ele !== undefined && ele !== 0 ? `<ele>${ele}</ele>` : '') +
    (time !== undefined && time !== 0 ? `<time>${dateTime(time)}</time>` : '');
  return element(tag, ` lat="${lat}" lon="${lon}"`, children + content);
}

export function writeGpx(features: ExportedFeature[], options: WriteOptions = {}): string {
  const content = features
    .map((feature) => {
      const { type, coordinates } = feature.geometry;
      if (type === 'Point') {
        return gpxPoint('wpt', lonLat(coordinates as number[], options), name(feature));
      }
      if (type === 'LineString') {
        return `<rte>${name(feature)}${lonLat(coordinates as number[][], options)
          .map((point) => gpxPoint('rtept', point))
          .join('')}</rte>`;
      }
      if (type === 'MultiLineString') {
        const segments = lonLat(coordinates as number[][][], options).map(
          (line) => `<trkseg>${line.map((point) => gpxPoint('trkpt', point)).join('')}</trkseg>`
        );
        return `<trk>${name(feature)}${segments.join('')}</trk>`;
      }
      // GPX has no polygons
      return '';
    })
    .join('');
  return element('gpx', GPX_OPEN.slice(4), content);
}

// x,y and the elevation, not the time
const kmlCoordinates = (points: number[][]) =>
  `<coordinates>${points.map((point) => point.slice(0, 3).join(',')).join(' ')}</coordinates>`;
const kmlLine = (points: number[][]) => `<LineString>${kmlCoordinates(points)}</LineString>`;
const kmlPolygon = ([outer, ...inners]: number[][][]) =>
  `<Polygon><outerBoundaryIs><LinearRing>${kmlCoordinates(outer)}</LinearRing></outerBoundaryIs>` +
  inners
    .map((inner) => `<innerBoundaryIs><LinearRing>${kmlCoordinates(inner)}</LinearRing></innerBoundaryIs>`)
    .join('') +
  '</Polygon>';

function kmlGeometry({ type, coordinates }: ExportedFeature['geometry']): string {
  switch (type) {
    case 'Point':
      return `<Point>${kmlCoordinates([coordinates as number[]])}</Point>`;
    case 'LineString':
      return kmlLine(coordinates as number[][]);
    case 'Polygon':
      return kmlPolygon(coordinates as number[][][]);
    case 'MultiLineString':
      return `<MultiGeometry>${(coordinates as number[][][]).map(kmlLine).join('')}</MultiGeometry>`;
    case 'MultiPolygon':
      return `<MultiGeometry>${(coordinates as number[][][][]).map(kmlPolygon).join('')}</MultiGeometry>`;
    default:
      return '';
  }
}

export function writeKml(features: ExportedFeature[], options: WriteOptions = {}): string {
  const placemarks = features.map(
    (feature) =>
      `<Placemark>${name(feature)}${kmlGeometry({ ...feature.geometry, coordinates: lonLat(feature.geometry.coordinates, options) })}</Placemark>`
  );
  const content = placemarks.length > 1 ? `<Document>${placemarks.join('')}</Document>` : placemarks.join('');
  return element('kml', KML_OPEN.slice(4), content);
}
