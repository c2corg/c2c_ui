<template>
  <div class="columns is-mobile is-variable is-0">
    <div class="column date-container">
      <input-date v-model="date" />
    </div>
    <div class="column is-narrow hour-container">
      <div class="select">
        <select v-model="hour">
          <option v-for="i of hours" :key="i">{{ i }}</option>
        </select>
      </div>
    </div>
    <div class="column is-narrow minute-container">
      <div class="select">
        <select v-model="minute">
          <option v-for="i of minutes" :key="i">{{ i }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { baseInputProps } from './input-value';

import { useGlobalProperties } from '@/js/composables/global-properties';

const range = (from: number, to: number) => [...Array(to - from + 1).keys()].map((i) => i + from);

const props = defineProps({
  ...baseInputProps,
  modelValue: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const { $dateUtils } = useGlobalProperties();

const minutes = range(0, 59);
const hours = range(0, 23);

const value_ = computed(() => $dateUtils.parseDate(props.modelValue));

function onInput(valueAsObject: Date) {
  emit('update:modelValue', $dateUtils.toLocalizedString(valueAsObject, `YYYY-MM-DD[T]HH:mm:ssZ`));
}

const date = computed({
  get: () => (props.modelValue ? $dateUtils.toLocalizedString(value_.value, 'YYYY-MM-DD') : null),
  set(value: string | null) {
    const d = value_.value;
    const parsed = $dateUtils.parseDate(value);

    d.setFullYear(parsed.getFullYear());
    d.setMonth(parsed.getMonth());
    d.setDate(parsed.getDate());

    onInput(d);
  },
});

const hour = computed({
  get: () => (props.modelValue ? value_.value.getHours() : null),
  set(value: number) {
    const d = value_.value;
    d.setHours(value);
    onInput(d);
  },
});

const minute = computed({
  get: () => (props.modelValue ? value_.value.getMinutes() : null),
  set(value: number) {
    const d = value_.value;
    d.setMinutes(value);
    onInput(d);
  },
});
</script>

<style scoped lang="scss">
.date-container {
  padding-right: 0.5rem !important;
}

.hour-container {
  .select select {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
}
.minute-container {
  .select select {
    border-left: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}
</style>
