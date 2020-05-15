<template>
  <dashboard-link :document="outing">
    <marker-image-count :image-count="outing.img_count" />
    <marker-condition :condition="outing.condition_rating" />
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
