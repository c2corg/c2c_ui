<template>
  <span>
    {{ $dateUtils.toLocalizedString(params.data.date_end, 'PP') }}
  </span>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({});
</script>
