<template>
  <input-activity
    v-if="field.name == 'activities'"
    v-show="visible"
    :has-error="hasError"
    show-labels
    :document-type="document.type"
    v-model="document.activities"
  />

  <input-event-activity
    v-else-if="field.name == 'event_activity'"
    v-show="visible"
    :has-error="hasError"
    show-labels
    v-model="document.event_activity"
  />

  <input-orientation v-else-if="field.name == 'orientations'" v-show="visible" v-model="document.orientations" />

  <div v-else-if="field.name == 'main_waypoint_id'" class="control select" :class="{ 'is-danger': hasError }">
    <select v-model="document.main_waypoint_id">
      <option :value="null" />
      <option
        v-for="waypoint of document.associations!.waypoints"
        :key="waypoint.document_id"
        :value="waypoint.document_id"
      >
        {{ $documentUtils.getDocumentTitle(waypoint) }}
      </option>
    </select>
  </div>

  <input-conditions-levels v-else-if="field.name == 'conditions_levels'" v-model="object[field.name]" />

  <input-markdown
    v-else-if="field.type == 'markdown'"
    v-show="visible"
    :placeholder="placeholder"
    v-model="object[field.name]"
  />

  <input-document
    v-else-if="field.parent == 'associations'"
    :document-type="field.documentType"
    multiple
    clear-input-on-toggle
    :has-error="hasError"
    @add="$documentUtils.propagateProperties(document, $event)"
    v-model="object[field.name]"
  />

  <input-multi-select
    v-else-if="field.values && field.multiple"
    v-show="visible"
    :options="field.values"
    :required="field.required"
    :i18n="field.i18n"
    :i18n-context="field.i18nContext"
    :has-error="hasError"
    v-model="object[field.name]"
  />

  <input-date
    v-else-if="field.type === 'date'"
    :has-error="hasError"
    :min="dateMin"
    :max="dateMax"
    :required="field.required"
    v-model="object[field.name]"
  />

  <input-simple
    v-else-if="simpleInputType"
    v-show="visible"
    :prefix="prefix"
    @click-prefix="$emit('click-prefix')"
    :is-expanded="isExpanded"
    :postfix="unit || field.unit"
    :divisor="divisor"
    :type="field.type"
    :min="min || field.min"
    :max="max || field.max"
    :disabled="field.disabled"
    :placeholder="placeholder || $gettext(field.name)"
    :required="field.required"
    :i18n="field.i18n"
    :i18n-context="field.i18nContext"
    :options="field.values"
    :has-error="hasError"
    @update:model-value="$emit('input', $event)"
    v-model="object[field.name]"
  />

  <input-yes-no
    v-else-if="field.type == 'boolean'"
    v-show="visible"
    v-model="object[field.name]"
    :nullable="field.nullable"
  />

  <input-datetime v-else-if="field.type == 'date_time'" v-show="visible" v-model="object[field.name]" />

  <div v-else class="notification is-danger">
    <!-- Should not happen, message to devs -->
    Unknown field type : {{ field.type }}
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed } from 'vue';

import InputConditionsLevels from './InputConditionsLevels.vue';

import { documentProperty, fieldProperty } from '@/js/properties';

const props = defineProps({
  ...fieldProperty,
  ...documentProperty,
  prefix: {
    type: String,
    default: null,
  },
  isExpanded: {
    type: Boolean,
    default: null,
  },
  placeholder: {
    type: String,
    default: undefined,
  },
  min: {
    type: String,
    default: undefined,
  },
  max: {
    type: String,
    default: undefined,
  },
  unit: {
    type: String,
    default: undefined,
  },
  divisor: {
    type: Number,
    default: undefined,
  },
});

defineEmits(['click-prefix', 'input']);

// earliest and latest selectable dates of a date field, inclusive
const dateMin = computed(() => {
  const min = props.min || props.field.min;
  return min ? dayjs(min).format('YYYY-MM-DD') : undefined;
});

const dateMax = computed(() => {
  const max = props.max || props.field.max;
  return max ? dayjs(max).format('YYYY-MM-DD') : undefined;
});

// in edit mode, there is only one locale
const editedLocale = computed(() => props.document.locales![0]);

const object = computed(() => {
  if (props.field.parent === 'document') {
    return props.document;
  }

  if (props.field.parent === 'locales') {
    return editedLocale.value;
  }

  if (props.field.parent === 'associations') {
    return props.document.associations!;
  }

  throw new Error(`Unexpected parent value : ${props.field.parent}`);
});

const visible = computed(() => props.field.isVisibleFor(props.document));
const simpleInputType = computed(() => ['text', 'number', 'url', 'tel'].includes(props.field.type));
const hasError = computed(() => props.field.error !== null);
</script>
