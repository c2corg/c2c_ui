<template>
  <div class="control">
    <markdown-editor :model-value="value_ as string" @update:model-value="value_ = $event" :placeholder="placeholder" />
  </div>
</template>

<script setup lang="ts">
import { baseInputProps, useInputValue } from './input-value';

import MarkdownEditor from '@/components/markdown-editor/MarkdownEditor.vue';

const props = defineProps({
  ...baseInputProps,
  modelValue: {
    type: String,
    default: null,
  },
});
const emit = defineEmits(['update:modelValue']);

const { value_ } = useInputValue(props, emit);
</script>
