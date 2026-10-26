import { extractGeometry } from '@c2corg/fit-parser-extract-geometry';
import Feature from 'ol/Feature';
import FeatureFormat, { type ReadOptions, type Type, transformGeometryWithOptions } from 'ol/format/Feature';
import LineString from 'ol/geom/LineString';
import { get as getProjection } from 'ol/proj';
import type Projection from 'ol/proj/Projection';

export class FIT extends FeatureFormat {
  constructor() {
    super();
    this.dataProjection = getProjection('EPSG:4326') as Projection;
  }

  override getType(): Type {
    return 'arraybuffer';
  }

  override readProjection(): Projection | undefined {
    return this.dataProjection;
  }

  override readFeatures(source: ArrayBuffer, readOptions: ReadOptions = {}): Feature[] {
    if (!source) {
      throw new Error('Source is not defined');
    }

    const blob = new Uint8Array(source);

    const geometry = new LineString(extractGeometry(blob), 'XYZM');
    return [new Feature(transformGeometryWithOptions(geometry, false, this.getReadOptions(source, readOptions)))];
  }
}
