<template>
  <dashboard-link :document="route">
    <span v-if="filteredDocument.height_diff_up" :title="$gettext('height_diff_up')" class="append-comma">
      +{{ route.height_diff_up }}&nbsp;m</span
    >
    <span
      v-if="filteredDocument.height_diff_difficulties"
      :title="$gettext('height_diff_difficulties')"
      class="append-comma"
    >
      {{ route.height_diff_difficulties }}&nbsp;m</span
    >
    <document-rating :document="filteredDocument" />
    <marker-quality :quality="route.quality" />
  </dashboard-link>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import DashboardLink from './DashboardLink.vue';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({
  route: {
    type: Object as PropType<C2cDocument>,
    required: true,
  },
});

const filteredDocument = computed(() => {
  const result: Record<string, unknown> = {};

  if (props.route.activities.includes('skitouring')) {
    result.ski_rating = props.route.ski_rating;
    result.height_diff_up = props.route.height_diff_up;
  }

  if (props.route.activities.includes('snow_ice_mixed')) {
    result.height_diff_difficulties = props.route.height_diff_difficulties;
    result.global_rating = props.route.global_rating;
  }

  if (props.route.activities.includes('mountain_climbing')) {
    result.height_diff_difficulties = props.route.height_diff_difficulties;
    result.engagement_rating = props.route.engagement_rating;
  }

  if (props.route.activities.includes('rock_climbing')) {
    result.height_diff_difficulties = props.route.height_diff_difficulties;
    result.equipement_rating = props.route.equipement_rating;
    result.rock_free_rating = props.route.rock_free_rating;
    result.rock_required_rating = props.route.rock_required_rating;
  }

  if (props.route.activities.includes('ice_climbing')) {
    result.height_diff_difficulties = props.route.height_diff_difficulties;
    result.ice_rating = props.route.ice_rating;
  }

  if (props.route.activities.includes('via_ferrata')) {
    result.via_ferrata_rating = props.route.via_ferrata_rating;
    result.height_diff_difficulties = props.route.height_diff_difficulties;
  }

  if (props.route.activities.includes('mountain_biking')) {
    result.mtb_up_rating = props.route.mtb_up_rating;
    result.mtb_down_rating = props.route.mtb_down_rating;
  }

  if (props.route.activities.includes('snowshoeing')) {
    result.height_diff_up = props.route.height_diff_up;
    result.height_diff_down = props.route.height_diff_down;
    result.snowshoe_rating = props.route.snowshoe_rating;
  }

  if (props.route.activities.includes('hiking')) {
    result.hiking_rating = props.route.hiking_rating;
    result.height_diff_up = props.route.height_diff_up;
    result.height_diff_down = props.route.height_diff_down;
  }

  if (props.route.activities.includes('slacklining')) {
    result.slackline_length = props.route.slackline_length;
    result.slackline_height = props.route.slackline_height;
    result.height_diff_access = props.route.height_diff_access;
  }

  return result;
});
</script>

<style scoped>
.append-comma:not(:last-child)::after {
  content: ', ';
}
</style>
