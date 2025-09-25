<template>
  <card-container :document="document" :target="target" :highlighted="highlighted">
    <card-title>
      <span class="is-ellipsed-tablet">
        <icon-waypoint-type :waypoint-type="document.waypoint_type" />
        <document-title :document="document" />
      </span>
    </card-title>

    <card-row>
      <card-region-item :document="document" />
    </card-row>

    <card-row>
      <card-elevation-item :elevation="document.elevation" />

      <textual-array :array="document.slackline_types" i18n i18n-context="slackline_types" />

      <marker-soft-mobility v-if="$documentUtils.hasSoftMobility(document)" />

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
