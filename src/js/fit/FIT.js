import { extractGeometry } from '@c2corg/fit-parser-extract-geometry';
import Feature from 'ol/Feature';
import FeatureFormat, { transformGeometryWithOptions } from 'ol/format/Feature';
import LineString from 'ol/geom/LineString';
import { get as getProjection } from 'ol/proj';

export class FIT extends FeatureFormat {
  constructor() {
    super();
    this.dataProjection = getProjection('EPSG:4326');
  }

  getType() {
    return 'arraybuffer';
  }

  readProjection() {
    return this.dataProjection;
  }

  readFeatures(source, readOptions = {}) {
    if (!source) {
      throw new Error('Source is not defined');
    }

    const blob = new Uint8Array(source);

    const geometry = new LineString(extractGeometry(blob), 'XYZM');
    return [new Feature(transformGeometryWithOptions(geometry, false, this.getReadOptions(source, readOptions)))];
  }
}
