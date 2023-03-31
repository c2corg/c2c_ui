<template>
  <div>
    <winter-route-layer @layer="onLayer($event, 1)" />
    <avalanche-bulletins-layer @layer="onLayer($event, 0)" />
    <data-avalanche-layer @layer="onLayer($event, 5)" />
    <flowcapt-layer @layer="onLayer($event, 4)" />
    <nivoses-layer @layer="onLayer($event, 2)" />
    <romma-layer @layer="onLayer($event, 3)" />
  </div>
</template>

<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import AvalancheBulletinsLayer from '@/components/yeti/map-layers/AvalancheBulletinsLayer.vue';
import DataAvalancheLayer from '@/components/yeti/map-layers/DataAvalancheLayer.vue';
import FlowcaptLayer from '@/components/yeti/map-layers/FlowcaptLayer.vue';
import NivosesLayer from '@/components/yeti/map-layers/NivosesLayer.vue';
import RommaLayer from '@/components/yeti/map-layers/RommaLayer.vue';
import WinterRouteLayer from '@/components/yeti/map-layers/WinterRouteLayer.vue';

export default {
  components: {
    AvalancheBulletinsLayer,
    FlowcaptLayer,
    NivosesLayer,
    RommaLayer,
    WinterRouteLayer,
    DataAvalancheLayer,
  },
  mixins: [layerMixin],
  methods: {
    onLayer(layer, index) {
      Yetix.addLayerToOverlaysLayersSelector(layer, index);
    },
  },
};
</script>
