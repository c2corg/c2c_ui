<template>
  <div v-if="(document.cooked[field.name] && field.isVisibleFor(document)) || $slots.after">
    <h2 v-if="field.name !='summary' && !hideTitle" class="title is-2" >
      {{ (title || $gettext(field.name)) | uppercaseFirstLetter }}
    </h2>
    <markdown
      v-if="document.cooked[field.name]"
      :class="{'is-italic':field.name==='summary'}"
      :content="document.cooked[field.name]"/>
    <slot name="after" />
  </div>
</template>

<script>
  import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins';

  export default {

    mixins: [ requireDocumentProperty, requireFieldProperty ],

    props: {
      hideTitle: {
        type: Boolean,
        default: false
      },
      title: {
        type: String,
        default: null
      }
    }
  };
</script>

<style lang="scss" scoped>
  .title{
    font-size:1.8rem!important;
    margin-bottom:0.5em!important;
    border-bottom:1px solid #DDD;
  }
</style>
