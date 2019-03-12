<template>
  <fa-icon :icon="['activity', activity]" :class="'no-print'"/>
</template>

<script lang="ts">

  export default {
    props: {
      activity: {
        type: String,
        required: true
      }
    }
  };
</script>
