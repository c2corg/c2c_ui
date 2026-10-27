<template>
  <fa-icon :icon="['activity', regularActivity]" :class="'no-print'" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  eventActivity: {
    type: String,
    required: true,
  },
});

const regularActivity = computed(() => {
  // Event activity is dedicated to Xreports
  // it can be on of [other, alpine_climbing, multipitch_climbing, sport_climbing]
  // this function give the closest regular activity from it
  switch (props.eventActivity) {
    case 'other':
      return 'other';
    case 'alpine_climbing':
      return 'mountain_climbing';
    case 'multipitch_climbing':
    case 'sport_climbing':
      return 'rock_climbing';
    default:
      return props.eventActivity;
  }
});
</script>
