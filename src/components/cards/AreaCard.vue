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

<script setup lang="ts">
import CardContainer from './utils/CardContainer.vue';
import CardRow from './utils/CardRow.vue';
import CardTitle from './utils/CardTitle.vue';
import { cardProps } from './utils/card';

import { documentProperty } from '@/js/properties';

defineProps({ ...cardProps, ...documentProperty });
</script>
