<template>
  <div v-if="fundraiser" class="notification is-info is-light no-print fundraiser-banner">
    <fa-icon :icon="['miscs', 'drill']" class="fundraiser-icon has-text-danger" fixed-width />
    <span class="fundraiser-message">{{ message }}</span>
    <a :href="fundraiser.url" target="_blank" rel="noopener" class="button is-small is-info">
      <span v-translate>Contribute to maintainance</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import getFundraiser from '@/js/get-fundraiser';

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
});

const { $gettext } = useGlobalProperties();

const fundraiser = computed(() => getFundraiser(props.document));

const message = computed(() => {
  return fundraiser.value?.message
    ? $gettext(fundraiser.value.message)
    : $gettext('This site is maintained by local actors. Support them to help keep it open!');
});
</script>

<style scoped>
.fundraiser-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fundraiser-icon {
  font-size: 1.5rem;
}

.fundraiser-message {
  flex: 1;
}
</style>
