<template>
  <document-link :document="document" class="dashboard-link has-text-normal is-flex has-hover-background">
    <activities :activities="document.activities" class="is-size-3 activity-icons is-nowrap" />
    <span class="dashboard-link-main" :class="{ 'is-ellipsed': !$screen.isMobile }">
      <document-title :document="document" class="document-title" />
      <document-title
        v-for="area of rangeAreas"
        :key="area.document_id"
        :document="area"
        class="is-size-7 area-title is-italic"
      />
    </span>
    <span class="is-nowrap">
      <slot />
    </span>
  </document-link>
</template>

<script>
export default {
  props: {
    document: {
      type: Object,
      required: true,
    },
  },

  computed: {
    rangeAreas() {
      let result = this.document.areas.filter((area) => area.area_type === 'range');

      result = result.length !== 0 ? result : this.document.areas.filter((area) => area.area_type === 'admin_limits');
      result = result.length !== 0 ? result : this.document.areas;

      return result;
    },
  },
};
</script>

<style scoped lang="scss">
.dashboard-link {
  .activity-icons {
    line-height: 1;
  }

  .dashboard-link-main {
    flex-grow: 1;
    padding-left: 3px;
    padding-right: 3px;
  }

  .document-title:after {
    content: '\0000a0\002022\0000a0'; //&nbsp;&bull;&nbsp;
  }

  .area-title:not(:last-child):after {
    content: ', ';
  }
}

.dashboard-link:visited {
  color: $grey-light;
}
</style>
