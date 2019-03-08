<template>
  <card-container :document="notClickable ? null : document" :highlighted="highlighted">
    <card-title>
      <document-title :document="document" />
    </card-title>

    <card-row>
      <textual-array :array="document.book_types" i18n i18n-context="book_types" />
    </card-row>

    <card-row>
      <span>
        <fa-icon icon="pen" />
        {{ document.author }}
      </span>
    </card-row>

    <card-row>
      <card-activities-item :activities="document.activities" />
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
