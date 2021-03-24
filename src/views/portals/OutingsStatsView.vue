<template>
  <div class="section">
    <html-header :title="$gettext('Outings statistics')" />
    <h1 class="title is-3 header-section">
      <span v-translate>Outing statistics</span>
      <span v-if="loadingPercentage !== 1">{{ Math.round(loadingPercentage * 100) }}%</span>
    </h1>

    <query-items class="filter-section" />

    <div class="columns result-section">
      <div class="column">
        <h2 class="title is-4" v-translate>By year</h2>
        <div ref="year_repartition"></div>
      </div>
      <div class="column">
        <h2 class="title is-4" v-translate>By month</h2>
        <div ref="month_repartition"></div>
      </div>
    </div>

    <div class="columns result-section">
      <div class="column">
        <h2 class="title is-4" v-translate>height_diff_up</h2>
        <div ref="height_diff_up"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { Histogram } from './utils/outings-stats';

import c2c from '@/js/apis/c2c';
import QueryItems from '@/views/documents/utils/QueryItems';

const getOutingYear = function (outing) {
  return parseInt(outing.date_start.substring(0, 4), 10);
};
const getOutingMonth = function (outing) {
  return parseInt(outing.date_start.substring(5, 7), 10) - 1;
};

export default {
  components: {
    QueryItems,
  },

  data() {
    return {
      loadingPercentage: 0,
    };
  },

  watch: {
    $route: {
      handler: 'load',
      immediate: true,
    },
  },

  methods: {
    load() {
      c2c.outing.fullDownload(this.$route.query, 2000, this.progress).then(this.createGraphs);
    },

    progress(current, total) {
      this.loadingPercentage = current / Math.min(total, 2000);
    },

    createGraphs(outings) {
      new Histogram(outings, this.$refs.year_repartition, getOutingYear).draw();
      new Histogram(outings, this.$refs.month_repartition, getOutingMonth).xTickLabel(this.$dateUtils.month).draw();

      new Histogram(outings, this.$refs.height_diff_up, getOutingYear)
        .getY((outing) => outing.height_diff_up)
        .yTickLabel((v) => `${v}m`)
        .draw();
    },
  },
};
</script>

<style scoped lang="scss">
.filter-section {
  padding-bottom: 0.5rem;
  clear: both;
}

.result-section {
  margin-top: 0.5rem;
  border-top: 1px solid lightgrey;
  padding-top: 0.5rem;
  clear: both;
}
</style>
