<template>
  <fa-icon :icon="['activity', activity]" :class="'no-print'"/>
</template>

<script>

  export default {
    props: {
      activity: {
        type: String,
        required: true
      }
    }
  };
</script>
