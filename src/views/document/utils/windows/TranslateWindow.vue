<template>
  <modal-window ref="modalWindow">
    <template #header>
      <div class="has-text-centered">
        <span v-translate>Create the first version in the following lang</span>
      </div>
    </template>
    <div v-for="lang in missingLangs" :key="lang" class="has-text-centered">
      <edit-link class="is-size-4" :document="document" :lang="lang">
        {{ $filters.uppercaseFirstLetter($gettext(lang, 'langs')) }}
      </edit-link>
    </div>
  </modal-window>
</template>

<script setup lang="ts">
import { type PropType, useTemplateRef } from 'vue';

import { documentProperty } from '@/js/properties';

defineProps({
  ...documentProperty,
  missingLangs: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const modalWindowRef = useTemplateRef<{ show(): void }>('modalWindow');

function show() {
  modalWindowRef.value!.show();
}

// shown by ToolBox through its template ref
defineExpose({ show });
</script>
