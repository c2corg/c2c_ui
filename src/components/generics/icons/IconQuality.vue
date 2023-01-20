<template>
  <fa-icon :icon="['quality', quality]" :fixed-width="fixedWidth" />
</template>

<script>
export default {
  props: {
    quality: {
      type: String,
      required: true,
    },
    fixedWidth: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
