<script setup lang="ts">
import type BaseLayer from 'ol/layer/Base';
import type TileLayer from 'ol/layer/Tile';
import type XYZ from 'ol/source/XYZ';
import { computed, onMounted, watch } from 'vue';

import { cartoLayers } from '@/components/map/map-layers';
import Yetix from '@/components/yeti/yetix';
import type { SelectorLayer } from '@/components/yeti/yetix-types';
import ol from '@/js/libs/ol';
import { getPreferences } from '@/js/vue-plugins/local-storage';

// renderless: it only adds OpenLayers layers to the map
defineOptions({ render: () => null });
// stored under the component name, as before: existing preferences are kept
const preferences = getPreferences('Yeti');

const emit = defineEmits(['layers']);

const baseLayersSelector = computed(() => Yetix.baseLayersSelector as SelectorLayer[]);

const zoomDelta = Yetix.ZOOM_DELTA as number;

// the map layers but the UK ones, without animation on load
const cartoBaseLayers = (cartoLayers() as TileLayer<XYZ>[])
  .filter((layer) => layer.get('country') !== 'gb')
  .map((layer) => {
    (layer.getSource() as unknown as { tileOptions: { transition: number } }).tileOptions.transition = 0;
    return layer;
  });

// On classic IGN layer, scan25 shows starting z=15
// Here, we contruct two differents IGN layers:
// - the classic layer (from z=0 to z=13.5)
// - scan25 from z=13.5
// We put them on a group, and make the switch visually

// the zoom when the switch occurs
const ZOOM_SWITCH = 13.5;

const baseLayers: BaseLayer[] = cartoBaseLayers.map((layer) => {
  // find IGN layer
  if (layer.get('title') === 'IGN maps') {
    // get info of classic layer
    let title = layer.get('title');
    let image = layer.get('image');
    let country = layer.get('country');
    let type = layer.get('type');

    // build new layer
    const IGN_BASE_URL = 'https://data.geopf.fr/private/wmts?apikey=ign_scan_ws';
    const IGN_LAYER_SCAN25TOUR = 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR';

    const resolutions: number[] = [];
    const matrixIds: string[] = [];
    let proj3857 = ol.proj.get('EPSG:3857');
    const maxResolution = ol.extent.getWidth(proj3857!.getExtent()) / 256;

    for (let i = 0; i < 18; i++) {
      matrixIds[i] = i.toString();
      resolutions[i] = maxResolution / Math.pow(2, i);
    }

    let tileGrid = new ol.tilegrid.WMTS({
      origin: [-20037508, 20037508],
      resolutions,
      matrixIds,
    });

    let source = new ol.source.WMTS({
      url: IGN_BASE_URL,
      layer: IGN_LAYER_SCAN25TOUR,
      matrixSet: 'PM',
      format: `image/jpeg`,
      projection: 'EPSG:3857',
      tileGrid,
      style: 'normal',
      attributions: ['© <a href="//www.geoportail.fr/" target="_blank" rel="noreferrer noopener">Geoportail</a>'],
    });

    let layerScan = new ol.layer.Tile({
      source,
    });

    // set zoom visibility between layers
    layer.setVisible(true);
    layer.setMaxZoom((ZOOM_SWITCH + 0.1) / zoomDelta);

    layerScan.setVisible(true);
    layerScan.setMinZoom((ZOOM_SWITCH - 0.1) / zoomDelta);
    // allow greater zooms but limit tiles to 16
    (layerScan.getSource() as unknown as { tileGrid: { maxZoom: number } }).tileGrid.maxZoom = 16;

    // return group with the 2 two layers
    const group = new ol.layer.Group({
      layers: [layerScan, layer],
      visible: false,
      opacity: 1,
    });
    group.setProperties({ title, image, country, type });
    return group;
  } else {
    // return layer
    return layer;
  }
});

// create layers selector
// first, get stored map layer
const storedLayerName = preferences.get(
  'yeti-map-layers-base',
  baseLayers.find((layer) => layer.get('visible'))!.get('title')
);
const selector = baseLayers.map((layer) => {
  return {
    title: layer.get('title'),
    checked: storedLayerName === layer.get('title'),
    opacity: layer.getOpacity(),
    image: layer.get('image'),
    country: layer.get('country'),
  };
});

watch(
  baseLayersSelector,
  (layers) => {
    baseLayers.forEach((layer, i) => layer.setVisible(layers[i].checked));
  },
  { deep: true }
);

// after the watcher: it shows the stored layer (as the watcher declared before created() did)
Yetix.setBaseLayersSelector(selector);

onMounted(() => {
  // emit new layers
  emit('layers', baseLayers);
});
</script>
