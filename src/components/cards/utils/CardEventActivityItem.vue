<template>
  <icon-event-activity
    :event-activity="eventActivity"
    class="card-icon is-size-2 is-ellipsed icon-activities has-text-secondary"
  />
</template>

<script setup lang="ts">
defineProps({
  eventActivity: {
    type: String,
    default: null,
  },
});
</script>

<style scoped lang="scss">
.icon-activities {
  line-height: 1;
  height: 1em;
}
</style>
