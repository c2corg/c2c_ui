<template>
  <card-container :document="document" :target="target" :highlighted="highlighted">
    <card-title>
      <document-title :document="document" />
    </card-title>

    <card-row>
      <textual-array :array="document.categories" i18n i18n-context="article_categories" />
    </card-row>

    <card-row>
      <span>
        <icon-creative-commons />
        <span>{{ $gettext(document.article_type, 'article_types') }}</span>
      </span>
    </card-row>

    <card-row>
      <card-activities-item :activities="document.activities" />
      <marker-quality :quality="document.quality" />
    </card-row>
  </card-container>
</template>

<script setup lang="ts">
import CardActivitiesItem from './utils/CardActivitiesItem.vue';
import CardContainer from './utils/CardContainer.vue';
import CardRow from './utils/CardRow.vue';
import CardTitle from './utils/CardTitle.vue';
import { cardProps } from './utils/card';

import { documentProperty } from '@/js/properties';

defineProps({ ...cardProps, ...documentProperty });
</script>
