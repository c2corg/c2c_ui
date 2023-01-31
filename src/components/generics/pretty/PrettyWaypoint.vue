<template>
  <span>
    <span :title="$gettext(waypoint.waypoint_type, 'waypoint_types')">
      <icon-waypoint-type :waypoint-type="waypoint.waypoint_type" class="has-text-normal" />
    </span>
    <span>&#8239;</span>
    <!-- thin space -->
    <document-title :document="waypoint" /><span class="has-text-normal">, {{ waypoint.elevation }}&nbsp;m</span>
  </span>
</template>

<script>
export default {
  props: {
    waypoint: {
      type: Object,
      required: true,
    },
  },
};
</script>
