<template>
  <div>
    <base-layers @layers="onBaseLayers"></base-layers>
    <slopes-layers @layers="onSlopesLayers"></slopes-layers>
  </div>
</template>
<script setup lang="ts">
import type Geometry from 'ol/geom/Geometry';
import type BaseLayer from 'ol/layer/Base';
import type Layer from 'ol/layer/Layer';
import type RenderEvent from 'ol/render/Event';
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';

import { useLayer } from './layer';

import BaseLayers from '@/components/yeti/map-layers/BaseLayers.vue';
import SlopesLayers from '@/components/yeti/map-layers/SlopesLayers.vue';
import Yetix from '@/components/yeti/yetix';
import yetixEvents from '@/components/yeti/yetix-events';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';

const emit = defineEmits(['layer']);

const { $gettext } = useGlobalProperties();
const { map, getExtent, getFeaturesFromData, getPropertiesFromFeatures } = useLayer();

const mapZoom = computed(() => Yetix.mapZoom as number);

const areas = computed(() => Yetix.areas as { geometry: Geometry }[]);

const showAreas = computed(() => Yetix.showAreas);

const layerSelector = computed(() => {
  return {
    title: $gettext('Extent'),
    checked: showAreas.value,
    action: onShowAreas,
    disabled: {
      condition: mapZoom.value > Yetix.BLEND_MODES_MAX_ZOOM,
      title: $gettext('Disabled at this zoom level'),
      message: $gettext('Zoom out and it will be OK'),
    },
    image: 'yeti-extent.jpg',
  };
});

function onAreasResult(data: { data: unknown }) {
  const areasFeatures = getFeaturesFromData(data);

  // set areas in state
  Yetix.setAreas(getPropertiesFromFeatures(areasFeatures) as { geometry: Geometry }[]);

  // add features
  areasLayer.getSource()!.addFeatures(areasFeatures);
  areasStrokeLayer.getSource()!.addFeatures(areasFeatures);

  // check is area OK
  isAreaOK();
}

function isAreaOK() {
  let mapExtent = getExtent('EPSG:3857');

  let areaOk = true;

  for (const area of areas.value) {
    if (area.geometry.intersectsExtent(mapExtent)) {
      break;
    } else {
      areaOk = false;
    }
  }
  Yetix.setAreaOk(areaOk);
}

function onShowAreas() {
  Yetix.setShowAreas(!showAreas.value);
}

function updateVisibility() {
  areasLayer.setVisible(showAreas.value);
  groupLayer.setVisible(showAreas.value);
  areasStrokeLayer.setVisible(showAreas.value);
}

function onMapMoveEnd() {
  // is area OK ?
  isAreaOK();
}

function onBaseLayers(baseLayers: BaseLayer[]) {
  const layers = baseLayers.map((layer) => {
    if (layer instanceof ol.layer.Group) {
      layer
        .getLayers()
        .getArray()
        .forEach((subLayer) => {
          setPrePostRender(subLayer as Layer);
        });
    } else {
      setPrePostRender(layer as Layer);
    }
    return layer;
  });
  groupLayer.setLayers(new ol.Collection(layers));
}

function onSlopesLayers(slopesLayers: BaseLayer[]) {
  const groupLayers = groupLayer.getLayers();
  slopesLayers.forEach((layer) => {
    setClassName(layer as Layer);
    groupLayers.push(layer);
  });
  groupLayer.setLayers(groupLayers);
}

// a separate canvas for the layer: OpenLayers reads its private className_
function setClassName(layer: Layer) {
  (layer as unknown as { className_: string }).className_ = Yetix.BLEND_MODES_CLASS_NAME;
}

function context(evt: RenderEvent) {
  return evt.context as CanvasRenderingContext2D;
}

function setPrePostRender(layer: Layer) {
  setClassName(layer);
  layer.on('prerender', (evt) => {
    // source-atop: means the source (this layer) will only be drawn on actual pixels (area layer)
    // but only when MAX_ZOOM
    if (mapZoom.value <= Yetix.BLEND_MODES_MAX_ZOOM) {
      context(evt).globalCompositeOperation = 'source-atop';
    }
  });
  layer.on('postrender', (evt) => {
    // source-over: returns to default
    context(evt).globalCompositeOperation = 'source-over';
  });
}

watch(
  layerSelector,
  (layer) => {
    emit('layer', layer);
  },
  { deep: true }
);

watch(showAreas, () => {
  updateVisibility();
});

// created
// layer for outer stroke of areas
const areasStrokeLayer = new ol.layer.VectorImage({
  source: new ol.source.Vector(),
  style: [
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: `rgba(0, 0, 0, 0.2)`,
        width: 14,
      }),
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: `rgba(0, 0, 0, 0.75)`,
        width: 1,
      }),
    }),
  ],
});
// layer for clip
// should set className, this forces ol to create another canvas
const areasLayer = new ol.layer.VectorImage({
  className: Yetix.BLEND_MODES_CLASS_NAME,
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'white',
    }),
  }),
});
// group for c2c layers, clipped
const groupLayer = new ol.layer.Group({
  layers: [],
});

onMounted(() => {
  // add layers
  map.value.addLayer(areasStrokeLayer);
  map.value.addLayer(areasLayer);
  map.value.addLayer(groupLayer);

  // showAreas checked?
  updateVisibility();

  emit('layer', layerSelector.value);

  // only in first mount
  if (areas.value.length === 0) {
    // set areas (yeti valid areas)
    Yetix.fetchAreas().then(onAreasResult);
  }
  yetixEvents.on('map-moveend', onMapMoveEnd);
});

// it stayed after leaving the page (and was added on the first visit only)
onBeforeUnmount(() => {
  yetixEvents.off('map-moveend', onMapMoveEnd);
});
</script>
