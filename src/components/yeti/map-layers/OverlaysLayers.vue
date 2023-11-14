<template>
  <div>
    <avalanche-bulletins-layer @layer="onLayer($event, 0)" />
    <flowcapt-layer @layer="onLayer($event, 3)" />
    <nivoses-layer @layer="onLayer($event, 1)" />
    <romma-layer @layer="onLayer($event, 2)" />
  </div>
</template>

<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import AvalancheBulletinsLayer from '@/components/yeti/map-layers/AvalancheBulletinsLayer.vue';
import FlowcaptLayer from '@/components/yeti/map-layers/FlowcaptLayer.vue';
import NivosesLayer from '@/components/yeti/map-layers/NivosesLayer.vue';
import RommaLayer from '@/components/yeti/map-layers/RommaLayer.vue';

export default {
  components: {
    AvalancheBulletinsLayer,
    FlowcaptLayer,
    NivosesLayer,
    RommaLayer,
  },
  mixins: [layerMixin],
  methods: {
    onLayer(layer, index) {
      Yetix.addLayerToOverlaysLayersSelector(layer, index);
    },
  },
};
</script>
