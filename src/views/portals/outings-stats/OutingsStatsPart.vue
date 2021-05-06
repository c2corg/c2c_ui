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
import { StackedHistogram } from './outings-stats';

import constants from '@/js/constants';
import common from '@/js/constants/common.json';

const NOT_NULL_VALUES = '__NOT_NULL_VALUES__';

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

const activitySplittedValue = function (outing, value) {
  /* returns an object where:

  * key are outing's activity
  * value is the the value in argument divided by the number of outing's activity

  */

  const result = {};

  if (value) {
    for (const activity of outing.activities) {
      result[activity] = value / outing.activities.length;
    }
  }
  return result;
};

export default {
  props: {
    outings: {
      type: Array,
      required: true,
    },
    activity: {
      type: String,
      default: null,
    },
  },

  watch: {
    outings: 'createGraphs',
  },

  mounted() {
    this.createGraphs();
  },

  methods: {
    urlBuilder(fields) {
      /*
       * ## The "magic" function that build URLs.
       *
       * it hides all the field query complexity, and expose a simple prototype
       * It also handles overwriting the actuel $route possible filter
       *
       * ### Basic behavior
       *
       * Take an object with field ids (like `ski_rating`) and values, it will returns and URL:
       *
       *     { activities: "skitouring" } => /outings?act=skitouring
       *
       * ### `year` id
       *
       * Even if `year` is not a field id, it's accepted, and the value is transformed. Example:
       *
       *     { year: 2013} => /outings?date=2013-01-01,2013-12-31
       *
       * ### `null` value
       *
       * If the value is NOT_NULL_VALUES, then the lower and upper bound of possible values is used. It's usefull to
       * filter on outings where the field is defined, whetever the value (e.g. NOT NULL ). Example:
       *
       *     { ski_rating: NOT_NULL_VALUES } => /outings?trat=1.1,5.6
       *     { height_diff_up: NOT_NULL_VALUES } => /outings?odif=0,9000
       *
       * ### When field is requested threw a range
       *
       * It seems that the API is not able to filter on a single value on some field. When the query mode of the field
       * is a slided (meaning setting an lower and an upper bound, then we use a range). Example :
       *
       *     { rock_free_rating: "5a" } => /outings?frat=5a,5a
       *
       */

      const queryArgs = {};
      const outingFields = constants.objectDefinitions.outing.fields;

      // specific treatment for year
      if (fields.year) {
        queryArgs.date = `${fields.year}-01-01,${fields.year}-12-31`;
        delete fields.year;
      }

      for (const fieldId in fields) {
        const field = outingFields[fieldId];
        const value = fields[fieldId];

        if (value === NOT_NULL_VALUES) {
          // when value is null, get bounds of possible values
          if (field.values) {
            queryArgs[field.url] = `${field.values[0]},${field.values[field.values.length - 1]}`;
          } else {
            queryArgs[field.url] = `${field.min},${field.max}`;
          }
        } else if (field.queryMode === 'valuesRangeSlider') {
          // is field's query mode is a range slider (means, we query it threw a range) tthen use a range
          queryArgs[field.url] = `${fields[fieldId]},${fields[fieldId]}`;
        } else {
          // otherwise, simply take the value
          queryArgs[field.url] = fields[fieldId];
        }
      }

      // get current route query, and overwrite it with filters in arguments
      const query = { ...this.$route.query, ...queryArgs };

      // if the current tab is filterd with activities
      if (this.activity) {
        query.act = this.activity;
      }

      // build target route object, and return the full path
      const route = this.$router.resolve({ name: 'outings', query }).route;
      return route.fullPath;
    },

    createGraphs() {
      // we can't filter outings containing two activities
      // so we display a filter on legend only for the first part (all activities)
      const categoryUrlGetter = this.activity ? null : (category) => this.urlBuilder({ activities: category });

      new StackedHistogram(this.outings, this.$refs.year_repartition, getOutingYear)
        .y((d) => d.activities)
        .color(getActivityColor)
        .categoryUrl(categoryUrlGetter)
        .categoryLabel((activity) => this.$gettext(activity, 'activities'))
        .xUrl((year) => this.urlBuilder({ year }))
        .dataUrl(this.activity ? null : (year, category) => this.urlBuilder({ year, activities: category }))
        .draw();

      new StackedHistogram(this.outings, this.$refs.month_repartition, getOutingMonth)
        .y((d) => d.activities)
        .color(getActivityColor)
        .xTickLabel(this.$dateUtils.month)
        .categoryUrl(categoryUrlGetter)
        .categoryLabel((activity) => this.$gettext(activity, 'activities'))
        .xDomain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) // always display all months
        .draw();

      new StackedHistogram(this.outings, this.$refs.height_diff_up, getOutingYear)
        .y((outing) => activitySplittedValue(outing, outing.height_diff_up))
        .color(getActivityColor)
        .yTickLabel(formatLengthInMeter)
        .categoryUrl((category) => this.urlBuilder({ activities: category, height_diff_up: NOT_NULL_VALUES }))
        .categoryLabel((activity) => this.$gettext(activity, 'activities'))
        .xUrl((year) => this.urlBuilder({ year, height_diff_up: NOT_NULL_VALUES }))
        .dataUrl((year, category) => this.urlBuilder({ year, activities: category, height_diff_up: NOT_NULL_VALUES }))
        .draw();

      new StackedHistogram(this.outings, this.$refs.height_diff_difficulties, getOutingYear)
        .y((outing) => activitySplittedValue(outing, outing.height_diff_difficulties))
        .color(getActivityColor)
        .yTickLabel(formatLengthInMeter)
        .categoryUrl((category) => this.urlBuilder({ activities: category, height_diff_difficulties: NOT_NULL_VALUES }))
        .categoryLabel((activity) => this.$gettext(activity, 'activities'))
        .xUrl((year) =>
          this.urlBuilder({
            year,
            height_diff_difficulties: NOT_NULL_VALUES,
            activities: 'mountain_climbing,snow_ice_mixed',
          })
        )
        .dataUrl((year, category) =>
          this.urlBuilder({ year, activities: category, height_diff_difficulties: NOT_NULL_VALUES })
        )
        .draw();

      new StackedHistogram(this.outings, this.$refs.rock_free_rating, getOutingYear)
        .y((d) => d.rock_free_rating)
        .color(getRockRatingColor)
        .categoryUrl((rock_free_rating) => this.urlBuilder({ rock_free_rating }))
        .xUrl((year) => this.urlBuilder({ year, rock_free_rating: NOT_NULL_VALUES }))
        .dataUrl((year, rock_free_rating) => this.urlBuilder({ year, rock_free_rating }))
        .draw();

      new StackedHistogram(this.outings, this.$refs.global_rating, getOutingYear)
        .y((d) => d.global_rating)
        .color(getGlobalRatingColor)
        .categoryUrl((global_rating) => this.urlBuilder({ global_rating }))
        .categoryComparator(compareGlobalRatings)
        .xUrl((year) => this.urlBuilder({ year, global_rating: NOT_NULL_VALUES }))
        .dataUrl((year, global_rating) => this.urlBuilder({ year, global_rating }))
        .draw();

      new StackedHistogram(this.outings, this.$refs.labande_global_rating, getOutingYear)
        .y((d) => d.labande_global_rating)
        .color(getGlobalRatingColor)
        .categoryUrl((labande_global_rating) => this.urlBuilder({ labande_global_rating }))
        .categoryComparator(compareGlobalRatings)
        .xUrl((year) => this.urlBuilder({ year, labande_global_rating: NOT_NULL_VALUES }))
        .dataUrl((year, labande_global_rating) => this.urlBuilder({ year, labande_global_rating }))
        .draw();

      new StackedHistogram(this.outings, this.$refs.ski_rating, getOutingYear)
        .y((d) => d.ski_rating)
        .color(getSkiRatingColor)
        .categoryUrl((ski_rating) => this.urlBuilder({ ski_rating }))
        .xUrl((year) => this.urlBuilder({ year, ski_rating: NOT_NULL_VALUES }))
        .dataUrl((year, ski_rating) => this.urlBuilder({ year, ski_rating }))
        .draw();

      new StackedHistogram(this.outings, this.$refs.ice_rating, getOutingYear)
        .y((d) => d.ice_rating)
        .color(getIceRatingColor)
        .categoryUrl((ice_rating) => this.urlBuilder({ ice_rating }))
        .xUrl((year) => this.urlBuilder({ year, ice_rating: NOT_NULL_VALUES }))
        .dataUrl((year, ice_rating) => this.urlBuilder({ year, ice_rating }))
        .draw();

      new StackedHistogram(this.outings, this.$refs.hiking_rating, getOutingYear)
        .y((d) => d.hiking_rating)
        .color(getHikingRatingColor)
        .categoryUrl((hiking_rating) => this.urlBuilder({ hiking_rating }))
        .xUrl((year) => this.urlBuilder({ year, hiking_rating: NOT_NULL_VALUES }))
        .dataUrl((year, hiking_rating) => this.urlBuilder({ year, hiking_rating }))
        .draw();
    },
  },
};
</script>
