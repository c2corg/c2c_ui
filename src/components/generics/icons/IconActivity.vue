<template>
  <fa-icon :icon="['activity', activity]" />
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
