<template>
  <fa-icon :icon="['activity', regularActivity]" :class="'no-print'" />
</template>

<script>
export default {
  props: {
    eventActivity: {
      type: String,
      required: true,
    },
  },

  computed: {
    regularActivity() {
      // Event activity is dedicated to Xreports
      // it can be on of [other, alpine_climbing, multipitch_climbing, sport_climbing]
      // this function give the closest regular activity from it
      switch (this.eventActivity) {
        case 'other':
          return 'other';
        case 'alpine_climbing':
          return 'mountain_climbing';
        case 'multipitch_climbing':
        case 'sport_climbing':
          return 'rock_climbing';
        default:
          return this.eventActivity;
      }
    },
  },
};
</script>
