<template>
  <dashboard-link :document="outing">
    <marker-image-count :image-count="outing.img_count" />
    <marker-gps-trace v-if="outing.geometry.has_geom_detail" />
    <marker-condition :condition="outing.condition_rating" />
    <marker-soft-mobility v-if="outing.public_transport" />
    <marker-quality :quality="outing.quality" />
  </dashboard-link>
</template>

<script>
import DashboardLink from './DashboardLink';

export default {
  components: { DashboardLink },

  props: {
    outing: {
      type: Object,
      required: true,
    },
  },
};
</script>
