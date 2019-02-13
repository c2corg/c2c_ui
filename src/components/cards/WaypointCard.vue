<template>
  <card-container :document="notClickable ? null : document" :highlighted="highlighted">
    <card-title>
      <span>
        <icon-waypoint-type :waypoint-type="document.waypoint_type"/>
        <document-title :document="document"/>
      </span>
    </card-title>

    <card-row>
      <card-region-item :document="document"/>
    </card-row>

    <card-row>
      <card-elevation-item :elevation="document.elevation"/>

      <textual-array :array="document.slackline_types" i18n i18n-context="slackline_types"/>

      <marker-quality :quality="document.quality"/>
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
