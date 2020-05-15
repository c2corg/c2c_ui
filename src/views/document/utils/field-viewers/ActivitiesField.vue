<template>
  <label-value :label="$gettext('activities')">
    <activities :activities="document.activities" class="is-size-3 has-text-secondary" />
  </label-value>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

import LabelValue from './LabelValue';

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
