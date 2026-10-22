<template>
  <div class="control">
    <markdown-editor v-model="value_" :placeholder="placeholder" />
  </div>
</template>

<script>
import { baseMixin } from './mixins';

import MarkdownEditor from '@/components/markdown-editor/MarkdownEditor';

export default {
  compatConfig: { COMPONENT_V_MODEL: false },

  components: {
    MarkdownEditor,
  },

  mixins: [baseMixin],

  props: {
    modelValue: {
      type: String,
      default: null,
    },
  },
};
</script>
