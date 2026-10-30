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

<script setup lang="ts">
import { onMounted, useTemplateRef, watch, type PropType } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import { StackedHistogram } from './outings-stats';

import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import common from '@/js/constants/common.json';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// an outing of the list
type Outing = C2cDocument;

const NOT_NULL_VALUES = '__NOT_NULL_VALUES__';

const getOutingYear = function (outing: Outing) {
  return parseInt(outing.date_start.substring(0, 4), 10);
};

const getOutingMonth = function (outing: Outing) {
  return parseInt(outing.date_start.substring(5, 7), 10) - 1;
};

const getRedToGreenColor = function (value: string, reference: string[], minValue: string, maxValue: string) {
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

const getRockRatingColor = function (rating: string, minRating: string, maxRating: string) {
  return getRedToGreenColor(rating, common.attributes.climbing_ratings, minRating, maxRating);
};

const getGlobalRatingColor = function (rating: string, minRating: string, maxRating: string) {
  return getRedToGreenColor(rating, common.attributes.global_ratings, minRating, maxRating);
};

const getSkiRatingColor = function (rating: string, minRating: string, maxRating: string) {
  return getRedToGreenColor(rating, common.attributes.ski_ratings, minRating, maxRating);
};

const getIceRatingColor = function (rating: string, minRating: string, maxRating: string) {
  return getRedToGreenColor(rating, common.attributes.ice_ratings, minRating, maxRating);
};

const getHikingRatingColor = function (rating: string, minRating: string, maxRating: string) {
  return getRedToGreenColor(rating, common.attributes.hiking_ratings, minRating, maxRating);
};

const ACTIVITY_COLORS: Record<string, string> = {
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

const getActivityColor = function (activity: string) {
  return ACTIVITY_COLORS[activity];
};

// global rating can't be ordered alphabetically
const compareGlobalRatings = function (a: string, b: string) {
  const aIndex = common.attributes.global_ratings.indexOf(a);
  const bIndex = common.attributes.global_ratings.indexOf(b);
  return aIndex < bIndex ? -1 : aIndex > bIndex ? +1 : 0;
};

const formatLengthInMeter = function (length: number) {
  if (length < 1000) {
    return `${length}\u00a0m`;
  } else {
    length = Math.round(length / 1000);
    return `${length}\u00a0km`;
  }
};

const activitySplittedValue = function (outing: Outing, value: number | null | undefined) {
  /* returns an object where:

  * key are outing's activity
  * value is the the value in argument divided by the number of outing's activity

  */

  const result: Record<string, number> = {};

  if (value) {
    for (const activity of outing.activities) {
      result[activity] = value / outing.activities.length;
    }
  }
  return result;
};

const props = defineProps({
  outings: {
    type: Array as PropType<Outing[]>,
    required: true,
  },
  // the activity of the tab, none for all activities
  activity: {
    type: String as PropType<string | null>,
    default: null,
  },
});

const route = useRoute();
const router = useRouter();
const { $gettext, $dateUtils } = useGlobalProperties();

// the elements of the graphs
const graphs = {
  year_repartition: useTemplateRef<HTMLDivElement>('year_repartition'),
  month_repartition: useTemplateRef<HTMLDivElement>('month_repartition'),
  height_diff_up: useTemplateRef<HTMLDivElement>('height_diff_up'),
  height_diff_difficulties: useTemplateRef<HTMLDivElement>('height_diff_difficulties'),
  rock_free_rating: useTemplateRef<HTMLDivElement>('rock_free_rating'),
  global_rating: useTemplateRef<HTMLDivElement>('global_rating'),
  labande_global_rating: useTemplateRef<HTMLDivElement>('labande_global_rating'),
  ski_rating: useTemplateRef<HTMLDivElement>('ski_rating'),
  ice_rating: useTemplateRef<HTMLDivElement>('ice_rating'),
  hiking_rating: useTemplateRef<HTMLDivElement>('hiking_rating'),
};

function urlBuilder(fields: Record<string, unknown>) {
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

  const queryArgs: Record<string, string> = {};
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
        queryArgs[field.url!] = `${field.values[0]},${field.values[field.values.length - 1]}`;
      } else {
        queryArgs[field.url!] = `${field.min},${field.max}`;
      }
    } else if (field.queryMode === 'valuesRangeSlider') {
      // is field's query mode is a range slider (means, we query it threw a range) tthen use a range
      queryArgs[field.url!] = `${fields[fieldId]},${fields[fieldId]}`;
    } else {
      // otherwise, simply take the value
      queryArgs[field.url!] = String(fields[fieldId]);
    }
  }

  // get current route query, and overwrite it with filters in arguments
  const query: LocationQueryRaw = { ...route.query, ...queryArgs };

  // if the current tab is filterd with activities
  if (props.activity) {
    query.act = props.activity;
  }

  // build target route object, and return the full path
  return router.resolve({ name: 'outings', query }).fullPath;
}

