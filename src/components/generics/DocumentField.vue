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
      >{{ shown.value }}</span
    ><template v-if="showUnit"
      ><template v-if="!field.skipSpaceBeforeUnit">&nbsp;</template>{{ shown.unit }}</template
    ></span
  >
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { formatLength, formatNumber } from '@/js/length-format';
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

const { $language } = useGlobalProperties();

// the value and unit shown: a length in metres shown in km gets the unit that suits its size (560 m, 4.5 km, 12 km)
const shown = computed(() => {
  const unit = props.unit || props.field.unit;

  if (props.divisor === 1000 && unit === 'km' && typeof value.value === 'number') {
    return formatLength(value.value, $language?.current);
  }

  // an elevation, a height difference...: 4 808 m (fr), 4,808 m (en), 4.808 m (de)
  if (unit === 'm' && typeof value.value === 'number') {
    return { value: formatNumber(value.value, $language?.current), unit };
  }

  return { value: props.divisor ? Math.round(value.value / props.divisor) : value.value, unit };
});

const isArray = computed(() => Array.isArray(value.value));

const showUnit = computed(() => (props.unit || props.field.unit) && value.value !== null && value.value !== undefined);

const showPrefix = computed(
  () => (props.prefix || props.field.prefix) && value.value !== null && value.value !== undefined
);
</script>
