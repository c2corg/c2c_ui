<template>
  <!-- <span :class="'icon-quality-' + quality"/> -->
  <fa-icon :icon="['quality', quality]" />
</template>

<script lang="ts">
  export default {
    props: {
      quality: {
        type: String,
        required: true
      }
    }
  };
</script>
