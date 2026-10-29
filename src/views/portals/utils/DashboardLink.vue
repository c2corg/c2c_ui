<template>
  <document-link :document="document" class="dashboard-link has-text-normal is-flex has-hover-background">
    <activities
      :activities="document.activities"
      class="is-size-3 activity-icons"
      :class="{ 'is-2-columns': isMultiActivities }"
    />
    <span class="dashboard-link-main">
      <document-title :document="document" class="document-title" />
      <document-title
        v-for="area of rangeAreas"
        :key="area.document_id"
        :document="area"
        class="is-size-7 area-title is-italic"
      />
    </span>
    <span class="has-text-right">
      <slot />
    </span>
  </document-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
});

const rangeAreas = computed(() => {
  let result = props.document.areas.filter((area: C2cDocument) => area.area_type === 'range');

  result =
    result.length !== 0
      ? result
      : props.document.areas.filter((area: C2cDocument) => area.area_type === 'admin_limits');
  result = result.length !== 0 ? result : props.document.areas;

  return result;
});

const isMultiActivities = computed(() => (props.document.activities.length > 1 ? true : false));
</script>

<style scoped lang="scss">
.dashboard-link {
  align-items: center;

  .activity-icons {
    line-height: 1;
    display: flex;
    flex-wrap: nowrap;
  }

  .dashboard-link-main {
    flex-grow: 1;
    padding-left: 3px;
    padding-right: 3px;
  }

  .document-title:after {
    content: '\0000a0\002022\0000a0'; //&nbsp;&bull;&nbsp;
  }

  .area-title:not(:last-child):after {
    content: ', ';
  }
}

.dashboard-link:visited {
  color: $grey-light;
}

@media screen and (max-width: $tablet) {
  .is-2-columns {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
