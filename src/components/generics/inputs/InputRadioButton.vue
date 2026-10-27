<template>
  <div :class="['control', 'input-radio-group', { 'input-radio-vertical': displayVertically }]">
    <label class="input-radio-button" v-for="option in options" :key="option.value">
      <input
        type="radio"
        :value="option.value"
        v-model="selected"
        @change="emitSelectedValue"
        :disabled="disabledValues.has(option.value)"
      />
      <div class="option">
        {{ option.text }}
        <p v-if="reasons[option.value]" class="optionDisabled">{{ reasons[option.value] }}</p>
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type PropType } from 'vue';

type Option = { value: string; text: string };
type DisabledOption = { value: string; reason?: string };

const props = defineProps({
  options: {
    type: Array as PropType<Option[]>,
    required: true,
  },
  disabledOptions: {
    type: Array as PropType<DisabledOption[]>,
    default: () => [],
  },
  defaultValue: {
    type: String,
    default: '',
  },
  displayVertically: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const selected = ref(props.modelValue || props.defaultValue);

const reasons = computed(() =>
  Object.fromEntries(props.disabledOptions.map((option) => [option.value, option.reason]))
);
const disabledValues = computed(() => new Set(props.disabledOptions.map((option) => option.value)));

watch(
  () => props.modelValue,
  (newValue) => {
    selected.value = newValue;
  }
);

onMounted(() => {
  if (selected.value) {
    emit('update:modelValue', selected.value);
  }
});

function emitSelectedValue() {
  emit('update:modelValue', selected.value);
}
</script>

<style scoped lang="scss">
.option {
  display: flex;
  flex-direction: column;
  .optionDisabled {
    color: red;
    font-size: 12px;
    font-style: italic;
  }
}
.input-radio-group {
  display: flex;
  gap: 16px;

  .input-radio-button {
    align-items: center;
    display: flex;
    gap: 8px;
  }
}

.input-radio-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
