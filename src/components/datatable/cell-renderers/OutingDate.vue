<template>
  <span>
    {{ $moment.toLocalizedString(params.data.date_start, 'LL') }}
  </span>
</template>

<script>
  import Vue from 'vue';

  export default Vue.extend({ });
</script>
