import Feature from 'ol/Feature';
import FeatureFormat, { transformGeometryWithOptions } from 'ol/format/Feature';
import GeometryLayout from 'ol/geom/GeometryLayout';
import LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import { get as getProjection } from 'ol/proj';
import { parse } from 'ol/xml';

export class TCX extends FeatureFormat {
  constructor() {
    super();
    this.dataProjection = getProjection('EPSG:4326');
  }

  getType() {
    return 'xml';
  }

  readProjection() {
    return this.dataProjection;
  }

  getPoints(node) {
    const coordinates = [];
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

  readFeatureFromNode(node, readOptions) {
    const tracks = node.getElementsByTagName('Track');
    const lines = Array.from(tracks)
      .map((track) => this.getPoints(track))
      .filter((line) => !!line);
    if (!lines.length) {
      return;
    }

    const geometry =
      lines.length === 1
        ? new LineString(lines[0], GeometryLayout.XYZM)
        : new MultiLineString(lines, GeometryLayout.XYZM);

    return new Feature(transformGeometryWithOptions(geometry, false, readOptions));
  }

  readFeatures(source, readOptions = {}) {
    if (!source) {
      throw new Error('Source is not defined');
    }

    const document = parse(source);
    let node;
    for (let n = document.firstChild; n; n = n.nextSibling) {
      if (
        n.nodeType === Node.ELEMENT_NODE &&
        n.namespaceURI === 'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2' &&
        n.localName === 'TrainingCenterDatabase'
      ) {
        node = n;
        break;
      }
    }
    if (!node) {
      return [];
    }

    const laps = node.getElementsByTagName('Lap');
    const courses = node.getElementsByTagName('Courses');

    const features = [];

    for (const node of [...laps, ...courses]) {
      const feature = this.readFeatureFromNode(node, this.getReadOptions(source, readOptions));
      if (feature) {
        features.push(feature);
      }
    }

    return features;
  }
}
