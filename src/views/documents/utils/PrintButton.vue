<template>
  <a target="_blank" :href="path">
    <button class="button is-primary is-size-7-mobile">Print search results</button>
  </a>
</template>

<script>
export default {
  computed: {
    path() {
      return '/print' + this.$route.fullPath;
    },
  },
};
</script>
