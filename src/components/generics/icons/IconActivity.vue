<template>
  <fa-icon :icon="['activity', activity]" :class="'no-print'" />
</template>

<script setup lang="ts">
defineProps({
  activity: {
    type: String,
    required: true,
  },
});
</script>
