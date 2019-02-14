<template>
  <activities :activities="activities" class="has-text-primary is-size-4 is-ellipsed"/>
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
