// Splits a line of the route in two where it is clicked with Ctrl: dispatches a 'split' event with the old feature
// and the two new ones.
import type Feature from 'ol/Feature';
import type { Coordinate } from 'ol/coordinate';
import BaseEvent from 'ol/events/Event';
import type LineString from 'ol/geom/LineString';
import type Layer from 'ol/layer/Layer';

import ol from '@/js/libs/ol';

export class SplitEvent extends BaseEvent {
  constructor(
    public oldFeature: Feature<LineString>,
    public newFeatures: Feature<LineString>[]
  ) {
    super('split');
  }
}

// whether p is on the segment [a, b]
export function pointOnSegment(p: Coordinate, a: Coordinate, b: Coordinate, tol = 1e-3) {
  const cross = (p[1] - a[1]) * (b[0] - a[0]) - (p[0] - a[0]) * (b[1] - a[1]);
  if (Math.abs(cross) > tol) return false;
  const dot = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
  if (dot < 0) return false;
  const sqLen = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  if (dot > sqLen) return false;
  return true;
}

export default class SplitInteraction extends ol.interaction.Pointer {
  private layer_: Layer;
  private coordinate_: Coordinate | null = null;
  private feature_: Feature<LineString> | null = null;

  constructor(options: { layer: Layer }) {
    super({
      handleDownEvent: (evt) => {
        if ((evt.originalEvent as MouseEvent).ctrlKey) {
          const feature = evt.map.forEachFeatureAtPixel(evt.pixel, (feature) => feature as Feature<LineString>, {
            layerFilter: (layer) => layer === this.layer_,
          });

          if (feature) {
            this.feature_ = feature;
            const coordinate = feature.getGeometry()!.getClosestPoint(evt.coordinate);
            this.coordinate_ = coordinate;

            // the split point is surely not on vertex, so find on which segment it is
            const coordinates = feature.getGeometry()!.getCoordinates();
            let insertIndex: number | undefined = undefined;
            for (let i = 0; i < coordinates.length - 1; i++) {
              const [x1, y1] = coordinates[i];
              const [x2, y2] = coordinates[i + 1];
              if (pointOnSegment(coordinate, [x1, y1], [x2, y2])) {
                insertIndex = i + 1;
                break;
              }
            }

            // then insert a new point on the segment before split
            // if insertindex is set (point on line)
            // and coord is not already a vertex
            // and coord is not the first point
            if (
              insertIndex !== undefined &&
              coordinates[insertIndex][0] !== coordinate[0] &&
              coordinates[insertIndex][1] !== coordinate[1] &&
              coordinates[0][0] !== coordinate[0] &&
              coordinates[0][1] !== coordinate[1]
            ) {
              coordinates.splice(insertIndex, 0, coordinate);
            }

            // now, split feature and create an array for two splitted feature
            const sublines: Coordinate[][] = [[], []];
            let i = 0;
            let splitDone = false;
            coordinates.forEach((coord) => {
              sublines[i].push(coord);
              // if point is less than one meter away = this is the split point
              if (!splitDone && Math.abs(coord[0] - coordinate[0]) < 1 && Math.abs(coord[1] - coordinate[1]) < 1) {
                i = 1;
                sublines[i].push(coord);
                splitDone = true;
              }
            });
            this.dispatchEvent(
              new SplitEvent(
                feature,
                sublines.map((line) => new ol.Feature(new ol.geom.LineString(line)))
              )
            );
          }

          return false;
        }
        return false;
      },
    });

    this.layer_ = options.layer;
  }
}
