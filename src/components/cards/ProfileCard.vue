<template>
  <card-container :document="document" :target="target" :highlighted="highlighted">
    <card-title>
      <document-title :document="document" />
    </card-title>

    <card-row>
      <card-region-item :document="document" />
      <span class="is-nowrap">
        <icon-forum />
        @{{ document.forum_username }}
      </span>
    </card-row>

    <card-row>
      <card-activities-item v-if="document.activities" :activities="document.activities" />
      &nbsp;

      <textual-array
        v-if="document.categories"
        :array="document.categories"
        i18n
        i18n-context="user_categories"
        class="is-ellipsed"
      />
    </card-row>
  </card-container>
</template>

<script setup lang="ts">
import CardActivitiesItem from './utils/CardActivitiesItem.vue';
import CardContainer from './utils/CardContainer.vue';
import CardRegionItem from './utils/CardRegionItem.vue';
import CardRow from './utils/CardRow.vue';
import CardTitle from './utils/CardTitle.vue';
import { cardProps } from './utils/card';

import { documentProperty } from '@/js/properties';

defineProps({ ...cardProps, ...documentProperty });
</script>
