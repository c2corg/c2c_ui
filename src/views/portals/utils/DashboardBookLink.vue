<template>
  <dashboard-link :document="book"> </dashboard-link>
</template>

<script>
import DashboardLink from './DashboardLink';

export default {
  components: { DashboardLink },

  props: {
    book: {
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
