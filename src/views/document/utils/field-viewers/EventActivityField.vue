<template>
  <label-value :label="$gettext('activity')">
    <icon-event-activity :event-activity="document.event_activity" class="is-size-3 has-text-secondary" />
  </label-value>
</template>

<script>
import LabelValue from './LabelValue';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  components: { LabelValue },
  mixins: [requireDocumentProperty],
};
</script>

<style lang="scss" scoped>
@media print {
  .is-size-3 {
    font-size: 1rem !important;
  }
}
</style>
