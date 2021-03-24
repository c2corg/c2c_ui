<template>
  <div class="section">
    <html-header :title="$gettext('Outings statistics')" />
    <h1 class="title is-3 header-section">
      <span v-translate>Outing statistics</span>
      <span v-if="!outings">{{ Math.round(loadingPercentage * 100) }}%</span>
    </h1>

    <query-items class="filter-section" />

    <div v-if="outings" class="columns result-section">
      <div class="column">
        <h2 class="title is-4" v-translate>By year</h2>
        <div ref="year_repartition"></div>
      </div>
      <div class="column">
        <h2 class="title is-4" v-translate>By month</h2>
        <div ref="month_repartition"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { createHistogram } from './utils/outings-stats';

import c2c from '@/js/apis/c2c';
import d3 from '@/js/libs/d3';
import QueryItems from '@/views/documents/utils/QueryItems';

const getOutingYear = function (outing) {
  return parseInt(outing.date_start.substring(0, 4), 10);
};
const getOutingMonth = function (outing) {
  return parseInt(outing.date_start.substring(5, 7), 10);
};

export default {
  components: {
    QueryItems,
  },

  data() {
    return {
      outings: null,
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
      c2c.outing.fullDownload(this.$route.query, 2000, this.progress).then((outings) => {
        this.outings = outings;
        d3.then(this.createGraphs);
      });
    },

    progress(current, total) {
      this.loadingPercentage = current / total;
    },

    createGraphs() {
      const outings = this.outings;

      createHistogram(d3, outings, this.$refs.year_repartition, getOutingYear);
      createHistogram(d3, outings, this.$refs.month_repartition, getOutingMonth);
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
