<template>
  <div>
    <div class="columns is-mobile"> <!--level must be in a single element to remove bottim margin : TODO remove ugly hack -->
      <div class="column query-bound-value-left">
        <span v-if="field.i18n">{{ $gettext(value[0], field.i18nContext) | uppercaseFirstLetter }}</span>
        <span v-else>{{ value[0] }}</span>
        <span v-if="field.unit">&nbsp;{{ field.unit }}</span>
      </div>
      <!-- class depends on i18n ???
        * if values are text (like awful, good... for conditions), we can't know which one will need some place
          ==> every item as same place : 1 third of all place
        * but of values are numeric (like elevation), then we know that there textual representation is small
          ==> give to field's name all the place it needs with is-narrow helper
      -->
      <div class="column query-label" :class="{'is-narrow':!field.i18n, 'is-4':field.i18n}">
        {{ $gettext(field.name) | uppercaseFirstLetter }}
      </div>
      <div class="column query-bound-value-right">
        <span v-if="field.i18n">{{ $gettext(value[1], field.i18nContext) | uppercaseFirstLetter }}</span>
        <span v-else>{{ value[1] }}</span>
        <span v-if="field.unit">&nbsp;{{ field.unit }}</span>
      </div>
    </div >
  </div>

</template>

<script>
  import { requireFieldProperty } from '@/js/properties-mixins';

  export default{

    mixins: [ requireFieldProperty ],

    props: {
      value: {
        type: Array,
        required: true
      }
    }
  };
</script>

<style scoped>

.query-label{
    font-style:italic;
    text-align:center;
}

.query-bound-value-left, .query-bound-value-right{
    font-weight:bold;
}

.query-bound-value-right{
    text-align:right;
}

</style>
