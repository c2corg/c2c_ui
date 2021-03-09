<template>
  <fa-icon :icon="['quality', quality]" />
</template>

<script>
export default {
  props: {
    quality: {
      type: String,
      required: true,
    },
  },
};
</script>
