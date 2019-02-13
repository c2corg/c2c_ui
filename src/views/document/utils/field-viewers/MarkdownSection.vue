<template>
  <div v-if="(document.cooked[field.name] && field.isVisibleFor(document)) || $slots.after">
    <h3 v-if="field.name !='summary' && !hideTitle" class="title is-3" >
      {{ (title || $gettext(field.name)) | uppercaseFirstLetter }}
    </h3>
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
