<template>
  <card-container :document="document" :target="target" :highlighted="highlighted">
    <card-title>
      <document-title :document="document" />
    </card-title>

    <card-row>
      <card-region-item :document="document" />
    </card-row>

    <card-row>
      <span>{{ document.code }} - {{ document.editor }}</span>
    </card-row>
  </card-container>
</template>

<script>
import { cardComponents, cardProps } from './utils/card';

import { documentProperty } from '@/js/properties';

export default {
  components: { ...cardComponents },

  props: { ...cardProps, ...documentProperty },
};
</script>
