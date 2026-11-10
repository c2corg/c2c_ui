<template>
  <div :class="noWrapper ? '' : 'column'" v-show="visible">
    <div class="field">
      <label class="label">
        <marker-helper :name="helper || field.helper" />
        {{ $filters.uppercaseFirstLetter(label || fieldLabel) }}
        <span v-if="hasError" class="has-text-danger">
          <!-- $gettext('required field') -->
          <!-- $gettext('This field is too short') -->
          <!-- $gettext('This field is too long') -->
          {{ $filters.uppercaseFirstLetter(errorMessage) }}
        </span>
      </label>
      <form-input
        :document="document"
        :field="field"
        :helper="null"
        :placeholder="placeholder"
        :unit="unit"
        :max="max"
        :min="min"
        :divisor="divisor"
        :is-expanded="isExpanded"
        :prefix="prefix"
        @click-prefix="$emit('click-prefix')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';

import FormInput from './FormInput.vue';

import { useFormField } from '@/js/composables/form-registration';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty, fieldProperty } from '@/js/properties';

const props = defineProps({
  ...fieldProperty,
  ...documentProperty,
  isExpanded: {
    type: Boolean,
    default: false,
  },
  helper: {
    type: String,
    default: undefined,
  },
  label: {
    type: String,
    default: undefined,
  },
  context: {
    type: String,
    default: null,
  },
  placeholder: {
    type: String,
    default: ' ', // hack to force explicit placeholder
  },
  unit: {
    type: String,
    default: undefined,
  },
  divisor: {
    type: Number,
    default: undefined,
  },
  noWrapper: {
    type: Boolean,
    default: false,
  },
  max: {
    type: String,
    default: undefined,
  },
  min: {
    type: String,
    default: undefined,
  },
  // a button before the input (the cotometer of the ski rating), emits click-prefix
  prefix: {
    type: String,
    default: null,
  },
});

defineEmits(['click-prefix']);

const { $gettext } = useGlobalProperties();

// as its input
const visible = computed(() => props.field.isVisibleFor(props.document));
const hasError = computed(() => props.field.error !== null);
const errorMessage = computed(() =>
  hasError.value ? $gettext((props.field.error as { description: string }).description) : ''
);
const fieldLabel = computed(() => $gettext(props.field.name, props.context ?? undefined));

// registered with the FormSection containing it
useFormField('formSection', reactive({ visible, hasError }));
</script>
