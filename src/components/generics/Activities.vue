<template>
  <span v-if="activities !== null">
    <span
      v-for="activity of sortedActivities"
      :key="activity"
      :title="$gettext(activity, 'activities')"
      class="replace-icon-by-names-on-print"
    >
      <icon-activity :activity="activity" />
    </span>
  </span>
</template>

<script>
export default {
  props: {
    activities: {
      type: Array,
      default: null, // many object can contains null array for this...
    },
  },
  computed: {
    sortedActivities() {
      return this.activities.slice(0).sort();
    },
  },
};
</script>

<style scoped lang="scss">
@media print {
  /*write the activity's title instead of the icon*/
  .replace-icon-by-names-on-print {
    color: $text !important;
  }

  .replace-icon-by-names-on-print:not(:last-child):after {
    content: attr(title) ', ';
  }

  .replace-icon-by-names-on-print:last-child:after {
    content: attr(title);
  }
}
</style>
