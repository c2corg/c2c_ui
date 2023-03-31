<template>
  <li>
    <document-link :document="article" class="dashboard-link has-text-normal is-flex has-hover-background">
      <span class="dashboard-link-main">
        <document-title :document="article" class="document-title" />
      </span>
      <slot />
    </document-link>
  </li>
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
