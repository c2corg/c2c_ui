<template>
  <div>
    <area-layer @layer="onLayer($event, 1)" />
    <yeti-layer @layer="onLayer($event, 0)" />
  </div>
</template>

<script setup lang="ts">
import { useLayer } from './layer';

import Yetix from '@/components/yeti/Yetix.vue';
import AreaLayer from '@/components/yeti/map-layers/AreaLayer.vue';
import YetiLayer from '@/components/yeti/map-layers/YetiLayer.vue';

const { map } = useLayer();

function onLayer(layer: unknown, index: number) {
  Yetix.addLayerToYetiLayersSelector(layer, index);
}
</script>
