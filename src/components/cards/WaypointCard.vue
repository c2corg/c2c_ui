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

      <marker-quality :quality="document.quality" />
    </card-row>

    <card-row v-if="transportContext" class="accessibility-row">
      <accessibility-badge :result="displayedAccessibilityResult" />
      <verify-accessibility-button
        :document="document"
        :transport-context="transportContext"
        @verified="unitAccessibilityResult = $event"
      />
    </card-row>
  </card-container>
</template>

<script>
import { documentCardMixin } from './utils/mixins';

export default {
  mixins: [documentCardMixin],

  data() {
    return {
      unitAccessibilityResult: null,
    };
  },

  computed: {
    displayedAccessibilityResult() {
      return this.unitAccessibilityResult ?? this.transportContext?.results?.[this.document.document_id] ?? null;
    },
  },
};
</script>

<style scoped lang="scss">
.accessibility-row {
  flex-wrap: wrap;
  align-items: flex-start;
}
</style>
