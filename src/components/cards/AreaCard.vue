<template>
  <card-container :document="document" :target="target" :highlighted="highlighted">
    <card-title>
      <document-title :document="document" />
    </card-title>

    <card-row>
      <span>
        {{ $filters.uppercaseFirstLetter($gettext(document.area_type, 'area_types')) }}
      </span>
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
