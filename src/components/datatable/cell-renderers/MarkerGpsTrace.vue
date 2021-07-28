<template>
  <marker-gps-trace v-show="params.data.geometry.has_geom_detail" />
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({});
</script>
