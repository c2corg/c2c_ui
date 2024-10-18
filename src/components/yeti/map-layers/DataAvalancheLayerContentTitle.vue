<template>
  <span>
    <fa-icon icon="gear" />
    <span>{{ layer.title }}</span>
  </span>
</template>

<script>
export default {
  props: {
    layer: {
      type: Object,
      required: true,
    },
  },
};
</script>
