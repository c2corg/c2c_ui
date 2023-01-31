<template>
  <span>
    <span class="has-text-normal">
      {{ outing.date_end }}
      &hairsp;&bull;&hairsp;
    </span>
    <document-title :document="outing" />
    <span class="has-text-normal">
      <activities :activities="outing.activities" class="is-size-4 has-text-secondary icon-activities" />
      &hairsp;&bull;&hairsp;
      {{ outing.author.name }}
      &hairsp;&bull;&hairsp;
      <marker-condition :condition="outing.condition_rating" />
      <marker-quality :quality="outing.quality" />
      <marker-image-count v-if="outing.img_count != 0" :image-count="outing.img_count" />
      <marker-gps-trace v-if="outing.geometry.has_geom_detail" />
      <marker-soft-mobility v-if="outing.public_transport" />
    </span>
  </span>
</template>

<script>
export default {
  props: {
    outing: {
      type: Object,
      required: true,
    },
  },
};
</script>
