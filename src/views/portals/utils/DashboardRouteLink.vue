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

<script>
import DashboardLink from './DashboardLink';

export default {
  components: { DashboardLink },

  props: {
    route: {
      type: Object,
      required: true,
    },
  },

  computed: {
    filteredDocument() {
      const result = {};

      if (this.route.activities.includes('skitouring')) {
        result.ski_rating = this.route.ski_rating;
        result.height_diff_up = this.route.height_diff_up;
      }

      if (this.route.activities.includes('snow_ice_mixed')) {
        result.height_diff_difficulties = this.route.height_diff_difficulties;
        result.global_rating = this.route.global_rating;
      }

      if (this.route.activities.includes('mountain_climbing')) {
        result.height_diff_difficulties = this.route.height_diff_difficulties;
        result.engagement_rating = this.route.engagement_rating;
      }

      if (this.route.activities.includes('rock_climbing')) {
        result.height_diff_difficulties = this.route.height_diff_difficulties;
        result.equipement_rating = this.route.equipement_rating;
        result.rock_free_rating = this.route.rock_free_rating;
        result.rock_required_rating = this.route.rock_required_rating;
      }

      if (this.route.activities.includes('ice_climbing')) {
        result.height_diff_difficulties = this.route.height_diff_difficulties;
        result.ice_rating = this.route.ice_rating;
      }

      if (this.route.activities.includes('via_ferrata')) {
        result.via_ferrata_rating = this.route.via_ferrata_rating;
        result.height_diff_difficulties = this.route.height_diff_difficulties;
      }

      if (this.route.activities.includes('mountain_biking')) {
        result.mtb_up_rating = this.route.mtb_up_rating;
        result.mtb_down_rating = this.route.mtb_down_rating;
      }

      if (this.route.activities.includes('snowshoeing')) {
        result.height_diff_up = this.route.height_diff_up;
        result.height_diff_down = this.route.height_diff_down;
        result.snowshoe_rating = this.route.snowshoe_rating;
      }

      if (this.route.activities.includes('hiking')) {
        result.hiking_rating = this.route.hiking_rating;
        result.height_diff_up = this.route.height_diff_up;
        result.height_diff_down = this.route.height_diff_down;
      }

      if (this.route.activities.includes('slacklining')) {
        result.slackline_length = this.route.slackline_length;
        result.slackline_height = this.route.slackline_height;
        result.height_diff_access = this.route.height_diff_access;
      }

      return result;
    },
  },
};
</script>

<style scoped>
.append-comma:not(:last-child)::after {
  content: ', ';
}
</style>
