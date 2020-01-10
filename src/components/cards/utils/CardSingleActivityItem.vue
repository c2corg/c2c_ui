<template>
  <activities :activities="activities" class="card-icon is-size-2 is-ellipsed icon-activities has-text-secondary" />
</template>

<script>
  export default {
    props: {
      activity: {
        type: String,
        default: null
      }
    },
    computed: {
      activities() {
        if (!this.activity) return [];
        else if (this.activity === 'other') return [];
        else if (this.activity === 'alpine_climbing') return ['mountain_climbing'];
        else if (this.activity === 'multipitch_climbing') return ['rock_climbing'];
        else if (this.activity === 'sport_climbing') return ['rock_climbing'];
        else return [this.activity];
      }
    }
  };
</script>

<style lang="scss">
  .icon-activities{
    line-height: 1;
    height: 1em;
  }
</style>
