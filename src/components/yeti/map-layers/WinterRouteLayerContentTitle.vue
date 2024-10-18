<template>
  <span>
    <fa-icon icon="layer-group" />
    <span>{{ layer.title }}</span>
    <counter v-if="winterRoutesLength">{{ winterRoutesLength }}</counter>
  </span>
</template>

<script>
import Counter from '@/components/yeti/Counter.vue';
import Yetix from '@/components/yeti/Yetix.vue';

export default {
  components: {
    Counter,
  },
  props: {
    layer: {
      type: Object,
      required: true,
    },
  },
  computed: {
    winterRoutes() {
      return Yetix.winterRoutes;
    },
    winterRoutesLength() {
      return this.winterRoutes.length;
    },
  },
};
</script>
