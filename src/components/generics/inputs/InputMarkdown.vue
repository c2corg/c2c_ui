<template>
  <div class="control">
    <markdown-editor v-model="value_" :placeholder="placeholder" />
  </div>
</template>

<script>
import { baseInputProps, useInputValue } from './input-value';

import MarkdownEditor from '@/components/markdown-editor/MarkdownEditor';

export default {
  components: {
    MarkdownEditor,
  },

  props: {
    ...baseInputProps,
    modelValue: {
      type: String,
      default: null,
    },
  },

  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return useInputValue(props, emit);
  },
};
</script>
