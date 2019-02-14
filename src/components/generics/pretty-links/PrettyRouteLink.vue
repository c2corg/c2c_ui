<template>
  <document-link :document="route" class="pretty-route-link has-hover-background">
    <activities v-if="!hideActivities" :activities="route.activities" class="is-size-4 has-text-dark"/>
    <document-title :document="route"/>,
    <span
      v-if="route.height_diff_difficulties && !hideHeightDiffDifficulties"
      :title="$gettext('height_diff_difficulties')"
      class="has-text-dark">
      {{ route.height_diff_difficulties }}&nbsp;m,
    </span>
    <span
      v-if="route.orientations && !hideOrientation"
      :title="$gettext('orientations')"
      class="has-text-dark">
      {{ route.orientations.join(', ') }},
    </span>
    <route-rating :document="route" class="has-text-dark"/>
    <marker-gps-trace v-if="route.geometry.has_geom_detail" class="has-text-dark"/>
    <span v-if="!hideArea" class="has-text-dark">
      <em v-for="area in route.areas" v-if="area.area_type=='range'"
          :key="area.document_id">
        &hairsp;&bull;&hairsp;
        <small>
          <document-title :document="area"/>
        </small>
      </em>
    </span>
  </document-link>
</template>

<script>

  export default {
    props: {
      route: {
        type: Object,
        required: true
      },
      hideActivities: {
        type: Boolean,
        default: false
      },
      hideArea: {
        type: Boolean,
        default: false
      },
      hideOrientation: {
        type: Boolean,
        default: false
      },
      hideHeightDiffDifficulties: {
        type: Boolean,
        default: false
      }

    }
  };
</script>

<style scoped lang="scss">

    .pretty-route-link{
        display:block
    }

</style>
