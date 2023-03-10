<template>
  <!-- This a generic component that display field value of a document for any kind of field  -->
  <span>
    <activities v-if="field.name == 'activities'" :activities="document.activities" class="has-text-secondary" />

    <template v-else-if="field.name == 'image_type'">
      <a
        v-if="value === 'personal'"
        :href="'https://creativecommons.org/licenses/by-nc-nd/3.0/deed.' + $language.current"
        >{{ $gettext(value, field.i18nContext) }}</a
      >
      <a
        v-else-if="value === 'collaborative'"
        :href="'https://creativecommons.org/licenses/by-sa/3.0/deed.' + $language.current"
        >{{ $gettext(value, field.i18nContext) }}</a
      >
      <span v-else-if="value === 'copyright'">{{ $gettext(value, field.i18nContext) }}</span>
    </template>

    <a v-else-if="field.type === 'url'" :href="value">{{ value }}</a>

    <span v-else-if="field.type === 'date_time'">{{ $dateUtils.toLocalizedString(value, 'lll') }}</span>

    <best-periods v-else-if="field.name === 'best_periods'" :months="value" />

    <textual-array
      v-else-if="isArray"
      :array="value"
      :i18n="field.i18n"
      :i18n-context="field.i18nContext"
      :sort-values="sortValues"
    />

    <span v-else-if="typeof value === 'boolean'">
      <span v-if="value" v-translate>yes</span>
      <span v-else v-translate>no</span>
    </span>

    <span v-else-if="field.i18n">{{ $gettext(value, field.i18nContext) }} </span>

    <span v-else>
      <span v-if="showPrefix">{{ prefix || field.prefix }}</span>
      {{ divisor ? Math.round(value / divisor) : value }}
    </span>

    <span v-if="showUnit && !field.skipSpaceBeforeUnit">&nbsp;</span>
    <span v-if="showUnit">{{ unit || field.unit }}</span>
  </span>
</template>

<script>
import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty, requireFieldProperty],

  props: {
    unit: {
      type: String,
      default: null,
    },
    divisor: {
      type: Number,
      default: null,
    },
    sortValues: {
      type: Boolean,
      default: false,
    },
    prefix: {
      type: String,
      default: null,
    },
  },

  computed: {
    value() {
      return this.document[this.field.name];
    },

    isArray() {
      return Array.isArray(this.value);
    },

    showUnit() {
      return (this.unit || this.field.unit) && this.value !== null && this.value !== undefined;
    },

    showPrefix() {
      return (this.prefix || this.field.prefix) && this.value !== null && this.value !== undefined;
    },

    license() {
      switch (this.value) {
        case 'personal':
          return 'by-nc-nd';
        case 'copyright':
          return;
        case 'colaborative':
        default:
          return 'by-sa';
      }
    },
  },
};
</script>
