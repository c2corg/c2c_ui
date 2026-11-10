// What the Yeti map layers share: the map YetiMap provides, at any depth, and helpers to read the API data. A layer
// keeps its OpenLayers layer out of its reactive data (OpenLayers objects must not be proxied), and gives it to
// OverlaysLayers through its getLayer() method.

import type Feature from 'ol/Feature';
import type OlMap from 'ol/Map';
import { computed, inject } from 'vue';

import ol from '@/js/libs/ol';

// provided by YetiMap
type YetiMap = {
  readonly map: OlMap;
  getExtent: (projection?: string) => number[];
};

export function useLayer() {
  const yetiMap = inject<YetiMap>('yetiMap')!;

  const map = computed(() => yetiMap.map);

  return {
    map,
    view: computed(() => map.value.getView()),
    getExtent: (projection?: string) => yetiMap.getExtent(projection),
    getFeaturesFromData: (data: { data: unknown }) =>
      // read geoJSON, and project to 3857 (geoJSON is 4326 by default)
      new ol.format.GeoJSON().readFeatures(data.data, { featureProjection: 'EPSG:3857' }),
    getPropertiesFromFeatures: (features: Feature[]) => features.map((feature) => feature.getProperties()),
  };
}
