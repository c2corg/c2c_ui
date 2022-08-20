<template>
  <document-link :document="article" class="dashboard-link has-text-normal is-flex has-hover-background">
    <span class="dashboard-link-main is-ellipsed">
      <document-title :document="article" class="document-title" />
    </span>
    <span class="is-nowrap">
      <slot />
    </span>
  </document-link>
</template>

<script>
export default {
  props: {
    article: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
.dashboard-link {
  .dashboard-link-main {
    flex-grow: 1;
    padding-left: 3px;
    padding-right: 3px;
  }
}
.dashboard-link:visited {
  color: $grey-light;
}
</style>
