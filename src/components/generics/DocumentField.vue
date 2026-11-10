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

    <span v-else-if="field.i18n">{{ $gettext(value, field.i18nContext) }}</span>

    <!-- no line break between prefix, value and unit: the templates keep whitespace, it would render as a space -->
    <span v-else
      ><span v-if="showPrefix">{{ prefix || field.prefix }}</span
      >{{ divisor ? Math.round(value / divisor) : value }}</span
    ><template v-if="showUnit"
      ><template v-if="!field.skipSpaceBeforeUnit">&nbsp;</template>{{ unit || field.unit }}</template
    ></span
  >
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { documentProperty, fieldProperty } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  ...fieldProperty,
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
});

// the value of the field, of any type (string, number, list...)

const value = computed<any>(() => props.document[props.field.name]);

const isArray = computed(() => Array.isArray(value.value));

const showUnit = computed(() => (props.unit || props.field.unit) && value.value !== null && value.value !== undefined);

const showPrefix = computed(
  () => (props.prefix || props.field.prefix) && value.value !== null && value.value !== undefined
);
</script>
