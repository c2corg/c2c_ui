<template>
  <div class="transport-accessibility">
    <accessibility-badge :result="displayedResult" :duration-unknown="durationUnknown" />
    <verify-accessibility-button
      :document="document"
      :transport-context="transportContext"
      @verified="checkedResult = $event"
    />
  </div>
</template>

<script setup lang="ts">
// The round-trip check of a route or a waypoint found by a public transport search: its badge, and the button to check
// its schedules (cards and table of the lists)
import { computed, type PropType, ref } from 'vue';

import { documentProperty } from '@/js/properties';
import { isDurationUnknown, type RoundTripResult } from '@/js/transport-accessibility';
import type { TransportContext } from '@/js/transport-query';

const props = defineProps({
  ...documentProperty,
  transportContext: {
    type: Object as PropType<TransportContext>,
    required: true,
  },
});

// the check of this document alone, else the one of the page
const checkedResult = ref<RoundTripResult | null>(null);
const displayedResult = computed(
  () => checkedResult.value ?? props.transportContext.results?.[props.document.document_id!] ?? null
);
const durationUnknown = computed(() => isDurationUnknown(props.document as { duration_unknown?: boolean }));
</script>

<style scoped>
.transport-accessibility {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.375rem;
}
</style>
