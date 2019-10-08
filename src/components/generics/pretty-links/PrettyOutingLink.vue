<template>
  <document-link :document="outing" class="pretty-outing-link has-hover-background">
    <marker-quality :quality="outing.quality" class="has-text-normal" />
    <marker-condition :condition="outing.condition_rating" />
    <span class="has-text-normal">
      {{ outing.date_end }}
      :
    </span>
    <document-title :document="outing" />
    <span class="has-text-normal">
      &hairsp;&bull;&hairsp;
      {{ outing.author.name }}
    </span>
    <span v-if="outing.img_count!=0 || outing.geometry.has_geom_detail" class="has-text-normal">
      &hairsp;&bull;&hairsp;
      <marker-image-count v-if="outing.img_count!=0" :image-count="outing.img_count" />
      <marker-gps-trace v-if="outing.geometry.has_geom_detail" />
    </span>
  </document-link>
</template>

<script>
  export default {
    props: {
      outing: {
        type: Object,
        required: true
      }
    }
  };
</script>

<style scoped lang="scss">

    .pretty-outing-link{
        display:block
    }

</style>
