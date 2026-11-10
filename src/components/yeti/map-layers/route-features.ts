// The line chunks of the yeti route
import type Feature from 'ol/Feature';
import type LineString from 'ol/geom/LineString';
import { getUid } from 'ol/util';

// in their order of creation: the order of the line chunks
export function getSortedFeatures(features: Feature<LineString>[]) {
  // a comparator must return a number (it returned a boolean, which did not sort)
  return features.sort((a, b) => Number(getUid(a)) - Number(getUid(b)));
}
