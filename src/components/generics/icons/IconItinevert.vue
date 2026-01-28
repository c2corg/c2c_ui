<template>
  <fa-icon icon="bus" :fixed-width="fixedWidth" name="IconItinevert" />
</template>

<script>
export default {
  props: {
    fixedWidth: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
