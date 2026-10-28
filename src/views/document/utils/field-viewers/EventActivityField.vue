<template>
  <label-value :label="$gettext('activity')">
    <icon-event-activity :event-activity="document.event_activity" class="is-size-3 has-text-secondary" />
  </label-value>
</template>

<script setup lang="ts">
import LabelValue from './LabelValue.vue';

import { documentProperty } from '@/js/properties';

defineProps({ ...documentProperty });
</script>

<style lang="scss" scoped>
@media print {
  .is-size-3 {
    font-size: 1rem !important;
  }
}
</style>
