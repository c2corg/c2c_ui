<template>
  <label-value :label="$gettext('activities')">
    <activities :activities="document.activities" class="is-size-3 has-text-secondary" />
  </label-value>
</template>

<script>
import LabelValue from './LabelValue';

import { documentProperty } from '@/js/properties';

export default {
  components: { LabelValue },
  props: { ...documentProperty },
};
</script>

<style lang="scss" scoped>
@media print {
  .is-size-3 {
    font-size: 1rem !important;
  }
}
</style>
