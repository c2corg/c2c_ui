<template>
  <card-container :document="document" :target="target" :highlighted="highlighted">
    <card-title>
      <document-title :document="document" />
    </card-title>

    <card-row>
      <span>
        {{ $gettext(document.area_type, 'area_types') | uppercaseFirstLetter }}
      </span>
    </card-row>
  </card-container>
</template>

<script>
import { documentCardMixin } from './utils/mixins';

export default {
  mixins: [documentCardMixin],
};
</script>
