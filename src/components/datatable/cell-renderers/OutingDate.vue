<template>
  <span>
    {{ $dateUtils.toLocalizedString(params.data.date_end, 'PP') }}
  </span>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({});
</script>
