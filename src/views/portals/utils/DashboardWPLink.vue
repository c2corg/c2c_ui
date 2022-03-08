<template>
  <dashboard-link :document="waypoint"> </dashboard-link>
</template>

<script>
import DashboardLink from './DashboardLink';

export default {
  components: { DashboardLink },

  props: {
    waypoint: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
.append-comma:not(:last-child)::after {
  content: ', ';
}
</style>
