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

      <div class="column">
        <h2 class="title is-4" v-translate>height_diff_difficulties</h2>
        <div ref="height_diff_difficulties"></div>
      </div>
    </div>

    <div class="columns result-section">
      <div class="column">
        <h2 class="title is-4" v-translate>rock_free_rating</h2>
        <div ref="rock_free_rating"></div>
      </div>
      <div class="column">
        <h2 class="title is-4" v-translate>global_rating</h2>
        <div ref="global_rating"></div>
      </div>
    </div>

    <div class="columns result-section">
      <div class="column">
        <h2 class="title is-4" v-translate>ski_rating</h2>
        <div ref="ski_rating"></div>
      </div>
      <div class="column">
        <h2 class="title is-4" v-translate>labande_global_rating</h2>
        <div ref="labande_global_rating"></div>
      </div>
    </div>

    <div class="columns result-section">
      <div class="column">
        <h2 class="title is-4" v-translate>ice_rating</h2>
        <div ref="ice_rating"></div>
      </div>
      <div class="column">
        <h2 class="title is-4" v-translate>hiking_rating</h2>
        <div ref="hiking_rating"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { Histogram, StackedHistogram } from './outings-stats';

import common from '@/js/constants/common.json';

const getOutingYear = function (outing) {
  return parseInt(outing.date_start.substring(0, 4), 10);
};

const getOutingMonth = function (outing) {
  return parseInt(outing.date_start.substring(5, 7), 10) - 1;
};

const getRedToGreenColor = function (value, reference, minValue, maxValue) {
  if (minValue === maxValue) {
    return 'orange';
  }

  // going from something like 6a to a number between 0 and 1 representing the position of 6a
  // regarding the min value and the max value
  const hueOffset =
    (reference.indexOf(value) - reference.indexOf(minValue)) /
    (reference.indexOf(maxValue) - reference.indexOf(minValue));

  // going from [0, 1] to [120, 0] (0 means red, 120 means green)
  const hue = 120 - 120 * hueOffset;

  return `hsl(${hue}, 66%, 50%)`;
};

const getRockRatingColor = function (rating, minRating, maxRating) {
  return getRedToGreenColor(rating, common.attributes.climbing_ratings, minRating, maxRating);
};

const getGlobalRatingColor = function (rating, minRating, maxRating) {
  return getRedToGreenColor(rating, common.attributes.global_ratings, minRating, maxRating);
};

const getSkiRatingColor = function (rating, minRating, maxRating) {
  return getRedToGreenColor(rating, common.attributes.ski_ratings, minRating, maxRating);
};

const getIceRatingColor = function (rating, minRating, maxRating) {
  return getRedToGreenColor(rating, common.attributes.ice_ratings, minRating, maxRating);
};

const getHikingRatingColor = function (rating, minRating, maxRating) {
  return getRedToGreenColor(rating, common.attributes.hiking_ratings, minRating, maxRating);
};

const ACTIVITY_COLORS = {
  ice_climbing: 'Aqua',
  snow_ice_mixed: 'LightSteelBlue',

  paragliding: 'MediumBlue',

  hiking: 'ForestGreen',
  snowshoeing: 'LightGreen',

  rock_climbing: 'SaddleBrown',
  mountain_climbing: 'RosyBrown',

  skitouring: 'Red',
  mountain_biking: 'DeepPink',
  via_ferrata: 'Black',
  slacklining: 'Orange',
};

const getActivityColor = function (activity) {
  return ACTIVITY_COLORS[activity];
};

// global rating can't be ordered alphabetically
const compareGlobalRatings = function (a, b) {
  const aIndex = common.attributes.global_ratings.indexOf(a);
  const bIndex = common.attributes.global_ratings.indexOf(b);
  return aIndex < bIndex ? -1 : aIndex > bIndex ? +1 : 0;
};

const formatLengthInMeter = function (length) {
  if (length < 1000) {
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
      new StackedHistogram(this.outings, this.$refs.year_repartition, getOutingYear, (d) => d.activities)
        .color(getActivityColor)
        .categoryLabel((activity) => this.$gettext(activity, 'activities'))
        .draw();

      new StackedHistogram(this.outings, this.$refs.month_repartition, getOutingMonth, (d) => d.activities)
        .color(getActivityColor)
        .xTickLabel(this.$dateUtils.month)
        .categoryLabel((activity) => this.$gettext(activity, 'activities'))
        .xDomain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) // always display all months
        .draw();

      new Histogram(this.outings, this.$refs.height_diff_up, getOutingYear)
        .y((outing) => outing.height_diff_up)
        .yTickLabel(formatLengthInMeter)
        .draw();

      new Histogram(this.outings, this.$refs.height_diff_difficulties, getOutingYear)
        .y((outing) => outing.height_diff_difficulties)
        .yTickLabel(formatLengthInMeter)
        .draw();

      new StackedHistogram(this.outings, this.$refs.rock_free_rating, getOutingYear, (d) => [d.rock_free_rating])
        .color(getRockRatingColor)
        .draw();

      new StackedHistogram(this.outings, this.$refs.global_rating, getOutingYear, (d) => [d.global_rating])
        .color(getGlobalRatingColor)
        .categoryComparator(compareGlobalRatings)
        .draw();

      new StackedHistogram(this.outings, this.$refs.labande_global_rating, getOutingYear, (d) => [
        d.labande_global_rating,
      ])
        .color(getGlobalRatingColor)
        .categoryComparator(compareGlobalRatings)
        .draw();

      new StackedHistogram(this.outings, this.$refs.ski_rating, getOutingYear, (d) => [d.ski_rating])
        .color(getSkiRatingColor)
        .draw();

      new StackedHistogram(this.outings, this.$refs.ice_rating, getOutingYear, (d) => [d.ice_rating])
        .color(getIceRatingColor)
        .draw();

      new StackedHistogram(this.outings, this.$refs.hiking_rating, getOutingYear, (d) => [d.hiking_rating])
        .color(getHikingRatingColor)
        .draw();
    },
  },
};
</script>
