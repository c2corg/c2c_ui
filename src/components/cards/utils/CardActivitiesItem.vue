<template>
  <activities :activities="activities" class="card-icon is-size-2 is-ellipsed icon-activities has-text-secondary"/>
</template>

<script>
  export default {
    props: {
      activities: {
        type: Array,
        default: null
      }
    }
  };
</script>

<style lang="scss">
  .icon-activities{
    line-height: 1;
  }
</style>
