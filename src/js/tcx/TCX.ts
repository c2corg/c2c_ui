import Feature from 'ol/Feature';
import FeatureFormat, { type ReadOptions, type Type, transformGeometryWithOptions } from 'ol/format/Feature';
import LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import { get as getProjection } from 'ol/proj';
import type Projection from 'ol/proj/Projection';
import { parse } from 'ol/xml';

export class TCX extends FeatureFormat {
  constructor() {
    super();
    this.dataProjection = getProjection('EPSG:4326') as Projection;
  }

  override getType(): Type {
    return 'xml';
  }

  override readProjection(): Projection | undefined {
    return this.dataProjection;
  }

  getPoints(node: Element): number[][] | null {
    const coordinates: number[][] = [];
    const points = node.getElementsByTagName('Trackpoint');
    if (points.length < 2) {
      return null;
    }
    for (const point of points) {
      const latitude = point.getElementsByTagName('LatitudeDegrees')[0]?.textContent;
      const longitude = point.getElementsByTagName('LongitudeDegrees')[0]?.textContent;
      const altitude = point.getElementsByTagName('AltitudeMeters')[0]?.textContent;
      const time = point.getElementsByTagName('Time')[0]?.textContent;
      if (!latitude || !longitude) {
        return null;
      }

      const coordinate = [
        Number.parseFloat(longitude),
        Number.parseFloat(latitude),
        altitude ? Number.parseFloat(altitude) : 0,
      ];
      if (time) {
        coordinate[3] = Date.parse(time) / 1000;
      }
      coordinates.push(coordinate);
    }

    return coordinates;
  }

  readFeatureFromNode(node: Element, readOptions: ReadOptions | undefined): Feature | undefined {
    const tracks = node.getElementsByTagName('Track');
    const lines = Array.from(tracks)
      .map((track) => this.getPoints(track))
      .filter((line): line is number[][] => !!line);
    if (!lines.length) {
      return;
    }

    const geometry = lines.length === 1 ? new LineString(lines[0], 'XYZM') : new MultiLineString(lines, 'XYZM');

    return new Feature(transformGeometryWithOptions(geometry, false, readOptions));
  }

  override readFeatures(source: string, readOptions: ReadOptions = {}): Feature[] {
    if (!source) {
      throw new Error('Source is not defined');
    }

    const document = parse(source);
    let node: Element | undefined;
    for (let n = document.firstChild; n; n = n.nextSibling) {
      if (
        n.nodeType === Node.ELEMENT_NODE &&
        (n as Element).namespaceURI === 'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2' &&
        (n as Element).localName === 'TrainingCenterDatabase'
      ) {
        node = n as Element;
        break;
      }
    }
    if (!node) {
      return [];
    }

    const laps = node.getElementsByTagName('Lap');
    const courses = node.getElementsByTagName('Courses');

    const features: Feature[] = [];

    for (const node of [...laps, ...courses]) {
      const feature = this.readFeatureFromNode(node, this.getReadOptions(source, readOptions));
      if (feature) {
        features.push(feature);
      }
    }

    return features;
  }
}
