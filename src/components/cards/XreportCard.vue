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
      <span class="is-ellipsed">
        {{ $gettext(document.event_type, 'event_types') }}
      </span>

    </card-row>

    <card-row>
      <card-single-activity-item :activity="document.event_activity" />

      <span class="is-nowrap">
        {{ $moment.parseDate(document.date).locale(this.$language.current).format("LL") }}
      </span>

      <marker-quality :quality="document.quality" />
    </card-row>

  </card-container>
</template>

<script>

  import { documentCardMixin } from './utils/mixins.js';

  export default {
    mixins: [
      documentCardMixin
    ]
  };
</script>
