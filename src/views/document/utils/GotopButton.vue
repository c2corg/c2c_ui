<template>
  <span class="gotop-button" @click="onClick" :title="$gettext('Back to the top')">
    <fa-icon icon="arrow-up" />
  </span>
</template>

<script>
export default {
  methods: {
    onClick() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  },
};
</script>

<style scoped lang="scss">
.gotop-button {
  cursor: pointer;
}
</style>
