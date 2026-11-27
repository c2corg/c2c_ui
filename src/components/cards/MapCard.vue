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

<script setup lang="ts">
import CardContainer from './utils/CardContainer.vue';
import CardRegionItem from './utils/CardRegionItem.vue';
import CardRow from './utils/CardRow.vue';
import CardTitle from './utils/CardTitle.vue';
import { cardProps } from './utils/card';

import { documentProperty } from '@/js/properties';

defineProps({ ...cardProps, ...documentProperty });
</script>
