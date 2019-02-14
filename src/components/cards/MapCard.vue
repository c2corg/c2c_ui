<template>
  <card-container :document="notClickable ? null : document" :highlighted="highlighted">
    <card-title>
      <document-title :document="document"/>
    </card-title>

    <card-row>
      <card-region-item :document="document"/>
    </card-row>

    <card-row>
      <span>{{ document.code }} - {{ document.editor }}</span>
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
