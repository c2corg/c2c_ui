<template>
  <div>
    <area-layer @layer="onLayer($event, 1)" />
    <yeti-layer @layer="onLayer($event, 0)" />
  </div>
</template>

<script setup lang="ts">
import AreaLayer from '@/components/yeti/map-layers/AreaLayer.vue';
import YetiLayer from '@/components/yeti/map-layers/YetiLayer.vue';
import Yetix from '@/components/yeti/yetix';
import type { SelectorLayer } from '@/components/yeti/yetix-types';

function onLayer(layer: SelectorLayer, index: number) {
  Yetix.addLayerToYetiLayersSelector(layer, index);
}
</script>
