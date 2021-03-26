<template>
  <div>
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
import { Histogram } from './outings-stats';

const getOutingYear = function (outing) {
  return parseInt(outing.date_start.substring(0, 4), 10);
};
const getOutingMonth = function (outing) {
  return parseInt(outing.date_start.substring(5, 7), 10) - 1;
};

const formatLengthInMeter = function (length) {
  if (length < 9999) {
    return `${length}\u00a0m`;
  } else {
    length = Math.round(length / 1000);
    return `${length}\u00a0km`;
  }
};

export default {
  props: {
    outings: {
      type: Array,
      required: true,
      tye: Array,
    },
  },

  watch: {
    outings: 'createGraphs',
  },

  mounted() {
    this.createGraphs();
  },

  methods: {
    createGraphs() {
      new Histogram(this.outings, this.$refs.year_repartition, getOutingYear).draw();
      new Histogram(this.outings, this.$refs.month_repartition, getOutingMonth)
        .xTickLabel(this.$dateUtils.month)
        .draw();

      new Histogram(this.outings, this.$refs.height_diff_up, getOutingYear)
        .getY((outing) => outing.height_diff_up)
        .yTickLabel(formatLengthInMeter)
        .draw();
    },
  },
};
</script>
