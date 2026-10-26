<template>
  <div>
    <div class="columns is-mobile">
      <!--level must be in a single element to remove bottim margin : TODO remove ugly hack -->
      <div class="column query-bound-value-left is-nowrap">
        <span v-if="field.i18n">{{ $filters.uppercaseFirstLetter($gettext(value[0], field.i18nContext)) }}</span>
        <span v-else>{{ value[0] }}</span>
        <span v-if="field.unit">&nbsp;{{ field.unit }}</span>
      </div>
      <!-- class depends on i18n ???
        * if values are text (like awful, good... for conditions), we can't know which one will need some place
          ==> every item as same place : 1 third of all place
        * but of values are numeric (like elevation), then we know that there textual representation is small
          ==> give to field's name all the place it needs with is-narrow helper
      -->
      <div :id="labelId" class="column query-label" :class="{ 'is-narrow': !field.i18n, 'is-4': field.i18n }">
        {{ $filters.uppercaseFirstLetter($gettext(field.name)) }}
      </div>
      <div class="column query-bound-value-right is-nowrap">
        <span v-if="field.i18n">{{ $filters.uppercaseFirstLetter($gettext(value[1], field.i18nContext)) }}</span>
        <span v-else>{{ value[1] }}</span>
        <span v-if="field.unit">&nbsp;{{ field.unit }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { fieldProperty } from '@/js/properties';

export default {
  props: {
    ...fieldProperty,
    value: {
      type: Array,
      required: true,
    },
    // id of the field name, which names the slider
    labelId: {
      type: String,
      default: undefined,
    },
  },
};
</script>

<style scoped>
.query-label {
  font-style: italic;
  text-align: center;
}

.query-bound-value-left,
.query-bound-value-right {
  font-weight: bold;
}

.query-bound-value-right {
  text-align: right;
}
</style>
