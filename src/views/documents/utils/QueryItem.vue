<template>
  <div v-if="field !== undefined" class="field">
    <div v-if="field.queryMode === 'valuesRangeSlider'" class="control">
      <query-item-slider-label :field="field" :value="value" :label-id="sliderLabelId" />
      <input-slider
        v-model="valueIndexes"
        :max="fieldValues().length - 1"
        :format="formatValueIndex"
        :aria-labelledby="sliderLabelId"
        marks
      />
    </div>

    <div v-else-if="field.queryMode === 'numericalRangeSlider'" class="control">
      <query-item-slider-label :field="field" :value="value" :label-id="sliderLabelId" />
      <input-slider
        v-model="value"
        :min="field.min"
        :max="field.max"
        :step="interval"
        :aria-labelledby="sliderLabelId"
      />
    </div>

    <div v-else-if="field.queryMode === 'multiSelect'" class="control">
      <label class="label">
        {{ $filters.uppercaseFirstLetter($gettext(field.name)) }}
      </label>

      <multiselect
        v-model="value"
        :options="fieldValues()"
        :custom-label="field.i18n ? gettext : undefined"
        :placeholder="$gettext('Select option')"
        :select-label="$gettext('Press enter to select')"
        :multiple="true"
      />
    </div>

    <div v-else-if="field.queryMode === 'orientations'" class="level">
      <input-orientation v-model="value" class="level-item" />
    </div>

    <div v-else-if="field.queryMode === 'input'" class="control">
      <label class="label" v-if="!hideLabel">
        {{ $filters.uppercaseFirstLetter($gettext(field.name)) }}
      </label>
      <input :type="field.type" :value="value" @input="oninput" class="input" :placeholder="$gettext(field.name)" />
    </div>

    <div v-else-if="field.queryMode === 'tristate'" class="control">
      <label class="label">
        {{ $filters.uppercaseFirstLetter($gettext(field.name)) }}
      </label>

      <multiselect
        v-model="value"
        :options="['yes', 'no', 'no info']"
        :custom-label="gettext"
        :placeholder="$gettext('Select option')"
        :select-label="$gettext('Press enter to select')"
      />
    </div>

    <div v-else-if="field.queryMode === 'checkbox'" class="control">
      <input-checkbox v-model="value">
        {{ $gettext(field.name) }}
      </input-checkbox>
    </div>

    <div v-else-if="field.queryMode === 'activities'" class="control">
      <input-activity v-model="value" />
    </div>

    <div v-else-if="field.queryMode === 'date'">
      <date-query-item />
    </div>

    <div v-else-if="field.queryMode === 'dates'">
      <dates-query-item />
    </div>

    <div v-else class="notification is-danger">
      <!-- Should not happen, message for devs -->
      Please fill queryMode for {{ field.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, type Ref } from 'vue';

import DateQueryItem from './DateQueryItem.vue';
import DatesQueryItem from './DatesQueryItem.vue';
import QueryItemSliderLabel from './QueryItemSliderLabel.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { useQueryItem } from '@/js/composables/query-item';
import debounce from '@/js/debounce';
import { fieldProperty } from '@/js/properties';
import { nextUid } from '@/js/uid';

const Multiselect = defineAsyncComponent(() => import('vue-multiselect'));

const props = defineProps({
  ...fieldProperty,
  hideLabel: {
    type: Boolean,
    default: false,
  },
});

const { $gettext } = useGlobalProperties();
// the value of the url, as the inputs take it
const value = useQueryItem(() => props.field).value as Ref<any>;
const uid = nextUid();

// the field name names the slider handles for assistive technologies
const sliderLabelId = `query-slider-label-${uid}`;

const fieldValues = () => props.field.values as string[];

// a range of field.values (ratings...): the slider works on their indexes
const valueIndexes = computed({
  get() {
    return (value.value as string[]).map((v) => fieldValues().indexOf(v));
  },
  set(indexes: number[]) {
    value.value = indexes.map((index) => fieldValues()[index]);
  },
});

const interval = computed(() => {
  const scope = props.field.max! - props.field.min!;

  if (scope < 300) {
    return 1;
  } else if (scope < 1000) {
    return 5;
  } else if (scope < 3000) {
    return 10;
  } else {
    return 25;
  }
});

function formatValueIndex(index: number) {
  const fieldValue = fieldValues()[Math.round(index)];
  return props.field.i18n ? gettext(fieldValue) : fieldValue;
}

function gettext(key: string) {
  return $gettext(key, props.field.i18nContext);
}

// for simple input, add a small delay (avoir spamming API, and url history)
const oninput = debounce((event: Event) => {
  value.value = (event.target as HTMLInputElement).value;
}, 300);
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style scoped>
/*
If a multi select is below a slider, multi select  popup is bellow slider elements.
set z-index to 6 (5 is the highest slider z-index value) to fix this
*/
.multiselect--active {
  z-index: 6;
}
</style>
