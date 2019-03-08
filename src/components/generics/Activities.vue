<template>
  <span v-if="activities !== null">
    <span v-for="activity of activities" :key="activity" :title="$gettext(activity, 'activities')">
      <icon-activity :activity="activity" />
    </span>
  </span>
</template>

<script>
  export default {
    props: {
      activities: {
        type: Array,
        default: null // many object can contains null array for this...
      }
    }
  };
</script>
