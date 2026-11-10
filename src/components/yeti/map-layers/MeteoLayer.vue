<script setup lang="ts">
import type Feature from 'ol/Feature';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import type Point from 'ol/geom/Point';
import type TileLayer from 'ol/layer/Tile';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import { onMounted, ref, watch } from 'vue';

import { useLayer } from './layer';

import yetixEvents from '@/components/yeti/yetix-events';
import ol from '@/js/libs/ol';

// renderless: it only adds OpenLayers layers to the map
defineOptions({ render: () => null });
/* create a faketile source, that draws transparent images, so that click are working only on layer */
class FakeTile extends ol.source.ImageTile {
  constructor() {
    super();

    const setReady = () => {
      this.setLoader((z: number) => {
        const [width, height] = this.getTileSize(z) as number[];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d')!;

        context.fillStyle = 'rgba(0, 0, 0, 0.01)';
        context.fillRect(0, 0, width, height);

        return Promise.resolve(context.canvas);
      });
      this.setState('ready');
    };

    setReady();
  }
}

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
});

const { map } = useLayer();

const lon = ref(0);
const lat = ref(0);
let layer: TileLayer;
let markerLayer: VectorLayer<VectorSource<Feature<Point>>>;

function getLayer() {
  return layer;
}

function updateVisibility() {
  layer.setVisible(props.visible);
  markerLayer.setVisible(props.visible);
}

function onMapClick(evt: MapBrowserEvent<PointerEvent>) {
  let lonLat = ol.proj.toLonLat(evt.coordinate);
  lon.value = Number(lonLat[0].toFixed(5));
  lat.value = Number(lonLat[1].toFixed(5));

  let marker = new ol.Feature(new ol.geom.Point(evt.coordinate));
  markerLayer.getSource()!.clear();
  markerLayer.getSource()!.addFeature(marker);

  yetixEvents.emit('lon-lat', { lon: lon.value, lat: lat.value });
}

watch(
  () => props.visible,
  () => {
    updateVisibility();
  }
);

onMounted(() => {
  layer = new ol.layer.Tile({
    source: new FakeTile(),
  });
  layer.set('name', 'meteoLayer');
  map.value.addLayer(layer);

  markerLayer = new ol.layer.Vector({
    source: new ol.source.Vector<Feature<Point>>(),
    style: [
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({
            color: 'orangered',
          }),
          stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 0.75)',
          }),
        }),
      }),
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 2,
          fill: new ol.style.Fill({
            color: 'white',
          }),
          stroke: new ol.style.Stroke({
            // transparent stroke so that the two circles are correctly aligned
            color: '#0000',
          }),
        }),
      }),
    ],
  });
  map.value.addLayer(markerLayer);

  updateVisibility();
});

defineExpose({ getLayer, onMapClick });
</script>
