<template>
  <div>
    <base-layers @layers="onBaseLayers"></base-layers>
    <slopes-layers @layers="onSlopesLayers"></slopes-layers>
  </div>
</template>

<script setup lang="ts">
import type BaseLayer from 'ol/layer/Base';
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';

import { useLayer } from './layer';

import Yetix from '@/components/yeti/Yetix.vue';
import BaseLayers from '@/components/yeti/map-layers/BaseLayers.vue';
import SlopesLayers from '@/components/yeti/map-layers/SlopesLayers.vue';
import yetixEvents from '@/components/yeti/yetix-events';

const { map } = useLayer();

// the layers of the map, given by BaseLayers and SlopesLayers once created
let cartoLayers: BaseLayer[] = [];

const mapZoom = computed(() => Yetix.mapZoom as number);

const showAreas = computed(() => Yetix.showAreas);

function onBaseLayers(newBaseLayers: BaseLayer[]) {
  cartoLayers = newBaseLayers;
  newBaseLayers.forEach((layer) => map.value.addLayer(layer));
}

function onSlopesLayers(newSlopesLayers: BaseLayer[]) {
  newSlopesLayers.forEach((layer) => map.value.addLayer(layer));
}

function onMapMoveEnd() {
  // if Yeti extent is here, update (on zooming for example)
  if (showAreas.value) {
    updateCartoLayersOpacity();
  }
}

function updateCartoLayersOpacity() {
  const MIN_ZOOM = Yetix.BLEND_MODES_MIN_ZOOM;
  const MAX_ZOOM = Yetix.BLEND_MODES_MAX_ZOOM;
  const MIN_OPACITY = 0.25;
  const MAX_OPACITY = 1;
  const DELTA_OPACITY = MAX_OPACITY - MIN_OPACITY;

  let opacity = MIN_OPACITY;
  // opacity should increase gradually between min and max zooms
  if (mapZoom.value >= MIN_ZOOM && mapZoom.value <= MAX_ZOOM) {
    // opacity is between 1 and 0
    opacity = (MAX_ZOOM - mapZoom.value) * (MAX_OPACITY / (MAX_ZOOM - MIN_ZOOM));
    // map value to min/max opacity
    opacity = Math.abs(1 - opacity) * DELTA_OPACITY + MIN_OPACITY;
  } else if (mapZoom.value > MAX_ZOOM) {
    opacity = MAX_OPACITY;
  }

  // for each carto layers, set opacity if yeti extent is shown
  cartoLayers.forEach((layer) => {
    layer.setOpacity(showAreas.value ? opacity : 1);
  });
}

watch(showAreas, () => {
  updateCartoLayersOpacity();
});

onMounted(() => {
  yetixEvents.on('map-moveend', onMapMoveEnd);
});

// it stayed after leaving the page
onBeforeUnmount(() => {
  yetixEvents.off('map-moveend', onMapMoveEnd);
});
</script>
