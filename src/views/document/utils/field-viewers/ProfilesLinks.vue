<template>
  <span v-if="profiles.length">
    <icon-profile class="is-size-5" />
    <document-link
      v-for="profile of profiles"
      :key="profile.document_id"
      :document="profile"
      class="user-link-label"
      :class="profile.categories"
      uppercase-first-letter
    />
  </span>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

defineProps({
  profiles: {
    type: Array as PropType<C2cDocument[]>,
    required: true,
  },
});
</script>

<style scoped>
.user-link-label:not(:last-child)::after {
  content: ', ';
}
.mountain_guide {
  color:red;
}
</style>
