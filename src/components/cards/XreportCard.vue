<template>
  <card-container :document="document" :target="target" :highlighted="highlighted">
    <card-title>
      <document-title :document="document" uppercase-first-letter class="is-ellipsed" />
    </card-title>

    <card-row>
      <card-region-item :document="document" />

      <card-elevation-item :elevation="document.elevation" />
    </card-row>

    <card-row>
      <span class="is-ellipsed" v-if="document.event_type">
        {{ $gettext(document.event_type, 'event_types') }}
      </span>
    </card-row>

    <card-row>
      <card-event-activity-item :event-activity="document.event_activity" />

      <span class="is-nowrap">
        {{ $dateUtils.toLocalizedString(document.date, 'll') }}
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
