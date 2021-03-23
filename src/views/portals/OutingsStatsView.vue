<template>
  <div class="section">
    <h1>
      <span>Outing statistics</span>
      <span v-if="!outings">{{ Math.round(loadingPercentage * 100) }}%</span>
    </h1>
    <div v-if="outings" class="columns">
      <div class="column">
        <h2>By year</h2>
        <div ref="year_repartition"></div>
      </div>
      <div class="column">
        <h2>By month</h2>
        <div ref="month_repartition"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { createHistogram } from './utils/outings-stats';

import c2c from '@/js/apis/c2c';
import d3 from '@/js/libs/d3';

const getOutingYear = function (outing) {
  return parseInt(outing.date_start.substring(0, 4), 10);
};
const getOutingMonth = function (outing) {
  return parseInt(outing.date_start.substring(5, 7), 10);
};

export default {
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
