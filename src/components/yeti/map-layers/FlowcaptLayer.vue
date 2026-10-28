<template>
  <icon-layer
    :name="name"
    :color="color"
    :selector="layerSelector"
    ref="iconLayer"
    @layer="$emit('layer', $event)"
    @set-overlay="setOverlay"
    @unset-overlay="unsetOverlay"
  >
    <span v-translate>FlowCapt sensor</span>
    <template #overlay>
      <a :href="overlay.url" target="_blank">
        {{ overlay.title }}
        <fa-icon icon="external-link-alt" class="overlay-link-icon" />
      </a>
    </template>
  </icon-layer>
</template>

<script setup lang="ts">
import type Feature from 'ol/Feature';
import { computed, ref } from 'vue';

import IconLayer from './IconLayer.vue';
import { useIconLayer } from './icon-layer';

import { useGlobalProperties } from '@/js/composables/global-properties';

defineEmits(['layer']);

const { $gettext } = useGlobalProperties();
const { getLayer, onMapClick, onMapLooseClick, onMapPointerMove, onMapLoosePointerMove } = useIconLayer();

const name = 'flowcapt';
const color = 'hsl(112, 55%, 42%)';
const overlay = ref<{ title?: string; url?: string }>({});

const layerSelector = computed(() => {
  return {
    title: $gettext('FlowCapt sensors'),
    image: 'flowcapt.png',
    small: true,
  };
});

function setOverlay(feature: Feature) {
  overlay.value.title = feature.get('name') + ' - ' + feature.get('city');
  overlay.value.url = feature.get('url');
}

function unsetOverlay() {
  overlay.value.title = undefined;
  overlay.value.url = undefined;
}

defineExpose({ getLayer, onMapClick, onMapLooseClick, onMapPointerMove, onMapLoosePointerMove });
</script>
