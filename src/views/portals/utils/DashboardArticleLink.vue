<template>
  <dashboard-link :document="article">
  </dashboard-link>
</template>

<script>
import DashboardLink from './DashboardLink';

export default {
  components: { DashboardLink },

  props: {
    article: {
      type: Object,
      required: true,
    },
  },
};
</script>