function createGraphs() {
  // we can't filter outings containing two activities
  // so we display a filter on legend only for the first part (all activities)
  const categoryUrlGetter = props.activity ? null : (category: string) => urlBuilder({ activities: category });

  new StackedHistogram(props.outings, graphs.year_repartition.value!, getOutingYear)
    .y((d: Outing) => d.activities)
    .color(getActivityColor)
    .categoryUrl(categoryUrlGetter)
    .categoryLabel((activity: string) => $gettext(activity, 'activities'))
    .xUrl((year: number) => urlBuilder({ year }))
    .dataUrl(props.activity ? null : (year: number, category: string) => urlBuilder({ year, activities: category }))
    .draw();

  new StackedHistogram(props.outings, graphs.month_repartition.value!, getOutingMonth)
    .y((d: Outing) => d.activities)
    .color(getActivityColor)
    .xTickLabel($dateUtils.month)
    .categoryUrl(categoryUrlGetter)
    .categoryLabel((activity: string) => $gettext(activity, 'activities'))
    .xDomain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) // always display all months
    .draw();

  new StackedHistogram(props.outings, graphs.height_diff_up.value!, getOutingYear)
    .y((outing: Outing) => activitySplittedValue(outing, outing.height_diff_up))
    .color(getActivityColor)
    .yTickLabel(formatLengthInMeter)
    .categoryUrl((category: string) => urlBuilder({ activities: category, height_diff_up: NOT_NULL_VALUES }))
    .categoryLabel((activity: string) => $gettext(activity, 'activities'))
    .xUrl((year: number) => urlBuilder({ year, height_diff_up: NOT_NULL_VALUES }))
    .dataUrl((year: number, category: string) =>
      urlBuilder({ year, activities: category, height_diff_up: NOT_NULL_VALUES })
    )
    .draw();

  new StackedHistogram(props.outings, graphs.height_diff_difficulties.value!, getOutingYear)
    .y((outing: Outing) => activitySplittedValue(outing, outing.height_diff_difficulties))
    .color(getActivityColor)
    .yTickLabel(formatLengthInMeter)
    .categoryUrl((category: string) => urlBuilder({ activities: category, height_diff_difficulties: NOT_NULL_VALUES }))
    .categoryLabel((activity: string) => $gettext(activity, 'activities'))
    .xUrl((year: number) =>
      urlBuilder({
        year,
        height_diff_difficulties: NOT_NULL_VALUES,
        activities: 'mountain_climbing,snow_ice_mixed',
      })
    )
    .dataUrl((year: number, category: string) =>
      urlBuilder({ year, activities: category, height_diff_difficulties: NOT_NULL_VALUES })
    )
    .draw();

  new StackedHistogram(props.outings, graphs.rock_free_rating.value!, getOutingYear)
    .y((d: Outing) => d.rock_free_rating)
    .color(getRockRatingColor)
    .categoryUrl((rock_free_rating: string) => urlBuilder({ rock_free_rating }))
    .xUrl((year: number) => urlBuilder({ year, rock_free_rating: NOT_NULL_VALUES }))
    .dataUrl((year: number, rock_free_rating: string) => urlBuilder({ year, rock_free_rating }))
    .draw();

  new StackedHistogram(props.outings, graphs.global_rating.value!, getOutingYear)
    .y((d: Outing) => d.global_rating)
    .color(getGlobalRatingColor)
    .categoryUrl((global_rating: string) => urlBuilder({ global_rating }))
    .categoryComparator(compareGlobalRatings)
    .xUrl((year: number) => urlBuilder({ year, global_rating: NOT_NULL_VALUES }))
    .dataUrl((year: number, global_rating: string) => urlBuilder({ year, global_rating }))
    .draw();

  new StackedHistogram(props.outings, graphs.labande_global_rating.value!, getOutingYear)
    .y((d: Outing) => d.labande_global_rating)
    .color(getGlobalRatingColor)
    .categoryUrl((labande_global_rating: string) => urlBuilder({ labande_global_rating }))
    .categoryComparator(compareGlobalRatings)
    .xUrl((year: number) => urlBuilder({ year, labande_global_rating: NOT_NULL_VALUES }))
    .dataUrl((year: number, labande_global_rating: string) => urlBuilder({ year, labande_global_rating }))
    .draw();

  new StackedHistogram(props.outings, graphs.ski_rating.value!, getOutingYear)
    .y((d: Outing) => d.ski_rating)
    .color(getSkiRatingColor)
    .categoryUrl((ski_rating: string) => urlBuilder({ ski_rating }))
    .xUrl((year: number) => urlBuilder({ year, ski_rating: NOT_NULL_VALUES }))
    .dataUrl((year: number, ski_rating: string) => urlBuilder({ year, ski_rating }))
    .draw();

  new StackedHistogram(props.outings, graphs.ice_rating.value!, getOutingYear)
    .y((d: Outing) => d.ice_rating)
    .color(getIceRatingColor)
    .categoryUrl((ice_rating: string) => urlBuilder({ ice_rating }))
    .xUrl((year: number) => urlBuilder({ year, ice_rating: NOT_NULL_VALUES }))
    .dataUrl((year: number, ice_rating: string) => urlBuilder({ year, ice_rating }))
    .draw();

  new StackedHistogram(props.outings, graphs.hiking_rating.value!, getOutingYear)
    .y((d: Outing) => d.hiking_rating)
    .color(getHikingRatingColor)
    .categoryUrl((hiking_rating: string) => urlBuilder({ hiking_rating }))
    .xUrl((year: number) => urlBuilder({ year, hiking_rating: NOT_NULL_VALUES }))
    .dataUrl((year: number, hiking_rating: string) => urlBuilder({ year, hiking_rating }))
    .draw();
}

watch(() => props.outings, createGraphs);

onMounted(createGraphs);
</script>
