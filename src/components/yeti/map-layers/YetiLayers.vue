<template>
  <div>
    <area-layer @layer="onLayer($event, 1)" />
    <yeti-layer @layer="onLayer($event, 0)" />
  </div>
</template>

<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import AreaLayer from '@/components/yeti/map-layers/AreaLayer.vue';
import YetiLayer from '@/components/yeti/map-layers/YetiLayer.vue';

export default {
  components: {
    AreaLayer,
    YetiLayer,
  },
  mixins: [layerMixin],
  methods: {
    onLayer(layer, index) {
      Yetix.addLayerToYetiLayersSelector(layer, index);
    },
  },
};
</script>
