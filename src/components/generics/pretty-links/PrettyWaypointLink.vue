<template>
  <document-link :document="waypoint" class="pretty-waypoint-link has-hover-background">
    <pretty-waypoint :waypoint="waypoint" />
  </document-link>
</template>

<script setup lang="ts">
defineProps({
  waypoint: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped lang="scss">
.pretty-waypoint-link {
  display: block;
}
</style>
