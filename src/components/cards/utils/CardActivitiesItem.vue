<template>
  <activities :activities="activities" class="card-icon is-size-2 is-ellipsed icon-activities has-text-secondary" />
</template>

<script setup lang="ts">
defineProps({
  activities: {
    type: Array,
    default: null,
  },
});
</script>

<style lang="scss">
.icon-activities {
  line-height: 1;
}
</style>
