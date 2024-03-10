<template>
  <span class="has-hover-background">
    <document-title :document="route" />
    <activities
      v-if="!hideActivities"
      :activities="route.activities"
      class="is-size-4 has-text-secondary icon-activities"
    />
    <span v-if="heightUpText" :title="$gettext('height_diff_up')" class="has-text-normal .is-nowrap">
      {{ heightUpText }}&#8202;m,
    </span>
    <span v-if="heightDiffText" :title="$gettext('height_diff_difficulties')" class="has-text-normal .is-nowrap">
      {{ heightDiffText }}&#8202;m,
    </span>
    <span
      v-if="route.orientations && route.orientations.length < 3 && !hideOrientation"
      :title="$gettext('orientations')"
      class="has-text-normal"
    >
      {{ route.orientations.join(', ') }},
    </span>
    <document-rating :document="route" class="has-text-normal" />
    <marker-gps-trace v-if="route.geometry.has_geom_detail" class="has-text-normal" />
    <span v-if="!hideArea" class="has-text-normal">
      <em v-for="area in rangeAreas" :key="area.document_id">
        &hairsp;&bull;&hairsp;
        <small>
          <document-title :document="area" />
        </small>
      </em>
    </span>
  </span>
</template>

<script>
export default {
  props: {
    route: {
      type: Object,
      required: true,
    },
    hideActivities: {
      type: Boolean,
      default: false,
    },
    hideArea: {
      type: Boolean,
      default: false,
    },
    hideOrientation: {
      type: Boolean,
      default: false,
    },
    hideHeightDiffDifficulties: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    rangeAreas() {
      return this.route.areas.filter((area) => area.area_type === 'range');
    },
    heightUpText() {
      if (
        this.route.activities &&
        (this.route.activities.includes('skitouring') ||
          this.route.activities.includes('snowshoeing') ||
          this.route.activities.includes('hiking'))
      ) {
        if (this.route.height_diff_up) return '+' + this.route.height_diff_up;
        if (this.route.height_diff_down) return '-' + this.route.height_diff_down;
      }
      return '';
    },
    heightDiffText() {
      if (this.hideHeightDiffDifficulties) return '';
      var act = this.route.activities;
      if (!act) return;
      var is_ski_alpinism = act.includes('skitouring') && this.route.ski_rating >= '4';
      var is_alpinism =
        act.includes('snow_ice_mixed') ||
        act.includes('mountain_climbing') ||
        act.includes('rock_climbing') ||
        act.includes('ice_climbing');
      // don't clutter with difficulties for "easy" activities
      if (this.heightUpText && !(is_ski_alpinism || is_alpinism)) return '';
      var dd = this.route.height_diff_difficulties;
      if (!dd || (this.heightUpText && dd === this.route.height_diff_up)) return '';
      // to differentiate the 2 heights, use explicit symbol ↕ similar to `arrows-alt-v` in RouteCard
      var prefix = this.heightUpText ? '\u2195\ufe0e ' : '';
      return prefix + dd;
    },
  },
};
</script>

<style scoped lang="scss">
.icon-activities {
  line-height: 1;
}

@media print {
  .is-size-4 {
    font-size: 1rem !important;
  }
}
</style>
