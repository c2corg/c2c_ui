<template>
  <span class="has-hover-background">
    <document-title :document="route" />
    <activities
      v-if="!hideActivities"
      :activities="route.activities"
      class="is-size-4 has-text-secondary icon-activities"
    />
    <span v-if="heightUpText" :title="$gettext('height_diff_up')" class="has-text-normal .is-nowrap">
      {{ heightUpText }}&#8202;m
    </span>
    <span :title="$gettext('height_diff_difficulties')" class="has-text-normal .is-nowrap">
      {{ heightDiffText }},
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

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
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
});

const rangeAreas = computed(() =>
  (props.route.areas as { document_id: number; area_type: string }[]).filter((area) => area.area_type === 'range')
);

const heightUpText = computed(() => {
  const route = props.route;
  if (
    route.activities &&
    (route.activities.includes('skitouring') ||
      route.activities.includes('snowshoeing') ||
      route.activities.includes('hiking'))
  ) {
    if (route.height_diff_up) return '+' + route.height_diff_up;
    if (route.height_diff_down) return '-' + route.height_diff_down;
  }
  return '';
});

const heightDiffText = computed(() => {
  if (props.hideHeightDiffDifficulties) return '';
  const act: string[] | undefined = props.route.activities;
  if (!act) return;
  const is_alpinism =
    act.includes('snow_ice_mixed') ||
    act.includes('mountain_climbing') ||
    act.includes('rock_climbing') ||
    act.includes('ice_climbing') ||
    act.includes('skitouring');
  // don't clutter with difficulties for "easy" activities
  if (heightUpText.value && !is_alpinism) return '';
  const dd = props.route.height_diff_difficulties;
  if (!dd || (heightUpText.value && dd === props.route.height_diff_up)) return '';
  // to differentiate the 2 heights, use parenthesis
  const ddstr = dd + '\u200am';
  return heightUpText.value ? '(' + ddstr + ')' : ddstr;
});
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
