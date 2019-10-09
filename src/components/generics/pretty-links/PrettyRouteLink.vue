<template>
  <document-link :document="route" class="pretty-route-link has-hover-background">
    <activities
      v-if="!hideActivities"
      :activities="route.activities"
      class="is-size-3 has-text-secondary icon-activities" />
    <span>&nbsp;</span>
    <document-title :document="route" />,
    <span
      v-if="route.height_diff_difficulties && !hideHeightDiffDifficulties"
      :title="$gettext('height_diff_difficulties')"
      class="has-text-normal">
      {{ route.height_diff_difficulties }}&nbsp;m,
    </span>
    <span
      v-if="route.orientations && !hideOrientation"
      :title="$gettext('orientations')"
      class="has-text-normal">
      {{ route.orientations.join(', ') }},
    </span>
    <document-rating :document="route" class="has-text-normal" />
    <marker-gps-trace v-if="route.geometry.has_geom_detail" class="has-text-normal" />
    <span v-if="!hideArea" class="has-text-normal">
      <em v-for="area in rangeAreas" :key="area.document_id">
        &hairsp;&bull;&hairsp;
        <small>
          <document-title :document="area" />
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
    },

    computed: {
      rangeAreas() {
        return this.route.areas.filter((area) => area.area_type === 'range');
      }
    }
  };
</script>

<style scoped lang="scss">

  .pretty-route-link{
    display:block
  }

  .icon-activities{
    line-height: 1;
  }

</style>
