<template>
  <div class="control">
    <span v-if="prefix !== null"> {{ $filters.uppercaseFirstLetter(prefix) }} : </span>
    <input :id="'c2c-' + uid + '_yes'" type="radio" :value="true" class="is-checkradio is-primary" v-model="value_" />
    <label :for="'c2c-' + uid + '_yes'">{{ $filters.uppercaseFirstLetter(labelYes || $gettext('yes')) }}</label>

    <input :id="'c2c-' + uid + '_no'" type="radio" :value="false" class="is-checkradio is-primary" v-model="value_" />
    <label :for="'c2c-' + uid + '_no'">{{ $filters.uppercaseFirstLetter(labelNo || $gettext('no')) }}</label>

    <input
      v-if="nullable"
      :id="'c2c-' + uid + '_null'"
      type="radio"
      :value="null"
      class="is-checkradio is-primary"
      v-model="value_"
    />
    <label v-if="nullable" :for="'c2c-' + uid + '_null'" class="is-italic">
      {{ $filters.uppercaseFirstLetter($gettext('no info')) }}
    </label>
  </div>
</template>

<script setup lang="ts">
import { baseInputProps, useInputValue } from './input-value';

import { useUid } from '@/js/uid';

const props = defineProps({
  ...baseInputProps,
  modelValue: {
    type: Boolean,
    default: null,
  },
  nullable: {
    type: Boolean,
    default: false,
  },
  prefix: {
    type: String,
    default: null,
  },
  labelYes: {
    type: String,
    default: null,
  },
  labelNo: {
    type: String,
    default: null,
  },
});
const emit = defineEmits(['update:modelValue']);

const { value_ } = useInputValue(props, emit);
const { uid } = useUid();
</script>

<style scoped>
.control {
  /* extension radio has removed padding around inputs */
  padding-top: calc(0.375em - 1px);
  padding-bottom: calc(0.375em - 1px);
}
</style>
