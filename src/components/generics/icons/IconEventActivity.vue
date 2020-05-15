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

      if (this.eventActivity === 'other') return 'other';
      else if (this.eventActivity === 'alpine_climbing') return 'mountain_climbing';
      else if (this.eventActivity === 'multipitch_climbing') return 'rock_climbing';
      else if (this.eventActivity === 'sport_climbing') return 'rock_climbing';
      else return this.eventActivity;
    },
  },
};
</script>
