<template>
  <card-container :document="document" :target="target" :highlighted="highlighted">
    <card-title>
      <document-title :document="document" class="is-ellipsed-tablet" />
    </card-title>

    <card-row>
      <card-region-item :document="document" />
    </card-row>

    <card-row>
      <span class="is-nowrap">
        <icon-ratings class="card-icon" />
        <document-rating :document="document" />
      </span>

      <card-elevation-item :elevation="document.elevation_max" class="is-ellipsed" />

      <span v-if="document.height_diff_up" class="is-ellipsed" :title="$gettext('height_diff_up')">
        <icon-height-diff-up class="card-icon" />
        {{ document.height_diff_up }}&nbsp;m
      </span>

      <span v-if="document.height_diff_difficulties" class="is-ellipsed" :title="$gettext('height_diff_difficulties')">
        <fa-icon icon="arrows-alt-v" class="card-icon" />
        {{ document.height_diff_difficulties }}&nbsp;m
      </span>
    </card-row>

    <card-row>
      <card-activities-item :activities="document.activities" />

      <span class="card-icon">
        <!-- Englobing span is mandatory for tooltip ?? -->
        <marker-gps-trace v-if="document.geometry.has_geom_detail" />
        <marker-soft-mobility v-if="$documentUtils.hasSoftMobility(document)" />
      </span>

      <span
        v-if="document.orientations && document.orientations.length != 0"
        class="is-ellipsed"
        :title="$gettext('orientations')"
      >
        <fa-icon icon="compass" class="card-icon" />
        {{ document.orientations.join(', ') }}
      </span>

      <marker-quality :quality="document.quality" />
    </card-row>
  </card-container>
</template>

<script>
import { documentCardMixin } from './utils/mixins';

export default {
  mixins: [documentCardMixin],
};
</script>
