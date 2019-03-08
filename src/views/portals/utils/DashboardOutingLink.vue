<template>
  <document-link :document="outing" class="outing-row">
    <span>
      <activities :activities="outing.activities" class="is-size-3 activity-icon" />
      <document-title :document="outing" />
      &hairsp;&bull;&hairsp;
      <em v-for="area of rangeAreas" :key="area.document_id">
        <small>
          <document-title :document="area" />
        </small>
      </em>
    </span>
    <span class="is-pulled-right">
      <marker-image-count :image-count="outing.img_count" />
      <marker-condition :condition="outing.condition_rating" />
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
    },

    computed: {
      rangeAreas() {
        return this.outing.areas.filter((area) => area.area_type === 'range');
      }
    }
  };
</script>

<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    .outing-row{
        display:block;
        color:$text;
        padding:0 2px;

        .activity-icon{
            display: inline-block;
            line-height: 1;
            vertical-align: bottom;
        }

        > span{
            vertical-align: top
        }

    }

    .outing-row:hover{
        background: $hover-background;
    }

    .outing-row:visited{
        color: $grey-light;
    }
</style>
